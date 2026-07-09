# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Shopee-homepage clone ("Công ty TNHH Saigon Ve Wong") with a static HTML/CSS/vanilla-JS frontend and a small Node.js + Express + SQLite backend that adds real accounts and a per-account cart. Product listings themselves are still static markup, not database-backed.

## Running the project

```
npm install
npm start
```

Serves the whole site (frontend + API) at `http://localhost:3000` (override with `PORT`). [.claude/launch.json](.claude/launch.json) runs this same command for the preview tool. The SQLite file is created on first run at `data/app.db` (gitignored, along with `node_modules/`).

No lint, test, or build step exists in this repo.

## Architecture

**Frontend** — [index.html](index.html) is the entire page markup (header/navbar, search, category sidebar, product grid, footer, auth modal). No templating; all 10 product cards are duplicated markup sharing one `data-product-id="p1"` (they're identical placeholder content, so the cart treats them as one product).

- `asset/css/` cascade order (see `<link>` tags in `index.html`): [grid.css](asset/css/grid.css) (12-col flex grid `.grid/.row/.col/.c-N`, plus a legacy `.grid__column-N` system — prefer the former) → [base.css](asset/css/base.css) (`:root` variables, resets, `.modal`/`[hidden]` overrides) → [main.css](asset/css/main.css) (BEM component styles) → [responsive.css](asset/css/responsive.css).
- [asset/js/main.js](asset/js/main.js) — all client-side behavior, plain vanilla JS, no build step, loaded via `<script defer>`. Sections: auth modal (open/close/switch, wired to `#register-*`/`#login-*` form fields), navbar auth-state toggle (`setAuthState`), cart rendering/add/remove backed by `fetch` calls to the API below, plus cosmetic UI (like-toggle, sort/filter/category active-state, pagination) that has no server backing.
- Most dropdowns (notify, QR, user menu, search history) are pure CSS `:hover`/`:focus` — no JS involved. Elements meant to be JS-toggled via the `hidden` attribute (`.modal`, `.header__navbar-item`) need an explicit `[hidden] { display: none }` override in `base.css` because they already set `display: flex` — remember this pattern if adding new toggleable elements.

**Backend** — [server/server.js](server/server.js) is an Express app: JSON body parsing, `express-session` (in-memory store, cookie-based, dev secret — fine for local use only), API routes, then `express.static` serving the project root (so the same server hosts the frontend).

- [server/db.js](server/db.js) — opens `data/app.db` via Node's built-in `node:sqlite` (`DatabaseSync`, still experimental in this Node version — no external DB driver needed). Creates `users` and `cart_items` tables on startup if missing.
- [server/auth.js](server/auth.js) — password hashing via `crypto.scryptSync` (salted, no bcrypt dependency), plus the `requireAuth` middleware.
- API surface: `POST /api/auth/register|login|logout`, `GET /api/auth/me`, `GET/POST /api/cart`, `DELETE /api/cart/:productId`. Cart rows are keyed on `(user_id, product_id)` with `qty` incremented on repeat adds.

When editing, keep new markup/CSS inside the existing BEM naming pattern per block, and add new column layout using the `.grid`/`.row`/`.col`/`.c-N` system rather than the legacy `.grid__column-N` classes.

## Gotcha: mixed Unicode normalization in index.html

`index.html` has Vietnamese text saved with inconsistent Unicode normalization (some runs NFC, some NFD) from being hand-edited across sessions/input methods. Exact-string tools (`Edit`) can silently fail to match a line that visibly contains the right text if the diacritics differ at the byte level. When editing near Vietnamese text, anchor the match on the surrounding ASCII (tag names, class names, attribute syntax) and stop the match boundary before/after the Vietnamese run rather than including it — or do line-indexed edits via a small Node script if precise multi-line surgery is needed.
