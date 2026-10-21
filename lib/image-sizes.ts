/** Browser image-width hints, in CSS pixels. Keep in sync with the matching
 * layout's padding, gaps, column counts and max-width. Next.js still chooses
 * an appropriate source resolution for the device pixel ratio.
 */
export const PRODUCT_GRID_FOUR_SIZES =
  "(min-width: 1720px) 390px, (min-width: 1024px) calc((100vw - 160px) / 4), (min-width: 640px) calc((100vw - 72px) / 2), calc((100vw - 48px) / 2)";

export const PRODUCT_GRID_STANDARD_SIZES =
  "(min-width: 1720px) 390px, (min-width: 1280px) calc((100vw - 160px) / 4), (min-width: 1024px) calc((100vw - 128px) / 3), (min-width: 640px) calc((100vw - 72px) / 2), calc((100vw - 48px) / 2)";

// Home sections: max-width 1440, with 16/24/32px horizontal padding.
// The fractions and gaps match ProductSwiper's Swiper breakpoints.
export const HOME_PRODUCT_SWIPER_SIZES =
  "(min-width: 1440px) 329px, (min-width: 1280px) calc((100vw - 124px) / 4), (min-width: 1024px) calc((100vw - 109px) / 3.25), (min-width: 768px) calc((100vw - 76.8px) / 2.6), (min-width: 640px) calc((100vw - 67.2px) / 2.2), (min-width: 480px) calc((100vw - 43.2px) / 1.8), calc((100vw - 39.7px) / 1.55)";

// Product page: max-width 1400 inside the page's responsive padding.
export const RELATED_PRODUCT_SWIPER_SIZES =
  "(min-width: 1464px) 335px, (min-width: 1280px) calc((100vw - 124px) / 4), (min-width: 1024px) calc((100vw - 109px) / 3.25), (min-width: 768px) calc((100vw - 76.8px) / 2.6), (min-width: 640px) calc((100vw - 67.2px) / 2.2), (min-width: 480px) calc((100vw - 43.2px) / 1.8), calc((100vw - 39.7px) / 1.55)";

// ProductDetailsClient's 1.08fr / 0.92fr grid, after its 48/64px gap.
// Gallery negative margins make it full-bleed below md (768px).
export const PRODUCT_GALLERY_SIZES =
  "(min-width: 1464px) 721.44px, (min-width: 1280px) calc(54vw - 69.12px), (min-width: 1024px) calc(54vw - 60.48px), (min-width: 768px) calc(100vw - 48px), 100vw";

// A discovery banner spans two columns of the four-column collection grid.
// Below lg, the grid has only two columns, so the banner fills the row.
export const DISCOVERY_BANNER_SIZES =
  "(min-width: 1720px) 812px, (min-width: 1024px) calc((100vw - 96px) / 2), (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)";
