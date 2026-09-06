# My Assistant — a FOLYAMATOSAN FUTÓ szolgáltatások automatikus indítása.
#
# KÉT szolgáltatást állít be, mert a kommunikációs csatorna mindkettőt igényli:
#
#   1. jelenlét-figyelő  → ettől tudjuk, hogy az owner ITTHON van (a gépét használja).
#                          Enélkül a hangszórós kapu „ismeretlen"-t lát, és TILT.
#   2. Discord-figyelő   → ettől érkeznek meg a Discordon írt üzenetek. Ha nem fut, az
#                          üzenet kívülről pontosan úgy néz ki, mintha nem is írták volna.
#
# ⚠️ EZ RENDSZER-SZINTŰ VÁLTOZTATÁS (ütemezett feladatok) — az owner futtassa.
#   Ellenőrzés (NEM módosít):  pwsh -File scripts/install-autostart.ps1 -Mode check
#   Beállítás:                 pwsh -File scripts/install-autostart.ps1 -Mode apply
#   Eltávolítás:               pwsh -File scripts/install-autostart.ps1 -Mode remove
#
# Mindkét feladat AtLogon indul, és hiba esetén ÚJRAINDUL — mert egy csendben elhalt
# figyelő a legrosszabb hibafajta: úgy néz ki, mintha nem történt volna semmi.

param(
    [ValidateSet('check', 'apply', 'remove')]
    [string]$Mode = 'check'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')

$services = @(
    @{
        Name        = 'my-assistant-activity-logger'
        Label       = 'Jelenlét-figyelő (itthon vagyok-e)'
        Execute     = 'powershell.exe'
        Argument    = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$projectRoot\server\activity-monitor\logger.ps1`""
        WorkDir     = "$projectRoot"
        HealthHint  = 'ma comm doctor  ->  "Jelenlét-figyelő" sor'
    },
    @{
        Name        = 'my-assistant-discord-listener'
        Label       = 'Discord-figyelő (bejövő üzenetek)'
        Execute     = 'cmd.exe'
        Argument    = "/c cd /d `"$projectRoot\cli`" && npx tsx src/main.ts comm listen"
        WorkDir     = "$projectRoot\cli"
        HealthHint  = 'ma comm doctor  ->  "Discord-figyelő ÉL" sor'
    }
)

function Get-TaskOrNull([string]$name) {
    try { return Get-ScheduledTask -TaskName $name -ErrorAction Stop } catch { return $null }
}

if ($Mode -eq 'check') {
    Write-Output "Projekt gyoker: $projectRoot"
    Write-Output ""
    foreach ($svc in $services) {
        $task = Get-TaskOrNull $svc.Name
        if ($null -eq $task) {
            Write-Output "[ NINCS ] $($svc.Label)"
            Write-Output "          feladat: $($svc.Name)"
        } else {
            Write-Output "[ MEGVAN ] $($svc.Label) - allapot: $($task.State)"
        }
        Write-Output "          ellenorzes: $($svc.HealthHint)"
        Write-Output ""
    }
    Write-Output "Beallitas: pwsh -File scripts/install-autostart.ps1 -Mode apply"
    exit 0
}

if ($Mode -eq 'remove') {
    foreach ($svc in $services) {
        if ($null -ne (Get-TaskOrNull $svc.Name)) {
            Unregister-ScheduledTask -TaskName $svc.Name -Confirm:$false
            Write-Output "Eltavolitva: $($svc.Name)"
        } else {
            Write-Output "Nem volt regisztralva: $($svc.Name)"
        }
    }
    exit 0
}

# apply
foreach ($svc in $services) {
    $action = New-ScheduledTaskAction -Execute $svc.Execute -Argument $svc.Argument -WorkingDirectory $svc.WorkDir
    $trigger = New-ScheduledTaskTrigger -AtLogon
    # A figyelo NEM allhat le csendben: hiba eseten ujraindul, es nincs futasido-korlat.
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RestartCount 999 `
        -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit (New-TimeSpan -Seconds 0)

    if ($null -ne (Get-TaskOrNull $svc.Name)) {
        Set-ScheduledTask -TaskName $svc.Name -Action $action -Trigger $trigger -Settings $settings | Out-Null
        Write-Output "Frissitve: $($svc.Name)"
    } else {
        Register-ScheduledTask -TaskName $svc.Name -Action $action -Trigger $trigger -Settings $settings | Out-Null
        Write-Output "Regisztralva: $($svc.Name) (AtLogon, hiba eseten ujraindul)"
    }
}

Write-Output ""
Write-Output "Azonnali inditas most (ujrabejelentkezes nelkul):"
foreach ($svc in $services) { Write-Output "  Start-ScheduledTask -TaskName $($svc.Name)" }
Write-Output ""
Write-Output "Utana ellenorzes:  ma comm doctor"
