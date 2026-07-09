# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A static front-end clone of the Shopee e-commerce homepage ("Công ty TNHH Saigon Ve Wong"), built with plain HTML/CSS only — no JavaScript, no build tooling, no package manager. The entire markup lives in a single [index.html](index.html) file; there is no templating or componentization.

## Running the project

There is no build step or dev server dependency. Open `index.html` directly, or use the VS Code "Live Server" extension — [.vscode/launch.json](.vscode/launch.json) is preconfigured to launch Chrome against `http://127.0.0.1:5500` (Live Server's default port).

No lint, test, or build commands exist in this repo.

## Architecture

- [index.html](index.html) — the entire page markup (header/navbar, search, category sidebar, product grid, footer, auth form, etc.) in one file.
- `asset/css/` — stylesheets loaded in a fixed cascade order (see the `<link>` tags in `index.html`):
  1. [grid.css](asset/css/grid.css) — a custom 12-column flex grid (`.grid`, `.row`, `.col`, `.c-1`…`.c-12`) plus a second, older grid system (`.grid__row`, `.grid__column-N`) still used in places — check which one a section uses before adding markup.
  2. [base.css](asset/css/base.css) — CSS custom properties (`:root` — colors, header heights) and base resets/typography.
  3. [main.css](asset/css/main.css) — all component styling, organized by BEM-ish block name (`.header`, `.header-with-search`, `.category`, `.category-list`, `.home-filter`, `.home-product`, `.home-product-item`, `.footer`, `.footer-list`, `.auth-form`, `.mobile-category`, `.btn-back`, `.app`). Elements/modifiers follow `block__element` and `block--modifier` / `block__element--modifier` conventions.
  4. [responsive.css](asset/css/responsive.css) — media-query overrides layered last.
- `asset/fonts/fontawesome-free-7.1.0-web/` — vendored Font Awesome 7 icon set, referenced via `all.min.css`.
- `asset/img/` — static images/icons (favicons, QR code, store badges, PWA manifest `site.webmanifest`).
- External dependencies loaded via CDN in `<head>`: `normalize.css` and the Google Fonts "Roboto" family. No other third-party libraries.

When editing, keep new markup/CSS inside the existing BEM naming pattern per block, and add new column layout using the `.grid`/`.row`/`.col`/`.c-N` system in `grid.css` rather than the legacy `.grid__column-N` classes.
