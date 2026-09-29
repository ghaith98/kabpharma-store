/* eslint-disable @next/next/no-img-element -- Admin crop previews use blob/object URLs and must reflect raw source pixels. */
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type BannerPlacement =
  | "best_sellers"
  | "best_sellers_discover_1"
  | "best_sellers_discover_2"
  | "new_arrivals"
  | "new_arrivals_discover_1";

type BannerMode =
  | "desktop"
  | "mobile";

type BannerRecord = {
  id: number;
  placement: BannerPlacement;

  image_url?: string | null;
  image_url_mobile?: string | null;

  title?: string | null;
  title_ar?: string | null;
  title_en?: string | null;

  text?: string | null;
  text_ar?: string | null;
  text_en?: string | null;

  button_text?: string | null;
  button_text_ar?: string | null;

  link_url?: string | null;

  is_active?: boolean | null;
};

type BannerDraft = {
  titleAr: string;
  titleEn: string;

  textAr: string;
  textEn: string;

  buttonTextAr: string;
  buttonTextEn: string;

  linkUrl: string;
  isActive: boolean;
};

type BannerFiles = {
  desktop: File | null;
  mobile: File | null;
};

type BannerConfig = {
  placement: BannerPlacement;
  adminTitle: string;
  adminDescription: string;

  desktopWidth: number;
  desktopHeight: number;

  mobileWidth: number;
  mobileHeight: number;

  sortOrder: number;
  type:
    | "hero"
    | "discover";

  defaults: BannerDraft;
};

type UploadedImage = {
  publicUrl: string;
  filePath: string;
};

type Notice = {
  type:
    | "success"
    | "error";
  message: string;
};

const STORAGE_BUCKET =
  "home-banners";

const MAX_IMAGE_SIZE =
  10 * 1024 * 1024;

const BANNER_CONFIGS: BannerConfig[] = [
  {
    placement:
      "best_sellers",

    adminTitle:
      "Main Best Sellers Hero",

    adminDescription:
      "The large full-width banner displayed at the top of the Best Sellers page.",

    desktopWidth: 1600,
    desktopHeight: 620,

    mobileWidth: 800,
    mobileHeight: 400,

    sortOrder: 1,
    type: "hero",

    defaults: {
      titleAr:
        "الأكثر مبيعاً",

      titleEn:
        "Best Sellers",

      textAr:
        "اكتشفي منتجات KAB Pharma الأكثر طلباً والمفضلة لدى عملائنا.",

      textEn:
        "Discover the KAB Pharma products most loved and ordered by our customers.",

      buttonTextAr:
        "تسوقي الأكثر مبيعاً",

      buttonTextEn:
        "Shop best sellers",

      linkUrl:
        "/best-sellers#best-sellers-products",

      isActive: true,
    },
  },

  {
    placement:
      "best_sellers_discover_1",

    adminTitle:
      "Best Sellers Promo Banner One",

    adminDescription:
      "An independent New Arrivals promotion displayed between the first Best Sellers products.",

    desktopWidth: 1200,
    desktopHeight: 576,

    mobileWidth: 800,
    mobileHeight: 1000,

    sortOrder: 2,
    type: "discover",

    defaults: {
      titleAr:
        "اكتشفي أحدث ابتكاراتنا",

      titleEn:
        "Discover what’s new",

      textAr:
        "منتجات جديدة صُممت لتصبح جزءاً من روتين العناية اليومي.",

      textEn:
        "Explore new essentials created for your everyday care routine.",

      buttonTextAr:
        "اكتشفي المزيد",

      buttonTextEn:
        "Discover more",

      linkUrl:
        "/new-arrivals#new-arrivals-products",

      isActive: true,
    },
  },

  {
    placement:
      "best_sellers_discover_2",

    adminTitle:
      "Best Sellers Promo Banner Two",

    adminDescription:
      "Spotlight one specific new launch farther down the Best Sellers page. Set its link to the exact product path, for example /products/123.",

    desktopWidth: 1200,
    desktopHeight: 576,

    mobileWidth: 800,
    mobileHeight: 1000,

    sortOrder: 3,
    type: "discover",

    defaults: {
      titleAr:
        "اكتشفي المنتج الجديد",

      titleEn:
        "Meet the new launch",

      textAr:
        "تعرّفي على أحدث إطلاق من KAB Pharma واكتشفي تفاصيله.",

      textEn:
        "Meet the latest KAB Pharma launch and discover its details.",

      buttonTextAr:
        "اكتشفي المنتج",

      buttonTextEn:
        "Discover the product",

      linkUrl:
        "/products",

      isActive: true,
    },
  },

  {
    placement:
      "new_arrivals",

    adminTitle:
      "Main New Arrivals Hero",

    adminDescription:
      "The independent full-width hero displayed at the top of the New Arrivals page.",

    desktopWidth: 1600,
    desktopHeight: 620,

    mobileWidth: 800,
    mobileHeight: 400,

    sortOrder: 4,
    type: "hero",

    defaults: {
      titleAr:
        "وصل حديثاً",

      titleEn:
        "New Arrivals",

      textAr:
        "اكتشفي أحدث منتجات KAB Pharma للعناية بالبشرة والشعر والجسم.",

      textEn:
        "Discover the latest KAB Pharma products for skin, hair, and body care.",

      buttonTextAr:
        "تسوقي المنتجات الجديدة",

      buttonTextEn:
        "Shop new arrivals",

      linkUrl:
        "/new-arrivals#new-arrivals-products",

      isActive: true,
    },
  },

  {
    placement:
      "new_arrivals_discover_1",

    adminTitle:
      "New Arrivals Banner One",

    adminDescription:
      "The only promotional banner displayed between New Arrivals products. It promotes Customer Favourites and links to Best Sellers.",

    desktopWidth: 1200,
    desktopHeight: 576,

    mobileWidth: 800,
    mobileHeight: 1000,

    sortOrder: 5,
    type: "discover",

    defaults: {
      titleAr:
        "اختيارات عملائنا المفضلة",

      titleEn:
        "Customer favourites",

      textAr:
        "اكتشفي المنتجات الأكثر طلباً والمفضلة لدى عملائنا.",

      textEn:
        "Discover the products most loved and ordered by our customers.",

      buttonTextAr:
        "تسوّقي الأكثر مبيعاً",

      buttonTextEn:
        "Shop best sellers",

      linkUrl:
        "/best-sellers#best-sellers-products",

      isActive: true,
    },
  },
];

