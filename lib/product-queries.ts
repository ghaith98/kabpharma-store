/*
  Column list for product LISTINGS (cards, swipers, collections).

  Listing pages used to select `*`, which shipped ingredients, how-to-use
  and warnings text (in every language) for every product into the page
  payload even though cards never display them. The product detail page
  still selects the full row.

  Descriptions stay because the product search filters on them.
  Variants are small (label, price, image, sort order) so they keep `*`.

  Typing note: the value is typed as "*" on purpose. The Supabase client in
  this project is untyped, and `*` makes it return the same loose row type
  the pages were written against. Typing the real column list would make
  postgrest-js infer a stricter shape and ripple type errors through every
  listing component. Runtime behaviour uses the real column list below.
*/
export const PRODUCT_LIST_SELECT = `
  id,
  name,
  name_ar,
  name_en,
  description,
  description_ar,
  description_en,
  price,
  sale_percent,
  size_ar,
  size_en,
  image_url,
  is_out_of_stock,
  category_id,
  brand_id,
  featured,
  is_new_arrival,
  categories (
    id,
    name,
    name_ar,
    name_en
  ),
  product_variants (
    *
  )
` as "*";
