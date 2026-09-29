import { notFound } from "next/navigation";

// Any storefront URL that doesn't match a page shows the storefront 404
// (with navbar and footer, in the visitor's language).
export default function CatchAllNotFound() {
  notFound();
}
