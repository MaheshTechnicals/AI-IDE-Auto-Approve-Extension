export type HistoryStatus = 'APPROVED' | 'SKIPPED' | 'ERROR';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  text: string;
  status: HistoryStatus;
  reason?: string;
  matchedPattern?: string;
  rawItem?: unknown;
}

export interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  matchedPattern?: string;
  matchedText?: string;
}

export interface ExtensionConfig {
  enabled: boolean;
  safetyEnabled: boolean;
  pollIntervalSeconds: number;
  bannedKeywords: string[];
  getPendingCommandId: string;
  approveCommandId: string;
  maxHistoryEntries: number;
  enableKiro: boolean;
  enableAntigravity: boolean;
  antigravityApproveCommands: string[];
}

export interface PendingActionCandidate {
  id?: string | number;
  raw: unknown;
  displayText: string;
}
