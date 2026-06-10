# update-fo.ps1
# Always-latest fo install: git pull + build + global install + ping verify.
# Usage: from any directory, run:
#   E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\scripts\update-fo.ps1

$ErrorActionPreference = 'Stop'

$cliRepo = 'E:\Programming\Own\CURSOR\LIVE-projects\organizer-cli'
$cliPkg = Join-Path $cliRepo 'cli'
$envFile = 'E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\.env'

if (-not (Test-Path $cliRepo)) {
  Write-Error "organizer-cli repo not found at $cliRepo. Clone it first: git clone git@github.com:futdevpro/organizer-cli.git"
  exit 1
}

Write-Host "==> 1. git pull ($cliRepo)" -ForegroundColor Cyan
Push-Location $cliRepo
try {
  git pull
} finally {
  Pop-Location
}

Write-Host "==> 2. pnpm install + build ($cliPkg)" -ForegroundColor Cyan
# CI=true lets pnpm purge stale node_modules without TTY prompt.
$env:CI = 'true'
Push-Location $cliPkg
try {
  pnpm install
  if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
  pnpm run build-base
  if ($LASTEXITCODE -ne 0) { throw "build-base failed" }
} finally {
  Pop-Location
  Remove-Item Env:\CI -ErrorAction SilentlyContinue
}

Write-Host "==> 3. Global install (npm i -g --force)" -ForegroundColor Cyan
Push-Location $cliPkg
try {
  npm i -g --force
  if ($LASTEXITCODE -ne 0) { throw "global install failed" }
} finally {
  Pop-Location
}

Write-Host "==> 4. fo --version" -ForegroundColor Cyan
fo --version

Write-Host "==> 5. fo organizer.ping (test env verify)" -ForegroundColor Cyan
# If api-key.test.enc.json missing, try to load API key from .env and run init.
$apiKeyFile = Join-Path $env:APPDATA 'fo\Config\api-key.test.enc.json'
if (-not (Test-Path $apiKeyFile)) {
  if (Test-Path $envFile) {
    Write-Host "    api-key.test.enc.json not found - initializing from .env" -ForegroundColor Yellow
    $line = (Get-Content $envFile | Select-String '^FDP_ORGANIZER_API_KEY=' | Select-Object -First 1).Line
    if ($line) {
      $apiKey = $line.Split('=', 2)[1]
      fo dev-switch --target test
      fo init --no-prompt --api-key $apiKey
    } else {
      Write-Warning "FDP_ORGANIZER_API_KEY not present in $envFile - run 'fo init' manually"
    }
  } else {
    Write-Warning ".env file not found ($envFile) - run 'fo init' manually"
  }
}

fo organizer.ping
if ($LASTEXITCODE -eq 0) {
  Write-Host "==> OK: fo installed and working (test env)" -ForegroundColor Green
} else {
  Write-Warning "fo organizer.ping returned non-zero exit code - check manually"
}
