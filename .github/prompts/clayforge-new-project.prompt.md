---
mode: agent
description: "Scaffold a new Clayforge client project in its own workspace folder."
---

# New Clayforge project

Create a complete client prototype **outside** this repo. Clayforge holds no
project instances. Read `AGENTS.md` first.

## 1. Gather the brief

If the user has not already supplied these, ask for them in one batch using the
ask-questions tool, giving a recommended option plus alternatives plus a
free-text field, and always offer "Defer this question for later":

- Target folder path, project id (kebab-case), and display name
- What the artifact is (landing page, one-pager, 4x9 print card, menu, flyer)
- Sections needed, top to bottom
- Brand colours, type feel, and tone of voice
- Whether printing / PDF export is required
- Which sections the client may hide, and how much design power they get

Infer anything obvious rather than asking.

## 2. Scaffold

```powershell
./tools/new-project.ps1 -Path <folder> -Id <id> -Name "<name>"
```

This copies `templates/starter`, fills in the tokens, and vendors the framework
into `<folder>/src/clayforge`. Never hand-copy `engine/` or `theme/`.

## 3. Replace the starter content

In `<folder>/src`:

- `clayforge.json` — confirm id/name/template, set `print` and any section overrides.
- `content.json` — real, specific copy. No lorem ipsum.
- `index.html` — semantic markup, `data-edit` on sections, empty `data-field`
  children for every piece of copy.
- `design.css` — the whole look, inside `@layer design`, driven by a small set of
  custom properties at the top so re-skinning is cheap.
- `print.css` — add and link it only if the artifact is printed.

## 4. Check your work

- Every `data-field` in the markup has a matching key in `content.json`, and vice versa.
- No `data-field` shares an element with `data-edit`.
- No `!important`, no hand-written `@layer client`, no inline `style=` attributes.
- Nothing under `src/clayforge/` was edited.
- Hiding any hideable section still leaves a sane layout — add
  `:has(> [data-edit-hidden])` reflow rules where a track would collapse badly.
- Report the local command and URL. Do not start a server or open a browser
  unless the user asks.
