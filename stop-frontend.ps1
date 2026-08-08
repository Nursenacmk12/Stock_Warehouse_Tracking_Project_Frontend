#requires -Version 5.1
<#
.SYNOPSIS
  Frontend (Vite) surecini durdurur.

.EXAMPLE
  .\stop-frontend.ps1
#>
[CmdletBinding()]
param(
    [int] $Port = 5173
)

$ErrorActionPreference = "Continue"

function Stop-PortListeners([int] $Port) {
    $pids = @(
        Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            Where-Object { $_ -and $_ -gt 0 }
    )

    if ($pids.Count -eq 0) {
        Write-Host ("==> Port {0} dinleyen surec yok." -f $Port) -ForegroundColor DarkGray
        return
    }

    foreach ($procId in $pids) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction Stop
            Write-Host ("==> Durduruluyor: {0} (PID {1}) port {2}" -f $proc.ProcessName, $procId, $Port) -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction Stop
        } catch {
            Write-Host ("==> PID {0} kapatilamadi: {1}" -f $procId, $_.Exception.Message) -ForegroundColor DarkYellow
        }
    }

    Start-Sleep -Seconds 1
    $left = @(
        Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    )
    if ($left.Count -eq 0) {
        Write-Host ("==> Port {0} serbest." -f $Port) -ForegroundColor Green
    } else {
        Write-Host ("==> Port {0} hala kullanimda olabilir." -f $Port) -ForegroundColor Yellow
    }
}

Write-Host "==> Frontend durduruluyor (port $Port)..." -ForegroundColor Cyan
Stop-PortListeners -Port $Port
