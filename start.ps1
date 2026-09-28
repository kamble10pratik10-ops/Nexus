Start-Process -NoNewWindow -FilePath "python" -ArgumentList "backend/main.py" -WorkingDirectory "$PSScriptRoot"
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$PSScriptRoot/frontend"
Write-Host "SAT-SA Nexus started! Backend at http://localhost:8000, Frontend at http://localhost:5173"
