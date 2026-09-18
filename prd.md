# Prompt for Google Antigravity ? Build "Kiro Auto-Approve" Extension

Copy everything below this line and paste it into Antigravity as your build request.

---

## Goal

Build a complete, working **VS Code extension** (TypeScript) called **"Kiro Auto-Approve"**
that runs inside **Kiro IDE** (a VS Code fork). Its job: watch Kiro's AI-agent
approval queue and automatically approve **safe** pending actions, while
**never** auto-approving anything that looks dangerous. It must NOT use
screen automation, OCR, or mouse/keyboard simulation of any kind ? it must
work entirely through the VS Code / Kiro extension API, so it behaves
identically regardless of screen resolution, theme, zoom, or whether the UI
is viewed over VNC/remote desktop.

Target platforms: Windows, Linux, macOS ? must work identically since it
never touches pixels, only the extension host API.

## Important context / constraint

Kiro does not (yet) publicly document the exact internal command IDs it
exposes for its agent approval queue. Because these are undocumented and
can change between Kiro versions, **do not hardcode a guess and assume it
works** ? instead, build a **discovery-first architecture**:

1. First, build a "Discovery Mode" command that enumerates every command ID
   currently registered in the editor via `vscode.commands.getCommands(true)`,
   filters for any command ID containing `kiro` (case-insensitive), and
   prints the full sorted list to a dedicated Output channel named
   "Kiro Auto-Approve". This lets the user find the *real* command names on
   their installed Kiro version (things like approving/accepting a pending
   tool execution, listing pending executions, etc.).
2. Also try, defensively, to see if the `kiro.kiroAgent` extension exposes a
   programmatic API via `vscode.extensions.getExtension('kiro.kiroAgent')?.exports`
   ? log whatever shape that object has (its top-level keys) to the same
   Output channel, since some extensions expose richer APIs than their
   command palette entries.
