import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { v4 as uuidv4 } from 'uuid'
import * as cron from 'node-cron'

// Import our database and types
import { initializeDatabase, getDatabase, closeDatabase } from '../../src/database/connection'
import { vaults, schedules, scheduleLogs } from '../../src/database/schema'
import type { Vault, Schedule, ScheduleLog, ScriptFile, ExecutionResult, BunInstallationStatus } from '../../src/shared/types'
import { eq, desc } from 'drizzle-orm'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId('Scheduler Monkey')

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Global state
let win: BrowserWindow | null = null
let db: ReturnType<typeof getDatabase>
let activeJobs = new Map<string, cron.ScheduledTask>()
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Scheduler Monkey',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

// Initialize application and setup IPC handlers
async function initializeApp() {
  try {
    // Initialize database
    db = initializeDatabase()
    console.log('Database initialized successfully')
    
    // Setup all IPC handlers
    setupDatabaseHandlers()
    setupFileSystemHandlers()
    setupSchedulerHandlers()
    setupBunHandlers()
    setupSystemHandlers()
    
    console.log('Scheduler-Monkey initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Scheduler-Monkey:', error)
    throw error
  }
}

// Database IPC handlers
function setupDatabaseHandlers() {
  ipcMain.handle('database:init', async () => {
    try {
      db = initializeDatabase()
      return { success: true }
    } catch (error) {
      console.error('Database initialization failed:', error)
      throw error
    }
  })

  ipcMain.handle('database:get-vaults', async (): Promise<Vault[]> => {
    return db.select().from(vaults).all()
  })

  ipcMain.handle('database:create-vault', async (_, vaultData: Omit<Vault, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vault> => {
    const newVault: Vault = {
      id: uuidv4(),
      ...vaultData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.insert(vaults).values(newVault)
    return newVault
  })

  ipcMain.handle('database:get-schedules', async (_, vaultId?: string): Promise<Schedule[]> => {
    if (vaultId) {
      return db.select().from(schedules).where(eq(schedules.vaultId, vaultId)).all()
    }
    return db.select().from(schedules).all()
  })

  ipcMain.handle('database:create-schedule', async (_, scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> => {
    const newSchedule: Schedule = {
      id: uuidv4(),
      ...scheduleData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await db.insert(schedules).values(newSchedule)
    
    // Add to active jobs if enabled
    if (newSchedule.isActive) {
      await addScheduleJob(newSchedule)
    }
    
    return newSchedule
  })

  ipcMain.handle('database:update-schedule', async (_, id: string, updates: Partial<Schedule>): Promise<Schedule> => {
    const updatedData = { ...updates, updatedAt: new Date() }
    await db.update(schedules).set(updatedData).where(eq(schedules.id, id))
    
    const updatedSchedule = db.select().from(schedules).where(eq(schedules.id, id)).get()
    if (!updatedSchedule) throw new Error('Schedule not found')
    
    // Update job status
    if ('isActive' in updates) {
      if (updates.isActive) {
        await addScheduleJob(updatedSchedule)
      } else {
        await removeScheduleJob(id)
      }
    }
    
    return updatedSchedule
  })

  ipcMain.handle('database:delete-schedule', async (_, id: string): Promise<void> => {
    await removeScheduleJob(id)
    await db.delete(schedules).where(eq(schedules.id, id))
  })

  ipcMain.handle('database:get-logs', async (_, scheduleId?: string, limit = 100): Promise<ScheduleLog[]> => {
    if (scheduleId) {
      return db.select().from(scheduleLogs)
        .where(eq(scheduleLogs.scheduleId, scheduleId))
        .orderBy(desc(scheduleLogs.executionTime))
        .limit(limit)
        .all()
    }
    return db.select().from(scheduleLogs)
      .orderBy(desc(scheduleLogs.executionTime))
      .limit(limit)
      .all()
  })

  ipcMain.handle('database:create-log', async (_, logData: Omit<ScheduleLog, 'id'>): Promise<ScheduleLog> => {
    const newLog: ScheduleLog = {
      id: uuidv4(),
      ...logData
    }
    
    await db.insert(scheduleLogs).values(newLog)
    return newLog
  })
}

// File system IPC handlers
function setupFileSystemHandlers() {
  ipcMain.handle('file:select-directory', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Script Vault Directory'
    })
    
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('file:scan-directory', async (_, directoryPath: string): Promise<ScriptFile[]> => {
    return await scanDirectoryForScripts(directoryPath)
  })

  ipcMain.handle('file:watch-directory', async (_, directoryPath: string): Promise<void> => {
    // TODO: Implement file watching
    console.log('File watching not yet implemented for:', directoryPath)
  })

  ipcMain.handle('file:write', async (_, options: { path: string, content: string }): Promise<void> => {
    try {
      // Ensure the directory exists
      const directory = path.dirname(options.path);
      await fs.mkdir(directory, { recursive: true });
      
      // Write the file
      await fs.writeFile(options.path, options.content, 'utf-8');
      console.log(`File written successfully: ${options.path}`);
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  })

  ipcMain.handle('file:read', async (_, filePath: string): Promise<string> => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`File read successfully: ${filePath}`);
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  })
}

// Scheduler IPC handlers
function setupSchedulerHandlers() {
  ipcMain.handle('scheduler:start', async (): Promise<void> => {
    const allSchedules = db.select().from(schedules).where(eq(schedules.isActive, true)).all()
    
    for (const schedule of allSchedules) {
      await addScheduleJob(schedule)
    }
    
    console.log(`Started ${allSchedules.length} scheduled jobs`)
  })

  ipcMain.handle('scheduler:stop', async (): Promise<void> => {
    for (const scheduleId of Array.from(activeJobs.keys())) {
      await removeScheduleJob(scheduleId)
    }
    console.log('All scheduled jobs stopped')
  })

  ipcMain.handle('scheduler:add-job', async (_, schedule: Schedule): Promise<void> => {
    await addScheduleJob(schedule)
  })

  ipcMain.handle('scheduler:remove-job', async (_, scheduleId: string): Promise<void> => {
    await removeScheduleJob(scheduleId)
  })

  ipcMain.handle('scheduler:get-next-runs', async (_, cronExpression: string, count = 5): Promise<Date[]> => {
    // Simple implementation - in production, use a proper cron parser
    const dates: Date[] = []
    const now = new Date()
    
    try {
      // This is a simplified implementation
      // In a real app, you'd use a proper cron expression parser
      for (let i = 1; i <= count; i++) {
        dates.push(new Date(now.getTime() + i * 60000)) // Add 1 minute for each
      }
    } catch (error) {
      console.error('Error parsing cron expression:', error)
    }
    
    return dates
  })
}

// Bun.js IPC handlers
function setupBunHandlers() {
  ipcMain.handle('bun:check-installation', async (): Promise<BunInstallationStatus> => {
    return await checkBunInstallation()
  })

  ipcMain.handle('bun:install', async (): Promise<boolean> => {
    return await installBun()
  })

  ipcMain.handle('bun:execute-script', async (_, scriptPath: string, timeout = 30000): Promise<ExecutionResult> => {
    return await executeScript(scriptPath, timeout)
  })
}

// System IPC handlers
function setupSystemHandlers() {
  ipcMain.handle('system:get-app-version', async (): Promise<string> => {
    return app.getVersion()
  })

  ipcMain.handle('system:show-error-dialog', async (_, title: string, content: string): Promise<void> => {
    await dialog.showErrorBox(title, content)
  })

  ipcMain.handle('system:show-info-dialog', async (_, title: string, content: string): Promise<void> => {
    await dialog.showMessageBox({
      type: 'info',
      title,
      message: content
    })
  })
}

// Helper functions
async function scanDirectoryForScripts(directoryPath: string): Promise<ScriptFile[]> {
  const scriptFiles: ScriptFile[] = []
  
  try {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
        const filePath = path.join(directoryPath, entry.name)
        const stats = await fs.stat(filePath)
        
        const scriptFile: ScriptFile = {
          id: uuidv4(),
          name: entry.name,
          path: path.relative(directoryPath, filePath),
          fullPath: filePath,
          extension: entry.name.endsWith('.ts') ? '.ts' : '.js',
          size: stats.size,
          lastModified: stats.mtime,
          isScheduled: false
        }
        
        // Check if this file has a schedule
        const schedule = db.select().from(schedules)
          .where(eq(schedules.fileName, entry.name))
          .get()
        
        if (schedule) {
          scriptFile.isScheduled = true
          scriptFile.scheduleInfo = {
            id: schedule.id,
            cronExpression: schedule.cronExpression,
            isActive: schedule.isActive
          }
        }
        
        scriptFiles.push(scriptFile)
      }
    }
    
    // Recursively scan subdirectories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDirPath = path.join(directoryPath, entry.name)
        const subFiles = await scanDirectoryForScripts(subDirPath)
        scriptFiles.push(...subFiles)
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error)
  }
  
  return scriptFiles
}

