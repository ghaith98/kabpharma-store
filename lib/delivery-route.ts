import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeDeliveryLocation } from "./delivery-location";

export const DELIVERY_ORIGIN = { latitude: 33.5000717, longitude: 36.2741384 };
export const DELIVERY_BASE_FEE = 500;
export const DELIVERY_PER_KM = 25;
export const DELIVERY_HOLD_MS = 30 * 60 * 1000;
export type RoadDelivery = {
  latitude: number; longitude: number; distanceMeters: number; fee: number;
  area: string; governorate: string; countryCode: string; profileId: number;
  expiresAt: number; tariff: "kab-road-v1";
};
export function roadDeliveryFee(distanceMeters: number) {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) throw new Error("DELIVERY_ROUTE_INVALID");
  return Math.round(DELIVERY_BASE_FEE + distanceMeters / 1000 * DELIVERY_PER_KM);
}
function secret() {
  const key = process.env.CUSTOMER_SESSION_SECRET;
  if (!key || key.length < 32) throw new Error("DELIVERY_NOT_CONFIGURED");
  return key;
}
function signature(payload: string) { return createHmac("sha256", secret()).update(`kab-road-delivery:${payload}`).digest("base64url"); }
export function createDeliveryReceipt(data: RoadDelivery) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function readDeliveryReceipt(token: unknown, location: unknown, profileId: number | null, now = Date.now()): RoadDelivery | null {
  try {
    if (typeof token !== "string" || token.length > 6000 || !profileId) return null;
    const parts = token.split("."); if (parts.length !== 2) return null;
    const expected = Buffer.from(signature(parts[0])); const actual = Buffer.from(parts[1]);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as RoadDelivery;
    const point = normalizeDeliveryLocation(location);
    if (!point || !("latitude" in point) || point.latitude !== data.latitude || point.longitude !== data.longitude
      || data.profileId !== profileId || data.tariff !== "kab-road-v1" || data.countryCode !== "sy"
      || !Number.isSafeInteger(data.expiresAt) || data.expiresAt <= now || data.expiresAt > now + DELIVERY_HOLD_MS + 60000
      || data.fee !== roadDeliveryFee(data.distanceMeters)) return null;
    return data;
  } catch { return null; }
}

async function geoapify(path: string, params: Record<string, string>) {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) throw new Error("DELIVERY_NOT_CONFIGURED");
  const url = new URL(`https://api.geoapify.com/v1/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("apiKey", key);
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("DELIVERY_PROVIDER_UNAVAILABLE");
    return await response.json();
  } catch { throw new Error("DELIVERY_PROVIDER_UNAVAILABLE"); }
}
export async function resolveRoadDelivery(location: unknown, profileId: number, language: "ar" | "en"): Promise<RoadDelivery> {
  const point = normalizeDeliveryLocation(location);
  if (!point || !("latitude" in point)) throw new Error("DELIVERY_LOCATION_REQUIRED");
  // Sequential: avoid paying for a route when the address is outside Syria.
  const reverse = await geoapify("geocode/reverse", {lat: String(point.latitude), lon: String(point.longitude), lang: language, format: "json"});
  const address = reverse.results?.[0];
  if (!address) throw new Error("DELIVERY_ADDRESS_UNAVAILABLE");
  if (address.country_code !== "sy") throw new Error("DELIVERY_OUTSIDE_SYRIA");
  const routed = await geoapify("routing", {
    waypoints: `${DELIVERY_ORIGIN.latitude},${DELIVERY_ORIGIN.longitude}|${point.latitude},${point.longitude}`,
    mode: "drive", type: "short", units: "metric", format: "json",
  });
  const route = routed.results?.[0];
  if (!route || route.distance_units !== "Meters" || typeof route.distance !== "number" || !Number.isFinite(route.distance) || route.distance < 0) throw new Error("DELIVERY_ROUTE_UNAVAILABLE");
  const distanceMeters = Math.round(route.distance);
  return {
    latitude: point.latitude, longitude: point.longitude, distanceMeters, fee: roadDeliveryFee(distanceMeters),
    area: String(address.suburb || address.neighbourhood || address.quarter || address.district || address.city || "").slice(0, 150),
    governorate: String(address.state || address.county || address.city || "").slice(0, 100),
    countryCode: "sy", profileId, expiresAt: Date.now() + DELIVERY_HOLD_MS, tariff: "kab-road-v1",
  };
}
export function deliveryPricingSnapshot(data: RoadDelivery) {
  return { provider: "geoapify", mode: "drive", routeType: "short", origin: DELIVERY_ORIGIN,
    distanceMeters: data.distanceMeters, baseFee: DELIVERY_BASE_FEE, perKm: DELIVERY_PER_KM,
    quotedFee: data.fee, tariff: data.tariff };
}
