Write-Host "Starting SiteScout servers..." -ForegroundColor Green
Write-Host ""

Write-Host "Starting backend server on port 3001..." -ForegroundColor Yellow
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Waiting 3 seconds for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting frontend server on port 3000..." -ForegroundColor Yellow
Set-Location ..\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
