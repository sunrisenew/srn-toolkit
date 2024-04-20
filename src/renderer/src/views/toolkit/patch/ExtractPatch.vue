<template>
  <div class="extract-patch">
    <n-page-header>
      <template #title>
        <n-h1 prefix="bar">{{ title }}</n-h1>
      </template>
      <template #extra>
        <n-space>
          <n-button type="info" ghost @click="handleGuide()">指引</n-button>
          <n-button type="info" ghost @click="toggleShowSetting(true)">配置</n-button>
        </n-space>
      </template>
    </n-page-header>
    <n-divider></n-divider>
    <n-spin :show="extractPatchInfo.processing" size="large">
      <n-form ref="modelFormRef" class="model" :model="model" label-align="left" label-placement="left" label-width="128">
        <n-h2 prefix="bar">基本信息</n-h2>
        <n-form-item class="patch-root-directory" label="增量包根目录" path="patchRootDirectory" :rule="{ required: true, message: '增量包根目录不能为空' }">
          <n-input-group>
            <n-input v-model:value="model.patchRootDirectory" placeholder="请选择" readonly></n-input>
            <n-button type="info" ghost @click="handleOpenDirectory(model, 'patchRootDirectory')">选择</n-button>
          </n-input-group>
        </n-form-item>
        <n-h2 prefix="bar">增量包信息</n-h2>
        <n-dynamic-input v-model:value="model.patches" :min="1" :on-create="handleCreatePatch">
          <template #default="{ value: patch, index: patchIndex }: { value: PatchModel, index: number }">
            <n-card class="patch" hoverable>
              <template #header>
                <n-h3 prefix="bar" style="margin: 0;">
                  <span>增量包 - {{ patchIndex + 1 }}</span>
                  <n-divider vertical></n-divider>
                  <n-text type="info">{{ patch.name }}</n-text>
                  <n-space>
                    <n-tag v-for="(relatedModuleName, relatedModuleNameIndex) in patch.relatedModuleNames" :key="relatedModuleNameIndex"
                      type="info" round>{{ relatedModuleName }}</n-tag>
                  </n-space>
                </n-h3>
              </template>
              <template #header-extra>
                <n-space>
                  <n-button class="reset" type="error" ghost @click="handleResetPatch(patch)">重置</n-button>
                  <n-button class="re-parse" type="info" ghost @click="handleReParsePatch(patch)">重新解析</n-button>
                  <n-button class="extract" type="primary" @click="handleExtractPatch(patch)">抽取</n-button>
                </n-space>
              </template>
              <n-form-item class="name" label="名称" :path="`patches[${patchIndex}].name`" :rule="{ required: true, message: '名称不能为空' }">
                <n-input v-model:value="patch.name" clearable @change="handleReParsePatch(patch)"></n-input>
              </n-form-item>
              <n-form-item class="scripts" label="脚本">
                <n-dynamic-input v-model:value="patch.scripts" :min="0" :on-create="handleCreatePatchScript">
                  <template #default="{ value: script, index: scriptIndex }: { value: PatchScriptModel, index: number }">
                    <n-card class="script" hoverable>
                      <n-form-item class="filename" label="文件名" :path="`patches[${patchIndex}].scripts[${scriptIndex}].filename`" :rule="{ required: true, message: '文件名不能为空' }">
                        <n-input v-model:value="script.filename" clearable @change="handleScriptFilenameChange(patch, script)"></n-input>
                      </n-form-item>
                      <n-form-item class="content" label="内容" :path="`patches[${patchIndex}].scripts[${scriptIndex}].content`" :rule="{ required: true, message: '内容不能为空' }">
                        <n-input v-model:value="script.content" type="textarea" clearable></n-input>
                      </n-form-item>
                    </n-card>
                  </template>
                </n-dynamic-input>
              </n-form-item>
              <n-form-item class="meta-filename" label="元数据文件名" :path="`patches[${patchIndex}].metaFilename`" :rule="{ required: true, message: '元数据文件名不能为空' }">
                <n-input v-model:value="patch.metaFilename" clearable></n-input>
              </n-form-item>
              <n-form-item class="items-info-text" label="条目" :path="`patches[${patchIndex}].itemsInfo.text`" :rule="{ required: true, message: '条目不能为空' }">
                <n-input v-model:value="patch.itemsInfo.text" type="textarea" clearable @change="handleItemsTextChange(patch)"></n-input>
              </n-form-item>
              <n-divider></n-divider>
              <n-collapse>
                <n-collapse-item class="output" title="输出">
                  <template #header-extra>
                    <n-space>
                      <n-badge type="success" :value="patch.result.successCount" show-zero></n-badge>
                      <n-badge type="warning" :value="patch.result.warningCount" show-zero></n-badge>
                      <n-badge type="error" :value="patch.result.errorCount" show-zero></n-badge>
                    </n-space>
                  </template>
                  <n-collapse>
                    <n-collapse-item v-if="!patch.directory" title="增量包" disabled></n-collapse-item>
                    <n-collapse-item v-else>
                      <template #header>
                        <span>增量包</span>
                        <n-divider vertical></n-divider>
                        <n-text type="info">{{ patch.name }}</n-text>
                      </template>
                      <n-grid :y-gap="10">
                        <n-grid-item :span="2">目标路径</n-grid-item>
                        <n-grid-item :span="22">
                          <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(patch.directory)">{{ patch.directory }}</n-text>
                        </n-grid-item>
                      </n-grid>
                    </n-collapse-item>
                    <n-collapse-item v-if="patch.scripts.length === 0" title="脚本" disabled></n-collapse-item>
                    <n-collapse-item v-for="(script, scriptIndex) in patch.scripts" :key="scriptIndex">
                      <template #header>
                        <span>脚本</span>
                        <n-divider vertical></n-divider>
                        <n-text :type="script.status">{{ script.filename }}</n-text>
                      </template>
                      <template #header-extra>
                        <n-badge :type="script.status" dot></n-badge>
                      </template>
                      <n-grid :y-gap="10">
                        <n-grid-item :span="2">目标路径</n-grid-item>
                        <n-grid-item :span="22">
                          <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(script.targetPath)">{{ script.targetPath }}</n-text>
                        </n-grid-item>
                        <n-grid-item :span="2">信息</n-grid-item>
                        <n-grid-item :span="22">
                          <n-text :type="script.status">{{ script.message }}</n-text>
                        </n-grid-item>
                      </n-grid>
                    </n-collapse-item>
                    <n-collapse-item v-if="patch.itemsInfo.items.length === 0" title="条目" disabled></n-collapse-item>
                    <n-collapse-item v-for="(item, itemIndex) in patch.itemsInfo.items" :key="itemIndex">
                      <template #header>
                        <span>条目</span>
                        <n-divider vertical></n-divider>
                        <n-text :type="item.status">{{ item.action }}</n-text>
                        <n-divider vertical></n-divider>
                        <n-text :type="item.status">{{ item.originPath }}</n-text>
                      </template>
                      <template #header-extra>
                        <n-badge :type="item.status" dot></n-badge>
                      </template>
                      <n-grid :y-gap="10">
                        <n-grid-item :span="2">原路径</n-grid-item>
                        <n-grid-item :span="22">
                          <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(item.sourcePath)">{{ item.sourcePath }}</n-text>
                        </n-grid-item>
                        <n-grid-item :span="2">目标路径</n-grid-item>
                        <n-grid-item :span="22">
                          <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(item.targetPath)">{{ item.targetPath }}</n-text>
                        </n-grid-item>
                        <template v-if="item.extraItems.length !== 0">
                          <n-grid-item :span="2">额外条目</n-grid-item>
                          <n-grid-item :span="22">
                            <div v-for="(extraItem, extraItemIndex) in item.extraItems" :key="extraItemIndex">
                              <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(extraItem.sourcePath)">{{ extraItem.sourcePath }}</n-text>
                            </div>
                          </n-grid-item>
                        </template>
                        <n-grid-item :span="2">信息</n-grid-item>
                        <n-grid-item :span="22">
                          <n-text :type="item.status">{{ item.message }}</n-text>
                        </n-grid-item>
                      </n-grid>
                    </n-collapse-item>
                  </n-collapse>
                </n-collapse-item>
              </n-collapse>
            </n-card>
          </template>
        </n-dynamic-input>
        <n-divider></n-divider>
        <n-space justify="center">
          <n-button class="reset-all" type="error" ghost size="large" @click="handleResetPatch()">全部重置</n-button>
          <n-button class="re-parse-all" type="info" ghost size="large" @click="handleReParsePatch()">全部重新解析</n-button>
          <n-button class="extract-all" type="primary" size="large" @click="handleExtractPatch()">全部抽取</n-button>
        </n-space>
      </n-form>
    </n-spin>
    <n-drawer v-model:show="showSetting" to=".mount-root" :trap-focus="false" :mask-closable="false" width="80%">
      <n-drawer-content title="配置" :native-scrollbar="false" closable>
        <template #default>
          <n-form ref="settingModelFormRef" :model="settingModel" label-align="left" label-placement="left" label-width="128">
            <n-h2 prefix="bar">基本配置</n-h2>
            <n-form-item class="default-patch-root-directory" label="默认增量包根目录" path="defaultPatchRootDirectory">
              <n-input-group>
                <n-input v-model:value="settingModel.defaultPatchRootDirectory" placeholder="请选择" readonly></n-input>
                <n-button type="info" ghost @click="handleOpenDirectory(settingModel, 'defaultPatchRootDirectory')">选择</n-button>
              </n-input-group>
            </n-form-item>
            <n-h2 prefix="bar">模块配置</n-h2>
            <n-dynamic-input v-model:value="settingModel.modules" :min="1" :on-create="handleCreateModuleSetting">
              <template #default="{ value: module, index: moduleIndex }: { value: ModuleSettingModel, index: number }">
                <n-card hoverable>
                  <n-collapse>
                    <n-collapse-item>
                      <template #header>
                        <span>模块 - {{ moduleIndex + 1 }}</span>
                        <n-divider vertical></n-divider>
                        <n-text type="info">{{ module.name }}</n-text>
                      </template>
                      <n-h3 prefix="bar">基本信息</n-h3>
                      <n-form-item label="模块名" :path="`modules[${moduleIndex}].name`" :rule="{ required: true, message: '模块名不能为空' }">
                        <n-input v-model:value="module.name" clearable></n-input>
                      </n-form-item>
                      <n-form-item label="根目录" :path="`modules[${moduleIndex}].setting.rootDirectory`" :rule="{ required: true, message: '根目录不能为空' }">
                        <n-input-group>
                          <n-input v-model:value="module.setting.rootDirectory" placeholder="请选择" readonly></n-input>
                          <n-button type="info" ghost @click="handleOpenDirectory(module.setting, 'rootDirectory')">选择</n-button>
                        </n-input-group>
                      </n-form-item>
                      <n-h3 prefix="bar">配置信息</n-h3>
                      <n-collapse>
                        <n-collapse-item title="替换">
                          <n-dynamic-input v-model:value="module.setting.replacements" :min="1" :on-create="handleCreateModuleReplacementSetting">
                            <template #default="{ value: replacement, index: replacementIndex }: { value: ModuleReplacementSettingModel, index: number }">
                              <n-card hoverable>
                                <n-form-item label="原扩展名组" :path="`modules[${moduleIndex}].setting.replacements[${replacementIndex}].extension.sources`" :rule="{ required: true, message: '原扩展名组不能为空' }">
                                  <n-select v-model:value="replacement.extension.sources" :show-arrow="false" :show="false" placeholder="请选择" tag multiple filterable clearable></n-select>
                                </n-form-item>
                                <n-form-item label="目标扩展名组" :path="`modules[${moduleIndex}].setting.replacements[${replacementIndex}].extension.targets`">
                                  <n-select v-model:value="replacement.extension.targets" :show-arrow="false" :show="false" placeholder="请选择" tag multiple filterable clearable></n-select>
                                </n-form-item>
                                <n-form-item label="原路径" :path="`modules[${moduleIndex}].setting.replacements[${replacementIndex}].path.source`" :rule="{ required: !!replacement.path.target, message: '原路径不能为空' }">
                                  <n-input v-model:value="replacement.path.source" clearable></n-input>
                                </n-form-item>
                                <n-form-item label="目标路径">
                                  <n-input v-model:value="replacement.path.target" clearable></n-input>
                                </n-form-item>
                              </n-card>
                            </template>
                          </n-dynamic-input>
                        </n-collapse-item>
                      </n-collapse>
                    </n-collapse-item>
                  </n-collapse>
                </n-card>
              </template>
            </n-dynamic-input>
          </n-form>
        </template>
        <template #footer>
          <n-space justify="space-between" style="width: 100%;">
            <n-space>
              <n-button type="info" ghost @click="handleShowSettingFileInFolder()">定位文件</n-button>
              <n-button type="info" ghost @click="handleLoadSetting()">加载配置</n-button>
            </n-space>
            <n-space>
              <n-button type="info" ghost @click="toggleShowSetting(false)">取消</n-button>
              <n-button type="primary" :loading="savingSetting" @click="handleSaveSetting()">保存</n-button>
            </n-space>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script lang="ts">

