# scripts/action-log/append.ps1
#
# Universal action-log appender. Delegates the write to the canonical CLI:
#
#     node $projectRoot\cli\build\main.js action-log emit ...
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
# FR #3e Phase 2 — delegates to `ma action-log emit`.

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
    # Strukturált stderr — per error-handling.md
    [System.Console]::Error.WriteLine("[append.ps1] MA-APPEND-MISSING-ARG: Actor/Kind/Summary required (params or AL_ACTOR/AL_KIND/AL_SUMMARY env vars).")
    exit 2
}

# Project root - the script lives at <root>\cli\scripts\action-log\append.ps1
# so we walk up THREE levels: action-log -> scripts -> cli -> <root>.
$projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$maMainJs = Join-Path $projectRoot 'cli\build\main.js'

if (-not (Test-Path $maMainJs)) {
    [System.Console]::Error.WriteLine("[append.ps1] MA-APPEND-BUILD-MISSING: $maMainJs — run LDP or 'pnpm run build-base' in cli/")
    exit 2
}

# Optional MA_LOG_ROOT passthrough (the CLI honors process.env.MA_LOG_ROOT)
if ($LogRoot)            { $env:MA_LOG_ROOT = $LogRoot }
elseif ($env:AL_LOG_ROOT) { $env:MA_LOG_ROOT = $env:AL_LOG_ROOT }

# Build the CLI args
$cliArgs = @('action-log', 'emit', '--actor', $Actor, '--kind', $Kind, '--summary', $Summary)
if ($Ref)       { $cliArgs += @('--ref', $Ref) }
if ($Session)   { $cliArgs += @('--session', $Session) }
if ($ExtraJson) { $cliArgs += @('--extra', $ExtraJson) }
if ($Ts)        { $cliArgs += @('--ts', $Ts) }

# Delegate. Forward exit code, suppress stdout (envelope nem érdekel append-callert),
# **átfolyik a stderr** hogy a logAction structured error látható legyen.
& node $maMainJs @cliArgs 1> $null
exit $LASTEXITCODE
