<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click="handleBackdropClick"
  >
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
      ></div>

      <!-- Modal panel -->
      <div
        class="flex flex-col mx-auto max-h-[80vh] sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full rounded-lg text-left overflow-hidden shadow-xl transform transition-all bg-white dark:bg-gray-800"
      >
        <!-- Header -->
        <div
          class="bg-white dark:bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
        >
          <div class="flex items-center space-x-2 mb-4 w-full">
            <div>
              <h3
                class="text-lg leading-6 font-medium text-gray-900 dark:text-white"
              >
                {{ scriptFile ? "Edit Script" : "Create New Script" }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ scriptFile ? scriptFile.path : "Create a new script file" }}
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- File Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                for="fileName"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                File Name
              </label>
              <div class="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="fileName"
                  v-model="fileName"
                  placeholder="script-name.js"
                  class="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="!!scriptFile"
                />
              </div>
              <p
                v-if="!fileName && showValidation"
                class="mt-1 text-sm text-red-600 dark:text-red-400"
              >
                File name is required
              </p>
            </div>

            <div>
              <label
                for="scriptType"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Script Type
              </label>
              <div class="mt-1">
                <select
                  id="scriptType"
                  v-model="scriptType"
                  class="block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :disabled="!!scriptFile"
                >
                  <option value="js">JavaScript (.js)</option>
                  <option value="ts">TypeScript (.ts)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Editor Content -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <div ref="editorContainer" class="w-full h-[500px]"></div>
        </div>

        <!-- Footer -->
        <div
          class="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-between items-center flex-shrink-0"
        >
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ editorStatus }}
          </div>
          <div class="flex space-x-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white text-sm rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveScript"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
              :disabled="isSaving"
            >
              {{ isSaving ? "Saving..." : scriptFile ? "Update" : "Create" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import * as monaco from "monaco-editor";
import type { ScriptFile } from "../shared/types";

interface Props {
  isOpen: boolean;
  scriptFile: ScriptFile | null;
}

interface Emits {
  (e: "close"): void;
  (e: "save", fileData: { name: string; content: string; type: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const fileName = ref("");
const scriptType = ref("js");
const editorContent = ref("");
const editorContainer = ref<HTMLElement | null>(null);
const isSaving = ref(false);
const showValidation = ref(false);
const editorStatus = ref("Ready");

let editor: monaco.editor.IStandaloneCodeEditor | null = null;

// Initialize editor when component is mounted
onMounted(async () => {
  await nextTick();
  if (editorContainer.value) {
    initializeEditor();
  }
});

// Clean up editor when component is unmounted
onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});

// Watch for changes in the scriptFile prop
watch(
  () => props.scriptFile,
  (newFile) => {
    if (newFile) {
      fileName.value = newFile.name;
      scriptType.value = newFile.name.endsWith(".ts") ? "ts" : "js";

      // Load file content
      loadFileContent(newFile);
    } else {
      fileName.value = "";
      scriptType.value = "js";
      editorContent.value = getDefaultTemplate();

      // Update editor content if it exists
      if (editor) {
        editor.setValue(editorContent.value);
      }
    }
  },
  { immediate: true }
);

// Watch for changes in the isOpen prop
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      if (!editor && editorContainer.value) {
        initializeEditor();
      }
    }
  }
);

// Initialize Monaco Editor
function initializeEditor() {
  if (!editorContainer.value) return;

  // Set editor theme based on system preference
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  monaco.editor.defineTheme("custom-theme", {
    base: isDarkMode ? "vs-dark" : "vs",
    inherit: true,
    rules: [],
    colors: {},
  });

  // Create editor instance
  editor = monaco.editor.create(editorContainer.value, {
    value: props.scriptFile ? "" : getDefaultTemplate(),
    language: scriptType.value === "ts" ? "typescript" : "javascript",
    theme: "custom-theme",
    automaticLayout: true,
    minimap: {
      enabled: true,
    },
    scrollBeyondLastLine: false,
    lineNumbers: "on",
    renderLineHighlight: "all",
    tabSize: 2,
    wordWrap: "on",
  });

  // Update editor content when scriptType changes
  watch(scriptType, (newType) => {
    if (editor) {
      monaco.editor.setModelLanguage(
        editor.getModel()!,
        newType === "ts" ? "typescript" : "javascript"
      );
    }
  });

  // Load content if scriptFile is provided
  if (props.scriptFile) {
    loadFileContent(props.scriptFile);
  }

  // Set up change event listener
  editor.onDidChangeModelContent(() => {
    if (editor) {
      editorContent.value = editor.getValue();
    }
  });
}

// Load file content
async function loadFileContent(file: ScriptFile) {
  try {
    editorStatus.value = "Loading file content...";
    // Read file content using the appropriate IPC channel
    const content = (await window.electronAPI.invoke(
      "file:read",
      file.fullPath
    )) as string;
    editorContent.value = content || "// Unable to read file content";

    if (editor) {
      editor.setValue(content || "// Unable to read file content");
    }

    editorStatus.value = "Ready";
  } catch (error) {
    console.error("Failed to load file content:", error);
    editorStatus.value = "Failed to load file content";
  }
}

// Save script
async function saveScript() {
  if (!fileName.value.trim()) {
    showValidation.value = true;
    return;
  }

  try {
    isSaving.value = true;
    editorStatus.value = "Saving...";

    // Get current content from editor
    const content = editor ? editor.getValue() : editorContent.value;

    // Ensure file has correct extension
    let name = fileName.value;
    if (!name.endsWith(`.${scriptType.value}`)) {
      name = `${name}.${scriptType.value}`;
    }

    // Emit save event with file data
    emit("save", {
      name,
      content,
      type: scriptType.value,
    });

    isSaving.value = false;
    editorStatus.value = "Saved successfully";
  } catch (error) {
    console.error("Failed to save script:", error);
    isSaving.value = false;
    editorStatus.value = "Failed to save";
  }
}

// Get default template based on script type
function getDefaultTemplate(): string {
  if (scriptType.value === "ts") {
    return `/**
 * TypeScript Script
 * 
 * This script will be executed according to its schedule.
 */

// Your code here
const main = async (): Promise<void> => {
  console.log('Script executed at:', new Date().toISOString());
  
  // Add your code here
};

// Execute the main function
main()
  .then(() => console.log('Script completed successfully'))
  .catch((error) => console.error('Script failed:', error));
`;
  } else {
    return `/**
 * JavaScript Script
 * 
 * This script will be executed according to its schedule.
 */

// Your code here
const main = async () => {
  console.log('Script executed at:', new Date().toISOString());
  
  // Add your code here
};

// Execute the main function
main()
  .then(() => console.log('Script completed successfully'))
  .catch((error) => console.error('Script failed:', error));
`;
  }
}

// Handle backdrop click to close modal
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit("close");
  }
}
</script>
