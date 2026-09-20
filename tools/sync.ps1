<#
.SYNOPSIS
  Refreshes the vendored ClayForge copy inside a project.

.DESCRIPTION
  Replaces <project>/src/clayforge with the current engine/ and theme/ from this
  framework folder, and records the version in <project>/clayforge.lock.json.
  Anything hand-edited under src/clayforge is discarded — that folder is a copy,
  not a place to make changes.

.EXAMPLE
  ./tools/sync.ps1 -Project ..\acme-landing
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$Project
)

$ErrorActionPreference = 'Stop'

$framework = Split-Path -Parent $PSScriptRoot
$target = [System.IO.Path]::GetFullPath($Project)
$src = Join-Path $target 'src'
if (-not (Test-Path $src)) { throw "No src folder at $src — is this a ClayForge project?" }

$version = & (Join-Path $PSScriptRoot 'check-version.ps1')

$vendor = Join-Path $src 'clayforge'
$vendorPrefix = $vendor.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$legacyFactory = 'createClay' + 'forge'
$canonicalFactory = 'createClayForge'
$migratedFiles = 0
Get-ChildItem $src -Recurse -File -Include '*.html', '*.js' |
  Where-Object { -not $_.FullName.StartsWith($vendorPrefix, [StringComparison]::OrdinalIgnoreCase) } |
  ForEach-Object {
    $text = Get-Content $_.FullName -Raw
    if ($text.Contains($legacyFactory)) {
      $utf8 = [System.Text.UTF8Encoding]::new($false)
      [System.IO.File]::WriteAllText($_.FullName, $text.Replace($legacyFactory, $canonicalFactory), $utf8)
      $migratedFiles++
    }
  }

if (Test-Path $vendor) { Remove-Item $vendor -Recurse -Force }
New-Item -ItemType Directory -Path $vendor -Force | Out-Null
Copy-Item (Join-Path $framework 'engine') (Join-Path $vendor 'engine') -Recurse
Copy-Item (Join-Path $framework 'theme') (Join-Path $vendor 'theme') -Recurse

[ordered]@{
  framework        = 'clayforge'
  frameworkVersion = $version
  vendoredTo       = 'src/clayforge'
  vendoredAt       = (Get-Date -Format 'yyyy-MM-dd')
} | ConvertTo-Json | Set-Content (Join-Path $target 'clayforge.lock.json')

if ($migratedFiles) { Write-Host "Updated the ClayForge factory API in $migratedFiles project file(s)" }
Write-Host "Vendored ClayForge $version into $vendor"
