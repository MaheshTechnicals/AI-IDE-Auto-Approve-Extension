import * as vscode from 'vscode';
import { OutputLogger } from './logger';

export async function discoverEditorCommands(logger: OutputLogger): Promise<void> {
  logger.show(true);
  logger.info('====================================================');
  logger.info('   AI IDE AUTO-APPROVE: DISCOVERY MODE');
  logger.info('====================================================');

  try {
    // 1. Fetch all registered commands in editor
    const allCommands = await vscode.commands.getCommands(true);

    const kiroCommands = allCommands
      .filter((cmd) => cmd.toLowerCase().includes('kiro'))
      .sort();

    const antigravityCommands = allCommands
      .filter((cmd) => cmd.toLowerCase().includes('antigravity'))
      .sort();

    const candidateCommands = allCommands
      .filter((cmd) => {
        const lower = cmd.toLowerCase();
        return (
          !lower.includes('kiro') &&
          !lower.includes('antigravity') &&
          (lower.includes('approve') ||
            lower.includes('accept') ||
            lower.includes('pending') ||
            lower.includes('execution') ||
            lower.includes('agent') ||
            lower.includes('terminal'))
        );
      })
      .sort();

    logger.info(`Found ${allCommands.length} total registered commands in the host editor.`);
    logger.info(`Found ${kiroCommands.length} command(s) matching "kiro":`);
    if (kiroCommands.length > 0) {
      kiroCommands.forEach((cmd, idx) => {
        logger.info(`  [Kiro ${idx + 1}] ${cmd}`);
      });
    }

    logger.info(`Found ${antigravityCommands.length} command(s) matching "antigravity":`);
    if (antigravityCommands.length > 0) {
      antigravityCommands.forEach((cmd, idx) => {
        logger.info(`  [Antigravity ${idx + 1}] ${cmd}`);
      });
    }

    if (kiroCommands.length === 0 && antigravityCommands.length === 0) {
      logger.warn('  No command IDs containing "kiro" or "antigravity" were found.');
      logger.info('  Listing other candidate agent/approval commands found in the editor:');
      candidateCommands.slice(0, 50).forEach((cmd, idx) => {
        logger.info(`  [${idx + 1}] ${cmd}`);
      });
      if (candidateCommands.length > 50) {
        logger.info(`  ... and ${candidateCommands.length - 50} more candidates.`);
      }
    }

    // 2. Inspect extensions for programmatic exports
    logger.info('----------------------------------------------------');
    logger.info('Inspecting extension exports for Kiro and Antigravity:');

    const targetExtensions = vscode.extensions.all.filter((ext) => {
      const id = ext.id.toLowerCase();
      return id.includes('kiro') || id.includes('antigravity') || id.includes('agent');
    });

    if (targetExtensions.length === 0) {
      logger.info('No extensions found with "kiro", "antigravity", or "agent" in their ID.');
    } else {
      for (const ext of targetExtensions) {
        logger.info(`Found extension: ${ext.id} (active: ${ext.isActive}, version: ${ext.packageJSON?.version || 'unknown'})`);
        try {
          if (!ext.isActive) {
            logger.info(`  Attempting to activate ${ext.id}...`);
            await ext.activate();
          }

          const exports = ext.exports;
          if (exports && typeof exports === 'object') {
            const keys = Object.keys(exports);
            logger.info(`  Top-level export keys (${keys.length}):`);
            for (const key of keys) {
              const val = (exports as Record<string, unknown>)[key];
              const valType = typeof val;
              logger.info(`    - ${key}: [${valType}]`);
            }
          } else if (exports !== undefined) {
            logger.info(`  Exports value: ${String(exports)}`);
          } else {
            logger.info('  Extension exports are undefined.');
          }
        } catch (extErr) {
          logger.warn(`  Could not inspect exports for ${ext.id}: ${String(extErr)}`);
        }
      }
    }

    logger.info('====================================================');
    logger.info('Discovery complete! Review the commands above.');
    logger.info('Next steps:');
    logger.info('1. Identify the command ID to retrieve pending actions (e.g. "kiro.agent.getPendingExecutions")');
    logger.info('2. Identify the command ID to approve an action (e.g. "kiro.agent.approveExecution")');
    logger.info('3. Set "kiroAutoApprove.getPendingCommandId" and "kiroAutoApprove.approveCommandId" in Settings.');
    logger.info('4. Toggle Auto-Approve ON via the status bar.');
    logger.info('====================================================');

    const choice = await vscode.window.showInformationMessage(
      `Discovery finished! Found ${kiroCommands.length} Kiro command(s). Check the Output channel.`,
      'Open Settings',
      'Close'
    );

    if (choice === 'Open Settings') {
      vscode.commands.executeCommand('workbench.action.openSettings', 'kiroAutoApprove');
    }
  } catch (err) {
    logger.error('Error occurred during Discovery Mode', err);
    vscode.window.showErrorMessage(`Discovery Mode failed: ${String(err)}`);
  }
}

export const discoverKiroCommands = discoverEditorCommands;
