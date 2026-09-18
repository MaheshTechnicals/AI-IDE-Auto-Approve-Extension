import * as assert from 'assert';
import { AntigravityStateManager, AUTONOMOUS_COMMAND_GRANTS } from '../src/antigravityState';

describe('AntigravityStateManager Unit Tests', () => {
  it('should include all required shells, runtimes, package managers, and core utilities', () => {
    const requiredCommands = [
      'command(bash)',
      'command(sh)',
      'command(zsh)',
      'command(node)',
      'command(npm)',
      'command(npx)',
      'command(pnpm)',
      'command(yarn)',
      'command(bun)',
      'command(python)',
      'command(python3)',
      'command(pip)',
      'command(git)',
      'command(curl)',
      'command(wget)',
      'command(sed)',
      'command(awk)',
      'command(jq)',
      'command(base64)',
      'command(strings)',
      'command(tar)',
      'command(chmod)',
      'command(rm)',
      'command(mv)'
    ];

    for (const cmd of requiredCommands) {
      assert.ok(
        AUTONOMOUS_COMMAND_GRANTS.includes(cmd),
        `AUTONOMOUS_COMMAND_GRANTS must include ${cmd}`
      );
    }
  });

  it('should encode and decode varints correctly', () => {
    const testValues = [0, 1, 127, 128, 255, 300, 16384, 2097151];
    for (const val of testValues) {
      const encoded = AntigravityStateManager.writeVarint(val);
      const decoded = AntigravityStateManager.readVarint(encoded, 0);
      assert.strictEqual(decoded.value, val, `Mismatch for varint value ${val}`);
      assert.strictEqual(decoded.nextOffset, encoded.length);
    }
  });

  it('should encode string fields correctly in protobuf wire format', () => {
    const fieldNum = 1;
    const testString = 'command(node)';
    const encoded = AntigravityStateManager.writeStringField(fieldNum, testString);

    const expectedTag = (fieldNum << 3) | 2;
    const tagResult = AntigravityStateManager.readVarint(encoded, 0);
    assert.strictEqual(tagResult.value, expectedTag);

    const lenResult = AntigravityStateManager.readVarint(encoded, tagResult.nextOffset);
    assert.strictEqual(lenResult.value, Buffer.byteLength(testString));

    const extracted = encoded
      .subarray(lenResult.nextOffset, lenResult.nextOffset + lenResult.value)
      .toString('utf-8');
    assert.strictEqual(extracted, testString);
  });

  it('should inject autonomous grants into mock agentPreferences protobuf payload', () => {
    // Construct a minimal valid innerProto for permission_grants_global:
    // field 1 (allow): 'command(ls)'
    const allow1 = AntigravityStateManager.writeStringField(1, 'command(ls)');
    const innerProto = allow1;
    const innerB64 = innerProto.toString('base64');
    const innerBuffer = Buffer.from(innerB64, 'utf-8');

    // Construct Row message (field 1: value, field 2: etag)
    const valTag = (1 << 3) | 2;
    const valMsgParts = [
      AntigravityStateManager.writeVarint(valTag),
      AntigravityStateManager.writeVarint(innerBuffer.length),
      innerBuffer,
      AntigravityStateManager.writeVarint((2 << 3) | 0),
      AntigravityStateManager.writeVarint(42) // etag = 42
    ];
    const valMsg = Buffer.concat(valMsgParts);

    // Map entry (field 1: key, field 2: Row)
    const keyField = AntigravityStateManager.writeStringField(1, 'permission_grants_global');
    const rowField = Buffer.concat([
      AntigravityStateManager.writeVarint((2 << 3) | 2),
      AntigravityStateManager.writeVarint(valMsg.length),
      valMsg
    ]);
    const mapEntryPayload = Buffer.concat([keyField, rowField]);

    // Topic message (field 1: map entry)
    const topicPayload = Buffer.concat([
      AntigravityStateManager.writeVarint((1 << 3) | 2),
      AntigravityStateManager.writeVarint(mapEntryPayload.length),
      mapEntryPayload
    ]);

    const result = AntigravityStateManager.injectWildcardsIntoAgentPreferences(topicPayload);
    assert.ok(result !== null, 'injectWildcardsIntoAgentPreferences must succeed');
    assert.ok(result.addedCount > 0, 'Must have added autonomous grants');
    assert.ok(result.totalCount > 100, 'Total count should reflect comprehensive list');

    // Re-parsing modified buffer should yield all autonomous grants
    const modifiedRaw = Buffer.from(result.modifiedB64, 'base64');
    const secondPass = AntigravityStateManager.injectWildcardsIntoAgentPreferences(modifiedRaw);
    assert.ok(secondPass !== null);
    assert.strictEqual(secondPass.addedCount, 0, 'Second pass should add 0 new grants');
  });
});
