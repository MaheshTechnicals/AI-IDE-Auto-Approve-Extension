import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SafetyChecker } from './safety';
import { OutputLogger } from './logger';
import { ExtensionConfig } from './types';
import { StatusBarStats } from './statusBar';
import { AntigravityStateManager } from './antigravityState';

export const DEFAULT_APPROVE_COMMAND = 'kiroAgent.execution.runOrAcceptAll';
export const DEFAULT_ANTIGRAVITY_COMMANDS: string[] = [
  'antigravity.acceptAgentStep',
  'antigravity.command.accept',
  'antigravity.terminalCommand.run',
  'antigravity.terminalCommand.accept',
  'antigravity.prioritized.agentAcceptAllInFile',
  'antigravity.prioritized.agentAcceptFocusedHunk',
  'workbench.action.chat.acceptTool',
  'workbench.action.chat.acceptToolPostExecution',
  'workbench.action.chat.acceptElicitation',
  'workbench.action.chat.submit',
  'workbench.action.acceptSelectedQuickOpenItem'
];
const CACHE_VALIDITY_MS = 15000;

interface ToolActionItem {
  id: string;
  text: string;
  raw: unknown;
  status: string;
  source?: 'kiro' | 'antigravity';
}

export class AutoApproveEngine {
  private timer: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private isRunning: boolean = false;
  private safetyChecker: SafetyChecker;
  private logger: OutputLogger;
  private onStateChange: (enabled: boolean, safetyEnabled: boolean, stats?: StatusBarStats) => void;
  private onApproval?: () => void;
  private skippedIds: Set<string> = new Set();
  private processedActionIds: Set<string> = new Set();
  // Permanent cross-session dedup set — never evicted within a single ON session.
  // Cleared only when the engine is stopped/toggled so activity truly resets to 0.
  private seenActionIds: Set<string> = new Set();

  // Session caching for high-efficiency disk I/O
  private cachedSessionFile: string | null = null;
  private cachedSessionLastScan: number = 0;
  private cachedAntigravityFile: string | null = null;
  private cachedAntigravityLastScan: number = 0;
  // File offset tracking — only read lines appended AFTER the engine was started
  private antigravityFileOffset: number = 0;
  private kiroFileOffset: number = 0;
  private antigravityTrackedFile: string | null = null;
  private kiroTrackedFile: string | null = null;

  constructor(
    safetyChecker: SafetyChecker,
    logger: OutputLogger,
    onStateChange: (enabled: boolean, safetyEnabled: boolean, stats?: StatusBarStats) => void,
    onApproval?: () => void
  ) {
    this.safetyChecker = safetyChecker;
    this.logger = logger;
    this.onStateChange = onStateChange;
    this.onApproval = onApproval;
  }

  public getConfig(): ExtensionConfig {
    const aiConfig = vscode.workspace.getConfiguration('aiIdeAutoApprove');
    const kiroConfig = vscode.workspace.getConfiguration('kiroAutoApprove');

    const getVal = <T>(key: string, defVal: T): T => {
      if (typeof aiConfig.inspect === 'function') {
        const inspectAi = aiConfig.inspect<T>(key);
        if (
          inspectAi &&
          (inspectAi.globalValue !== undefined ||
            inspectAi.workspaceValue !== undefined ||
            inspectAi.workspaceFolderValue !== undefined)
        ) {
          return aiConfig.get<T>(key, defVal);
        }
      }
      return kiroConfig.get<T>(key, aiConfig.get<T>(key, defVal));
    };

    const approveCmd = getVal<string>('approveCommandId', DEFAULT_APPROVE_COMMAND).trim();

    return {
      enabled: getVal<boolean>('enabled', false),
      safetyEnabled: getVal<boolean>('safetyEnabled', false),
      pollIntervalSeconds: Math.max(1, getVal<number>('pollIntervalSeconds', 2)),
      bannedKeywords: getVal<string[]>('bannedKeywords', []),
      getPendingCommandId: getVal<string>('getPendingCommandId', '').trim(),
      approveCommandId: approveCmd || DEFAULT_APPROVE_COMMAND,
      maxHistoryEntries: getVal<number>('maxHistoryEntries', 200),
      enableKiro: getVal<boolean>('enableKiro', true),
      enableAntigravity: getVal<boolean>('enableAntigravity', true),
      antigravityApproveCommands: getVal<string[]>(
        'antigravityApproveCommands',
        DEFAULT_ANTIGRAVITY_COMMANDS
      )
    };
  }

