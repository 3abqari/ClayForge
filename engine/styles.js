/**
 * Client style layer.
 *
 * Every client tweak is compiled into a single stylesheet wrapped in
 * `@layer client`, which sits above `design` and therefore wins without any
 * specificity tricks or `!important`. Resetting is deleting entries.
 */

import { CONTROLS, safeValue } from "./controls.js";

const STYLE_ELEMENT_ID = "clayforge-client-layer";
const SAFE_KEY = /^[a-zA-Z0-9_-]+$/;
const SAFE_CUSTOM_PROPERTY = /^--[a-zA-Z0-9_-]+$/;
const SAFE_COLOR = /^#[0-9a-f]{6}$/i;

function styleElement() {
  let element = document.getElementById(STYLE_ELEMENT_ID);
  if (!element) {
    element = document.createElement("style");
    element.id = STYLE_ELEMENT_ID;
    document.head.append(element);
  }
  return element;
}

/**
 * @param {object} project
 * @param {Map<string, import("./sections.js").Section>} sections
 * @param {import("./store.js").ClayForgeState} state
 */
export function compile(project, sections, state) {
  const blocks = [];
  for (const [designId, values] of Object.entries(state.palettes || {})) {
    const design = project.designs?.find((option) => option.id === designId);
    if (!design || !SAFE_KEY.test(designId)) continue;
    const declarations = Object.entries(values).map(([tokenId, value]) => {
      const token = design.palette?.find((option) => option.id === tokenId);
      if (!token || !SAFE_CUSTOM_PROPERTY.test(token.property) || !SAFE_COLOR.test(value)) return null;
      return `${token.property}: ${value};`;
    }).filter(Boolean);
    if (declarations.length) blocks.push(`  body[data-design="${designId}"] {\n    ${declarations.join("\n    ")}\n  }`);
  }
  for (const [key, declarations] of Object.entries(state.styles)) {
    const section = sections.get(key);
    if (!section) continue;
    const css = Object.entries(declarations)
      .filter(([controlId]) => section.controls.includes(controlId))
      .map(([controlId, value]) => {
        const safe = safeValue(controlId, value);
        return safe === null ? null : `${CONTROLS[controlId].property}: ${safe};`;
      })
      .filter(Boolean);
    if (css.length) blocks.push(`  [data-edit="${key}"] {\n    ${css.join("\n    ")}\n  }`);
  }
  return blocks.length ? `@layer client {\n${blocks.join("\n")}\n}\n` : "";
}

export function apply(project, sections, state) {
  styleElement().textContent = compile(project, sections, state);
}

/** Shorthands we write but must read back from a longhand. */
const READ_PROPERTY = {
  padding: "padding-top",
  "border-width": "border-top-width",
  "border-radius": "border-top-left-radius",
  "border-color": "border-top-color",
  gap: "row-gap"
};

/** Reads what the section currently looks like, so the panel opens on real values. */
export function currentValues(section) {
  const element = section.elements.find((candidate) => !candidate.hasAttribute("data-edit-hidden")) || section.elements[0];
  const computed = getComputedStyle(element);
  const values = {};
  section.controls.forEach((controlId) => {
    const control = CONTROLS[controlId];
    const raw = computed.getPropertyValue(READ_PROPERTY[control.property] ?? control.property);
    if (control.type === "color") values[controlId] = toHex(raw);
    else if (control.type === "range") values[controlId] = String(Math.round(Number.parseFloat(raw) || 0));
    else values[controlId] = matchOption(control, raw);
  });
  return values;
}

export function currentPaletteValues(design) {
  const computed = getComputedStyle(document.body);
  return Object.fromEntries((design.palette || []).map((token) => [token.id, toHex(computed.getPropertyValue(token.property))]));
}

function toHex(value) {
  const hex = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(hex)) return `#${[...hex.slice(1)].map((character) => character.repeat(2)).join("")}`.toLowerCase();
  const match = value.match(/-?\d+(?:\.\d+)?/g);
  if (!match || match.length < 3) return "#000000";
  return `#${match.slice(0, 3).map((part) => Math.min(255, Math.max(0, Math.round(Number(part)))).toString(16).padStart(2, "0")).join("")}`;
}

function matchOption(control, raw) {
  const normalized = raw.trim();
  const exact = control.options.find((option) => option.value === normalized);
  if (exact) return exact.value;
  const firstFamily = normalized.split(",")[0].replaceAll(/['"]/g, "").trim().toLowerCase();
  const loose = control.options.find((option) => option.value.split(",")[0].replaceAll(/['"]/g, "").trim().toLowerCase() === firstFamily);
  return loose ? loose.value : control.options[0].value;
}
