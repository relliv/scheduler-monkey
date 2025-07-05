<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click="handleBackdropClick"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              {{ existingSchedule ? 'Edit Schedule' : 'Create Schedule' }}
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Script File Info -->
          <div v-if="scriptFile" class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ scriptFile.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ scriptFile.relativePath }}</p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Cron Expression -->
            <div>
              <label for="cronExpression" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cron Expression
              </label>
              <div class="space-y-2">
                <input
                  id="cronExpression"
                  v-model="form.cronExpression"
                  type="text"
                  placeholder="0 */5 * * * *"
                  class="block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :class="{ 'border-red-500': errors.cronExpression }"
                />
                <p v-if="errors.cronExpression" class="text-sm text-red-600 dark:text-red-400">
                  {{ errors.cronExpression }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Format: second minute hour day month dayOfWeek
                </p>
              </div>
            </div>

            <!-- Quick Presets -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Presets
              </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="preset in cronPresets"
                  :key="preset.value"
                  type="button"
                  @click="form.cronExpression = preset.value"
                  class="text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-left"
                >
                  <div class="font-medium">{{ preset.label }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ preset.description }}</div>
                </button>
              </div>
            </div>

            <!-- Cron Preview -->
            <div v-if="form.cronExpression" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="text-sm text-blue-800 dark:text-blue-200">
                <strong>Preview:</strong> {{ getCronDescription(form.cronExpression) }}
              </div>
              <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Next runs: {{ getNextRuns(form.cronExpression).join(', ') }}
              </div>
            </div>

            <!-- Active Toggle -->
            <div class="flex items-center justify-between">
              <div>
                <label for="isActive" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Schedule Immediately
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  The schedule will begin running as soon as it's saved
                </p>
              </div>
              <button
                id="isActive"
                type="button"
                @click="form.isActive = !form.isActive"
                :class="[
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  form.isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    form.isActive ? 'translate-x-5' : 'translate-x-0'
                  ]"
                ></span>
              </button>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="handleSubmit"
            :disabled="!form.cronExpression || !!errors.cronExpression"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ existingSchedule ? 'Update Schedule' : 'Create Schedule' }}
          </button>
          <button
            @click="$emit('close')"
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { ScriptFile, Schedule } from '../shared/types'

interface Props {
  isOpen: boolean
  scriptFile: ScriptFile | null
  existingSchedule?: Schedule
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: { scriptFile: ScriptFile; cronExpression: string; isActive: boolean }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const form = reactive({
  cronExpression: '',
  isActive: true
})

// Form errors
const errors = reactive({
  cronExpression: ''
})

// Cron presets
const cronPresets = [
  { label: 'Every minute', value: '0 * * * * *', description: 'Runs every minute' },
  { label: 'Every 5 minutes', value: '0 */5 * * * *', description: 'Runs every 5 minutes' },
  { label: 'Every hour', value: '0 0 * * * *', description: 'Runs at the top of every hour' },
  { label: 'Daily at 9 AM', value: '0 0 9 * * *', description: 'Runs every day at 9:00 AM' },
  { label: 'Weekly on Monday', value: '0 0 9 * * 1', description: 'Runs every Monday at 9:00 AM' },
  { label: 'Monthly', value: '0 0 9 1 * *', description: 'Runs on the 1st of each month at 9:00 AM' }
]

// Watch for prop changes to initialize form
watch(() => props.existingSchedule, (schedule) => {
  if (schedule) {
    form.cronExpression = schedule.cronExpression
    form.isActive = schedule.isActive
  } else {
    // Reset form for new schedule
    form.cronExpression = ''
    form.isActive = true
  }
}, { immediate: true })

// Watch cron expression for validation
watch(() => form.cronExpression, (value) => {
  validateCronExpression(value)
})

// Validate cron expression
function validateCronExpression(expression: string) {
  if (!expression.trim()) {
    errors.cronExpression = 'Cron expression is required'
    return false
  }

  // Basic validation - should have 6 parts for node-cron
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 6) {
    errors.cronExpression = 'Cron expression must have 6 parts (second minute hour day month dayOfWeek)'
    return false
  }

  // Clear error if validation passes
  errors.cronExpression = ''
  return true
}

// Get human-readable cron description (simplified)
function getCronDescription(expression: string): string {
  if (!expression) return ''
  
  // This is a simplified implementation
  // In a real app, you'd use a library like cronstrue
  const parts = expression.split(' ')
  if (parts.length !== 6) return 'Invalid expression'
  
  const [second, minute, hour, day, month, dayOfWeek] = parts
  
  if (minute === '*' && hour === '*') {
    return 'Every minute'
  } else if (hour === '*') {
    return `Every ${minute === '0' ? 'hour' : `${minute} minutes past the hour`}`
  } else if (day === '*' && month === '*' && dayOfWeek === '*') {
    return `Daily at ${hour}:${minute.padStart(2, '0')}`
  }
  
  return 'Custom schedule'
}

// Get next few run times (simplified)
function getNextRuns(expression: string): string[] {
  if (!expression) return []
  
  // Simplified implementation - in reality you'd calculate actual next runs
  const now = new Date()
  const runs = []
  
  for (let i = 1; i <= 3; i++) {
    const nextRun = new Date(now.getTime() + (i * 60000)) // Add minutes for demo
    runs.push(nextRun.toLocaleTimeString())
  }
  
  return runs
}

// Handle form submission
function handleSubmit() {
  if (!props.scriptFile) return
  
  if (!validateCronExpression(form.cronExpression)) {
    return
  }

  emit('save', {
    scriptFile: props.scriptFile,
    cronExpression: form.cronExpression,
    isActive: form.isActive
  })
}

// Handle backdrop click to close modal
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>
