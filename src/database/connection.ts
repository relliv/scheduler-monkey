import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';
import path from 'path';
import { vaults, schedules, scheduleLogs } from './schema';

const isDev = process.env.NODE_ENV === 'development';

// Get database path based on environment
function getDatabasePath(): string {
  if (isDev) {
    return path.join(process.cwd(), 'scheduler-monkey.db');
  }
  
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'scheduler-monkey.db');
}

// Initialize database connection
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

export function initializeDatabase() {
  try {
    const dbPath = getDatabasePath();
    console.log('Initializing database at:', dbPath);
    
    sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    
    db = drizzle(sqlite);
    
    // Run migrations
    runMigrations();
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

function runMigrations() {
  try {
    // Create tables if they don't exist
    const createVaultsTable = `
      CREATE TABLE IF NOT EXISTS vaults (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      );
    `;
    
    const createSchedulesTable = `
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        vault_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        cron_expression TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE
      );
    `;
    
    const createScheduleLogsTable = `
      CREATE TABLE IF NOT EXISTS schedule_logs (
        id TEXT PRIMARY KEY,
        schedule_id TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        execution_time INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
        output TEXT,
        error_message TEXT,
        execution_duration REAL,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
      );
    `;
    
    sqlite.exec(createVaultsTable);
    sqlite.exec(createSchedulesTable);
    
    // Check if we need to migrate the schedule_logs table
    const tableInfo = sqlite.prepare("PRAGMA table_info(schedule_logs)").all();
    
    if (tableInfo.length === 0) {
      // Table doesn't exist, create it
      sqlite.exec(createScheduleLogsTable);
    } else {
      // Table exists, check if we need to add columns
      interface ColumnInfo {
        name: string;
        type: string;
        notnull: number;
        dflt_value: string | null;
        pk: number;
      }
      
      const hasFileName = tableInfo.some((col: ColumnInfo) => col.name === 'file_name');
      const hasFilePath = tableInfo.some((col: ColumnInfo) => col.name === 'file_path');
      const scheduleIdCol = tableInfo.find((col: ColumnInfo) => col.name === 'schedule_id');
      
      // Create a temporary table with the new schema
      if (!hasFileName || !hasFilePath || (scheduleIdCol && scheduleIdCol.notnull === 1)) {
        console.log('Migrating schedule_logs table to add new columns and make schedule_id nullable');
        
        // Rename the old table
        sqlite.exec('ALTER TABLE schedule_logs RENAME TO schedule_logs_old;');
        
        // Create the new table
        sqlite.exec(createScheduleLogsTable);
        
        // Copy data from old table to new table
        sqlite.exec(`
          INSERT INTO schedule_logs (id, schedule_id, file_name, file_path, execution_time, status, output, error_message, execution_duration)
          SELECT 
            id, 
            schedule_id, 
            '' as file_name, 
            '' as file_path, 
            execution_time, 
            status, 
            output, 
            error_message, 
            execution_duration 
          FROM schedule_logs_old;
        `);
        
        // Drop the old table
        sqlite.exec('DROP TABLE schedule_logs_old;');
      }
    }
    
    console.log('Database migrations completed');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    console.log('Database connection closed');
  }
}
