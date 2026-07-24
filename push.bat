@echo off
git add -A
git commit -m "更新 %date% %time%" --no-verify
git push origin dev --no-verify
git checkout release-ver
git checkout dev -- .
git commit -m "同步到 release-ver" --no-verify
git push origin release-ver --no-verify
git checkout dev
echo Done.
