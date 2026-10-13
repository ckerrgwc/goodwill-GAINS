# GAINS — Thrift POS & Inventory

A single-page web app for running a thrift store floor: back-room intake and
pricing, printable barcoded price tags, live inventory management, and a
front-counter register.

Built with React 18, Vite and Tailwind CSS. All data lives in the browser
(`localStorage`), pre-loaded with 16 realistic demo items so every screen works
immediately. Use **Reset demo** in the header to start over.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pricing / tag rotation / barcode unit tests
npm run build    # static bundle in dist/
```

## Modules

| Tab (shortcut) | What it does |
| --- | --- |
| **Register** (F1) | Scanner field (USB scanners work — they type the ID + Enter), simulated scan, item lookup, cart with automatic tag-color markdowns, 6% tax, cash (tendered/change) or card payment, printable receipt. Sold / damaged / unknown items are rejected with a clear error and a buzz. |
| **Inventory** (F2) | Stats, searchable table, filters (department, status, tag color, date range), per-row and bulk *Damaged / Lost / Return to stock*, item detail with history, reprice and tag reprint. Tag rotation panel with one-click store-wide markdowns (25/50/75% off a color). |
| **Intake & Pricing** (F3) | Separate Clothing (category, brand, tier, size, gender, condition) and Household (type, material, condition, estimated value) flows, live price suggestion with a step-by-step breakdown, optional override, live tag preview, print, and "Similar item" for fast batch intake. |

## How pricing works (`src/lib/pricing.js`)

- **Clothing:** category base price × brand tier (Value 0.75, Mid-tier 1.0,
  Premium 2.25) × condition (New with Tags 1.6 … Poor 0.4). Known brands
  auto-select their tier.
- **Household:** estimated new retail value × resale ratio for the type ×
  material multiplier × condition.
- Results round to thrift price points ($x.99; $0.49/$0.99 under a dollar).

All tables are plain objects at the top of the file — tune them to your store.

## Tag colors (`src/lib/tags.js`)

Five colors rotate weekly (Monday–Sunday): Blue → Green → Yellow → Pink →
Orange. An item's color is set by its intake date. In-stock items older than
the current five-week window are flagged **Pull — past rotation**, since their
color is about to come back around.

## Barcodes

Tags and receipts use real **Code 39** barcodes rendered as SVG, which any
standard retail scanner reads without configuration. Item IDs are
`CL-#####` (clothing) and `HH-#####` (household); the register also accepts
lowercase or dash-less input (`cl10001`).

## Data model

Each item tracks `id`, `name`, `category`, `type` (Clothing/Household),
`brand_or_material`, `condition`, `price`, `tag_color`, `status`
(In Stock / Sold / Damaged / Lost) and `date_entered`, plus department
attributes, sale info (`sold_at`, `sold_price`, `transaction_id`) and an
audit `history`. State is managed by a single reducer in `src/store.jsx`.
