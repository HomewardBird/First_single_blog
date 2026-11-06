@echo off
chcp 65001 >nul
cd /d "%~dp0"

git add .
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "update blog"
) else (
    echo Nothing to commit.
)

git -c http.proxy= -c https.proxy= push origin HEAD:release-ver
if errorlevel 1 (
    echo.
    echo Upload FAILED. Check network or proxy settings.
    pause
    exit /b 1
)

echo.
echo Upload complete!
pause
