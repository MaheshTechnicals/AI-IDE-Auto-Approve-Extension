import { SafetyCheckResult } from './types';

export const DEFAULT_BANNED_PATTERNS: string[] = [
  '\\brm\\s+.*(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|(-[a-zA-Z]*r[a-zA-Z]*\\s+.*-[a-zA-Z]*f)|(-[a-zA-Z]*f[a-zA-Z]*\\s+.*-[a-zA-Z]*r)|--recursive.*--force|--force.*--recursive)',
  '\\bsudo\\b',
  '\\bmkfs\\b',
  '\\bdd\\s+if=',
  '\\bformat\\s+[a-zA-Z]:',
  '\\bdel\\s+.*(/s|/q|/f)\\b',
  '\\bshutdown\\b',
  '\\breboot\\b',
  '\\bpasswd\\b',
  'curl.*\\|.*(sh|bash|zsh)',
  'wget.*\\|.*(sh|bash|zsh)',
  'chmod\\s+(-R\\s+)?(777|a\\+rwx)',
  'git\\s+push\\s+.*--force',
  '\\bdrop\\s+(table|database)\\b',
  '\\btruncate\\s+(table\\s+)?[a-zA-Z0-9_`"\\[\\]]+',
  '/dev/sd[a-z]',
  '\\bregedit\\b',
  '\\breg\\s+delete\\b',
  'Remove-Item.*-Recurse.*-Force',
  'Set-ExecutionPolicy\\s+Bypass',
  'nc\\s+-e',
  '/dev/tcp/'
];

export class SafetyChecker {
  private compiledPatterns: Array<{ raw: string; regex: RegExp }> = [];

  constructor(patterns: string[] = DEFAULT_BANNED_PATTERNS) {
    this.updatePatterns(patterns);
  }

  public updatePatterns(patterns: string[]): void {
    const list = Array.isArray(patterns) ? patterns : DEFAULT_BANNED_PATTERNS;
    this.compiledPatterns = [];

    for (const pat of list) {
      if (!pat || typeof pat !== 'string') {
        continue;
      }
      try {
        this.compiledPatterns.push({
          raw: pat,
          regex: new RegExp(pat, 'i')
        });
      } catch {
        // If user entered raw string with invalid regex characters, fallback to escaped literal regex
        const escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        this.compiledPatterns.push({
          raw: pat,
          regex: new RegExp(escaped, 'i')
        });
      }
    }
  }

  /**
   * Evaluates text or pending item representation against all banned patterns.
   * If safety is disabled, all actions are permitted.
   */
  public check(text: string, enabled: boolean = true): SafetyCheckResult {
    if (!enabled) {
      return { safe: true };
    }

    if (!text || typeof text !== 'string') {
      return { safe: true };
    }

    for (const { raw, regex } of this.compiledPatterns) {
      const match = regex.exec(text);
      if (match) {
        return {
          safe: false,
          reason: `Matched banned security pattern: "${raw}"`,
          matchedPattern: raw,
          matchedText: match[0]
        };
      }
    }

    return { safe: true };
  }

  /**
   * Extracts displayable text from any pending action item.
   * Inspects common fields and serializes objects safely.
   */
  public static extractText(item: unknown): string {
    if (item === null || item === undefined) {
      return '';
    }

    if (typeof item === 'string') {
      return item;
    }

    if (typeof item === 'number' || typeof item === 'boolean' || typeof item === 'bigint') {
      return String(item);
    }

    if (Array.isArray(item)) {
      return item.map((sub) => SafetyChecker.extractText(sub)).join(' ');
    }

    if (typeof item === 'object') {
      const obj = item as Record<string, unknown>;

      // Priority fields often found in VS Code / agent tool requests
      const priorityKeys = [
        'command',
        'cmd',
        'script',
        'shellCommand',
        'code',
        'url',
        'path',
        'filePath',
        'input',
        'args',
        'arguments',
        'tool',
        'toolName',
        'action',
        'actionType',
        'title',
        'description',
        'message',
        'text',
        'content',
        'query'
      ];

      const parts: string[] = [];

      for (const key of priorityKeys) {
        if (key in obj && obj[key] !== undefined && obj[key] !== null) {
          const val = obj[key];
          if (typeof val === 'string') {
            parts.push(val);
          } else if (typeof val === 'object') {
            try {
              parts.push(JSON.stringify(val));
            } catch {
              // Ignore circular references
            }
          } else {
            parts.push(String(val));
          }
        }
      }

      // Also append full JSON representation as safety net so hidden fields are checked
      try {
        const fullJson = JSON.stringify(obj);
        if (parts.length > 0) {
          return `${parts.join(' ')} \n[Payload]: ${fullJson}`;
        }
        return fullJson;
      } catch {
        return parts.join(' ');
      }
    }

    return String(item);
  }
}
