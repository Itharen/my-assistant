@echo off
setlocal
pushd "%~dp0"
call npm start
set "MA_EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %MA_EXIT_CODE%
