[CmdletBinding()]
param(
  [string]$ExpectedVersion
)

$ErrorActionPreference = 'Stop'

$framework = Split-Path -Parent $PSScriptRoot
$version = (Get-Content (Join-Path $framework 'VERSION') -Raw).Trim()
$semver = '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$'

if ($version -notmatch $semver) {
  throw "VERSION must contain one semantic version; found '$version'."
}

$store = Get-Content (Join-Path $framework 'engine/store.js') -Raw
$matches = [regex]::Matches($store, 'ENGINE_VERSION\s*=\s*"([^"]+)"')
if ($matches.Count -ne 1) {
  throw "Expected exactly one ENGINE_VERSION in engine/store.js; found $($matches.Count)."
}

$engineVersion = $matches[0].Groups[1].Value
if ($engineVersion -ne $version) {
  throw "Version mismatch: VERSION is $version but ENGINE_VERSION is $engineVersion."
}

if ($ExpectedVersion -and $ExpectedVersion -ne $version) {
  throw "Release mismatch: expected $ExpectedVersion but VERSION is $version."
}

Write-Output $version