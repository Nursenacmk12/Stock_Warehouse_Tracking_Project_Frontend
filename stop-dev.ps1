#requires -Version 5.1
<#
.SYNOPSIS
  API + Frontend gelistirme sureclerini birlikte durdurur.

.EXAMPLE
  .\stop-dev.ps1
#>
[CmdletBinding()]
param(
    [int] $ApiPort = 5087,
    [int] $FrontendPort = 5173,
    [string] $ApiPath
)

$ErrorActionPreference = "Continue"
$FrontendRoot = $PSScriptRoot

function Resolve-ApiPath([string] $Preferred) {
    $candidates = @(
        $Preferred,
        $env:STOCK_API_PATH,
        (Join-Path (Split-Path $FrontendRoot -Parent) "Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API"),
        "C:\Users\camko\OneDrive\Belgeler\GitHub\Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API"
    ) | Where-Object { $_ }

    foreach ($candidate in $candidates) {
        if (-not (Test-Path -LiteralPath $candidate)) { continue }
        $resolved = (Resolve-Path -LiteralPath $candidate).Path
        if (Test-Path -LiteralPath (Join-Path $resolved "stop-api.ps1")) { return $resolved }
        if (Test-Path -LiteralPath (Join-Path $resolved "Stock_Warehouse_Tracking_Project_API.csproj")) { return $resolved }
    }
    return $null
}

Write-Host "==> Dev ortami durduruluyor..." -ForegroundColor Cyan

$stopFrontend = Join-Path $FrontendRoot "stop-frontend.ps1"
if (Test-Path -LiteralPath $stopFrontend) {
    & $stopFrontend -Port $FrontendPort
} else {
    Write-Host "==> stop-frontend.ps1 bulunamadi" -ForegroundColor Yellow
}

$ApiPath = Resolve-ApiPath $ApiPath
if ($ApiPath) {
    $stopApi = Join-Path $ApiPath "stop-api.ps1"
    if (Test-Path -LiteralPath $stopApi) {
        & $stopApi -Port $ApiPort
    } else {
        Write-Host "==> stop-api.ps1 bulunamadi: $ApiPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "==> API yolu bulunamadi; sadece frontend durduruldu." -ForegroundColor Yellow
    Write-Host "    API icin: stop-api.ps1 veya .\stop-dev.ps1 -ApiPath 'C:\...\Stock_Warehouse_Tracking_Project_API'" -ForegroundColor DarkGray
}

Write-Host "==> Bitti." -ForegroundColor Green
