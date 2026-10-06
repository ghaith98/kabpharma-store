export const COD_FEE_SYP = 50;
export const MAX_CART_ITEMS = 50;
export const MAX_ITEM_QUANTITY = 99;
export const MAX_PAYMENT_PROOF_BYTES =
  8 * 1024 * 1024;

/*
  Sham Cash transfers.

  UNDERPAYMENT: how much LESS than the order total a transfer may be and
  still be accepted. 0 = the transfer must cover the whole total.
  (This used to be 100 SYP, which let anyone pay 100 SYP less on every
  order.)

  OVERPAYMENT: how much MORE than the total is still accepted. A much
  bigger transfer is refused, because it is probably a different transfer
  (possibly another customer's), not this order's payment.

  MAX_AGE: a transfer older than this cannot be attached to a new order.
*/
export const SHAMCASH_MAX_UNDERPAYMENT_SYP = 0;
export const SHAMCASH_MAX_OVERPAYMENT_SYP = 100;
export const SHAMCASH_MAX_AGE_HOURS = 72;
