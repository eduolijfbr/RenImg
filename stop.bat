@echo off
echo Stopping Photon Rename...
powershell -Command "Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"
echo Application stopped.
pause
