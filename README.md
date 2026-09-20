# ClayForge

A light, build-free design framework for shipping a client prototype fast — then
letting the client edit the copy *and* the design themselves, in their own
browser, without touching the code.

- **AI writes the design.** One `design.css` per project; everything else is markup and JSON.
- **The client edits safely.** Controls appear per section, limited to what the designer allowed.
- **Design palettes stay coherent.** Projects can expose global color tokens
  that update every section in the selected design at once.
- **Reset always works.** Three cascade layers (`base`, `design`, `client`) mean
  resetting is dropping a layer, never rewriting CSS.
- **Nothing leaves the browser.** Edits live in `localStorage`, and the client can
  export a versioned JSON snapshot so the designer can reproduce their exact view.
- **No build step.** Plain ES modules and CSS, served by any static host.

## This repo is the framework only

Client projects live in their own folders and vendor a copy of the framework.

```
theme/base.css          locked defaults + cascade layer order
engine/                 discovery, controls, persistence, editor chrome
templates/starter/      scaffold source for new projects
tools/new-project.ps1   create a project folder elsewhere
tools/sync.ps1          refresh a project's vendored framework copy
VERSION                 current ClayForge release version
```

## Create a project

```powershell
./tools/new-project.ps1 -Path ..\acme-landing -Name "Acme - Landing"
cd ..\acme-landing\src
python -m http.server 5173        # http://localhost:5173/
```

On Windows, ports 8080-8093 are in a reserved exclusion range and will fail with
`WinError 10013`. Pick something outside it.

Add `?mode=designer` to unlock every design control.

## Deploy a project

```powershell
cd ..\acme-landing
npx wrangler deploy               # assets.directory is "src", no staging
```

## Upgrade a project to a newer ClayForge

```powershell
./tools/sync.ps1 -Project ..\acme-landing
```

The project's `clayforge.lock.json` records the exact framework version copied
into it. The prototype toolbar displays that same vendored runtime version as
`ClayForge vX.Y.Z`.

## Release a new ClayForge version

ClayForge uses semantic versioning. Update the repository and runtime version
together, commit the result, then tag that commit:

```powershell
./tools/set-version.ps1 -Version 1.2.3
git add VERSION engine/store.js
git commit -m "Release ClayForge 1.2.3"
git tag v1.2.3
git push origin main v1.2.3
```

GitHub Actions rejects mismatched repository, runtime, or release-tag versions.

Future framework work is tracked in [ROADMAP.md](ROADMAP.md).

## Author markup

```html
<section data-edit="hero" data-edit-label="Hero" data-edit-controls="background,color,fontSize">
  <h1><span data-field="heroTitle"></span></h1>
  <ul data-field="heroPoints" data-field-type="list"></ul>
</section>
```

```json
{ "heroTitle": "Your car deserves better.", "heroPoints": ["Mobile", "Insured"] }
```

That is enough for the engine to render the copy, attach Style / Reset / Hide
controls, persist edits, and export a snapshot. Full contract in `AGENTS.md`.

