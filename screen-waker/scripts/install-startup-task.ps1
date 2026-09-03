param(
    [string]$TaskName = 'My Assistant Screen Waker'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$entryPoint = Join-Path $projectRoot 'build\index.js'
$configPath = Join-Path $projectRoot 'config.json'
$nodeCommand = Get-Command node.exe -ErrorAction Stop

if (-not (Test-Path -LiteralPath $entryPoint)) {
    throw "Missing build output: $entryPoint. The package script normally builds it before task installation."
}

$actionArguments = '"{0}" --config "{1}"' -f $entryPoint, $configPath
$action = New-ScheduledTaskAction `
    -Execute $nodeCommand.Source `
    -Argument $actionArguments `
    -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet `
    -Hidden `
    -StartWhenAvailable `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited
$task = New-ScheduledTask `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description 'Uses the local webcam to wake only the Windows display after confirmed motion.'

Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null
Write-Output "Installed Task Scheduler task: $TaskName"
