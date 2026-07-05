#requires -Version 5.1
<#
.SYNOPSIS
  Stok takip API’sini ve Vite React arayüzünü geliştirme için ayrı konsol pencerelerinde başlatır.

.DESCRIPTION
  - API: `dotnet run --launch-profile http` (varsayılan http://localhost:5087, vite.config proxy ile uyumlu)
  - Frontend: `npm run dev` (genelde http://localhost:5173)

.PARAMETER ApiPath
  API .csproj dosyasının bulunduğu klasör. Belirtilmezse $env:STOCK_API_PATH veya betik içindeki varsayılan kullanılır.

.PARAMETER FrontendOnly
  Yalnızca frontend penceresini açar.

.PARAMETER Install
  `npm install` çalıştırır (node_modules yoksa zaten otomatik çalışır).

.EXAMPLE
  .\run-dev.ps1

.EXAMPLE
  .\run-dev.ps1 -ApiPath "D:\repos\Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API"

.EXAMPLE
  .\run-dev.ps1 -FrontendOnly
#>
[CmdletBinding()]
param(
  [string] $ApiPath,
  [switch] $FrontendOnly,
  [switch] $Install
)

$ErrorActionPreference = "Stop"
$FrontendRoot = $PSScriptRoot

# API kökü: parametre > ortam değişkeni > otomatik adaylar
function Resolve-ApiPath([string] $Preferred) {
  $candidates = @(
    $Preferred,
    $env:STOCK_API_PATH,
    (Join-Path (Split-Path $FrontendRoot -Parent) "Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API"),
    "C:\Users\ahmet\OneDrive\Belgeler\GitHub\Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API",
    "C:\Users\ahmet\source\repos\Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API"
  ) | Where-Object { $_ -and (Test-Path $_) }

  foreach ($candidate in $candidates) {
    $resolved = Resolve-Path -LiteralPath $candidate -ErrorAction SilentlyContinue
    if ($resolved -and (Test-Path (Join-Path $resolved "Stock_Warehouse_Tracking_Project_API.csproj"))) {
      return $resolved.Path
    }
    if ($resolved -and (Get-ChildItem -Path $resolved -Filter "*.csproj" -File -ErrorAction SilentlyContinue)) {
      return $resolved.Path
    }
  }

  return $null
}

if (-not $ApiPath) {
  $ApiPath = Resolve-ApiPath $null
}
else {
  $ApiPath = Resolve-ApiPath $ApiPath
}

function Test-Command([string] $Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-Command "npm")) {
  Write-Error "npm bulunamadı. Node.js LTS kurulu olduğundan emin olun."
}
if (-not $FrontendOnly -and -not (Test-Command "dotnet")) {
  Write-Error "dotnet bulunamadı. .NET SDK kurulu olduğundan emin olun."
}

if (-not (Test-Path (Join-Path $FrontendRoot "package.json"))) {
  Write-Error "package.json bulunamadı. Betiği frontend proje kökünden çalıştırın: $FrontendRoot"
}

$nodeModules = Join-Path $FrontendRoot "node_modules"
if ($Install -or -not (Test-Path $nodeModules)) {
  Write-Host "npm install çalıştırılıyor..." -ForegroundColor Cyan
  Push-Location $FrontendRoot
  try {
    npm install
  }
  finally {
    Pop-Location
  }
}

if (-not $FrontendOnly) {
  if (-not $ApiPath) {
    Write-Error @"
API klasörü otomatik bulunamadı.
Çözüm: -ApiPath ile doğru yolu verin veya ortam değişkeni ayarlayın:
  `$env:STOCK_API_PATH = 'C:\Users\ahmet\OneDrive\Belgeler\GitHub\Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API'
  .\run-dev.ps1 -ApiPath `$env:STOCK_API_PATH
"@
  }

  $csproj = Get-ChildItem -Path $ApiPath -Filter "*.csproj" -File -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $csproj) {
    Write-Error "Bu klasörde .csproj yok: $ApiPath"
  }

  $apiCmd = @"
Set-Location -LiteralPath '$($ApiPath.Replace("'", "''"))'
`$host.ui.RawUI.WindowTitle = 'Stock API'
Write-Host 'Stock API — http://localhost:5087 (Swagger: /swagger)' -ForegroundColor Cyan
Write-Host 'Durdurmak için bu pencerede Ctrl+C' -ForegroundColor DarkGray
dotnet run --launch-profile http
"@

  Start-Process powershell.exe -ArgumentList @(
    "-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $apiCmd
  ) | Out-Null

  Write-Host "API penceresi açıldı; hazır olması bekleniyor..." -ForegroundColor Cyan

  $apiReady = $false
  $deadline = (Get-Date).AddSeconds(90)
  while ((Get-Date) -lt $deadline) {
    try {
      $health = Invoke-WebRequest -Uri "http://localhost:5087/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
      if ($health.StatusCode -eq 200) {
        $apiReady = $true
        break
      }
    }
    catch {
      Start-Sleep -Seconds 2
    }
  }

  if ($apiReady) {
    Write-Host "API hazır: http://localhost:5087" -ForegroundColor Green
  }
  else {
    Write-Warning @"
API 90 saniye içinde yanıt vermedi (http://localhost:5087).
Frontend yine de açılacak; girişte 'http proxy error / ECONNREFUSED' görürseniz API penceresini kontrol edin veya:
  cd '$ApiPath'
  dotnet run --launch-profile http
"@
  }
}

$feCmd = @"
Set-Location -LiteralPath '$($FrontendRoot.Replace("'", "''"))'
`$host.ui.RawUI.WindowTitle = 'Stock Frontend (Vite)'
Write-Host 'Vite — genelde http://localhost:5173' -ForegroundColor Cyan
Write-Host 'Durdurmak için bu pencerede Ctrl+C' -ForegroundColor DarkGray
npm run dev
"@

Start-Process powershell.exe -ArgumentList @(
  "-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $feCmd
) | Out-Null

Write-Host "Frontend penceresi açıldı." -ForegroundColor Green
Write-Host ""
Write-Host "Özet:" -ForegroundColor White
if (-not $FrontendOnly) {
  Write-Host "  API:      http://localhost:5087" -ForegroundColor Gray
}
Write-Host "  Arayüz:  Vite çıktısındaki URL (çoğunlukla http://localhost:5173)" -ForegroundColor Gray
Write-Host ""
Write-Host "API yolu farklıysa bir kez şunu kullanın:" -ForegroundColor DarkYellow
Write-Host "  .\run-dev.ps1 -ApiPath 'D:\yol\Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API'" -ForegroundColor DarkGray