async function addScheduleJob(schedule: Schedule): Promise<void> {
  try {
    // Remove existing job if it exists
    await removeScheduleJob(schedule.id)
    
    const task = cron.schedule(schedule.cronExpression, async () => {
      console.log(`Executing scheduled script: ${schedule.fileName}`)
      
      const startTime = Date.now()
      const result = await executeScript(schedule.filePath)
      const endTime = Date.now()
      
      // Log execution result
      const logEntry: Omit<ScheduleLog, 'id'> = {
        scheduleId: schedule.id,
        executionTime: new Date(startTime),
        status: result.success ? 'success' : 'error',
        output: result.output,
        errorMessage: result.error,
        executionDuration: endTime - startTime
      }
      
      await db.insert(scheduleLogs).values({
        id: uuidv4(),
        ...logEntry
      })
      
      // Notify renderer of execution
      if (win) {
        win.webContents.send('schedule-executed', { schedule, result, log: logEntry })
      }
    }, {
      scheduled: false
    })
    
    activeJobs.set(schedule.id, task)
    task.start()
    
    console.log(`Added scheduled job: ${schedule.fileName} (${schedule.cronExpression})`)
  } catch (error) {
    console.error('Error adding schedule job:', error)
    throw error
  }
}

async function removeScheduleJob(scheduleId: string): Promise<void> {
  const job = activeJobs.get(scheduleId)
  if (job) {
    job.stop()
    activeJobs.delete(scheduleId)
    console.log(`Removed scheduled job: ${scheduleId}`)
  }
}

