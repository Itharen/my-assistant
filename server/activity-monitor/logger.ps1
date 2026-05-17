# activity-monitor/logger.ps1
#
# Lokál gép aktivitás-logger a my-assistant rendszer L2 réteg számára.
# Forrás: current/feature-requests/activity-tracking.md
#
# Futás: 1 percenként loggol egy sort a activity-monitor/data/YYYY-MM-DD.jsonl-be.
# Mezők: timestamp, processName, windowTitle, idleSeconds.
#
# A samples log gitignored (zaj + privát). A lifecycle event-eket (start/stop)
# viszont a közös action-logba is kiírja (__agent/log/actions/), az push-olva van.
#
# Indítás:
#   pwsh -File logger.ps1
#   vagy:
#   ./activity-monitor/start.ps1 (background, lásd README.md)
#
# Stop: Ctrl+C

param(
    [int]$IntervalSeconds = 60,
    [int]$IdleThresholdSeconds = 60,  # idleSeconds < threshold → 'active', else 'idle'
    [string]$LogDir = (Join-Path $PSScriptRoot 'data')
)

# --- App category mapping — FR #3h Phase 1 (cycle 94) ---
function Get-AppCategory {
    param([string]$ProcessName)
    if (-not $ProcessName) { return 'unknown' }
    $p = $ProcessName.ToLower()
    if ($p -match 'chrome|firefox|edge|msedge|brave|opera') { return 'browser' }
    if ($p -match 'code|notepad|sublime|atom|vim|emacs|cursor|claude|webstorm|idea|rider|pycharm') { return 'editor' }
    if ($p -match 'cmd|powershell|pwsh|wt|windowsterminal|conhost|bash|tmux|alacritty') { return 'terminal' }
    if ($p -match 'discord|slack|teams|signal|telegram|whatsapp|messenger') { return 'chat' }
    if ($p -match 'spotify|vlc|music|winmedia|wmplayer|netflix|youtube') { return 'media' }
    if ($p -match 'explorer|finder|filemanager|totalcmd') { return 'file' }
    if ($p -match 'photoshop|gimp|krita|inkscape|figma|blender') { return 'creative' }
    if ($p -match 'lockapp|winlogon') { return 'locked' }
    return 'other'
}

# Action-log helper — közös, a my-assistant repo `cli/scripts/action-log/append.ps1`-ben.
# Cycle 94 fix: a 2026-05-08 reorg óta a scripts/ a cli/ alá került, az eredeti
# `server/scripts/...` path törött volt.
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)  # server/activity-monitor → server → my-assistant
$actionLogScript = Join-Path $projectRoot 'cli\scripts\action-log\append.ps1'

function Write-ActionLog {
    param([string]$Kind, [string]$Summary, [string]$ExtraJson)
    if (-not (Test-Path $actionLogScript)) { return }
    try {
        $extraArg = if ([string]::IsNullOrEmpty($ExtraJson)) { '' } else { $ExtraJson }
        & powershell -NoProfile -ExecutionPolicy Bypass -File $actionLogScript `
            -Actor 'activity-monitor' -Kind $Kind -Summary $Summary `
            -ExtraJson $extraArg 2>$null | Out-Null
    } catch {
        # Swallow — a logging soha ne álljon meg az activity-monitort
    }
}

# --- Win32 API: aktív ablak + idle time ---
$win32Source = @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

public static class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    [StructLayout(LayoutKind.Sequential)]
    public struct LASTINPUTINFO {
        public uint cbSize;
        public uint dwTime;
    }

    public static int GetIdleSeconds() {
        var lii = new LASTINPUTINFO();
        lii.cbSize = (uint)Marshal.SizeOf(lii);
        if (!GetLastInputInfo(ref lii)) return -1;
        uint tickCount = (uint)Environment.TickCount;
        uint idleMs = tickCount - lii.dwTime;
        return (int)(idleMs / 1000);
    }

    public static string GetActiveWindowTitle() {
        var hWnd = GetForegroundWindow();
        var sb = new StringBuilder(512);
        GetWindowText(hWnd, sb, sb.Capacity);
        return sb.ToString();
    }

    public static string GetActiveProcessName() {
        var hWnd = GetForegroundWindow();
        uint pid;
        GetWindowThreadProcessId(hWnd, out pid);
        try {
            var p = Process.GetProcessById((int)pid);
            return p.ProcessName;
        } catch { return ""; }
    }
}
"@

if (-not ('Win32' -as [type])) {
    Add-Type -TypeDefinition $win32Source -Language CSharp
}

# --- Log dir előkészítés ---
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

Write-Host "[activity-monitor] Started. Interval: $IntervalSeconds s. Log dir: $LogDir" -ForegroundColor Green
Write-Host "[activity-monitor] Press Ctrl+C to stop." -ForegroundColor Gray

