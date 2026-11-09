export type VariantCopyField =
  | "description_ar"
  | "description_en"
  | "ingredients_ar"
  | "ingredients_en";

export type VariantCopy = Partial<Record<VariantCopyField, string | null>>;

type CopyKind = "description" | "ingredients";
type ProductCopy = VariantCopy & Partial<Record<CopyKind, string | null>>;

export function normalizeVariantCopy(copy: VariantCopy): Record<VariantCopyField, string | null> {
  return {
    description_ar: copy.description_ar?.trim() || null,
    description_en: copy.description_en?.trim() || null,
    ingredients_ar: copy.ingredients_ar?.trim() || null,
    ingredients_en: copy.ingredients_en?.trim() || null,
  };
}

/** Inherit each empty override independently, keeping the usual product language fallback. */
export function resolveProductCopy(
  product: ProductCopy,
  variant: VariantCopy | null,
  kind: CopyKind,
  language: "ar" | "en"
): string {
  const local = `${kind}_${language}` as const;
  const other = `${kind}_${language === "ar" ? "en" : "ar"}` as const;
  return variant?.[local]?.trim() ||
    product[local]?.trim() ||
    product[kind]?.trim() ||
    product[other]?.trim() ||
    "";
}
