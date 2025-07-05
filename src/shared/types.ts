import type { Vault, Schedule, ScheduleLog } from '../database/schema';

// Re-export database types
export type { Vault, Schedule, ScheduleLog } from '../database/schema';

// File system types
export interface ScriptFile {
  id: string;
  name: string;
  path: string; // relative to vault
  fullPath: string; // absolute path
  extension: ".ts" | ".js";
  size: number;
  lastModified: Date;
  isScheduled: boolean;
  scheduleInfo?: {
    id: string;
    cronExpression: string;
    isActive: boolean;
    lastRun?: Date;
    nextRun?: Date;
  };
}

// Execution types
export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  duration: number; // milliseconds
  exitCode?: number;
}

// Bun installation types
export interface BunInstallationStatus {
  isInstalled: boolean;
  version?: string;
  path?: string;
}

// IPC channel types
export interface IpcChannels {
  // Database operations
  "database:init": () => Promise<void>;
  "database:get-vaults": () => Promise<Vault[]>;
  "database:create-vault": (
    vault: Omit<Vault, "id" | "createdAt" | "updatedAt">
  ) => Promise<Vault>;
  "database:get-schedules": (vaultId?: string) => Promise<Schedule[]>;
  "database:create-schedule": (
    schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt">
  ) => Promise<Schedule>;
  "database:update-schedule": (
    id: string,
    updates: Partial<Schedule>
  ) => Promise<Schedule>;
  "database:delete-schedule": (id: string) => Promise<void>;
  "database:get-logs": (
    scheduleId?: string,
    limit?: number
  ) => Promise<ScheduleLog[]>;
  "database:create-log": (log: Omit<ScheduleLog, "id">) => Promise<ScheduleLog>;
  "database:create-manual-log": (log: {
    fileName: string;
    filePath: string;
    status: 'success' | 'error';
    output: string;
    errorMessage: string;
    executionTime: Date;
    executionDuration: number;
  }) => Promise<ScheduleLog>;

  // File system operations
  "file:select-directory": () => Promise<string | null>;
  "file:scan-directory": (path: string) => Promise<ScriptFile[]>;
  "file:watch-directory": (path: string) => Promise<void>;
  "file:read": (path: string) => Promise<string>;
  "file:write": (options: { path: string, content: string }) => Promise<void>;

  // Scheduler operations
  "scheduler:start": () => Promise<void>;
  "scheduler:stop": () => Promise<void>;
  "scheduler:add-job": (schedule: Schedule) => Promise<void>;
  "scheduler:remove-job": (scheduleId: string) => Promise<void>;
  "scheduler:get-next-runs": (
    cronExpression: string,
    count?: number
  ) => Promise<Date[]>;

  // Bun operations
  "bun:check-installation": () => Promise<BunInstallationStatus>;
  "bun:install": () => Promise<boolean>;
  "bun:execute-script": (
    scriptPath: string,
    timeout?: number
  ) => Promise<ExecutionResult>;

  // System operations
  "system:get-app-version": () => Promise<string>;
  "system:show-error-dialog": (title: string, content: string) => Promise<void>;
  "system:show-info-dialog": (title: string, content: string) => Promise<void>;
}

// UI State types
export interface AppState {
  currentVault: Vault | null;
  vaults: Vault[];
  scriptFiles: ScriptFile[];
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;
}

// Modal types
export interface ScheduleModalState {
  isOpen: boolean;
  scriptFile: ScriptFile | null;
  existingSchedule?: Schedule;
}

export interface LogsModalState {
  isOpen: boolean;
  schedule: Schedule | null;
  logs: ScheduleLog[];
}

export interface ScriptModalState {
  isOpen: boolean;
  scriptFile: ScriptFile | null;
}

export interface BunInstallModalState {
  isOpen: boolean;
  isInstalling: boolean;
  installationProgress: number;
}

// Cron expression presets
export interface CronPreset {
  name: string;
  expression: string;
  description: string;
}

export const CRON_PRESETS: CronPreset[] = [
  {
    name: "Every minute",
    expression: "* * * * *",
    description: "Runs every minute",
  },
  {
    name: "Every 5 minutes",
    expression: "*/5 * * * *",
    description: "Runs every 5 minutes",
  },
  {
    name: "Every 15 minutes",
    expression: "*/15 * * * *",
    description: "Runs every 15 minutes",
  },
  {
    name: "Every 30 minutes",
    expression: "*/30 * * * *",
    description: "Runs every 30 minutes",
  },
  {
    name: "Hourly",
    expression: "0 * * * *",
    description: "Runs at the start of every hour",
  },
  {
    name: "Daily at midnight",
    expression: "0 0 * * *",
    description: "Runs every day at 12:00 AM",
  },
  {
    name: "Daily at noon",
    expression: "0 12 * * *",
    description: "Runs every day at 12:00 PM",
  },
  {
    name: "Weekly (Sunday)",
    expression: "0 0 * * 0",
    description: "Runs every Sunday at midnight",
  },
  {
    name: "Monthly",
    expression: "0 0 1 * *",
    description: "Runs on the 1st day of every month",
  },
  {
    name: "Yearly",
    expression: "0 0 1 1 *",
    description: "Runs on January 1st every year",
  },
];
