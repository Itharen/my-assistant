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
    [string]$LogDir = (Join-Path $PSScriptRoot 'data')
)

# Action-log helper — közös, a my-assistant repo gyökérben
$projectRoot = Split-Path -Parent $PSScriptRoot
$actionLogScript = Join-Path $projectRoot 'scripts\action-log\append.ps1'

function Write-ActionLog {
    param([string]$Kind, [string]$Summary, [string]$ExtraJson)
    if (-not (Test-Path $actionLogScript)) { return }
    try {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $actionLogScript `
            -Actor 'activity-monitor' -Kind $Kind -Summary $Summary `
            -ExtraJson ($ExtraJson ?? '') 2>$null | Out-Null
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
    -Summary "activity-monitor started (interval ${IntervalSeconds}s)" `
    -ExtraJson (@{ intervalSeconds = $IntervalSeconds; logDir = $LogDir; pid = $PID } | ConvertTo-Json -Compress)

# Stop hook — Ctrl+C / process exit
$stopHandler = {
    Write-ActionLog -Kind 'external-action' -Summary 'activity-monitor stopped'
}
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $stopHandler | Out-Null

try {
    while ($true) {
        try {
            $now = Get-Date
            $isoTimestamp = $now.ToString('yyyy-MM-ddTHH:mm:sszzz')
            $logFile = Join-Path $LogDir ($now.ToString('yyyy-MM-dd') + '.jsonl')

            $entry = [ordered]@{
                timestamp     = $isoTimestamp
                processName   = [Win32]::GetActiveProcessName()
                windowTitle   = [Win32]::GetActiveWindowTitle()
                idleSeconds   = [Win32]::GetIdleSeconds()
            }

            $json = ($entry | ConvertTo-Json -Compress)
            Add-Content -Path $logFile -Value $json -Encoding utf8

            Write-Host ("[{0}] {1} ({2}) idle={3}s" -f
                $now.ToString('HH:mm:ss'),
                $entry.processName,
                $(if ($entry.windowTitle.Length -gt 60) { $entry.windowTitle.Substring(0,57) + '...' } else { $entry.windowTitle }),
                $entry.idleSeconds) -ForegroundColor DarkGray
        } catch {
            Write-Warning "[activity-monitor] Tick error: $_"
            Write-ActionLog -Kind 'error' -Summary "activity-monitor tick error: $_"
        }

        Start-Sleep -Seconds $IntervalSeconds
    }
} finally {
    Write-ActionLog -Kind 'external-action' -Summary 'activity-monitor stopped'
}
