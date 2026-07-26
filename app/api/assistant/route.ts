import { NextResponse } from "next/server";

import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getRequestIp, takeRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Language = "ar" | "en";
type Product = Record<string, unknown>;
type Message = { role: "user" | "assistant"; content: string };

function clean(value: unknown, limit: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function localized(
  product: Product,
  field: string,
  language: Language,
  limit = 700
) {
  const values =
    language === "ar"
      ? [product[`${field}_ar`], product[field], product[`${field}_en`]]
      : [product[`${field}_en`], product[field], product[`${field}_ar`]];

  return clean(
    values.find((value) => typeof value === "string"),
    limit
  );
}

function unavailable(product: Product) {
  return product.is_out_of_stock === true;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(value: string, values: string[]) {
  return values.some((entry) => value.includes(entry));
}

function asksForCatalogue(query: string) {
  const q = normalize(query);

  return includesAny(q, [
    "what products",
    "what do you sell",
    "whole website",
    "entire website",
    "all products",
    "full catalogue",
    "full catalog",
    "كل الموقع",
    "كامل الموقع",
    "كل المنتجات",
    "جميع المنتجات",
    "شو عندكم",
    "شو بتبيعو",
  ]);
}

function isOrderAction(query: string) {
  return includesAny(query, [
    "add to cart",
    "add it",
    "add this",
    "checkout",
    "place order",
    "complete my order",
    "اضف للسله",
    "اضيف للسله",
    "حط بالسله",
    "اكمل طلبي",
    "اطلب",
    "تشيك اوت",
  ]);
}

function isAppQuestion(query: string) {
  return includesAny(query, [
    "app",
    "application",
    "play store",
    "app store",
    "android",
    "iphone",
    "ios",
    "تطبيق",
    "اندرويد",
    "ايفون",
  ]);
}

function isClearlyUnrelated(query: string) {
  return includesAny(query, [
    "youtube",
    "song",
    "music",
    "weather",
    "football",
    "movie",
    "restaurant",
    "code",
    "programming",
    "اغنيه",
    "يوتيوب",
    "طقس",
    "مباراة",
    "فيلم",
    "مطعم",
    "برمجه",
  ]);
}

function aliases(query: string) {
  const q = normalize(query);

  const ignoredWords = new Set([
    "what",
    "which",
    "the",
    "for",
    "with",
    "and",
    "are",
    "is",
    "product",
    "products",
    "recommend",
    "recommendation",
    "do",
    "have",
    "can",
    "use",
    "ما",
    "ماهو",
    "ماهي",
    "شو",
    "المنتج",
    "منتج",
    "المنتجات",
    "منتجات",
    "المناسب",
    "افضل",
    "لعلاج",
    "للبشره",
    "لشعر",
    "عندي",
    "اريد",
  ]);

  const extra: string[] = [];

  if (/acne|pimple|breakout|حبوب|حب|بثور/.test(q)) {
    extra.push("acne", "حبوب", "salicylic");
  }

  if (/hair|شعر|sha3r|shaar/.test(q)) {
    extra.push("hair", "شعر", "shampoo", "scalp");
  }

  if (/dandruff|قشر|قشرة/.test(q)) {
    extra.push("dandruff", "قشرة", "cortex");
  }

  if (/dry|جاف|جفاف/.test(q)) {
    extra.push("dry", "جفاف", "urea", "hydration");
  }

  if (/dark|pigment|تصبغ|تفتيح|هالات/.test(q)) {
    extra.push("brightening", "pigment", "تفتيح");
  }

  if (/sun|sunscreen|شمس|واقي/.test(q)) {
    extra.push("sunscreen", "sun", "واقي");
  }

  return [
    ...new Set([
      ...q
        .split(" ")
        .filter(
          (word) =>
            word.length > 2 &&
            !ignoredWords.has(word)
        ),
      ...extra,
    ]),
  ];
}

function searchProducts(products: Product[], query: string) {
  const terms = aliases(query);

  if (!terms.length) {
    return asksForCatalogue(query)
      ? products.slice(0, 30)
      : [];
  }

  const ranked = products
    .map((product) => {
      const category = product.categories as Product | null;

      const concerns = Array.isArray(product.ai_concerns)
        ? (product.ai_concerns as Product[])
        : [];

      const text = normalize(
        [
          product.name,
          product.name_ar,
          product.name_en,
          product.description,
          product.description_ar,
          product.description_en,
          product.ingredients,
          product.ingredients_ar,
          product.ingredients_en,
          category?.name,
          category?.name_ar,
          category?.name_en,

          ...concerns.flatMap((concern) => [
            concern.name_ar,
            concern.name_en,
            concern.description_ar,
            concern.description_en,
          ]),
        ]
          .filter(Boolean)
          .join(" ")
      );

      const score = terms.reduce(
        (total, term) => total + (text.includes(term) ? 1 : 0),
        0
      );

      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.product);

  return ranked.length > 0
    ? ranked
    : asksForCatalogue(query)
      ? products.slice(0, 30)
      : [];
}

function catalogItem(product: Product, language: Language) {
  const variants = Array.isArray(product.product_variants)
    ? product.product_variants.map((entry) => {
        const variant = entry as Product;

        const label =
          language === "ar"
            ? [
                variant.label_ar,
                variant.name_ar,
                variant.label,
                variant.name,
                variant.label_en,
                variant.name_en,
              ]
            : [
                variant.label_en,
                variant.name_en,
                variant.label,
                variant.name,
                variant.label_ar,
                variant.name_ar,
              ];

        return {
          name: clean(
            label.find((value) => typeof value === "string"),
            100
          ),
          price: Number(variant.price || 0),
          available: !unavailable(variant),
        };
      })
    : [];

  return {
    id: Number(product.id),
    name: localized(product, "name", language, 140),
    price: Number(product.price || 0),
    available: !unavailable(product),
    description: localized(
      product,
      "description",
      language,
      800
    ),
    ingredients: localized(
      product,
      "ingredients",
      language,
      600
    ),
    how_to_use: localized(
      product,
      "how_to_use",
      language,
      450
    ),
    warnings: localized(
      product,
      "warnings",
      language,
      450
    ),
    concerns: Array.isArray(product.ai_concerns)
      ? (product.ai_concerns as Product[]).map((concern) => ({
          name: localized(concern, "name", language, 120),
          description: localized(
            concern,
            "description",
            language,
            280
          ),
        }))
      : [],
    variants,
  };
}

function outputText(data: {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}) {
  if (
    typeof data.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter(
      (item) =>
        item.type === "output_text" ||
        item.type === "text"
    )
    .map((item) => item.text || "")
    .join("\n")
    .trim();
}

function parseAssistantAnswer(
  rawAnswer: string,
  products: Array<{ id: number }>
) {
  const markerPattern =
    /\s*KAB_PRODUCTS\s*:\s*([0-9][0-9,\s]*)\.?/i;

  const marker = rawAnswer.match(markerPattern);

  const answer = rawAnswer
    .replace(markerPattern, "")
    .trim();

  const allowedIds = new Set(products.map((product) => product.id));
  const ids = (marker?.[1].match(/\d+/g) || [])
    .map(Number)
    .filter(
      (id, index, values) =>
        allowedIds.has(id) && values.indexOf(id) === index
    )
    .slice(0, 2);

  return {
    answer,
    products: products.filter((product) => ids.includes(product.id)),
  };
}

function shortAnswer(
  language: Language,
  kind: "action" | "app" | "unrelated"
) {
  const ar = language === "ar";

  if (kind === "action") {
    return ar
      ? "لا أستطيع تعديل السلة أو إنشاء طلب من داخل الدردشة. استخدمي زر «عرض المنتج» أدناه، ثم زر «أضف إلى السلة» الحقيقي في صفحة المنتج. إتمام الطلب يتم فقط من صفحة السلة والـ checkout."
      : "I can’t change your cart or create an order from chat. Open the real product page below and use its Add to Cart button; checkout happens only through the cart and checkout pages.";
  }

  if (kind === "app") {
    return ar
      ? "KAB Pharma لديها موقع إلكتروني فقط، ولا يوجد تطبيق Android أو iPhone حالياً. يمكنكِ التسوق مباشرة من هذا الموقع."
      : "KAB Pharma is a website only; there is currently no Android or iPhone app. You can shop directly on this website.";
  }

  return ar
    ? "أنا مساعد KAB Pharma للموقع فقط. أستطيع المساعدة بمنتجات KAB، العناية بالبشرة والشعر، المكونات، طريقة الاستخدام، الأسعار والتوفر على الموقع."
    : "I’m the KAB Pharma website assistant. I can help with KAB products, skincare and haircare, ingredients, use, prices, and website availability.";
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return jsonError(
      "KAB Assistant is not configured.",
      503
    );
  }

  const rate = takeRateLimit({
    key: `kab-ai:${getRequestIp(request)}`,
    limit: 60,
    windowMs: 60 * 60,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Please wait a moment before sending more messages.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            rate.retryAfterSeconds
          ),
        },
      }
    );
  }

  let body: {
    message?: unknown;
    language?: unknown;
    history?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid message", 400);
  }

  const message = clean(body.message, 900);

  if (!message) {
    return jsonError("Please enter a message.", 400);
  }

  const language: Language =
    body.language === "en" ? "en" : "ar";

  const history: Message[] = Array.isArray(body.history)
    ? body.history
        .slice(-6)
        .flatMap((item) => {
          const entry = item as Partial<Message>;

          if (
            (entry.role !== "user" &&
              entry.role !== "assistant") ||
            typeof entry.content !== "string"
          ) {
            return [];
          }

          const content = clean(entry.content, 600);

          return content
            ? [
                {
                  role: entry.role,
                  content,
                },
              ]
            : [];
        })
    : [];

  const [
    productsResult,
    concernsResult,
    concernLinksResult,
    productCountResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("*, categories (*), product_variants (*)")
      .order("id", { ascending: false })
      .limit(500),

    supabaseAdmin
      .from("concerns")
      .select(
        "id, name_ar, name_en, description_ar, description_en"
      ),

    supabaseAdmin
      .from("product_concerns")
      .select("product_id, concern_id"),

    supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true }),
  ]);

  const { data, error } = productsResult;

  if (error) {
    console.error(
      "KAB AI product search failed:",
      error
    );

    return jsonError(
      "Unable to search KAB products right now.",
      503
    );
  }

  if (concernsResult.error || concernLinksResult.error) {
    console.error(
      "KAB AI concern search failed:",
      concernsResult.error || concernLinksResult.error
    );
  }

  const concernById = new Map(
    ((concernsResult.data || []) as Product[]).map(
      (concern) => [Number(concern.id), concern]
    )
  );

  const concernsByProductId = new Map<number, Product[]>();

  for (const link of (concernLinksResult.data || []) as Product[]) {
    const productId = Number(link.product_id);
    const concernId = Number(link.concern_id);
    const concern = concernById.get(concernId);

    if (!Number.isFinite(productId) || !concern) {
      continue;
    }

    const existing =
      concernsByProductId.get(productId) || [];

    existing.push(concern);

    concernsByProductId.set(productId, existing);
  }

  const enrichedProducts = ((data || []) as Product[]).map(
    (product) => ({
      ...product,
      ai_concerns:
        concernsByProductId.get(Number(product.id)) || [],
    })
  );

  const products = searchProducts(
    enrichedProducts,
    message
  ).map((product) => catalogItem(product, language));

  const catalogueSummary = {
    total_products:
      productCountResult.count ?? enrichedProducts.length,
    categories: Array.from(
      new Set(
        enrichedProducts
          .map((product) => {
            const category = product.categories as Product | null;
            return localized(
              category || {},
              "name",
              language,
              80
            );
          })
          .filter(Boolean)
      )
    ),
    shop_by_need: ((concernsResult.data || []) as Product[])
      .map((concern) => localized(concern, "name", language, 80))
      .filter(Boolean),
  };

  const query = normalize(message);

  if (isOrderAction(query)) {
    return NextResponse.json({
      success: true,
      answer: shortAnswer(language, "action"),
      products,
      needsHuman: false,
    });
  }

  if (isAppQuestion(query)) {
    return NextResponse.json({
      success: true,
      answer: shortAnswer(language, "app"),
      products: [],
      needsHuman: false,
    });
  }

  if (isClearlyUnrelated(query)) {
    return NextResponse.json({
      success: true,
      answer: shortAnswer(language, "unrelated"),
      products: [],
      needsHuman: false,
    });
  }

  const transcript = history.length
    ? history
        .map(
          (entry) =>
            `${
              entry.role === "user"
                ? "Customer"
                : "Assistant"
            }: ${entry.content}`
        )
        .join("\n")
    : "No previous messages.";

  const instructions = `You are the official read-only KAB Pharma WEBSITE assistant.

The customer is already on the KAB Pharma website. Always assume product questions refer to KAB Pharma.

SCOPE:
Answer questions about KAB products, ingredients, price, availability, warnings, how to use, skincare, haircare, body care, Shop by Need collections, and using this website.

LANGUAGE:
Reply in Arabic script when the customer writes Arabic or Arabizi. Reply in English when they clearly write English.

ABSOLUTE RULES:
- Use only the verified KAB product and Shop by Need data below.
- Never invent products, prices, availability, ingredients, discounts, policies, delivery timing, addresses, phone numbers, payment methods, or medical claims.
- Never claim that you added an item to cart, created or confirmed an order, processed a payment, checked checkout, contacted a person, or changed website data.
- Never ask for or repeat a customer's name, phone number, address, payment details, COD details, or other private information in chat.
- KAB Pharma has a WEBSITE ONLY. Never mention an Android/iPhone app, Google Play, or Apple App Store.
- All KAB prices are Syrian Pounds. Write SYP or ليرة سورية only. Never write SAR or ر.س.
- For another brand or store such as Sephora, do not claim what it sells or make unverified comparisons. Say you cannot verify its current catalogue, then focus only on relevant verified KAB products.
- If the verified data does not answer a question, say you cannot verify it from the website.
- Do not claim availability unless the supplied available field is true.
- Keep the answer short and direct. Recommend a maximum of 3 relevant products.
- For pregnancy, breastfeeding, allergies, severe irritation, children, medications, or medical conditions: do not diagnose or promise a result. Say suitability should be checked with a qualified professional.
- When the customer asks about the whole website, number of products, or all products, use FULL WEBSITE CATALOGUE SUMMARY. Do not claim there is only one product when the summary contains more than one.

VERIFIED PRODUCT SEARCH RESULTS:
${JSON.stringify(products)}

FULL WEBSITE CATALOGUE SUMMARY:
${JSON.stringify(catalogueSummary)}`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          reasoning: { effort: "minimal" },
          max_output_tokens: 1200,
          instructions,
          input: `Previous conversation:
${transcript}

Customer question:
${message}`,
        }),
      }
    );

    const providerData = (await response.json()) as {
      error?: {
        message?: string;
      };
      output_text?: unknown;
      output?: Array<{
        content?: Array<{
          type?: string;
          text?: string;
        }>;
      }>;
    };

    if (!response.ok) {
      console.error(
        "KAB AI provider error:",
        providerData.error?.message || response.status
      );

      return jsonError(
        "KAB Assistant is temporarily unavailable.",
        503
      );
    }

    const answer = outputText(providerData);

    if (!answer) {
      console.error(
        "KAB AI returned no text:",
        JSON.stringify(providerData)
      );

      return jsonError(
        "KAB Assistant could not prepare an answer.",
        503
      );
    }

    const needsHuman =
      /human|agent|whatsapp|customer service|موظف|شخص|فريق|واتساب|خدمة العملاء/i.test(
        message
      );

    return NextResponse.json({
      success: true,
      answer,
      products: products.slice(0, 2),
      needsHuman,
    });
  } catch (exception) {
    console.error(
      "KAB AI request failed:",
      exception
    );

    return jsonError(
      "KAB Assistant is temporarily unavailable.",
      503
    );
  }
}
