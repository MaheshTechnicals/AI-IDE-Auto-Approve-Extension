-- SQLite script to inject all autonomous developer command grants into state.vscdb
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

-- 3. Node.js / JS / TS
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
INSERT INTO new_cmds VALUES ('command(python3.10)');
INSERT INTO new_cmds VALUES ('command(python3.11)');
INSERT INTO new_cmds VALUES ('command(python3.12)');
INSERT INTO new_cmds VALUES ('command(python3.13)');
INSERT INTO new_cmds VALUES ('command(py)');
INSERT INTO new_cmds VALUES ('command(pip)');
INSERT INTO new_cmds VALUES ('command(pip3)');
INSERT INTO new_cmds VALUES ('command(pipx)');
INSERT INTO new_cmds VALUES ('command(poetry)');
INSERT INTO new_cmds VALUES ('command(pipenv)');
INSERT INTO new_cmds VALUES ('command(conda)');
INSERT INTO new_cmds VALUES ('command(mamba)');
INSERT INTO new_cmds VALUES ('command(uv)');
INSERT INTO new_cmds VALUES ('command(pytest)');
INSERT INTO new_cmds VALUES ('command(black)');
INSERT INTO new_cmds VALUES ('command(ruff)');
INSERT INTO new_cmds VALUES ('command(flake8)');
INSERT INTO new_cmds VALUES ('command(mypy)');
INSERT INTO new_cmds VALUES ('command(pylint)');
INSERT INTO new_cmds VALUES ('command(isort)');
INSERT INTO new_cmds VALUES ('command(virtualenv)');
INSERT INTO new_cmds VALUES ('command(venv)');

-- 5. Core Linux / Unix File & Directory Manipulation
INSERT INTO new_cmds VALUES ('command(git)');
INSERT INTO new_cmds VALUES ('command(curl)');
INSERT INTO new_cmds VALUES ('command(wget)');
INSERT INTO new_cmds VALUES ('command(sed)');
INSERT INTO new_cmds VALUES ('command(awk)');
INSERT INTO new_cmds VALUES ('command(gawk)');
INSERT INTO new_cmds VALUES ('command(jq)');
INSERT INTO new_cmds VALUES ('command(yq)');
INSERT INTO new_cmds VALUES ('command(base64)');
INSERT INTO new_cmds VALUES ('command(strings)');
INSERT INTO new_cmds VALUES ('command(tar)');
INSERT INTO new_cmds VALUES ('command(gzip)');
INSERT INTO new_cmds VALUES ('command(gunzip)');
INSERT INTO new_cmds VALUES ('command(zip)');
INSERT INTO new_cmds VALUES ('command(unzip)');
INSERT INTO new_cmds VALUES ('command(bzip2)');
INSERT INTO new_cmds VALUES ('command(bunzip2)');
INSERT INTO new_cmds VALUES ('command(xz)');
INSERT INTO new_cmds VALUES ('command(unxz)');
INSERT INTO new_cmds VALUES ('command(7z)');
INSERT INTO new_cmds VALUES ('command(chmod)');
INSERT INTO new_cmds VALUES ('command(chown)');
INSERT INTO new_cmds VALUES ('command(chgrp)');
INSERT INTO new_cmds VALUES ('command(rm)');
INSERT INTO new_cmds VALUES ('command(mv)');
INSERT INTO new_cmds VALUES ('command(cp)');
INSERT INTO new_cmds VALUES ('command(mkdir)');
INSERT INTO new_cmds VALUES ('command(rmdir)');
INSERT INTO new_cmds VALUES ('command(touch)');
INSERT INTO new_cmds VALUES ('command(cat)');
INSERT INTO new_cmds VALUES ('command(ls)');
INSERT INTO new_cmds VALUES ('command(dir)');
INSERT INTO new_cmds VALUES ('command(head)');
INSERT INTO new_cmds VALUES ('command(tail)');
INSERT INTO new_cmds VALUES ('command(grep)');
INSERT INTO new_cmds VALUES ('command(egrep)');
INSERT INTO new_cmds VALUES ('command(fgrep)');
INSERT INTO new_cmds VALUES ('command(rg)');
INSERT INTO new_cmds VALUES ('command(ag)');
INSERT INTO new_cmds VALUES ('command(ack)');
INSERT INTO new_cmds VALUES ('command(find)');
INSERT INTO new_cmds VALUES ('command(which)');
INSERT INTO new_cmds VALUES ('command(whereis)');
INSERT INTO new_cmds VALUES ('command(diff)');
INSERT INTO new_cmds VALUES ('command(patch)');
INSERT INTO new_cmds VALUES ('command(sort)');
INSERT INTO new_cmds VALUES ('command(uniq)');
INSERT INTO new_cmds VALUES ('command(wc)');
INSERT INTO new_cmds VALUES ('command(tr)');
INSERT INTO new_cmds VALUES ('command(cut)');
INSERT INTO new_cmds VALUES ('command(tee)');
INSERT INTO new_cmds VALUES ('command(xargs)');
INSERT INTO new_cmds VALUES ('command(comm)');
INSERT INTO new_cmds VALUES ('command(join)');
INSERT INTO new_cmds VALUES ('command(paste)');
INSERT INTO new_cmds VALUES ('command(column)');
INSERT INTO new_cmds VALUES ('command(hexdump)');
INSERT INTO new_cmds VALUES ('command(od)');
INSERT INTO new_cmds VALUES ('command(xxd)');
INSERT INTO new_cmds VALUES ('command(readlink)');
INSERT INTO new_cmds VALUES ('command(realpath)');
INSERT INTO new_cmds VALUES ('command(basename)');
INSERT INTO new_cmds VALUES ('command(dirname)');
INSERT INTO new_cmds VALUES ('command(file)');
INSERT INTO new_cmds VALUES ('command(stat)');
INSERT INTO new_cmds VALUES ('command(pathchk)');

