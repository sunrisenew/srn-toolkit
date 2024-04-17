import sevenZip from '@resources/binaries/7z/7z.exe?asset&asarUnpack'
import spawn from 'cross-spawn'
import { app, BrowserWindow, dialog, ipcMain, OpenDialogOptions, shell } from 'electron'
import electronServe from 'electron-serve'
import { globby, Options } from 'globby'
import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

export function registerCreateDocsBrowserWindowEvent() {
  const loadURL = electronServe({
    directory: 'out/docs'
  })

  ipcMain.handle('docs-window:create', () => {
    // Create the browser window.
    const browserWindow = new BrowserWindow({
      minWidth: 1600,
      minHeight: 900,
      center: true,
      show: false,
      simpleFullscreen: true,
      autoHideMenuBar: true,
      ...(process.platform === 'linux'
        ? {
          icon: path.join(__dirname, '../../../build/icon.png')
        }
        : {}),
      webPreferences: {
        sandbox: false
      }
    })

    browserWindow.on('ready-to-show', () => {
      browserWindow.maximize()
      browserWindow.show()
    })

    browserWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    loadURL(browserWindow)
  })
}

export function registerIpcMainEvents() {
  registerGetAppVersion()
  registerGetModuleTempPath()
  registerOpenFileEvent()
  registerOpenFilesEvent()
  registerOpenDirectoryEvent()
  registerOpenDirectoriesEvent()
  registerOpenFilesAndDirectoriesEvent()
  registerLoadSetting()
  registerSaveSetting()
  registerShowSettingFileInFolder()
  registerShowItemInFolder()
  registerCopyFile()
  registerReadJsonFile()
  registerWriteFile()
  registerGlobby()
  registerDeleteDirectory()
  registerTestArchive()
  registerExtractFullArchive()
  registerAddArchive()
  registerDeleteArchive()
}

function registerGetAppVersion() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ipcMain.handle('app:getVersion', event => {
    return app.getVersion()
  })
}

function registerGetModuleTempPath() {
  ipcMain.handle('app:getModuleTempPath', async (event, moduleName: string) => {
    const appTempPath = app.getPath('temp')
    const moduleTempPath = path.join(appTempPath, moduleName)
    await mkdir(moduleTempPath, {
      recursive: true
    })
    return moduleTempPath
  })
}

function registerOpenFileEvent() {
  ipcMain.handle('dialog:openFile', (event, options: OpenDialogOptions) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)!
    return dialog.showOpenDialog(browserWindow, Object.assign(options, {
      properties: ['openFile']
    }))
  })
}

function registerOpenFilesEvent() {
  ipcMain.handle('dialog:openFiles', (event, options: OpenDialogOptions) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)!
    return dialog.showOpenDialog(browserWindow, Object.assign(options, {
      properties: ['openFile', 'multiSelections']
    }))
  })
}

function registerOpenDirectoryEvent() {
  ipcMain.handle('dialog:openDirectory', (event, options: OpenDialogOptions) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)!
    return dialog.showOpenDialog(browserWindow, Object.assign(options, {
      properties: ['openDirectory']
    }))
  })
}

function registerOpenDirectoriesEvent() {
  ipcMain.handle('dialog:openDirectories', (event, options: OpenDialogOptions) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)!
    return dialog.showOpenDialog(browserWindow, Object.assign(options, {
      properties: ['openDirectory', 'multiSelections']
    }))
  })
}

function registerOpenFilesAndDirectoriesEvent() {
  ipcMain.handle('dialog:openFilesAndDirectories', (event, options: OpenDialogOptions) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender)!
    return dialog.showOpenDialog(browserWindow, Object.assign(options, {
      properties: ['openFile', 'openDirectory', 'multiSelections']
    }))
  })
}

function registerLoadSetting() {
  ipcMain.handle('setting:loadSetting', async (event, name: string) => {
    const settingFilePath = path.join(app.getPath('userData'), 'settings', `${name}.json`)

    try {
      await access(settingFilePath)
    } catch (error) {
      return undefined
    }

    return readFile(settingFilePath, 'utf-8').then(setting => {
      if (setting) {
        return JSON.parse(setting)
      }

      return undefined
    }).catch(error => Promise.reject(new Error(`文件读取错误 | ${settingFilePath}`, { cause: error })))
  })
}

function registerSaveSetting() {
  ipcMain.handle('setting:saveSetting', async (event, name: string, setting: Record<string, unknown>) => {
    const settingFilePath = path.join(app.getPath('userData'), 'settings', `${name}.json`)

    await mkdir(path.dirname(settingFilePath), {
      recursive: true
    })

    return writeFile(settingFilePath, JSON.stringify(setting, undefined, 2), 'utf-8').catch(error => Promise.reject(new Error(`文件写入错误 | ${settingFilePath}`, { cause: error })))
  })
}

function registerShowSettingFileInFolder() {
  ipcMain.handle('setting:showSettingFileInFolder', async (event, name: string) => {
    const settingFilePath = path.join(app.getPath('userData'), 'settings', `${name}.json`)
    try {
      await access(settingFilePath)
    } catch (error) {
      shell.showItemInFolder(path.dirname(settingFilePath))
      return
    }

    shell.showItemInFolder(settingFilePath)
  })
}

