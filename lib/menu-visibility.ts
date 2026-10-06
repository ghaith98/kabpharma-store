/*
  Menu links the admin can hide (Admin > Menu Links).

  Hiding a link removes it from the top bar, the mobile menu and the footer.
  It does NOT close the page: anyone with the address can still open it.

  The choice is stored as one row in the `settings` table:
    key   = "hidden_menu_links"
    value = JSON list of the hidden links, e.g. ["/brands","/about"]
*/

export const MENU_VISIBILITY_SETTING_KEY = "hidden_menu_links";

export const HIDEABLE_MENU_LINKS = [
  { href: "/products", label: "Products", labelAr: "المنتجات" },
  { href: "/brands", label: "Brands", labelAr: "العلامات التجارية" },
  { href: "/best-sellers", label: "Best Sellers", labelAr: "الأكثر مبيعاً" },
  { href: "/new-arrivals", label: "New Arrivals", labelAr: "وصل حديثاً" },
  { href: "/about", label: "About us", labelAr: "عن الشركة" },
  { href: "/contact", label: "Contact us", labelAr: "تواصل معنا" },
] as const;

const HIDEABLE_HREFS: readonly string[] = HIDEABLE_MENU_LINKS.map(
  (link) => link.href
);

/** Reads the stored value safely. Anything unexpected = nothing hidden. */
export function parseHiddenMenuLinks(value: unknown): string[] {
  let list: unknown = value;

  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(list)) {
    return [];
  }

  return HIDEABLE_HREFS.filter((href) => list.includes(href));
}

export function serializeHiddenMenuLinks(hrefs: string[]) {
  return JSON.stringify(
    HIDEABLE_HREFS.filter((href) => hrefs.includes(href))
  );
}
