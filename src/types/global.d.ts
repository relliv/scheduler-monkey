import type { IpcChannels } from '../shared/types'

declare global {
  interface Window {
    electronAPI: {
      invoke: <K extends keyof IpcChannels>(
        channel: K, 
        ...args: Parameters<IpcChannels[K]>
      ) => Promise<ReturnType<IpcChannels[K]>>
      
      on: (channel: string, callback: (...args: any[]) => void) => () => void
      
      send: (channel: string, ...args: any[]) => void
    }
    
    devAPI?: {
      openDevTools: () => Promise<void>
      reloadApp: () => Promise<void>
    }
  }
}

export {}
