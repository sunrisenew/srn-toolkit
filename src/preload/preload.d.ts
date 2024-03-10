import { ElectronAPI } from '@electron-toolkit/preload'
import { PlatformPath } from 'path'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      path: PlatformPath
    }
  }
}
