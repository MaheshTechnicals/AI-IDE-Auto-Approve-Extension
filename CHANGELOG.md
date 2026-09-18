# Changelog

All notable changes to the **Kiro Auto-Approve** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
