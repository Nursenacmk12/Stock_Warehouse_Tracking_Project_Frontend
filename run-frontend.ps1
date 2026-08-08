#requires -Version 5.1
<#
.SYNOPSIS
  Yalnizca Vite frontend gelistirme sunucusunu baslatir.

.EXAMPLE
  .\run-frontend.ps1

.EXAMPLE
  .\run-frontend.ps1 -Install
#>
[CmdletBinding()]
param(
    [switch] $Install,
    [switch] $SkipKill,
    [int] $Port = 5173
)

$ErrorActionPreference = "Stop"
$FrontendRoot = $PSScriptRoot
Set-Location $FrontendRoot

function Stop-PortListeners([int] $Port) {
    $pids = @(
        Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            Where-Object { $_ -and $_ -gt 0 }
    )
    foreach ($procId in $pids) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            Write-Host ("==> Port {0}: {1} (PID {2}) kapatiliyor..." -f $Port, $proc.ProcessName, $procId) -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction Stop
        } catch {
            Write-Host ("==> Port {0} PID {1} kapatilamadi: {2}" -f $Port, $procId, $_.Exception.Message) -ForegroundColor DarkYellow
        }
    }
    if ($pids.Count -gt 0) {
        Start-Sleep -Seconds 1
    }
}

if (-not (Test-Path (Join-Path $FrontendRoot "package.json"))) {
    Write-Error "package.json bulunamadi: $FrontendRoot"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm bulunamadi. Node.js LTS kurulu olmali."
}

Write-Host "==> Stock Warehouse Frontend" -ForegroundColor Cyan
Write-Host "    Port: $Port"
Write-Host ""

if (-not $SkipKill) {
    Stop-PortListeners -Port $Port
}

$envFile = Join-Path $FrontendRoot ".env"
$envExample = Join-Path $FrontendRoot ".env.example"
if (-not (Test-Path -LiteralPath $envFile) -and (Test-Path -LiteralPath $envExample)) {
    Copy-Item -LiteralPath $envExample -Destination $envFile
    Write-Host "==> .env olusturuldu (.env.example kopyalandi)" -ForegroundColor Green
}

$nodeModules = Join-Path $FrontendRoot "node_modules"
if ($Install -or -not (Test-Path -LiteralPath $nodeModules)) {
    Write-Host "==> npm install..." -ForegroundColor Cyan
    npm install
}

Write-Host "==> Starting Vite (Ctrl+C to stop)..." -ForegroundColor Cyan
Write-Host "    UI: http://localhost:$Port"
Write-Host "    API proxy: /api -> http://localhost:5087"
Write-Host ""

npm run dev -- --host 127.0.0.1 --port $Port
