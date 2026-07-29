@echo off
chcp 65001 >nul

git add .
git commit -m "update blog"
git push -f origin release-ver

echo.
echo Upload complete!
pause