3. Make the actual "get pending executions" command ID and "approve/accept"
   command ID **configurable settings** (strings), NOT hardcoded, with
   sensible defaults that the user can override once they've run Discovery
   Mode and found the real IDs for their Kiro version. If a configured
   command ID doesn't exist when called, catch the error, log a clear
   message telling the user to run Discovery Mode and update the setting,
   and disable auto-approve until fixed (don't crash/loop-error repeatedly).

## Functional requirements

### Core loop
- On a configurable interval (default 2 seconds), if enabled:
  - Call the configured "get pending executions" command/API to retrieve
    the list of pending agent actions awaiting approval.
  - For each pending item, extract whatever text represents the command or
    action (e.g. a shell command string, a URL for a fetch, a file write
    path ? handle it generically as "the displayable text of this pending
    action").
  - Run that text through a **safety check** (see below).
  - If it passes safety check ? call the configured "approve/accept"
    command/API for that specific pending item (prefer approving one item
    at a time over a blanket "accept all", if the API supports it ? fall
    back to "accept all" only if no per-item accept exists).
  - If it fails the safety check ? do nothing, log it as skipped, leave it
    for the human.
  - Log every check (approved / skipped / error) with a timestamp to the
    Output channel and to an in-memory history array (capped at the last
    200 entries).

### Safety check (denylist)
Maintain a configurable array of regex patterns (setting:
`kiroAutoApprove.bannedKeywords`), pre-populated with sensible defaults
covering at least:
`rm -rf`, `sudo`, `mkfs`, `dd if=`, `format`, `del /s`, `shutdown`,
`reboot`, `passwd`, `curl ... | sh`, `wget ... | sh`, `chmod -R 777`,
`git push --force`, `drop table`, `truncate`, writes to `/dev/sd*`,
`regedit`, `reg delete`, `Remove-Item -Recurse -Force`,
`Set-ExecutionPolicy Bypass`, reverse-shell patterns (`nc -e`, `/dev/tcp/`).
Case-insensitive matching. If ANY pattern matches the pending action's
text, it is never auto-approved, full stop ? no override setting for this.

### UI
- A **status bar item** (right side), showing a play/pause style icon
  (use VS Code codicons: `$(play)` when disabled/paused, `$(debug-pause)`
  when running) plus short text like "Auto-Approve: OFF" / "Auto-Approve: ON".
  Clicking it toggles the enabled state (calls the toggle command below).
- Default state on first install/activation: **disabled** (safe default ?
  user must explicitly turn it on).
- A dedicated Output channel named "Kiro Auto-Approve" for all logs.

### Commands (register all of these in `contributes.commands` and implement them)
- `kiroAutoApprove.toggle` ? "Kiro Auto-Approve: Toggle On/Off"
- `kiroAutoApprove.showHistory` ? "Kiro Auto-Approve: Show Recent Activity"
  (opens a Quick Pick or a Webview listing the last N logged actions with
  timestamp, approved/skipped status, and the text)
- `kiroAutoApprove.clearHistory` ? "Kiro Auto-Approve: Clear History"
- `kiroAutoApprove.addBannedKeyword` ? "Kiro Auto-Approve: Add Banned Keyword"
  (prompts via `vscode.window.showInputBox`, appends to the setting)
- `kiroAutoApprove.dumpAvailableCommands` ? "Kiro Auto-Approve: Discover Kiro Commands (Debug)"
  (implements the Discovery Mode described above)
- `kiroAutoApprove.openOutput` ? "Kiro Auto-Approve: Show Logs"

### Settings (register all in `contributes.configuration`)
- `kiroAutoApprove.enabled` (boolean, default `false`)
- `kiroAutoApprove.pollIntervalSeconds` (number, default `2`, minimum `1`)
- `kiroAutoApprove.bannedKeywords` (array of strings/regex, with the
  defaults listed above)
- `kiroAutoApprove.getPendingCommandId` (string, default `""` ? the exact
  command ID used to fetch pending executions; user fills this in after
  running Discovery Mode)
- `kiroAutoApprove.approveCommandId` (string, default `""` ? the exact
  command ID used to approve a pending execution)
- `kiroAutoApprove.maxHistoryEntries` (number, default `200`)

### Robustness
- Wrap every call to an external/Kiro command in try/catch.
- If `getPendingCommandId` or `approveCommandId` is empty or the command
  doesn't exist, don't start the polling loop ? show a one-time
  `vscode.window.showWarningMessage` telling the user to run Discovery
  Mode first and fill in the settings, with a button that runs Discovery
  Mode directly.
- Never let one failed iteration crash the extension ? catch, log, continue
  polling on the next interval.
- Dispose all intervals/listeners properly in `deactivate()`.

## Project deliverables

Generate a complete, ready-to-build project with:
- `package.json` (proper `engines.vscode`, `activationEvents: ["onStartupFinished"]`,
  `main` pointing at the compiled entry, all `contributes` sections filled in)
- `tsconfig.json`
- `src/extension.ts` ? full implementation (can split into a couple of small
  modules like `src/safety.ts`, `src/discovery.ts`, `src/statusBar.ts` if
  that's cleaner ? keep it readable)
- A simple build setup (esbuild or plain `tsc`, whichever is simpler to get
  working without extra global installs) with an npm script `build` and
  `watch`
- `README.md` explaining:
  - What the extension does and its safety model
  - How to run it in the Extension Development Host (`F5` in VS
    Code/Kiro) for testing
  - How to package it into a `.vsix` with `vsce package` for permanent
    install (`Extensions > ... > Install from VSIX`)
  - **Step-by-step first-run instructions**: run "Kiro Auto-Approve:
    Discover Kiro Commands (Debug)", read the Output channel, identify the
    correct command IDs for getting pending executions and approving one,
    paste them into the two settings, then toggle the status bar item on.

## Non-negotiables (please follow exactly)

- No screen scraping, no OCR, no simulated mouse/keyboard input anywhere in
  this project ? everything goes through the VS Code extension API only.
- Default state must be OFF/disabled until the user explicitly turns it on
  AND has filled in valid command IDs.
- The banned-keyword safety check must run on every single pending action,
  with no setting to disable it.
- Keep the code in plain, well-commented TypeScript ? no unnecessary
  dependencies beyond what's needed (avoid pulling in large frameworks for
  a small extension like this).

Please generate the full project now, all files, ready to open and run.