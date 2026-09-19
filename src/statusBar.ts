import * as vscode from 'vscode';

export interface StatusBarStats {
  approved: number;
  skipped: number;
  errors?: number;
}

export class StatusBarController {
  private statusBarItem: vscode.StatusBarItem;

  // Animation state
  private flashTimer: NodeJS.Timeout | null = null;
  private flashFrame: number = 0;
  private isEnabled: boolean = false;
  private isSafetyEnabled: boolean = false;

  // Animation constants
  private static readonly FLASH_FRAME_MS = 110;  // ms per frame
  private static readonly FLASH_TOTAL_FRAMES = 10; // 5 pulses × 2 frames

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
    // Save state so animation frames can restore correctly
    this.isEnabled = enabled;
    this.isSafetyEnabled = safetyEnabled;

    // Don't interrupt an ongoing flash animation — only update tooltip
    if (this.flashTimer !== null) {
      const statsSuffix = stats
        ? `\n\nActivity: ${stats.approved} approved | ${stats.skipped} blocked`
        : '';
      if (enabled) {
        if (!safetyEnabled) {
          this.statusBarItem.tooltip = `AI IDE Auto-Approve is ACTIVE in Full Autonomy mode (Kiro, Antigravity, VS Code).${statsSuffix}\n\nClick to Pause.`;
        } else {
          this.statusBarItem.tooltip = `AI IDE Auto-Approve is ACTIVE with safety checks (Kiro, Antigravity, VS Code).${statsSuffix}\n\nClick to Pause.`;
        }
      } else {
        this.statusBarItem.tooltip = `AI IDE Auto-Approve is OFF.${statsSuffix}\n\nClick to Enable.`;
      }
      return;
    }

    this.applyStaticState(enabled, safetyEnabled, stats);
  }

  /**
   * Triggered every time an action is auto-approved.
   * Creates a smooth "shine" effect: icon spins + warm background pulse.
   */
  public triggerApprovalFlash(): void {
    // Already flashing — extend by resetting frame counter
    if (this.flashTimer !== null) {
      this.flashFrame = 0;
      return;
    }

    this.flashFrame = 0;

    const animate = () => {
      this.flashFrame++;

      if (this.flashFrame >= StatusBarController.FLASH_TOTAL_FRAMES) {
        // Animation done — restore normal state
        clearInterval(this.flashTimer!);
        this.flashTimer = null;
        this.flashFrame = 0;
        this.applyStaticState(this.isEnabled, this.isSafetyEnabled);
        return;
      }

      const isGlowFrame = this.flashFrame % 2 === 1; // odd frames = glow on

      if (isGlowFrame) {
        // Glow frame: spinning icon + warm background
        if (this.isEnabled) {
          if (!this.isSafetyEnabled) {
            this.statusBarItem.text = '$(zap~spin) Auto-Approve: ALL';
          } else {
            this.statusBarItem.text = '$(sync~spin) Auto-Approve: ON';
          }
        }
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          'statusBarItem.warningBackground'
        );
      } else {
        // Rest frame: normal icon, no background
        if (this.isEnabled) {
          if (!this.isSafetyEnabled) {
            this.statusBarItem.text = '$(zap) Auto-Approve: ALL';
          } else {
            this.statusBarItem.text = '$(debug-pause) Auto-Approve: ON';
          }
        }
        this.statusBarItem.backgroundColor = undefined;
      }
    };

    // Kick-off immediately on frame 1 (glow)
    if (this.isEnabled) {
      if (!this.isSafetyEnabled) {
        this.statusBarItem.text = '$(zap~spin) Auto-Approve: ALL';
      } else {
        this.statusBarItem.text = '$(sync~spin) Auto-Approve: ON';
      }
    }
    this.statusBarItem.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );

    this.flashTimer = setInterval(animate, StatusBarController.FLASH_FRAME_MS);
  }

  private applyStaticState(
    enabled: boolean,
    safetyEnabled: boolean,
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
    if (this.flashTimer !== null) {
      clearInterval(this.flashTimer);
      this.flashTimer = null;
    }
    this.statusBarItem.dispose();
  }
}
