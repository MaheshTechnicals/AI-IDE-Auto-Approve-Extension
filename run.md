# 🚀 Step-by-Step Run Kaise Karein (Version 1.0.0)

### 1. Install ya Debug:
- **Kiro IDE me**: [ai-ide-auto-approve-1.0.0.vsix](file:///root/projects/AutoRun/ai-ide-auto-approve-1.0.0.vsix) install karein (`Extensions > ... > Install from VSIX...`) ya CLI se:
  ```bash
  kiro --install-extension ai-ide-auto-approve-1.0.0.vsix --force
  ```
- **Google Antigravity IDE me**:
  ```bash
  antigravity --install-extension ai-ide-auto-approve-1.0.0.vsix --force
  ```
  ya Extensions pane se VSIX install karein.
- **Development / Testing**: VS Code / Antigravity / Kiro IDE me workspace khol kar **`F5`** dabayein (Extension Development Host launch hoga).

---

### 2. Auto-Approval Mode (No Restrictions / Full Autonomy):
- Default me **Safety check OFF** (Full Autonomy) set hai:
  - **Google Antigravity IDE**: Native SQLite database (`state.vscdb`) me ~180+ developer tools (Shells, Node, Python, Core Unix, Compilers, Cloud, Databases) direct inject ho chuke hain. Koi permission prompt nahi aayega!
  - **Kiro IDE**: Kiro agent ke saare popups, terminal commands, diff reviews, aur tool calls real-time background loop ke through instant approve hote hain.
  - Status bar par text dikhega: `$(zap) Auto-Approve: ALL` (Tooltip me live approved/skipped counters display hote hain).
- Agar aap chahein toh Command Palette (`Ctrl+Shift+P`) se Safety Mode toggle kar sakte hain:
  `AI IDE Auto-Approve: Toggle Safety Checks On/Off`

---

### 3. Turn ON / OFF:
- Status bar item par click karein:
  - `$(zap) Auto-Approve: ALL` — Sabhi popups aur commands auto-approve honge.
  - Click karne par `Auto-Approve: OFF` (Pause) ho jayega.

