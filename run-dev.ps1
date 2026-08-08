#requires -Version 5.1
<#
.SYNOPSIS
  Stok takip API + Vite frontend gelistirme ortamini baslatir.

.DESCRIPTION
  - API: mumkunse API projesindeki run-api.ps1, yoksa dotnet run --launch-profile http
  - Frontend: npm run dev (http://localhost:5173, Vite proxy -> http://localhost:5087)

.PARAMETER ApiPath
  API .csproj / run-api.ps1 klasoru.

.PARAMETER FrontendOnly
  Yalnizca frontend penceresini acar.

.PARAMETER ApiOnly
  Yalnizca API penceresini acar.

.PARAMETER Install
  Zorla npm install calistirir.

.PARAMETER SkipKill
  5087 / 5173 portlarindaki eski surecleri kapatmaz.

.EXAMPLE
  .\run-dev.ps1

.EXAMPLE
  .\run-dev.ps1 -FrontendOnly
#>
[CmdletBinding()]
param(
    [string] $ApiPath,
    [switch] $FrontendOnly,
    [switch] $ApiOnly,
    [switch] $Install,
    [switch] $SkipKill,
    [int] $ApiPort = 5087,
    [int] $FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$FrontendRoot = $PSScriptRoot

function Test-Command([string] $Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

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
        $csproj = Join-Path $resolved "Stock_Warehouse_Tracking_Project_API.csproj"
        if (Test-Path -LiteralPath $csproj) { return $resolved }
        if (Get-ChildItem -Path $resolved -Filter "*.csproj" -File -ErrorAction SilentlyContinue) {
            return $resolved
        }
    }
    return $null
}

function Wait-HttpOk([string] $Url, [int] $TimeoutSeconds = 90) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) { return $true }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

function Start-ConsoleScript {
    param(
        [Parameter(Mandatory)] [string] $WorkingDirectory,
        [Parameter(Mandatory)] [string] $WindowTitle,
        [Parameter(Mandatory)] [string] $ScriptBody
    )

    $tempDir = Join-Path $env:TEMP "stock-warehouse-dev"
    if (-not (Test-Path -LiteralPath $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir | Out-Null
    }

    $safeTitle = ($WindowTitle -replace '[^\w\- ]', '')
    $scriptPath = Join-Path $tempDir ("{0}-{1}.ps1" -f $safeTitle, [guid]::NewGuid().ToString("N"))

    $header = @"
Set-Location -LiteralPath '$($WorkingDirectory.Replace("'", "''"))'
`$Host.UI.RawUI.WindowTitle = '$($WindowTitle.Replace("'", "''"))'
"@

    Set-Content -LiteralPath $scriptPath -Value ($header + "`r`n" + $ScriptBody) -Encoding UTF8

    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $scriptPath
    ) | Out-Null
}

Write-Host "==> Stock Warehouse Dev" -ForegroundColor Cyan
Write-Host "    Frontend: $FrontendRoot"
Write-Host ""

if (-not (Test-Path (Join-Path $FrontendRoot "package.json"))) {
    Write-Error "package.json bulunamadi. Betigi frontend kokunden calistirin: $FrontendRoot"
}

if (-not $FrontendOnly -and -not (Test-Command "dotnet")) {
    Write-Error "dotnet bulunamadi. .NET SDK kurulu olmali."
}
if (-not $ApiOnly -and -not (Test-Command "npm")) {
    Write-Error "npm bulunamadi. Node.js LTS kurulu olmali."
}

if (-not $SkipKill) {
    if (-not $FrontendOnly) { Stop-PortListeners -Port $ApiPort }
    if (-not $ApiOnly) { Stop-PortListeners -Port $FrontendPort }
    Start-Sleep -Seconds 1
}

$envFile = Join-Path $FrontendRoot ".env"
$envExample = Join-Path $FrontendRoot ".env.example"
if (-not (Test-Path -LiteralPath $envFile) -and (Test-Path -LiteralPath $envExample)) {
    Copy-Item -LiteralPath $envExample -Destination $envFile
    Write-Host "==> .env olusturuldu (.env.example kopyalandi)" -ForegroundColor Green
}

if (-not $ApiOnly) {
    $nodeModules = Join-Path $FrontendRoot "node_modules"
    if ($Install -or -not (Test-Path -LiteralPath $nodeModules)) {
        Write-Host "==> npm install..." -ForegroundColor Cyan
        Push-Location $FrontendRoot
        try { npm install } finally { Pop-Location }
    }
}

if (-not $FrontendOnly) {
    $ApiPath = Resolve-ApiPath $ApiPath
    if (-not $ApiPath) {
        Write-Error "API klasoru bulunamadi. Ornek: .\run-dev.ps1 -ApiPath 'C:\...\Stock_Warehouse_Tracking_Project_API\Stock_Warehouse_Tracking_Project_API'"
    }

    Write-Host "==> API yolu: $ApiPath" -ForegroundColor Gray

    $runApiScript = Join-Path $ApiPath "run-api.ps1"
    if (Test-Path -LiteralPath $runApiScript) {
        # run-api kendi portunu tekrar kill eder
        $apiBody = "& .\run-api.ps1 -Port $ApiPort"
    } else {
        $apiBody = @"
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Write-Host 'Stock API - http://localhost:$ApiPort (Swagger: /swagger)' -ForegroundColor Cyan
dotnet run --launch-profile http
"@
    }

    Start-ConsoleScript -WorkingDirectory $ApiPath -WindowTitle "Stock API" -ScriptBody $apiBody

    Write-Host "==> API penceresi acildi; health bekleniyor..." -ForegroundColor Cyan
    if (Wait-HttpOk -Url "http://localhost:$ApiPort/health" -TimeoutSeconds 90) {
        Write-Host "==> API hazir: http://localhost:$ApiPort" -ForegroundColor Green
        try {
            $sap = Invoke-WebRequest -Uri "http://localhost:$ApiPort/health/sap" -UseBasicParsing -TimeoutSec 5
            Write-Host "==> SAP health: $($sap.Content)" -ForegroundColor Green
        } catch {
            Write-Host "==> SAP health kontrolu basarisiz (API ayakta; SAP sonra da acilabilir)" -ForegroundColor Yellow
        }
    } else {
        Write-Warning "API $ApiPort portunda 90 sn icinde yanit vermedi. Frontend yine de acilacak."
    }
}

if (-not $ApiOnly) {
    $runFrontend = Join-Path $FrontendRoot "run-frontend.ps1"
    if (Test-Path -LiteralPath $runFrontend) {
        # run-frontend kendi portunu tekrar kill eder
        $feArgs = "-Port $FrontendPort"
        if ($Install) { $feArgs += " -Install" }
        $feBody = "& .\run-frontend.ps1 $feArgs"
    } else {
        $feBody = "npm run dev -- --host 127.0.0.1 --port $FrontendPort"
    }

    Start-ConsoleScript -WorkingDirectory $FrontendRoot -WindowTitle "Stock Frontend" -ScriptBody $feBody
    Write-Host "==> Frontend penceresi acildi." -ForegroundColor Green
}

Write-Host ""
Write-Host "Ozet:" -ForegroundColor White
if (-not $FrontendOnly) {
    Write-Host "  API:      http://localhost:$ApiPort  (swagger: /swagger)" -ForegroundColor Gray
}
if (-not $ApiOnly) {
    Write-Host "  Arayuz:   http://localhost:$FrontendPort" -ForegroundColor Gray
}
Write-Host ""
