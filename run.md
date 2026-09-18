# 🚀 Step-by-Step Run Kaise Karein

### 1. Install ya Debug:
- **Kiro IDE me**: [ai-ide-auto-approve-0.4.0.vsix](file:///root/projects/AutoRun/ai-ide-auto-approve-0.4.0.vsix) install karein (`Extensions > ... > Install from VSIX...`) ya CLI se `kiro --install-extension ai-ide-auto-approve-0.4.0.vsix --force`.
- **Google Antigravity IDE me**: CLI se `antigravity --install-extension ai-ide-auto-approve-0.4.0.vsix --force` ya Extensions pane se install karein.
- **Development/Testing**: Ya VS Code / Antigravity / Kiro IDE me project khol kar **`F5`** dabayein (Extension Development Host launch hoga).

---

### 2. Auto-Approval Mode (No Restrictions / Full Autonomy):
- Default me **Safety check OFF** (Full Autonomy) set hai:
  - Kiro aur Antigravity IDE ke saare commands, popups, terminal executions, aur diff hunks bina kisi restriction ke automatically approve hote hain.
  - Status bar par text dikhega: `$(zap) Auto-Approve: ALL` (Tooltip me live approved/skipped stats dikhte hain).
- Agar aap chahein toh Command Palette (`Ctrl+Shift+P`) se kabhi bhi toggle kar sakte hain:
  `AI IDE Auto-Approve: Toggle Safety Checks On/Off`

---

### 3. Turn ON / OFF:
- Status bar item par click karein:
  - `$(zap) Auto-Approve: ALL` — Sabhi popups aur commands auto-approve honge.
  - Click karne par `Auto-Approve: OFF` (Pause) ho jayega.