function registerShowItemInFolder() {
  ipcMain.handle('shell:showItemInFolder', async (event, fullPath: string, showFolder = true) => {
    if (showFolder) {
      try {
        await access(path.resolve(fullPath))
      } catch (error) {
        shell.showItemInFolder(path.dirname(fullPath))
        return
      }
    }

    shell.showItemInFolder(path.resolve(fullPath))
  })
}

function registerCopyFile() {
  ipcMain.handle('file:copyFile', async (event, source: string, target: string) => {

    try {
      await access(path.resolve(source))
    } catch (error) {
      return Promise.reject(new Error(`文件访问错误 | ${source}`))
    }

    await mkdir(path.dirname(target), {
      recursive: true
    }).catch(error => Promise.reject(new Error(`文件复制错误 | ${source} -> ${target}`, { cause: error })))

    return copyFile(source, target).catch(error => Promise.reject(new Error(`文件复制错误 | ${source} -> ${target}`, { cause: error })))
  })
}

function registerReadJsonFile() {
  ipcMain.handle('file:readJsonFile', async (event, filePath: string) => {
    filePath = path.resolve(filePath)

    try {
      await access(filePath)
    } catch (error) {
      return Promise.reject(new Error(`文件访问错误 | ${filePath}`))
    }

    return readFile(filePath, 'utf-8').then(content => {
      if (content) {
        return JSON.parse(content)
      }

      return undefined
    }).catch(error => Promise.reject(new Error(`文件读取错误 | ${filePath}`, { cause: error })))
  })
}

function registerWriteFile() {
  ipcMain.handle('file:writeFile', async (event, filePath: string, content: string) => {
    await mkdir(path.dirname(filePath), {
      recursive: true
    })

    return writeFile(filePath, content, 'utf-8').catch(error => Promise.reject(new Error(`文件写入错误 | ${filePath}`, { cause: error })))
  })
}

function registerGlobby() {
  ipcMain.handle('file:globby', async (event, patterns: string | readonly string[], options?: Options) => {
    if (patterns instanceof Array) {
      patterns = patterns.map(pattern => pattern.replace(/\\/g, '/'))
    } else {
      patterns = patterns.replace(/\\/g, '/')
    }

    return globby(patterns, options).catch(error => Promise.reject(new Error(`文件查找错误 | ${patterns}`, { cause: error })))
  })
}

function registerDeleteDirectory() {
  ipcMain.handle('directory:deleteDirectory', async (event, direcroty: string) => {
    return rm(direcroty, {
      recursive: true,
      force: true
    }).catch(error => Promise.reject(new Error(`目录删除错误 | ${direcroty}`, { cause: error })))
  })
}

function registerTestArchive() {
  ipcMain.handle('archive:testArchive', (event, customSevenZip: string | undefined, archiveFilePath: string, filePaths: string[]) => {
    const result = spawn.sync((customSevenZip && path.resolve(customSevenZip)) || sevenZip, [
      't',
      path.resolve(archiveFilePath),
      ...filePaths,
      '-r',
      '-y'
    ], {
      cwd: path.dirname(archiveFilePath),
      encoding: 'utf-8',
      stdio: 'pipe'
    })

    if ((result.stdout || '').includes('No files to process')) {
      return Promise.reject(new Error(`【7z】没有要处理的文件 | ${archiveFilePath} -> ${filePaths}`))
    }

    return result
  })
}

function registerExtractFullArchive() {
  ipcMain.handle('archive:extractFullArchive', (event, customSevenZip: string | undefined, archiveFilePath: string, destDirectory: string, filePaths: string[]) => {
    const result = spawn.sync((customSevenZip && path.resolve(customSevenZip)) || sevenZip, [
      'x',
      path.resolve(archiveFilePath),
      `-o${destDirectory}`,
      ...filePaths,
      '-y'
    ], {
      cwd: path.dirname(archiveFilePath),
      encoding: 'utf-8',
      stdio: 'pipe'
    })

    if ((result.stdout || '').includes('No files to process')) {
      return Promise.reject(new Error(`【7z】没有要处理的文件 | ${archiveFilePath} -> ${destDirectory} / ${filePaths}`))
    }

    return result
  })
}

function registerAddArchive() {
  ipcMain.handle('archive:addArchive', (event, customSevenZip: string | undefined, archiveFilePath: string, workDirectory: string, filePaths: string[]) => {
    const result = spawn.sync((customSevenZip && path.resolve(customSevenZip)) || sevenZip, [
      'a',
      path.resolve(archiveFilePath),
      ...filePaths,
      '-y'
    ], {
      cwd: path.resolve(workDirectory),
      encoding: 'utf-8',
      stdio: 'pipe'
    })

    if ((result.stdout || '').includes('No files to process')) {
      return Promise.reject(new Error(`【7z】没有要处理的文件 | ${archiveFilePath} <- ${workDirectory} / ${filePaths}`))
    }

    return result
  })
}

function registerDeleteArchive() {
  ipcMain.handle('archive:deleteArchive', (event, customSevenZip: string | undefined, archiveFilePath: string, filePaths: string[]) => {
    const result = spawn.sync((customSevenZip && path.resolve(customSevenZip)) || sevenZip, [
      'd',
      path.resolve(archiveFilePath),
      ...filePaths,
      '-y'
    ], {
      cwd: path.dirname(archiveFilePath),
      encoding: 'utf-8',
      stdio: 'pipe'
    })

    if ((result.stdout || '').includes('No files to process')) {
      return Promise.reject(new Error(`【7z】没有要处理的文件 | ${archiveFilePath} x ${filePaths}`))
    }

    return result
  })
}
