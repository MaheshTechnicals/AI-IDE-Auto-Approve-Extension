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

  it('should provide default configurations', () => {
    const config = engine.getConfig();
    assert.strictEqual(typeof config.enabled, 'boolean');
    assert.strictEqual(typeof config.safetyEnabled, 'boolean');
    assert.ok(config.pollIntervalSeconds >= 1);
    assert.strictEqual(config.approveCommandId, 'kiroAgent.execution.runOrAcceptAll');
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
});
