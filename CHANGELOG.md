# Changelog

All notable changes to the **Kiro Auto-Approve** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.3] - 2026-09-18

### Added
- Real-time decision counters (`approved`, `skipped`, `errors`) in `OutputLogger` with live statistics display in status bar tooltip.
- Status bar tooltip now shows active activity count: e.g. `Stats: 14 approved | 0 blocked`.
- Expanded test coverage to 71 automated tests verifying all safety regexes, benign commands, stats counters, arrays, and bigints.

### Fixed
- Fixed potential false-positives on `format` by refining pattern to Windows drive format only (`\bformat\s+[a-zA-Z]:`), preserving commands like `npm run format`, `prettier --format`, and `clang-format`.
- Refined SQL drop rule to `\bdrop\s+(table|database)\b` preventing false-positives on UI phrases like "dropdown" or "drag and drop".
- Expanded pipe-to-shell patterns to include `zsh` (`curl.*\|.*(sh|bash|zsh)`).
- Expanded permissions check to cover symbolic permissions `chmod\s+(-R\s+)?(777|a\+rwx)`.
- Bounded `skippedIds` memory cache alongside `processedActionIds` to ensure zero memory accumulation during extended uptime.
- Synchronized default configuration settings in `package.json` with engine safety definitions.

---

## [0.2.2] - 2026-09-18

### Added
- Comprehensive test suite covering engine lifecycle, configuration fallbacks, normalization, and logger history management (64 automated tests).
- Added "Copy Content" action to Recent Activity QuickPick modal for quick clipboard export.
- Cross-platform Kiro session directory resolver supporting Linux, macOS, and Windows (%APPDATA% / %LOCALAPPDATA%).

### Fixed
- Guaranteed zero file-descriptor leaks in session log reading using `try ... finally` blocks.
- Active session caching system drastically reducing filesystem disk I/O during 2-second polling cycles.
- Multi-tool parallel execution inspection: checks the entire batch of pending tool calls to prevent any unsafe command from executing during multi-action prompts.
- Prevented double-polling race condition when starting or toggling the engine.

---

## [0.2.1] - 2026-09-18

### Fixed
- Fixed SQL `truncate` regex rule (`\btruncate\s+(table\s+)?[a-zA-Z0-9_\`"\[\]]+`) to prevent false-positive matching on common English words like "truncated" or "truncating".
- Enhanced `updatePatterns` in `SafetyChecker` to honor empty array overrides without forcing fallback to defaults.

---

## [0.2.0] - 2026-09-18

### Added
- **Full Autonomy / Unrestricted Mode**: Added `kiroAutoApprove.safetyEnabled` configuration option (default: `false`) to auto-approve all commands, tool actions, and confirmation popups without restriction.
- Added command `kiroAutoApprove.toggleSafety` to seamlessly toggle safety checks on or off via the Command Palette.
- Updated status bar to dynamically reflect autonomy mode (`$(zap) Auto-Approve: ALL (No Restrictions)` vs `$(debug-pause) Auto-Approve: ON`).

---

## [0.1.1] - 2026-09-18

### Added
- Native Kiro IDE session inspection from `~/.kiro/sessions` to dynamically discover active tool executions without requiring user-configured pending command IDs.
- Configured default `approveCommandId` to Kiro's official internal execution handler: `kiroAgent.execution.runOrAcceptAll`.

### Fixed
- Fixed status bar toggle responsiveness so that clicking the toggle button immediately turns the extension ON/OFF without getting blocked by missing command ID prompts.

---

## [0.1.0] - 2026-09-18

### Added
- Initial release of Kiro Auto-Approve extension.
- 100% native VS Code / Kiro extension host API implementation with zero screen automation or OCR.
- Discovery Mode command (`kiroAutoApprove.dumpAvailableCommands`) for inspecting editor commands and extension exports.
- Security denylist regex checker blocking `rm -rf`, `sudo`, `mkfs`, `format`, `del /s`, `shutdown`, `reboot`, `passwd`, `curl | sh`, `wget | sh`, `chmod 777`, `git push --force`, `drop table`, `/dev/sd*`, `regedit`, `Remove-Item -Recurse -Force`, `Set-ExecutionPolicy Bypass`, and reverse shells.
- Status bar item with play/pause icons.
- In-memory activity history log with interactive QuickPick review.
- Automated Mocha test suite.
