import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KAB Pharma",
    short_name: "KAB Pharma",
    description:
      "KAB Pharma skincare, haircare and personal care store.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a583b",
    dir: "auto",
    lang: "ar",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
