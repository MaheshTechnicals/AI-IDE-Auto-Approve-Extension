import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Comprehensive list of command prefixes, tools, and runtimes to auto-approve
 * in Google Antigravity IDE's native SQLite state (state.vscdb).
 */
export const AUTONOMOUS_COMMAND_GRANTS: string[] = [
  // 1. Wildcards & Core Resource Actions
  '*',
  'command(*)',
  'unsandboxed(*)',
  'custom(*)',
  'execute_url(*)',
  'execute_url(localhost)',
  'write_file(*)',
  'read_file(*)',

  // 2. Shells & Script Interpreters
  'command(bash)',
  'command(sh)',
  'command(zsh)',
  'command(dash)',
  'command(fish)',
  'command(ksh)',

  // 3. Node.js / JavaScript / TypeScript Ecosystem
  'command(node)',
  'command(nodejs)',
  'command(npm)',
  'command(npx)',
  'command(pnpm)',
  'command(pnpx)',
  'command(yarn)',
  'command(bun)',
  'command(bunx)',
  'command(deno)',
  'command(tsc)',
  'command(ts-node)',
  'command(tsx)',
  'command(esbuild)',
  'command(vite)',
  'command(next)',
  'command(webpack)',
  'command(rollup)',
  'command(turbo)',
  'command(jest)',
  'command(vitest)',
  'command(mocha)',
  'command(eslint)',
  'command(prettier)',
  'command(corepack)',

  // 4. Python Ecosystem
  'command(python)',
  'command(python3)',
  'command(python3.10)',
  'command(python3.11)',
  'command(python3.12)',
  'command(python3.13)',
  'command(py)',
  'command(pip)',
  'command(pip3)',
  'command(pipx)',
  'command(poetry)',
  'command(pipenv)',
  'command(conda)',
  'command(mamba)',
  'command(uv)',
  'command(pytest)',
  'command(black)',
  'command(ruff)',
  'command(flake8)',
  'command(mypy)',
  'command(pylint)',
  'command(isort)',
  'command(virtualenv)',
  'command(venv)',

  // 5. Core Linux / Unix File & Directory Manipulation
  'command(git)',
  'command(curl)',
  'command(wget)',
  'command(sed)',
  'command(awk)',
  'command(gawk)',
  'command(jq)',
  'command(yq)',
  'command(base64)',
  'command(strings)',
  'command(tar)',
  'command(gzip)',
  'command(gunzip)',
  'command(zip)',
  'command(unzip)',
  'command(bzip2)',
  'command(bunzip2)',
  'command(xz)',
  'command(unxz)',
  'command(7z)',
  'command(chmod)',
  'command(chown)',
  'command(chgrp)',
  'command(rm)',
  'command(mv)',
  'command(cp)',
  'command(mkdir)',
  'command(rmdir)',
  'command(touch)',
  'command(cat)',
  'command(ls)',
  'command(dir)',
  'command(head)',
  'command(tail)',
  'command(grep)',
  'command(egrep)',
  'command(fgrep)',
  'command(rg)',
  'command(ag)',
  'command(ack)',
  'command(find)',
  'command(which)',
  'command(whereis)',
  'command(diff)',
  'command(patch)',
  'command(sort)',
  'command(uniq)',
  'command(wc)',
  'command(tr)',
  'command(cut)',
  'command(tee)',
  'command(xargs)',
  'command(comm)',
  'command(join)',
  'command(paste)',
  'command(column)',
  'command(hexdump)',
  'command(od)',
  'command(xxd)',
  'command(readlink)',
  'command(realpath)',
  'command(basename)',
  'command(dirname)',
  'command(file)',
  'command(stat)',
  'command(pathchk)',

  // 6. Process & System Diagnostics
  'command(ps)',
  'command(top)',
  'command(htop)',
  'command(kill)',
  'command(pkill)',
  'command(killall)',
  'command(sleep)',
  'command(wait)',
  'command(nohup)',
  'command(timeout)',
  'command(time)',
  'command(date)',
  'command(cal)',
  'command(uptime)',
  'command(env)',
  'command(printenv)',
  'command(export)',
  'command(unset)',
  'command(uname)',
  'command(hostname)',
  'command(whoami)',
  'command(id)',
  'command(pwd)',
  'command(cd)',
  'command(df)',
  'command(du)',
  'command(free)',
  'command(lsof)',
  'command(fuser)',
  'command(ulimit)',
  'command(sysctl)',
  'command(dmesg)',
  'command(journalctl)',
  'command(echo)',
  'command(printf)',
  'command(test)',
  'command(true)',
  'command(false)',

  // 7. Compilers, Build Systems & Languages
  'command(gcc)',
  'command(g++)',
  'command(cc)',
  'command(c++)',
  'command(clang)',
  'command(clang++)',
  'command(make)',
  'command(cmake)',
  'command(ninja)',
  'command(cargo)',
  'command(rustc)',
  'command(rustup)',
  'command(go)',
  'command(gofmt)',
  'command(golangci-lint)',
  'command(java)',
  'command(javac)',
  'command(jar)',
  'command(gradle)',
  'command(./gradlew)',
  'command(mvn)',
  'command(./mvnw)',
  'command(kotlin)',
  'command(kotlinc)',
  'command(dotnet)',
  'command(php)',
  'command(ruby)',
  'command(gem)',
  'command(bundle)',
  'command(rake)',
  'command(swift)',
  'command(perl)',
  'command(lua)',
  'command(luajit)',
  'command(R)',
  'command(Rscript)',
  'command(zig)',

  // 8. Network & Remote
  'command(ssh)',
  'command(scp)',
  'command(rsync)',
  'command(netstat)',
  'command(ss)',
  'command(ping)',
  'command(traceroute)',
  'command(nslookup)',
  'command(dig)',
  'command(host)',
  'command(nc)',
  'command(ncat)',
  'command(socat)',

  // 9. Containers, Virtualization & Cloud
  'command(docker)',
  'command(docker-compose)',
  'command(podman)',
  'command(kubectl)',
  'command(helm)',
  'command(minikube)',
  'command(kind)',
  'command(terraform)',
  'command(vagrant)',
  'command(aws)',
  'command(gcloud)',
  'command(az)',
  'command(gh)',
  'command(glab)',
  'command(git-lfs)',
  'command(svn)',

  // 10. Databases & Data Tools
  'command(sqlite3)',
  'command(psql)',
  'command(mysql)',
  'command(redis-cli)',
  'command(mongosh)',
  'command(mongo)',

  // 11. Android & Mobile Tools
  'command(adb)',
  'command(emulator)',
  'command(fastboot)',
  'command(scrcpy)',

  // 12. Editor, IDE & AI Tools
  'command(code)',
  'command(antigravity)',
  'command(agy)',
  'command(kiro)'
];