type Model = {
  patchRootDirectory: string
  patches: Array<{
    name: string
    directory: string
    scripts: Array<{
      filename: string
      content: string
      targetPath: string
      status: 'success' | 'info' | 'warning' | 'error'
      message: string
    }>
    metaFilename: string
    relatedModuleNames: Array<string>
    itemsInfo: {
      text: string
      items: Array<{
        text: string
        action: string
        originPath: string
        moduleName: string
        sourcePath: string
        targetPath: string
        targetFilename: string
        classPath: string
        extraItems: Array<{
          sourcePath: string
          targetPath: string
          targetFilename: string
          classPath: string
        }>
        status: 'success' | 'info' | 'warning' | 'error'
        message: string
      }>
    }
    result: {
      successCount: number
      warningCount: number
      errorCount: number
    }
  }>
}
type PatchModel = Model['patches'][0]
type PatchScriptModel = PatchModel['scripts'][0]
type PatchItemModel = PatchModel['itemsInfo']['items'][0]

type SettingModel = {
  version: string
  defaultPatchRootDirectory: string
  modules: Array<{
    name: string
    setting: {
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
  }>
}
type ModuleSettingModel = SettingModel['modules'][0]
type ModuleSettingValueModel = ModuleSettingModel['setting']
type ModuleReplacementSettingModel = ModuleSettingValueModel['replacements'][0]
type ModuleReplacementExtensionSettingModel = ModuleReplacementSettingModel['extension']
type ModuleReplacementPathSettingModel = ModuleReplacementSettingModel['path']

type FormattedSetting = {
  defaultPatchRootDirectory: string
  modules: {
    [key: string]: ModuleSettingValueModel
  }
}

type PatchMeta = {
  name: string
  relatedModuleNames: string[]
  itemTexts: string[]
  items: Array<{
    text: string
    action: string
    originPath: string
    moduleName: string
    targetFilename: string
    classPath: string
    extraItems: Array<{
      targetFilename: string
      classPath: string
    }>
  }>
}
type PatchItemMeta = PatchMeta['items'][0]

</script>

<script setup lang="ts">
import { useCopyFile, useGetAppVersion, useGlobby, useLoadSetting, useNodePath, useOpenDirectoryDialog, useSaveSetting, useShowItemInFolder, useShowSettingFileInFolder, useWriteFile, useWriteJsonFile } from '@renderer/compositions/ipc-renderer'
import { parseFileInfo, parsePathInfo } from '@renderer/utils/path'
import { driver } from 'driver.js'
import { defaultsDeep as _defaultsDeep } from 'lodash-es'
import { FormInst, NBadge, NButton, NCard, NCollapse, NCollapseItem, NDivider, NDrawer, NDrawerContent, NDynamicInput, NForm, NFormItem, NGrid, NGridItem, NH1, NH2, NH3, NInput, NInputGroup, NPageHeader, NSelect, NSpace, NSpin, NTag, NText } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const nodePath = useNodePath()
const appVersion = ref('')

const MODULE_NAME = 'extract-patch'

const route = ref(useRoute())
const title = route.value.meta?.title

onMounted(async () => {
  appVersion.value = await useGetAppVersion()

  await loadSetting()

  model.value.patchRootDirectory = settingModel.value.defaultPatchRootDirectory || model.value.patchRootDirectory
})

const model = ref<Model>({
  patchRootDirectory: '',
  patches: [buildDefaultPatch()]
})
const modelFormRef = ref<FormInst | null>(null)

function buildDefaultPatch(): PatchModel {
  return {
    name: '',
    directory: '',
    scripts: [],
    metaFilename: 'meta.json',
    relatedModuleNames: [],
    itemsInfo: {
      text: '',
      items: []
    },
    result: {
      successCount: 0,
      warningCount: 0,
      errorCount: 0
    }
  }
}

function buildDefaultPatchScript(): PatchScriptModel {
  return {
    filename: '',
    content: '',
    targetPath: '',
    status: 'warning',
    message: ''
  }
}

function handleCreatePatch() {
  return buildDefaultPatch()
}

function handleCreatePatchScript() {
  return buildDefaultPatchScript()
}

function buildPatchDirectory(patch: PatchModel) {
  if (!model.value.patchRootDirectory || !patch.name) {
    return ''
  }

  return nodePath.join(model.value.patchRootDirectory, patch.name)
}

async function handleOpenDirectory(model, key, onChange?: (model) => void) {
  const { filePaths } = await useOpenDirectoryDialog({
    defaultPath: model[key] || ''
  })
  model[key] = filePaths?.[0] ?? model[key]
  onChange && onChange(model)
}

function handleScriptFilenameChange(patch: PatchModel, script: PatchScriptModel) {
  Object.assign(script, {
    targetPath: nodePath.join(buildPatchDirectory(patch), 'scripts', script.filename),
    status: 'info',
    message: '待处理'
  })
}

function handleParsePatchScripts(patch: PatchModel) {
  const { scripts } = patch
  for (const script of scripts) {
    Object.assign(script, {
      targetPath: nodePath.join(buildPatchDirectory(patch), 'scripts', script.filename),
      status: 'info',
      message: '待处理'
    })
  }
}

function handleItemsTextChange(patch: PatchModel) {
  parsePatchItems(patch)
}

async function parsePatchItems(patch: PatchModel) {
  const { itemsInfo } = patch
  itemsInfo.items = itemsInfo.text
    ? await Promise.all(
      [...new Set(itemsInfo.text.split(/\r?\n/))]
        .filter(itemText => itemText)
        .map(itemText => parseItemText(itemText.trim(), buildPatchDirectory(patch)))
    )
    : []

  patch.relatedModuleNames = [...new Set<string>(patch.itemsInfo.items.map(item => item.moduleName))]
}

async function parseItemText(itemText: string, patchDirectory: string): Promise<PatchItemModel> {
  const parsedItem: PatchItemModel = {
    text: itemText,
    action: '',
    originPath: '',
    moduleName: '',
    sourcePath: '',
    targetPath: '',
    targetFilename: '',
    classPath: '',
    extraItems: [],
    status: 'info',
    message: '待处理'
  }

  const { modules: moduleSettings } = formattedSetting.value

  const itemPathInfo = parsePathInfo(itemText)
  if (!itemPathInfo) {
    parsedItem.status = 'error'
    parsedItem.message = '路径解析错误'
    return parsedItem
  }

  const { action, originPath, moduleName, relativePath: sourceRelativeItemPath, extension } = itemPathInfo
  let replacedSourceRelativeItemPath = sourceRelativeItemPath

  const moduleSetting = moduleSettings[moduleName]
  if (!moduleSetting) {
    parsedItem.status = 'error'
    parsedItem.message = `未找到模块配置 | ${JSON.stringify({ moduleName })}`
    return parsedItem
  }

  const { rootDirectory: moduleRootDirectory, replacements } = moduleSetting

  for (const replacement of replacements) {
    const { extension: extensionReplacement, path: pathReplacement } = replacement
    for (let i = 0; i < extensionReplacement.sources.length; i++) {
      const extensionReplacementSource = extensionReplacement.sources[i]
      const extensionReplacementTarget = extensionReplacement.targets[i] || extensionReplacementSource
      if (extensionReplacementSource === extension) {
        replacedSourceRelativeItemPath = replacedSourceRelativeItemPath.replaceAll(extensionReplacementSource, extensionReplacementTarget)
      }
    }
    replacedSourceRelativeItemPath = replacedSourceRelativeItemPath.replaceAll(pathReplacement.source, pathReplacement.target)
  }

  const replacedSourceFileInfo = parseFileInfo(replacedSourceRelativeItemPath)
  if (!replacedSourceFileInfo) {
    parsedItem.status = 'error'
    parsedItem.message = `路径解析错误 | ${JSON.stringify({ itemText: itemText })}`
    return parsedItem
  }

  const { filename: replacedSourceFilename } = replacedSourceFileInfo

  parsedItem.action = action || '?'
  parsedItem.originPath = originPath
  parsedItem.moduleName = moduleName
  parsedItem.sourcePath = nodePath.join(moduleRootDirectory, replacedSourceRelativeItemPath)
  parsedItem.targetPath = patchDirectory && nodePath.join(patchDirectory, replacedSourceFilename)
  parsedItem.targetFilename = replacedSourceFilename
  parsedItem.classPath = parsedItem.sourcePath.replace(/^.*[/\\]target[/\\]classes[/\\]/, '').replaceAll(/\\/g, '/')

  const parsedSourcePathFileInfo = parseFileInfo(parsedItem.sourcePath)
    if (!parsedSourcePathFileInfo) {
    parsedItem.status = 'error'
    parsedItem.message = `路径解析错误 | ${JSON.stringify({ itemText: itemText })}`
    return parsedItem
  }
  const globSourcePathPattern = nodePath.join(parsedSourcePathFileInfo.directory, `${parsedSourcePathFileInfo.baseName}$*${parsedSourcePathFileInfo.extension}`)
  const globSourcePaths = (await useGlobby(globSourcePathPattern) as string[])
  parsedItem.extraItems = globSourcePaths.map(globSourcePath => {
    const parsedGlobSourcePathFileInfo = parseFileInfo(globSourcePath)
    if (!parsedGlobSourcePathFileInfo) {
      parsedItem.status = 'error'
      parsedItem.message = `路径解析错误 | ${JSON.stringify({ itemText: itemText })}`
      return {
        sourcePath: '',
        targetPath: '',
        targetFilename: '',
        classPath: ''
      }
    }

    return {
      sourcePath: globSourcePath,
      targetPath: patchDirectory && nodePath.join(patchDirectory, parsedGlobSourcePathFileInfo.filename),
      targetFilename: parsedGlobSourcePathFileInfo.filename,
      classPath: globSourcePath.replace(/^.*[/\\]target[/\\]classes[/\\]/, '').replaceAll(/\\/g, '/')
    }
  })

  return parsedItem
}

function handleShowItemInFolder(fullPath: string) {
  useShowItemInFolder(fullPath)
}

function handleResetPatch(selectedPatch?: PatchModel) {
  const patches = selectedPatch ? [selectedPatch] : model.value.patches
  for (const patch of patches) {
    Object.assign(patch, buildDefaultPatch())
  }
}

function handleReParsePatch(selectedPatch?: PatchModel) {
  const patches = selectedPatch ? [selectedPatch] : model.value.patches
  for (const patch of patches) {
    handleParsePatchScripts(patch)
    parsePatchItems(patch)
  }
}

const extractPatchInfo = ref<{
  processing: boolean
  canceled: boolean
  processedPercent: number
  status: 'success' | 'info' | 'warning' | 'error'
}>({
  processing: false,
  canceled: false,
  processedPercent: 0,
  status: 'success'
})

function handleExtractPatch(selectedPatch?: PatchModel) {
  modelFormRef.value?.validate().then(async () => {
    extractPatchInfo.value.processing = true
    extractPatchInfo.value.canceled = false
    extractPatchInfo.value.processedPercent = 0

    const { patches } = model.value
    const selectedPatches = selectedPatch ? [selectedPatch] : patches
    let processedPatchCount = 0
    for (const selectedPatch of selectedPatches) {
      const { name, scripts, metaFilename, relatedModuleNames, itemsInfo: { items }, result } = selectedPatch

      result.successCount = 0
      result.warningCount = 0
      result.errorCount = 0

      for (const script of scripts) {
        if (extractPatchInfo.value.canceled) {
          return
        }

        await useWriteFile(script.targetPath, script.content).then(() => {
          script.status = 'success'
          script.message = '成功'
          result.successCount++
        }).catch(error => {
          script.status = 'error'
          script.message = `文件写入错误 | ${error.message}`
          result.errorCount++
        })
      }

      const successItems: Array<PatchItemMeta> = []
      for (const item of items) {
        if (extractPatchInfo.value.canceled) {
          return
        }
        if (item.status === 'error') {
          result.errorCount++
          continue
        }

        const successItem: PatchItemMeta = {
          text: item.text,
          action: item.action,
          originPath: item.originPath,
          moduleName: item.moduleName,
          targetFilename: item.targetFilename,
          classPath: item.classPath,
          extraItems: []
        }
        await useCopyFile(item.sourcePath, item.targetPath).then(() => {
          item.status = 'success'
          item.message = '成功'
          result.successCount++
          successItems.push(successItem)
        }).catch(error => {
          item.status = 'error'
          item.message = `文件复制错误 | ${error.message}`
          result.errorCount++
        })

        for (const extraItem of item.extraItems) {
          await useCopyFile(extraItem.sourcePath, extraItem.targetPath).then(() => {
            successItem.extraItems.push({
              targetFilename: extraItem.targetFilename,
              classPath: extraItem.classPath
            })
          }).catch(error => {
            item.status = 'error'
            item.message = `额外文件复制错误 | ${error.message}`
            result.errorCount++
          })
        }
      }

      if (result.successCount > 0 && result.successCount === (scripts.length + items.length)) {
        selectedPatch.directory = buildPatchDirectory(selectedPatch)
        const patchMeta: PatchMeta = {
          name,
          relatedModuleNames,
          itemTexts: successItems.map(value => value.text),
          items: successItems
        }
        await useWriteJsonFile(nodePath.join(selectedPatch.directory, metaFilename), patchMeta)
      }

      processedPatchCount++
      extractPatchInfo.value.processedPercent = Math.floor(processedPatchCount / selectedPatches.length * 100)
    }

    if (extractPatchInfo.value.processedPercent === 100) {
      extractPatchInfo.value.processing = false
      window.$message?.info('抽取结束')
    }
  }).catch(errors => errors && window.$message?.error('必填参数不能为空'))
    .finally(() => extractPatchInfo.value.processing = false)
}

const settingModel = ref<SettingModel>({
  version: '',
  defaultPatchRootDirectory: '',
  modules: [buildDefaultModuleSetting()]
})
const settingModelFormRef = ref<FormInst | null>(null)
const formattedSetting = computed<FormattedSetting>(() => {
  const settingCopy: SettingModel = JSON.parse(JSON.stringify(settingModel.value))

  const modules = settingCopy.modules.reduce((modulesResult, module) => {
    modulesResult[module.name] = module.setting
    return modulesResult
  }, {})

  return {
    defaultPatchRootDirectory: settingCopy.defaultPatchRootDirectory,
    modules
  }
})

function buildDefaultModuleSetting(): ModuleSettingModel {
  return {
    name: '',
    setting: {
      rootDirectory: '',
      replacements: [
        buildDefaultModuleReplacementSetting(['.java'], false, {
          sources: ['.java'],
          targets: ['.class']
        }, {
          source: 'src/main/java',
          target: 'target/classes'
        }),
        buildDefaultModuleReplacementSetting(['.xml'], true, undefined, {
          source: 'src/main/resources',
          target: 'target/classes'
        }),
        buildDefaultModuleReplacementSetting(['.js', '.html', '.css'], true, undefined, {
          source: 'src/main/webapp',
          target: 'target/classes/META-INF/resources'
        })
      ]
    }
  }
}

function buildDefaultModuleReplacementSetting(sourceExtensions: Array<string>, fromSource = false, defaultExtension?: ModuleReplacementExtensionSettingModel, defaultPath?: ModuleReplacementPathSettingModel): ModuleReplacementSettingModel {
  return {
    fromSource,
    extension: defaultExtension ?? {
      sources: sourceExtensions,
      targets: sourceExtensions
    },
    path: defaultPath ?? {
      source: '',
      target: ''
    }
  }
}

function handleCreateModuleSetting() {
  return buildDefaultModuleSetting()
}

function handleCreateModuleReplacementSetting() {
  return buildDefaultModuleReplacementSetting([])
}

const showSetting = ref(false)

async function toggleShowSetting(show: boolean) {
  await loadSetting()
  showSetting.value = show
}

const loadingSetting = ref(false)

async function loadSetting() {
  loadingSetting.value = true
  await useLoadSetting(MODULE_NAME).then((setting?: SettingModel) => {
    if (setting?.version === appVersion.value) {
      settingModel.value = setting
    } else {
      settingModel.value = _defaultsDeep(setting, {
        modules: Array.from(Array(setting?.modules.length), buildDefaultModuleSetting)
      }, settingModel.value)
      settingModel.value.version = appVersion.value
    }
  }).catch(error => window.$message?.error(error.message))
    .finally(() => loadingSetting.value = false)
}

const savingSetting = ref(false)

function saveSetting() {
  savingSetting.value = true
  useSaveSetting(MODULE_NAME, settingModel.value).then(() => {
    window.$message?.success('保存成功')
    toggleShowSetting(false)
  }).catch(error => window.$message?.error(error.message))
    .finally(() => savingSetting.value = false)
}

function handleSaveSetting() {
  settingModelFormRef.value?.validate().then(() => saveSetting()).catch(errors => errors && window.$message?.error('必填参数不能为空'))
}

async function handleShowSettingFileInFolder() {
  await useSaveSetting(MODULE_NAME, settingModel.value)
  useShowSettingFileInFolder(MODULE_NAME)
}

function handleLoadSetting() {
  loadSetting()
}

function handleGuide() {
  setTimeout(() => {
    const driverObj = driver({
      doneBtnText: '完成',
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      steps: [
        {
          element: '.extract-patch .model .patch-root-directory',
          popover: {
            title: '增量包根目录',
            description: '选择增量包存放的根目录。'
          }
        },
        {
          element: '.extract-patch .model .patch',
          popover: {
            title: '增量包',
            description: '增量包信息，可以添加多个。'
          }
        },
        {
          element: '.extract-patch .model .patch .name',
          popover: {
            title: '名称',
            description: '输入增量包名称，用于增量包目录名。'
          }
        },
        {
          element: '.extract-patch .model .patch .scripts',
          popover: {
            title: '脚本',
            description: '添加增量包脚本，可以添加多个。'
          }
        },
        {
          element: '.extract-patch .model .patch .meta-filename',
          popover: {
            title: '元数据文件名',
            description: '输入增量包元数据文件名，增量包元数据会保存在此文件中。'
          }
        },
        {
          element: '.extract-patch .model .patch .items-info-text',
          popover: {
            title: '条目',
            description: '输入增量包包含的文件条目，可以从Git或工单中获取，也可以手动填写（一项一行）。'
          }
        },
        {
          element: '.extract-patch .model .patch .reset',
          popover: {
            title: '重置',
            description: '重置增量包信息。'
          }
        },
        {
          element: '.extract-patch .model .patch .re-parse',
          popover: {
            title: '重新解析',
            description: '重新解析增量包信息。'
          }
        },
        {
          element: '.extract-patch .model .patch .extract',
          popover: {
            title: '抽取',
            description: '抽取增量包。'
          }
        },
        {
          element: '.extract-patch .model .patch .output',
          popover: {
            title: '输出',
            description: '查看增量包抽取结果。'
          }
        }
      ]
    })
    driverObj.drive()
  })
}
</script>
