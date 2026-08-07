# PWABuilder — oriz DevTools

Live: https://dev.oriz.in
Android package id: `in.oriz.dev`
Signing SHA-256: `0C:82:DB:11:57:7E:21:8D:62:1E:54:DF:3B:33:D1:29:6E:77:56:80:36:22:C1:99:36:DF:03:D3:6F:0D:30:36`

## Package for stores

1. PWABuilder.com -> enter `https://dev.oriz.in` -> **Package For Stores**
2. **Android** — use the existing signing key, package `in.oriz.dev` (the SHA-256 above is already in `/.well-known/assetlinks.json` for TWA verification). / **Windows** / **iOS**.

## PWA surface

- Manifest: `/manifest.webmanifest` (name "oriz DevTools", `standalone`, theme `#050706`, categories `["tools"]`)
- Icons: `public/icons/` — 192/256/384/512 PNG (`purpose:any`), `maskable-512.png` (`purpose:maskable`, safe-zone), `icon.svg`
- Screenshots: `public/screenshots/` — `desktop.png` (wide 1280x800), `mobile.png` (narrow 390x844)
- Service worker: `@vite-pwa/astro` (Workbox) — precache app shell, NetworkFirst on g4f/pollinations AI calls
- Digital Asset Links: `public/.well-known/assetlinks.json`

Regenerate icons: `node scripts/gen-icons.mjs`.
