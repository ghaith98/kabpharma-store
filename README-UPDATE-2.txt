KAB Pharma — Update 2 (language cookie, product pagination, admin clean-up)

This zip contains ONLY the changed and new files. It deliberately does NOT
contain package.json / package-lock.json (keeps your npm audit fixes).

Many files MOVED to new folders (app\[lang]\... and app\(backoffice)\...).
The old copies must be deleted first, otherwise Next.js finds two versions
of the same page and the build fails.

1. Back up your project folder (copy it somewhere safe).
2. Copy cleanup-old-files.ps1 into your project folder, then in the
   terminal (inside the project folder) run:
       powershell -ExecutionPolicy Bypass -File .\cleanup-old-files.ps1
3. Copy everything else from this zip into your project folder,
   choosing "Replace" when asked.
4. npm run check
5. npm run dev and test (see the checklist in the chat).
