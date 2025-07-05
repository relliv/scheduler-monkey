<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click="handleBackdropClick"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

      <!-- Modal panel -->
      <div class="inline-block align-middle bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[80vh] flex flex-col mx-auto">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Execution Logs
              </h3>
              <p v-if="schedule" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ schedule.fileName }} • {{ schedule.cronExpression }}
              </p>
              <p v-else class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                All scheduled executions
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Filters and Actions -->
          <div class="flex items-center justify-between space-x-4">
            <!-- Status Filter -->
            <div class="flex space-x-2">
              <button
                v-for="filter in statusFilters"
                :key="filter.key"
                @click="activeStatusFilter = filter.key"
                :class="[
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                  activeStatusFilter === filter.key
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                ]"
              >
                {{ filter.label }}
                <span v-if="filter.count !== undefined" class="ml-1 text-xs opacity-75">({{ filter.count }})</span>
              </button>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-2">
              <button
                @click="refreshLogs"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                :class="{ 'animate-spin': isLoading }"
                title="Refresh logs"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                @click="exportLogs"
                :disabled="filteredLogs.length === 0 || isLoading"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Export logs"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                @click="clearLogs"
                :disabled="store.logs.length === 0 || isLoading"
                class="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        <!-- Logs Content -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <!-- Empty State -->
          <div v-if="filteredLogs.length === 0" class="flex-1 flex items-center justify-center p-8">
            <div class="text-center text-gray-500 dark:text-gray-400">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-lg font-medium mb-2">No logs found</p>
              <p class="text-sm">
                {{ activeStatusFilter === 'all' ? 'No execution logs available' : `No ${activeStatusFilter} executions found` }}
              </p>
            </div>
          </div>

          <!-- Logs List -->
          <div v-else class="flex-1 overflow-y-auto">
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="log in filteredLogs"
                :key="log.id"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <!-- Log Header -->
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center space-x-3">
                    <!-- Status Icon -->
                    <div 
                      :class="[
                        'w-3 h-3 rounded-full',
                        log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                      ]"
                    ></div>
                    
                    <!-- Execution Time -->
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ formatDateTime(log.executionTime) }}
                    </span>
                    
                    <!-- Status Badge -->
                    <span 
                      :class="[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      ]"
                    >
                      {{ log.status }}
                    </span>
                    
                    <!-- Script Name/Path -->
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ log.fileName || 'Unknown Script' }}
                      <span v-if="!log.scheduleId" class="ml-1 text-xs font-medium text-blue-500">(Manual)</span>
                    </span>
                    
                    <!-- Duration -->
                    <span v-if="log.executionDuration" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ log.executionDuration }}ms
                    </span>
                  </div>
                  
                  <!-- Expand/Collapse Button -->
                  <button
                    @click="toggleLogExpansion(log.id)"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg 
                      :class="['w-4 h-4 transition-transform', expandedLogs.has(log.id) ? 'rotate-180' : '']"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <!-- Output Preview -->
                <div v-if="log.output && !expandedLogs.has(log.id)" class="mb-2">
                  <div class="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {{ log.output.split('\n')[0] }}
                  </div>
                </div>

                <!-- Error Preview -->
                <div v-if="log.errorMessage && !expandedLogs.has(log.id)" class="mb-2">
                  <div class="text-sm text-red-600 dark:text-red-400 truncate">
                    Error: {{ log.errorMessage }}
                  </div>
                </div>

                <!-- Expanded Content -->
                <div v-if="expandedLogs.has(log.id)" class="mt-3 space-y-3">
                  <!-- Full Output -->
                  <div v-if="log.output">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Output:</h4>
                    <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">{{ log.output }}</pre>
                  </div>
                  
                  <!-- Error Details -->
                  <div v-if="log.errorMessage">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Error:</h4>
                    <pre class="bg-red-50 dark:bg-red-900/20 p-3 rounded-md text-sm text-red-800 dark:text-red-200 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">{{ log.errorMessage }}</pre>
                  </div>
                  
                  <!-- Execution Details -->
                  <div class="text-xs text-gray-500 dark:text-gray-400 grid grid-cols-2 gap-4">
                    <div>
                      <span class="font-medium">Schedule ID:</span> {{ log.scheduleId || 'Manual' }}
                    </div>
                    <div>
                      <span class="font-medium">Duration:</span> {{ log.executionDuration || 'N/A' }}ms
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-between items-center flex-shrink-0">
          <div class="text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center">
            <span>Showing {{ filteredLogs.length }} of {{ store.logs.length }} entries</span>
            <span class="sm:ml-2 sm:before:content-['•'] sm:before:mx-2 text-xs mt-1 sm:mt-0">
              Last checked: {{ formatDateTime(lastCheckedTime) }}
            </span>
          </div>
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '../stores/app'
import type { Schedule, ScheduleLog } from '../shared/types'

