<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
    <!-- Table Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Script Files</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ scriptFiles.length }} files • {{ scheduledFiles.length }} scheduled • {{ unscheduledFiles.length }} unscheduled
          </p>
        </div>
        
        <!-- Filter Tabs -->
        <div class="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            @click="activeFilter = tab.key"
            :class="[
              'px-3 py-1 text-sm font-medium rounded-md transition-colors',
              activeFilter === tab.key
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            ]"
          >
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="ml-1 text-xs opacity-75">({{ tab.count }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search script files..."
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>

    <!-- Table Content -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              File
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Schedule
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Last Modified
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="filteredFiles.length === 0">
            <td colspan="5" class="px-6 py-12 text-center">
              <div class="text-gray-500 dark:text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-sm">{{ getEmptyStateMessage() }}</p>
              </div>
            </td>
          </tr>
          
          <tr 
            v-for="file in filteredFiles" 
            :key="file.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <!-- File Info -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-8 w-8">
                  <div class="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <svg class="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ file.name }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                    {{ file.relativePath }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Schedule Info -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div v-if="file.scheduleInfo" class="text-sm">
                <code class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs">
                  {{ file.scheduleInfo.cronExpression }}
                </code>
              </div>
              <span v-else class="text-sm text-gray-500 dark:text-gray-400">Not scheduled</span>
            </td>

            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  file.isScheduled && file.scheduleInfo?.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : file.isScheduled && !file.scheduleInfo?.isActive
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                ]"
              >
                <div 
                  :class="[
                    'w-1.5 h-1.5 rounded-full mr-1.5',
                    file.isScheduled && file.scheduleInfo?.isActive
                      ? 'bg-green-400'
                      : file.isScheduled && !file.scheduleInfo?.isActive
                      ? 'bg-yellow-400'
                      : 'bg-gray-400'
                  ]"
                ></div>
                {{ 
                  file.isScheduled && file.scheduleInfo?.isActive
                    ? 'Running'
                    : file.isScheduled && !file.scheduleInfo?.isActive
                    ? 'Paused'
                    : 'Idle'
                }}
              </span>
            </td>

            <!-- Last Modified -->
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(file.lastModified) }}
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <!-- Execute Button -->
                <button
                  @click="$emit('execute-script', file)"
                  class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Execute script"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>

                <!-- Schedule/Edit Button -->
                <button
                  v-if="!file.isScheduled"
                  @click="$emit('schedule-script', file)"
                  class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  title="Schedule script"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                
                <button
                  v-else
                  @click="$emit('edit-schedule', file)"
                  class="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                  title="Edit schedule"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination (if needed) -->
    <div v-if="filteredFiles.length > 0" class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        <!-- Mobile pagination controls -->
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Showing <span class="font-medium">{{ filteredFiles.length }}</span> of <span class="font-medium">{{ scriptFiles.length }}</span> files
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ScriptFile } from '../shared/types'

interface Props {
  scriptFiles: ScriptFile[]
  scheduledFiles: ScriptFile[]
  unscheduledFiles: ScriptFile[]
}

interface Emits {
  (e: 'schedule-script', file: ScriptFile): void
  (e: 'execute-script', file: ScriptFile): void
  (e: 'edit-schedule', file: ScriptFile): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const searchQuery = ref('')
const activeFilter = ref<'all' | 'scheduled' | 'unscheduled'>('all')

// Filter tabs configuration
const filterTabs = computed(() => [
  { key: 'all' as const, label: 'All Files', count: props.scriptFiles.length },
  { key: 'scheduled' as const, label: 'Scheduled', count: props.scheduledFiles.length },
  { key: 'unscheduled' as const, label: 'Unscheduled', count: props.unscheduledFiles.length }
])

// Filtered files based on search and active filter
const filteredFiles = computed(() => {
  let files = props.scriptFiles

  // Apply filter
  switch (activeFilter.value) {
    case 'scheduled':
      files = props.scheduledFiles
      break
    case 'unscheduled':
      files = props.unscheduledFiles
      break
    default:
      files = props.scriptFiles
  }

  // Apply search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    files = files.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.relativePath.toLowerCase().includes(query)
    )
  }

  return files
})

// Get empty state message based on current filter
function getEmptyStateMessage(): string {
  if (searchQuery.value.trim()) {
    return `No files match "${searchQuery.value}"`
  }
  
  switch (activeFilter.value) {
    case 'scheduled':
      return 'No scheduled files found'
    case 'unscheduled':
      return 'No unscheduled files found'
    default:
      return 'No script files found in this vault'
  }
}

// Format date for display
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString()
}
</script>
