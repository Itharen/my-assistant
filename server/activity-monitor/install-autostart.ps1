# Jelenlét-figyelő automatikus indításának beállítása (Windows Task Scheduler, AtLogon).
#
# MIÉRT KELL: a hangszórós kapu (owner-szabály, 2026-09-06) csak akkor enged bemondást, ha
# tudjuk, hogy az owner ITTHON van — és az egyetlen jelünk erre a gép-használat. Ha a figyelő
# nem fut, a kapu „ismeretlen" állapotot lát, és TILT. Mérve 2026-09-06: a figyelő
# 2026-05-17 óta nem futott.
#
# ⚠️ EZ RENDSZER-SZINTŰ VÁLTOZTATÁS (ütemezett feladat regisztrálása) — owner futtassa.
#   Ellenőrzés (nem módosít):  pwsh -File install-autostart.ps1 -Mode check
#   Beállítás:                 pwsh -File install-autostart.ps1 -Mode apply
#   Eltávolítás:               pwsh -File install-autostart.ps1 -Mode remove

param(
    [ValidateSet('check', 'apply', 'remove')]
    [string]$Mode = 'check'
)

$ErrorActionPreference = 'Stop'

$taskName = 'my-assistant-activity-logger'
$scriptPath = Join-Path $PSScriptRoot 'logger.ps1'
$workingDirectory = Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') '..')

if (-not (Test-Path $scriptPath)) {
    Write-Output "HIBA: nincs meg a figyelő szkript: $scriptPath"
    exit 1
}

$existing = $null
try { $existing = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop } catch { $existing = $null }

if ($Mode -eq 'check') {
    Write-Output "Figyelő szkript : $scriptPath"
    Write-Output "Munkakönyvtár   : $workingDirectory"
    if ($null -eq $existing) {
        Write-Output "Ütemezett feladat: NINCS regisztrálva ($taskName)"
        Write-Output "TEENDŐ: pwsh -File install-autostart.ps1 -Mode apply"
    } else {
        Write-Output "Ütemezett feladat: REGISZTRÁLVA ($taskName), állapot: $($existing.State)"
    }

    # A mérés frissessége a lényeg — a regisztrált feladat önmagában még nem jelent adatot.
    $dataDirectory = Join-Path $PSScriptRoot 'data'
    if (Test-Path $dataDirectory) {
        $newest = Get-ChildItem $dataDirectory -Filter *.jsonl | Sort-Object Name | Select-Object -Last 1
        if ($null -ne $newest) {
            $ageMinutes = [int]((Get-Date) - $newest.LastWriteTime).TotalMinutes
            Write-Output "Legfrissebb mérés: $($newest.Name), $ageMinutes perce írva"
        } else {
            Write-Output "Legfrissebb mérés: NINCS adatfájl"
        }
    } else {
        Write-Output "Legfrissebb mérés: nincs adatkönyvtár"
    }
    exit 0
}

if ($Mode -eq 'remove') {
    if ($null -eq $existing) {
        Write-Output "Nincs mit eltávolítani — $taskName nincs regisztrálva."
        exit 0
    }
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Output "Eltávolítva: $taskName"
    exit 0
}

# apply
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`"" `
    -WorkingDirectory $workingDirectory
$trigger = New-ScheduledTaskTrigger -AtLogon
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

if ($null -ne $existing) {
    Set-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings | Out-Null
    Write-Output "Frissítve: $taskName"
} else {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings | Out-Null
    Write-Output "Regisztrálva: $taskName (AtLogon)"
}

Write-Output "Azonnali indítás: Start-ScheduledTask -TaskName $taskName"
Write-Output "Ellenőrzés a my-assistant oldaláról: ma comm doctor"