# Lifecycle: start
Write-ActionLog -Kind 'external-action' `
    -Summary "activity-monitor started (interval ${IntervalSeconds}s, idle-threshold ${IdleThresholdSeconds}s)" `
    -ExtraJson (@{ intervalSeconds = $IntervalSeconds; idleThresholdSeconds = $IdleThresholdSeconds; logDir = $LogDir; pid = $PID } | ConvertTo-Json -Compress)

# Stop hook — Ctrl+C / process exit
$stopHandler = {
    Write-ActionLog -Kind 'external-action' -Summary 'activity-monitor stopped'
}
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $stopHandler | Out-Null

# --- FR #3h Phase 1 (cycle 94): change-detect state ---
$prevIdleState = $null      # 'active' | 'idle'
$prevAppCategory = $null    # 'browser' | 'editor' | ... | 'locked'
$prevTickTime = Get-Date    # for sleep/wake detection (large tick-gap)

try {
    while ($true) {
        try {
            $now = Get-Date
            $isoTimestamp = $now.ToString('yyyy-MM-ddTHH:mm:sszzz')
            $logFile = Join-Path $LogDir ($now.ToString('yyyy-MM-dd') + '.jsonl')

            $processName = [Win32]::GetActiveProcessName()
            $windowTitle = [Win32]::GetActiveWindowTitle()
            $idleSeconds = [Win32]::GetIdleSeconds()
            $appCategory = Get-AppCategory -ProcessName $processName
            $idleState = if ($idleSeconds -ge $IdleThresholdSeconds) { 'idle' } else { 'active' }

            $entry = [ordered]@{
                timestamp     = $isoTimestamp
                processName   = $processName
                windowTitle   = $windowTitle
                idleSeconds   = $idleSeconds
                idleState     = $idleState
                appCategory   = $appCategory
            }

            $json = ($entry | ConvertTo-Json -Compress)
            Add-Content -Path $logFile -Value $json -Encoding utf8

            # --- Change-detect: emit state-change action-log on transitions ---

            # Sleep/wake detect — gép aludhatott ha az utolsó tick óta > interval*2 + 30s telt el
            $gapSeconds = [int]($now - $prevTickTime).TotalSeconds
            $expectedGap = $IntervalSeconds + 30
            if ($prevIdleState -ne $null -and $gapSeconds -gt $expectedGap) {
                Write-ActionLog -Kind 'state-change' `
                    -Summary "activity-monitor: machine wake detected (gap=${gapSeconds}s)" `
                    -ExtraJson (@{ event = 'machine-wake'; gapSeconds = $gapSeconds; expectedGap = $expectedGap } | ConvertTo-Json -Compress)
            }
            $prevTickTime = $now

            # Idle/active transition
            if ($prevIdleState -ne $null -and $prevIdleState -ne $idleState) {
                Write-ActionLog -Kind 'state-change' `
                    -Summary "activity-monitor: $prevIdleState → $idleState (idle=${idleSeconds}s)" `
                    -ExtraJson (@{ event = 'idle-transition'; from = $prevIdleState; to = $idleState; idleSeconds = $idleSeconds } | ConvertTo-Json -Compress)
            }
            $prevIdleState = $idleState

            # App category change
            if ($prevAppCategory -ne $null -and $prevAppCategory -ne $appCategory) {
                # Lock/unlock = 'locked' category → / from
                $eventSubtype = 'app-category-change'
                if ($appCategory -eq 'locked') { $eventSubtype = 'screen-locked' }
                elseif ($prevAppCategory -eq 'locked') { $eventSubtype = 'screen-unlocked' }

                Write-ActionLog -Kind 'state-change' `
                    -Summary "activity-monitor: $prevAppCategory → $appCategory ($processName)" `
                    -ExtraJson (@{ event = $eventSubtype; from = $prevAppCategory; to = $appCategory; processName = $processName } | ConvertTo-Json -Compress)
            }
            $prevAppCategory = $appCategory

            Write-Host ("[{0}] {1} ({2}) idle={3}s state={4} cat={5}" -f
                $now.ToString('HH:mm:ss'),
                $processName,
                $(if ($windowTitle.Length -gt 50) { $windowTitle.Substring(0,47) + '...' } else { $windowTitle }),
                $idleSeconds,
                $idleState,
                $appCategory) -ForegroundColor DarkGray
        } catch {
            Write-Warning "[activity-monitor] Tick error: $_"
            Write-ActionLog -Kind 'error' -Summary "activity-monitor tick error: $_"
        }

        Start-Sleep -Seconds $IntervalSeconds
    }
} finally {
    Write-ActionLog -Kind 'external-action' -Summary 'activity-monitor stopped'
}
