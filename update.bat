@echo off
echo Updating Photon Rename...
git pull
call npm install
call npm run build
echo Update complete.
pause
