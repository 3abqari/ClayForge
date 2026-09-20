[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$Version
)

$ErrorActionPreference = 'Stop'

$framework = Split-Path -Parent $PSScriptRoot
$semver = '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$'
if ($Version -notmatch $semver) {
  throw "Version must use semantic versioning (for example, 1.2.3 or 1.2.3-beta.1)."
}

$storePath = Join-Path $framework 'engine/store.js'
$store = Get-Content $storePath -Raw
$matches = [regex]::Matches($store, 'ENGINE_VERSION\s*=\s*"([^"]+)"')
if ($matches.Count -ne 1) {
  throw "Expected exactly one ENGINE_VERSION in engine/store.js; found $($matches.Count)."
}

$utf8 = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText((Join-Path $framework 'VERSION'), "$Version`n", $utf8)
$store = [regex]::Replace($store, 'ENGINE_VERSION\s*=\s*"[^"]+"', "ENGINE_VERSION = `"$Version`"")
[System.IO.File]::WriteAllText($storePath, $store, $utf8)

& (Join-Path $PSScriptRoot 'check-version.ps1') -ExpectedVersion $Version | Out-Null
Write-Host "ClayForge version set to $Version"