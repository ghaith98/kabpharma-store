Membership carousel and brands banner revision

Replace project files, keeping your .env.local. No new SQL or dependencies.

- Carousel viewport uses LTR positioning; Arabic card copy keeps RTL.
- Equal repeated groups cover at least the full viewport width.
- Negative animation delay starts the continuous strip halfway through its cycle.
- Desktop hover pause, mobile movement and reduced-motion settings retained.
- Membership section has tighter spacing below the login link.
- Brands campaign keeps the main banner component, with copy shifted left 32px on tablet/88px on desktop.
- Previous product-loading, out-of-stock, homepage-order and bilingual updates retained.

Validated: TypeScript, focused lint, product-loading/order behavior, membership guest/member state.
Live visual appearance should be checked after deployment.
