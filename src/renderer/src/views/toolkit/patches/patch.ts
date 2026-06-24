import { useGlobby, useNodePath } from '@renderer/compositions/ipc-renderer'
import { parseFileInfo, parsePathInfo } from '@renderer/utils/path'

type ModuleParseSettingModel = {
  rootDirectory: string
  replacements: Array<{
    fromSource: boolean
    extension: {
      sources: Array<string>
      targets: Array<string>
    },
    path: {
      source: string
      target: string
    }
  }>
}

type ParsedPatchItemModel = {
  text: string
  action: string
  fromSource: boolean
  originPath: string
  moduleName: string
  filename: string
  relativeFilePath: string
  classPath: string
  sourcePath: string
  targetPath: string
  extraItems: Array<{
    filename: string
    relativeFilePath: string
    classPath: string
    sourcePath: string
    targetPath: string
  }>
  status: 'success' | 'info' | 'warning' | 'error'
  message: string
}

export async function parseItemsText(
  itemsText: string,
  patchDirectory: string,
  nested: boolean,
  moduleParseSettingProvider: (moduleName: string) => ModuleParseSettingModel,
  extractItemsProvider?: (parsedItem: ParsedPatchItemModel) => Promise<Array<{
    filename: string
    relativeFilePath: string
    classPath: string
    sourcePath: string
    targetPath: string
  }>>
): Promise<{
  items: Array<ParsedPatchItemModel>,
  relatedModuleNames: Array<string>
}> {
  const itemTexts = itemsText ? [...new Set(itemsText.split(/\r?\n/))] : []
  const items = itemsText
    ? await Promise.all(
      itemTexts
        .filter(itemText => itemText)
        .map(itemText => parseItemText(itemText.trim(), patchDirectory, nested, moduleParseSettingProvider, extractItemsProvider))
    )
    : []

  const relatedModuleNames = [...new Set<string>(items.map(item => item.moduleName))]

  return {
    items,
    relatedModuleNames
  }
}

export async function parseItemText(
  itemText: string,
  patchDirectory: string,
  nested: boolean,
  moduleParseSettingProvider: (moduleName: string) => ModuleParseSettingModel,
  extractItemsProvider?: (parsedItem: ParsedPatchItemModel) => Promise<Array<{
    filename: string
    relativeFilePath: string
    classPath: string
    sourcePath: string
    targetPath: string
  }>>
): Promise<ParsedPatchItemModel> {
  const nodePath = useNodePath()
  itemText = itemText.replaceAll('\\', '/')
  const parsedItem: ParsedPatchItemModel = {
    text: itemText,
    action: '',
    fromSource: false,
    originPath: '',
    moduleName: '',
    filename: '',
    relativeFilePath: '',
    classPath: '',
    sourcePath: '',
    targetPath: '',
    extraItems: [],
    status: 'info',
    message: '待处理'
  }

  const itemPathInfo = parsePathInfo(itemText)
  if (!itemPathInfo) {
    parsedItem.status = 'error'
    parsedItem.message = '路径解析错误'
    return parsedItem
  }

  const { action, originPath, moduleName, relativePath: sourceRelativePath, extension } = itemPathInfo
  let finalSourceRelativePath = sourceRelativePath
  let finalClassPath = finalSourceRelativePath

  parsedItem.action = action || '?'
  parsedItem.originPath = originPath
  parsedItem.moduleName = moduleName

  const moduleSetting = moduleParseSettingProvider(moduleName)
  if (!moduleSetting) {
    parsedItem.status = 'error'
    parsedItem.message = `未找到模块配置 | ${JSON.stringify({ moduleName })}`
    return parsedItem
  }

  const { rootDirectory: moduleRootDirectory, replacements } = moduleSetting

  for (const replacement of replacements) {
    const { fromSource, extension: extensionReplacement, path: pathReplacement } = replacement

    for (let i = 0; i < extensionReplacement.sources.length; i++) {
      const extensionReplacementSource = extensionReplacement.sources[i]
      const extensionReplacementTarget = extensionReplacement.targets[i] || extensionReplacementSource
      if (extensionReplacementSource === extension) {
        parsedItem.fromSource = fromSource

        const replacedSourceRelativePath = finalSourceRelativePath
          .replaceAll(extensionReplacementSource, extensionReplacementTarget)
          .replaceAll(pathReplacement.source, pathReplacement.target)

        finalClassPath = replacedSourceRelativePath.replace(/^.*[/\\]?target[/\\]classes[/\\]/, '').replaceAll(/\\/g, '/')

        if (!parsedItem.fromSource) {
          finalSourceRelativePath = replacedSourceRelativePath
        }
      }
    }
  }

  const finalSourceRelativeFileInfo = parseFileInfo(finalSourceRelativePath)
  if (!finalSourceRelativeFileInfo) {
    parsedItem.status = 'error'
    parsedItem.message = `路径解析错误 | ${JSON.stringify({ itemText: itemText })}`
    return parsedItem
  }

  const { filename: finalSourceFilename } = finalSourceRelativeFileInfo

  parsedItem.filename = finalSourceFilename
  parsedItem.relativeFilePath = nodePath.join(moduleName, nested ? finalClassPath : finalSourceFilename).replaceAll(/\\/g, '/')
  parsedItem.classPath = finalClassPath
  parsedItem.sourcePath = nodePath.join(moduleRootDirectory, finalSourceRelativePath)
  parsedItem.targetPath = patchDirectory ? nodePath.join(patchDirectory, parsedItem.relativeFilePath) : ''

  const parsedSourcePathFileInfo = parseFileInfo(parsedItem.sourcePath)
  if (!parsedSourcePathFileInfo) {
    parsedItem.status = 'error'
    parsedItem.message = `路径解析错误 | ${JSON.stringify({ itemText: itemText })}`
    return parsedItem
  }

  if (extractItemsProvider) {
    parsedItem.extraItems = await extractItemsProvider(parsedItem)
  } else {
    const globSourcePathPattern = nodePath.join(parsedSourcePathFileInfo.directory, `${parsedSourcePathFileInfo.baseName}$*${parsedSourcePathFileInfo.extension}`)
    const globSourcePaths = (await useGlobby(globSourcePathPattern) as string[])
    parsedItem.extraItems = globSourcePaths.map(globSourcePath => {
      const parsedGlobSourcePathFileInfo = parseFileInfo(globSourcePath)
      if (!parsedGlobSourcePathFileInfo) {
        parsedItem.status = 'error'
        parsedItem.message = `路径解析错误 | ${JSON.stringify({ itemText: itemText })}`
        return {
          filename: '',
          relativeFilePath: '',
          classPath: '',
          sourcePath: '',
          targetPath: ''
        }
      }

      const extraClassPath = globSourcePath.replace(/^.*[/\\]?target[/\\]classes[/\\]/, '').replaceAll(/\\/g, '/')
      const extraRelativeFilePath = nodePath.join(moduleName, nested ? extraClassPath : parsedGlobSourcePathFileInfo.filename)
      return {
        filename: parsedGlobSourcePathFileInfo.filename,
        relativeFilePath: extraRelativeFilePath,
        classPath: extraClassPath,
        sourcePath: globSourcePath,
        targetPath: patchDirectory ? nodePath.join(patchDirectory, extraRelativeFilePath) : ''
      }
    })
  }

  return parsedItem
}
