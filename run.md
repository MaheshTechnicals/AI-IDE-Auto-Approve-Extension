# 🚀 Step-by-Step Run Kaise Karein

### 1. Install ya Debug:
- **Permanent Install**: Kiro IDE me [kiro-auto-approve-0.2.3.vsix](file:///root/projects/AutoRun/kiro-auto-approve-0.2.3.vsix) install karein (`Extensions > ... > Install from VSIX...`).
- **Development/Testing**: Ya VS Code / Kiro IDE me project khol kar **`F5`** dabayein (Extension Development Host launch hoga).

---

### 2. Auto-Approval Mode (No Restrictions / Full Autonomy):
- Default me ab **Safety check OFF** (No Restrictions) set hai jisse:
  - Saare commands aur popups bina kisi restriction ke automatically approve hote hain.
  - Status bar par text dikhega: `$(zap) Auto-Approve: ALL` (Tooltip me live approved/skipped stats dikhte hain).
- Agar aap chahein toh Command Palette (`Ctrl+Shift+P`) se kabhi bhi toggle kar sakte hain:
  `Kiro Auto-Approve: Toggle Safety Checks On/Off`

---

### 3. Turn ON / OFF:
- Status bar item par click karein:
  - `$(zap) Auto-Approve: ALL` — Sabhi popups aur commands auto-approve honge.
  - Click karne par `Auto-Approve: OFF` (Pause) ho jayega.
