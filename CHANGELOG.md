# Changelog

All notable changes to the **AI IDE Auto-Approve** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-09-19

### ✨ Smart Activity Tracking & Approval Shine Animation

#### Fixed
- **Spurious Activity Counter on Hover / Idle**: The status bar activity counter was incorrectly incrementing on every hover event and during idle poll cycles. Root cause: the engine was re-reading the last 25 lines of transcript files on every 2-second poll, causing old completed actions to be re-counted as new approvals.
- **Off → On Reset Bug**: Toggling the extension OFF then ON was not reliably resetting the activity counter to 0. The `stop()` method now directly broadcasts `onStateChange(false, ...)` with zeroed stats, and the `toggle()` ON path explicitly calls `resetActivityState()` before starting — guaranteeing the status bar always shows **0** on fresh enable.
- **Processed Action ID Cache Eviction Re-counting**: `processedActionIds` was bounded to 500 entries; evicted IDs could be re-read from the transcript file and counted again, producing phantom increments.

#### Added
- **Offset-Based File Reading** (`getNewAntigravityActions()`, `getNewKiroActions()`): Engine now snapshots the file EOF when first enabled and only reads bytes appended *after* that point. Zero old actions ever re-processed — activity counter only reflects genuine new approvals.
- **Permanent `seenActionIds` Set**: A permanent per-session dedup set that is never evicted during an ON session. Every unique action ID is counted exactly once, regardless of polling frequency.
- **✨ Approval Shine Animation** (`StatusBarController.triggerApprovalFlash()`): The status bar button now plays a smooth 5-pulse "shine" animation on every auto-approval:
  - Spinning lightning icon: `$(zap~spin)` on glow frames
  - Warm highlight background: VS Code `statusBarItem.warningBackground` ThemeColor
  - 110ms per frame — ~1.1 second total smooth effect
  - Stacking-safe: rapid approvals extend the current animation instead of stacking
  - Animation-aware `update()`: tooltip refreshes mid-animation without interrupting the visual effect
- **`onApproval` Engine Callback**: New optional callback on `AutoApproveEngine` constructor, called on every newly approved action in both Kiro and Antigravity polling paths.

#### Changed
- `processedActionIds` cache limit raised from 500 → 1000 entries for reduced eviction frequency.
- **91 automated unit tests** passing (100% pass rate).

---



### 🌍 Cross-Platform Hardening & Universal Path Resolution

#### Added
- **macOS Application Support Path Resolution**: Added `~/Library/Application Support/` as a candidate path for Antigravity IDE's `state.vscdb` database, Antigravity brain session transcripts, and Kiro IDE sessions — matching standard macOS Electron app storage conventions.
- **Linux XDG_CONFIG_HOME Support**: Added `$XDG_CONFIG_HOME` environment variable fallback for all path resolution methods, supporting non-standard Linux configurations where `~/.config/` is overridden.
- **5-Candidate Path Search Strategy**: All 3 path resolution methods (`getDatabasePath()`, `getAntigravitySessionsRoot()`, `getSessionsRoot()`) now search 5 candidate paths in priority order:
  1. Linux standard (`~/.config/`, `~/.gemini/`, `~/.kiro/`)
  2. Linux XDG override (`$XDG_CONFIG_HOME/...`)
  3. macOS Application Support (`~/Library/Application Support/...`)
  4. Windows APPDATA (`%APPDATA%/...`)
  5. Windows LOCALAPPDATA (`%LOCALAPPDATA%/...`)

#### Verified
- **Full cross-platform audit**: Reviewed all 8 source files, 5 test files, build configuration, and package manifest — confirmed 100% cross-platform compatibility using `path.join()`, `os.homedir()`, and `process.env` for all filesystem operations.
- **80 unit tests passing** on updated codebase (99ms execution time).
- **Safety patterns cover both platforms**: Linux/macOS (`rm -rf`, `sudo`, `chmod 777`, `curl|bash`) and Windows (`regedit`, `format C:`, `Remove-Item -Recurse -Force`, `Set-ExecutionPolicy Bypass`).

---

## [1.0.0] - 2026-09-18

### 🚀 Major Milestone Release: Native Antigravity Autonomous Engine & Full Tool Autonomy

#### Added
- **Native Antigravity Unified State Sync (USS) Database Injection**:
  - Direct read/write injection of autonomous permissions into `/root/.config/Antigravity IDE/User/globalStorage/state.vscdb` (`antigravityUnifiedStateSync.agentPreferences`).
  - Solves the critical issue where Google Antigravity IDE's native Go Language Server (`language_server_linux_x64`) ignored wildcard expressions (`command(*)`, `*`) and failed with `unexpected user interaction type: not permission`.
  - Automatically establishes bit-exact double-layer nested Base64 Protobuf serialization.
