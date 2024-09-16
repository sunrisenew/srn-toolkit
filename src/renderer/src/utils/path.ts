export function parsePathInfo(pathText: string) {
  const matches = pathText.match(/^((\S+?)\s+)?([/\\]?(.+?)[/\\]((.+[/\\])((.+?)(\.\w+)?)))$/)
  if (!matches) {
    return undefined
  }

  const [, prefix, actionText, originPath, moduleName, relativePath, directory, filename, baseName, extension] = matches

  const actionMap = {
    新增: 'A',
    修改: 'M',
    删除: 'D'
  }
  const action: string = actionMap[actionText] || actionText

  return {
    prefix,
    action,
    originPath,
    moduleName,
    relativePath,
    directory,
    filename,
    baseName,
    extension: extension.toLowerCase()
  }
}

export function parseFileInfo(filePath: string) {
  const matches = filePath.match(/^(.+[/\\])?((.+?)(\.\w+)?)$/)

  if (!matches) {
    return undefined
  }

  const [, directory, filename, baseName, extension] = matches

  return {
    directory,
    filename,
    baseName,
    extension: extension.toLowerCase()
  }
}
