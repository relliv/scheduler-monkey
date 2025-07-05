import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Vaults table - stores script directories
export const vaults = sqliteTable('vaults', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`)
});

// Schedules table - stores scheduled script configurations
export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  vaultId: text('vault_id').notNull().references(() => vaults.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(), // relative to vault
  fileName: text('file_name').notNull(),
  cronExpression: text('cron_expression').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`)
});

// Schedule logs table - stores execution history
export const scheduleLogs = sqliteTable('schedule_logs', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').references(() => schedules.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  executionTime: integer('execution_time', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['success', 'error', 'timeout'] }).notNull(),
  output: text('output'), // stdout
  errorMessage: text('error_message'), // stderr
  executionDuration: real('execution_duration') // milliseconds
});

// Types derived from schema
export type Vault = typeof vaults.$inferSelect;
export type NewVault = typeof vaults.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type ScheduleLog = typeof scheduleLogs.$inferSelect;
export type NewScheduleLog = typeof scheduleLogs.$inferInsert;
