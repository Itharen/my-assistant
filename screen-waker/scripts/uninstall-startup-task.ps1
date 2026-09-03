param(
    [string]$TaskName = 'My Assistant Screen Waker'
)

$ErrorActionPreference = 'Stop'

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $existingTask) {
    Write-Output "Task is not installed: $TaskName"
    exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Output "Removed Task Scheduler task: $TaskName"
