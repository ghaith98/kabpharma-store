export type DeliveryLocation = { latitude: number; longitude: number; accuracy?: number } | { url: string };

export function normalizeDeliveryLocation(value: unknown): DeliveryLocation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.url === "string") {
    const raw = data.url.trim();
    if (raw.length > 2048) return null;
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
      const allowed = url.hostname === "maps.app.goo.gl" && url.pathname.length > 1
        || url.hostname === "goo.gl" && url.pathname.startsWith("/maps/")
        || ["google.com", "www.google.com", "maps.google.com"].includes(url.hostname)
          && (url.pathname === "/maps" || url.pathname.startsWith("/maps/") || url.hostname === "maps.google.com");
      return allowed ? { url: url.href } : null;
    } catch { return null; }
  }
  const { latitude, longitude, accuracy } = data;
  if (typeof latitude !== "number" || typeof longitude !== "number"
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude, ...(typeof accuracy === "number" && Number.isFinite(accuracy) && accuracy >= 0 ? { accuracy } : {}) };
}

export function deliveryLocationUrl(value: unknown): string | null {
  const location = normalizeDeliveryLocation(value);
  if (!location) return null;
  return "url" in location ? location.url
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`;
}

/** Accept coordinates or a Google Maps URL with an explicit destination.
 * Short links and map viewport (@lat,lon) alone do not identify the destination.
 * No arbitrary URL is fetched by the server.
 */
export function parseDeliveryPoint(text: string): DeliveryLocation | null {
  const pair = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
  if (pair) return normalizeDeliveryLocation({latitude: Number(pair[1]), longitude: Number(pair[2])});
  const safe = normalizeDeliveryLocation({url: text});
  if (!safe || !("url" in safe)) return null;
  const url = new URL(safe.url);
  for (const name of ["query", "q", "destination"]) {
    const value = url.searchParams.get(name);
    if (value && /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/.test(value)) return parseDeliveryPoint(value);
  }
  if (url.pathname.startsWith("/maps/dir/")) return null;
  const point = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(url.pathname);
  return point ? normalizeDeliveryLocation({latitude: Number(point[1]), longitude: Number(point[2])}) : null;
}

export type DeliveryEstimate = {
  receipt: string; distanceMeters: number; fee: number; area: string;
  governorate: string; expiresAt: number;
};
