# Option descriptions and ingredients

Before deploying this update, run
`supabase/migrations/202611100001_variant_description_ingredients.sql`
in the SQL Editor of the main Supabase project.

In **Admin → Products**, add or edit a product. Under an option, open
**Option description & ingredients (optional)**. You can fill in any of
the four Arabic and English fields, then save the product.

The product page changes its description and ingredients when the shopper
selects a different option. Each blank field uses the main product's
text, so existing options can keep sharing the same description and
ingredients. To restore the main text, clear the option's field and save.
Use the main product fields for its main size or for a product with no options.

Editing a retained option keeps its ID, including when only its text changes.
