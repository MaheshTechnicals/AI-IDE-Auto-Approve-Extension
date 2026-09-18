-- Robust SQL injection script for state.vscdb
DROP TABLE IF EXISTS new_cmds;
CREATE TEMP TABLE new_cmds(cmd TEXT);

-- 1. Wildcards & Core Actions
INSERT INTO new_cmds VALUES ('*');
INSERT INTO new_cmds VALUES ('command(*)');
INSERT INTO new_cmds VALUES ('unsandboxed(*)');
INSERT INTO new_cmds VALUES ('custom(*)');
INSERT INTO new_cmds VALUES ('execute_url(*)');
INSERT INTO new_cmds VALUES ('execute_url(localhost)');
INSERT INTO new_cmds VALUES ('write_file(*)');
INSERT INTO new_cmds VALUES ('read_file(*)');

-- 2. Shells & Script Interpreters
INSERT INTO new_cmds VALUES ('command(bash)');
INSERT INTO new_cmds VALUES ('command(sh)');
INSERT INTO new_cmds VALUES ('command(zsh)');
INSERT INTO new_cmds VALUES ('command(dash)');
INSERT INTO new_cmds VALUES ('command(fish)');
INSERT INTO new_cmds VALUES ('command(ksh)');

-- 3. Node.js / JavaScript / TypeScript Ecosystem
INSERT INTO new_cmds VALUES ('command(node)');
INSERT INTO new_cmds VALUES ('command(nodejs)');
INSERT INTO new_cmds VALUES ('command(npm)');
INSERT INTO new_cmds VALUES ('command(npx)');
INSERT INTO new_cmds VALUES ('command(pnpm)');
INSERT INTO new_cmds VALUES ('command(pnpx)');
INSERT INTO new_cmds VALUES ('command(yarn)');
INSERT INTO new_cmds VALUES ('command(bun)');
INSERT INTO new_cmds VALUES ('command(bunx)');
INSERT INTO new_cmds VALUES ('command(deno)');
INSERT INTO new_cmds VALUES ('command(tsc)');
INSERT INTO new_cmds VALUES ('command(ts-node)');
INSERT INTO new_cmds VALUES ('command(tsx)');
INSERT INTO new_cmds VALUES ('command(esbuild)');
INSERT INTO new_cmds VALUES ('command(vite)');
INSERT INTO new_cmds VALUES ('command(next)');
INSERT INTO new_cmds VALUES ('command(webpack)');
INSERT INTO new_cmds VALUES ('command(rollup)');
INSERT INTO new_cmds VALUES ('command(turbo)');
INSERT INTO new_cmds VALUES ('command(jest)');
INSERT INTO new_cmds VALUES ('command(vitest)');
INSERT INTO new_cmds VALUES ('command(mocha)');
INSERT INTO new_cmds VALUES ('command(eslint)');
INSERT INTO new_cmds VALUES ('command(prettier)');
INSERT INTO new_cmds VALUES ('command(corepack)');

-- 4. Python Ecosystem
INSERT INTO new_cmds VALUES ('command(python)');
INSERT INTO new_cmds VALUES ('command(python3)');
INSERT INTO new_cmds VALUES ('command(pip)');
INSERT INTO new_cmds VALUES ('command(pip3)');
INSERT INTO new_cmds VALUES ('command(pipx)');
INSERT INTO new_cmds VALUES ('command(poetry)');
INSERT INTO new_cmds VALUES ('command(uv)');
INSERT INTO new_cmds VALUES ('command(venv)');
INSERT INTO new_cmds VALUES ('command(virtualenv)');
INSERT INTO new_cmds VALUES ('command(conda)');
INSERT INTO new_cmds VALUES ('command(pytest)');
INSERT INTO new_cmds VALUES ('command(ruff)');
INSERT INTO new_cmds VALUES ('command(black)');
INSERT INTO new_cmds VALUES ('command(mypy)');
INSERT INTO new_cmds VALUES ('command(flake8)');
INSERT INTO new_cmds VALUES ('command(pylint)');
INSERT INTO new_cmds VALUES ('command(jupyter)');

