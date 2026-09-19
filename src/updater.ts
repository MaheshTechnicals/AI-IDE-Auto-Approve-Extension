import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as cp from 'child_process';
import { URL } from 'url';

export const GITHUB_OWNER = 'MaheshTechnicals';
export const GITHUB_REPO = 'AI-IDE-Auto-Approve-Extension';
export const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
export const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // Check every 4 hours

let extensionContext: vscode.ExtensionContext | null = null;

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  assets: GitHubReleaseAsset[];
}

/**
 * Compares two semver version strings.
 * Returns 1 if a > b, -1 if a < b, 0 if equal.
 */
export function compareVersions(a: string, b: string): number {
  const cleanA = a.replace(/^v/, '').trim();
  const cleanB = b.replace(/^v/, '').trim();
  const pa = cleanA.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = cleanB.split('.').map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) {
      return 1;
    }
    if (va < vb) {
      return -1;
    }
  }
  return 0;
}

/**
 * Gets current extension version from context or VS Code extensions registry.
 */
export function getCurrentVersion(): string {
  // Primary: from active extension context (most reliable)
  if (extensionContext?.extension?.packageJSON?.version) {
    return String(extensionContext.extension.packageJSON.version);
  }
  // Secondary: scan all known extension IDs
  const candidates = [
    'MaheshTechnicals.ai-ide-auto-approve',
    'MaheshTechnicals.kiro-auto-approve',
    'mahesh-technicals.ai-ide-auto-approve'
  ];
  for (const id of candidates) {
    const ext = vscode.extensions?.getExtension(id);
    if (ext?.packageJSON?.version) {
      return String(ext.packageJSON.version);
    }
  }
  // Tertiary: read package.json from extension install path
  try {
    if (extensionContext?.extensionPath) {
      const pkgPath = path.join(extensionContext.extensionPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { version?: string };
        if (pkg.version) {
          return pkg.version;
        }
      }
    }
  } catch {}
  // Hard fallback — keep in sync with package.json version
  return '1.2.0';
}

/**
 * Sets the active extension context reference.
 */
export function setExtensionContext(context: vscode.ExtensionContext): void {
  extensionContext = context;
}

/**
 * Fetches JSON from a URL via HTTP/HTTPS GET, following redirects.
 */
export function httpsGetJson(urlStr: string, redirectCount = 0): Promise<unknown> {
  if (redirectCount > 5) {
    return Promise.reject(new Error('Too many redirects while querying GitHub API'));
  }
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const client = parsedUrl.protocol === 'http:' ? http : https;
    const req = client.get(
      urlStr,
      {
        headers: {
          'User-Agent': `AI-IDE-Auto-Approve/${getCurrentVersion()}`,
          Accept: 'application/vnd.github.v3+json'
        }
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          httpsGetJson(nextUrl, redirectCount + 1).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode && res.statusCode !== 200) {
          reject(new Error(`GitHub API returned status code ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse GitHub API response: ${String(e)}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('GitHub API request timed out'));
    });
  });
}

/**
 * Downloads a file from URL to a local path, following redirects.
 */
export function downloadFile(urlStr: string, destPath: string, redirectCount = 0): Promise<void> {
  if (redirectCount > 5) {
    return Promise.reject(new Error('Too many redirects while downloading update file'));
  }
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const client = parsedUrl.protocol === 'http:' ? http : https;
    const req = client.get(
      urlStr,
      {
        headers: {
          'User-Agent': `AI-IDE-Auto-Approve/${getCurrentVersion()}`,
          Accept: 'application/octet-stream'
        }
      },
      (res) => {
        // GitHub uses 302 redirect for release asset downloads
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          downloadFile(nextUrl, destPath, redirectCount + 1).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode && res.statusCode !== 200) {
          reject(new Error(`Asset download failed with status ${res.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }
    );

    req.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    req.setTimeout(60000, () => {
      req.destroy();
      fs.unlink(destPath, () => {});
      reject(new Error('Download timed out'));
    });
  });
}

/**
 * Downloads and installs the new VSIX.
 */
export async function performUpdate(
  downloadUrl: string,
  fileName: string,
  newVersion: string,
  logger?: { info: (msg: string) => void; warn: (msg: string) => void }
): Promise<void> {
  const tempDir = path.join(os.tmpdir(), 'ai-ide-auto-approve-update');
  const vsixPath = path.join(tempDir, fileName);

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Updating AI IDE Auto-Approve to v${newVersion}...`,
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: 'Downloading latest VSIX...', increment: 20 });
        logger?.info(`Auto-Updater: Downloading ${fileName} from ${downloadUrl}...`);
        await downloadFile(downloadUrl, vsixPath);

        const stat = fs.statSync(vsixPath);
        if (stat.size < 1000) {
          throw new Error('Downloaded file is too small, likely an incomplete download or error.');
        }

        progress.report({ message: 'Installing extension update...', increment: 50 });
        logger?.info(
          `Auto-Updater: Installing VSIX (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`
        );

        // Try multiple install commands for cross-IDE compatibility
        // (Antigravity and Kiro may not support workbench.extensions.installExtension)
        let installSucceeded = false;
        const installCommands = [
          'workbench.extensions.installExtension',
          'antigravity.installExtension',
          'kiro.installExtension'
        ];

        for (const installCmd of installCommands) {
          try {
            await vscode.commands.executeCommand(installCmd, vscode.Uri.file(vsixPath));
            installSucceeded = true;
            break;
          } catch {
            // Try next command
          }
        }

        if (!installSucceeded) {
          // Fallback: try host IDE CLI directly
          const cliBinaries = ['antigravity', 'kiro', 'code'];
          for (const bin of cliBinaries) {
            try {
              await new Promise<void>((resolvePromise, rejectPromise) => {
                cp.exec(`${bin} --install-extension "${vsixPath}" --force`, (err) => {
                  if (err) {
                    rejectPromise(err);
                  } else {
                    resolvePromise();
                  }
                });
              });
              installSucceeded = true;
              break;
            } catch {
              // Try next CLI binary
            }
          }
        }

        if (!installSucceeded) {
          throw new Error(
            `Could not install VSIX automatically in this IDE. Please install manually: ${vsixPath}`
          );
        }

        progress.report({ message: 'Update installed successfully!', increment: 30 });
        logger?.info(`Auto-Updater: Successfully installed v${newVersion}!`);
      }
    );

    // Clean up temporary file
    try {
      if (fs.existsSync(vsixPath)) {
        fs.unlinkSync(vsixPath);
      }
      fs.rmdirSync(tempDir);
    } catch {}

    const reload = await vscode.window.showInformationMessage(
      `✅ AI IDE Auto-Approve updated to v${newVersion}! Please reload the window to activate.`,
      'Reload Window',
      'Later'
    );

    if (reload === 'Reload Window') {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  } catch (err) {
    try {
      if (fs.existsSync(vsixPath)) {
        fs.unlinkSync(vsixPath);
      }
    } catch {}

    const errMsg = `Auto-Updater failed: ${String(err)}`;
    logger?.warn(errMsg);
    const choice = await vscode.window.showErrorMessage(
      `Failed to auto-update AI IDE Auto-Approve: ${String(err)}. You can manually download from GitHub Releases.`,
      'Open Releases'
    );
    if (choice === 'Open Releases') {
      vscode.env.openExternal(
        vscode.Uri.parse(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`)
      );
    }
  }
}

