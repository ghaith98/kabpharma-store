"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CropMode =
  | "desktop"
  | "mobile";

type CropSettings = {
  x: number;
  y: number;
  zoom: number;
};

type BannerCropDraft = {
  desktop: CropSettings;
  mobile: CropSettings;
};

type CropProperty =
  keyof CropSettings;

const DEFAULT_CROP: CropSettings = {
  x: 50,
  y: 50,
  zoom: 1,
};

function clamp(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
) {
  const numberValue = Number(value);

  if (
    !Number.isFinite(numberValue)
  ) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(minimum, numberValue)
  );
}

function getBannerCrop(
  banner: any,
  mode: CropMode
): CropSettings {
  return {
    x: clamp(
      banner?.[
        `${mode}_position_x`
      ],
      0,
      100,
      50
    ),

    y: clamp(
      banner?.[
        `${mode}_position_y`
      ],
      0,
      100,
      50
    ),

    zoom: clamp(
      banner?.[
        `${mode}_zoom`
      ],
      1,
      1.6,
      1
    ),
  };
}

function getBannerCropDraft(
  banner: any
): BannerCropDraft {
  return {
    desktop: getBannerCrop(
      banner,
      "desktop"
    ),

    mobile: getBannerCrop(
      banner,
      "mobile"
    ),
  };
}

function useFilePreview(
  file: File | null
) {
  const [previewUrl, setPreviewUrl] =
    useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const objectUrl =
      URL.createObjectURL(file);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [file]);

  return previewUrl;
}

