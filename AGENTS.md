# ClayForge — agent guide

ClayForge is a light, build-free design framework. An AI agent generates a
client prototype; the client then edits copy and design **in their own browser**,
with every change stored locally and exportable as a JSON snapshot the designer
can replay.

## This repo holds the framework only

**No client projects live here.** A project is its own workspace folder that
vendors a copy of the framework.

```
clayforge/                      <- this repo, framework only
  theme/base.css                locked defaults + cascade layer order
  engine/                       discovery, controls, persistence, editor chrome
  templates/starter/            scaffold source, uses {{PROJECT_ID}} tokens
  tools/new-project.ps1         creates a project folder elsewhere
  tools/sync.ps1                refreshes a project's vendored copy
  VERSION                       current semantic version

<project>/                      <- a separate folder per client
  wrangler.jsonc                Cloudflare deploy, site root = src/
  clayforge.lock.json           which framework version is vendored
  src/
    index.html                  markup: data-edit sections, data-field slots
    content.json                baseline copy
    clayforge.json              project id/name/template + section overrides
    design.css                  the whole look, inside @layer design
    print.css                   optional page geometry, unlayered
    clayforge/engine|theme      VENDORED COPY, never edited in the project
```

```powershell
./tools/new-project.ps1 -Path ..\acme-landing -Name "Acme - Landing"
./tools/sync.ps1        -Project ..\acme-landing
```

`new-project.ps1` refuses to write inside this repo.

## The three cascade layers

```css
@layer base, design, client;
```

- `base` — `theme/base.css`. Untouchable defaults. The reset target.
- `design` — the project's `design.css`. What AI writes.
- `client` — generated at runtime by the engine from the client's saved tweaks.
  Never author this layer by hand.

Because layers are ordered, "reset to original" is just deleting entries in a
higher layer. Do not use `!important` and do not fight specificity.

## Marking a section editable

```html
<section
  data-edit="pricing"
  data-edit-label="Pricing Table"
  data-edit-controls="background,color,fontSize,padding">
  <h2><span data-field="pricingTitle"></span></h2>
  <ul data-field="pricingItems" data-field-type="list"></ul>
</section>
```

Rules the engine relies on:

1. `data-edit` values are `[A-Za-z0-9_-]+` and are the style/visibility key.
2. `data-edit-controls` is an allowlist. Omit it to get the safe client default
   (`background,color,fontSize,fontWeight,textAlign`). Designer mode
   (`?mode=designer`) always exposes every control.
3. Add `data-edit-required` to a section the client must not hide.
4. **A `data-field` must never sit on the same element as `data-edit`.** Put the
   field on a child (`<span data-field="...">`).
5. `data-field-type="list"` renders one `<li>` per array entry in `content.json`.
6. Reusing the same `data-field` in several places is fine — the engine keeps
   every occurrence in sync.
7. If a section's removal would leave a hole in a grid, handle the reflow in
   `design.css` with `:has(> [data-edit-hidden])`.

Control ids: `background`, `color`, `accent`, `fontFamily`, `fontSize`,
`fontWeight`, `textAlign`, `textTransform`, `letterSpacing`, `padding`, `gap`,
`borderWidth`, `radius`.

## Global design palettes

A design may expose CSS custom properties as global color controls. The
project owns the token names and uses them throughout its design stylesheet:

```jsonc
{
  "id": "design-1",
  "label": "1. Editorial",
  "palette": [
    { "id": "ink", "label": "Ink", "property": "--design-ink" },
    { "id": "accent", "label": "Accent", "property": "--design-accent" }
  ]
}
```

Palette ids are `[A-Za-z0-9_-]+`, properties must be CSS custom properties,
and saved values are six-digit hex colors. Define each property's default on
the matching `body[data-design="..."]` selector inside `@layer design`.

## Content rules

- `content.json` is flat: `key -> string | string[]`.
- Strings may contain only `<br>`, `<b>`, `<i>`, `<em>`, `<strong>`, `<u>`,
  `<small>`, `<sup>`, `<sub>`. Everything else is stripped at runtime.
- Client edits are stored as **overrides**, so `content.json` stays the
  authoritative original and "reset" always works.

## Snapshot format

```jsonc
{
  "formatVersion": 2,
  "framework": "clayforge",
  "frameworkVersion": "0.6.0",
  "template": "card-4x9",
  "templateVersion": "1.0.0",
  "savedAt": "2026-09-19T00:00:00.000Z",
  "content": { "headline": "..." },   // overrides only
  "sections": { "offer": false },      // hidden sections only
  "palettes": { "design-1": { "accent": "#ffcb05" } },
  "styles": { "offer": { "background": "#ffcb05" } }
}
```

Bump `FORMAT_VERSION` in `engine/store.js` and add a migration in
`adoptEnvelope` if the shape ever changes.

## Framework releases

Use `./tools/set-version.ps1 -Version X.Y.Z` for every release. It updates the
root `VERSION` file and `ENGINE_VERSION` together. Commit both files and tag the
same commit as `vX.Y.Z`; CI rejects version or tag mismatches. `FORMAT_VERSION`
is independent and changes only when the snapshot schema changes.

## Running a project

```powershell
cd <project>\src
python -m http.server 5173      # http://localhost:5173/
npx wrangler deploy             # from the project root
```

Avoid ports 8080-8093 and 80 on Windows — they sit in a reserved TCP exclusion
range and binding fails with `WinError 10013`. Check with
`netsh interface ipv4 show excludedportrange protocol=tcp`.

Paths: the vendored framework is referenced as `/clayforge/engine/...` and
`/clayforge/theme/...`; the project's own files as `./...`. Since `src/` is the
site root, this works identically in development and in production.

## Do not

- Do not create a client project inside this repo.
- Do not add a bundler, framework, or `node_modules` dependency.
- Do not edit `theme/base.css`, or any vendored `src/clayforge/**` in a project.
- Do not write `@layer client` rules by hand.
- Do not put design values in `index.html` via `style=` attributes.
- Do not inline copy in the markup; it belongs in `content.json`.