-- 5. Core Linux / Unix Utilities
INSERT INTO new_cmds VALUES ('command(git)');
INSERT INTO new_cmds VALUES ('command(curl)');
INSERT INTO new_cmds VALUES ('command(wget)');
INSERT INTO new_cmds VALUES ('command(sed)');
INSERT INTO new_cmds VALUES ('command(awk)');
INSERT INTO new_cmds VALUES ('command(jq)');
INSERT INTO new_cmds VALUES ('command(base64)');
INSERT INTO new_cmds VALUES ('command(strings)');
INSERT INTO new_cmds VALUES ('command(tar)');
INSERT INTO new_cmds VALUES ('command(chmod)');
INSERT INTO new_cmds VALUES ('command(chown)');
INSERT INTO new_cmds VALUES ('command(rm)');
INSERT INTO new_cmds VALUES ('command(mv)');
INSERT INTO new_cmds VALUES ('command(cp)');
INSERT INTO new_cmds VALUES ('command(mkdir)');
INSERT INTO new_cmds VALUES ('command(cat)');
INSERT INTO new_cmds VALUES ('command(grep)');
INSERT INTO new_cmds VALUES ('command(egrep)');
INSERT INTO new_cmds VALUES ('command(fgrep)');
INSERT INTO new_cmds VALUES ('command(find)');
INSERT INTO new_cmds VALUES ('command(which)');
INSERT INTO new_cmds VALUES ('command(whereis)');
INSERT INTO new_cmds VALUES ('command(head)');
INSERT INTO new_cmds VALUES ('command(tail)');
INSERT INTO new_cmds VALUES ('command(less)');
INSERT INTO new_cmds VALUES ('command(more)');
INSERT INTO new_cmds VALUES ('command(sort)');
INSERT INTO new_cmds VALUES ('command(uniq)');
INSERT INTO new_cmds VALUES ('command(wc)');
INSERT INTO new_cmds VALUES ('command(cut)');
INSERT INTO new_cmds VALUES ('command(tr)');
INSERT INTO new_cmds VALUES ('command(tee)');
INSERT INTO new_cmds VALUES ('command(xargs)');
INSERT INTO new_cmds VALUES ('command(touch)');
INSERT INTO new_cmds VALUES ('command(ln)');
INSERT INTO new_cmds VALUES ('command(df)');
INSERT INTO new_cmds VALUES ('command(du)');
INSERT INTO new_cmds VALUES ('command(ps)');
INSERT INTO new_cmds VALUES ('command(top)');
INSERT INTO new_cmds VALUES ('command(htop)');
INSERT INTO new_cmds VALUES ('command(kill)');
INSERT INTO new_cmds VALUES ('command(killall)');
INSERT INTO new_cmds VALUES ('command(pgrep)');
INSERT INTO new_cmds VALUES ('command(pkill)');
INSERT INTO new_cmds VALUES ('command(env)');
INSERT INTO new_cmds VALUES ('command(export)');
INSERT INTO new_cmds VALUES ('command(echo)');
INSERT INTO new_cmds VALUES ('command(printf)');
INSERT INTO new_cmds VALUES ('command(clear)');
INSERT INTO new_cmds VALUES ('command(reset)');
INSERT INTO new_cmds VALUES ('command(sleep)');
INSERT INTO new_cmds VALUES ('command(whoami)');
INSERT INTO new_cmds VALUES ('command(id)');
INSERT INTO new_cmds VALUES ('command(uname)');
INSERT INTO new_cmds VALUES ('command(uptime)');
INSERT INTO new_cmds VALUES ('command(date)');
INSERT INTO new_cmds VALUES ('command(zip)');
INSERT INTO new_cmds VALUES ('command(unzip)');
INSERT INTO new_cmds VALUES ('command(gzip)');
INSERT INTO new_cmds VALUES ('command(gunzip)');
INSERT INTO new_cmds VALUES ('command(bzip2)');
INSERT INTO new_cmds VALUES ('command(xz)');
INSERT INTO new_cmds VALUES ('command(diff)');
INSERT INTO new_cmds VALUES ('command(patch)');
INSERT INTO new_cmds VALUES ('command(file)');
INSERT INTO new_cmds VALUES ('command(stat)');
INSERT INTO new_cmds VALUES ('command(md5sum)');
INSERT INTO new_cmds VALUES ('command(sha256sum)');

