@echo off
cd /d "%~dp0"
powershell -NoProfile -Command "$f='sw.js'; $c=Get-Content $f -Raw; $m=[regex]::Match($c,'maths-v(\d+)'); if($m.Success){$n=[int]$m.Groups[1].Value+1; $c=$c -replace 'maths-v\d+',('maths-v'+$n); Set-Content $f $c -NoNewline; Write-Host ('Cache version is now maths-v'+$n)}"
set /p msg="What did you change? "
if "%msg%"=="" set msg=update
git add .
git commit -m "%msg%"
git push
pause