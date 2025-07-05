<template>
  <aside class="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
    <!-- Sidebar Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Active Schedules</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ activeSchedules.length }} running</p>
    </div>

    <!-- Schedule Stats -->
    <div class="p-4 grid grid-cols-2 gap-4">
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ schedules.length }}</div>
        <div class="text-sm text-blue-600 dark:text-blue-400">Total</div>
      </div>
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ activeSchedules.length }}</div>
        <div class="text-sm text-green-600 dark:text-green-400">Active</div>
      </div>
    </div>

    <!-- Schedules List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="schedules.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
        <svg class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
        <p class="text-sm">No schedules configured</p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Schedule scripts from the main view</p>
      </div>

      <div v-else class="p-4 space-y-3">
        <div
          v-for="schedule in schedules"
          :key="schedule.id"
          :class="[
            'border rounded-lg p-3 cursor-pointer transition-colors',
            schedule.isActive 
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
          ]"
          @click="viewScheduleLogs(schedule)"
        >
          <!-- Schedule Status -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <div 
                :class="[
                  'w-2 h-2 rounded-full',
                  schedule.isActive ? 'bg-green-500' : 'bg-gray-400'
                ]"
              ></div>
              <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ schedule.fileName }}
              </span>
            </div>
            <button
              @click.stop="toggleSchedule(schedule)"
              :class="[
                'text-xs px-2 py-1 rounded transition-colors',
                schedule.isActive 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
              ]"
            >
              {{ schedule.isActive ? 'Stop' : 'Start' }}
            </button>
          </div>

          <!-- Cron Expression -->
          <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">{{ schedule.cronExpression }}</code>
          </div>

          <!-- Next Run -->
          <div v-if="schedule.isActive" class="text-xs text-gray-500 dark:text-gray-400">
            Next run: {{ getNextRunTime(schedule.cronExpression) }}
          </div>

          <!-- Last Execution -->
          <div v-if="schedule.lastExecution" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last: {{ formatDate(schedule.lastExecution) }}
            <span 
              :class="[
                'ml-2 px-1 py-0.5 rounded text-xs',
                schedule.lastExecutionStatus === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              ]"
            >
              {{ schedule.lastExecutionStatus || 'unknown' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-2 gap-2">
        <button
          @click="stopAllSchedules"
          :disabled="activeSchedules.length === 0"
          class="text-sm px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
        >
          Stop All
        </button>
        <button
          @click="viewAllLogs"
          class="text-sm px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center justify-center space-x-1"
        >
          <span>View Logs</span>
          <span v-if="logCount > 0" class="bg-gray-800 text-xs px-1.5 py-0.5 rounded-full">{{ logCount }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import type { Schedule } from '../shared/types'

interface Props {
  schedules: Schedule[]
  activeSchedules: Schedule[]
}

interface Emits {
  (e: 'view-logs', schedule: Schedule): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useAppStore()
const logCount = ref(0)

// Get total log count
async function fetchLogCount() {
  try {
    // Load logs without displaying them to get the count
    await store.loadLogs()
    logCount.value = store.logs.length
  } catch (error) {
    console.error('Failed to fetch log count:', error)
  }
}

// Fetch log count on component mount
onMounted(() => {
  fetchLogCount()
})

// View schedule logs
function viewScheduleLogs(schedule: Schedule) {
  emit('view-logs', schedule)
}

// Toggle schedule active state
async function toggleSchedule(schedule: Schedule) {
  try {
    await window.electronAPI.invoke('database:update-schedule', schedule.id, {
      isActive: !schedule.isActive
    })
    
    // Update scheduler
    if (schedule.isActive) {
      await window.electronAPI.invoke('scheduler:remove-job', schedule.id)
    } else {
      await window.electronAPI.invoke('scheduler:add-job', {
        id: schedule.id,
        cronExpression: schedule.cronExpression,
        scriptPath: schedule.filePath
      })
    }
  } catch (error) {
    console.error('Failed to toggle schedule:', error)
  }
}

// Stop all active schedules
async function stopAllSchedules() {
  try {
    await window.electronAPI.invoke('scheduler:stop')
    
    // Update all schedules to inactive in database
    for (const schedule of props.activeSchedules) {
      await window.electronAPI.invoke('database:update-schedule', schedule.id, {
        isActive: false
      })
    }
  } catch (error) {
    console.error('Failed to stop all schedules:', error)
  }
}

// View all logs
async function viewAllLogs() {
  // Refresh log count before opening logs modal
  await fetchLogCount()
  emit('view-logs', null as any) // Pass null to show all logs
}

// Get next run time for cron expression (simplified)
function getNextRunTime(cronExpression: string): string {
  // This is a simplified implementation
  // In a real app, you'd use a proper cron parser like node-cron
  try {
    const now = new Date()
    const nextRun = new Date(now.getTime() + 60000) // Simplified: add 1 minute
    return nextRun.toLocaleTimeString()
  } catch {
    return 'Unknown'
  }
}

// Format date for display
function formatDate(date: Date): string {
  return new Date(date).toLocaleString()
}
</script>
