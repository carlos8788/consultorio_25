$URL = "https://consultorio-25.onrender.com/api/public/health"

while ($true) {
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$now] Ping a Render..." -ForegroundColor Cyan

    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()

        Invoke-WebRequest `
            -Uri $URL `
            -Method GET `
            -UseBasicParsing `
            -TimeoutSec 70 `
            | Out-Null

        $sw.Stop()
        Write-Host "[$now] OK - Tiempo: $($sw.Elapsed.TotalSeconds)s" -ForegroundColor Green
    }
    catch {
        Write-Host "[$now] ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "Esperando 7 minutos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 420
}