  private lastStartedConfigKey: string = '';

  public start(): void {
    const config = this.getConfig();

    if (!config.enabled) {
      this.stop();
      return;
    }

    const currentKey = `${config.pollIntervalSeconds}:${config.safetyEnabled}:${config.approveCommandId}:${config.getPendingCommandId}:${config.enableKiro}:${config.enableAntigravity}`;
    if (this.isRunning && this.timer && this.lastStartedConfigKey === currentKey) {
      return;
    }

    this.stop();
    this.isRunning = true;
    this.lastStartedConfigKey = currentKey;

    const modeDesc = config.safetyEnabled ? 'Safety Check ON' : 'ALL APPROVED (No Restrictions / Full Autonomy)';
    const targets = [
      config.enableKiro ? 'Kiro IDE' : null,
      config.enableAntigravity ? 'Google Antigravity' : null
    ].filter(Boolean).join(' & ') || 'Universal';

    if (config.enableAntigravity) {
      try {
        const syncResult = AntigravityStateManager.ensureGlobalPermissions();
        if (syncResult.success) {
          if (syncResult.addedCount > 0) {
            this.logger.info(
              `Antigravity IDE: Injected ${syncResult.addedCount} autonomous permissions into state.vscdb (Total: ${syncResult.totalCount}).`
            );
          } else {
            this.logger.info(
              `Antigravity IDE: Autonomous permissions verified in state.vscdb (${syncResult.totalCount} active).`
            );
          }
        }
      } catch (err) {
        this.logger.warn(`Could not sync Antigravity IDE permissions: ${String(err)}`);
      }
    }

    this.logger.info(
      `Starting AI IDE Auto-Approve loop (Interval: ${config.pollIntervalSeconds}s | Mode: ${modeDesc} | Targets: ${targets})`
    );
    this.onStateChange(true, config.safetyEnabled, this.logger.getStats());

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

  public resetActivityState(): void {
    this.skippedIds.clear();
    this.processedActionIds.clear();
    this.seenActionIds.clear();
    // Reset file offsets so next session starts fresh from current EOF
    this.antigravityFileOffset = 0;
    this.kiroFileOffset = 0;
    this.antigravityTrackedFile = null;
    this.kiroTrackedFile = null;
    this.logger.resetActivity();
    this.onStateChange(this.isRunning, this.getConfig().safetyEnabled, this.logger.getStats());
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.isPolling = false;
    // Clear tracking state (resets activity to 0)
    this.skippedIds.clear();
    this.processedActionIds.clear();
    this.seenActionIds.clear();
    this.antigravityFileOffset = 0;
    this.kiroFileOffset = 0;
    this.antigravityTrackedFile = null;
    this.kiroTrackedFile = null;
    this.logger.resetActivity();
    this.onStateChange(false, this.getConfig().safetyEnabled, this.logger.getStats());
  }

  public async toggle(): Promise<boolean> {
    const config = this.getConfig();
    const targetState = !config.enabled;

    await vscode.workspace
      .getConfiguration('aiIdeAutoApprove')
      .update('enabled', targetState, vscode.ConfigurationTarget.Global);
    try {
      await vscode.workspace
        .getConfiguration('kiroAutoApprove')
        .update('enabled', targetState, vscode.ConfigurationTarget.Global);
    } catch {}

    if (targetState) {
      // Turning ON: reset all state to 0 first, then start fresh
      this.resetActivityState();
      this.start();
      const modeText = config.safetyEnabled ? 'with Safety Checks' : 'ALL APPROVED (No Restrictions)';
      vscode.window.showInformationMessage(`AI IDE Auto-Approve: ENABLED (${modeText})`);
      this.logger.info(`AI IDE Auto-Approve toggled ON by user (${modeText}). Activity reset to 0.`);
    } else {
      // Turning OFF: stop() already resets everything and broadcasts 0 to status bar
      this.stop();
      vscode.window.showInformationMessage('AI IDE Auto-Approve: PAUSED / OFF');
      this.logger.info('AI IDE Auto-Approve toggled OFF by user. Activity reset to 0.');
    }

    return targetState;
  }

  public async toggleSafety(): Promise<boolean> {
    const config = this.getConfig();
    const targetSafety = !config.safetyEnabled;

    await vscode.workspace
      .getConfiguration('aiIdeAutoApprove')
      .update('safetyEnabled', targetSafety, vscode.ConfigurationTarget.Global);
    try {
      await vscode.workspace
        .getConfiguration('kiroAutoApprove')
        .update('safetyEnabled', targetSafety, vscode.ConfigurationTarget.Global);
    } catch {}

    this.onStateChange(config.enabled, targetSafety, this.logger.getStats());

    const desc = targetSafety ? 'Safety Check ENABLED' : 'Safety Check DISABLED (ALL APPROVED)';
    vscode.window.showInformationMessage(`AI IDE Auto-Approve: ${desc}`);
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

      // Mode A: Explicit command configured for fetching pending items
      if (config.getPendingCommandId) {
        const approveCmd = config.approveCommandId || DEFAULT_APPROVE_COMMAND;
        await this.pollWithCustomCommand(config.getPendingCommandId, approveCmd, config.safetyEnabled);
      } else {
        // Mode B: Native Multi-IDE monitoring
        // 1. Kiro IDE native session & execution monitoring
        if (config.enableKiro) {
          const kiroCmd = config.approveCommandId || DEFAULT_APPROVE_COMMAND;
          await this.pollKiroNative(kiroCmd, config.safetyEnabled);
        }

        // 2. Google Antigravity IDE native transcript & commands monitoring
        if (config.enableAntigravity) {
          await this.pollAntigravityNative(config.antigravityApproveCommands, config.safetyEnabled);
        }
      }

      this.onStateChange(config.enabled, config.safetyEnabled, this.logger.getStats());
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
      this.logger.error(`Command "${getPendingCommandId}" failed or does not exist.`, cmdError);
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
            if (this.skippedIds.size > 500) {
              const firstKey = this.skippedIds.values().next().value;
              if (firstKey) {
                this.skippedIds.delete(firstKey);
              }
            }
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
    // 1. Inspect NEW Kiro tool actions since last poll (offset-based, not full re-read)
    const newActions = this.getNewKiroActions();

    let anyUnsafe = false;

    for (const action of newActions) {
      const actionId = action.id;

      // seenActionIds is permanent within an ON session — prevents double-counting
      if (this.seenActionIds.has(actionId)) {
        if (safetyEnabled && this.skippedIds.has(actionId)) {
          anyUnsafe = true;
        }
        continue;
      }

      this.seenActionIds.add(actionId);
      this.processedActionIds.add(actionId);

      // Bound rolling cache (processedActionIds) to prevent unbounded memory growth
      if (this.processedActionIds.size > 1000) {
        const firstKey = this.processedActionIds.values().next().value;
        if (firstKey) {
          this.processedActionIds.delete(firstKey);
        }
      }

      if (safetyEnabled) {
        const safetyCheck = this.safetyChecker.check(action.text, true);

        if (!safetyCheck.safe) {
          this.skippedIds.add(actionId);
          this.logger.recordDecision(
            'SKIPPED',
            action.text,
            `Banned pattern matched: ${safetyCheck.matchedPattern}`,
            action.raw
          );
          anyUnsafe = true;
        } else {
          this.logger.recordDecision('APPROVED', action.text, 'Passed safety check', action.raw);
          this.onApproval?.(); // ✨ Trigger approval flash animation
        }
      } else {
        this.logger.recordDecision('APPROVED', action.text, 'All Approved (No Restrictions)', action.raw);
        this.onApproval?.(); // ✨ Trigger approval flash animation
      }
    }

    // If ANY unseen unsafe action is blocking, do not fire approval
    if (anyUnsafe) {
      return;
    }

    // 2. Trigger Kiro approve/accept execution command
    try {
      await vscode.commands.executeCommand(approveCommandId);
    } catch {
      // Expected if no pending confirmation exists
    }
  }

  /**
   * Evaluates recent Antigravity IDE tool calls and triggers native approval commands.
   */
  private async pollAntigravityNative(
    antigravityCommands: string[],
    safetyEnabled: boolean
  ): Promise<void> {
    // Only read NEW lines appended since the last poll (offset-based approach)
    const newActions = this.getNewAntigravityActions();

    let anyUnsafe = false;

    for (const action of newActions) {
      const actionId = action.id;

      // seenActionIds is permanent within an ON session — prevents double-counting
      if (this.seenActionIds.has(actionId)) {
        if (safetyEnabled && this.skippedIds.has(actionId)) {
          anyUnsafe = true;
        }
        continue;
      }

      this.seenActionIds.add(actionId);
      this.processedActionIds.add(actionId);

      // Bound rolling cache (processedActionIds) to prevent unbounded memory growth
      if (this.processedActionIds.size > 1000) {
        const firstKey = this.processedActionIds.values().next().value;
        if (firstKey) {
          this.processedActionIds.delete(firstKey);
        }
      }

      if (safetyEnabled) {
        const safetyCheck = this.safetyChecker.check(action.text, true);

        if (!safetyCheck.safe) {
          this.skippedIds.add(actionId);
          this.logger.recordDecision(
            'SKIPPED',
            action.text,
            `Banned pattern matched (Antigravity): ${safetyCheck.matchedPattern}`,
            action.raw
          );
          anyUnsafe = true;
        } else {
          this.logger.recordDecision(
            'APPROVED',
            action.text,
            'Passed safety check (Antigravity)',
            action.raw
          );
          this.onApproval?.(); // ✨ Trigger approval flash animation
        }
      } else {
        this.logger.recordDecision(
          'APPROVED',
          action.text,
          'All Approved (Antigravity Full Autonomy)',
          action.raw
        );
        this.onApproval?.(); // ✨ Trigger approval flash animation
      }
    }

    if (anyUnsafe) {
      return;
    }

    // Ensure persistent global permissions in Antigravity's Unified State Sync
    try {
      AntigravityStateManager.ensureGlobalPermissions();
    } catch {}

    // Trigger Antigravity approval commands
    const cmds =
      Array.isArray(antigravityCommands) && antigravityCommands.length > 0
        ? antigravityCommands
        : DEFAULT_ANTIGRAVITY_COMMANDS;

    for (const cmd of cmds) {
      try {
        await vscode.commands.executeCommand(cmd);
      } catch {
        // Ignored if not waiting or not registered
      }
    }
  }

  /**
   * Resolves the active Antigravity brain sessions root directory cross-platform.
   */
  private getAntigravitySessionsRoot(): string | null {
    const candidateDirs = [
      // Linux / macOS (standard)
      path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain'),
      // macOS (Application Support)
      path.join(os.homedir(), 'Library', 'Application Support', 'antigravity-ide', 'brain'),
      // Linux (XDG_CONFIG_HOME)
      process.env.XDG_CONFIG_HOME ? path.join(process.env.XDG_CONFIG_HOME, 'antigravity-ide', 'brain') : null,
      // Windows (APPDATA)
      process.env.APPDATA ? path.join(process.env.APPDATA, 'antigravity-ide', 'brain') : null,
      // Windows (LOCALAPPDATA)
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'antigravity-ide', 'brain') : null
    ].filter((dir): dir is string => dir !== null && fs.existsSync(dir));

    return candidateDirs.length > 0 ? candidateDirs[0] : null;
  }

