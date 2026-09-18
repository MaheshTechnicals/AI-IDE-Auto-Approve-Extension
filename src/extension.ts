import * as vscode from 'vscode';
import { SafetyChecker, DEFAULT_BANNED_PATTERNS } from './safety';
import { OutputLogger } from './logger';
import { StatusBarController } from './statusBar';
import { AutoApproveEngine } from './engine';
import { discoverEditorCommands } from './discovery';
import { startAutoUpdater, checkForUpdate } from './updater';

let engine: AutoApproveEngine | null = null;
let logger: OutputLogger | null = null;
let statusBar: StatusBarController | null = null;

export function activate(context: vscode.ExtensionContext): void {
  const aiConfig = vscode.workspace.getConfiguration('aiIdeAutoApprove');
  const kiroConfig = vscode.workspace.getConfiguration('kiroAutoApprove');

  const bannedKeywords = aiConfig.get<string[]>(
    'bannedKeywords',
    kiroConfig.get<string[]>('bannedKeywords', DEFAULT_BANNED_PATTERNS)
  );
  const maxHistory = aiConfig.get<number>(
    'maxHistoryEntries',
    kiroConfig.get<number>('maxHistoryEntries', 200)
  );

  // Initialize Logger
  logger = new OutputLogger('AI IDE Auto-Approve', maxHistory);
  context.subscriptions.push({ dispose: () => logger?.dispose() });

  logger.info('AI IDE Auto-Approve extension activated.');

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
  const engineConfig = engine.getConfig();
  if (engineConfig.enabled) {
    engine.start();
  } else {
    statusBar.update(false, engineConfig.safetyEnabled, logger.getStats());
  }

  // Initialize Auto-Updater (checks GitHub Releases for new versions)
  startAutoUpdater(context, logger);

  // Helper to register dual commands (primary aiIdeAutoApprove + backward-compatible kiroAutoApprove)
  const registerDualCommand = (
    primaryId: string,
    legacyId: string,
    callback: (...args: any[]) => any
  ) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(primaryId, callback),
      vscode.commands.registerCommand(legacyId, callback)
    );
  };

  // 1. Toggle Command
  registerDualCommand('aiIdeAutoApprove.toggle', 'kiroAutoApprove.toggle', async () => {
    if (engine) {
      await engine.toggle();
    }
  });

  // 2. Toggle Safety Command
  registerDualCommand(
    'aiIdeAutoApprove.toggleSafety',
    'kiroAutoApprove.toggleSafety',
    async () => {
      if (engine) {
        await engine.toggleSafety();
      }
    }
  );

  // 3. Show History Command
  const showHistoryHandler = async () => {
    if (!logger) {
      return;
    }
    const history = logger.getHistory();

    if (history.length === 0) {
      vscode.window.showInformationMessage('AI IDE Auto-Approve: Activity history is empty.');
      return;
    }

    interface HistoryQuickPickItem extends vscode.QuickPickItem {
      rawEntry: (typeof history)[0];
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
        vscode.window.showInformationMessage(
          'AI IDE Auto-Approve: Action content copied to clipboard.'
        );
      } else if (action === 'Open Full Logs') {
        logger.show();
      }
    }
  };
  registerDualCommand(
    'aiIdeAutoApprove.showHistory',
    'kiroAutoApprove.showHistory',
    showHistoryHandler
  );

  // 4. Clear History Command
  const clearHistoryHandler = () => {
    logger?.clearHistory();
    const curCfg = engine ? engine.getConfig() : { enabled: false, safetyEnabled: false };
    statusBar?.update(curCfg.enabled, curCfg.safetyEnabled, logger?.getStats());
    vscode.window.showInformationMessage('AI IDE Auto-Approve: Activity history cleared.');
  };
  registerDualCommand(
    'aiIdeAutoApprove.clearHistory',
    'kiroAutoApprove.clearHistory',
    clearHistoryHandler
  );

  // 5. Add Banned Keyword Command
  const addBannedKeywordHandler = async () => {
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
      const currentConfig = engine
        ? engine.getConfig()
        : { bannedKeywords: DEFAULT_BANNED_PATTERNS };
      const currentKeywords = currentConfig.bannedKeywords;

      if (currentKeywords.includes(trimmed)) {
        vscode.window.showInformationMessage(
          `Pattern "${trimmed}" is already in the banned list.`
        );
        return;
      }

      const updated = [...currentKeywords, trimmed];
      await vscode.workspace
        .getConfiguration('aiIdeAutoApprove')
        .update('bannedKeywords', updated, vscode.ConfigurationTarget.Global);
      try {
        await vscode.workspace
          .getConfiguration('kiroAutoApprove')
          .update('bannedKeywords', updated, vscode.ConfigurationTarget.Global);
      } catch {}

      safetyChecker.updatePatterns(updated);
      logger?.info(`Added new banned pattern: "${trimmed}"`);
      vscode.window.showInformationMessage(`Added "${trimmed}" to banned safety keywords.`);
    }
  };
  registerDualCommand(
    'aiIdeAutoApprove.addBannedKeyword',
    'kiroAutoApprove.addBannedKeyword',
    addBannedKeywordHandler
  );

  // 6. Discover Editor Commands
  const discoverCommandsHandler = async () => {
    if (logger) {
      await discoverEditorCommands(logger);
    }
  };
  registerDualCommand(
    'aiIdeAutoApprove.dumpAvailableCommands',
    'kiroAutoApprove.dumpAvailableCommands',
    discoverCommandsHandler
  );

  // 7. Show Output Logs Command
  const openOutputHandler = () => {
    logger?.show();
  };
  registerDualCommand(
    'aiIdeAutoApprove.openOutput',
    'kiroAutoApprove.openOutput',
    openOutputHandler
  );

  // 8. Check for Updates Command
  registerDualCommand(
    'aiIdeAutoApprove.checkForUpdates',
    'kiroAutoApprove.checkForUpdates',
    async () => {
      await checkForUpdate(logger ?? undefined, true);
    }
  );

  // Listen to configuration changes (both namespaces)
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      const affectsAi = e.affectsConfiguration('aiIdeAutoApprove');
      const affectsKiro = e.affectsConfiguration('kiroAutoApprove');

      if (!affectsAi && !affectsKiro) {
        return;
      }

      if (
        e.affectsConfiguration('aiIdeAutoApprove.bannedKeywords') ||
        e.affectsConfiguration('kiroAutoApprove.bannedKeywords')
      ) {
        const updatedPatterns = engine
          ? engine.getConfig().bannedKeywords
          : DEFAULT_BANNED_PATTERNS;
        safetyChecker.updatePatterns(updatedPatterns);
        logger?.info(`Updated banned keyword patterns (${updatedPatterns.length} rules active).`);
      }

      if (
        e.affectsConfiguration('aiIdeAutoApprove.maxHistoryEntries') ||
        e.affectsConfiguration('kiroAutoApprove.maxHistoryEntries')
      ) {
        const maxEntries = engine ? engine.getConfig().maxHistoryEntries : 200;
        logger?.setMaxHistoryEntries(maxEntries);
      }

      if (
        e.affectsConfiguration('aiIdeAutoApprove.enabled') ||
        e.affectsConfiguration('kiroAutoApprove.enabled') ||
        e.affectsConfiguration('aiIdeAutoApprove.safetyEnabled') ||
        e.affectsConfiguration('kiroAutoApprove.safetyEnabled') ||
        e.affectsConfiguration('aiIdeAutoApprove.pollIntervalSeconds') ||
        e.affectsConfiguration('kiroAutoApprove.pollIntervalSeconds') ||
        e.affectsConfiguration('aiIdeAutoApprove.getPendingCommandId') ||
        e.affectsConfiguration('kiroAutoApprove.getPendingCommandId') ||
        e.affectsConfiguration('aiIdeAutoApprove.approveCommandId') ||
        e.affectsConfiguration('kiroAutoApprove.approveCommandId') ||
        e.affectsConfiguration('aiIdeAutoApprove.enableKiro') ||
        e.affectsConfiguration('kiroAutoApprove.enableKiro') ||
        e.affectsConfiguration('aiIdeAutoApprove.enableAntigravity') ||
        e.affectsConfiguration('kiroAutoApprove.enableAntigravity') ||
        e.affectsConfiguration('aiIdeAutoApprove.antigravityApproveCommands') ||
        e.affectsConfiguration('kiroAutoApprove.antigravityApproveCommands')
      ) {
        const currentCfg = engine ? engine.getConfig() : { enabled: false, safetyEnabled: false };
        statusBar?.update(currentCfg.enabled, currentCfg.safetyEnabled, logger?.getStats());
        if (currentCfg.enabled) {
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
