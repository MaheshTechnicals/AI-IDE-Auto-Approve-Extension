import * as assert from 'assert';
import { OutputLogger } from '../src/logger';

// Mock vscode module if running in pure node environment
describe('OutputLogger Unit Tests', () => {
  let logger: OutputLogger;

  beforeEach(() => {
    logger = new OutputLogger('Test Channel', 5);
  });

  afterEach(() => {
    logger.dispose();
  });

  it('should record decisions and maintain history up to max entries', () => {
    for (let i = 1; i <= 10; i++) {
      logger.recordDecision('APPROVED', `action ${i}`, 'Test reason');
    }

    const history = logger.getHistory();
    // Max entries is 5
    assert.strictEqual(history.length, 5, 'History must be capped at maxEntries');
    // History should be in reverse chronological order (newest first)
    assert.strictEqual(history[0].text, 'action 10');
    assert.strictEqual(history[4].text, 'action 6');
  });

  it('should dynamically update max history entries', () => {
    for (let i = 1; i <= 20; i++) {
      logger.recordDecision('APPROVED', `action ${i}`);
    }

    logger.setMaxHistoryEntries(15);
    // Add more entries
    for (let i = 21; i <= 30; i++) {
      logger.recordDecision('APPROVED', `action ${i}`);
    }

    const history = logger.getHistory();
    assert.strictEqual(history.length, 15);
    assert.strictEqual(history[0].text, 'action 30');
  });

  it('should clear history cleanly', () => {
    logger.recordDecision('APPROVED', 'action 1');
    logger.recordDecision('SKIPPED', 'action 2');
    assert.strictEqual(logger.getHistory().length, 2);

    logger.clearHistory();
    assert.strictEqual(logger.getHistory().length, 0);
  });

  it('should handle different status types properly', () => {
    logger.recordDecision('APPROVED', 'git status');
    logger.recordDecision('SKIPPED', 'rm -rf /', 'dangerous');
    logger.recordDecision('ERROR', 'failed command', 'syntax error');

    const history = logger.getHistory();
    assert.strictEqual(history[0].status, 'ERROR');
    assert.strictEqual(history[1].status, 'SKIPPED');
    assert.strictEqual(history[2].status, 'APPROVED');
  });

  it('should accurately track statistics and reset on clear', () => {
    assert.deepStrictEqual(logger.getStats(), { approved: 0, skipped: 0, errors: 0, total: 0 });

    logger.recordDecision('APPROVED', 'git push');
    logger.recordDecision('APPROVED', 'git status');
    logger.recordDecision('SKIPPED', 'rm -rf /');
    logger.recordDecision('ERROR', 'bad command');

    const stats = logger.getStats();
    assert.strictEqual(stats.approved, 2);
    assert.strictEqual(stats.skipped, 1);
    assert.strictEqual(stats.errors, 1);
    assert.strictEqual(stats.total, 4);

    logger.clearHistory();
    const resetStats = logger.getStats();
    assert.strictEqual(resetStats.approved, 0);
    assert.strictEqual(resetStats.skipped, 0);
    assert.strictEqual(resetStats.errors, 0);
    assert.strictEqual(resetStats.total, 0);
  });
});
