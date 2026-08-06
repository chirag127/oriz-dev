# oriz·dev — developer multitool

**Live:** https://dev.oriz.in

A keyboard-first **terminal** for everyday dev chores. Ten tools, one page, zero servers.

> **100% client-side. No upload. No signup. No key.** Every byte you paste stays in your browser tab.

## Tools

| # | tool | what it does |
|---|------|--------------|
| 1 | **JSON** | format · validate · minify (native `JSON.parse`) |
| 2 | **Base64** | UTF-8-safe encode / decode |
| 3 | **JWT** | decode header + payload, exp check (no signature secret sent) |
| 4 | **URL** | encode / decode components |
| 5 | **UUID** | crypto v4, bulk generate |
| 6 | **Timestamp** | epoch ⇄ ISO ⇄ local, live clock, relative time |
| 7 | **Cron** | explain a 5-field schedule in plain English |
| 8 | **Hash** | SHA-1/256/384/512 over text or a dropped file (`crypto.subtle`) |
| 9 | **Diff** | line-level LCS diff with +/- stats |
| 0 | **Regex** | live tester (matches, groups, highlight) + AI-generate from a description |

Press **0–9** to switch tools.

## AI (optional polish)

Explain a regex / JWT payload / cron expression, or generate a regex from a description — powered by the shared [`@chirag127/oz-ai`](https://github.com/chirag127/design-system) package (wraps **g4f / gpt4free** with multi-provider failover, no API key). If every provider is down, the core tools still work; AI is never required.

## Privacy

Nothing is uploaded. All parsing, hashing, and diffing runs locally with native browser APIs (`JSON.parse`, `atob`/`btoa`, `TextEncoder`, `crypto.subtle`, `crypto.randomUUID`, `Intl`, `RegExp`). Heavy code paths lazy-load only on use.

## Stack

Static **Astro** + small **React 19** islands, **Tailwind v4**, shared `@chirag127/oz-*` design packages. Hosted on Cloudflare Pages.

## Develop

```bash
npm install --legacy-peer-deps
npm run dev      # local
npm run test     # vitest — pure logic
npm run build    # static dist/
npm run deploy   # build + wrangler pages deploy
```

## License

MIT © 2026 Chirag Singhal