/**
 * Manages native SQLite state synchronization for Google Antigravity IDE.
 * Ensures that permission_grants_global and execution policies in state.vscdb
 * automatically grant full autonomous permissions for commands and tools.
 */
export class AntigravityStateManager {
  public static readonly WILDCARDS: string[] = AUTONOMOUS_COMMAND_GRANTS;

  /**
   * Resolves the active state.vscdb path for Antigravity IDE across platforms.
   */
  public static getDatabasePath(): string | null {
    const candidates = [
      // Linux (standard)
      path.join(os.homedir(), '.config', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb'),
      // Linux (XDG_CONFIG_HOME override)
      process.env.XDG_CONFIG_HOME
        ? path.join(process.env.XDG_CONFIG_HOME, 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb')
        : null,
      // macOS (Application Support)
      path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb'),
      // Windows (APPDATA)
      process.env.APPDATA
        ? path.join(process.env.APPDATA, 'Antigravity IDE', 'User', 'globalStorage', 'state.vscdb')
        : null,
      // Windows (LOCALAPPDATA)
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
  public static ensureGlobalPermissions(): { success: boolean; addedCount: number; totalCount: number } {
    const dbPath = this.getDatabasePath();
    if (!dbPath) {
      return { success: false, addedCount: 0, totalCount: 0 };
    }

    try {
      // Dynamic import to prevent crash on runtimes where node:sqlite is unavailable
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sqlite = require('node:sqlite');
      if (!sqlite || !sqlite.DatabaseSync) {
        return { success: false, addedCount: 0, totalCount: 0 };
      }

      const db = new sqlite.DatabaseSync(dbPath);
      try {
        const query = db.prepare(
          "SELECT value FROM ItemTable WHERE key = 'antigravityUnifiedStateSync.agentPreferences'"
        );
        const row = query.get() as { value?: string } | undefined;

        if (!row || !row.value) {
          db.close();
          return { success: false, addedCount: 0, totalCount: 0 };
        }

        const rawB64 = row.value;
        const raw = Buffer.from(rawB64, 'base64');
        const result = this.injectWildcardsIntoAgentPreferences(raw);

        if (result && result.modifiedB64 && result.modifiedB64 !== rawB64) {
          const update = db.prepare(
            "UPDATE ItemTable SET value = ? WHERE key = 'antigravityUnifiedStateSync.agentPreferences'"
          );
          update.run(result.modifiedB64);
        }

        db.close();
        return {
          success: true,
          addedCount: result ? result.addedCount : 0,
          totalCount: result ? result.totalCount : 0
        };
      } catch (dbErr) {
        try {
          db.close();
        } catch {}
        return { success: false, addedCount: 0, totalCount: 0 };
      }
    } catch {
      return { success: false, addedCount: 0, totalCount: 0 };
    }
  }

  public static readVarint(data: Buffer, offset: number): { value: number; nextOffset: number } {
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

  public static writeVarint(val: number): Buffer {
    const bytes: number[] = [];
    let temp = val;
    while (temp > 0x7f) {
      bytes.push((temp & 0x7f) | 0x80);
      temp >>>= 7;
    }
    bytes.push(temp & 0x7f);
    return Buffer.from(bytes);
  }

  public static writeStringField(fieldNum: number, s: string): Buffer {
    const encoded = Buffer.from(s, 'utf-8');
    const tag = (fieldNum << 3) | 2;
    return Buffer.concat([this.writeVarint(tag), this.writeVarint(encoded.length), encoded]);
  }

  public static injectWildcardsIntoAgentPreferences(
    raw: Buffer
  ): { modifiedB64: string; addedCount: number; totalCount: number } | null {
    try {
      interface PreferenceEntry {
        key: string;
        value: Buffer;
        etag?: number;
      }

      const entries: PreferenceEntry[] = [];
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
            let etagVal: number | undefined = undefined;

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
                  // Protobuf Row message: field 1 is value (string), field 2 is e_tag (varint)
                  let vj = 0;
                  while (vj < econtent.length) {
                    const { value: vtag, nextOffset: vjo1 } = this.readVarint(econtent, vj);
                    vj = vjo1;
                    const vwire = vtag & 0x7;
                    const vnum = vtag >> 3;

                    if (vwire === 2) {
                      const { value: vlen, nextOffset: vjo2 } = this.readVarint(econtent, vj);
                      vj = vjo2;
                      if (vnum === 1) {
                        vBytes = Buffer.from(econtent.subarray(vj, vj + vlen));
                      }
                      vj += vlen;
                    } else if (vwire === 0) {
                      const { value: ev, nextOffset: vjo2 } = this.readVarint(econtent, vj);
                      vj = vjo2;
                      if (vnum === 2) {
                        etagVal = ev;
                      }
                    } else if (vwire === 1) {
                      vj += 8;
                    } else if (vwire === 5) {
                      vj += 4;
                    } else {
                      break;
                    }
                  }
                }
              } else if (ewire === 0) {
                j = this.readVarint(content, j).nextOffset;
              } else if (ewire === 1) {
                j += 8;
              } else if (ewire === 5) {
                j += 4;
              } else {
                break;
              }
            }
            entries.push({ key: kStr, value: vBytes, etag: etagVal });
          }
        } else if (wire === 0) {
          i = this.readVarint(raw, i).nextOffset;
        } else if (wire === 1) {
          i += 8;
        } else if (wire === 5) {
          i += 4;
        } else {
          break;
        }
      }

      let mutated = false;
      let addedCount = 0;
      let totalCount = 0;
      const newEntries: PreferenceEntry[] = [];

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
            } else if (pwire === 0) {
              pi = this.readVarint(innerProto, pi).nextOffset;
            } else if (pwire === 1) {
              pi += 8;
            } else if (pwire === 5) {
              pi += 4;
            } else {
              break;
            }
          }

          // Inject all autonomous command grants
          for (const wildcard of this.WILDCARDS) {
            if (!allowList.includes(wildcard)) {
              allowList.unshift(wildcard);
              mutated = true;
              addedCount++;
            }
          }

          totalCount = allowList.length;

          const newInner = Buffer.concat([
            ...allowList.map((item) => this.writeStringField(1, item)),
            ...denyList.map((item) => this.writeStringField(2, item)),
            ...askList.map((item) => this.writeStringField(3, item))
          ]);

          const newV = Buffer.from(newInner.toString('base64'), 'utf-8');
          newEntries.push({ key: entry.key, value: newV, etag: entry.etag });
        } else {
          newEntries.push(entry);
        }
      }

      if (!mutated) {
        return {
          modifiedB64: raw.toString('base64'),
          addedCount: 0,
          totalCount
        };
      }

      const newRawParts: Buffer[] = [];
      for (const entry of newEntries) {
        const keyField = this.writeStringField(1, entry.key);
        const valTag = (1 << 3) | 2;
        const valMsgParts: Buffer[] = [
          this.writeVarint(valTag),
          this.writeVarint(entry.value.length),
          entry.value
        ];

        if (entry.etag !== undefined) {
          const etagTag = (2 << 3) | 0;
          valMsgParts.push(this.writeVarint(etagTag));
          valMsgParts.push(this.writeVarint(entry.etag));
        }

        const valMsg = Buffer.concat(valMsgParts);
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

      return {
        modifiedB64: Buffer.concat(newRawParts).toString('base64'),
        addedCount,
        totalCount
      };
    } catch {
      return null;
    }
  }
}

