import * as vscode from 'vscode';

export class StatusBarController {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'kiroAutoApprove.toggle';
    this.update(false);
    this.statusBarItem.show();
  }

  public update(enabled: boolean, safetyEnabled: boolean = false): void {
    if (enabled) {
      if (!safetyEnabled) {
        this.statusBarItem.text = '$(zap) Auto-Approve: ALL (No Restrictions)';
        this.statusBarItem.tooltip = 'Kiro Auto-Approve is ACTIVE in Full Autonomy mode (all commands/popups auto-approved). Click to Pause.';
      } else {
        this.statusBarItem.text = '$(debug-pause) Auto-Approve: ON';
        this.statusBarItem.tooltip = 'Kiro Auto-Approve is ACTIVE with safety checks. Click to Pause.';
      }
      this.statusBarItem.backgroundColor = undefined;
    } else {
      this.statusBarItem.text = '$(play) Auto-Approve: OFF';
      this.statusBarItem.tooltip = 'Kiro Auto-Approve is OFF. Click to Enable.';
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
