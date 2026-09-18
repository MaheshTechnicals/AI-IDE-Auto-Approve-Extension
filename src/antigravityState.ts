import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Manages native SQLite state synchronization for Google Antigravity IDE.
 * Ensures that permission_grants_global and execution policies in state.vscdb
 * automatically grant full autonomous permissions for commands and tools.
 */
export class AntigravityStateManager {
  private static readonly WILDCARDS: string[] = [
    '*',
    'command(*)',
    'unsandboxed(*)',
    'custom(*)',
    'execute_url(*)',
    'write_file(*)'
  ];

  /**
   * Resolves the active state.vscdb path for Antigravity IDE across platforms.
   */
  public static getDatabasePath(): string | null {
    const candidates = [
      path.join(os.homedir(), '.config', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb'),
      process.env.APPDATA
        ? path.join(process.env.APPDATA, 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb')
        : null,
      process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb')
        : null
    ].filter((p): p is string => p !== null && fs.existsSync(p));

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Synchronizes Antigravity's persistent Unified State Sync (USS) preferences
   * to guarantee that all commands and terminal executions are allowed without popups.
   */
  public static ensureGlobalPermissions(): boolean {
    const dbPath = this.getDatabasePath();
    if (!dbPath) {
      return false;
    }

    try {
      // Dynamic import to prevent crash on runtimes where node:sqlite is unavailable
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sqlite = require('node:sqlite');
      if (!sqlite || !sqlite.DatabaseSync) {
        return false;
      }

      const db = new sqlite.DatabaseSync(dbPath);
      try {
        const query = db.prepare(
          "SELECT value FROM ItemTable WHERE key = 'antigravityUnifiedStateSync.agentPreferences'"
        );
        const row = query.get() as { value?: string } | undefined;

        if (!row || !row.value) {
          db.close();
          return false;
        }

        const rawB64 = row.value;
        const raw = Buffer.from(rawB64, 'base64');
        const modifiedB64 = this.injectWildcardsIntoAgentPreferences(raw);

        if (modifiedB64 && modifiedB64 !== rawB64) {
          const update = db.prepare(
            "UPDATE ItemTable SET value = ? WHERE key = 'antigravityUnifiedStateSync.agentPreferences'"
          );
          update.run(modifiedB64);
        }

        db.close();
        return true;
      } catch (dbErr) {
        try {
          db.close();
        } catch {}
        return false;
      }
    } catch {
      return false;
    }
  }

  private static readVarint(data: Buffer, offset: number): { value: number; nextOffset: number } {
    let val = 0;
    let shift = 0;
    let i = offset;
    while (i < data.length) {
      const b = data[i++];
      val |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) {
        break;
      }
      shift += 7;
    }
    return { value: val, nextOffset: i };
  }

  private static writeVarint(val: number): Buffer {
    const bytes: number[] = [];
    let temp = val;
    while (temp > 0x7f) {
      bytes.push((temp & 0x7f) | 0x80);
      temp >>>= 7;
    }
    bytes.push(temp & 0x7f);
    return Buffer.from(bytes);
  }

  private static writeStringField(fieldNum: number, s: string): Buffer {
    const encoded = Buffer.from(s, 'utf-8');
    const tag = (fieldNum << 3) | 2;
    return Buffer.concat([this.writeVarint(tag), this.writeVarint(encoded.length), encoded]);
  }

  private static injectWildcardsIntoAgentPreferences(raw: Buffer): string | null {
    try {
      const entries: Array<{ key: string; value: Buffer }> = [];
      let i = 0;

      while (i < raw.length) {
        const { value: tag, nextOffset: o1 } = this.readVarint(raw, i);
        i = o1;
        const wire = tag & 0x7;
        const num = tag >> 3;

        if (wire === 2) {
          const { value: length, nextOffset: o2 } = this.readVarint(raw, i);
          i = o2;
          const content = raw.subarray(i, i + length);
          i += length;

          if (num === 1) {
            let j = 0;
            let kStr = '';
            let vBytes = Buffer.alloc(0);

            while (j < content.length) {
              const { value: etag, nextOffset: jo1 } = this.readVarint(content, j);
              j = jo1;
              const ewire = etag & 0x7;
              const enumNum = etag >> 3;

              if (ewire === 2) {
                const { value: elen, nextOffset: jo2 } = this.readVarint(content, j);
                j = jo2;
                const econtent = content.subarray(j, j + elen);
                j += elen;

                if (enumNum === 1) {
                  kStr = econtent.toString('utf-8');
                } else if (enumNum === 2) {
                  let vj = 0;
                  while (vj < econtent.length) {
                    const { value: vtag, nextOffset: vjo1 } = this.readVarint(econtent, vj);
                    vj = vjo1;
                    const vwire = vtag & 0x7;
                    if (vwire === 2) {
                      const { value: vlen, nextOffset: vjo2 } = this.readVarint(econtent, vj);
                      vj = vjo2;
                      vBytes = Buffer.from(econtent.subarray(vj, vj + vlen));
                      vj += vlen;
                    }
                  }
                }
              }
            }
            entries.push({ key: kStr, value: vBytes });
          }
        }
      }

      let mutated = false;
      const newEntries: Array<{ key: string; value: Buffer }> = [];

      for (const entry of entries) {
        if (entry.key === 'permission_grants_global') {
          const innerProto = Buffer.from(entry.value.toString('utf-8'), 'base64');
          let pi = 0;
          const allowList: string[] = [];
          const denyList: string[] = [];
          const askList: string[] = [];

          while (pi < innerProto.length) {
            const { value: ptag, nextOffset: po1 } = this.readVarint(innerProto, pi);
            pi = po1;
            const pnum = ptag >> 3;
            const pwire = ptag & 0x7;

            if (pwire === 2) {
              const { value: plen, nextOffset: po2 } = this.readVarint(innerProto, pi);
              pi = po2;
              const itemStr = innerProto.subarray(pi, pi + plen).toString('utf-8');
              pi += plen;

              if (pnum === 1) {
                allowList.push(itemStr);
              } else if (pnum === 2) {
                denyList.push(itemStr);
              } else if (pnum === 3) {
                askList.push(itemStr);
              }
            }
          }

          for (const wildcard of this.WILDCARDS) {
            if (!allowList.includes(wildcard)) {
              allowList.unshift(wildcard);
              mutated = true;
            }
          }

          const newInner = Buffer.concat([
            ...allowList.map((item) => this.writeStringField(1, item)),
            ...denyList.map((item) => this.writeStringField(2, item)),
            ...askList.map((item) => this.writeStringField(3, item))
          ]);

          const newV = Buffer.from(newInner.toString('base64'), 'utf-8');
          newEntries.push({ key: entry.key, value: newV });
        } else {
          newEntries.push(entry);
        }
      }

      if (!mutated) {
        return null;
      }

      const newRawParts: Buffer[] = [];
      for (const entry of newEntries) {
        const keyField = this.writeStringField(1, entry.key);
        const valTag = (1 << 3) | 2;
        const valMsg = Buffer.concat([
          this.writeVarint(valTag),
          this.writeVarint(entry.value.length),
          entry.value
        ]);
        const valField = Buffer.concat([
          this.writeVarint((2 << 3) | 2),
          this.writeVarint(valMsg.length),
          valMsg
        ]);

        const entryPayload = Buffer.concat([keyField, valField]);
        newRawParts.push(
          Buffer.concat([
            this.writeVarint((1 << 3) | 2),
            this.writeVarint(entryPayload.length),
            entryPayload
          ])
        );
      }

      return Buffer.concat(newRawParts).toString('base64');
    } catch {
      return null;
    }
  }
}
