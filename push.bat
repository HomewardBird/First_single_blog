@echo off
echo =======================================
echo    Auto Uploading Blog to GitHub...
echo =======================================
echo.

git add .

set "msg="
set /p msg="Enter commit message (Press Enter to use default 'update blog'): "
if "%msg%"=="" set msg=update blog

git commit -m "%msg%"
git push origin release-ver

echo.
echo =======================================
echo    SUCCESS! Uploaded to GitHub.
echo =======================================
pause