function CropPreview({
  imageUrl,
  alt,
  mode,
  crop,
}: {
  imageUrl: string;
  alt: string;
  mode: CropMode;
  crop: CropSettings;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#eef1ee] ${
        mode === "desktop"
          ? "aspect-[1600/620] w-full"
          : "mx-auto aspect-[393/680] w-full max-w-[330px]"
      }`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{
            objectPosition:
              `${crop.x}% ${crop.y}%`,

            transform:
              `scale(${crop.zoom})`,

            transformOrigin:
              `${crop.x}% ${crop.y}%`,
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm font-bold text-gray-400">
          No image selected
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10" />

      <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur">
        {mode === "mobile"
          ? "Mobile visible area"
          : "Desktop visible area"}
      </span>
    </div>
  );
}

function RangeControl({
  label,
  value,
  minimum,
  maximum,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  suffix: string;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-4 text-xs font-extrabold text-gray-700">
        <span>{label}</span>

        <span className="rounded-full bg-[#edf5f0] px-2.5 py-1 text-[#0a583b]">
          {suffix === "%"
            ? `${Math.round(
                value
              )}%`
            : `${Math.round(
                value * 100
              )}%`}
        </span>
      </span>

      <input
        type="range"
        min={minimum}
        max={maximum}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className="w-full cursor-pointer accent-[#0a583b]"
      />
    </label>
  );
}

function CropEditor({
  title,
  description,
  imageUrl,
  alt,
  mode,
  crop,
  onChange,
  onReset,
}: {
  title: string;
  description: string;
  imageUrl: string;
  alt: string;
  mode: CropMode;
  crop: CropSettings;
  onChange: (
    property: CropProperty,
    value: number
  ) => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-3xl border border-[#e7ebe8] bg-[#f9faf9] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-[#142019]">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-[#647168]">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-full border border-[#dfe4e0] bg-white px-3 py-1.5 text-xs font-extrabold text-[#526057] transition hover:border-[#0a583b] hover:text-[#0a583b]"
        >
          Reset
        </button>
      </div>

      <CropPreview
        imageUrl={imageUrl}
        alt={alt}
        mode={mode}
        crop={crop}
      />

      <div className="mt-5 space-y-4 rounded-2xl bg-white p-4 ring-1 ring-[#e7ebe8]">
        <RangeControl
          label="Horizontal position"
          value={crop.x}
          minimum={0}
          maximum={100}
          step={1}
          suffix="%"
          onChange={(value) =>
            onChange("x", value)
          }
        />

        <div className="flex justify-between text-[10px] font-bold text-gray-400">
          <span>Left</span>
          <span>Center</span>
          <span>Right</span>
        </div>

        <RangeControl
          label="Vertical position"
          value={crop.y}
          minimum={0}
          maximum={100}
          step={1}
          suffix="%"
          onChange={(value) =>
            onChange("y", value)
          }
        />

        <div className="flex justify-between text-[10px] font-bold text-gray-400">
          <span>Top</span>
          <span>Center</span>
          <span>Bottom</span>
        </div>

        <RangeControl
          label="Image zoom"
          value={crop.zoom}
          minimum={1}
          maximum={1.6}
          step={0.01}
          suffix="zoom"
          onChange={(value) =>
            onChange(
              "zoom",
              value
            )
          }
        />
      </div>
    </section>
  );
}

export default function AdminBannersPage() {
  const router = useRouter();

  const [banners, setBanners] =
    useState<any[]>([]);

  const [titleAr, setTitleAr] =
    useState("");

  const [titleEn, setTitleEn] =
    useState("");

  const [textAr, setTextAr] =
    useState("");

  const [textEn, setTextEn] =
    useState("");

  const [
    buttonTextAr,
    setButtonTextAr,
  ] = useState("تسوق الآن");

  const [
    buttonTextEn,
    setButtonTextEn,
  ] = useState("Shop now");

  const [linkUrl, setLinkUrl] =
    useState("/products");

  const [
    desktopImageFile,
    setDesktopImageFile,
  ] = useState<File | null>(null);

  const [
    mobileImageFile,
    setMobileImageFile,
  ] = useState<File | null>(null);

  const [
    newDesktopCrop,
    setNewDesktopCrop,
  ] = useState<CropSettings>({
    ...DEFAULT_CROP,
  });

  const [
    newMobileCrop,
    setNewMobileCrop,
  ] = useState<CropSettings>({
    ...DEFAULT_CROP,
  });

  const [
    cropDrafts,
    setCropDrafts,
  ] = useState<
    Record<
      number,
      BannerCropDraft
    >
  >({});

  const [
    savingCropId,
    setSavingCropId,
  ] = useState<number | null>(
    null
  );

  const [loading, setLoading] =
    useState(false);

  const [formKey, setFormKey] =
    useState(0);

  const desktopPreviewUrl =
    useFilePreview(
      desktopImageFile
    );

  const mobilePreviewUrl =
    useFilePreview(
      mobileImageFile
    );

  async function loadBanners() {
    const { data, error } =
      await supabase
        .from("home_banners")
        .select("*")
        .order("sort_order", {
          ascending: true,
        });

    if (error) {
      alert(error.message);
      return;
    }

    const loadedBanners =
      data || [];

    setBanners(loadedBanners);

    const drafts: Record<
      number,
      BannerCropDraft
    > = {};

    loadedBanners.forEach(
      (banner) => {
        drafts[
          Number(banner.id)
        ] =
          getBannerCropDraft(
            banner
          );
      }
    );

    setCropDrafts(drafts);
  }

  async function checkAdmin() {
    const { data, error } =
      await supabase.auth.getUser();

    if (
      error ||
      !data.user
    ) {
      router.push(
        "/admin/login"
      );

      return;
    }

    await loadBanners();
  }

  function createSafeFileName(
    fileName: string
  ) {
    const safeName = fileName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(
        /[^a-z0-9.\-_]/g,
        ""
      );

    return (
      safeName ||
      "banner-image"
    );
  }

  async function uploadBannerImage(
    file: File,
    folder:
      | "desktop"
      | "mobile"
  ) {
    const safeFileName =
      createSafeFileName(
        file.name
      );

    const uniqueId =
      `${Date.now()}-${crypto.randomUUID()}`;

    const filePath =
      `${folder}/${uniqueId}-${safeFileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("home-banners")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from("home-banners")
        .getPublicUrl(
          filePath
        );

    return {
      publicUrl:
        data.publicUrl,

      filePath,
    };
  }

  async function removeUploadedFile(
    filePath: string | null
  ) {
    if (!filePath) return;

    await supabase.storage
      .from("home-banners")
      .remove([filePath]);
  }

  function resetForm() {
    setTitleAr("");
    setTitleEn("");

    setTextAr("");
    setTextEn("");

    setButtonTextAr(
      "تسوق الآن"
    );

    setButtonTextEn(
      "Shop now"
    );

    setLinkUrl("/products");

    setDesktopImageFile(
      null
    );

    setMobileImageFile(
      null
    );

    setNewDesktopCrop({
      ...DEFAULT_CROP,
    });

    setNewMobileCrop({
      ...DEFAULT_CROP,
    });

    setFormKey(
      (current) =>
        current + 1
    );
  }

  function updateNewCrop(
    mode: CropMode,
    property: CropProperty,
    value: number
  ) {
    if (
      mode === "desktop"
    ) {
      setNewDesktopCrop(
        (current) => ({
          ...current,
          [property]: value,
        })
      );

      return;
    }

    setNewMobileCrop(
      (current) => ({
        ...current,
        [property]: value,
      })
    );
  }

  async function addBanner(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!desktopImageFile) {
      alert(
        "Please upload the desktop banner image"
      );

      return;
    }

    if (!mobileImageFile) {
      alert(
        "Please upload the mobile banner image"
      );

      return;
    }

    setLoading(true);

    let uploadedDesktopPath:
      | string
      | null = null;

    let uploadedMobilePath:
      | string
      | null = null;

    try {
      const desktopUpload =
        await uploadBannerImage(
          desktopImageFile,
          "desktop"
        );

      uploadedDesktopPath =
        desktopUpload.filePath;

      const mobileUpload =
        await uploadBannerImage(
          mobileImageFile,
          "mobile"
        );

      uploadedMobilePath =
        mobileUpload.filePath;

      const nextSortOrder =
        banners.length > 0
          ? Math.max(
              ...banners.map(
                (banner) =>
                  Number(
                    banner.sort_order ||
                      0
                  )
              )
            ) + 1
          : 1;

      const {
        error: insertError,
      } = await supabase
        .from("home_banners")
        .insert({
          image_url:
            desktopUpload.publicUrl,

          image_url_mobile:
            mobileUpload.publicUrl,

          title:
            titleEn ||
            titleAr,

          text:
            textEn ||
            textAr,

          title_ar:
            titleAr,

          title_en:
            titleEn,

          text_ar:
            textAr,

          text_en:
            textEn,

          button_text:
            buttonTextEn ||
            "Shop now",

          button_text_ar:
            buttonTextAr ||
            "تسوق الآن",

          link_url:
            linkUrl ||
            "/products",

          desktop_position_x:
            Math.round(
              newDesktopCrop.x
            ),

          desktop_position_y:
            Math.round(
              newDesktopCrop.y
            ),

          desktop_zoom:
            Number(
              newDesktopCrop.zoom.toFixed(
                2
              )
            ),

          mobile_position_x:
            Math.round(
              newMobileCrop.x
            ),

          mobile_position_y:
            Math.round(
              newMobileCrop.y
            ),

          mobile_zoom:
            Number(
              newMobileCrop.zoom.toFixed(
                2
              )
            ),

          sort_order:
            nextSortOrder,

          is_active: true,
        });

      if (insertError) {
        throw insertError;
      }

      resetForm();

      await loadBanners();

      alert(
        "Banner added successfully"
      );
    } catch (error: any) {
      await Promise.all([
        removeUploadedFile(
          uploadedDesktopPath
        ),

        removeUploadedFile(
          uploadedMobilePath
        ),
      ]);

      alert(
        error?.message ||
          "Something went wrong while adding the banner"
      );
    } finally {
      setLoading(false);
    }
  }

  function updateBannerCrop(
    banner: any,
    mode: CropMode,
    property: CropProperty,
    value: number
  ) {
    const bannerId =
      Number(banner.id);

    setCropDrafts(
      (current) => {
        const currentDraft =
          current[bannerId] ||
          getBannerCropDraft(
            banner
          );

        return {
          ...current,

          [bannerId]: {
            ...currentDraft,

            [mode]: {
              ...currentDraft[
                mode
              ],

              [property]:
                value,
            },
          },
        };
      }
    );
  }

  function resetBannerCrop(
    bannerId: number
  ) {
    setCropDrafts(
      (current) => ({
        ...current,

        [bannerId]: {
          desktop: {
            ...DEFAULT_CROP,
          },

          mobile: {
            ...DEFAULT_CROP,
          },
        },
      })
    );
  }

  async function saveBannerCrop(
    banner: any
  ) {
    const bannerId =
      Number(banner.id);

    const draft =
      cropDrafts[
        bannerId
      ] ||
      getBannerCropDraft(
        banner
      );

    setSavingCropId(
      bannerId
    );

    const { error } =
      await supabase
        .from("home_banners")
        .update({
          desktop_position_x:
            Math.round(
              draft.desktop.x
            ),

          desktop_position_y:
            Math.round(
              draft.desktop.y
            ),

          desktop_zoom:
            Number(
              draft.desktop.zoom.toFixed(
                2
              )
            ),

          mobile_position_x:
            Math.round(
              draft.mobile.x
            ),

          mobile_position_y:
            Math.round(
              draft.mobile.y
            ),

          mobile_zoom:
            Number(
              draft.mobile.zoom.toFixed(
                2
              )
            ),
        })
        .eq(
          "id",
          bannerId
        );

    setSavingCropId(null);

    if (error) {
      alert(error.message);
      return;
    }

    await loadBanners();

    alert(
      "Banner framing saved"
    );
  }

  async function toggleActive(
    banner: any
  ) {
    const { error } =
      await supabase
        .from("home_banners")
        .update({
          is_active:
            !banner.is_active,
        })
        .eq(
          "id",
          banner.id
        );

    if (error) {
      alert(error.message);
      return;
    }

    await loadBanners();
  }

  function getStoragePathFromPublicUrl(
    publicUrl?: string | null
  ) {
    if (!publicUrl) {
      return null;
    }

    const marker =
      "/storage/v1/object/public/home-banners/";

    const markerIndex =
      publicUrl.indexOf(
        marker
      );

    if (
      markerIndex === -1
    ) {
      return null;
    }

    return decodeURIComponent(
      publicUrl.substring(
        markerIndex +
          marker.length
      )
    );
  }

  async function deleteBanner(
    id: number
  ) {
    const confirmDelete =
      window.confirm(
        "Delete this banner?"
      );

    if (!confirmDelete) {
      return;
    }

    const banner =
      banners.find(
        (item) =>
          Number(
            item.id
          ) === Number(id)
      );

    const { error } =
      await supabase
        .from("home_banners")
        .delete()
        .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (banner) {
      const storagePaths = [
        getStoragePathFromPublicUrl(
          banner.image_url
        ),

        getStoragePathFromPublicUrl(
          banner.image_url_mobile
        ),
      ].filter(
        Boolean
      ) as string[];

      if (
        storagePaths.length >
        0
      ) {
        await supabase.storage
          .from(
            "home-banners"
          )
          .remove(
            storagePaths
          );
      }
    }

    await loadBanners();
  }

  useEffect(() => {
    void checkAdmin();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8f7] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex gap-2">
            <a
              href="/admin"
              className="hidden rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 lg:inline-flex"
            >
              ← Desktop Dashboard
            </a>

            <a
              href="/admin-mobile"
              className="inline-flex rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 lg:hidden"
            >
              ← Dashboard
            </a>
          </div>

          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
            Website Content
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#142019] sm:text-4xl">
            Homepage Banners
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
            Upload separate desktop and mobile images,
            then reposition and zoom each image before publishing.
          </p>
        </section>

        <form
          key={formKey}
          onSubmit={addBanner}
          className="mb-10 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-2xl font-extrabold text-[#142019]">
            Add Campaign Banner
          </h2>

          <p className="mt-2 text-sm text-[#647168]">
            Select the images, then use the framing editor to choose exactly what visitors will see.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="عنوان الإعلان بالعربي"
              value={titleAr}
              onChange={(event) =>
                setTitleAr(
                  event.target.value
                )
              }
              dir="rtl"
              required
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
            />

            <input
              type="text"
              placeholder="Campaign title"
              value={titleEn}
              onChange={(event) =>
                setTitleEn(
                  event.target.value
                )
              }
              required
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
            />

            <textarea
              placeholder="وصف مختصر للإعلان"
              value={textAr}
              onChange={(event) =>
                setTextAr(
                  event.target.value
                )
              }
              dir="rtl"
              className="min-h-28 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
            />

            <textarea
              placeholder="Short campaign description"
              value={textEn}
              onChange={(event) =>
                setTextEn(
                  event.target.value
                )
              }
              className="min-h-28 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
            />

            <input
              type="text"
              placeholder="تسوق الآن"
              value={buttonTextAr}
              onChange={(event) =>
                setButtonTextAr(
                  event.target.value
                )
              }
              dir="rtl"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
            />

            <input
              type="text"
              placeholder="Shop now"
              value={buttonTextEn}
              onChange={(event) =>
                setButtonTextEn(
                  event.target.value
                )
              }
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
            />
          </div>

          <input
            type="text"
            placeholder="/products/24"
            value={linkUrl}
            onChange={(event) =>
              setLinkUrl(
                event.target.value
              )
            }
            className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-black outline-none focus:border-[#0a583b] focus:bg-white"
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
              <span className="font-extrabold text-[#142019]">
                Desktop image
              </span>

              <input
                type="file"
                accept="image/*"
                required
                onChange={(event) =>
                  setDesktopImageFile(
                    event.target
                      .files?.[0] ||
                      null
                  )
                }
                className="mt-4 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-[#0a583b] file:px-4 file:py-2.5 file:font-extrabold file:text-white"
              />
            </label>

            <label className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
              <span className="font-extrabold text-[#142019]">
                Mobile image
              </span>

              <input
                type="file"
                accept="image/*"
                required
                onChange={(event) =>
                  setMobileImageFile(
                    event.target
                      .files?.[0] ||
                      null
                  )
                }
                className="mt-4 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-[#0a583b] file:px-4 file:py-2.5 file:font-extrabold file:text-white"
              />
            </label>
          </div>

          {(desktopPreviewUrl ||
            mobilePreviewUrl) && (
            <div className="mt-7 grid items-start gap-6 lg:grid-cols-2">
              {desktopPreviewUrl && (
                <CropEditor
                  title="Desktop framing"
                  description="Move the image horizontally or vertically and adjust its zoom."
                  imageUrl={
                    desktopPreviewUrl
                  }
                  alt={
                    titleEn ||
                    titleAr ||
                    "Desktop banner"
                  }
                  mode="desktop"
                  crop={
                    newDesktopCrop
                  }
                  onChange={(
                    property,
                    value
                  ) =>
                    updateNewCrop(
                      "desktop",
                      property,
                      value
                    )
                  }
                  onReset={() =>
                    setNewDesktopCrop({
                      ...DEFAULT_CROP,
                    })
                  }
                />
              )}

              {mobilePreviewUrl && (
                <CropEditor
                  title="Mobile framing"
                  description="This portrait preview matches the visible mobile banner area."
                  imageUrl={
                    mobilePreviewUrl
                  }
                  alt={
                    titleEn ||
                    titleAr ||
                    "Mobile banner"
                  }
                  mode="mobile"
                  crop={
                    newMobileCrop
                  }
                  onChange={(
                    property,
                    value
                  ) =>
                    updateNewCrop(
                      "mobile",
                      property,
                      value
                    )
                  }
                  onReset={() =>
                    setNewMobileCrop({
                      ...DEFAULT_CROP,
                    })
                  }
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 rounded-xl bg-[#0a583b] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#073f2c] disabled:bg-gray-400"
          >
            {loading
              ? "Uploading campaign..."
              : "Add Campaign Banner"}
          </button>
        </form>

        <section>
          <h2 className="text-2xl font-extrabold text-[#142019]">
            Existing Banners
          </h2>

          <p className="mt-1 text-sm text-[#647168]">
            {banners.length} banner
            {banners.length === 1
              ? ""
              : "s"}
          </p>

          <div className="mt-6 space-y-7">
            {banners.map(
              (banner) => {
                const bannerId =
                  Number(
                    banner.id
                  );

                const draft =
                  cropDrafts[
                    bannerId
                  ] ||
                  getBannerCropDraft(
                    banner
                  );

                return (
                  <article
                    key={
                      banner.id
                    }
                    className="overflow-hidden rounded-3xl border border-[#e7ebe8] bg-white shadow-sm"
                  >
                    <div className="grid items-start gap-5 bg-[#f7f8f6] p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                      <CropPreview
                        imageUrl={
                          banner.image_url
                        }
                        alt={
                          banner.title_en ||
                          banner.title_ar ||
                          "Banner"
                        }
                        mode="desktop"
                        crop={
                          draft.desktop
                        }
                      />

                      <CropPreview
                        imageUrl={
                          banner.image_url_mobile ||
                          banner.image_url
                        }
                        alt={
                          banner.title_en ||
                          banner.title_ar ||
                          "Banner"
                        }
                        mode="mobile"
                        crop={
                          draft.mobile
                        }
                      />
                    </div>

                    <div className="p-6 sm:p-7">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-extrabold text-[#142019] sm:text-2xl">
                          {banner.title_en ||
                            banner.title_ar ||
                            banner.title}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                            banner.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {banner.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <details className="mt-6 rounded-2xl border border-[#e7ebe8] bg-[#f9faf9]">
                        <summary className="cursor-pointer px-5 py-4 font-extrabold text-[#0a583b]">
                          Adjust image framing
                        </summary>

                        <div className="border-t border-[#e7ebe8] p-5">
                          <p className="mb-5 text-sm leading-6 text-[#647168]">
                            These controls do not modify or crop the original image. They only choose which part is visible inside the banner.
                          </p>

                          <div className="grid items-start gap-6 lg:grid-cols-2">
                            <CropEditor
                              title="Desktop framing"
                              description="Preview for the desktop homepage banner."
                              imageUrl={
                                banner.image_url
                              }
                              alt={
                                banner.title_en ||
                                banner.title_ar ||
                                "Desktop banner"
                              }
                              mode="desktop"
                              crop={
                                draft.desktop
                              }
                              onChange={(
                                property,
                                value
                              ) =>
                                updateBannerCrop(
                                  banner,
                                  "desktop",
                                  property,
                                  value
                                )
                              }
                              onReset={() =>
                                setCropDrafts(
                                  (
                                    current
                                  ) => ({
                                    ...current,

                                    [bannerId]:
                                      {
                                        ...draft,

                                        desktop:
                                          {
                                            ...DEFAULT_CROP,
                                          },
                                      },
                                  })
                                )
                              }
                            />

                            <CropEditor
                              title="Mobile framing"
                              description="Preview for the mobile homepage banner."
                              imageUrl={
                                banner.image_url_mobile ||
                                banner.image_url
                              }
                              alt={
                                banner.title_en ||
                                banner.title_ar ||
                                "Mobile banner"
                              }
                              mode="mobile"
                              crop={
                                draft.mobile
                              }
                              onChange={(
                                property,
                                value
                              ) =>
                                updateBannerCrop(
                                  banner,
                                  "mobile",
                                  property,
                                  value
                                )
                              }
                              onReset={() =>
                                setCropDrafts(
                                  (
                                    current
                                  ) => ({
                                    ...current,

                                    [bannerId]:
                                      {
                                        ...draft,

                                        mobile:
                                          {
                                            ...DEFAULT_CROP,
                                          },
                                      },
                                  })
                                )
                              }
                            />
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                saveBannerCrop(
                                  banner
                                )
                              }
                              disabled={
                                savingCropId ===
                                bannerId
                              }
                              className="rounded-xl bg-[#0a583b] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#073f2c] disabled:bg-gray-400"
                            >
                              {savingCropId ===
                              bannerId
                                ? "Saving..."
                                : "Save framing"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                resetBannerCrop(
                                  bannerId
                                )
                              }
                              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-extrabold text-gray-700 hover:border-[#0a583b] hover:text-[#0a583b]"
                            >
                              Reset both
                            </button>
                          </div>
                        </div>
                      </details>

                      <p className="mt-5 break-all text-sm font-bold text-[#647168]">
                        Link:{" "}
                        {banner.link_url ||
                          "/products"}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            toggleActive(
                              banner
                            )
                          }
                          className={`rounded-xl px-5 py-3 text-sm font-extrabold text-white ${
                            banner.is_active
                              ? "bg-orange-500 hover:bg-orange-600"
                              : "bg-[#0a583b] hover:bg-[#073f2c]"
                          }`}
                        >
                          {banner.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteBanner(
                              banner.id
                            )
                          }
                          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>
      </div>
    </main>
  );
}