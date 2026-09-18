import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SafetyChecker } from './safety';
import { OutputLogger } from './logger';
import { ExtensionConfig } from './types';

const DEFAULT_APPROVE_COMMAND = 'kiroAgent.execution.runOrAcceptAll';

interface KiroToolAction {
  id: string;
  text: string;
  raw: unknown;
  status: string;
}

export class AutoApproveEngine {
  private timer: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private safetyChecker: SafetyChecker;
  private logger: OutputLogger;
  private onStateChange: (enabled: boolean, safetyEnabled: boolean) => void;
  private skippedIds: Set<string> = new Set();
  private processedActionIds: Set<string> = new Set();

  constructor(
    safetyChecker: SafetyChecker,
    logger: OutputLogger,
    onStateChange: (enabled: boolean, safetyEnabled: boolean) => void
  ) {
    this.safetyChecker = safetyChecker;
    this.logger = logger;
    this.onStateChange = onStateChange;
  }

  public getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('kiroAutoApprove');
    const approveCmd = config.get<string>('approveCommandId', DEFAULT_APPROVE_COMMAND).trim();

    return {
      enabled: config.get<boolean>('enabled', false),
      safetyEnabled: config.get<boolean>('safetyEnabled', false),
      pollIntervalSeconds: Math.max(1, config.get<number>('pollIntervalSeconds', 2)),
      bannedKeywords: config.get<string[]>('bannedKeywords', []),
      getPendingCommandId: config.get<string>('getPendingCommandId', '').trim(),
      approveCommandId: approveCmd || DEFAULT_APPROVE_COMMAND,
      maxHistoryEntries: config.get<number>('maxHistoryEntries', 200)
    };
  }

  public start(): void {
    this.stop();
    const config = this.getConfig();

    if (!config.enabled) {
      this.logger.info('Auto-Approve is OFF. Polling stopped.');
      this.onStateChange(false, config.safetyEnabled);
      return;
    }

    const modeDesc = config.safetyEnabled ? 'Safety Check ON' : 'ALL APPROVED (No Restrictions / Full Autonomy)';
    this.logger.info(
      `Starting Auto-Approve loop (Interval: ${config.pollIntervalSeconds}s | Mode: ${modeDesc} | ApproveCmd: "${config.approveCommandId}")`
    );
    this.onStateChange(true, config.safetyEnabled);

    const intervalMs = config.pollIntervalSeconds * 1000;
    this.timer = setInterval(() => {
      this.pollCycle().catch((err) => {
        this.logger.error('Unhandled error in polling cycle', err);
      });
    }, intervalMs);

    // Run first iteration immediately
    this.pollCycle().catch((err) => {
      this.logger.error('Unhandled error in initial poll cycle', err);
    });
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isPolling = false;
    this.onStateChange(false, this.getConfig().safetyEnabled);
  }

  public async toggle(): Promise<boolean> {
    const config = this.getConfig();
    const targetState = !config.enabled;

    await vscode.workspace
      .getConfiguration('kiroAutoApprove')
      .update('enabled', targetState, vscode.ConfigurationTarget.Global);

    this.onStateChange(targetState, config.safetyEnabled);

    if (targetState) {
      this.start();
      const modeText = config.safetyEnabled ? 'with Safety Checks' : 'ALL APPROVED (No Restrictions)';
      vscode.window.showInformationMessage(
        `Kiro Auto-Approve: ENABLED (${modeText})`
      );
      this.logger.info(`Auto-Approve toggled ON by user (${modeText}).`);
    } else {
      this.stop();
      vscode.window.showInformationMessage('Kiro Auto-Approve: PAUSED / OFF');
      this.logger.info('Auto-Approve toggled OFF by user.');
    }

    return targetState;
  }

  public async toggleSafety(): Promise<boolean> {
    const config = this.getConfig();
    const targetSafety = !config.safetyEnabled;

    await vscode.workspace
      .getConfiguration('kiroAutoApprove')
      .update('safetyEnabled', targetSafety, vscode.ConfigurationTarget.Global);

    this.onStateChange(config.enabled, targetSafety);

    const desc = targetSafety ? 'Safety Check ENABLED' : 'Safety Check DISABLED (ALL APPROVED)';
    vscode.window.showInformationMessage(`Kiro Auto-Approve: ${desc}`);
    this.logger.info(`Safety setting changed: ${desc}`);
    return targetSafety;
  }

  public async pollCycle(): Promise<void> {
    if (this.isPolling) {
      return;
    }
    this.isPolling = true;

    try {
      const config = this.getConfig();
      if (!config.enabled) {
        this.stop();
        return;
      }

      const approveCmd = config.approveCommandId || DEFAULT_APPROVE_COMMAND;

      // Mode A: Explicit command configured for fetching pending items
      if (config.getPendingCommandId) {
        await this.pollWithCustomCommand(config.getPendingCommandId, approveCmd, config.safetyEnabled);
        return;
      }

      // Mode B: Native Kiro IDE session & execution monitoring
      await this.pollKiroNative(approveCmd, config.safetyEnabled);
    } catch (cycleErr) {
      this.logger.error('Error during auto-approve check cycle', cycleErr);
    } finally {
      this.isPolling = false;
    }
  }

  private async pollWithCustomCommand(
    getPendingCommandId: string,
    approveCommandId: string,
    safetyEnabled: boolean
  ): Promise<void> {
    let rawResult: unknown;
    try {
      rawResult = await vscode.commands.executeCommand(getPendingCommandId);
    } catch (cmdError) {
      this.logger.error(
        `Command "${getPendingCommandId}" failed or does not exist.`,
        cmdError
      );
      return;
    }

    const pendingItems = this.normalizePendingItems(rawResult);
    if (pendingItems.length === 0) {
      return;
    }

    for (const item of pendingItems) {
      const itemId = this.getItemId(item);
      const itemText = SafetyChecker.extractText(item);

      if (safetyEnabled) {
        const safetyCheck = this.safetyChecker.check(itemText, true);

        if (!safetyCheck.safe) {
          if (!this.skippedIds.has(itemId)) {
            this.skippedIds.add(itemId);
            this.logger.recordDecision(
              'SKIPPED',
              itemText,
              `Banned pattern matched: ${safetyCheck.matchedPattern}`,
              item
            );
          }
          continue;
        }
      }

      try {
        await this.executeApproval(approveCommandId, item);
        const reason = safetyEnabled ? 'Passed safety check' : 'All Approved (No Restrictions)';
        this.logger.recordDecision('APPROVED', itemText, reason, item);
      } catch (approveErr) {
        this.logger.recordDecision(
          'ERROR',
          itemText,
          `Approval command failed: ${String(approveErr)}`,
          item
        );
      }
    }
  }

  private async pollKiroNative(approveCommandId: string, safetyEnabled: boolean): Promise<void> {
    // 1. Inspect recent Kiro tool actions from session
    const latestAction = this.getLatestKiroAction();

    if (latestAction) {
      const actionId = latestAction.id;

      // Check if action was already evaluated
      if (!this.processedActionIds.has(actionId)) {
        this.processedActionIds.add(actionId);
        if (this.processedActionIds.size > 200) {
          const firstKey = this.processedActionIds.values().next().value;
          if (firstKey) {
            this.processedActionIds.delete(firstKey);
          }
        }

        if (safetyEnabled) {
          const safetyCheck = this.safetyChecker.check(latestAction.text, true);

          if (!safetyCheck.safe) {
            this.skippedIds.add(actionId);
            this.logger.recordDecision(
              'SKIPPED',
              latestAction.text,
              `Banned pattern matched: ${safetyCheck.matchedPattern}`,
              latestAction.raw
            );
            return;
          }

          this.logger.recordDecision('APPROVED', latestAction.text, 'Passed safety check', latestAction.raw);
        } else {
          this.logger.recordDecision('APPROVED', latestAction.text, 'All Approved (No Restrictions)', latestAction.raw);
        }
      } else if (safetyEnabled && this.skippedIds.has(actionId)) {
        return;
      }
    }

    // 2. Trigger Kiro approve/accept execution command
    try {
      await vscode.commands.executeCommand(approveCommandId);
    } catch {
      // Command might fail if no execution is currently awaiting confirmation
    }
  }

  private getLatestKiroAction(): KiroToolAction | null {
    const sessionsRoot = path.join(os.homedir(), '.kiro', 'sessions');
    if (!fs.existsSync(sessionsRoot)) {
      return null;
    }

    try {
      let latestMsgFile: string | null = null;
      let latestMtime = 0;

      const workspaces = fs.readdirSync(sessionsRoot);
      for (const ws of workspaces) {
        const wsPath = path.join(sessionsRoot, ws);
        try {
          if (!fs.statSync(wsPath).isDirectory()) {
            continue;
          }
          const sessions = fs.readdirSync(wsPath);
          for (const sess of sessions) {
            const sessPath = path.join(wsPath, sess);
            try {
              if (!fs.statSync(sessPath).isDirectory()) {
                continue;
              }
              const msgFile = path.join(sessPath, 'messages.jsonl');
              if (fs.existsSync(msgFile)) {
                const mtime = fs.statSync(msgFile).mtimeMs;
                if (mtime > latestMtime) {
                  latestMtime = mtime;
                  latestMsgFile = msgFile;
                }
              }
            } catch {}
          }
        } catch {}
      }

      if (!latestMsgFile) {
        return null;
      }

      // Read tail of messages.jsonl
      const stat = fs.statSync(latestMsgFile);
      const readSize = Math.min(stat.size, 32768);
      const fd = fs.openSync(latestMsgFile, 'r');
      const buffer = Buffer.alloc(readSize);
      fs.readSync(fd, buffer, 0, readSize, Math.max(0, stat.size - readSize));
      fs.closeSync(fd);

      const lines = buffer.toString('utf-8').trim().split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) {
          continue;
        }
        try {
          const data = JSON.parse(line);
          if (data.payload && data.payload.type === 'tool_call') {
            const status = String(data.payload.status || 'pending');
            const displayText = SafetyChecker.extractText(data.payload);
            return {
              id: data.id || data.payload.toolCallId || String(data.timestamp),
              text: displayText,
              raw: data.payload,
              status
            };
          }
        } catch {}
      }
    } catch (err) {
      this.logger.warn(`Could not inspect Kiro sessions directory: ${String(err)}`);
    }

    return null;
  }

  private normalizePendingItems(raw: unknown): unknown[] {
    if (!raw) {
      return [];
    }
    if (Array.isArray(raw)) {
      return raw;
    }
    if (typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      for (const key of ['items', 'pending', 'executions', 'queue', 'actions', 'requests']) {
        if (Array.isArray(obj[key])) {
          return obj[key] as unknown[];
        }
      }
      return [raw];
    }
    return [raw];
  }

  private getItemId(item: unknown): string {
    if (item === null || item === undefined) {
      return '';
    }
    if (typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      if (obj.id !== undefined) {
        return String(obj.id);
      }
      if (obj.executionId !== undefined) {
        return String(obj.executionId);
      }
      if (obj.actionId !== undefined) {
        return String(obj.actionId);
      }
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    }
    return String(item);
  }

  private async executeApproval(approveCommandId: string, item: unknown): Promise<void> {
    let arg: unknown = item;
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      if (obj.id !== undefined) {
        arg = obj.id;
      }
    }

    try {
      await vscode.commands.executeCommand(approveCommandId, arg);
    } catch {
      try {
        await vscode.commands.executeCommand(approveCommandId, item);
      } catch {
        await vscode.commands.executeCommand(approveCommandId);
      }
    }
  }

  public dispose(): void {
    this.stop();
  }
}