  /**
   * Locates the active Antigravity session transcript.jsonl with smart caching.
   */
  private findActiveAntigravityTranscript(): string | null {
    const now = Date.now();

    if (this.cachedAntigravityFile && now - this.cachedAntigravityLastScan < CACHE_VALIDITY_MS) {
      try {
        if (fs.existsSync(this.cachedAntigravityFile)) {
          return this.cachedAntigravityFile;
        }
      } catch {
        this.cachedAntigravityFile = null;
      }
    }

    const brainRoot = this.getAntigravitySessionsRoot();
    if (!brainRoot) {
      return null;
    }

    try {
      let latestFile: string | null = null;
      let latestMtime = 0;

      const convDirs = fs.readdirSync(brainRoot);
      for (const conv of convDirs) {
        const tFile = path.join(brainRoot, conv, '.system_generated', 'logs', 'transcript.jsonl');
        try {
          if (fs.existsSync(tFile)) {
            const mtime = fs.statSync(tFile).mtimeMs;
            if (mtime > latestMtime) {
              latestMtime = mtime;
              latestFile = tFile;
            }
          }
        } catch {}
      }

      if (latestFile) {
        this.cachedAntigravityFile = latestFile;
        this.cachedAntigravityLastScan = now;
      }

      return latestFile;
    } catch (err) {
      this.logger.warn(`Could not inspect Antigravity transcripts: ${String(err)}`);
      return null;
    }
  }