-- 6. Process & System Diagnostics
INSERT INTO new_cmds VALUES ('command(ps)');
INSERT INTO new_cmds VALUES ('command(top)');
INSERT INTO new_cmds VALUES ('command(htop)');
INSERT INTO new_cmds VALUES ('command(kill)');
INSERT INTO new_cmds VALUES ('command(pkill)');
INSERT INTO new_cmds VALUES ('command(killall)');
INSERT INTO new_cmds VALUES ('command(sleep)');
INSERT INTO new_cmds VALUES ('command(wait)');
INSERT INTO new_cmds VALUES ('command(nohup)');
INSERT INTO new_cmds VALUES ('command(timeout)');
INSERT INTO new_cmds VALUES ('command(time)');
INSERT INTO new_cmds VALUES ('command(date)');
INSERT INTO new_cmds VALUES ('command(cal)');
INSERT INTO new_cmds VALUES ('command(uptime)');
INSERT INTO new_cmds VALUES ('command(env)');
INSERT INTO new_cmds VALUES ('command(printenv)');
INSERT INTO new_cmds VALUES ('command(export)');
INSERT INTO new_cmds VALUES ('command(unset)');
INSERT INTO new_cmds VALUES ('command(uname)');
INSERT INTO new_cmds VALUES ('command(hostname)');
INSERT INTO new_cmds VALUES ('command(whoami)');
INSERT INTO new_cmds VALUES ('command(id)');
INSERT INTO new_cmds VALUES ('command(pwd)');
INSERT INTO new_cmds VALUES ('command(cd)');
INSERT INTO new_cmds VALUES ('command(df)');
INSERT INTO new_cmds VALUES ('command(du)');
INSERT INTO new_cmds VALUES ('command(free)');
INSERT INTO new_cmds VALUES ('command(lsof)');
INSERT INTO new_cmds VALUES ('command(fuser)');
INSERT INTO new_cmds VALUES ('command(ulimit)');
INSERT INTO new_cmds VALUES ('command(sysctl)');
INSERT INTO new_cmds VALUES ('command(dmesg)');
INSERT INTO new_cmds VALUES ('command(journalctl)');
INSERT INTO new_cmds VALUES ('command(echo)');
INSERT INTO new_cmds VALUES ('command(printf)');
INSERT INTO new_cmds VALUES ('command(test)');
INSERT INTO new_cmds VALUES ('command(true)');
INSERT INTO new_cmds VALUES ('command(false)');

-- 7. Compilers & Build Tools
INSERT INTO new_cmds VALUES ('command(gcc)');
INSERT INTO new_cmds VALUES ('command(g++)');
INSERT INTO new_cmds VALUES ('command(cc)');
INSERT INTO new_cmds VALUES ('command(c++)');
INSERT INTO new_cmds VALUES ('command(clang)');
INSERT INTO new_cmds VALUES ('command(clang++)');
INSERT INTO new_cmds VALUES ('command(make)');
INSERT INTO new_cmds VALUES ('command(cmake)');
INSERT INTO new_cmds VALUES ('command(ninja)');
INSERT INTO new_cmds VALUES ('command(cargo)');
INSERT INTO new_cmds VALUES ('command(rustc)');
INSERT INTO new_cmds VALUES ('command(rustup)');
INSERT INTO new_cmds VALUES ('command(go)');
INSERT INTO new_cmds VALUES ('command(gofmt)');
INSERT INTO new_cmds VALUES ('command(golangci-lint)');
INSERT INTO new_cmds VALUES ('command(java)');
INSERT INTO new_cmds VALUES ('command(javac)');
INSERT INTO new_cmds VALUES ('command(jar)');
INSERT INTO new_cmds VALUES ('command(gradle)');
INSERT INTO new_cmds VALUES ('command(./gradlew)');
INSERT INTO new_cmds VALUES ('command(mvn)');
INSERT INTO new_cmds VALUES ('command(./mvnw)');
INSERT INTO new_cmds VALUES ('command(kotlin)');
INSERT INTO new_cmds VALUES ('command(kotlinc)');
INSERT INTO new_cmds VALUES ('command(dotnet)');
INSERT INTO new_cmds VALUES ('command(php)');
INSERT INTO new_cmds VALUES ('command(ruby)');
INSERT INTO new_cmds VALUES ('command(gem)');
INSERT INTO new_cmds VALUES ('command(bundle)');
INSERT INTO new_cmds VALUES ('command(rake)');
INSERT INTO new_cmds VALUES ('command(swift)');
INSERT INTO new_cmds VALUES ('command(perl)');
INSERT INTO new_cmds VALUES ('command(lua)');
INSERT INTO new_cmds VALUES ('command(luajit)');
INSERT INTO new_cmds VALUES ('command(R)');
INSERT INTO new_cmds VALUES ('command(Rscript)');
INSERT INTO new_cmds VALUES ('command(zig)');

