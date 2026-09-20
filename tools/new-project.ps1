<#
.SYNOPSIS
  Creates a new Clayforge project folder outside the framework repo.

.DESCRIPTION
  Copies templates/starter into the target folder, fills in the project id and
  name, then vendors the framework (engine/ + theme/) into src/clayforge.
  No build step, no package manager.

.EXAMPLE
  ./tools/new-project.ps1 -Path ..\acme-landing -Name "Acme — Landing Page"
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$Path,

  [string]$Name,

  [string]$Id,

  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$framework = Split-Path -Parent $PSScriptRoot
$target = [System.IO.Path]::GetFullPath($Path)

if ($target.StartsWith($framework, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Projects must live outside the framework folder. $framework is for Clayforge itself."
}

if ((Test-Path $target) -and (Get-ChildItem $target -Force | Measure-Object).Count -gt 0 -and -not $Force) {
  throw "$target already exists and is not empty. Pass -Force to overwrite."
}

if (-not $Id) { $Id = (Split-Path $target -Leaf).ToLower() -replace '[^a-z0-9-]', '-' }
if (-not $Name) { $Name = (Get-Culture).TextInfo.ToTitleCase(($Id -replace '-', ' ')) }

New-Item -ItemType Directory -Path $target -Force | Out-Null
Copy-Item (Join-Path $framework 'templates/starter/*') $target -Recurse -Force

Get-ChildItem $target -Recurse -File | ForEach-Object {
  $text = Get-Content $_.FullName -Raw
  if ($text -match '\{\{PROJECT_(ID|NAME)\}\}') {
    ($text -replace '\{\{PROJECT_ID\}\}', $Id -replace '\{\{PROJECT_NAME\}\}', $Name) |
      Set-Content $_.FullName -NoNewline
  }
}

& (Join-Path $PSScriptRoot 'sync.ps1') -Project $target

Write-Host "Created $Name at $target"
Write-Host "  cd `"$target\src`"; python -m http.server 5173"