  /**
   * Reads ONLY NEW tool actions from the active Antigravity session (offset-based).
   * When the engine starts or file changes, we snapshot the current EOF so we only
   * process lines that were genuinely appended AFTER the engine was enabled.
   */
  private getNewAntigravityActions(): ToolActionItem[] {
    const activeFile = this.findActiveAntigravityTranscript();
    if (!activeFile) {
      return [];
    }

    let fd: number | null = null;
    try {
      const stat = fs.statSync(activeFile);
      const fileSize = stat.size;

      // If this is a new/different file, record its current EOF as our starting offset.
      // This prevents old completed actions from being counted when the engine turns on.
      if (this.antigravityTrackedFile !== activeFile) {
        this.antigravityTrackedFile = activeFile;
        this.antigravityFileOffset = fileSize; // Start reading only NEW content
        return [];
      }

      // Nothing new appended since last check
      if (fileSize <= this.antigravityFileOffset) {
        return [];
      }

      const readSize = Math.min(fileSize - this.antigravityFileOffset, 131072); // max 128 KB of new content
      fd = fs.openSync(activeFile, 'r');
      const buffer = Buffer.alloc(readSize);
      const bytesRead = fs.readSync(fd, buffer, 0, readSize, this.antigravityFileOffset);

      // Advance the offset by the bytes we successfully read
      this.antigravityFileOffset += bytesRead;

      const actions: ToolActionItem[] = [];
      const lines = buffer.slice(0, bytesRead).toString('utf-8').split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        try {
          const data = JSON.parse(trimmed);
          if (Array.isArray(data.tool_calls) && data.tool_calls.length > 0) {
            for (let idx = 0; idx < data.tool_calls.length; idx++) {
              const tc = data.tool_calls[idx];
              const tcName = String(tc.name || 'tool');
              const displayText = SafetyChecker.extractText(tc);
              const actionId = `agy-${data.step_index ?? data.created_at ?? 'step'}-${tcName}-${idx}`;
              actions.push({
                id: actionId,
                text: displayText,
                raw: tc,
                status: data.status || 'pending',
                source: 'antigravity'
              });
            }
          }
        } catch {}
      }

      return actions;
    } catch (err) {
      this.cachedAntigravityFile = null;
      this.antigravityTrackedFile = null;
      this.antigravityFileOffset = 0;
      this.logger.warn(`Error reading Antigravity transcript: ${String(err)}`);
      return [];
    } finally {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {}
      }
    }
  }

  /**
   * Resolves the active Kiro sessions root directory cross-platform.
   */
  private getSessionsRoot(): string | null {
    const candidateDirs = [
      // Linux / macOS (standard)
      path.join(os.homedir(), '.kiro', 'sessions'),
      // macOS (Application Support)
      path.join(os.homedir(), 'Library', 'Application Support', 'Kiro', 'sessions'),
      // Linux (XDG_CONFIG_HOME)
      process.env.XDG_CONFIG_HOME ? path.join(process.env.XDG_CONFIG_HOME, 'Kiro', 'sessions') : null,
      // Windows (APPDATA)
      process.env.APPDATA ? path.join(process.env.APPDATA, 'Kiro', 'sessions') : null,
      // Windows (LOCALAPPDATA)
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs', 'Kiro', 'sessions') : null
    ].filter((dir): dir is string => dir !== null && fs.existsSync(dir));

    return candidateDirs.length > 0 ? candidateDirs[0] : null;
  }

  /**
   * Locates the active session's messages.jsonl file with smart caching.
   */
  private findActiveSessionFile(): string | null {
    const now = Date.now();

    // Check if cached session is still active and recently modified
    if (this.cachedSessionFile && now - this.cachedSessionLastScan < CACHE_VALIDITY_MS) {
      try {
        if (fs.existsSync(this.cachedSessionFile)) {
          return this.cachedSessionFile;
        }
      } catch {
        this.cachedSessionFile = null;
      }
    }

    const sessionsRoot = this.getSessionsRoot();
    if (!sessionsRoot) {
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

      if (latestMsgFile) {
        this.cachedSessionFile = latestMsgFile;
        this.cachedSessionLastScan = now;
      }

      return latestMsgFile;
    } catch (err) {
      this.logger.warn(`Could not inspect Kiro sessions directory: ${String(err)}`);
      return null;
    }
  }

  /**
   * Reads ONLY NEW tool actions from the active Kiro session (offset-based).
   * When the engine starts or file changes, we snapshot the current EOF so we only
   * process lines that were genuinely appended AFTER the engine was enabled.
   */
  private getNewKiroActions(): ToolActionItem[] {
    const activeFile = this.findActiveSessionFile();
    if (!activeFile) {
      return [];
    }

    let fd: number | null = null;
    try {
      const stat = fs.statSync(activeFile);
      const fileSize = stat.size;

      // If this is a new/different file, record its current EOF as our starting offset.
      // This prevents old completed actions from being counted when the engine turns on.
      if (this.kiroTrackedFile !== activeFile) {
        this.kiroTrackedFile = activeFile;
        this.kiroFileOffset = fileSize; // Start reading only NEW content
        return [];
      }

      // Nothing new appended since last check
      if (fileSize <= this.kiroFileOffset) {
        return [];
      }

      const readSize = Math.min(fileSize - this.kiroFileOffset, 131072); // max 128 KB of new content
      fd = fs.openSync(activeFile, 'r');
      const buffer = Buffer.alloc(readSize);
      const bytesRead = fs.readSync(fd, buffer, 0, readSize, this.kiroFileOffset);

      // Advance the offset by the bytes we successfully read
      this.kiroFileOffset += bytesRead;

      const actions: ToolActionItem[] = [];
      const lines = buffer.slice(0, bytesRead).toString('utf-8').split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        try {
          const data = JSON.parse(trimmed);
          if (data.payload && data.payload.type === 'tool_call') {
            const displayText = SafetyChecker.extractText(data.payload);
            actions.push({
              id: data.id || data.payload.toolCallId || String(data.timestamp),
              text: displayText,
              raw: data.payload,
              status: String(data.payload.status || 'pending'),
              source: 'kiro'
            });
          }
        } catch {}
      }

      return actions;
    } catch (err) {
      this.cachedSessionFile = null;
      this.kiroTrackedFile = null;
      this.kiroFileOffset = 0;
      this.logger.warn(`Error reading Kiro session messages: ${String(err)}`);
      return [];
    } finally {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {}
      }
    }
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
