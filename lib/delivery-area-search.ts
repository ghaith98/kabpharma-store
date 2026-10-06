export type SearchableDeliveryArea = {
  id: number | string;
  area_name: string;
  area_name_ar?: string | null;
  area_name_en?: string | null;
};

export function normalizeAreaSearch(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .replace(/[-\s]+/g, " ")
    .trim();
}

export function filterDeliveryAreas<T extends SearchableDeliveryArea>(
  areas: T[],
  query: string,
): T[] {
  const words = normalizeAreaSearch(query).split(" ").filter(Boolean);
  return areas.filter((area) => {
    const names = normalizeAreaSearch(
      [area.area_name, area.area_name_ar, area.area_name_en].filter(Boolean).join(" "),
    );
    return words.every((word) => names.includes(word));
  });
}
