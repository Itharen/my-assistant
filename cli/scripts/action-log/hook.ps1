# scripts/action-log/hook.ps1
#
# Claude Code hook handler. Reads the hook payload (JSON) from stdin,
# converts it to an action-log entry, and delegates the write to the
# canonical CLI command:
#
#     node $projectRoot\cli\build\main.js action-log emit ...
#
# Wired in .claude/settings.json for: SessionStart, UserPromptSubmit,
# PostToolUse, Stop. The hook event name comes from the payload itself.
#
# Hook payload shape (relevant fields):
#   { "session_id": "...", "hook_event_name": "PostToolUse",
#     "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# We never block the tool - print nothing to stdout, swallow errors.
# FR #3e Phase 2 — delegates to `ma action-log emit`.

$ErrorActionPreference = 'Continue'

try {
    # PS5.1 quirk: [Console]::In.ReadToEnd() can return empty in complex scripts
    # invoked via `powershell.exe -File`. The automatic $input variable is reliable.
    $rawJson = ''
    if ($input) { foreach ($line in $input) { $rawJson += $line } }
    if (-not $rawJson) { exit 0 }

    $payload = $rawJson | ConvertFrom-Json -ErrorAction Stop
    $hookEvent = [string]$payload.hook_event_name
    if (-not $hookEvent) { exit 0 }

    $sessionId = [string]$payload.session_id

    # Project root - the script lives at <root>\cli\scripts\action-log\hook.ps1
    # so we walk up THREE levels: action-log -> scripts -> cli -> <root>.
    $projectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
    $maMainJs = Join-Path $projectRoot 'cli\build\main.js'

    # Build kind + summary + optional ref/extra per event type
    $kind = $null
    $summary = $null
    $ref = $null
    $extraJson = $null

    switch ($hookEvent) {
        'SessionStart' {
            $kind = 'session-start'
            $src = [string]$payload.source
            if ($src) { $summary = "Claude session started (source=$src)" }
            else      { $summary = 'Claude session started' }
        }
        'UserPromptSubmit' {
            $prompt = [string]$payload.prompt
            # Cron-trigger detection: the CCAP cron tick sends a fixed template
            # prompt that adds nothing to the log. Emit a minimal entry instead.
            $promptTrim = $prompt.TrimStart()
            if ($promptTrim -match '^Olvasd el az __agent[\\/]WORKFLOW_DEV\.md') {
                $kind = 'cron-trigger'
                $summary = 'dev-agent tick'
            }
            elseif ($promptTrim -match '^Olvasd el az __agent[\\/]WORKFLOW_ASSIST\.md') {
                $kind = 'cron-trigger'
                $summary = 'assist-agent tick'
            }
            else {
                $kind = 'user-msg'
                if ($prompt.Length -gt 200) { $prompt = $prompt.Substring(0, 197) + '...' }
                $prompt = $prompt -replace '\s+', ' '
                $summary = "User: $prompt"
            }
        }
        'PostToolUse' {
            $toolName = [string]$payload.tool_name
            $kind = 'tool-call'
            $toolInput = $payload.tool_input

            # Pretty-summary per tool kind
            if ($toolName -eq 'Edit' -or $toolName -eq 'Write' -or $toolName -eq 'NotebookEdit') {
                $kind = if ($toolName -eq 'Edit') { 'file-edit' } else { 'file-write' }
                $fp = [string]$toolInput.file_path
                $summary = "$toolName $fp"
                $ref = $fp
            }
            elseif ($toolName -eq 'Bash' -or $toolName -eq 'PowerShell') {
                $kind = 'bash'
                $cmd = [string]$toolInput.command
                $desc = [string]$toolInput.description
                if ($cmd.Length -gt 200) { $cmd = $cmd.Substring(0, 197) + '...' }
                $cmd = $cmd -replace '\s+', ' '
                if ($desc) { $summary = "${toolName} (${desc}): $cmd" } else { $summary = "${toolName}: $cmd" }
            }
            elseif ($toolName -eq 'TodoWrite') {
                $kind = 'tool-call'
                $todos = $toolInput.todos
                $count = if ($todos) { @($todos).Count } else { 0 }
                $summary = "TodoWrite ($count items)"
            }
            else {
                $summary = "$toolName"
                if ($toolInput) {
                    $hint = $null
                    foreach ($p in $toolInput.PSObject.Properties) {
                        if ($p.Value -is [string] -and $p.Value.Length -gt 0) {
                            $hint = [string]$p.Value
                            break
                        }
                    }
                    if ($hint) {
                        if ($hint.Length -gt 120) { $hint = $hint.Substring(0, 117) + '...' }
                        $hint = $hint -replace '\s+', ' '
                        $summary = "$toolName ($hint)"
                    }
                }
            }
        }
        'Stop' {
            $kind = 'assistant-turn-end'
            $summary = 'Assistant turn ended'
        }
        default {
            # Unknown / unwired hook - log generically
            $kind = 'note'
            $summary = "hook: $hookEvent"
        }
    }

    if (-not $kind -or -not $summary) { exit 0 }

    # If the CLI build doesn't exist yet (e.g. fresh clone), emit structured
    # stderr (visible to the Claude session for debug) — per error-handling.md
    # "SEMMI csendes catch". Hook nem dob ki workflow-t, de a hiányosság látszik.
    if (-not (Test-Path $maMainJs)) {
        [System.Console]::Error.WriteLine("[hook.ps1] MA-HOOK-BUILD-MISSING: $maMainJs — entry NOT logged (kind=$kind, summary='$summary')")
        exit 0
    }

    # Delegate to `ma action-log emit`. Pass --actor claude (the hook fires
    # from Claude Code sessions). Stdout suppressed (envelope nem érdekel a
    # hook-caller-t); stderr **átfolyik** a Claude session-be hogy a write-fail
    # látható legyen (logAction structured error emit).
    $cliArgs = @('action-log', 'emit', '--actor', 'claude', '--kind', $kind, '--summary', $summary)
    if ($ref)       { $cliArgs += @('--ref', $ref) }
    if ($sessionId) { $cliArgs += @('--session', $sessionId) }
    if ($extraJson) { $cliArgs += @('--extra', $extraJson) }

    & node $maMainJs @cliArgs 1> $null
    if ($LASTEXITCODE -ne 0) {
        [System.Console]::Error.WriteLine("[hook.ps1] MA-HOOK-EMIT-FAIL: exit=$LASTEXITCODE (kind=$kind, summary='$summary')")
    }
} catch {
    # Hook never throws back — workflow break worse than missing log. De NEM
    # silent: structured stderr emit per error-handling.md.
    try {
        $errMsg = $_.Exception.Message
        [System.Console]::Error.WriteLine("[hook.ps1] MA-HOOK-FATAL: $errMsg")
    } catch {
        # Documented last-resort swallow: stderr unwritable, no further channel.
    }
}

exit 0
