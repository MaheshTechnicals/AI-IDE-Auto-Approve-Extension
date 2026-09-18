import * as vscode from 'vscode';

export interface StatusBarStats {
  approved: number;
  skipped: number;
  errors?: number;
}

export class StatusBarController {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.name = 'AI IDE Auto-Approve';
    this.statusBarItem.command = 'aiIdeAutoApprove.toggle';
    this.update(false);
    this.statusBarItem.show();
  }

  public update(
    enabled: boolean,
    safetyEnabled: boolean = false,
    stats?: StatusBarStats
  ): void {
    const statsSuffix = stats
      ? `\n\nActivity: ${stats.approved} approved | ${stats.skipped} blocked`
      : '';

    if (enabled) {
      if (!safetyEnabled) {
        this.statusBarItem.text = '$(zap) Auto-Approve: ALL';
        this.statusBarItem.tooltip = `AI IDE Auto-Approve is ACTIVE in Full Autonomy mode (Kiro, Antigravity, VS Code).${statsSuffix}\n\nClick to Pause.`;
      } else {
        this.statusBarItem.text = '$(debug-pause) Auto-Approve: ON';
        this.statusBarItem.tooltip = `AI IDE Auto-Approve is ACTIVE with safety checks (Kiro, Antigravity, VS Code).${statsSuffix}\n\nClick to Pause.`;
      }
      this.statusBarItem.backgroundColor = undefined;
    } else {
      this.statusBarItem.text = '$(play) Auto-Approve: OFF';
      this.statusBarItem.tooltip = `AI IDE Auto-Approve is OFF.${statsSuffix}\n\nClick to Enable.`;
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
