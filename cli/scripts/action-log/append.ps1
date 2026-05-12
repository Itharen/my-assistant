# scripts/action-log/append.ps1
#
# Universal action-log appender. Appends a single JSONL line to
# __agent/log/actions/YYYY-MM-DD.jsonl with the current Europe/Budapest day.
#
# Usage (named params):
#   pwsh scripts/action-log/append.ps1 `
#       -Actor "claude" `
#       -Kind "decision" `
#       -Summary "..." `
#       -Ref "__agent/STATUS.md" `
#       -Session "ccs-1234" `
#       -ExtraJson '{"key":"value"}'
#
# Usage (env vars — useful from minimal hook one-liners):
#   $env:AL_ACTOR='claude'; $env:AL_KIND='note'; $env:AL_SUMMARY='hello';
#   pwsh scripts/action-log/append.ps1
#
# Schema: see __agent/log/actions/README.md

param(
    [string]$Actor,
    [string]$Kind,
    [string]$Summary,
    [string]$Ref,
    [string]$Session,
    [string]$ExtraJson,
    [string]$Ts,
    [string]$LogRoot
)

# Pull from env vars if param is empty
if (-not $Actor)     { $Actor     = $env:AL_ACTOR }
if (-not $Kind)      { $Kind      = $env:AL_KIND }
if (-not $Summary)   { $Summary   = $env:AL_SUMMARY }
if (-not $Ref)       { $Ref       = $env:AL_REF }
if (-not $Session)   { $Session   = $env:AL_SESSION }
if (-not $ExtraJson) { $ExtraJson = $env:AL_EXTRA_JSON }
if (-not $Ts)        { $Ts        = $env:AL_TS }

if (-not $Actor -or -not $Kind -or -not $Summary) {
    Write-Error "append.ps1 requires Actor, Kind, Summary (params or AL_ACTOR/AL_KIND/AL_SUMMARY env vars)."
    exit 2
}

# Resolve log root: either explicit, env, or two levels up from this script
if (-not $LogRoot) { $LogRoot = $env:AL_LOG_ROOT }
if (-not $LogRoot) {
    $projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $LogRoot = Join-Path $projectRoot '__agent\log\actions'
}

if (-not (Test-Path $LogRoot)) {
    New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
}

# Timestamp — Europe/Budapest. Default = now (local).
if (-not $Ts) {
    $Ts = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
}

# Day = local date portion of $Ts (split on 'T')
$day    = ($Ts -split 'T')[0]
$logFile = Join-Path $LogRoot "$day.jsonl"

# Build entry. Use ordered hashtable so key order in JSON is stable.
$entry = [ordered]@{
    ts      = $Ts
    actor   = $Actor
    kind    = $Kind
    summary = $Summary
}
if ($Ref)     { $entry.ref     = $Ref }
if ($Session) { $entry.session = $Session }
if ($ExtraJson) {
    try {
        $extraObj = $ExtraJson | ConvertFrom-Json -ErrorAction Stop
        $entry.extra = $extraObj
    } catch {
        # If extra isn't valid JSON, keep it as a raw string (don't fail the log).
        $entry.extra = @{ raw = $ExtraJson }
    }
}

$json = ($entry | ConvertTo-Json -Compress -Depth 10)

# Append. Use UTF-8 (no BOM) for cross-tool compatibility.
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json + "`n")
[System.IO.File]::AppendAllText($logFile, $json + "`n", [System.Text.UTF8Encoding]::new($false))
