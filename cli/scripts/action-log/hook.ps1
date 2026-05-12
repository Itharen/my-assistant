# scripts/action-log/hook.ps1
#
# Claude Code hook handler. Reads the hook payload (JSON) from stdin,
# converts it to an action-log entry, and appends to today's JSONL file.
#
# Wired in .claude/settings.json for: SessionStart, UserPromptSubmit,
# PostToolUse, Stop. The hook event name comes from the payload itself.
#
# Hook payload shape (relevant fields):
#   { "session_id": "...", "hook_event_name": "PostToolUse",
#     "tool_name": "Edit", "tool_input": { "file_path": "..." }, ... }
#
# We never block the tool — print nothing to stdout, swallow errors.

$ErrorActionPreference = 'Continue'

try {
    $rawJson = [Console]::In.ReadToEnd()
    if (-not $rawJson) { exit 0 }

    $payload = $rawJson | ConvertFrom-Json -ErrorAction Stop
    $hookEvent = [string]$payload.hook_event_name
    if (-not $hookEvent) { exit 0 }

    $sessionId = [string]$payload.session_id

    # Project root — two levels up from this script
    $projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $logRoot = Join-Path $projectRoot '__agent\log\actions'

    # Build kind + summary + optional extra per event type
    $kind = $null
    $summary = $null
    $ref = $null
    $extraObj = $null

    switch ($hookEvent) {
        'SessionStart' {
            $kind = 'session-start'
            $src = [string]$payload.source
            if ($src) { $summary = "Claude session started (source=$src)" }
            else      { $summary = 'Claude session started' }
        }
        'UserPromptSubmit' {
            $kind = 'user-msg'
            $prompt = [string]$payload.prompt
            if ($prompt.Length -gt 200) { $prompt = $prompt.Substring(0, 197) + '...' }
            $prompt = $prompt -replace '\s+', ' '
            $summary = "User: $prompt"
        }
        'PostToolUse' {
            $toolName = [string]$payload.tool_name
            $kind = 'tool-call'
            $input = $payload.tool_input

            # Pretty-summary per tool kind
            if ($toolName -eq 'Edit' -or $toolName -eq 'Write' -or $toolName -eq 'NotebookEdit') {
                $kind = if ($toolName -eq 'Edit') { 'file-edit' } else { 'file-write' }
                $fp = [string]$input.file_path
                $summary = "$toolName $fp"
                $ref = $fp
            }
            elseif ($toolName -eq 'Bash' -or $toolName -eq 'PowerShell') {
                $kind = 'bash'
                $cmd = [string]$input.command
                $desc = [string]$input.description
                if ($cmd.Length -gt 200) { $cmd = $cmd.Substring(0, 197) + '...' }
                $cmd = $cmd -replace '\s+', ' '
                if ($desc) { $summary = "$toolName ($desc): $cmd" } else { $summary = "$toolName: $cmd" }
            }
            elseif ($toolName -eq 'TodoWrite') {
                $kind = 'tool-call'
                $todos = $input.todos
                $count = if ($todos) { @($todos).Count } else { 0 }
                $summary = "TodoWrite ($count items)"
            }
            else {
                $summary = "$toolName"
                # Include first string field from input as a hint, if present
                if ($input) {
                    $hint = $null
                    foreach ($p in $input.PSObject.Properties) {
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
            # Unknown / unwired hook — log generically
            $kind = 'note'
            $summary = "hook: $hookEvent"
        }
    }

    if (-not $kind -or -not $summary) { exit 0 }

    if (-not (Test-Path $logRoot)) {
        New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
    }

    $ts = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    $day = ($ts -split 'T')[0]
    $logFile = Join-Path $logRoot "$day.jsonl"

    $entry = [ordered]@{
        ts      = $ts
        actor   = 'claude'
        kind    = $kind
        summary = $summary
    }
    if ($ref)       { $entry.ref     = $ref }
    if ($sessionId) { $entry.session = $sessionId }
    if ($extraObj)  { $entry.extra   = $extraObj }

    $line = ($entry | ConvertTo-Json -Compress -Depth 10) + "`n"
    [System.IO.File]::AppendAllText($logFile, $line, [System.Text.UTF8Encoding]::new($false))
} catch {
    # Swallow — never break the user's workflow because of logging
}

exit 0
