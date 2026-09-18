import * as assert from 'assert';
import { AutoApproveEngine } from '../src/engine';
import { SafetyChecker } from '../src/safety';
import { OutputLogger } from '../src/logger';

describe('AutoApproveEngine Unit Tests', () => {
  let safety: SafetyChecker;
  let logger: OutputLogger;
  let engine: AutoApproveEngine;

  beforeEach(() => {
    safety = new SafetyChecker();
    logger = new OutputLogger('Engine Test Channel', 50);
    engine = new AutoApproveEngine(safety, logger, () => {});
  });

  afterEach(() => {
    engine.dispose();
    logger.dispose();
  });

  it('should provide default configurations including Antigravity and Kiro options', () => {
    const config = engine.getConfig();
    assert.strictEqual(typeof config.enabled, 'boolean');
    assert.strictEqual(typeof config.safetyEnabled, 'boolean');
    assert.ok(config.pollIntervalSeconds >= 1);
    assert.strictEqual(config.approveCommandId, 'kiroAgent.execution.runOrAcceptAll');
    assert.strictEqual(config.enableKiro, true);
    assert.strictEqual(config.enableAntigravity, true);
    assert.ok(config.antigravityApproveCommands.includes('antigravity.acceptAgentStep'));
    assert.ok(config.antigravityApproveCommands.includes('antigravity.command.accept'));
    assert.ok(config.antigravityApproveCommands.includes('antigravity.terminalCommand.run'));
    assert.ok(config.antigravityApproveCommands.includes('antigravity.prioritized.agentAcceptAllInFile'));
    assert.ok(config.antigravityApproveCommands.includes('workbench.action.chat.acceptTool'));
  });

  it('should normalize pending items from various shapes', () => {
    const engineAny = engine as unknown as {
      normalizePendingItems: (raw: unknown) => unknown[];
    };

    assert.deepStrictEqual(engineAny.normalizePendingItems(null), []);
    assert.deepStrictEqual(engineAny.normalizePendingItems(undefined), []);
    assert.deepStrictEqual(engineAny.normalizePendingItems(['item1', 'item2']), ['item1', 'item2']);
    assert.deepStrictEqual(engineAny.normalizePendingItems({ items: ['a', 'b'] }), ['a', 'b']);
    assert.deepStrictEqual(engineAny.normalizePendingItems({ executions: ['c'] }), ['c']);
    assert.deepStrictEqual(engineAny.normalizePendingItems({ queue: ['d'] }), ['d']);
    assert.deepStrictEqual(engineAny.normalizePendingItems({ single: 'obj' }), [{ single: 'obj' }]);
  });

  it('should extract correct item identifiers', () => {
    const engineAny = engine as unknown as {
      getItemId: (item: unknown) => string;
    };

    assert.strictEqual(engineAny.getItemId({ id: 'custom-id-123' }), 'custom-id-123');
    assert.strictEqual(engineAny.getItemId({ executionId: 'exec-456' }), 'exec-456');
    assert.strictEqual(engineAny.getItemId({ actionId: 'act-789' }), 'act-789');
    assert.strictEqual(engineAny.getItemId('simple-string-action'), 'simple-string-action');
    assert.strictEqual(engineAny.getItemId(null), '');
  });

  it('should trigger Antigravity native commands on pollAntigravityNative', async () => {
    const vscode = require('vscode');
    vscode.commands.executedCommands = [];

    const engineAny = engine as unknown as {
      pollAntigravityNative: (commands: string[], safetyEnabled: boolean) => Promise<void>;
    };

    await engineAny.pollAntigravityNative(
      ['antigravity.command.accept', 'antigravity.terminalCommand.run'],
      false
    );

    const executed = vscode.commands.executedCommands.map((c: { cmd: string }) => c.cmd);
    assert.ok(executed.includes('antigravity.command.accept'));
    assert.ok(executed.includes('antigravity.terminalCommand.run'));
  });

  it('should block execution if an Antigravity tool action is unsafe and safetyEnabled is true', async () => {
    const vscode = require('vscode');
    vscode.commands.executedCommands = [];

    const engineAny = engine as unknown as {
      getRecentAntigravityActions: () => Array<{ id: string; text: string; raw: unknown; status: string }>;
      pollAntigravityNative: (commands: string[], safetyEnabled: boolean) => Promise<void>;
    };

    // Mock unsafe recent actions
    engineAny.getRecentAntigravityActions = () => [
      {
        id: 'agy-test-1',
        text: 'run_command sudo rm -rf /',
        raw: { name: 'run_command', args: { CommandLine: 'sudo rm -rf /' } },
        status: 'pending'
      }
    ];

    await engineAny.pollAntigravityNative(['antigravity.terminalCommand.run'], true);

    const executed = vscode.commands.executedCommands.map((c: { cmd: string }) => c.cmd);
    assert.strictEqual(executed.includes('antigravity.terminalCommand.run'), false, 'Dangerous action must block execution');
  });

  it('should permit execution if an Antigravity tool action is safe', async () => {
    const vscode = require('vscode');
    vscode.commands.executedCommands = [];

    const engineAny = engine as unknown as {
      getRecentAntigravityActions: () => Array<{ id: string; text: string; raw: unknown; status: string }>;
      pollAntigravityNative: (commands: string[], safetyEnabled: boolean) => Promise<void>;
    };

    engineAny.getRecentAntigravityActions = () => [
      {
        id: 'agy-test-2',
        text: 'run_command npm test',
        raw: { name: 'run_command', args: { CommandLine: 'npm test' } },
        status: 'pending'
      }
    ];

    await engineAny.pollAntigravityNative(['antigravity.terminalCommand.run'], true);

    const executed = vscode.commands.executedCommands.map((c: { cmd: string }) => c.cmd);
    assert.ok(executed.includes('antigravity.terminalCommand.run'));
  });

  it('should reset activity counters and tracked ids to 0 when stopped or toggled', async () => {
    logger.recordDecision('APPROVED', 'test cmd');
    assert.strictEqual(logger.getStats().approved, 1);

    const engineAny = engine as unknown as {
      processedActionIds: Set<string>;
      skippedIds: Set<string>;
    };
    engineAny.processedActionIds.add('action-1');
    engineAny.skippedIds.add('action-2');

    engine.stop();

    assert.strictEqual(logger.getStats().approved, 0);
    assert.strictEqual(logger.getStats().total, 0);
    assert.strictEqual(engineAny.processedActionIds.size, 0);
    assert.strictEqual(engineAny.skippedIds.size, 0);
  });
});
