# ClayForge roadmap

## Client-selectable page sizes

Status: planned

ClayForge should allow a client to choose from page sizes explicitly approved
by the project designer. It should not expose unrestricted width and height
fields: changing aspect ratio can rewrap text, collapse fixed grid tracks, and
clip content that was composed for another format.

### Product contract

- A project declares a default page size and an allowlist of named presets.
- The client selects a preset from a global **Page Size** control.
- Screen geometry and `@page` print geometry use the same selected preset.
- Same-ratio sizes may scale one composition proportionally.
- Different aspect ratios require an explicit layout variant or template.
- Reset, import, and export include the selected page size.
- Existing projects without page-size configuration behave exactly as today.

### Output-neutral preparation

1. Establish one project-level geometry contract for width, height, orientation,
   bleed, and safe area instead of duplicating literals across screen and print
   styles.
2. Reserve framework-owned custom properties such as `--cf-page-width` and
   `--cf-page-height`; projects may consume them but must not redefine their
   meaning.
3. Document the unit convention: physical page geometry and print spacing use
   `in` or `mm`; typography, strokes, and screen-only chrome may use `px`.
   CSS defines `1in` as `96px`, so a blanket unit conversion is unnecessary.
4. Replace repeated project measurements with semantic tokens while preserving
   their current computed 4x9 values.
5. Classify each layout as `fixed`, `proportional`, or `variant`. Do not assume
   every design can reflow safely.
6. Add an overflow preflight that detects clipped content before printing.

### Framework work

- Validate page-size declarations from `clayforge.json`.
- Persist the selected preset in the versioned snapshot envelope.
- Add a global Page Size selector separate from section Style controls.
- Generate a dedicated unlayered geometry stylesheet after `print.css`; page
  geometry must not be overridden by section or palette edits.
- Keep arbitrary custom dimensions in designer mode unless a project opts in.

### Delivery order

1. Introduce a single geometry contract shared by screen and print output.
2. Add overflow detection against the selected page dimensions.
3. Add designer-approved page-size presets and the global selector.
4. Tokenize project measurements only after each layout declares whether it
    remains fixed, scales proportionally, or uses a size-specific variant.

Do not perform a blanket measurement refactor before these decisions. Existing
4x9 projects should keep their current values and rendering until the geometry
contract and regression checks are available.

### Acceptance checks

- Existing 4x9 projects render pixel-equivalently before and after preparation.
- Browser card dimensions and printed PDF page dimensions always agree.
- Every approved preset is checked for overflow on front and back.
- Switching size, reloading, exporting, importing, and resetting are covered.
- Print tests verify physical dimensions, pagination, and color preservation.

### Out of scope

- Freeform client-entered dimensions.
- Automatic reflow between unrelated aspect ratios.
- Silently shrinking text to make overflowing content fit.