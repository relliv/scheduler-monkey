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
        <div class="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <!-- Bun.js Logo/Icon -->
              <div class="flex-shrink-0 h-10 w-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Circle class="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  {{ getTitle() }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ getSubtitle() }}
                </p>
              </div>
            </div>
            <button
              v-if="!isInstalling"
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X class="w-6 h-6" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 pb-6">
          <!-- Installation Status -->
          <div v-if="installationStatus === 'checking'" class="text-center py-8">
            <div class="animate-spin mx-auto h-8 w-8 text-blue-600 dark:text-blue-400 mb-4">
              <Loader class="w-full h-full" />
            </div>
            <p class="text-gray-600 dark:text-gray-400">Checking Bun.js installation...</p>
          </div>

          <!-- Not Installed - Installation Prompt -->
          <div v-else-if="installationStatus === 'not-installed'" class="space-y-6">
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <AlertTriangle class="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 class="text-sm font-medium text-yellow-800 dark:text-yellow-400">Bun.js Not Found</h4>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Bun.js is required to execute your TypeScript and JavaScript scripts. Would you like to install it now?
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">What is Bun.js?</h4>
                <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li class="flex items-start space-x-2">
                    <span class="text-green-500 mt-1">•</span>
                    <span>Fast JavaScript runtime, bundler, and package manager</span>
                  </li>
                  <li class="flex items-start space-x-2">
                    <span class="text-green-500 mt-1">•</span>
                    <span>Native TypeScript support without transpilation</span>
                  </li>
                  <li class="flex items-start space-x-2">
                    <span class="text-green-500 mt-1">•</span>
                    <span>Significantly faster than Node.js for most use cases</span>
                  </li>
                </ul>
              </div>

              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Installation method:</strong> Downloaded directly from official GitHub releases
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  No system package managers or admin rights required
                </p>
              </div>
            </div>
          </div>

          <!-- Installing -->
          <div v-else-if="installationStatus === 'installing'" class="space-y-6">
            <div class="text-center">
              <div class="animate-spin mx-auto h-8 w-8 text-blue-600 dark:text-blue-400 mb-4">
                <Loader class="w-full h-full" />
              </div>
              <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Installing Bun.js</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">Please wait while we download and install Bun.js...</p>
            </div>

            <!-- Progress Bar -->
            <div class="space-y-2">
              <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{{ currentStep || 'Preparing...' }}</span>
                <span v-if="installProgress > 0">{{ installProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  class="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
                  :style="{ width: `${installProgress}%` }"
                ></div>
              </div>
            </div>

            <!-- Installation Log -->
            <div v-if="installLog.length > 0" class="bg-gray-900 dark:bg-gray-950 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div v-for="(line, index) in installLog" :key="index" class="text-xs text-green-400 font-mono">
                {{ line }}
              </div>
            </div>
          </div>

          <!-- Installation Success -->
          <div v-else-if="installationStatus === 'installed'" class="text-center py-8">
            <div class="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <Check class="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Installation Complete!</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Bun.js has been successfully installed and is ready to use.
            </p>
            <div v-if="bunVersion" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p class="text-sm text-green-800 dark:text-green-400">
                <strong>Version:</strong> {{ bunVersion }}
              </p>
            </div>
          </div>

          <!-- Installation Error -->
          <div v-else-if="installationStatus === 'error'" class="space-y-4">
            <div class="text-center">
              <div class="mx-auto h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <X class="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Installation Failed</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                We encountered an error while installing Bun.js.
              </p>
            </div>

            <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h5 class="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Error Details:</h5>
              <pre class="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">{{ errorMessage }}</pre>
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h5 class="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">Manual Installation:</h5>
              <p class="text-sm text-blue-700 dark:text-blue-300 mb-2">
                You can install Bun.js manually by running this command in your terminal:
              </p>
              <code class="block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs p-2 rounded font-mono">
                curl -fsSL https://bun.sh/install | bash
              </code>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-700 px-6 py-3 sm:flex sm:flex-row-reverse">
          <button
            v-if="installationStatus === 'not-installed'"
            @click="handleInstall"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            Install Bun.js
          </button>
          
          <button
            v-else-if="installationStatus === 'installed'"
            @click="$emit('close')"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            Continue
          </button>
          
          <button
            v-else-if="installationStatus === 'error'"
            @click="handleRetry"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            Retry Installation
          </button>

          <button
            v-if="!isInstalling && installationStatus !== 'checking'"
            @click="$emit('close')"
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            {{ installationStatus === 'not-installed' ? 'Skip' : 'Close' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Circle, X, Loader, AlertTriangle, Check, RotateCcw } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  installationStatus: 'checking' | 'not-installed' | 'installing' | 'installed' | 'error'
  currentStep?: string
  installProgress?: number
  installLog?: string[]
  bunVersion?: string
  errorMessage?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'install'): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<Props>(), {
  installProgress: 0,
  installLog: () => [],
  currentStep: '',
  bunVersion: '',
  errorMessage: ''
})

const emit = defineEmits<Emits>()

// Computed properties
const isInstalling = computed(() => 
  props.installationStatus === 'installing' || props.installationStatus === 'checking'
)

// Get modal title based on status
function getTitle(): string {
  switch (props.installationStatus) {
    case 'checking':
      return 'Checking Bun.js'
    case 'not-installed':
      return 'Install Bun.js'
    case 'installing':
      return 'Installing Bun.js'
    case 'installed':
      return 'Bun.js Ready'
    case 'error':
      return 'Installation Failed'
    default:
      return 'Bun.js Setup'
  }
}

// Get modal subtitle based on status
function getSubtitle(): string {
  switch (props.installationStatus) {
    case 'checking':
      return 'Verifying installation status...'
    case 'not-installed':
      return 'Fast JavaScript runtime for your scripts'
    case 'installing':
      return 'This may take a few minutes'
    case 'installed':
      return 'You can now execute scripts with Bun.js'
    case 'error':
      return 'Something went wrong during installation'
    default:
      return ''
  }
}

// Handle install button click
function handleInstall() {
  emit('install')
}

// Handle retry button click
function handleRetry() {
  emit('retry')
}

// Handle backdrop click to close modal (only if not installing)
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget && !isInstalling.value) {
    emit('close')
  }
}
</script>
