$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$entryPoint = Join-Path $projectRoot 'build\index.js'
$configPath = Join-Path $projectRoot 'config.json'
$nodeCommand = Get-Command node.exe -ErrorAction Stop

if (-not (Test-Path -LiteralPath $entryPoint)) {
    throw "Missing build output: $entryPoint. Run 'pnpm build' in screen-waker first."
}

Start-Process `
    -FilePath $nodeCommand.Source `
    -ArgumentList @($entryPoint, '--config', $configPath) `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden
