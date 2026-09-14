# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single **Claude Design canvas** page — [Forward - There is more.dc.html](Forward%20-%20There%20is%20more.dc.html) — for The Hope church's "FORWARD · There is more" year-end campaign. Bilingual (Traditional Chinese + English), dark navy/gold, one long scrolling narrative rather than separate artboards.

There is no build system, no package.json, no tests. The `.dc.html` file is the deliverable; everything else is runtime, tokens, or assets.

## Editing model

Edit **only** these:

- `Forward - There is more.dc.html` — markup + logic
- `_ds/the-hope-design-system-*/tokens/*.css` — design tokens (only if the brand itself changes)

Never hand-edit these (generated / copied scaffolds, overwritten on regeneration):

- `support.js` — the dc-runtime bundle (`// GENERATED from dc-runtime/src/*.ts — do not edit`)
- `image-slot.js` — the omelette `<image-slot>` starter component
- `_ds/…/_ds_bundle.js` — compiled design-system components (source of truth is the design system's `components/core/*.jsx`, which lives outside this folder)

`uploads/*.png` are user-dropped images persisted by `<image-slot>`; nothing in the HTML references them by path.

## Document architecture

The file is one HTML document with three parts:

1. `<helmet>` — token stylesheets, `_ds_bundle.js`, `image-slot.js`, and a global `<style>` block holding page-wide rules: the `.rv` scroll-reveal transition, the `hopeCue`/`hopeFloat`/`hopeFade` keyframes, and the `columns:3` responsive overrides.
2. `<x-dc>` — the template. Plain HTML with `{{ expr }}` interpolation; each top-level `<section>` carries a `data-screen-label` that names it in the canvas editor's screen list.
3. `<script type="text/x-dc" data-dc-script>` — a `class Component extends DCLogic`.

### The DCLogic contract

`support.js` evaluates the script, instantiates `Component`, and renders the template against **whatever flat object `renderVals()` returns**, merged over props. So:

- **Every `{{ name }}` in the template must be a key of the `renderVals()` return value.** There is no scope chain to component state — `this.state.pop` is invisible to the template until `renderVals()` exposes it (e.g. as `popName`).
- Handlers are passed as values, not names: `onClick="{{ closePop }}"` binds to the function `renderVals()` returned under that key.
- Computed inline styles are strings built in `renderVals()` and interpolated whole (`style="{{ c.style }}"`) — see `cards`, `notes`, `popOverlay`. The runtime converts a `style` string to a React style object.
- Lifecycle is React-like: `setState`, `componentDidMount`, `componentWillUnmount`, `forceUpdate`.

### Template directives

| Syntax | Meaning |
|---|---|
| `<sc-for list="{{ items }}" as="x">` | Repeat children; `{{ x.field }}` inside |
| `<sc-if>` | Conditional |
| `<x-import component-from-global-scope="TheHopeDesignSystem_66e3da.Button" …>` | Render a design-system component |
| `style-<pseudo>="css"` | Generates a real `:hover` / `::before` rule (`style-hover="background:#1c272b"`) — inline styles can't do pseudo-states |
| `hint-size="220px,52px"` | Placeholder box size while a component streams in |
| `hint-placeholder-count="5"` | Placeholder repeat count for an `sc-for` whose list isn't resolved yet |

### Interactive state

`componentDidMount` wires three things by hand; keep them paired with the `componentWillUnmount` teardown:

- a passive `scroll` listener driving the top progress bar (`{{ progress }}`)
- an `IntersectionObserver` that adds `.in` to every `.rv` element (one-shot, unobserves after firing)
- a second observer on `[data-screen-label="01 Building"]` that triggers `runCount()` — a rAF ease-out counting animation over the `TARGETS` matrix

Data lives in module-level consts at the top of the script: `CH` (the five chapters), `TARGETS` (stat numbers per chapter, currently mostly placeholder), `PROMPTS`, `QUESTIONS`. Content edits usually mean editing those, not the template.

## Design system

Namespace `TheHopeDesignSystem_66e3da`, exposed on `window` by `_ds_bundle.js`. Components: `Badge` (tone: gold | outline | neutral), `Button` (variant: solid-gold | outline | ghost; size: md | lg), `Input`, `MediaCard`, `SectionHeading`, `Tag`.

Tokens are CSS custom properties in `_ds/…/tokens/`: `colors.css` (`--hope-navy:#1c272b`, `--hope-gold:#ffc946`, plus semantic aliases like `--surface-card`, `--text-on-gold`), `typography.css` (self-hosted Montserrat / Noto Sans / Noto Sans TC / Noto Sans Mono TC + a display/heading scale), `spacing.css`, `effects.css`.

Two things to know when working in the page:

- The page markup mostly uses **raw hex and `clamp()` inline styles**, not tokens — it was authored that way deliberately. Match the surrounding style rather than converting to tokens piecemeal.
- Components *do* read tokens, so to put a design-system component on a light background you **override the tokens on a wrapping element** rather than restyling the component. The ending CTA section does exactly this: `--hope-gold:#1c272b;--text-on-gold:#ffc946;…` on the button row's container.

Typographic convention throughout: Montserrat 700/800 for headlines and numerals, Noto Sans TC for Chinese body copy, Noto Sans Mono TC at ~10px with `letter-spacing:.16em–.22em` for the all-caps kickers.

## `<image-slot>`

User-fillable image placeholder (`shape`: rect | rounded | circle | pill, plus `radius`, `mask`, `fit`, `src`). A **distinct `id` is required** on every slot — it's the persistence key for the `.image-slots.state.json` sidecar, and duplicate ids collide. Slots generated inside an `sc-for` build their ids from data (`'fw-' + c.slot + '-hero'`, `'fw-faces-' + key + '-' + k`), so keep those id expressions unique when adding chapters or overlays.

## Previewing

The page must be served over HTTP, not opened as `file://` — `support.js` re-fetches `location.href` for hot template updates, and `<image-slot>` fetches its sidecar. It pulls React 18.3.1 and Babel from unpkg with SRI at boot, so the preview needs network access.

```
python3 -m http.server 8000
# then open http://localhost:8000/Forward%20-%20There%20is%20more.dc.html
```

Outside the omelette/canvas host, image slots are read-only and edits won't persist.

## External links referenced by the page

`https://thehope.co/give` (giving), `https://prayer-map-omega.vercel.app/` (Prayer Map), and a Padlet archive of past FORWARD cards.
