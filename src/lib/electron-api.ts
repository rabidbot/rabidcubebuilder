import type { ScryfallFetchResult, ScryfallSearchResult, ScryfallBatchResult, FileReadResult, FileWriteResult } from './types';

export interface ElectronAPI {
  db: {
    run: (query: string, params?: unknown[]) => Promise<{ ok: boolean; error?: string }>;
    all: (query: string, params?: unknown[]) => Promise<{ ok: boolean; rows?: Record<string, unknown>[]; error?: string }>;
    exec: (sql: string) => Promise<{ ok: boolean; error?: string }>;
    save: () => Promise<{ ok: boolean; error?: string }>;
  };
  dialog: {
    openCsv: () => Promise<string | null>;
    saveFile: (defaultName: string) => Promise<string | null>;
  };
  fs: {
    readFile: (filePath: string) => Promise<FileReadResult>;
    writeFile: (filePath: string, content: string) => Promise<FileWriteResult>;
  };
  scryfall: {
    fetchCard: (scryfallId: string) => Promise<ScryfallFetchResult>;
    fetchBatch: (ids: string[]) => Promise<ScryfallBatchResult>;
    search: (query: string, maxPages?: number) => Promise<ScryfallSearchResult>;
  };
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
}
