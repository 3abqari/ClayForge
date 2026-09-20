/**
 * ClayForge — a light design + content framework.
 *
 * A project supplies markup (sections marked with `data-edit`, copy slots
 * marked with `data-field`), a `content.json` baseline, a `clayforge.json`
 * config, and a `design.css` written into `@layer design`. Everything else —
 * discovery, controls, persistence, export — is this engine.
 */

import { ENGINE_VERSION, loadState, saveState, clearState, downloadState, readSnapshotFile } from "./store.js";
import { discoverSections, applyVisibility } from "./sections.js";
import { discoverFields, hydrate, readField, mirror, setEditable } from "./content.js";
import { apply as applyStyleLayer } from "./styles.js";
import { mountUi } from "./ui.js";

export { ENGINE_VERSION };

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`ClayForge could not load ${url} (${response.status})`);
  return response.json();
};

function resolveMode(config) {
  const requested = new URLSearchParams(location.search).get("mode");
  const designerAllowed = config.project?.allowDesignerMode !== false;
  return requested === "designer" && designerAllowed ? "designer" : "client";
}

/**
 * @param {{ configUrl?: string, contentUrl?: string, root?: ParentNode }} [options]
 */
export async function createClayForge(options = {}) {
  const config = await fetchJson(options.configUrl ?? "./clayforge.json");
  const project = { id: "clayforge-project", name: "ClayForge project", templateVersion: "1.0.0", print: false, ...(config.project || {}) };
  const baseContent = await fetchJson(options.contentUrl ?? project.content ?? "./content.json");

  const root = options.root ?? document.body;
  const mode = resolveMode(config);
  const sections = discoverSections(root, config.sections || {}, mode);
  const fields = discoverFields(root);
  const state = loadState(project);

  sections.forEach((section) => {
    if (section.elements.some((element) => element.hasAttribute("data-field"))) {
      console.warn(`ClayForge: section "${section.key}" is also a field. Put data-field on a child element instead.`);
    }
  });

  const listeners = new Set();
  const emit = (reason) => listeners.forEach((listener) => listener({ reason }));

  const persist = (reason) => {
    saveState(project, state);
    emit(reason);
  };

  const refresh = () => {
    document.body.dataset.design = state.design;
    applyVisibility(sections, state);
    applyStyleLayer(project, sections, state);
    hydrate(fields, baseContent, state);
  };

  const app = {
    project,
    frameworkVersion: ENGINE_VERSION,
    mode,
    state,
    sections,
    fields,
    baseContent,

    on(event, handler) {
      if (event === "change") listeners.add(handler);
    },

    setStyle(sectionKey, controlId, value) {
      const section = sections.get(sectionKey);
      if (!section || !section.controls.includes(controlId)) return;
      state.styles[sectionKey] = { ...state.styles[sectionKey], [controlId]: value };
      applyStyleLayer(project, sections, state);
      persist("style");
    },

    setPaletteColor(tokenId, value) {
      const design = project.designs?.find((option) => option.id === state.design);
      if (!design?.palette?.some((token) => token.id === tokenId) || !/^#[0-9a-f]{6}$/i.test(value)) return;
      state.palettes[state.design] = { ...state.palettes[state.design], [tokenId]: value };
      applyStyleLayer(project, sections, state);
      persist("palette");
    },

    setSectionVisible(sectionKey, visible) {
      if (!sections.has(sectionKey)) return;
      if (visible) delete state.sections[sectionKey];
      else state.sections[sectionKey] = false;
      applyVisibility(sections, state);
      persist("visibility");
    },

    setDesign(design) {
      if (!project.designs?.some((option) => option.id === design)) return;
      state.design = design;
      document.body.dataset.design = design;
      persist("design");
    },

    showAllSections() {
      state.sections = {};
      applyVisibility(sections, state);
      persist("visibility");
    },

    resetSectionStyle(sectionKey) {
      delete state.styles[sectionKey];
      applyStyleLayer(project, sections, state);
      persist("reset");
    },

    resetPalette() {
      delete state.palettes[state.design];
      applyStyleLayer(project, sections, state);
      persist("reset");
    },

    resetSectionContent(sectionKey) {
      fields.forEach((field) => { if (field.section === sectionKey) delete state.content[field.key]; });
      hydrate(fields, baseContent, state);
      persist("reset");
    },

    resetAllStyles() {
      state.palettes = {};
      state.styles = {};
      state.sections = {};
      refresh();
      persist("reset");
    },

    resetAllContent() {
      state.content = {};
      hydrate(fields, baseContent, state);
      persist("reset");
    },

    resetEverything() {
      clearState(project);
      location.reload();
    },

    exportSnapshot() {
      downloadState(project, state);
    },

    async importSnapshot(file) {
      try {
        const { state: incoming, warnings } = await readSnapshotFile(project, file);
        Object.assign(state, { content: incoming.content, sections: incoming.sections, palettes: incoming.palettes, styles: incoming.styles, design: incoming.design || state.design });
        refresh();
        persist("import");
        if (warnings.length) alert(`Imported with notes:\n\n- ${warnings.join("\n- ")}`);
      } catch {
        alert("That file is not a valid ClayForge snapshot.");
      }
    }
  };

  refresh();
  setEditable(fields, true);
  mountUi(app);

  document.addEventListener("input", (event) => {
    const element = event.target.closest?.("[data-field]");
    if (!element) return;
    const field = fields.get(element.getAttribute("data-field"));
    if (!field) return;
    const value = readField(field, element);
    state.content[field.key] = value;
    mirror(field, element, value);
    persist("content");
  });

  document.documentElement.dataset.clayforge = mode;
  return app;
}