-- 6. Modern CLI Power Tools
INSERT INTO new_cmds VALUES ('command(rg)');
INSERT INTO new_cmds VALUES ('command(fd)');
INSERT INTO new_cmds VALUES ('command(bat)');
INSERT INTO new_cmds VALUES ('command(fzf)');
INSERT INTO new_cmds VALUES ('command(tree)');
INSERT INTO new_cmds VALUES ('command(eza)');
INSERT INTO new_cmds VALUES ('command(exa)');
INSERT INTO new_cmds VALUES ('command(ncdu)');
INSERT INTO new_cmds VALUES ('command(tldr)');
INSERT INTO new_cmds VALUES ('command(http)');
INSERT INTO new_cmds VALUES ('command(curlie)');

-- 7. Compilers & Build Tools
INSERT INTO new_cmds VALUES ('command(make)');
INSERT INTO new_cmds VALUES ('command(cmake)');
INSERT INTO new_cmds VALUES ('command(ninja)');
INSERT INTO new_cmds VALUES ('command(gcc)');
INSERT INTO new_cmds VALUES ('command(g++)');
INSERT INTO new_cmds VALUES ('command(clang)');
INSERT INTO new_cmds VALUES ('command(clang++)');

-- 8. Other Languages
INSERT INTO new_cmds VALUES ('command(rustc)');
INSERT INTO new_cmds VALUES ('command(cargo)');
INSERT INTO new_cmds VALUES ('command(go)');
INSERT INTO new_cmds VALUES ('command(gofmt)');
INSERT INTO new_cmds VALUES ('command(java)');
INSERT INTO new_cmds VALUES ('command(javac)');
INSERT INTO new_cmds VALUES ('command(mvn)');
INSERT INTO new_cmds VALUES ('command(gradle)');
INSERT INTO new_cmds VALUES ('command(ruby)');
INSERT INTO new_cmds VALUES ('command(gem)');
INSERT INTO new_cmds VALUES ('command(bundle)');
INSERT INTO new_cmds VALUES ('command(php)');
INSERT INTO new_cmds VALUES ('command(composer)');
INSERT INTO new_cmds VALUES ('command(perl)');
INSERT INTO new_cmds VALUES ('command(lua)');

-- 9. Containers & Cloud
INSERT INTO new_cmds VALUES ('command(docker)');
INSERT INTO new_cmds VALUES ('command(docker-compose)');
INSERT INTO new_cmds VALUES ('command(podman)');
INSERT INTO new_cmds VALUES ('command(kubectl)');
INSERT INTO new_cmds VALUES ('command(helm)');
INSERT INTO new_cmds VALUES ('command(terraform)');
INSERT INTO new_cmds VALUES ('command(ansible)');
INSERT INTO new_cmds VALUES ('command(vagrant)');
INSERT INTO new_cmds VALUES ('command(aws)');
INSERT INTO new_cmds VALUES ('command(gcloud)');
INSERT INTO new_cmds VALUES ('command(az)');
INSERT INTO new_cmds VALUES ('command(gh)');
INSERT INTO new_cmds VALUES ('command(glab)');
INSERT INTO new_cmds VALUES ('command(git-lfs)');
INSERT INTO new_cmds VALUES ('command(svn)');

