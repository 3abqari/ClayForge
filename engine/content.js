/**
 * Content binding.
 *
 * `content.json` holds the designer's baseline copy. The client's edits live as
 * overrides in the saved envelope, so "reset" is a delete, never a rewrite.
 *
 * Fields are declared in markup:
 *   <span data-field="headline"></span>
 *   <ul data-field="services" data-field-type="list"></ul>
 */

const ALLOWED_TAGS = new Set(["BR", "B", "I", "EM", "STRONG", "U", "SMALL", "SUP", "SUB"]);
const DROP_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "TEMPLATE", "SVG", "MATH"]);

/**
 * Strips everything except a small inline formatting allowlist. Used on every
 * value that reaches innerHTML, so an imported snapshot cannot inject markup.
 * @param {unknown} html
 */
export function sanitizeInline(html) {
  const holder = document.createElement("template");
  holder.innerHTML = String(html ?? "");

  let changed = true;
  while (changed) {
    changed = false;
    for (const element of [...holder.content.querySelectorAll("*")]) {
      if (DROP_TAGS.has(element.tagName)) {
        element.remove();
        changed = true;
      } else if (!ALLOWED_TAGS.has(element.tagName)) {
        element.replaceWith(...element.childNodes);
        changed = true;
      } else if (element.attributes.length) {
        [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
        changed = true;
      }
    }
  }
  return holder.innerHTML;
}

const toArray = (value) => (Array.isArray(value) ? value : String(value ?? "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean));

/**
 * @param {ParentNode} root
 * @returns {Map<string, Field>}
 */
export function discoverFields(root) {
  /** @type {Map<string, Field>} */
  const fields = new Map();
  root.querySelectorAll("[data-field]").forEach((element) => {
    const key = element.getAttribute("data-field") || "";
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) return;
    const type = element.getAttribute("data-field-type") === "list" ? "list" : "text";
    const section = element.closest("[data-edit]")?.getAttribute("data-edit") ?? null;
    const existing = fields.get(key);
    if (existing) existing.elements.push(element);
    else fields.set(key, { key, type, section, elements: [element] });
  });
  return fields;
}

/** Baseline value merged with the client's override. */
export const effectiveValue = (key, base, state) => (key in state.content ? state.content[key] : base[key]);

function paint(field, value) {
  const html = field.type === "list"
    ? toArray(value).map((item) => `<li>${sanitizeInline(item)}</li>`).join("")
    : sanitizeInline(value);
  field.elements.forEach((element) => {
    if (element.innerHTML !== html) element.innerHTML = html;
  });
}

/** Writes every field's current value into the DOM. */
export function hydrate(fields, base, state) {
  fields.forEach((field) => paint(field, effectiveValue(field.key, base, state)));
}

/** Reads a field back out of the DOM after the client typed in it. */
export function readField(field, sourceElement) {
  if (field.type === "list") {
    return [...sourceElement.querySelectorAll("li")].map((item) => sanitizeInline(item.innerHTML).trim()).filter(Boolean);
  }
  return sanitizeInline(sourceElement.innerHTML);
}

/** Mirrors an in-progress edit to the field's other occurrences. */
export function mirror(field, sourceElement, value) {
  const html = field.type === "list"
    ? toArray(value).map((item) => `<li>${sanitizeInline(item)}</li>`).join("")
    : sanitizeInline(value);
  field.elements.forEach((element) => {
    if (element !== sourceElement && element.innerHTML !== html) element.innerHTML = html;
  });
}

export function setEditable(fields, enabled) {
  fields.forEach((field) => field.elements.forEach((element) => { element.contentEditable = String(enabled); }));
}

/**
 * @typedef {object} Field
 * @property {string} key
 * @property {"text"|"list"} type
 * @property {string|null} section
 * @property {HTMLElement[]} elements
 */
