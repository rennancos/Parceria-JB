param(
  [Parameter(Mandatory = $true)] [string]$Source,
  [Parameter(Mandatory = $true)] [string]$Target,
  [string]$ServiceName,
  [string]$HealthUrl = 'http://127.0.0.1:8000/api/saude',
  [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$targetPath = [IO.Path]::GetFullPath($Target)
if ($sourcePath.TrimEnd('\') -ieq $targetPath.TrimEnd('\')) { throw 'Source e Target não podem ser a mesma pasta.' }
if (-not (Test-Path -LiteralPath (Join-Path $sourcePath 'package.json'))) { throw 'Source não parece ser a raiz do projeto.' }
if (-not (Test-Path -LiteralPath (Join-Path $sourcePath 'servidor\servidor.js'))) { throw 'Source não contém servidor\servidor.js.' }
if (-not (Test-Path -LiteralPath $targetPath)) { throw 'Target precisa existir e ser preparado previamente.' }

if (-not $SkipTests) {
  Push-Location $sourcePath
  try { & npm test; if ($LASTEXITCODE -ne 0) { throw "Testes falharam (exit $LASTEXITCODE)." } }
  finally { Pop-Location }
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path (Split-Path -Parent $targetPath) ".pajb-backups\$stamp"
$roots = @('index.html', 'css', 'js', 'Fotos', 'servidor', 'package.json')
$copyArgs = @('/E', '/R:2', '/W:2', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')

New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
foreach ($root in $roots) {
  $from = Join-Path $targetPath $root
  if (-not (Test-Path -LiteralPath $from)) { continue }
  $to = Join-Path $backupPath $root
  if ((Get-Item -LiteralPath $from).PSIsContainer) {
    New-Item -ItemType Directory -Force -Path $to | Out-Null
    & robocopy $from $to @copyArgs /XD (Join-Path $from 'dados')
    if ($LASTEXITCODE -ge 8) { throw "Backup falhou para $root (exit $LASTEXITCODE)." }
  } else {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $to) | Out-Null
    Copy-Item -LiteralPath $from -Destination $to
  }
}

function Sync-Root($root) {
  $from = Join-Path $sourcePath $root
  $to = Join-Path $targetPath $root
  if ((Get-Item -LiteralPath $from).PSIsContainer) {
    New-Item -ItemType Directory -Force -Path $to | Out-Null
    & robocopy $from $to @copyArgs /XD (Join-Path $from 'dados')
    if ($LASTEXITCODE -ge 8) { throw "Publicação falhou para $root (exit $LASTEXITCODE)." }
  } else {
    Copy-Item -LiteralPath $from -Destination $to -Force
  }
}

try {
  if ($ServiceName) {
    $svc = Get-Service -Name $ServiceName
    if ($svc.Status -ne 'Stopped') { Stop-Service -Name $ServiceName -Force }
    foreach ($root in $roots) { Sync-Root $root }
    Start-Service -Name $ServiceName
  } else {
    foreach ($root in $roots) { Sync-Root $root }
  }

  $saude = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 15
  if ($saude.StatusCode -ne 200 -or $saude.Content -notmatch '"ok"\s*:\s*true') { throw 'Verificação de saúde falhou.' }
  Write-Host "Publicação concluída. Backup: $backupPath"
} catch {
  if ($ServiceName) {
    $svc = Get-Service -Name $ServiceName
    if ($svc.Status -ne 'Stopped') { Stop-Service -Name $ServiceName -Force }
  }
  foreach ($root in $roots) {
    $from = Join-Path $backupPath $root
    if (-not (Test-Path -LiteralPath $from)) { continue }
    $to = Join-Path $targetPath $root
    if ((Get-Item -LiteralPath $from).PSIsContainer) {
      & robocopy $from $to @copyArgs /XD (Join-Path $from 'dados') | Out-Null
    } else { Copy-Item -LiteralPath $from -Destination $to -Force }
  }
  if ($ServiceName) { Start-Service -Name $ServiceName }
  throw "Publicação revertida a partir de $backupPath. $($_.Exception.Message)"
}
