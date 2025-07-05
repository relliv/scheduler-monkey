/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const vueComponent: DefineComponent<{}, {}, any>
  export default vueComponent
}

// Additional environment variables can be declared here
// These augment the existing ImportMeta interface from Vite
