[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$BackupDirectory
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$resolvedDirectory = (Resolve-Path -LiteralPath $BackupDirectory).Path
$manifestPath = Join-Path $resolvedDirectory "manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "manifest.json was not found in $resolvedDirectory"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($manifest.format_version -ne 1 -or -not $manifest.files) {
  throw "The backup manifest format is missing or unsupported."
}

$failures = @()
foreach ($expected in $manifest.files) {
  $path = Join-Path $resolvedDirectory $expected.name
  if (-not (Test-Path -LiteralPath $path)) {
    $failures += "Missing: $($expected.name)"
    continue
  }

  $item = Get-Item -LiteralPath $path
  $actualHash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($item.Length -ne $expected.size_bytes) {
    $failures += "Size mismatch: $($expected.name)"
  }
  if ($actualHash -ne $expected.sha256) {
    $failures += "SHA-256 mismatch: $($expected.name)"
  }
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ }
  throw "Backup verification failed. Do not rely on this backup."
}

Write-Output "Backup verified successfully: $resolvedDirectory"
Write-Output "Created at: $($manifest.created_at_utc)"
Write-Output "Project reference: $($manifest.project_ref)"
Write-Warning "Checksum verification detects corruption; it does not prove that a database restore will succeed."
