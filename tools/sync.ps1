<#
.SYNOPSIS
  Refreshes the vendored Clayforge copy inside a project.

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
if (-not (Test-Path $src)) { throw "No src folder at $src — is this a Clayforge project?" }

$version = & (Join-Path $PSScriptRoot 'check-version.ps1')

$vendor = Join-Path $src 'clayforge'
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

Write-Host "Vendored Clayforge $version into $vendor"