interface Props {
  isOpen: boolean
  schedule: Schedule | null
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const store = useAppStore()
const activeStatusFilter = ref<'all' | 'success' | 'error'>('all')
const expandedLogs = ref(new Set<string>())
const lastCheckedTime = ref(new Date())
const isLoading = ref(false)

// Status filters with counts
const statusFilters = computed(() => [
  { 
    key: 'all' as const, 
    label: 'All', 
    count: store.logs.length 
  },
  { 
    key: 'success' as const, 
    label: 'Success', 
    count: store.logs.filter(log => log.status === 'success').length 
  },
  { 
    key: 'error' as const, 
    label: 'Error', 
    count: store.logs.filter(log => log.status === 'error').length 
  }
])

// Filtered logs based on status filter
const filteredLogs = computed(() => {
  let filtered = store.logs

  if (activeStatusFilter.value !== 'all') {
    filtered = filtered.filter(log => log.status === activeStatusFilter.value)
  }

  // Sort by execution time (newest first)
  return filtered.sort((a, b) => 
    new Date(b.executionTime).getTime() - new Date(a.executionTime).getTime()
  )
})

// Toggle log expansion
function toggleLogExpansion(logId: string) {
  if (expandedLogs.value.has(logId)) {
    expandedLogs.value.delete(logId)
  } else {
    expandedLogs.value.add(logId)
  }
}

// Refresh logs
async function refreshLogs() {
  try {
    isLoading.value = true
    const scheduleId = props.schedule?.id
    await store.loadLogs(scheduleId, 100)
    // Update last checked time
    lastCheckedTime.value = new Date()
  } catch (error) {
    console.error('Failed to refresh logs:', error)
  } finally {
    isLoading.value = false
  }
}

// Export logs
async function exportLogs() {
  try {
    const csvContent = generateCSV(filteredLogs.value)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export logs:', error)
  }
}

// Clear all logs
async function clearLogs() {
  if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
    try {
      isLoading.value = true
      await window.electronAPI.invoke('database:clear-logs', props.schedule?.id)
      // Refresh logs after clearing
      await refreshLogs()
    } catch (error) {
      console.error('Failed to clear logs:', error)
    } finally {
      isLoading.value = false
    }
  }
}

// Generate CSV content from logs
function generateCSV(logs: ScheduleLog[]): string {
  const headers = ['Execution Time', 'Status', 'Duration (ms)', 'Schedule ID', 'Output', 'Error']
  const rows = logs.map(log => [
    new Date(log.executionTime).toISOString(),
    log.status,
    log.executionDuration || '',
    log.scheduleId || 'Manual',
    log.output ? log.output.replace(/"/g, '""') : '',
    log.errorMessage ? log.errorMessage.replace(/"/g, '""') : ''
  ])
  
  const csvRows = [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  )
  
  return csvRows.join('\n')
}

// Format date and time for display
function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString()
}

// Handle backdrop click to close modal
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

// Load logs when component is mounted
onMounted(async () => {
  if (props.isOpen) {
    await refreshLogs()
  }
})

// Watch for changes to isOpen prop and refresh logs when modal is opened
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await refreshLogs()
  }
})
</script>
