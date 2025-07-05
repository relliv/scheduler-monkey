<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
        <span class="text-gray-700 dark:text-gray-200">Loading...</span>
      </div>
    </div>

    <!-- Error Toast -->
    <div
      v-if="error"
      class="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-40 flex items-center space-x-2"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{{ error }}</span>
      <button @click="clearError" class="ml-2 hover:bg-red-600 rounded p-1">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <!-- Main Layout -->
    <div class="flex flex-col h-screen">
      <!-- Header -->
      <AppHeader
        :current-vault="currentVault"
        :bun-status="bunStatus"
        @select-vault="selectVault"
        @install-bun="openBunInstallModal"
      />

      <!-- Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar -->
        <AppSidebar
          :schedules="schedules"
          :active-schedules="activeSchedules"
          @view-logs="openLogsModal"
        />

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto p-6" v-if="!isLoading">
          <!-- Vault Not Selected State -->
          <div
            v-if="!currentVault"
            class="flex flex-col items-center justify-center h-full text-center"
          >
            <div class="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md">
              <div class="mb-4">
                <svg
                  class="w-16 h-16 mx-auto text-gray-400"
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
              </div>
              <h2
                class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
              >
                Welcome to Scheduler-Monkey
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Select a vault directory to get started with script scheduling.
              </p>
              <button
                @click="selectInitialVault"
                class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Select Vault Directory
              </button>
            </div>
          </div>

          <!-- Script Files Table -->
          <ScriptFilesTable
            v-else
            :script-files="scriptFiles"
            :scheduled-files="scheduledFiles"
            :unscheduled-files="unscheduledFiles"
            @schedule-script="openScheduleModal"
            @execute-script="executeScript"
            @edit-schedule="editSchedule"
            @create-script="openScriptModal"
            @edit-script="editScript"
          />
        </main>
      </div>
    </div>

    <!-- Modals -->
    <ScheduleModal
      :is-open="scheduleModal.isOpen"
      :script-file="scheduleModal.scriptFile"
      :existing-schedule="scheduleModal.existingSchedule"
      @close="closeScheduleModal"
      @save="handleScheduleSave"
    />

    <LogsModal
      :is-open="logsModal.isOpen"
      :schedule="logsModal.schedule"
      @close="closeLogsModal"
    />

    <BunInstallModal
      :is-open="bunInstallModal.isOpen"
      :is-installing="bunInstallModal.isInstalling"
      :installation-progress="bunInstallModal.installationProgress"
      @close="closeBunInstallModal"
      @install="installBun"
    />

    <ScriptModal
      :is-open="scriptModal.isOpen"
      :script-file="scriptModal.scriptFile"
      @close="closeScriptModal"
      @save="handleScriptSave"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "./stores/app";
import AppHeader from "./components/AppHeader.vue";
import AppSidebar from "./components/AppSidebar.vue";
import ScriptFilesTable from "./components/ScriptFilesTable.vue";
import ScheduleModal from "./components/ScheduleModal.vue";
import LogsModal from "./components/LogsModal.vue";
import BunInstallModal from "./components/BunInstallModal.vue";
import ScriptModal from "./components/ScriptModal.vue";
import type { ScriptFile, Schedule } from "./shared/types";

const store = useAppStore();

const {
  currentVault,
  scriptFiles,
  schedules,
  isLoading,
  error,
  scheduleModal,
  logsModal,
  bunInstallModal,
  scriptModal,
  bunStatus,
  scheduledFiles,
  unscheduledFiles,
  activeSchedules,
} = storeToRefs(store);

const {
  initializeApp,
  selectInitialVault,
  selectVault,
  executeScript,
  createSchedule,
  updateSchedule,
  openScheduleModal,
  closeScheduleModal,
  openLogsModal,
  closeLogsModal,
  openBunInstallModal,
  closeBunInstallModal,
  installBun,
  clearError,
} = store;

// Initialize app on mount
onMounted(() => {
  initializeApp();
  
  // Add window focus event listener to refresh logs
  window.addEventListener('focus', handleWindowFocus);
});

// Remove event listeners on unmount
onBeforeUnmount(() => {
  window.removeEventListener('focus', handleWindowFocus);
});

// Handle window focus event
async function handleWindowFocus() {
  try {
    // Refresh log count
    await store.loadLogs();
    
    // If logs modal is open, refresh its content
    if (logsModal.value.isOpen) {
      await store.loadLogs(logsModal.value.schedule?.id);
    }
  } catch (err) {
    console.error('Failed to refresh logs on window focus:', err);
  }
}

// Handle schedule save (create or update)
async function handleScheduleSave(scheduleData: {
  scriptFile: ScriptFile;
  cronExpression: string;
  isActive: boolean;
}) {
  try {
    if (scheduleModal.value.existingSchedule) {
      // Update existing schedule
      await updateSchedule(scheduleModal.value.existingSchedule.id, {
        cronExpression: scheduleData.cronExpression,
        isActive: scheduleData.isActive,
      });
    } else {
      // Create new schedule
      await createSchedule(scheduleData);
    }
    closeScheduleModal();
  } catch (err) {
    console.error("Failed to save schedule:", err);
  }
}

// Handle edit schedule
function editSchedule(scriptFile: ScriptFile) {
  const existingSchedule = schedules.value.find(
    (s) => s.filePath === scriptFile.fullPath
  );
  openScheduleModal(scriptFile, existingSchedule);
}

// Handle script creation
function openScriptModal() {
  store.openScriptModal(null);
}

// Handle script editing
function editScript(scriptFile: ScriptFile) {
  store.openScriptModal(scriptFile);
}

// Handle script save (create or update)
async function handleScriptSave(fileData: {
  name: string;
  content: string;
  type: string;
}) {
  try {
    if (scriptModal.value.scriptFile) {
      // Update existing script file
      await window.electronAPI.invoke("file:write", {
        path: scriptModal.value.scriptFile.fullPath,
        content: fileData.content,
      });
    } else {
      // Create new script file
      const path = currentVault.value?.path || "";
      const fullPath = `${path}/${fileData.name}`;

      await window.electronAPI.invoke("file:write", {
        path: fullPath,
        content: fileData.content,
      });
    }

    // Refresh script files
    if (currentVault.value) {
      await store.scanVaultDirectory(currentVault.value.path);
    }

    closeScriptModal();
  } catch (err) {
    console.error("Failed to save script:", err);
  }
}

// Close script modal
function closeScriptModal() {
  store.closeScriptModal();
}
</script>