-- 10. Databases
INSERT INTO new_cmds VALUES ('command(sqlite3)');
INSERT INTO new_cmds VALUES ('command(psql)');
INSERT INTO new_cmds VALUES ('command(mysql)');
INSERT INTO new_cmds VALUES ('command(redis-cli)');
INSERT INTO new_cmds VALUES ('command(mongosh)');
INSERT INTO new_cmds VALUES ('command(mongo)');

-- 11. Android
INSERT INTO new_cmds VALUES ('command(adb)');
INSERT INTO new_cmds VALUES ('command(emulator)');
INSERT INTO new_cmds VALUES ('command(fastboot)');
INSERT INTO new_cmds VALUES ('command(scrcpy)');

-- 12. IDE & Binaries
INSERT INTO new_cmds VALUES ('command(code)');
INSERT INTO new_cmds VALUES ('command(antigravity)');
INSERT INTO new_cmds VALUES ('command(agy)');
INSERT INTO new_cmds VALUES ('command(kiro)');

-- Aggregate new commands into protobuf binary chunks: tag 0x0A (field 1 allow), 1 byte length, ASCII cmd
DROP TABLE IF EXISTS raw_extra_hex;
CREATE TEMP TABLE raw_extra_hex AS
SELECT group_concat('0a' || printf('%02x', length(cmd)) || hex(cmd), '') AS hex_str
FROM new_cmds;

-- Extract original inner blob from current ItemTable
DROP TABLE IF EXISTS inner_prep;
CREATE TEMP TABLE inner_prep AS
SELECT
  base64(value) AS orig_outer_blob,
  base64(CAST(substr(base64(value), 39, 136160) AS TEXT)) AS orig_inner_blob,
  unhex((SELECT hex_str FROM raw_extra_hex)) AS extra_cmds_blob
FROM ItemTable
WHERE key = 'antigravityUnifiedStateSync.agentPreferences';

-- Combine inner protobuf blobs and base64 encode
DROP TABLE IF EXISTS new_inner_prep;
CREATE TEMP TABLE new_inner_prep AS
SELECT
  orig_outer_blob,
  replace(replace(base64(CAST(orig_inner_blob || extra_cmds_blob AS BLOB)), char(10), ''), char(13), '') AS new_inner_b64
FROM inner_prep;

-- Calculate varints and construct new outer blob
DROP TABLE IF EXISTS new_outer_prep;
CREATE TEMP TABLE new_outer_prep AS
SELECT
  length(new_inner_b64) AS N,
  length(new_inner_b64) + 34 AS L1,
  length(new_inner_b64) + 4 AS L2,
  length(new_inner_b64) AS L3,
  new_inner_b64,
  orig_outer_blob
FROM new_inner_prep;

DROP TABLE IF EXISTS final_table;
CREATE TEMP TABLE final_table AS
SELECT
  replace(replace(base64(CAST(
    unhex('0a' || printf('%02x%02x%02x', (L1 & 127) | 128, ((L1 >> 7) & 127) | 128, (L1 >> 14) & 127))
    || unhex('0a187065726d697373696f6e5f6772616e74735f676c6f62616c')
    || unhex('12' || printf('%02x%02x%02x', (L2 & 127) | 128, ((L2 >> 7) & 127) | 128, (L2 >> 14) & 127))
    || unhex('0a' || printf('%02x%02x%02x', (L3 & 127) | 128, ((L3 >> 7) & 127) | 128, (L3 >> 14) & 127))
    || CAST(new_inner_b64 AS BLOB)
    || substr(orig_outer_blob, 136199)
  AS BLOB)), char(10), ''), char(13), '') AS new_outer_b64,
  N, L1, L2, L3
FROM new_outer_prep;

UPDATE ItemTable
SET value = (SELECT new_outer_b64 FROM final_table)
WHERE key = 'antigravityUnifiedStateSync.agentPreferences';

SELECT 'Update applied successfully. Inner Base64 len: ' || N || ', L1: ' || L1 FROM final_table;
