/**
 * Section discovery.
 *
 * Sections are declared in markup (`data-edit="key"`). An optional
 * `sections` block in clayforge.json may override the label, the allowed
 * controls, and whether the client can hide the section.
 */

import { ALL_CONTROLS, DEFAULT_CLIENT_CONTROLS } from "./controls.js";

const SAFE_KEY = /^[a-zA-Z0-9_-]+$/;

const humanize = (key) => key.replace(/[-_]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (character) => character.toUpperCase());

const splitList = (value) => (typeof value === "string" ? value.split(",").map((part) => part.trim()).filter(Boolean) : null);

function resolveControls(declared, mode) {
  if (mode === "designer") return [...ALL_CONTROLS];
  const requested = declared ?? DEFAULT_CLIENT_CONTROLS;
  return requested.filter((id) => ALL_CONTROLS.includes(id));
}

/**
 * @param {ParentNode} root
 * @param {Record<string, any>} overrides
 * @param {"client"|"designer"} mode
 * @returns {Map<string, Section>}
 */
export function discoverSections(root, overrides, mode) {
  /** @type {Map<string, Section>} */
  const sections = new Map();

  root.querySelectorAll("[data-edit]").forEach((element) => {
    const key = element.getAttribute("data-edit") || "";
    if (!SAFE_KEY.test(key)) {
      console.warn(`ClayForge: ignoring section key "${key}" (letters, numbers, - and _ only).`);
      return;
    }

    const existing = sections.get(key);
    if (existing) {
      existing.elements.push(element);
      return;
    }

    const override = overrides[key] || {};
    const declared = override.controls ?? splitList(element.getAttribute("data-edit-controls"));
    sections.set(key, {
      key,
      label: override.label || element.getAttribute("data-edit-label") || humanize(key),
      controls: resolveControls(declared, mode),
      hideable: override.hideable ?? !element.hasAttribute("data-edit-required"),
      elements: [element],
      order: sections.size
    });
  });

  return sections;
}

/**
 * Applies visibility. The engine sets an attribute rather than an inline style
 * so project CSS can react with `:has()` and reflow its own layout.
 */
export function applyVisibility(sections, state) {
  sections.forEach((section) => {
    const visible = state.sections[section.key] !== false;
    section.elements.forEach((element) => element.toggleAttribute("data-edit-hidden", !visible));
  });
}

export const hiddenSections = (sections, state) => [...sections.values()].filter((section) => state.sections[section.key] === false);

/**
 * @typedef {object} Section
 * @property {string} key
 * @property {string} label
 * @property {string[]} controls
 * @property {boolean} hideable
 * @property {HTMLElement[]} elements
 * @property {number} order
 */
