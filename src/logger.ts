import * as vscode from 'vscode';
import { HistoryEntry, HistoryStatus } from './types';

export class OutputLogger {
  private channel: vscode.OutputChannel;
  private history: HistoryEntry[] = [];
  private maxHistoryEntries: number = 200;
  private approvedCount: number = 0;
  private skippedCount: number = 0;
  private errorCount: number = 0;

  constructor(channelName: string = 'AI IDE Auto-Approve', maxEntries: number = 200) {
    this.channel = vscode.window.createOutputChannel(channelName);
    this.maxHistoryEntries = maxEntries;
  }

  public setMaxHistoryEntries(max: number): void {
    this.maxHistoryEntries = Math.max(10, max);
    if (this.history.length > this.maxHistoryEntries) {
      this.history = this.history.slice(-this.maxHistoryEntries);
    }
  }

  private formatTimestamp(date: Date = new Date()): string {
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const ms = pad(date.getMilliseconds(), 3);
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`;
  }

  public log(level: 'INFO' | 'WARN' | 'ERROR' | 'SAFETY', message: string): void {
    const ts = this.formatTimestamp();
    const line = `[${ts}] [${level}] ${message}`;
    this.channel.appendLine(line);
  }

  public info(message: string): void {
    this.log('INFO', message);
  }

  public warn(message: string): void {
    this.log('WARN', message);
  }

  public error(message: string, error?: unknown): void {
    let details = '';
    if (error instanceof Error) {
      details = ` - ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    } else if (error !== undefined) {
      details = ` - ${String(error)}`;
    }
    this.log('ERROR', `${message}${details}`);
  }

  public recordDecision(
    status: HistoryStatus,
    text: string,
    reason?: string,
    rawItem?: unknown
  ): HistoryEntry {
    const ts = this.formatTimestamp();
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: ts,
      text,
      status,
      reason,
      rawItem
    };

    if (status === 'APPROVED') {
      this.approvedCount++;
    } else if (status === 'SKIPPED') {
      this.skippedCount++;
    } else if (status === 'ERROR') {
      this.errorCount++;
    }

    this.history.push(entry);
    if (this.history.length > this.maxHistoryEntries) {
      this.history.shift();
    }

    const level = status === 'APPROVED' ? 'INFO' : status === 'SKIPPED' ? 'SAFETY' : 'ERROR';
    const reasonStr = reason ? ` (${reason})` : '';
    const cleanText = text.replace(/\s+/g, ' ').slice(0, 150);
    this.log(level, `[${status}] "${cleanText}"${reasonStr}`);

    return entry;
  }

  public getStats(): { approved: number; skipped: number; errors: number; total: number } {
    return {
      approved: this.approvedCount,
      skipped: this.skippedCount,
      errors: this.errorCount,
      total: this.approvedCount + this.skippedCount + this.errorCount
    };
  }

  public getHistory(): HistoryEntry[] {
    return [...this.history].reverse();
  }

  public clearHistory(): void {
    this.history = [];
    this.approvedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.info('History cleared by user.');
  }

  public resetActivity(): void {
    this.history = [];
    this.approvedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
  }

  public show(preserveFocus = true): void {
    this.channel.show(preserveFocus);
  }

  public dispose(): void {
    this.channel.dispose();
  }
}