-- 8. Network & Remote
INSERT INTO new_cmds VALUES ('command(ssh)');
INSERT INTO new_cmds VALUES ('command(scp)');
INSERT INTO new_cmds VALUES ('command(rsync)');
INSERT INTO new_cmds VALUES ('command(netstat)');
INSERT INTO new_cmds VALUES ('command(ss)');
INSERT INTO new_cmds VALUES ('command(ping)');
INSERT INTO new_cmds VALUES ('command(traceroute)');
INSERT INTO new_cmds VALUES ('command(nslookup)');
INSERT INTO new_cmds VALUES ('command(dig)');
INSERT INTO new_cmds VALUES ('command(host)');
INSERT INTO new_cmds VALUES ('command(nc)');
INSERT INTO new_cmds VALUES ('command(ncat)');
INSERT INTO new_cmds VALUES ('command(socat)');

-- 9. Containers & Cloud
INSERT INTO new_cmds VALUES ('command(docker)');
INSERT INTO new_cmds VALUES ('command(docker-compose)');
INSERT INTO new_cmds VALUES ('command(podman)');
INSERT INTO new_cmds VALUES ('command(kubectl)');
INSERT INTO new_cmds VALUES ('command(helm)');
INSERT INTO new_cmds VALUES ('command(minikube)');
INSERT INTO new_cmds VALUES ('command(kind)');
INSERT INTO new_cmds VALUES ('command(terraform)');
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

-- Aggregate protobuf bytes for all commands (tag 0x0a + varint length + string)
DROP TABLE IF EXISTS payload_calc;
CREATE TEMP TABLE payload_calc AS
SELECT group_concat(hex(unhex('0a' || printf('%02x', length(cmd))) || cmd), '') AS full_hex
FROM new_cmds;

-- Pad hex so byte length is divisible by 3 (6 hex chars per 3 bytes)
-- If full_hex length % 6 != 0, pad with 'command(antigravity)' or 'command(agy)'
-- Let's check padding in pure SQL:
DROP TABLE IF EXISTS final_payload;
CREATE TEMP TABLE final_payload AS
SELECT 
  CASE (length(full_hex) / 2) % 3
    WHEN 1 THEN unhex(full_hex || '0a0d636f6d6d616e64286e6f646529' || '0a0b636f6d6d616e6428736829') -- add 15 + 13 = 28 bytes? wait
    WHEN 2 THEN unhex(full_hex || '0a0b636f6d6d616e6428736829' || '0a0b636f6d6d616e6428736829') -- 13 + 13 = 26 bytes?
    ELSE unhex(full_hex)
  END AS payload_bytes
FROM payload_calc;

-- Verify byte length is divisible by 3
-- If not divisible by 3, adjust
DROP TABLE IF EXISTS b64_extra;
CREATE TEMP TABLE b64_extra AS
SELECT 
  CASE (length(payload_bytes) % 3)
    WHEN 1 THEN base64(payload_bytes || unhex('0a0b636f6d6d616e6428736829' || '0a0c636f6d6d616e642873656429')) -- + 13 + 14 = 27 bytes (+27 % 3 = 0, so total % 3 == 1? No! +2 is needed: +14 bytes % 3 = +2)
    WHEN 2 THEN base64(payload_bytes || unhex('0a0c636f6d6d616e642873656429')) -- 14 bytes (14 % 3 = 2, so 2 + 14 = 16 % 3 = 1? wait)
    ELSE base64(payload_bytes)
  END AS extra_b64
FROM final_payload;

-- Let's check length of extra_b64
SELECT length(extra_b64), length(extra_b64) % 4 FROM b64_extra;
