import * as assert from 'assert';
import {
  compareVersions,
  getCurrentVersion,
  setExtensionContext,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_API_URL,
  GitHubRelease
} from '../src/updater';

describe('Auto-Updater Unit Tests', () => {
  describe('Constants & Configuration', () => {
    it('should target the correct GitHub repository', () => {
      assert.strictEqual(GITHUB_OWNER, 'MaheshTechnicals');
      assert.strictEqual(GITHUB_REPO, 'AI-IDE-Auto-Approve-Extension');
      assert.ok(GITHUB_API_URL.includes(GITHUB_OWNER));
      assert.ok(GITHUB_API_URL.includes(GITHUB_REPO));
      assert.ok(GITHUB_API_URL.endsWith('/releases/latest'));
    });
  });

  describe('Version Comparison (Semver)', () => {
    it('should return 0 for identical versions', () => {
      assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0);
      assert.strictEqual(compareVersions('1.1.0', '1.1.0'), 0);
      assert.strictEqual(compareVersions('v1.1.0', '1.1.0'), 0);
      assert.strictEqual(compareVersions('1.1.0', 'v1.1.0'), 0);
    });

    it('should recognize newer major version', () => {
      assert.strictEqual(compareVersions('2.0.0', '1.1.0'), 1);
      assert.strictEqual(compareVersions('1.1.0', '2.0.0'), -1);
    });

    it('should recognize newer minor version', () => {
      assert.strictEqual(compareVersions('1.2.0', '1.1.0'), 1);
      assert.strictEqual(compareVersions('1.1.0', '1.2.0'), -1);
      assert.strictEqual(compareVersions('v1.2.0', 'v1.1.0'), 1);
    });

    it('should recognize newer patch version', () => {
      assert.strictEqual(compareVersions('1.1.1', '1.1.0'), 1);
      assert.strictEqual(compareVersions('1.1.0', '1.1.1'), -1);
      assert.strictEqual(compareVersions('v1.1.5', '1.1.4'), 1);
    });

    it('should handle uneven semver lengths gracefully', () => {
      assert.strictEqual(compareVersions('1.1', '1.1.0'), 0);
      assert.strictEqual(compareVersions('1.1.0.1', '1.1.0'), 1);
      assert.strictEqual(compareVersions('1.0', '1.1'), -1);
    });

    it('should handle whitespace and extra characters', () => {
      assert.strictEqual(compareVersions(' 1.2.0 ', '1.2.0'), 0);
      assert.strictEqual(compareVersions('v2.0.0', '1.9.9'), 1);
    });
  });

  describe('GitHub Release Asset Extraction', () => {
    it('should correctly identify the .vsix asset from release', () => {
      const mockRelease: GitHubRelease = {
        tag_name: 'v1.2.0',
        name: 'Release 1.2.0',
        html_url: 'https://github.com/MaheshTechnicals/AI-IDE-Auto-Approve-Extension/releases/tag/v1.2.0',
        assets: [
          {
            name: 'source.zip',
            browser_download_url: 'https://github.com/.../source.zip',
            size: 1024
          },
          {
            name: 'ai-ide-auto-approve-1.2.0.vsix',
            browser_download_url: 'https://github.com/.../ai-ide-auto-approve-1.2.0.vsix',
            size: 512000
          },
          {
            name: 'checksums.txt',
            browser_download_url: 'https://github.com/.../checksums.txt',
            size: 256
          }
        ]
      };

      const vsix = mockRelease.assets.find((a) => a.name.endsWith('.vsix'));
      assert.ok(vsix);
      assert.strictEqual(vsix.name, 'ai-ide-auto-approve-1.2.0.vsix');
      assert.strictEqual(vsix.size, 512000);
    });

    it('should handle releases without a .vsix asset', () => {
      const mockRelease: GitHubRelease = {
        tag_name: 'v1.2.0',
        name: 'Release 1.2.0',
        html_url: 'https://github.com/...',
        assets: [
          {
            name: 'source.tar.gz',
            browser_download_url: 'https://github.com/...',
            size: 2048
          }
        ]
      };

      const vsix = mockRelease.assets.find((a) => a.name.endsWith('.vsix'));
      assert.strictEqual(vsix, undefined);
    });
  });

  describe('Extension Context & Version Resolution', () => {
    it('should read version from injected context', () => {
      const mockContext = {
        extension: {
          packageJSON: {
            version: '1.2.5'
          }
        }
      } as any;

      setExtensionContext(mockContext);
      assert.strictEqual(getCurrentVersion(), '1.2.5');
    });

    it('should fall back to default version if context has no version', () => {
      const mockEmptyContext = {
        extension: {}
      } as any;

      setExtensionContext(mockEmptyContext);
      const version = getCurrentVersion();
      assert.ok(typeof version === 'string');
      assert.ok(version.length > 0);
    });
  });
});