/**
 * Checks GitHub Releases for a newer version and prompts the user to update.
 */
export async function checkForUpdate(
  logger?: { info: (msg: string) => void; warn: (msg: string) => void },
  isManual = false
): Promise<void> {
  const config = vscode.workspace.getConfiguration('aiIdeAutoApprove');
  const kiroConfig = vscode.workspace.getConfiguration('kiroAutoApprove');
  const autoCheckEnabled = config.get<boolean>(
    'autoUpdateCheck',
    kiroConfig.get<boolean>('autoUpdateCheck', true)
  );

  if (!isManual && !autoCheckEnabled) {
    logger?.info('Auto-Updater: Automatic update checks are disabled in settings.');
    return;
  }

  try {
    if (isManual) {
      vscode.window.setStatusBarMessage(
        '$(sync~spin) Checking for AI IDE Auto-Approve updates...',
        3000
      );
    }

    const release = (await httpsGetJson(GITHUB_API_URL)) as GitHubRelease;
    if (!release || !release.tag_name) {
      if (isManual) {
        vscode.window.showWarningMessage(
          'AI IDE Auto-Approve: Could not retrieve release information from GitHub.'
        );
      }
      return;
    }

    const latestVersion = release.tag_name.replace(/^v/, '');
    const currentVersion = getCurrentVersion();

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      logger?.info(`Auto-Updater: You are on the latest version (v${currentVersion}).`);
      if (isManual) {
        vscode.window.showInformationMessage(
          `AI IDE Auto-Approve is up to date! (v${currentVersion})`
        );
      }
      return;
    }

    // Find the .vsix asset
    const vsixAsset = release.assets?.find((a) => a.name.endsWith('.vsix'));
    if (!vsixAsset) {
      logger?.warn(
        `Auto-Updater: New version v${latestVersion} found but no .vsix asset in release.`
      );
      if (isManual) {
        vscode.window.showWarningMessage(
          `New version v${latestVersion} is available, but no .vsix file was found in GitHub release.`
        );
      }
      return;
    }

    logger?.info(`Auto-Updater: New version available! v${currentVersion} → v${latestVersion}`);

    const choice = await vscode.window.showInformationMessage(
      `🚀 AI IDE Auto-Approve v${latestVersion} is available! (Current: v${currentVersion})`,
      'Update Now',
      'View Release Notes',
      'Later'
    );

    if (choice === 'Update Now') {
      await performUpdate(vsixAsset.browser_download_url, vsixAsset.name, latestVersion, logger);
    } else if (choice === 'View Release Notes') {
      vscode.env.openExternal(vscode.Uri.parse(release.html_url));
    }
  } catch (err) {
    logger?.warn(`Auto-Updater: Could not check for updates: ${String(err)}`);
    if (isManual) {
      vscode.window.showErrorMessage(
        `AI IDE Auto-Approve: Error checking for updates: ${String(err)}`
      );
    }
  }
}

/**
 * Starts the auto-update checker — runs on activation and every 4 hours.
 */
export function startAutoUpdater(
  context: vscode.ExtensionContext,
  logger?: { info: (msg: string) => void; warn: (msg: string) => void }
): void {
  setExtensionContext(context);

  // Check after a short delay on activation so startup is not blocked.
  // 8 seconds is enough for the IDE UI to settle and show the notification.
  const initialTimer = setTimeout(() => {
    checkForUpdate(logger, false);
  }, 8000);

  // Periodic check every 4 hours
  const periodicTimer = setInterval(() => {
    checkForUpdate(logger, false);
  }, CHECK_INTERVAL_MS);

  context.subscriptions.push(
    { dispose: () => clearTimeout(initialTimer) },
    { dispose: () => clearInterval(periodicTimer) }
  );

  logger?.info(
    'Auto-Updater: GitHub Release auto-updater initialized (initial check in 8s, then every 4 hours).'
  );
}
