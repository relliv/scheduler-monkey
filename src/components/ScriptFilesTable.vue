<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
    <!-- Table Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Script Files
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ scriptFiles.length }} files •
            {{ scheduledFiles.length }} scheduled •
            {{ unscheduledFiles.length }} unscheduled
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
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ]"
          >
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="ml-1 text-xs opacity-75"
              >({{ tab.count }})</span
            >
          </button>
        </div>

        <!-- Create Script Button -->
        <button
          @click="$emit('create-script')"
          class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
        >
          <Plus class="w-4 h-4" />
          <span>Create Script</span>
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <Search class="h-5 w-5 text-gray-400" />
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
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              File
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Schedule
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Last Modified
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
        >
          <tr v-if="filteredFiles.length === 0">
            <td colspan="5" class="px-6 py-12 text-center">
              <div class="text-gray-500 dark:text-gray-400">
                <FileText class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
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
                  <div
                    class="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center"
                  >
                    <Settings class="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div class="ml-4">
                  <div
                    class="text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {{ file.name }}
                  </div>
                  <div
                    class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs"
                  >
                    {{ file.path }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Schedule Info -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div v-if="file.scheduleInfo" class="text-sm">
                <code
                  class="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs"
                >
                  {{ file.scheduleInfo.cronExpression }}
                </code>
              </div>
              <span v-else class="text-sm text-gray-500 dark:text-gray-400"
                >Not scheduled</span
              >
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
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                ]"
              >
                <div
                  :class="[
                    'w-1.5 h-1.5 rounded-full mr-1.5',
                    file.isScheduled && file.scheduleInfo?.isActive
                      ? 'bg-green-400'
                      : file.isScheduled && !file.scheduleInfo?.isActive
                        ? 'bg-yellow-400'
                        : 'bg-gray-400',
                  ]"
                ></div>
                {{
                  file.isScheduled && file.scheduleInfo?.isActive
                    ? "Running"
                    : file.isScheduled && !file.scheduleInfo?.isActive
                      ? "Paused"
                      : "Idle"
                }}
              </span>
            </td>

            <!-- Last Modified -->
            <td
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
            >
              {{ formatDate(file.lastModified) }}
            </td>

            <!-- Actions -->
            <td
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <div class="flex items-center justify-end space-x-2">
                <!-- Execute Button -->
                <button
                  @click="$emit('execute-script', file)"
                  class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Execute script"
                >
                  <Play class="w-4 h-4" />
                </button>

                <!-- Edit Script Button -->
                <button
                  @click="$emit('edit-script', file)"
                  class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  title="Edit script content"
                >
                  <Edit class="w-4 h-4" />
                </button>

                <!-- Schedule/Edit Button -->
                <button
                  v-if="!file.isScheduled"
                  @click="$emit('schedule-script', file)"
                  class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  title="Schedule script"
                >
                  <Clock class="w-4 h-4" />
                </button>

                <button
                  v-else
                  @click="$emit('edit-schedule', file)"
                  class="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                  title="Edit schedule"
                >
                  <Check class="w-4 h-4" />
                </button>
                
                <!-- Delete Button -->
                <button
                  @click="$emit('delete-script', file)"
                  class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete script"
                >
                  <Trash class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination (if needed) -->
    <div
      v-if="filteredFiles.length > 0"
      class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6"
    >
      <div class="flex-1 flex justify-between sm:hidden">
        <!-- Mobile pagination controls -->
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">
            Showing
            <span class="font-medium">{{ filteredFiles.length }}</span> of
            <span class="font-medium">{{ scriptFiles.length }}</span> files
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { ScriptFile } from "../shared/types";
import { Play, Edit, Plus, Check, Clock, Trash, Search, FileText, Settings } from "lucide-vue-next";

interface Props {
  scriptFiles: ScriptFile[];
  scheduledFiles: ScriptFile[];
  unscheduledFiles: ScriptFile[];
}

interface Emits {
  (e: "schedule-script", file: ScriptFile): void;
  (e: "execute-script", file: ScriptFile): void;
  (e: "edit-schedule", file: ScriptFile): void;
  (e: "create-script"): void;
  (e: "edit-script", file: ScriptFile): void;
  (e: "delete-script", file: ScriptFile): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const searchQuery = ref("");
const activeFilter = ref<"all" | "scheduled" | "unscheduled">("all");

// Filter tabs configuration
const filterTabs = computed(() => [
  { key: "all" as const, label: "All Files", count: props.scriptFiles.length },
  {
    key: "scheduled" as const,
    label: "Scheduled",
    count: props.scheduledFiles.length,
  },
  {
    key: "unscheduled" as const,
    label: "Unscheduled",
    count: props.unscheduledFiles.length,
  },
]);

// Filtered files based on search and active filter
const filteredFiles = computed(() => {
  let files = props.scriptFiles;

  // Apply filter
  switch (activeFilter.value) {
    case "scheduled":
      files = props.scheduledFiles;
      break;
    case "unscheduled":
      files = props.unscheduledFiles;
      break;
    default:
      files = props.scriptFiles;
  }

  // Apply search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    files = files.filter(
      (file) =>
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query)
    );
  }

  return files;
});

// Get empty state message based on current filter
function getEmptyStateMessage(): string {
  if (searchQuery.value.trim()) {
    return `No files match "${searchQuery.value}"`;
  }

  switch (activeFilter.value) {
    case "scheduled":
      return "No scheduled files found";
    case "unscheduled":
      return "No unscheduled files found";
    default:
      return "No script files found in this vault";
  }
}

// Format date for display
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString();
}
</script>
