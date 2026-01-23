<# 
audit-gitignore.ps1 (PowerShell robusto)
- Escanea el proyecto en busca de archivos "riesgosos" (env, llaves, db, secretos) y reporta:
  - TRACKED
  - IGNORED
  - UNTRACKED (NOT IGNORED)
- No revienta aunque git devuelva "pathspec did not match"
#>

Set-StrictMode -Version Latest

# Importante: no queremos que mensajes de git.exe rompan el script
$ErrorActionPreference = "Continue"

function Test-IsGitRepo {
  try {
    $null = & git rev-parse --is-inside-work-tree 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}

function Get-GitExitCode {
  param(
    [Parameter(Mandatory=$true)][string[]]$Args
  )
  try {
    # 2>&1 captura stderr como stdout, y Out-Null evita que PowerShell lo trate como error
    & git @Args 2>&1 | Out-Null
  } catch {
    # Si PowerShell igual lanza excepción, la ignoramos y seguimos
  }
  return $LASTEXITCODE
}

$IsRepo = Test-IsGitRepo

Write-Host "== Current folder ==" -ForegroundColor Cyan
Write-Host (Get-Location).Path

if ($IsRepo) {
  Write-Host "`n== Repo root ==" -ForegroundColor Cyan
  & git rev-parse --show-toplevel 2>$null

  Write-Host "`n== Branch / Remote ==" -ForegroundColor Cyan
  & git branch --show-current 2>$null
  & git remote -v 2>$null
} else {
  Write-Host "`n[WARN] This folder is not a Git repository yet (no .git). Tracking/ignore checks will be skipped." -ForegroundColor Yellow
}

# Patrones típicos de cosas que NO deberían subirse
$patterns = @(
  "*.env", "*.env.*",
  "*.pem", "*.key", "*.p12", "*.pfx",
  "*secret*", "*secrets*", "*password*", "*passwd*",
  "*.sqlite", "*.db",
  "id_rsa", "id_ed25519"
)

Write-Host "`n== Scanning working tree for risky files ==" -ForegroundColor Cyan

# Listado de archivos (excluye carpetas típicas pesadas)
$files = Get-ChildItem -Recurse -File -Force |
  Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\dist\\' -and
    $_.FullName -notmatch '\\dist-ssr\\' -and
    $_.FullName -notmatch '\\\.git\\'
  }

$risky = New-Object System.Collections.Generic.List[object]

foreach ($f in $files) {
  foreach ($p in $patterns) {
    if ($f.Name -like $p -or $f.FullName -like "*$p*") {
      $risky.Add($f) | Out-Null
      break
    }
  }
}

if ($risky.Count -eq 0) {
  Write-Host "No risky-looking files found by patterns." -ForegroundColor Green
} else {
  Write-Host ("Found {0} risky-looking files:" -f $risky.Count) -ForegroundColor Yellow

  foreach ($f in ($risky | Sort-Object FullName)) {
    $rel = Resolve-Path -Relative $f.FullName

    if ($IsRepo) {
      # TRACKED? 0 = trackeado, 1 = no trackeado
      $exitTracked = Get-GitExitCode -Args @("ls-files","--error-unmatch","--",$rel)
      $isTracked = ($exitTracked -eq 0)

      # IGNORED? 0 = ignored, 1 = not ignored
      $exitIgnored = Get-GitExitCode -Args @("check-ignore","-q","--",$rel)
      $isIgnored = ($exitIgnored -eq 0)

      $status = @()
      if ($isTracked) { $status += "TRACKED" }
      if ($isIgnored) { $status += "IGNORED" }
      if (-not $isTracked -and -not $isIgnored) { $status += "UNTRACKED (NOT IGNORED)" }

      Write-Host ("- {0}  =>  {1}" -f $rel, ($status -join ", "))
    } else {
      Write-Host ("- {0}" -f $rel)
    }
  }
}

Write-Host "`n== Biggest folders (top 15) ==" -ForegroundColor Cyan

$dirSizes = Get-ChildItem -Directory -Force | ForEach-Object {
  $size = (Get-ChildItem $_.FullName -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
  if ($null -eq $size) { $size = 0 }
  [PSCustomObject]@{ Folder = $_.Name; SizeMB = [math]::Round(($size/1MB), 2) }
} | Sort-Object SizeMB -Descending | Select-Object -First 15

$dirSizes | Format-Table -AutoSize

Write-Host "`nDone." -ForegroundColor Green
