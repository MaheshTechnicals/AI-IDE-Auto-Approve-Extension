# Kiro Auto-Approve

**Kiro Auto-Approve** is a high-reliability, zero-screen-automation VS Code extension built specifically for **Kiro IDE** (a VS Code fork).

It monitors Kiro's AI-agent approval queue on a configurable interval and automatically approves safe pending actions while **strictly refusing** to auto-approve dangerous commands (privilege escalation, filesystem destruction, arbitrary remote scripts, reverse shells, force pushes, database drops, etc.).

---

## 🛡️ Safety Model (Non-Negotiables)

1. **Zero Screen Automation / Zero OCR**:
   - The extension works **strictly through the native VS Code / Kiro Extension Host API**.
   - No mouse clicks, no pixel coordinates, no keyboard simulation, and no OCR.
   - Operates identically across Windows, macOS, Linux, SSH Remote, WSL, and headless/VNC desktop environments.

2. **Always-Active Denylist**:
   - Every single pending action is evaluated against a security denylist before approval.
   - The safety check cannot be disabled or bypassed.
   - If **any** banned pattern matches, the action is marked **SKIPPED**, logged with the matching pattern, and left untouched for human review.

3. **Safe by Default**:
   - On installation, the extension is **OFF / Disabled**.
   - Auto-approval will not start until:
     - The user has configured valid command IDs for fetching pending actions and approving them.
     - The user explicitly toggles it ON via the status bar or command palette.

---

## 🚨 Default Banned Patterns

The default denylist (`kiroAutoApprove.bannedKeywords`) blocks commands matching these patterns (case-insensitive):

| Target Threat | Detected Patterns |
|---|---|
| **Filesystem Wipe** | `rm -rf`, `rm --recursive --force`, `del /s`, `Remove-Item ... -Recurse -Force` |
| **Drive / Disk Format** | `mkfs`, `dd if=`, `format`, writes to `/dev/sd*` |
| **Privilege Escalation** | `sudo`, `passwd`, `Set-ExecutionPolicy Bypass` |
| **Remote Script Execution** | `curl ... \| sh`, `wget ... \| sh`, `curl ... \| bash` |
| **System State Alteration** | `shutdown`, `reboot`, `regedit`, `reg delete` |
| **Broad Permissions** | `chmod -R 777`, `chmod 777` |
| **VCS Force Push** | `git push ... --force`, `--force-with-lease` |
| **Database Destruction** | `DROP TABLE`, `TRUNCATE` |
| **Reverse Shells & Sockets** | `nc -e`, `/dev/tcp/` |

You can add additional patterns using the command **"Kiro Auto-Approve: Add Banned Keyword"** or through VS Code Settings.

---

## 🚀 Step-by-Step First-Run Guide

Because Kiro IDE is under active development and command IDs may evolve between releases, this extension uses a **discovery-first architecture**:

### Step 1: Run Discovery Mode
1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Run **`Kiro Auto-Approve: Discover Kiro Commands (Debug)`**.
3. The extension opens the **"Kiro Auto-Approve"** Output Channel and prints:
   - All registered commands containing `kiro`
   - Other candidate approval/agent commands
   - Programmatic exports and top-level methods from `kiro.kiroAgent`

### Step 2: Identify Your Kiro Version's Command IDs
From the Output Channel, note the two command IDs:
1. **Fetch Command ID**: The command that retrieves pending actions (e.g. `kiro.agent.getPendingExecutions` or similar).
2. **Approval Command ID**: The command that accepts/approves an execution (e.g. `kiro.agent.approveExecution` or similar).

### Step 3: Paste into Settings
1. Open Settings (`Ctrl+,` or `Cmd+,`) and search for **`Kiro Auto-Approve`**.
2. Set **`kiroAutoApprove.getPendingCommandId`** to your fetch command ID.
3. Set **`kiroAutoApprove.approveCommandId`** to your approve command ID.

### Step 4: Turn Auto-Approve ON
1. Click the status bar item on the bottom right (`$(play) Auto-Approve: OFF`).
2. The item changes to `$(debug-pause) Auto-Approve: ON`.
3. The extension now polls on your configured interval (default: every 2 seconds) and automatically approves safe actions!

---

## ⚙️ Extension Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `kiroAutoApprove.enabled` | `boolean` | `false` | Enable or disable automatic approval loop. |
| `kiroAutoApprove.pollIntervalSeconds` | `number` | `2` (min: `1`) | Seconds between checks for pending approval requests. |
| `kiroAutoApprove.getPendingCommandId` | `string` | `""` | Command ID to fetch pending actions. |
| `kiroAutoApprove.approveCommandId` | `string` | `""` | Command ID to approve a pending action. |
| `kiroAutoApprove.bannedKeywords` | `string[]` | *(See table above)* | Regex patterns that immediately block auto-approval. |
| `kiroAutoApprove.maxHistoryEntries` | `number` | `200` | Number of recent approval/skip actions kept in memory. |

---

## ⌨️ Registered Commands

| Command | Title | Action |
|---|---|---|
| `kiroAutoApprove.toggle` | *Kiro Auto-Approve: Toggle On/Off* | Toggles active state between ON and OFF. |
| `kiroAutoApprove.showHistory` | *Kiro Auto-Approve: Show Recent Activity* | Displays recent decisions in an interactive QuickPick modal. |
| `kiroAutoApprove.clearHistory` | *Kiro Auto-Approve: Clear History* | Resets in-memory decision history. |
| `kiroAutoApprove.addBannedKeyword` | *Kiro Auto-Approve: Add Banned Keyword* | Prompts for a regex pattern and appends it to settings. |
| `kiroAutoApprove.dumpAvailableCommands` | *Kiro Auto-Approve: Discover Kiro Commands (Debug)* | Enumerates all Kiro/Agent commands and exports. |
| `kiroAutoApprove.openOutput` | *Kiro Auto-Approve: Show Logs* | Reveals the dedicated "Kiro Auto-Approve" Output channel. |

---

## 💻 Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Safety Tests
```bash
npm test
```
Runs the Mocha test suite verifying that all dangerous patterns are strictly blocked and benign commands are allowed.

### 3. Build Extension Bundle
```bash
npm run build
```
Uses `esbuild` to produce a fast, bundled, self-contained `dist/extension.js`.

### 4. Run in Extension Development Host (`F5`)
1. Open this folder in VS Code or Kiro IDE.
2. Press **`F5`** (or go to **Run and Debug** and select **"Run Extension (Kiro / VS Code)"**).
3. A new Extension Development Host window will launch with the extension active.

---

## 📦 Packaging to `.vsix`

To build an offline `.vsix` installer package for permanent installation:

```bash
# Package with vsce (skips checking git repo root if needed)
npx @vscode/vsce package --no-git-tag-version --no-dependencies
```

This creates `kiro-auto-approve-0.1.0.vsix`.

### To install in Kiro / VS Code:
1. Open Kiro IDE.
2. Go to the **Extensions view** (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Click the **`...`** (Views and More Actions) menu in the top-right corner of the Extensions pane.
4. Select **"Install from VSIX..."**.
5. Pick `kiro-auto-approve-0.1.0.vsix`.
# kiro-Auto-Approve-Extension
