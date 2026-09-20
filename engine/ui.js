/**
 * Editor chrome: the toolbar, the per-section hover controls, and the
 * floating style panel. This module only renders and dispatches; all state
 * changes go through the app object created in clayforge.js.
 */

import { CONTROLS } from "./controls.js";
import { currentPaletteValues, currentValues } from "./styles.js";
import { hiddenSections } from "./sections.js";

export function mountUi(app) {
  const toolbar = document.createElement("div");
  toolbar.className = "cf-toolbar cf-collapsed";
  toolbar.dataset.cfChrome = "";

  const panel = document.createElement("section");
  panel.className = "cf-panel";
  panel.dataset.cfChrome = "";
  panel.setAttribute("aria-label", "Section design");
  panel.hidden = true;

  document.body.append(toolbar, panel);
  new ResizeObserver(() => {
    document.documentElement.style.setProperty("--cf-toolbar-height", `${toolbar.offsetHeight}px`);
  }).observe(toolbar);
  injectSectionControls(app);
  renderToolbar();

  // Re-rendering the panel mid-drag would steal focus from a slider, so only
  // structural changes rebuild it.
  app.on("change", ({ reason }) => {
    renderToolbar();
    if (!panel.hidden && panel.dataset.panelType === "palette" && ["design", "reset", "import"].includes(reason)) {
      renderPalettePanel();
    } else if ((reason === "reset" || reason === "import") && !panel.hidden && panel.dataset.sectionKey) {
      renderPanel(panel.dataset.sectionKey, { keepScroll: true });
    }
  });

  function renderToolbar() {
    const hidden = hiddenSections(app.sections, app.state);
    const activeDesign = app.project.designs?.find((option) => option.id === app.state.design);
    const saved = app.state.savedAt ? `Saved ${new Date(app.state.savedAt).toLocaleString()}` : "No local changes yet";
    const collapsed = toolbar.classList.contains("cf-collapsed");
    toolbar.innerHTML = `
      <div class="cf-toolbar-row">
        <strong class="cf-toolbar-title">${escapeHtml(app.project.name || app.project.id)}</strong>
        <span class="cf-toolbar-version">ClayForge v${escapeHtml(app.frameworkVersion)}</span>
        <span class="cf-badge cf-badge-${app.mode}">${app.mode === "designer" ? "Designer" : "Client"} mode</span>
        <span class="cf-toolbar-status">${escapeHtml(saved)}</span>
        <button type="button" class="cf-toolbar-toggle" data-cf-action="toolbar-toggle" aria-controls="cf-toolbar-content" aria-expanded="${!collapsed}" aria-label="${collapsed ? "Expand design controls" : "Collapse design controls"}"><span aria-hidden="true">${collapsed ? "+" : "&minus;"}</span></button>
      </div>
      <div id="cf-toolbar-content" class="cf-toolbar-content">
        <div class="cf-toolbar-groups">
          ${app.project.designs?.length ? `<fieldset class="cf-toolbar-group cf-design-picker"><legend>Design</legend><div class="cf-design-options">${app.project.designs.map((option) => `<button type="button" data-cf-design="${escapeHtml(option.id)}" aria-pressed="${option.id === app.state.design}">${escapeHtml(option.label)}</button>`).join("")}</div></fieldset>` : ""}
          ${activeDesign?.palette?.length ? `<fieldset class="cf-toolbar-group"><legend>Palette</legend><button type="button" class="cf-palette-button" data-cf-action="palette"><span class="cf-palette-swatches" aria-hidden="true"><span></span><span></span><span></span><span></span></span>Edit colors</button></fieldset>` : ""}
          <fieldset class="cf-toolbar-group">
            <legend>File</legend>
            <div class="cf-action-group">
              ${app.project.print ? `<button type="button" data-cf-action="print">${escapeHtml(app.project.printLabel || "Save as PDF")}</button>` : ""}
              <button type="button" data-cf-action="export">Export my version</button>
              <label class="cf-file">Import a version<input type="file" accept="application/json" data-cf-action="import"></label>
            </div>
          </fieldset>
          <fieldset class="cf-toolbar-group">
            <legend>Reset</legend>
            <div class="cf-action-group">
              <button type="button" class="cf-secondary" data-cf-action="reset-styles">Design</button>
              <button type="button" class="cf-secondary" data-cf-action="reset-content">Text</button>
              <button type="button" class="cf-secondary" data-cf-action="reset-all">Everything</button>
            </div>
          </fieldset>
        </div>
        ${hidden.length ? `<div class="cf-toolbar-row cf-hidden-list"><span>Hidden:</span>${hidden.map((section) => `<button type="button" data-cf-show="${section.key}">${escapeHtml(section.label)}</button>`).join("")}<button type="button" data-cf-action="show-all">Show all</button></div>` : ""}
      </div>
    `;
  }

  function renderPanel(sectionKey, { keepScroll = false } = {}) {
    const section = app.sections.get(sectionKey);
    if (!section) return;
    const scroll = keepScroll ? panel.scrollTop : 0;
    const live = currentValues(section);
    const saved = app.state.styles[sectionKey] || {};
    const value = (controlId) => saved[controlId] ?? live[controlId] ?? "";

    const groups = new Map();
    section.controls.forEach((controlId) => {
      const control = CONTROLS[controlId];
      if (!groups.has(control.group)) groups.set(control.group, []);
      groups.get(control.group).push(control);
    });

    panel.dataset.sectionKey = sectionKey;
    panel.dataset.panelType = "section";
    panel.hidden = false;
    panel.innerHTML = `
      <header class="cf-panel-head">
        <h2>${escapeHtml(section.label)}</h2>
        <button type="button" class="cf-icon" data-cf-action="panel-collapse" aria-label="Collapse">&minus;</button>
        <button type="button" class="cf-icon" data-cf-action="panel-close" aria-label="Close">&times;</button>
      </header>
      <div class="cf-panel-body">
        ${section.controls.length
          ? [...groups].map(([group, controls]) => `
            <fieldset class="cf-group">
              <legend>${escapeHtml(group)}</legend>
              ${controls.map((control) => field(control, value(control.id))).join("")}
            </fieldset>`).join("")
          : `<p class="cf-note">This section is not adjustable.</p>`}
      </div>
      <footer class="cf-panel-foot">
        <button type="button" class="cf-secondary" data-cf-action="section-reset-style">Reset this design</button>
        <button type="button" class="cf-secondary" data-cf-action="section-reset-content">Reset this text</button>
      </footer>
    `;
    panel.classList.remove("cf-collapsed");
    panel.scrollTop = scroll;
  }

  function renderPalettePanel() {
    const design = app.project.designs?.find((option) => option.id === app.state.design);
    if (!design?.palette?.length) return;
    const live = currentPaletteValues(design);
    const saved = app.state.palettes[design.id] || {};

    panel.dataset.panelType = "palette";
    delete panel.dataset.sectionKey;
    panel.hidden = false;
    panel.innerHTML = `
      <header class="cf-panel-head">
        <h2>${escapeHtml(design.label)} palette</h2>
        <button type="button" class="cf-icon" data-cf-action="panel-collapse" aria-label="Collapse">&minus;</button>
        <button type="button" class="cf-icon" data-cf-action="panel-close" aria-label="Close">&times;</button>
      </header>
      <div class="cf-panel-body">
        <fieldset class="cf-group">
          <legend>Color</legend>
          ${design.palette.map((token) => `<label class="cf-field" for="cf-palette-${escapeHtml(token.id)}">${escapeHtml(token.label)}<input id="cf-palette-${escapeHtml(token.id)}" type="color" data-cf-palette="${escapeHtml(token.id)}" value="${escapeHtml(saved[token.id] ?? live[token.id] ?? "#000000")}"></label>`).join("")}
        </fieldset>
      </div>
      <footer class="cf-panel-foot">
        <button type="button" class="cf-secondary" data-cf-action="palette-reset">Reset this palette</button>
      </footer>
    `;
    panel.classList.remove("cf-collapsed");
  }

  function field(control, value) {
    const id = `cf-${control.id}`;
    if (control.type === "color") {
      return `<label class="cf-field" for="${id}">${escapeHtml(control.label)}<input id="${id}" type="color" data-cf-control="${control.id}" value="${escapeHtml(value || "#000000")}"></label>`;
    }
    if (control.type === "range") {
      const number = Number.parseFloat(value) || 0;
      return `<label class="cf-field" for="${id}">${escapeHtml(control.label)} <output data-cf-output="${control.id}">${number}px</output><input id="${id}" type="range" min="${control.min}" max="${control.max}" step="1" data-cf-control="${control.id}" value="${number}"></label>`;
    }
    const options = control.options.map((option) => `<option value="${escapeHtml(option.value)}"${option.value === value ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
    return `<label class="cf-field" for="${id}">${escapeHtml(control.label)}<select id="${id}" data-cf-control="${control.id}">${options}</select></label>`;
  }

  panel.addEventListener("input", (event) => {
    const paletteToken = event.target.dataset?.cfPalette;
    if (paletteToken) return app.setPaletteColor(paletteToken, event.target.value);
    const controlId = event.target.dataset?.cfControl;
    if (!controlId) return;
    app.setStyle(panel.dataset.sectionKey, controlId, event.target.value);
    const output = panel.querySelector(`[data-cf-output="${controlId}"]`);
    if (output) output.textContent = `${event.target.value}px`;
  });

  document.addEventListener("click", (event) => {
    const design = event.target.closest?.("[data-cf-design]")?.dataset.cfDesign;
    if (design) return app.setDesign(design);

    const openKey = event.target.closest?.("[data-cf-style]")?.dataset.cfStyle;
    if (openKey) return renderPanel(openKey);

    const hideKey = event.target.closest?.("[data-cf-hide]")?.dataset.cfHide;
    if (hideKey) return app.setSectionVisible(hideKey, false);

    const showKey = event.target.closest?.("[data-cf-show]")?.dataset.cfShow;
    if (showKey) return app.setSectionVisible(showKey, true);

    const action = event.target.closest?.("[data-cf-action]")?.dataset.cfAction;
    if (!action) return;
    const sectionKey = panel.dataset.sectionKey;

    switch (action) {
      case "toolbar-toggle": toolbar.classList.toggle("cf-collapsed"); renderToolbar(); break;
      case "print": window.print(); break;
      case "export": app.exportSnapshot(); break;
      case "reset-styles": if (confirm("Reset all design changes back to the original?")) app.resetAllStyles(); break;
      case "reset-content": if (confirm("Reset all text back to the original?")) app.resetAllContent(); break;
      case "reset-all": if (confirm("Reset design and text back to the original?")) app.resetEverything(); break;
      case "show-all": app.showAllSections(); break;
      case "palette": renderPalettePanel(); break;
      case "palette-reset": app.resetPalette(); break;
      case "panel-close": panel.hidden = true; break;
      case "panel-collapse": panel.classList.toggle("cf-collapsed"); break;
      case "section-reset-style": app.resetSectionStyle(sectionKey); renderPanel(sectionKey); break;
      case "section-reset-content": app.resetSectionContent(sectionKey); break;
      default: break;
    }
  });

  document.addEventListener("change", async (event) => {
    if (event.target.dataset?.cfAction !== "import") return;
    const file = event.target.files?.[0];
    if (file) await app.importSnapshot(file);
    event.target.value = "";
  });

  return { renderToolbar, renderPanel };
}

/** Floating Style / Hide / Reset buttons, one set per discovered section. */
function injectSectionControls(app) {
  app.sections.forEach((section) => {
    section.elements.forEach((element) => {
      const controls = document.createElement("div");
      controls.className = "cf-controls";
      controls.dataset.cfChrome = "";
      controls.contentEditable = "false";
      controls.innerHTML = `
        ${section.controls.length ? `<button type="button" data-cf-style="${section.key}" title="Edit this section's design">Style</button>` : ""}
        <button type="button" data-cf-reset="${section.key}" title="Reset this section">Reset</button>
        ${section.hideable ? `<button type="button" data-cf-hide="${section.key}" title="Hide this section">Hide</button>` : ""}
      `;
      controls.addEventListener("click", (event) => {
        const key = event.target.closest("[data-cf-reset]")?.dataset.cfReset;
        if (key) { app.resetSectionStyle(key); app.resetSectionContent(key); }
      });
      element.append(controls);
    });
  });
}

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
