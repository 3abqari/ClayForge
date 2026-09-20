/**
 * The catalogue of design controls ClayForge can offer for a section.
 * Each control maps to exactly one CSS declaration written into `@layer client`.
 * Values are validated here so an imported snapshot can never inject CSS.
 */

const FONT_STACKS = {
  System: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  Serif: "Georgia, 'Times New Roman', serif",
  Slab: "'Rockwell', 'Courier Bold', Georgia, serif",
  Condensed: "'Arial Narrow', 'Liberation Sans Narrow', Arial, sans-serif",
  Impact: "Impact, 'Haettenschweiler', 'Arial Narrow Bold', sans-serif",
  Mono: "ui-monospace, 'Cascadia Mono', Consolas, monospace"
};

const color = (id, label, property) => [id, { id, label, property, type: "color", group: "Color" }];
const range = (id, label, property, min, max, group) => [id, { id, label, property, type: "range", min, max, unit: "px", group }];

/** @type {Record<string, ControlDefinition>} */
export const CONTROLS = Object.fromEntries([
  color("background", "Background", "background-color"),
  color("color", "Text color", "color"),
  color("accent", "Accent / border", "border-color"),
  ["fontFamily", { id: "fontFamily", label: "Font", property: "font-family", type: "select", group: "Type", options: Object.entries(FONT_STACKS).map(([label, value]) => ({ label, value })) }],
  range("fontSize", "Font size", "font-size", 8, 72, "Type"),
  ["fontWeight", { id: "fontWeight", label: "Weight", property: "font-weight", type: "select", group: "Type", options: [{ label: "Light", value: "300" }, { label: "Regular", value: "400" }, { label: "Bold", value: "700" }, { label: "Black", value: "900" }] }],
  ["textAlign", { id: "textAlign", label: "Alignment", property: "text-align", type: "select", group: "Type", options: [{ label: "Left", value: "left" }, { label: "Centre", value: "center" }, { label: "Right", value: "right" }] }],
  ["textTransform", { id: "textTransform", label: "Case", property: "text-transform", type: "select", group: "Type", options: [{ label: "As typed", value: "none" }, { label: "UPPERCASE", value: "uppercase" }, { label: "Capitalised", value: "capitalize" }] }],
  range("letterSpacing", "Letter spacing", "letter-spacing", -2, 8, "Type"),
  range("padding", "Padding", "padding", 0, 64, "Spacing"),
  range("gap", "Gap", "gap", 0, 64, "Spacing"),
  range("borderWidth", "Border width", "border-width", 0, 16, "Spacing"),
  range("radius", "Corner radius", "border-radius", 0, 48, "Spacing")
]);

export const ALL_CONTROLS = Object.keys(CONTROLS);

/** What a client may touch when a section does not declare `data-edit-controls`. */
export const DEFAULT_CLIENT_CONTROLS = ["background", "color", "fontSize", "fontWeight", "textAlign"];

/**
 * Validates a raw control value and returns a CSS-safe string, or null.
 * @param {string} controlId
 * @param {unknown} value
 */
export function safeValue(controlId, value) {
  const control = CONTROLS[controlId];
  if (!control) return null;
  const raw = String(value ?? "").trim();

  if (control.type === "color") return /^#[0-9a-f]{3}(?:[0-9a-f]{3}(?:[0-9a-f]{2})?)?$/i.test(raw) ? raw : null;

  if (control.type === "range") {
    const number = Number.parseFloat(raw);
    if (!Number.isFinite(number)) return null;
    return `${Math.min(control.max, Math.max(control.min, number))}${control.unit}`;
  }

  return control.options.some((option) => option.value === raw) ? raw : null;
}

/**
 * @typedef {object} ControlDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} property
 * @property {"color"|"range"|"select"} type
 * @property {string} group
 * @property {number} [min]
 * @property {number} [max]
 * @property {string} [unit]
 * @property {{label: string, value: string}[]} [options]
 */
