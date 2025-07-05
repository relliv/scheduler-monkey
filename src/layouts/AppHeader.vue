<template>
  <header
    class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
  >
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <div
              class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
            </div>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              Scheduler-Monkey
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              TypeScript Script Scheduler
            </p>
          </div>
        </div>

        <!-- Vault and Status Info -->
        <div class="flex items-center space-x-4">
          <!-- Current Vault -->
          <div v-if="currentVault" class="flex items-center space-x-2 text-sm">
            <svg
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
            </svg>
            <span class="text-gray-600 dark:text-gray-300">{{
              currentVault.name
            }}</span>
            <button
              @click="$emit('select-vault')"
              class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              title="Change vault"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>
          </div>

          <!-- Bun Status -->
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-1">
              <div
                :class="[
                  'w-2 h-2 rounded-full',
                  bunStatus.isInstalled ? 'bg-green-500' : 'bg-red-500',
                ]"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-300">
                Bun {{ bunStatus.isInstalled ? "Ready" : "Not Installed" }}
              </span>
            </div>
            <button
              v-if="!bunStatus.isInstalled"
              @click="$emit('install-bun')"
              class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
            >
              Install Bun
            </button>
          </div>

          <!-- Actions Menu -->
          <div class="relative" ref="menuContainer">
            <button
              @click="showMenu = !showMenu"
              class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-show="showMenu"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700"
            >
              <button
                @click="selectNewVault"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Select New Vault</span>
              </button>

              <button
                @click="refreshVault"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh Files</span>
              </button>

              <div
                class="border-t border-gray-200 dark:border-gray-600 my-1"
              ></div>

              <button
                @click="openAbout"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>About</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { Vault, BunInstallationStatus } from "../shared/types";

interface Props {
  currentVault: Vault | null;
  bunStatus: BunInstallationStatus;
}

interface Emits {
  (e: "select-vault"): void;
  (e: "install-bun"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const showMenu = ref(false);
const menuContainer = ref<HTMLElement>();

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (
    menuContainer.value &&
    !menuContainer.value.contains(event.target as Node)
  ) {
    showMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Menu actions
function selectNewVault() {
  showMenu.value = false;
  emit("select-vault");
}

function refreshVault() {
  showMenu.value = false;
  // Emit event to refresh current vault
  window.electronAPI.invoke("file:scan-directory", "");
}

function openAbout() {
  showMenu.value = false;
  window.electronAPI.invoke("system:show-info-dialog", 
    "About Scheduler-Monkey",
    `Scheduler-Monkey v1.0.0\n\nA modern TypeScript script scheduler built with Electron, Vue 3, and TailwindCSS.\n\nFeatures:\n• Schedule TypeScript/JavaScript files with cron expressions\n• Bun.js integration for fast script execution\n• SQLite database with Drizzle ORM\n• Real-time logging and monitoring\n• Modern, responsive UI`
  );
}
</script>
