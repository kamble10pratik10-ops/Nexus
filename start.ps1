# SAT-SA Nexus: Supervisory Analytics Tool for SOC Assessment
# Launch Script for Air-Gapped / Local Environment

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " SAT-SA NEXUS: Supervisory Analytics Tool for SOC Assessment" -ForegroundColor White
Write-Host " National Cyber Assessment Platform // NCIIPC & NTRO Evaluation" -ForegroundColor Gray
Write-Host " Mode: Air-Gapped // Offline Supervisory Analysis" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan

$scriptRoot = $PSScriptRoot

Write-Host "[1/2] Starting FastAPI Supervisory Analytics Backend (Port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "main.py" -WorkingDirectory "$scriptRoot/backend"

Write-Host "[2/2] Starting Frontend Command Center (Port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$scriptRoot/frontend"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "SAT-SA Nexus successfully launched!" -ForegroundColor Green
Write-Host "Frontend Command Center : http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API & Docs      : http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Logins:" -ForegroundColor White
Write-Host "  Supervisor    : supervisor / Supervisor@2026" -ForegroundColor Gray
Write-Host "  Analyst       : analyst / Analyst@2026" -ForegroundColor Gray
Write-Host "  Administrator : admin / AdminPassword@2026" -ForegroundColor Gray