async function checkBunInstallation(): Promise<BunInstallationStatus> {
  return new Promise((resolve) => {
    const bunProcess = spawn('bun', ['--version'], { stdio: 'pipe' })
    
    let output = ''
    bunProcess.stdout?.on('data', (data) => {
      output += data.toString()
    })
    
    bunProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          isInstalled: true,
          version: output.trim(),
          path: 'bun' // Could be improved to get actual path
        })
      } else {
        resolve({ isInstalled: false })
      }
    })
    
    bunProcess.on('error', () => {
      resolve({ isInstalled: false })
    })
  })
}

async function installBun(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('Installing Bun.js...')
    
    // Use the official Bun install script
    const installProcess = spawn('curl', ['-fsSL', 'https://bun.sh/install', '|', 'bash'], {
      shell: true,
      stdio: 'pipe'
    })
    
    installProcess.on('close', (code) => {
      const success = code === 0
      console.log(success ? 'Bun.js installed successfully' : 'Bun.js installation failed')
      resolve(success)
    })
    
    installProcess.on('error', (error) => {
      console.error('Bun.js installation error:', error)
      resolve(false)
    })
  })
}

async function executeScript(scriptPath: string, timeout = 30000): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    
    const bunProcess = spawn('bun', ['run', scriptPath], {
      stdio: 'pipe',
      timeout
    })
    
    let stdout = ''
    let stderr = ''
    
    bunProcess.stdout?.on('data', (data) => {
      stdout += data.toString()
    })
    
    bunProcess.stderr?.on('data', (data) => {
      stderr += data.toString()
    })
    
    bunProcess.on('close', (code) => {
      const duration = Date.now() - startTime
      
      resolve({
        success: code === 0,
        output: stdout,
        error: stderr || undefined,
        duration,
        exitCode: code || undefined
      })
    })
    
    bunProcess.on('error', (error) => {
      const duration = Date.now() - startTime
      
      resolve({
        success: false,
        error: error.message,
        duration
      })
    })
  })
}

// Initialize application when ready
app.whenReady().then(async () => {
  await initializeApp()
  createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
