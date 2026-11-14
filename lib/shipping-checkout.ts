import { COD_FEE_SYP } from "./commerce-config";

export function isQadmusPickup(governorate: string): boolean {
  const key = governorate.trim().toLowerCase();
  return Boolean(key) && !["damascus", "دمشق"].includes(key);
}

export function cashOnDeliveryFee(governorate: string): number {
  return governorate.trim() && !isQadmusPickup(governorate) ? COD_FEE_SYP : 0;
}

export function hasThreePartName(name: string): boolean {
  return name.trim().split(/\s+/).filter(part => /\p{L}/u.test(part)).length >= 3;
}
