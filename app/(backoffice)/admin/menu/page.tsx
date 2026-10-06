"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import {
  HIDEABLE_MENU_LINKS,
  MENU_VISIBILITY_SETTING_KEY,
  parseHiddenMenuLinks,
  serializeHiddenMenuLinks,
} from "@/lib/menu-visibility";

/*
  Admin > Menu Links.

  Show or hide the links of the store menu (top bar on desktop, the menu
  button on mobile, and the same links in the footer). Each switch saves
  right away. Hiding a link does not close its page.
*/
export default function AdminMenuLinksPage() {
  const [hidden, setHidden] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingHref, setSavingHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", MENU_VISIBILITY_SETTING_KEY)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        alert(error.message);
      } else {
        setHidden(parseHiddenMenuLinks(data?.value));
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function setLinkVisible(href: string, visible: boolean) {
    const previous = hidden;
    const next = visible
      ? hidden.filter((item) => item !== href)
      : [...hidden.filter((item) => item !== href), href];

    setHidden(next);
    setSavingHref(href);

    const { error } = await supabase.from("settings").upsert({
      key: MENU_VISIBILITY_SETTING_KEY,
      value: serializeHiddenMenuLinks(next),
      updated_at: new Date().toISOString(),
    });

    setSavingHref(null);

    if (error) {
      setHidden(previous);
      alert(error.message);
    }
  }

  const hiddenCount = hidden.length;

  return (
    <main className="min-h-screen bg-[#f7f8f6] p-4 sm:p-7">
      <div className="mx-auto max-w-3xl">
        <section className="mb-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
            Content
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#142019]">
            Menu Links
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#647168]">
            Choose which links customers see in the store menu: the top bar
            on desktop, the menu button on mobile, and the same links in the
            footer.
          </p>

          <div className="mt-4 rounded-2xl border border-[#dce8df] bg-[#eef6f0] p-4 text-sm leading-6 text-[#385342]">
            <p>
              <strong>Hiding a link does not close the page.</strong> The page
              still opens for anyone who has its address, so you can keep
              working on it and check it yourself.
            </p>

            <p className="mt-1">
              Each switch saves right away. The store can take up to a minute
              to show the change.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.5rem] border border-[#e1e8e3] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#edf1ee] px-5 py-4">
            <div>
              <p className="font-extrabold text-[#142019]">Home</p>
              <p className="mt-0.5 text-xs font-bold text-[#738078]" dir="ltr">
                /
              </p>
            </div>

            <span className="text-xs font-extrabold text-[#738078]">
              Always shown
            </span>
          </div>

          {HIDEABLE_MENU_LINKS.map((link) => {
            const visible = !hidden.includes(link.href);
            const saving = savingHref === link.href;

            return (
              <div
                key={link.href}
                className="flex items-center justify-between gap-4 border-b border-[#edf1ee] px-5 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-extrabold text-[#142019]">
                    {link.label}
                    <span
                      dir="rtl"
                      className="ms-2 text-sm font-bold text-[#0a583b]"
                    >
                      {link.labelAr}
                    </span>
                  </p>

                  <p
                    className="mt-0.5 text-xs font-bold text-[#738078]"
                    dir="ltr"
                  >
                    {link.href}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`text-xs font-extrabold ${
                      visible ? "text-[#0a583b]" : "text-[#b4541a]"
                    }`}
                  >
                    {saving ? "Saving..." : visible ? "Shown" : "Hidden"}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={visible}
                    aria-label={`Show ${link.label} in the menu`}
                    disabled={loading || savingHref !== null}
                    onClick={() =>
                      void setLinkVisible(link.href, !visible)
                    }
                    className={`relative h-7 w-12 rounded-full transition disabled:opacity-60 ${
                      visible ? "bg-[#0a583b]" : "bg-[#cfd6d1]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        visible ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <p className="mt-4 text-sm font-bold text-[#647168]">
          {loading
            ? "Loading..."
            : hiddenCount === 0
              ? "All links are shown."
              : `${hiddenCount} link${hiddenCount === 1 ? "" : "s"} hidden.`}
        </p>
      </div>
    </main>
  );
}
