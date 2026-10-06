# Promotions, coupons and pricing

How prices, promotions and coupons work in the KAB Pharma store after the
promotions update. Written for the store owner; the code is in `lib/pricing/`.

## One calculator

Every amount the customer sees or pays comes from one calculator on the
server (`lib/pricing/engine.ts`).

- The cart, checkout and payment pages ask `POST /api/customer/quote` and
  show what it answers. They no longer do their own maths.
- Both order routes (Sham Cash and cash on delivery) run the same
  calculator, so the total on the payment page is the total charged.
- The cart in the browser only remembers what was added (product, size,
  quantity). Prices are always read fresh from the database.

## The rules, in order

1. **Sale price.** An item's price is its normal price minus the bigger of
   the product's own sale % and any flash sale that is running on it. The
   two are never added together.
2. **Automatic promotions** ("buy X get Y" and quantity discounts).
   - Counted per product and per size. Sizes and products are never mixed.
   - Items with a sale or flash-sale price are skipped.
   - An item gets one promotion at a time: the one that saves the customer
     the most. On a tie, the narrower one wins (size, then product, then
     category, then brand, then all products).
3. **Coupon.**
   - Discounts only the items that did not get a promotion, unless that
     promotion has "a coupon can be used on top" switched on.
   - Skips sale items unless the coupon has "also applies to items on
     sale" switched on.
   - The minimum order is compared with what the products cost after
     promotions.
4. **Delivery.** Free when the store's free-delivery amount is reached
   (after promotions and coupon), or a free-delivery promotion is running,
   or a free-delivery coupon is used. A free-delivery coupon is not spent
   when delivery is already free.

## Promotion types (Admin > Promotions)

| Type | What it does |
|---|---|
| Buy X, get Y | Buy X, get Y at a discount you choose. 100% = free: the free items are added to the order automatically (customer adds X, receives X + Y). Below 100% the customer puts X + Y in the cart and Y of them get the discount. Optional limit of times per product in one order. |
| Quantity discount | Buy N or more of one product and size, get P% off each. Up to 5 steps, each bigger quantity with a bigger discount. |
| Flash sale | P% off between two dates. Shown as a sale price everywhere, with a countdown on the product page. Applies to whole products (all sizes). Needs an end date. |
| Free delivery | Delivery is free between two dates, optionally only from a minimum order. |

Each of the first three can be for one product (all sizes or chosen
sizes), a category, a brand, or all products.

## Coupon types (Admin > Coupons)

| Type | What it does |
|---|---|
| Percentage | P% off the items it applies to, with an optional maximum. |
| Fixed amount | A fixed amount off the items it applies to (never more than they cost). |
| Free delivery | No delivery fee for the order. |

## Price hold (30 minutes)

When the payment page shows a total, that price is held for 30 minutes.
If a flash sale ends while the customer is making the Sham Cash transfer,
the order is still created at the total they saw. After 30 minutes, or if
a price was changed by hand, the customer is told the new total instead of
being charged an amount they did not see.

Pausing or deleting a promotion in the admin panel ends it at once, also
for held prices.

## Timing

- Cart, checkout, payment and orders are always exact.
- Product cards and pages are cached for up to a minute. Saving a promotion
  in the admin panel asks them to refresh right away. A scheduled promotion
  that starts by itself can take up to a minute to appear on cards; a flash
  sale's end is exact (the price changes back in the open page).

## Saved orders

Orders keep storing free items as ordinary items of the same line, with
their value inside the order's discount, exactly as before. Admin orders,
the printed invoice and the customer's order page show promotion discount
and coupon discount on separate lines.
