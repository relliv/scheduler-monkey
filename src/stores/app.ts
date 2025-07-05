import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Vault, 
  Schedule, 
  ScheduleLog, 
  ScriptFile, 
  ScheduleModalState, 
  LogsModalState, 
  BunInstallModalState,
  BunInstallationStatus,
  ScriptModalState 
} from '../shared/types'

export const useAppStore = defineStore('app', () => {
  // State
  const currentVault = ref<Vault | null>(null)
  const vaults = ref<Vault[]>([])
  const scriptFiles = ref<ScriptFile[]>([])
  const schedules = ref<Schedule[]>([])
  const logs = ref<ScheduleLog[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Modal states
  const scheduleModal = ref<ScheduleModalState>({
    isOpen: false,
    scriptFile: null,
    existingSchedule: undefined
  })
  
  const logsModal = ref<LogsModalState>({
    isOpen: false,
    schedule: null,
    logs: []
  })
  
  const bunInstallModal = ref<BunInstallModalState>({
    isOpen: false,
    isInstalling: false,
    installationProgress: 0
  })
  
  const scriptModal = ref<ScriptModalState>({
    isOpen: false,
    scriptFile: null
  })
  
  // Bun installation status
  const bunStatus = ref<BunInstallationStatus>({ isInstalled: false })
  
  // Computed
  const hasVaults = computed(() => vaults.value.length > 0)
  const scheduledFiles = computed(() => scriptFiles.value.filter(file => file.isScheduled))
  const unscheduledFiles = computed(() => scriptFiles.value.filter(file => !file.isScheduled))
  const activeSchedules = computed(() => schedules.value.filter(schedule => schedule.isActive))
  
  // Actions
  async function initializeApp() {
    setLoading(true)
    setError(null)
    
    try {
      // Initialize database
      await window.electronAPI.invoke('database:init')
      
      // Load existing vaults
      await loadVaults()
      
      // Check Bun installation
      await checkBunInstallation()
      
      // If no vaults exist, trigger vault selection
      if (!hasVaults.value) {
        await selectInitialVault()
      } else {
        // Load first vault by default
        await selectVault(vaults.value[0])
      }
      
      // Start scheduler
      await window.electronAPI.invoke('scheduler:start')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize application')
      console.error('App initialization failed:', err)
    } finally {
      setLoading(false)
    }
  }
  
  async function loadVaults() {
    try {
      vaults.value = await window.electronAPI.invoke('database:get-vaults')
    } catch (err) {
      console.error('Failed to load vaults:', err)
      throw err
    }
  }
  
  async function selectInitialVault() {
    try {
      const selectedPath = await window.electronAPI.invoke('file:select-directory')
      
      if (selectedPath) {
        const vaultName = selectedPath.split('/').pop() || 'Default Vault'
        
        const newVault = await window.electronAPI.invoke('database:create-vault', {
          name: vaultName,
          path: selectedPath
        })
        
        vaults.value.push(newVault)
        await selectVault(newVault)
      } else {
        throw new Error('No vault directory selected')
      }
    } catch (err) {
      console.error('Failed to select initial vault:', err)
      throw err
    }
  }
  
  async function selectVault(vault: Vault) {
    setLoading(true)
    setError(null)
    
    try {
      currentVault.value = vault
      
      // Load script files from vault
      await loadScriptFiles(vault.path)
      
      // Load schedules for this vault
      await loadSchedules(vault.id)
      
    } catch (err) {
      setError(`Failed to load vault: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error('Failed to select vault:', err)
    } finally {
      setLoading(false)
    }
  }
  
  async function loadScriptFiles(vaultPath: string) {
    try {
      scriptFiles.value = await window.electronAPI.invoke('file:scan-directory', vaultPath)
    } catch (err) {
      console.error('Failed to load script files:', err)
      throw err
    }
  }
  
  async function scanVaultDirectory(vaultPath: string) {
    try {
      scriptFiles.value = await window.electronAPI.invoke('file:scan-directory', vaultPath)
    } catch (err) {
      console.error('Failed to scan vault directory:', err)
      throw err
    }
  }
  
  async function loadSchedules(vaultId?: string) {
    try {
      schedules.value = await window.electronAPI.invoke('database:get-schedules', vaultId)
    } catch (err) {
      console.error('Failed to load schedules:', err)
      throw err
    }
  }
  
  async function createSchedule(scheduleData: {
    scriptFile: ScriptFile
    cronExpression: string
    isActive: boolean
  }) {
    if (!currentVault.value) {
      throw new Error('No vault selected')
    }
    
    try {
      const newSchedule = await window.electronAPI.invoke('database:create-schedule', {
        vaultId: currentVault.value.id,
        filePath: scheduleData.scriptFile.fullPath,
        fileName: scheduleData.scriptFile.name,
        cronExpression: scheduleData.cronExpression,
        isActive: scheduleData.isActive
      })
      
      schedules.value.push(newSchedule)
      
      // Update script file schedule info
      const fileIndex = scriptFiles.value.findIndex(f => f.id === scheduleData.scriptFile.id)
      if (fileIndex !== -1) {
        scriptFiles.value[fileIndex].isScheduled = true
        scriptFiles.value[fileIndex].scheduleInfo = {
          id: newSchedule.id,
          cronExpression: newSchedule.cronExpression,
          isActive: newSchedule.isActive
        }
      }
      
      return newSchedule
    } catch (err) {
      console.error('Failed to create schedule:', err)
      throw err
    }
  }
  
  async function updateSchedule(scheduleId: string, updates: Partial<Schedule>) {
    try {
      const updatedSchedule = await window.electronAPI.invoke('database:update-schedule', scheduleId, updates)
      
      const index = schedules.value.findIndex(s => s.id === scheduleId)
      if (index !== -1) {
        schedules.value[index] = updatedSchedule
      }
      
      // Update script file schedule info
      const scriptFile = scriptFiles.value.find(f => f.scheduleInfo?.id === scheduleId)
      if (scriptFile && scriptFile.scheduleInfo) {
        scriptFile.scheduleInfo.cronExpression = updatedSchedule.cronExpression
        scriptFile.scheduleInfo.isActive = updatedSchedule.isActive
      }
      
      return updatedSchedule
    } catch (err) {
      console.error('Failed to update schedule:', err)
      throw err
    }
  }
  
  async function deleteSchedule(scheduleId: string) {
    try {
      await window.electronAPI.invoke('database:delete-schedule', scheduleId)
      
      schedules.value = schedules.value.filter(s => s.id !== scheduleId)
      
      // Update script file schedule info
      const scriptFile = scriptFiles.value.find(f => f.scheduleInfo?.id === scheduleId)
      if (scriptFile) {
        scriptFile.isScheduled = false
        scriptFile.scheduleInfo = undefined
      }
    } catch (err) {
      console.error('Failed to delete schedule:', err)
      throw err
    }
  }
  
  async function loadLogs(scheduleId?: string, limit = 100) {
    try {
      logs.value = await window.electronAPI.invoke('database:get-logs', scheduleId, limit)
    } catch (err) {
      console.error('Failed to load logs:', err)
      throw err
    }
  }
  
  async function executeScript(scriptFile: ScriptFile) {
    try {
      setLoading(true)
      const result = await window.electronAPI.invoke('bun:execute-script', scriptFile.fullPath)
      
      // Create a log entry for manual execution
      if (currentVault.value) {
        await window.electronAPI.invoke('database:create-log', {
          scheduleId: '', // Manual execution
          executionTime: new Date(),
          status: result.success ? 'success' : 'error',
          output: result.output,
          errorMessage: result.error,
          executionDuration: result.duration
        })
      }
      
      return result
    } catch (err) {
      console.error('Failed to execute script:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  async function checkBunInstallation() {
    try {
      bunStatus.value = await window.electronAPI.invoke('bun:check-installation')
    } catch (err) {
      console.error('Failed to check Bun installation:', err)
      bunStatus.value = { isInstalled: false }
    }
  }
  
  async function installBun() {
    try {
      bunInstallModal.value.isInstalling = true
      bunInstallModal.value.installationProgress = 0
      
      const success = await window.electronAPI.invoke('bun:install')
      
      if (success) {
        await checkBunInstallation()
        bunInstallModal.value.isOpen = false
      }
      
      return success
    } catch (err) {
      console.error('Failed to install Bun:', err)
      throw err
    } finally {
      bunInstallModal.value.isInstalling = false
      bunInstallModal.value.installationProgress = 0
    }
  }
  
  // Modal actions
  function openScheduleModal(scriptFile: ScriptFile, existingSchedule?: Schedule) {
    scheduleModal.value = {
      isOpen: true,
      scriptFile,
      existingSchedule
    }
  }
  
  function closeScheduleModal() {
    scheduleModal.value = {
      isOpen: false,
      scriptFile: null,
      existingSchedule: undefined
    }
  }
  
  function openLogsModal(schedule: Schedule) {
    logsModal.value = {
      isOpen: true,
      schedule,
      logs: []
    }
    // Load logs for this schedule
    loadLogs(schedule.id)
  }
  
  function closeLogsModal() {
    logsModal.value = {
      isOpen: false,
      schedule: null,
      logs: []
    }
  }
  
  function openBunInstallModal() {
    bunInstallModal.value.isOpen = true
  }
  
  function closeBunInstallModal() {
    bunInstallModal.value.isOpen = false
  }
  
  function openScriptModal(scriptFile: ScriptFile | null) {
    scriptModal.value = {
      isOpen: true,
      scriptFile
    }
  }
  
  function closeScriptModal() {
    scriptModal.value = {
      isOpen: false,
      scriptFile: null
    }
  }
  
  // Utility actions
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }
  
  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }
  
  function clearError() {
    error.value = null
  }
  
  return {
    // State
    currentVault,
    vaults,
    scriptFiles,
    schedules,
    logs,
    isLoading,
    error,
    scheduleModal,
    logsModal,
    bunInstallModal,
    scriptModal,
    bunStatus,
    
    // Computed
    hasVaults,
    scheduledFiles,
    unscheduledFiles,
    activeSchedules,
    
    // Actions
    initializeApp,
    loadVaults,
    selectInitialVault,
    selectVault,
    loadScriptFiles,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    loadLogs,
    executeScript,
    checkBunInstallation,
    installBun,
    
    // Modal actions
    openScheduleModal,
    closeScheduleModal,
    openLogsModal,
    closeLogsModal,
    openBunInstallModal,
    closeBunInstallModal,
    openScriptModal,
    closeScriptModal,
    scanVaultDirectory,
    
    // Utility actions
    setLoading,
    setError,
    clearError
  }
})
