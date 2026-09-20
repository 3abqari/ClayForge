---
applyTo: "**"
description: "Framework repo boundary: Clayforge holds no client projects."
---

# This repo is the framework only

This repository contains Clayforge itself. It must never contain a client
project instance.

- Client projects live in their own workspace folder and vendor a copy of the
  framework at `<project>/src/clayforge/`.
- Scaffold one with `./tools/new-project.ps1 -Path ..\<id> -Name "..."`.
  The script refuses to write inside this folder.
- `templates/starter/` is scaffold source, not a project. Its files use
  `{{PROJECT_ID}}` / `{{PROJECT_NAME}}` placeholders and are copied out verbatim.
- Do not add `projects/`, `.deploy/`, or any client content, copy, or branding
  to this repo.
