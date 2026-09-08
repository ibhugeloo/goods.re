# Goods

Local-first personal archive for **objects you own** and **objects you want**.

No account. No server. The collection lives in your browser (IndexedDB) and can be exported as JSON.

This is an early public snapshot of [goods.re](https://goods.re) — the domain is not live yet.

## What it does

- Two first-class views, **owned** and **wishlist**, plus **suggestions** for things you are only
  considering — one tap promotes a suggestion to the wishlist
- Filter by category and brand, search, add / edit / delete
- Click a card to open its read view: notes, location, warranty, retailer, product link — editing is
  the secondary action, not the only one
- Warranty pill when a guarantee expires within 90 days or has lapsed; price gap against your target
  on wanted items
- Track price, current value, target price, condition, location, warranty
- Import and export the whole collection as JSON, on desktop and on mobile
- Sample catalog on first visit only. Remove the examples or empty the collection and it stays empty —
  the demo is never silently restored
- Deleting an item and replacing the collection through an import both ask for confirmation
- Installable: web app manifest and a service worker that keeps the shell offline without pinning an
  old build (navigation is network-first)

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build
npm run preview
```

The service worker only registers in production builds, so `npm run dev` keeps hot reload intact.

## Stack

React 19 · Vite 6 · IndexedDB · Phosphor icons

## License

MIT © Idriss Bhugeloo
