import * as vscode from 'vscode';
import { SafetyChecker, DEFAULT_BANNED_PATTERNS } from './safety';
import { OutputLogger } from './logger';
import { StatusBarController } from './statusBar';
import { AutoApproveEngine } from './engine';
import { discoverKiroCommands } from './discovery';

let engine: AutoApproveEngine | null = null;
let logger: OutputLogger | null = null;
let statusBar: StatusBarController | null = null;

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration('kiroAutoApprove');
  const bannedKeywords = config.get<string[]>('bannedKeywords', DEFAULT_BANNED_PATTERNS);
  const maxHistory = config.get<number>('maxHistoryEntries', 200);

  // Initialize Logger
  logger = new OutputLogger('Kiro Auto-Approve', maxHistory);
  context.subscriptions.push({ dispose: () => logger?.dispose() });

  logger.info('Kiro Auto-Approve extension activated.');

  // Initialize Safety Checker
  const safetyChecker = new SafetyChecker(bannedKeywords);

  // Initialize Status Bar
  statusBar = new StatusBarController();
  context.subscriptions.push({ dispose: () => statusBar?.dispose() });

  // Initialize Engine
  engine = new AutoApproveEngine(safetyChecker, logger, (enabled, safetyEnabled, stats) => {
    statusBar?.update(enabled, safetyEnabled, stats);
  });
  context.subscriptions.push({ dispose: () => engine?.dispose() });

  // Start engine if configured and enabled
  const isEnabled = config.get<boolean>('enabled', false);
  const safetyEnabled = config.get<boolean>('safetyEnabled', false);
  if (isEnabled) {
    engine.start();
  } else {
    statusBar.update(false, safetyEnabled, logger.getStats());
  }

  // Register Commands
  context.subscriptions.push(
    // 1. Toggle Command
    vscode.commands.registerCommand('kiroAutoApprove.toggle', async () => {
      if (engine) {
        await engine.toggle();
      }
    }),

    // 2. Show History Command
    vscode.commands.registerCommand('kiroAutoApprove.showHistory', async () => {
      if (!logger) {
        return;
      }
      const history = logger.getHistory();

      if (history.length === 0) {
        vscode.window.showInformationMessage('Kiro Auto-Approve: Activity history is empty.');
        return;
      }

      interface HistoryQuickPickItem extends vscode.QuickPickItem {
        rawEntry: typeof history[0];
      }

      const items: HistoryQuickPickItem[] = history.map((entry) => {
        let icon = '$(info)';
        if (entry.status === 'APPROVED') {
          icon = '$(check)';
        } else if (entry.status === 'SKIPPED') {
          icon = '$(shield)';
        } else if (entry.status === 'ERROR') {
          icon = '$(error)';
        }

        const previewText = entry.text.replace(/\s+/g, ' ').slice(0, 100);
        const reasonPart = entry.reason ? ` — ${entry.reason}` : '';

        return {
          label: `${icon} [${entry.status}] ${entry.timestamp}`,
          description: reasonPart,
          detail: previewText,
          rawEntry: entry
        };
      });

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Recent activity (${history.length} entries). Select to inspect details.`,
        matchOnDescription: true,
        matchOnDetail: true
      });

      if (selected) {
        const entry = selected.rawEntry;
        const details = [
          `Timestamp: ${entry.timestamp}`,
          `Status: ${entry.status}`,
          entry.reason ? `Reason: ${entry.reason}` : null,
          `\n--- Content ---\n${entry.text}`
        ]
          .filter(Boolean)
          .join('\n');

        const action = await vscode.window.showInformationMessage(
          `[${entry.status}] ${entry.timestamp}`,
          { modal: true, detail: details },
          'Copy Content',
          'Open Full Logs'
        );

        if (action === 'Copy Content') {
          await vscode.env.clipboard.writeText(entry.text);
          vscode.window.showInformationMessage('Kiro Auto-Approve: Action content copied to clipboard.');
        } else if (action === 'Open Full Logs') {
          logger.show();
        }
      }
    }),

    // 3. Clear History Command
    vscode.commands.registerCommand('kiroAutoApprove.clearHistory', () => {
      logger?.clearHistory();
      const curCfg = vscode.workspace.getConfiguration('kiroAutoApprove');
      statusBar?.update(
        curCfg.get<boolean>('enabled', false),
        curCfg.get<boolean>('safetyEnabled', false),
        logger?.getStats()
      );
      vscode.window.showInformationMessage('Kiro Auto-Approve: Activity history cleared.');
    }),

    // 4. Add Banned Keyword Command
    vscode.commands.registerCommand('kiroAutoApprove.addBannedKeyword', async () => {
      const keyword = await vscode.window.showInputBox({
        prompt: 'Enter a keyword or regex pattern to forbid from auto-approving',
        placeHolder: 'e.g. rm -rf, mkfs, /dev/sd, drop database',
        validateInput: (text) => {
          if (!text || !text.trim()) {
            return 'Pattern cannot be empty.';
          }
          try {
            new RegExp(text.trim());
          } catch (e) {
            return `Invalid regular expression: ${String(e)}`;
          }
          return null;
        }
      });

      if (keyword && keyword.trim()) {
        const trimmed = keyword.trim();
        const currentConfig = vscode.workspace.getConfiguration('kiroAutoApprove');
        const currentKeywords = currentConfig.get<string[]>('bannedKeywords', DEFAULT_BANNED_PATTERNS);

        if (currentKeywords.includes(trimmed)) {
          vscode.window.showInformationMessage(`Pattern "${trimmed}" is already in the banned list.`);
          return;
        }

        const updated = [...currentKeywords, trimmed];
        await currentConfig.update('bannedKeywords', updated, vscode.ConfigurationTarget.Global);
        safetyChecker.updatePatterns(updated);
        logger?.info(`Added new banned pattern: "${trimmed}"`);
        vscode.window.showInformationMessage(`Added "${trimmed}" to banned safety keywords.`);
      }
    }),

    // 5. Discover Kiro Commands Command
    vscode.commands.registerCommand('kiroAutoApprove.dumpAvailableCommands', async () => {
      if (logger) {
        await discoverKiroCommands(logger);
      }
    }),

    // 6. Show Output Logs Command
    vscode.commands.registerCommand('kiroAutoApprove.openOutput', () => {
      logger?.show();
    }),

    // 7. Toggle Safety Command
    vscode.commands.registerCommand('kiroAutoApprove.toggleSafety', async () => {
      if (engine) {
        await engine.toggleSafety();
      }
    })
  );

  // Listen to configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration('kiroAutoApprove')) {
        return;
      }

      const newConfig = vscode.workspace.getConfiguration('kiroAutoApprove');

      if (e.affectsConfiguration('kiroAutoApprove.bannedKeywords')) {
        const updatedPatterns = newConfig.get<string[]>('bannedKeywords', DEFAULT_BANNED_PATTERNS);
        safetyChecker.updatePatterns(updatedPatterns);
        logger?.info(`Updated banned keyword patterns (${updatedPatterns.length} rules active).`);
      }

      if (e.affectsConfiguration('kiroAutoApprove.maxHistoryEntries')) {
        const maxEntries = newConfig.get<number>('maxHistoryEntries', 200);
        logger?.setMaxHistoryEntries(maxEntries);
      }

      if (
        e.affectsConfiguration('kiroAutoApprove.enabled') ||
        e.affectsConfiguration('kiroAutoApprove.safetyEnabled') ||
        e.affectsConfiguration('kiroAutoApprove.pollIntervalSeconds') ||
        e.affectsConfiguration('kiroAutoApprove.getPendingCommandId') ||
        e.affectsConfiguration('kiroAutoApprove.approveCommandId')
      ) {
        const isNowEnabled = newConfig.get<boolean>('enabled', false);
        const isSafety = newConfig.get<boolean>('safetyEnabled', false);
        statusBar?.update(isNowEnabled, isSafety, logger?.getStats());
        if (isNowEnabled) {
          engine?.start();
        } else {
          engine?.stop();
        }
      }
    })
  );
}

export function deactivate(): void {
  if (engine) {
    engine.dispose();
    engine = null;
  }
  if (statusBar) {
    statusBar.dispose();
    statusBar = null;
  }
  if (logger) {
    logger.dispose();
    logger = null;
  }
}