const BANNER_PLACEMENTS =
  BANNER_CONFIGS.map(
    (config) =>
      config.placement
  );

function createInitialDrafts() {
  const drafts =
    {} as Record<
      BannerPlacement,
      BannerDraft
    >;

  BANNER_CONFIGS.forEach(
    (config) => {
      drafts[
        config.placement
      ] = {
        ...config.defaults,
      };
    }
  );

  return drafts;
}

function createInitialFiles() {
  const files =
    {} as Record<
      BannerPlacement,
      BannerFiles
    >;

  BANNER_CONFIGS.forEach(
    (config) => {
      files[
        config.placement
      ] = {
        desktop: null,
        mobile: null,
      };
    }
  );

  return files;
}

function useFilePreview(
  file: File | null
) {
  const [
    previewUrl,
    setPreviewUrl,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!file) {
      window.queueMicrotask(() => {
        if (!cancelled) {
          setPreviewUrl("");
        }
      });

      return () => {
        cancelled = true;
      };
    }

    const objectUrl =
      URL.createObjectURL(
        file
      );

    window.queueMicrotask(() => {
      if (!cancelled) {
        setPreviewUrl(objectUrl);
      }
    });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [file]);

  return previewUrl;
}

function getImageDimensions(
  file: File
) {
  return new Promise<{
    width: number;
    height: number;
  }>(
    (
      resolve,
      reject
    ) => {
      const objectUrl =
        URL.createObjectURL(
          file
        );

      const image =
        new window.Image();

      image.onload = () => {
        resolve({
          width:
            image.naturalWidth,

          height:
            image.naturalHeight,
        });

        URL.revokeObjectURL(
          objectUrl
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        reject(
          new Error(
            "Could not read the selected image."
          )
        );
      };

      image.src =
        objectUrl;
    }
  );
}

function getDraftFromBanner(
  config: BannerConfig,
  banner?: BannerRecord
): BannerDraft {
  if (!banner) {
    return {
      ...config.defaults,
    };
  }

  const storedLinkUrl =
    banner.link_url?.trim();

  const legacyNewArrivalsHref =
    "/new-arrivals#new-arrivals-products";

  const linkUrl =
    (config.placement ===
      "new_arrivals_discover_1" ||
      config.placement ===
        "best_sellers_discover_2") &&
    storedLinkUrl ===
      legacyNewArrivalsHref
      ? config.defaults.linkUrl
      : storedLinkUrl ||
        config.defaults.linkUrl;

  return {
    titleAr:
      banner.title_ar ||
      banner.title ||
      config.defaults.titleAr,

    titleEn:
      banner.title_en ||
      banner.title ||
      config.defaults.titleEn,

    textAr:
      banner.text_ar ||
      banner.text ||
      config.defaults.textAr,

    textEn:
      banner.text_en ||
      banner.text ||
      config.defaults.textEn,

    buttonTextAr:
      banner.button_text_ar ||
      config.defaults
        .buttonTextAr,

    buttonTextEn:
      banner.button_text ||
      config.defaults
        .buttonTextEn,

    linkUrl,

    isActive:
      banner.is_active ??
      true,
  };
}

function PreviewImage({
  file,
  storedUrl,
  alt,
}: {
  file: File | null;
  storedUrl?: string | null;
  alt: string;
}) {
  const filePreview =
    useFilePreview(file);

  const imageUrl =
    filePreview ||
    storedUrl ||
    "";

  if (!imageUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#eef1ee] px-6 text-center text-sm font-bold text-gray-400">
        No image uploaded
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function HeroPreview({
  banner,
  draft,
  files,
  language,
  placement,
}: {
  banner?: BannerRecord;
  draft: BannerDraft;
  files: BannerFiles;
  language:
    | "en"
    | "ar";
  placement:
    BannerPlacement;
}) {
  const isArabic =
    language === "ar";

  const title =
    isArabic
      ? draft.titleAr
      : draft.titleEn;

  const description =
    isArabic
      ? draft.textAr
      : draft.textEn;

  const buttonText =
    isArabic
      ? draft.buttonTextAr
      : draft.buttonTextEn;

  const isBestSellers =
    placement === "best_sellers";

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-[#647168]">
          Desktop preview
        </p>

        <div className="relative aspect-[1600/620] overflow-hidden rounded-2xl bg-[#eef1ee]">
          <PreviewImage
            file={
              files.desktop
            }
            storedUrl={
              banner?.image_url
            }
            alt={title}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent" />

          <div
            dir="ltr"
            className="absolute inset-0 flex items-center"
          >
            <div className="w-[47%] px-[5%]">
              <div
                dir={
                  isArabic
                    ? "rtl"
                    : "ltr"
                }
                className={
                  isArabic
                    ? "text-right"
                    : "text-left"
                }
              >
                <p className="text-[clamp(6px,0.7vw,11px)] font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
                  KAB Pharma
                </p>

                <h3 className="mt-1 line-clamp-2 text-[clamp(12px,2.2vw,36px)] font-extrabold leading-[1.1] text-[#142019]">
                  {title}
                </h3>

                <p className="mt-2 line-clamp-2 text-[clamp(7px,0.9vw,14px)] leading-relaxed text-[#526058]">
                  {description}
                </p>

                <span className="mt-2 inline-flex rounded-full bg-[#0a583b] px-3 py-1.5 text-[clamp(6px,0.8vw,12px)] font-extrabold text-white">
                  {buttonText}
                </span>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10" />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-[#647168]">
  Mobile preview — 800 × 400 px
</p>

<div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-[#e7ebe8] bg-white">
  {/* Compact mobile image */}
  <div className="relative aspect-[2/1] w-full overflow-hidden bg-[#eef1ee]">
    <PreviewImage
      file={files.mobile}
      storedUrl={
        banner?.image_url_mobile
      }
      alt={title}
    />

    {/* Breadcrumb readability */}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/80 via-white/15 to-transparent" />

    {/* Mobile breadcrumb */}
    <div
      dir="ltr"
      className="absolute inset-x-0 top-0 flex items-center gap-1.5 px-4 py-4 text-[9px] font-semibold text-[#718078]"
    >
      <span>
        {isArabic
          ? "الرئيسية"
          : "Home"}
      </span>

      <span
        aria-hidden="true"
        className="text-[#9aa59e]"
      >
        ›
      </span>

      <span className="font-extrabold text-[#26352d]">
        {isArabic
          ? isBestSellers
            ? "الأكثر مبيعاً"
            : "وصل حديثاً"
          : isBestSellers
            ? "Best Sellers"
            : "New Arrivals"}
      </span>
    </div>

    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10" />
  </div>

  {/* Title and description below image */}
  <div
    dir={
      isArabic
        ? "rtl"
        : "ltr"
    }
    className={`bg-white px-5 pb-6 pt-5 ${
      isArabic
        ? "text-right"
        : "text-left"
    }`}
  >
    <h3 className="text-[24px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#142019]">
      {title}
    </h3>

    {description && (
      <p className="mt-3 line-clamp-3 text-[11px] leading-5 text-[#526058]">
        {description}
      </p>
    )}
  </div>
</div>
        </div>
      </div>
    );
  }

function DiscoverPreview({
  banner,
  draft,
  files,
  language,
  placement,
}: {
  banner?: BannerRecord;
  draft: BannerDraft;
  files: BannerFiles;
  language:
    | "en"
    | "ar";
  placement:
    BannerPlacement;
}) {
  const isArabic =
    language === "ar";

  const title =
    isArabic
      ? draft.titleAr
      : draft.titleEn;

  const description =
    isArabic
      ? draft.textAr
      : draft.textEn;

  const buttonText =
    isArabic
      ? draft.buttonTextAr
      : draft.buttonTextEn;

  const bannerOnRight =
    placement.endsWith(
      "_discover_1"
    );

  return (
    <div>
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-[#647168]">
        Desktop collection preview
      </p>

      <div
        dir="ltr"
        className="grid gap-3 lg:grid-cols-4"
      >
        {!bannerOnRight && (
          <div className="lg:col-span-2">
            <article className="overflow-hidden rounded-2xl border border-[#e7ebe8] bg-white">
              <div className="relative aspect-[5/3] overflow-hidden bg-[#eef1ee]">
                <PreviewImage
                  file={
                    files.desktop
                  }
                  storedUrl={
                    banner
                      ?.image_url
                  }
                  alt={title}
                />
              </div>

              <div
                dir={
                  isArabic
                    ? "rtl"
                    : "ltr"
                }
                className={`p-5 ${
                  isArabic
                    ? "text-right"
                    : "text-left"
                }`}
              >
                <h3 className="text-xl font-extrabold text-[#142019]">
                  {title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#647168]">
                  {description}
                </p>

                <span className="mt-4 inline-flex rounded-full border border-[#0a583b] px-4 py-2 text-xs font-extrabold text-[#0a583b]">
                  {buttonText}
                </span>
              </div>
            </article>
          </div>
        )}

        <div className="min-h-[300px] rounded-2xl border border-dashed border-[#dce3de] bg-white p-4">
          <div className="h-44 rounded-xl bg-[#f2f4f2]" />

          <div className="mt-4 h-3 w-20 rounded-full bg-[#dfe4e0]" />
          <div className="mt-3 h-4 w-4/5 rounded-full bg-[#dfe4e0]" />
          <div className="mt-8 h-10 rounded-full bg-[#edf5f0]" />
        </div>

        <div className="min-h-[300px] rounded-2xl border border-dashed border-[#dce3de] bg-white p-4">
          <div className="h-44 rounded-xl bg-[#f2f4f2]" />

          <div className="mt-4 h-3 w-20 rounded-full bg-[#dfe4e0]" />
          <div className="mt-3 h-4 w-4/5 rounded-full bg-[#dfe4e0]" />
          <div className="mt-8 h-10 rounded-full bg-[#edf5f0]" />
        </div>

        {bannerOnRight && (
          <div className="lg:col-span-2">
            <article className="overflow-hidden rounded-2xl border border-[#e7ebe8] bg-white">
              <div className="relative aspect-[5/3] overflow-hidden bg-[#eef1ee]">
                <PreviewImage
                  file={
                    files.desktop
                  }
                  storedUrl={
                    banner
                      ?.image_url
                  }
                  alt={title}
                />
              </div>

              <div
                dir={
                  isArabic
                    ? "rtl"
                    : "ltr"
                }
                className={`p-5 ${
                  isArabic
                    ? "text-right"
                    : "text-left"
                }`}
              >
                <h3 className="text-xl font-extrabold text-[#142019]">
                  {title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#647168]">
                  {description}
                </p>

                <span className="mt-4 inline-flex rounded-full border border-[#0a583b] px-4 py-2 text-xs font-extrabold text-[#0a583b]">
                  {buttonText}
                </span>
              </div>
            </article>
          </div>
        )}
      </div>

      <div className="mt-7">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-[#647168]">
          Mobile banner preview
        </p>

        <article className="mx-auto w-full max-w-[390px] overflow-hidden rounded-2xl border border-[#e7ebe8] bg-white">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#eef1ee]">
            <PreviewImage
              file={
                files.mobile
              }
              storedUrl={
                banner
                  ?.image_url_mobile
              }
              alt={title}
            />
          </div>

          <div
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            className={`p-5 ${
              isArabic
                ? "text-right"
                : "text-left"
            }`}
          >
            <h3 className="text-2xl font-extrabold text-[#142019]">
              {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#647168]">
              {description}
            </p>

            <span className="mt-4 inline-flex rounded-full border border-[#0a583b] px-5 py-2.5 text-xs font-extrabold text-[#0a583b]">
              {buttonText}
            </span>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function AdminNewArrivalsBannersPage() {
  const router =
    useRouter();

  const [
    banners,
    setBanners,
  ] = useState<
    Partial<
      Record<
        BannerPlacement,
        BannerRecord
      >
    >
  >({});

  const [
    drafts,
    setDrafts,
  ] = useState<
    Record<
      BannerPlacement,
      BannerDraft
    >
  >(
    createInitialDrafts
  );

  const [
    files,
    setFiles,
  ] = useState<
    Record<
      BannerPlacement,
      BannerFiles
    >
  >(
    createInitialFiles
  );

  const [
    previewLanguage,
    setPreviewLanguage,
  ] = useState<
    "en" | "ar"
  >("en");

  const [
    initialLoading,
    setInitialLoading,
  ] = useState(true);

  const [
    savingPlacement,
    setSavingPlacement,
  ] =
    useState<BannerPlacement | null>(
      null
    );

  const [
    deletingPlacement,
    setDeletingPlacement,
  ] =
    useState<BannerPlacement | null>(
      null
    );

  const [
    notices,
    setNotices,
  ] = useState<
    Partial<
      Record<
        BannerPlacement,
        Notice
      >
    >
  >({});

  const [
    fileKeys,
    setFileKeys,
  ] = useState<
    Record<
      BannerPlacement,
      number
    >
  >({
    best_sellers: 0,
    best_sellers_discover_1: 0,
    best_sellers_discover_2: 0,
    new_arrivals: 0,
    new_arrivals_discover_1: 0,
  });

  const loadBanners =
    useCallback(
      async () => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "home_banners"
          )
          .select("*")
          .in(
            "placement",
            BANNER_PLACEMENTS
          )
          .order("id", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        const loadedBanners:
          Partial<
            Record<
              BannerPlacement,
              BannerRecord
            >
          > = {};

        (
          (data ||
            []) as BannerRecord[]
        ).forEach(
          (banner) => {
            if (
              !loadedBanners[
                banner.placement
              ]
            ) {
              loadedBanners[
                banner.placement
              ] =
                banner;
            }
          }
        );

        setBanners(
          loadedBanners
        );

        const loadedDrafts =
          createInitialDrafts();

        BANNER_CONFIGS.forEach(
          (config) => {
            loadedDrafts[
              config.placement
            ] =
              getDraftFromBanner(
                config,
                loadedBanners[
                  config.placement
                ]
              );
          }
        );

        setDrafts(
          loadedDrafts
        );
      },
      []
    );

  useEffect(() => {
    let cancelled =
      false;

    async function initializePage() {
      const {
        data,
        error,
      } =
        await supabase.auth.getUser();

      if (
        error ||
        !data.user
      ) {
        router.replace(
          "/admin/login"
        );

        return;
      }

      try {
        await loadBanners();
      } catch (error: unknown) {
        console.error(
          "Could not load Best Sellers and New Arrivals banners:",
          error
        );
      } finally {
        if (!cancelled) {
          setInitialLoading(
            false
          );
        }
      }
    }

    void initializePage();

    return () => {
      cancelled = true;
    };
  }, [
    loadBanners,
    router,
  ]);

  function updateDraft(
    placement:
      BannerPlacement,
    values:
      Partial<BannerDraft>
  ) {
    setDrafts(
      (current) => ({
        ...current,

        [placement]: {
          ...current[
            placement
          ],

          ...values,
        },
      })
    );
  }

  function updateFile(
    placement:
      BannerPlacement,
    mode: BannerMode,
    file: File | null
  ) {
    setFiles(
      (current) => ({
        ...current,

        [placement]: {
          ...current[
            placement
          ],

          [mode]: file,
        },
      })
    );
  }

  function setNotice(
    placement:
      BannerPlacement,
    notice: Notice | null
  ) {
    setNotices(
      (current) => {
        const next = {
          ...current,
        };

        if (notice) {
          next[
            placement
          ] =
            notice;
        } else {
          delete next[
            placement
          ];
        }

        return next;
      }
    );
  }

  async function handleImageChange(
    event:
      ChangeEvent<HTMLInputElement>,
    config: BannerConfig,
    mode: BannerMode
  ) {
    const input =
      event.currentTarget;

    const selectedFile =
      input.files?.[0] ||
      null;

    setNotice(
      config.placement,
      null
    );

    if (!selectedFile) {
      updateFile(
        config.placement,
        mode,
        null
      );

      return;
    }

    try {
      if (
        !selectedFile.type.startsWith(
          "image/"
        )
      ) {
        throw new Error(
          "Please select a valid image file."
        );
      }

      if (
        selectedFile.size >
        MAX_IMAGE_SIZE
      ) {
        throw new Error(
          "The image must be smaller than 10 MB."
        );
      }

      const dimensions =
        await getImageDimensions(
          selectedFile
        );

      const requiredWidth =
        mode === "desktop"
          ? config.desktopWidth
          : config.mobileWidth;

      const requiredHeight =
        mode === "desktop"
          ? config.desktopHeight
          : config.mobileHeight;

      if (
        dimensions.width !==
          requiredWidth ||
        dimensions.height !==
          requiredHeight
      ) {
        throw new Error(
          `${mode === "desktop" ? "Desktop" : "Mobile"} image must be exactly ${requiredWidth} × ${requiredHeight} px. Selected image is ${dimensions.width} × ${dimensions.height} px.`
        );
      }

      updateFile(
        config.placement,
        mode,
        selectedFile
      );
    } catch (error: unknown) {
      input.value = "";

      updateFile(
        config.placement,
        mode,
        null
      );

      setNotice(
        config.placement,
        {
          type: "error",

          message:
            (error instanceof Error
              ? error.message
              : null) ||
            "The selected image is not valid.",
        }
      );
    }
  }

  function createSafeFileName(
    fileName: string
  ) {
    return (
      fileName
        .toLowerCase()
        .trim()
        .replace(
          /\s+/g,
          "-"
        )
        .replace(
          /[^a-z0-9.\-_]/g,
          ""
        ) ||
      "banner-image"
    );
  }

  async function uploadImage(
    placement:
      BannerPlacement,
    mode: BannerMode,
    file: File
  ): Promise<UploadedImage> {
    const filePath =
      `${placement}/${mode}/${crypto.randomUUID()}-${createSafeFileName(
        file.name
      )}`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          STORAGE_BUCKET
        )
        .upload(
          filePath,
          file,
          {
            cacheControl:
              "3600",

            upsert: false,
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from(
          STORAGE_BUCKET
        )
        .getPublicUrl(
          filePath
        );

    return {
      filePath,

      publicUrl:
        data.publicUrl,
    };
  }

  function getStoragePathFromPublicUrl(
    publicUrl?:
      | string
      | null
  ) {
    if (!publicUrl) {
      return null;
    }

    const marker =
      `/storage/v1/object/public/${STORAGE_BUCKET}/`;

    const index =
      publicUrl.indexOf(
        marker
      );

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      publicUrl.substring(
        index +
          marker.length
      )
    );
  }

  async function removeFiles(
    paths: string[]
  ) {
    const uniquePaths =
      Array.from(
        new Set(
          paths.filter(
            Boolean
          )
        )
      );

    if (
      uniquePaths.length === 0
    ) {
      return;
    }

    const { error } =
      await supabase.storage
        .from(
          STORAGE_BUCKET
        )
        .remove(
          uniquePaths
        );

    if (error) {
      console.error(
        "Could not remove banner files:",
        error
      );
    }
  }

  async function saveBanner(
    event:
      FormEvent<HTMLFormElement>,
    config: BannerConfig
  ) {
    event.preventDefault();

    const placement =
      config.placement;

    const draft =
      drafts[
        placement
      ];

    const selectedFiles =
      files[
        placement
      ];

    const existingBanner =
      banners[
        placement
      ];

    setNotice(
      placement,
      null
    );

    if (
      !draft.titleAr.trim() ||
      !draft.titleEn.trim()
    ) {
      setNotice(
        placement,
        {
          type: "error",

          message:
            "Please add Arabic and English titles.",
        }
      );

      return;
    }

    if (
      !existingBanner
        ?.image_url &&
      !selectedFiles.desktop
    ) {
      setNotice(
        placement,
        {
          type: "error",

          message:
            "Please upload the desktop image.",
        }
      );

      return;
    }

    if (
      !existingBanner
        ?.image_url_mobile &&
      !selectedFiles.mobile
    ) {
      setNotice(
        placement,
        {
          type: "error",

          message:
            "Please upload the mobile image.",
        }
      );

      return;
    }

    setSavingPlacement(
      placement
    );

    let desktopUpload:
      | UploadedImage
      | null = null;

    let mobileUpload:
      | UploadedImage
      | null = null;

    try {
      if (
        selectedFiles.desktop
      ) {
        desktopUpload =
          await uploadImage(
            placement,
            "desktop",
            selectedFiles.desktop
          );
      }

      if (
        selectedFiles.mobile
      ) {
        mobileUpload =
          await uploadImage(
            placement,
            "mobile",
            selectedFiles.mobile
          );
      }

      const desktopUrl =
        desktopUpload
          ?.publicUrl ||
        existingBanner
          ?.image_url ||
        "";

      const mobileUrl =
        mobileUpload
          ?.publicUrl ||
        existingBanner
          ?.image_url_mobile ||
        "";

      if (
        !desktopUrl ||
        !mobileUrl
      ) {
        throw new Error(
          "Desktop and mobile images are required."
        );
      }

      if (
        desktopUrl ===
        mobileUrl
      ) {
        throw new Error(
          "Desktop and mobile images must be separate files."
        );
      }

      const payload = {
        placement,

        image_url:
          desktopUrl,

        image_url_mobile:
          mobileUrl,

        title:
          draft.titleEn.trim() ||
          draft.titleAr.trim(),

        title_ar:
          draft.titleAr.trim(),

        title_en:
          draft.titleEn.trim(),

        text:
          draft.textEn.trim() ||
          draft.textAr.trim(),

        text_ar:
          draft.textAr.trim(),

        text_en:
          draft.textEn.trim(),

        button_text:
          draft.buttonTextEn.trim(),

        button_text_ar:
          draft.buttonTextAr.trim(),

        link_url:
          draft.linkUrl.trim() ||
          config.defaults.linkUrl,

        desktop_position_x:
          50,

        desktop_position_y:
          50,

        desktop_zoom: 1,

        mobile_position_x:
          50,

        mobile_position_y:
          50,

        mobile_zoom: 1,

        sort_order:
          config.sortOrder,

        is_active:
          draft.isActive,
      };

      let savedBanner:
        BannerRecord;

      if (
        existingBanner?.id
      ) {
        const {
          data,
          error,
        } = await supabase
          .from(
            "home_banners"
          )
          .update(payload)
          .eq(
            "id",
            existingBanner.id
          )
          .eq(
            "placement",
            placement
          )
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        savedBanner =
          data as BannerRecord;
      } else {
        const {
          data,
          error,
        } = await supabase
          .from(
            "home_banners"
          )
          .insert(payload)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        savedBanner =
          data as BannerRecord;
      }

      const oldPaths:
        string[] = [];

      if (
        desktopUpload &&
        existingBanner
          ?.image_url
      ) {
        const path =
          getStoragePathFromPublicUrl(
            existingBanner
              .image_url
          );

        if (path) {
          oldPaths.push(
            path
          );
        }
      }

      if (
        mobileUpload &&
        existingBanner
          ?.image_url_mobile
      ) {
        const path =
          getStoragePathFromPublicUrl(
            existingBanner
              .image_url_mobile
          );

        if (path) {
          oldPaths.push(
            path
          );
        }
      }

      await removeFiles(
        oldPaths
      );

      setBanners(
        (current) => ({
          ...current,

          [placement]:
            savedBanner,
        })
      );

      setDrafts(
        (current) => ({
          ...current,

          [placement]:
            getDraftFromBanner(
              config,
              savedBanner
            ),
        })
      );

      setFiles(
        (current) => ({
          ...current,

          [placement]: {
            desktop: null,
            mobile: null,
          },
        })
      );

      setFileKeys(
        (current) => ({
          ...current,

          [placement]:
            current[
              placement
            ] + 1,
        })
      );

      setNotice(
        placement,
        {
          type: "success",

          message:
            `${config.adminTitle} saved successfully.`,
        }
      );
    } catch (error: unknown) {
      await removeFiles(
        [
          desktopUpload
            ?.filePath,

          mobileUpload
            ?.filePath,
        ].filter(
          Boolean
        ) as string[]
      );

      setNotice(
        placement,
        {
          type: "error",

          message:
            (error instanceof Error
              ? error.message
              : null) ||
            "Could not save the banner.",
        }
      );
    } finally {
      setSavingPlacement(
        null
      );
    }
  }

  async function deleteBanner(
    config: BannerConfig
  ) {
    const placement =
      config.placement;

    const banner =
      banners[
        placement
      ];

    if (!banner) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${config.adminTitle}?`
      );

    if (!confirmed) {
      return;
    }

    setDeletingPlacement(
      placement
    );

    setNotice(
      placement,
      null
    );

    try {
      const { error } =
        await supabase
          .from(
            "home_banners"
          )
          .delete()
          .eq(
            "id",
            banner.id
          )
          .eq(
            "placement",
            placement
          );

      if (error) {
        throw error;
      }

      await removeFiles(
        [
          getStoragePathFromPublicUrl(
            banner.image_url
          ),

          getStoragePathFromPublicUrl(
            banner
              .image_url_mobile
          ),
        ].filter(
          Boolean
        ) as string[]
      );

      setBanners(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            placement
          ];

          return next;
        }
      );

      setDrafts(
        (current) => ({
          ...current,

          [placement]: {
            ...config.defaults,
          },
        })
      );

      setFiles(
        (current) => ({
          ...current,

          [placement]: {
            desktop: null,
            mobile: null,
          },
        })
      );

      setFileKeys(
        (current) => ({
          ...current,

          [placement]:
            current[
              placement
            ] + 1,
        })
      );

      setNotice(
        placement,
        {
          type: "success",

          message:
            `${config.adminTitle} deleted successfully.`,
        }
      );
    } catch (error: unknown) {
      setNotice(
        placement,
        {
          type: "error",

          message:
            (error instanceof Error
              ? error.message
              : null) ||
            "Could not delete the banner.",
        }
      );
    } finally {
      setDeletingPlacement(
        null
      );
    }
  }

  if (initialLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-[#dfe4e0] border-t-[#0a583b]" />

          <p className="mt-4 text-sm font-bold text-[#647168]">
            Loading Best Sellers and New Arrivals banners...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="hidden rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 lg:inline-flex"
            >
              ← Desktop Dashboard
            </Link>

            <Link
              href="/admin-mobile"
              className="inline-flex rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 lg:hidden"
            >
              ← Dashboard
            </Link>

            <Link
              href="/admin/banners/main"
              className="inline-flex rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700"
            >
              Main banners
            </Link>

            <Link
              href="/best-sellers"
              target="_blank"
              className="inline-flex rounded-xl bg-[#edf5f0] px-4 py-2 text-sm font-extrabold text-[#0a583b] hover:bg-[#dcebe2]"
            >
              Open Best Sellers page ↗
            </Link>

            <Link
              href="/new-arrivals"
              target="_blank"
              className="inline-flex rounded-xl bg-[#edf5f0] px-4 py-2 text-sm font-extrabold text-[#0a583b] hover:bg-[#dcebe2]"
            >
              Open New Arrivals page ↗
            </Link>
          </div>

          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
            Website Content
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#142019] sm:text-4xl">
            Best Sellers & New Arrivals Banners
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#647168] sm:text-base">
            Manage a fully independent hero and two promotional banners for Best Sellers, plus a separate hero and one promotional banner for New Arrivals.
          </p>

          <div
            dir="ltr"
            className="mt-6 inline-flex rounded-full bg-[#f3f5f3] p-1"
          >
            <button
              type="button"
              onClick={() =>
                setPreviewLanguage(
                  "en"
                )
              }
              className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                previewLanguage ===
                "en"
                  ? "bg-[#0a583b] text-white"
                  : "text-[#647168]"
              }`}
            >
              EN Preview
            </button>

            <button
              type="button"
              onClick={() =>
                setPreviewLanguage(
                  "ar"
                )
              }
              className={`rounded-full px-4 py-2 text-xs font-extrabold ${
                previewLanguage ===
                "ar"
                  ? "bg-[#0a583b] text-white"
                  : "text-[#647168]"
              }`}
            >
              AR Preview
            </button>
          </div>
        </section>

        <div className="space-y-10">
          {BANNER_CONFIGS.map(
            (config) => {
              const placement =
                config.placement;

              const banner =
                banners[
                  placement
                ];

              const draft =
                drafts[
                  placement
                ];

              const selectedFiles =
                files[
                  placement
                ];

              const notice =
                notices[
                  placement
                ];

              const saving =
                savingPlacement ===
                placement;

              const deleting =
                deletingPlacement ===
                placement;

              return (
                <form
                  key={
                    placement
                  }
                  onSubmit={(
                    event
                  ) =>
                    void saveBanner(
                      event,
                      config
                    )
                  }
                  className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="border-b border-[#e7ebe8] bg-[#fbfcfb] p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0a583b]">
                          {config.placement}
                        </p>

                        <h2 className="mt-2 text-2xl font-extrabold text-[#142019] sm:text-3xl">
                          {config.adminTitle}
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#647168]">
                          {config.adminDescription}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
                          draft.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {draft.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    {notice && (
                      <div
                        className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-bold ${
                          notice.type ===
                          "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {notice.message}
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={
                          draft.titleAr
                        }
                        onChange={(event) =>
                          updateDraft(
                            placement,
                            {
                              titleAr:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="العنوان بالعربي"
                        dir="rtl"
                        required
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
                      />

                      <input
                        type="text"
                        value={
                          draft.titleEn
                        }
                        onChange={(event) =>
                          updateDraft(
                            placement,
                            {
                              titleEn:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="English title"
                        required
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
                      />

                      <textarea
                        value={
                          draft.textAr
                        }
                        onChange={(event) =>
                          updateDraft(
                            placement,
                            {
                              textAr:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="الوصف بالعربي"
                        dir="rtl"
                        className="min-h-28 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
                      />

                      <textarea
                        value={
                          draft.textEn
                        }
                        onChange={(event) =>
                          updateDraft(
                            placement,
                            {
                              textEn:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="English description"
                        className="min-h-28 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
                      />

                      <input
                        type="text"
                        value={
                          draft.buttonTextAr
                        }
                        onChange={(event) =>
                          updateDraft(
                            placement,
                            {
                              buttonTextAr:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="نص الزر بالعربي"
                        dir="rtl"
                        required
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
                      />

                      <input
                        type="text"
                        value={
                          draft.buttonTextEn
                        }
                        onChange={(event) =>
                          updateDraft(
                            placement,
                            {
                              buttonTextEn:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="English button text"
                        required
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
                      />
                    </div>

                    <input
                      type="text"
                      value={
                        draft.linkUrl
                      }
                      onChange={(event) =>
                        updateDraft(
                          placement,
                          {
                            linkUrl:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder={
                        config.defaults.linkUrl
                      }
                      className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
                    />

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      <label className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
                        <span className="font-extrabold text-[#142019]">
                          Desktop image
                        </span>

                        <p className="mt-1 text-xs leading-5 text-[#647168]">
                          Exactly{" "}
                          {config.desktopWidth} ×{" "}
                          {config.desktopHeight} px
                        </p>

                        <input
                          key={`${placement}-desktop-${fileKeys[placement]}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          required={
                            !banner?.image_url
                          }
                          onChange={(event) =>
                            void handleImageChange(
                              event,
                              config,
                              "desktop"
                            )
                          }
                          className="mt-4 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-[#0a583b] file:px-4 file:py-2.5 file:font-extrabold file:text-white"
                        />
                      </label>

                      <label className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
                        <span className="font-extrabold text-[#142019]">
                          Mobile image
                        </span>

                        <p className="mt-1 text-xs leading-5 text-[#647168]">
                          Exactly{" "}
                          {config.mobileWidth} ×{" "}
                          {config.mobileHeight} px
                        </p>

                        <input
                          key={`${placement}-mobile-${fileKeys[placement]}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          required={
                            !banner
                              ?.image_url_mobile
                          }
                          onChange={(event) =>
                            void handleImageChange(
                              event,
                              config,
                              "mobile"
                            )
                          }
                          className="mt-4 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-[#0a583b] file:px-4 file:py-2.5 file:font-extrabold file:text-white"
                        />
                      </label>
                    </div>

                    <section className="mt-7 rounded-3xl border border-[#e7ebe8] bg-[#f9faf9] p-4 sm:p-6">
                      {config.type ===
                      "hero" ? (
                        <HeroPreview
                          banner={
                            banner
                          }
                          draft={
                            draft
                          }
                          files={
                            selectedFiles
                          }
                          language={
                            previewLanguage
                          }
                          placement={
                            placement
                          }
                        />
                      ) : (
                        <DiscoverPreview
                          banner={
                            banner
                          }
                          draft={
                            draft
                          }
                          files={
                            selectedFiles
                          }
                          language={
                            previewLanguage
                          }
                          placement={
                            placement
                          }
                        />
                      )}
                    </section>

                    <label className="mt-7 flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e7ebe8] bg-[#f9faf9] p-4">
                      <input
                        type="checkbox"
                        checked={
                          draft.isActive
                        }
                        onChange={(event) =>
                          updateDraft(
                            placement,
                            {
                              isActive:
                                event
                                  .target
                                  .checked,
                            }
                          )
                        }
                        className="h-5 w-5 accent-[#0a583b]"
                      />

                      <span className="font-extrabold text-[#142019]">
                        Display this banner on the{
                          " "
                        }
                        {placement.startsWith(
                          "best_sellers"
                        )
                          ? "Best Sellers"
                          : "New Arrivals"}{
                          " "
                        }
                        page
                      </span>
                    </label>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={
                          saving ||
                          deleting
                        }
                        className="rounded-xl bg-[#0a583b] px-6 py-3.5 text-sm font-extrabold text-white hover:bg-[#073f2c] disabled:bg-gray-400"
                      >
                        {saving
                          ? "Saving..."
                          : banner
                            ? "Save Changes"
                            : "Create Banner"}
                      </button>

                      {banner && (
                        <button
                          type="button"
                          onClick={() =>
                            void deleteBanner(
                              config
                            )
                          }
                          disabled={
                            saving ||
                            deleting
                          }
                          className="rounded-xl bg-red-600 px-6 py-3.5 text-sm font-extrabold text-white hover:bg-red-700 disabled:bg-gray-400"
                        >
                          {deleting
                            ? "Deleting..."
                            : "Delete Banner"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              );
            }
          )}
        </div>
      </div>
    </main>
  );
}

