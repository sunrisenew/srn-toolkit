import { Options } from 'globby'

export function useNodePath() {
  return window.api.path
}

export function useCreateBrowserWindow(channel, options?: Record<string, unknown>) {
  return window.electron.ipcRenderer.invoke(channel, options)
}

export function useOpenFileDialog(options?: Record<string, unknown>) {
  return window.electron.ipcRenderer.invoke('dialog:openFile', options)
}

export function useOpenFilesDialog(options?: Record<string, unknown>) {
  return window.electron.ipcRenderer.invoke('dialog:openFiles', options)
}

export function useOpenDirectoryDialog(options?: Record<string, unknown>) {
  return window.electron.ipcRenderer.invoke('dialog:openDirectory', options)
}

export function useOpenDirectoriesDialog(options?: Record<string, unknown>) {
  return window.electron.ipcRenderer.invoke('dialog:openDirectories', options)
}

export function useOpenFilesAndDirectoriesDialog(options?: Record<string, unknown>) {
  return window.electron.ipcRenderer.invoke('dialog:openFilesAndDirectories', options)
}

export function useLoadSetting(name: string) {
  return window.electron.ipcRenderer.invoke('setting:loadSetting', name)
}

export function useSaveSetting(name: string, setting: Record<string, unknown>) {
  return window.electron.ipcRenderer.invoke('setting:saveSetting', name, JSON.parse(JSON.stringify(setting)))
}

export function useShowSettingFileInFolder(name: string) {
  return window.electron.ipcRenderer.invoke('setting:showSettingFileInFolder', name)
}

export function useShowItemInFolder(fullPath: string, showFolder = true) {
  return window.electron.ipcRenderer.invoke('shell:showItemInFolder', fullPath, showFolder)
}

export function useCopyFile(source: string, target: string) {
  return window.electron.ipcRenderer.invoke('file:copyFile', source, target)
}

export function useReadJsonFile(filePath: string) {
  return window.electron.ipcRenderer.invoke('file:readJsonFile', filePath)
}

export function useWriteFile(filePath: string, content: string) {
  return window.electron.ipcRenderer.invoke('file:writeFile', filePath, content)
}

export function useWriteJsonFile(filePath: string, content: Record<string, unknown>) {
  return window.electron.ipcRenderer.invoke('file:writeFile', filePath, JSON.stringify(content, undefined, 2))
}

export function useGlobby(patterns: string | readonly string[], options?: Options) {
  return window.electron.ipcRenderer.invoke('file:globby', patterns, options)
}

export function useDeleteDirectory(direcroty: string) {
  return window.electron.ipcRenderer.invoke('directory:deleteDirectory', direcroty)
}

export function useTestArchive(customSevenZip: string | undefined, archiveFilePath: string, filePaths: string[]) {
  return window.electron.ipcRenderer.invoke('archive:testArchive', customSevenZip, archiveFilePath, filePaths)
}

export function useExtractFullArchive(customSevenZip: string | undefined, archiveFilePath: string, destDirectory: string, filePaths: string[]) {
  return window.electron.ipcRenderer.invoke('archive:extractFullArchive', customSevenZip, archiveFilePath, destDirectory, filePaths)
}

export function useAddArchive(customSevenZip: string | undefined, archiveFilePath: string, workDirectory: string, filePaths: string[]) {
  return window.electron.ipcRenderer.invoke('archive:addArchive', customSevenZip, archiveFilePath, workDirectory, filePaths)
}

export function useDeleteArchive(customSevenZip: string | undefined, archiveFilePath: string, filePaths: string[]) {
  return window.electron.ipcRenderer.invoke('archive:deleteArchive', customSevenZip, archiveFilePath, filePaths)
}
