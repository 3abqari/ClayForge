/**
 * Clayforge storage: the versioned envelope, localStorage persistence,
 * and import/export of a client's saved view.
 */

export const FORMAT_VERSION = 2;
export const ENGINE_VERSION = "0.2.0";
const FRAMEWORK = "clayforge";

const SAFE_KEY = /^[a-zA-Z0-9_-]+$/;

/** @param {string} projectId */
export const storageKey = (projectId) => `clayforge:${projectId}`;

/**
 * @param {{ id: string, template?: string, templateVersion?: string }} project
 * @returns {ClayforgeState}
 */
export function emptyState(project) {
  return {
    formatVersion: FORMAT_VERSION,
    framework: FRAMEWORK,
    frameworkVersion: ENGINE_VERSION,
    template: project.template || project.id,
    templateVersion: project.templateVersion || "1.0.0",
    design: project.defaultDesign || "default",
    savedAt: null,
    content: {},
    sections: {},
    palettes: {},
    styles: {}
  };
}

const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** Accepts only string / array-of-string content values under safe keys. */
function cleanContent(raw) {
  const output = {};
  if (!isPlainObject(raw)) return output;
  for (const [key, value] of Object.entries(raw)) {
    if (!SAFE_KEY.test(key)) continue;
    if (typeof value === "string") output[key] = value;
    else if (Array.isArray(value)) output[key] = value.filter((item) => typeof item === "string");
  }
  return output;
}

function cleanSections(raw) {
  const output = {};
  if (!isPlainObject(raw)) return output;
  for (const [key, value] of Object.entries(raw)) {
    if (SAFE_KEY.test(key) && typeof value === "boolean") output[key] = value;
  }
  return output;
}

function cleanStyles(raw) {
  const output = {};
  if (!isPlainObject(raw)) return output;
  for (const [key, value] of Object.entries(raw)) {
    if (!SAFE_KEY.test(key) || !isPlainObject(value)) continue;
    const declarations = {};
    for (const [controlId, controlValue] of Object.entries(value)) {
      if (SAFE_KEY.test(controlId) && (typeof controlValue === "string" || typeof controlValue === "number")) {
        declarations[controlId] = String(controlValue);
      }
    }
    if (Object.keys(declarations).length) output[key] = declarations;
  }
  return output;
}

function cleanPalettes(raw) {
  const output = {};
  if (!isPlainObject(raw)) return output;
  for (const [designId, value] of Object.entries(raw)) {
    if (!SAFE_KEY.test(designId) || !isPlainObject(value)) continue;
    const colors = {};
    for (const [tokenId, tokenValue] of Object.entries(value)) {
      if (SAFE_KEY.test(tokenId) && typeof tokenValue === "string" && /^#[0-9a-f]{6}$/i.test(tokenValue)) {
        colors[tokenId] = tokenValue;
      }
    }
    if (Object.keys(colors).length) output[designId] = colors;
  }
  return output;
}

/**
 * Normalises anything claiming to be a Clayforge envelope into a trusted state.
 * Older format versions are upgraded here.
 * @returns {{ state: ClayforgeState, warnings: string[] }}
 */
export function adoptEnvelope(project, incoming) {
  const state = emptyState(project);
  const warnings = [];
  if (!isPlainObject(incoming)) return { state, warnings: ["File was not a Clayforge snapshot."] };

  const version = Number(incoming.formatVersion) || 0;
  if (version > FORMAT_VERSION) warnings.push(`Snapshot was made by a newer Clayforge (v${version}); unknown fields were dropped.`);
  if (incoming.framework && incoming.framework !== FRAMEWORK) warnings.push("Snapshot was not produced by Clayforge.");
  if (incoming.template && incoming.template !== state.template) {
    warnings.push(`Snapshot targets template "${incoming.template}" but this project is "${state.template}".`);
  }

  // v0 snapshots were a bare { content, sections, styles } bag.
  const payload = version === 0 && !incoming.content && !incoming.styles ? { content: incoming } : incoming;

  state.content = cleanContent(payload.content);
  state.sections = cleanSections(payload.sections);
  state.palettes = cleanPalettes(payload.palettes);
  state.styles = cleanStyles(payload.styles);
  state.design = typeof incoming.design === "string" ? incoming.design : state.design;
  state.savedAt = typeof incoming.savedAt === "string" ? incoming.savedAt : null;
  return { state, warnings };
}

/** @returns {ClayforgeState} */
export function loadState(project) {
  const key = storageKey(project.id);
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    localStorage.removeItem(key);
  }
  return stored ? adoptEnvelope(project, stored).state : emptyState(project);
}

export function saveState(project, state) {
  state.savedAt = new Date().toISOString();
  try {
    localStorage.setItem(storageKey(project.id), JSON.stringify(state));
  } catch {
    console.warn("Clayforge could not save to localStorage (quota or private mode).");
  }
}

export function clearState(project) {
  localStorage.removeItem(storageKey(project.id));
}

export function downloadState(project, state) {
  const snapshot = { ...state, savedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${project.id}-clayforge.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/** @param {File} file */
export async function readSnapshotFile(project, file) {
  const text = await file.text();
  return adoptEnvelope(project, JSON.parse(text));
}

/**
 * @typedef {object} ClayforgeState
 * @property {number} formatVersion
 * @property {string} framework
 * @property {string} frameworkVersion
 * @property {string} template
 * @property {string} templateVersion
 * @property {string} design
 * @property {string|null} savedAt
 * @property {Record<string, string|string[]>} content
 * @property {Record<string, boolean>} sections
 * @property {Record<string, Record<string, string>>} palettes
 * @property {Record<string, Record<string, string>>} styles
 */