- **Comprehensive 180+ Developer Tool Grants across 12 Categories**:
  - **1. Wildcards & Core Resource Actions**: `*`, `command(*)`, `unsandboxed(*)`, `custom(*)`, `execute_url(*)`, `execute_url(localhost)`, `write_file(*)`, `read_file(*)`
  - **2. Shells & Script Interpreters**: `bash`, `sh`, `zsh`, `dash`, `fish`, `ksh`
  - **3. Node.js / JavaScript / TypeScript Ecosystem**: `node`, `nodejs`, `npm`, `npx`, `pnpm`, `pnpx`, `yarn`, `bun`, `bunx`, `deno`, `tsc`, `ts-node`, `tsx`, `esbuild`, `vite`, `next`, `webpack`, `rollup`, `turbo`, `jest`, `vitest`, `mocha`, `eslint`, `prettier`, `corepack`
  - **4. Python Ecosystem**: `python`, `python3`, `pip`, `pip3`, `pipx`, `poetry`, `uv`, `venv`, `virtualenv`, `conda`, `pytest`, `ruff`, `black`, `mypy`, `flake8`, `pylint`, `jupyter`
  - **5. Core Linux / Unix Utilities**: `git`, `curl`, `wget`, `sed`, `awk`, `jq`, `base64`, `strings`, `tar`, `chmod`, `chown`, `rm`, `mv`, `cp`, `mkdir`, `cat`, `grep`, `egrep`, `fgrep`, `find`, `which`, `whereis`, `head`, `tail`, `less`, `more`, `sort`, `uniq`, `wc`, `cut`, `tr`, `tee`, `xargs`, `touch`, `ln`, `df`, `du`, `ps`, `top`, `htop`, `kill`, `killall`, `pgrep`, `pkill`, `env`, `export`, `echo`, `printf`, `clear`, `reset`, `sleep`, `whoami`, `id`, `uname`, `uptime`, `date`, `zip`, `unzip`, `gzip`, `gunzip`, `bzip2`, `xz`, `diff`, `patch`, `file`, `stat`, `md5sum`, `sha256sum`
  - **6. Modern CLI Power Tools**: `rg` (ripgrep), `fd`, `bat`, `fzf`, `tree`, `eza`, `exa`, `ncdu`, `tldr`, `http`, `curlie`
  - **7. Compilers & Build Tools**: `make`, `cmake`, `ninja`, `gcc`, `g++`, `clang`, `clang++`
  - **8. Other Languages & Runtimes**: `rustc`, `cargo`, `go`, `gofmt`, `java`, `javac`, `mvn`, `gradle`, `ruby`, `gem`, `bundle`, `php`, `composer`, `perl`, `lua`
  - **9. Containers, Cloud & DevOps**: `docker`, `docker-compose`, `podman`, `kubectl`, `helm`, `terraform`, `ansible`, `vagrant`, `aws`, `gcloud`, `az`, `gh`, `glab`, `git-lfs`, `svn`
  - **10. Databases**: `sqlite3`, `psql`, `mysql`, `redis-cli`, `mongosh`, `mongo`
  - **11. Mobile & Android Development**: `adb`, `emulator`, `fastboot`, `scrcpy`
  - **12. IDE & Binaries**: `code`, `antigravity`, `agy`, `kiro`
- **Wire-Type Aware Protobuf Engine (`AntigravityStateManager`)**:
  - Implemented robust Protobuf decoding and encoding for wire types: Varint (0), 64-bit fixed (1), Length-delimited (2), and 32-bit fixed (5).
  - Preserves Protobuf `e_tag` (version tracking) and all existing preferences (`terminalAutoExecutionPolicy`, theme, override store).
- **Expanded Test Suite (80 Passing Tests)**:
  - Added unit test coverage for Protobuf varint serialization, wire encoding, grant injection verification, denylist/allowlist, and activity logging.
- **Enhanced Startup Sync & Logging**:
  - Automatically logs injected grant counts and active permissions on extension activation.

---

## [0.4.0] - 2026-09-18

### Changed
- **Rebrand to "AI IDE Auto-Approve Extension"**: Universal autonomous auto-approval extension for AI IDEs (Kiro IDE, Google Antigravity IDE, VS Code).
- **GitHub Repository Renamed**: Renamed repository to `MaheshTechnicals/AI-IDE-Auto-Approve-Extension`.
- **Primary Commands & Settings**: Migrated primary command and configuration namespace to `aiIdeAutoApprove.*` (`aiIdeAutoApprove.toggle`, `aiIdeAutoApprove.toggleSafety`, etc.).
- **Backwards Compatibility**: Fully preserved `kiroAutoApprove.*` aliases for all commands and settings.
- **Enhanced Dialog Acceptance**: Added `workbench.action.acceptSelectedQuickOpenItem` to Antigravity approval actions to seamlessly handle interactive permission modals.

---

## [0.3.0] - 2026-09-18

### Added
- **Google Antigravity IDE Integration**: Native dual-engine auto-approval support for both Kiro IDE and Google Antigravity IDE.
- **Antigravity Execution Handlers**: Automatically triggers native Antigravity commands:
  - `antigravity.command.accept`: Approves proposed agent commands.
  - `antigravity.terminalCommand.run` / `antigravity.terminalCommand.accept`: Auto-runs terminal command confirmation prompts.
  - `antigravity.prioritized.agentAcceptAllInFile` / `antigravity.prioritized.agentAcceptFocusedHunk`: Auto-accepts file diffs and edits.
- **Antigravity Session Transcript Monitoring**: Inspects `~/.gemini/antigravity-ide/brain/<conv_id>/.system_generated/logs/transcript.jsonl` in real-time, extracting tool calls and validating safety.
- **Multi-IDE Settings**: Added `kiroAutoApprove.enableKiro`, `kiroAutoApprove.enableAntigravity`, and `kiroAutoApprove.antigravityApproveCommands`.
- **Discovery Mode for Antigravity**: `kiroAutoApprove.dumpAvailableCommands` now detects and inspects both `antigravity.*` and `kiro.*` commands and extension exports.
- **Dual Tooltip & Counters**: Updated status bar tooltip to reflect dual autonomy across both Kiro and Antigravity.
- Expanded automated unit tests to 74 tests covering Antigravity command dispatching and transcript security validation.

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
