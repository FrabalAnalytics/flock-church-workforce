[CmdletBinding()]
param(
  [string]$OutputRoot = ".backups",
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Invoke-SupabaseDump {
  param([string[]]$Arguments)

  & npx.cmd --yes supabase @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Supabase CLI failed with exit code $LASTEXITCODE. No completed backup should be trusted."
  }
}

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$linkedProjectFile = Join-Path $repositoryRoot "supabase\.temp\project-ref"

if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
  throw "npx.cmd was not found. Install Node.js before running this backup."
}

if (-not (Test-Path -LiteralPath $linkedProjectFile)) {
  throw "This repository is not linked to Supabase. Run 'npx supabase link --project-ref YOUR_PROJECT_REF' first."
}

if ($CheckOnly) {
  Write-Output "Backup prerequisites are present. No database connection was made and no files were created."
  exit 0
}

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$resolvedOutputRoot = if ([System.IO.Path]::IsPathRooted($OutputRoot)) {
  [System.IO.Path]::GetFullPath($OutputRoot)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot $OutputRoot))
}
$backupDirectory = Join-Path $resolvedOutputRoot "flock-$timestamp"

New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

$rolesPath = Join-Path $backupDirectory "roles.sql"
$schemaPath = Join-Path $backupDirectory "schema.sql"
$dataPath = Join-Path $backupDirectory "data.sql"
$migrationSchemaPath = Join-Path $backupDirectory "migration-history-schema.sql"
$migrationDataPath = Join-Path $backupDirectory "migration-history-data.sql"

try {
  Invoke-SupabaseDump @("db", "dump", "--linked", "--role-only", "--file", $rolesPath)
  Invoke-SupabaseDump @("db", "dump", "--linked", "--file", $schemaPath)
  Invoke-SupabaseDump @("db", "dump", "--linked", "--data-only", "--use-copy", "--file", $dataPath)
  Invoke-SupabaseDump @("db", "dump", "--linked", "--schema", "supabase_migrations", "--file", $migrationSchemaPath)
  Invoke-SupabaseDump @("db", "dump", "--linked", "--schema", "supabase_migrations", "--data-only", "--use-copy", "--file", $migrationDataPath)

  $requiredFiles = @(
    $rolesPath,
    $schemaPath,
    $dataPath,
    $migrationSchemaPath,
    $migrationDataPath
  )

  foreach ($file in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $file) -or (Get-Item -LiteralPath $file).Length -eq 0) {
      throw "Expected backup file is missing or empty: $file"
    }
  }

  $projectRef = (Get-Content -LiteralPath $linkedProjectFile -Raw).Trim()
  $manifest = [ordered]@{
    format_version = 1
    created_at_utc = (Get-Date).ToUniversalTime().ToString("o")
    project_ref = $projectRef
    backup_type = "supabase-logical"
    auth_and_storage_internals_included = $false
    files = @($requiredFiles | ForEach-Object {
      $item = Get-Item -LiteralPath $_
      $hash = Get-FileHash -LiteralPath $_ -Algorithm SHA256
      [ordered]@{
        name = $item.Name
        size_bytes = $item.Length
        sha256 = $hash.Hash.ToLowerInvariant()
      }
    })
  }

  $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $backupDirectory "manifest.json") -Encoding utf8
  @"
Flock logical database backup

Created: $($manifest.created_at_utc)
Project reference: $projectRef

IMPORTANT:
- This directory contains personal data. Move it to encrypted, access-controlled storage.
- The Supabase CLI excludes managed Auth and Storage internals from this logical dump.
- Read docs/BACKUP_RECOVERY.md before attempting any restore.
- Never restore directly over production as a test.
"@ | Set-Content -LiteralPath (Join-Path $backupDirectory "README.txt") -Encoding utf8

  Write-Output "Backup completed: $backupDirectory"
  Write-Output "Verify it with: powershell -ExecutionPolicy Bypass -File scripts\verify-backup.ps1 -BackupDirectory `"$backupDirectory`""
  Write-Warning "Move this backup to encrypted storage. Do not commit it to Git."
} catch {
  Write-Error "Backup did not complete: $($_.Exception.Message)"
  Write-Warning "The incomplete directory was retained for diagnosis: $backupDirectory"
  exit 1
}
