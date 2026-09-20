# {{PROJECT_NAME}}

Built on [Clayforge](https://github.com/) — a light design framework. The client
edits copy and design in their own browser; changes stay in `localStorage` and
export as a JSON snapshot.

## Layout

```
wrangler.jsonc          Cloudflare deploy, site root = src/
clayforge.lock.json     which framework version is vendored here
src/
  index.html            markup: data-edit sections, data-field copy slots
  content.json          the baseline copy
  clayforge.json        project id/name/template + section overrides
  design.css            the entire look, inside @layer design
  clayforge/            VENDORED FRAMEWORK — do not edit, refresh with sync.ps1
```

## Run

```powershell
cd src
python -m http.server 5173      # http://localhost:5173/
```

On Windows, ports 8080-8093 are reserved and fail with `WinError 10013`.

Add `?mode=designer` to unlock every design control.

## Deploy

```powershell
npx wrangler deploy
```

## Update the framework

```powershell
<path-to-clayforge>\tools\sync.ps1 -Project .
```
