<template>
  <div class="combine-patch">
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
    <n-spin :show="combinePatchInfo.processing" size="large">
      <n-form ref="modelFormRef" class="model" :model="model" label-align="left" label-placement="left" label-width="160">
        <n-h2 prefix="bar">构建包信息</n-h2>
        <n-dynamic-input v-model:value="model.buildPackages" :min="1" :on-create="handleCreateBuildPackage">
          <template #default="{ value: buildPackage, index: buildPackageIndex }: { value: BuildPackageModel, index: number }">
            <n-card class="build-package" hoverable>
              <template #header>
                <n-h3 prefix="bar" style="margin: 0;">构建包 - {{ buildPackageIndex + 1 }}</n-h3>
              </template>
              <n-form-item class="build-package-file-path" label="构建包文件路径" :path="`buildPackages[${buildPackageIndex}].filePath`" :rule="{ required: true, message: '构建包文件路径不能为空' }">
                <n-input-group>
                  <n-input v-model:value="buildPackage.filePath" placeholder="请选择" readonly></n-input>
                  <n-button type="info" ghost @click="handleOpenFile(buildPackage, 'filePath', [{ name: 'Build Package', extensions: ['war'] }])">选择</n-button>
                </n-input-group>
              </n-form-item>
              <n-form-item label="直接合并" :path="`buildPackages[${buildPackageIndex}].directCombine`">
                <n-switch v-model:value="buildPackage.directCombine"></n-switch>
              </n-form-item>
              <n-form-item v-if="buildPackage.directCombine"
                class="build-package-module-name" label="模块名称" :path="`buildPackages[${buildPackageIndex}].moduleName`" :rule="{ required: buildPackage.directCombine, message: '模块名称不能为空' }">
                <n-select v-model:value="buildPackage.moduleName" :options="settingModuleOptions" placeholder="请选择" clearable></n-select>
              </n-form-item>
            </n-card>
          </template>
        </n-dynamic-input>
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
                  <n-button class="pre-combine" type="info" secondary @click="handlePreCombinePatch(patch)">预合并</n-button>
                  <n-button class="combine" type="primary" @click="handleCombinePatch(patch)">合并</n-button>
                </n-space>
              </template>
              <n-form-item class="meta-file-path" label="元数据文件路径" :path="`patches[${patchIndex}].metaFilePath`" :rule="{ required: true, message: '元数据文件路径不能为空' }">
                <n-input-group>
                  <n-input v-model:value="patch.metaFilePath" placeholder="请选择" readonly></n-input>
                  <n-button type="info" ghost @click="handleOpenFile(patch, 'metaFilePath', [{ name: 'Meta File', extensions: ['json', 'txt'] }], handleMetaFilePathChange)">选择</n-button>
                </n-input-group>
              </n-form-item>
              <n-grid :y-gap="10">
                <n-grid-item :span="2">名称</n-grid-item>
                <n-grid-item :span="22">{{ patch.name }}</n-grid-item>
                <n-grid-item :span="2">目录</n-grid-item>
                <n-grid-item :span="22">
                  <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(patch.directory)">{{ patch.directory }}</n-text>
                </n-grid-item>
              </n-grid>
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
                    <n-collapse-item v-if="patch.items.length === 0" title="条目" disabled></n-collapse-item>
                    <n-collapse-item v-for="(item, itemIndex) in patch.items" :key="itemIndex">
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
                        <n-grid-item :span="2">模块名称</n-grid-item>
                        <n-grid-item :span="22">{{ item.moduleName }}</n-grid-item>
                        <n-grid-item :span="2">类路径</n-grid-item>
                        <n-grid-item :span="22">
                          <n-text type="info">{{ item.classPath }}</n-text>
                        </n-grid-item>
                        <n-grid-item :span="2">文件路径</n-grid-item>
                        <n-grid-item :span="22">
                          <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(item.filePath)">{{ item.filePath }}</n-text>
                        </n-grid-item>
                        <template v-if="item.extraItems.length !== 0">
                          <n-grid-item :span="2">额外条目</n-grid-item>
                          <n-grid-item :span="22">
                            <n-grid v-for="(extraItem, extraItemIndex) in item.extraItems" :key="extraItemIndex" :y-gap="10">
                              <n-grid-item :span="2">文件路径</n-grid-item>
                              <n-grid-item :span="22">
                                <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(extraItem.filePath)">{{ extraItem.filePath }}</n-text>
                              </n-grid-item>
                              <n-grid-item :span="2">类路径</n-grid-item>
                              <n-grid-item :span="22">
                                <n-text type="info">{{ extraItem.classPath }}</n-text>
                              </n-grid-item>
                            </n-grid>
                          </n-grid-item>
                        </template>
                        <n-grid-item :span="2">目标构建包文件路径</n-grid-item>
                        <n-grid-item :span="22">
                          <div v-for="(targetBuildPackage, targetBuildPackageIndex) in item.targetBuildPackages" :key="targetBuildPackageIndex">
                            <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(targetBuildPackage.filePath)">{{ targetBuildPackage.filePath }}</n-text>
                          </div>
                        </n-grid-item>
                        <n-grid-item :span="2">目标直接合并构建包文件路径</n-grid-item>
                        <n-grid-item :span="22">
                          <div v-for="(targetDirectCombineBuildPackage, targetDirectCombineBuildPackageIndex) in item.targetDirectCombineBuildPackages" :key="targetDirectCombineBuildPackageIndex">
                            <n-text class="clickable" type="info" underline @click="handleShowItemInFolder(targetDirectCombineBuildPackage.filePath)">{{ targetDirectCombineBuildPackage.filePath }}</n-text>
                          </div>
                        </n-grid-item>
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
          <n-button class="re-parse-all" type="info" size="large" ghost @click="handleReParsePatch()">全部重新解析</n-button>
          <n-button class="pre-combine-all" type="info" size="large" secondary @click="handlePreCombinePatch()">全部预合并</n-button>
          <n-button class="combine-all" type="primary" size="large" @click="handleCombinePatch()">全部合并</n-button>
        </n-space>
      </n-form>
    </n-spin>
    <n-drawer v-model:show="showSetting" to=".mount-root" :trap-focus="false" :mask-closable="false" width="80%">
      <n-drawer-content title="配置" :native-scrollbar="false" closable>
        <template #default>
          <n-form ref="settingModelFormRef" :model="settingModel" label-align="left" label-placement="left" label-width="128">
            <n-h2 prefix="bar">基本配置</n-h2>
            <n-form-item class="custom-seven-zip" label="自定义7z程序" path="customSevenZip">
              <n-input-group>
                <n-input v-model:value="settingModel.customSevenZip" placeholder="请选择" readonly></n-input>
                <n-button type="info" ghost @click="handleOpenFile(settingModel, 'customSevenZip')">选择</n-button>
              </n-input-group>
            </n-form-item>
            <n-form-item class="temp-unzip-directory" label="临时解压目录" path="tempUnzipDirectory" :rule="{ required: true, message: '临时解压目录不能为空' }">
              <n-input-group>
                <n-input v-model:value="settingModel.tempUnzipDirectory" placeholder="请选择" readonly></n-input>
                <n-button type="info" ghost @click="handleOpenDirectory(settingModel, 'tempUnzipDirectory')">选择</n-button>
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
                      <n-form-item label="模块名称" :path="`modules[${moduleIndex}].name`" :rule="{ required: true, message: '模块名称不能为空' }">
                        <n-input v-model:value="module.name" clearable></n-input>
                      </n-form-item>
                      <n-h3 prefix="bar">配置信息</n-h3>
                      <n-form-item label="直接合并" :path="`modules[${moduleIndex}].setting.directCombine`">
                        <n-switch v-model:value="module.setting.directCombine"></n-switch>
                      </n-form-item>
                      <n-form-item label="Jar包路径" :path="`modules[${moduleIndex}].setting.jarPackagePath`" :rule="{ required: !module.setting.directCombine, message: 'Jar包路径不能为空' }">
                        <n-input v-model:value="module.setting.jarPackagePath" clearable></n-input>
                      </n-form-item>
                      <n-form-item v-if="module.setting.directCombine"
                        label="默认直接类路径" :path="`modules[${moduleIndex}].setting.defaultDirectClassPath`" :rule="{ required: true, message: '默认直接类路径不能为空' }">
                        <n-input v-model:value="module.setting.defaultDirectClassPath" clearable></n-input>
                      </n-form-item>
                      <n-collapse v-if="module.setting.directCombine" :default-expanded-names="['otherDirectClassPath']">
                        <n-collapse-item title="其它直接类路径" name="otherDirectClassPath">
                          <n-dynamic-input v-model:value="module.setting.otherDirectClassPaths" :on-create="handleCreateModuleOtherDirectClassPathSetting">
                            <template #default="{ value: otherDirectClassPath, index: otherDirectClassPathIndex }: { value: ModuleOtherDirectClassPathsSettingModel, index: number }">
                              <n-card hoverable>
                                <n-form-item label="扩展名组" :path="`modules[${moduleIndex}].setting.otherDirectClassPaths[${otherDirectClassPathIndex}].extensions`">
                                  <n-select v-model:value="otherDirectClassPath.extensions" :show-arrow="false" :show="false" placeholder="请选择" tag multiple filterable clearable></n-select>
                                </n-form-item>
                                <n-form-item label="类路径" :path="`modules[${moduleIndex}].setting.otherDirectClassPaths[${otherDirectClassPathIndex}].classPath`">
                                  <n-input v-model:value="otherDirectClassPath.classPath" clearable></n-input>
                                </n-form-item>
                                <n-form-item label="原替换" :path="`modules[${moduleIndex}].setting.otherDirectClassPaths[${otherDirectClassPathIndex}].replacement.source`">
                                  <n-input v-model:value="otherDirectClassPath.replacement.source" clearable></n-input>
                                </n-form-item>
                                <n-form-item label="目标替换" :path="`modules[${moduleIndex}].setting.otherDirectClassPaths[${otherDirectClassPathIndex}].replacement.target`">
                                  <n-input v-model:value="otherDirectClassPath.replacement.target" clearable></n-input>
                                </n-form-item>
                              </n-card>
                            </template>
                          </n-dynamic-input>
                        </n-collapse-item>
                      </n-collapse>
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
  buildPackages: Array<{
    filePath: string
    directCombine: boolean
    moduleName: string
    unzipJarPackageDestDirectory: string
    unzippedJarPackagePathMap: {
      [key: string]: string
    }
  }>
  patches: Array<{
    metaFilePath: string
    name: string
    directory: string
    relatedModuleNames: Array<string>
    items: Array<{
      action: '?' | 'A' | 'M' | 'D'
      originPath: string
      filePath: string
      moduleName: string
      targetFilename: string
      classPath: string
      extraItems: Array<{
        filePath: string
        targetFilename: string
        classPath: string
      }>
      targetBuildPackages: Array<BuildPackageModel>
      targetDirectCombineBuildPackages: Array<BuildPackageModel>
      status: 'success' | 'info' | 'warning' | 'error'
      message: string
    }>
    result: {
      successCount: number
      warningCount: number
      errorCount: number
    }
  }>
}
type BuildPackageModel = Model['buildPackages']['0']
type PatchModel = Model['patches'][0]
type PatchItemModel = PatchModel['items'][0]

type SettingModel = {
  version: string
  customSevenZip: string
  tempUnzipDirectory: string
  modules: Array<{
    name: string
    setting: {
      directCombine: boolean
      jarPackagePath: string
      defaultDirectClassPath: string
      otherDirectClassPaths: Array<{
        extensions: Array<string>
        classPath: string
        replacement: {
          source: string
          target: string
        }
      }>,
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
type ModuleOtherDirectClassPathsSettingModel = ModuleSettingValueModel['otherDirectClassPaths'][0]
type ModuleReplacementSettingModel = ModuleSettingValueModel['replacements'][0]
type ModuleReplacementExtensionSettingModel = ModuleReplacementSettingModel['extension']
type ModuleReplacementPathSettingModel = ModuleReplacementSettingModel['path']

type FormattedSetting = {
  customSevenZip: string
  tempUnzipDirectory: string
  modules: {
    [key: string]: ModuleSettingValueModel
  }
}

</script>

<script setup lang="ts">
import { useAddArchive, useCopyFile, useDeleteArchive, useDeleteDirectory, useExtractFullArchive, useGetAppVersion, useGetModuleTempPath, useGlobby, useLoadSetting, useNodePath, useOpenDirectoryDialog, useOpenFileDialog, useReadFile, useReadJsonFile, useSaveSetting, useShowItemInFolder, useShowSettingFileInFolder, useTestArchive } from '@renderer/compositions/ipc-renderer'
import { parseFileInfo } from '@renderer/utils/path'
import { driver } from 'driver.js'
import { defaultsDeep as _defaultsDeep } from 'lodash-es'
import { FormInst, NBadge, NButton, NCard, NCollapse, NCollapseItem, NDivider, NDrawer, NDrawerContent, NDynamicInput, NForm, NFormItem, NGrid, NGridItem, NH1, NH2, NH3, NInput, NInputGroup, NPageHeader, NSelect, NSpace, NSpin, NSwitch, NTag, NText } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { parseItemsText } from './patch'

const nodePath = useNodePath()
const appVersion = ref('')

const MODULE_NAME = 'combine-patch'

const route = ref(useRoute())
const title = route.value.meta?.title

onMounted(async () => {
  appVersion.value = await useGetAppVersion()

  await loadSetting()
})

const model = ref<Model>({
  buildPackages: [buildDefaultBuildPackage()],
  patches: [buildDefaultPatch()]
})
const modelFormRef = ref<FormInst | null>(null)

function buildDefaultBuildPackage(): BuildPackageModel {
  return {
    filePath: '',
    directCombine: false,
    moduleName: '',
    unzipJarPackageDestDirectory: '',
    unzippedJarPackagePathMap: {}
  }
}

function handleCreateBuildPackage() {
  return buildDefaultBuildPackage()
}

function buildDefaultPatch(): PatchModel {
  return {
    metaFilePath: '',
    name: '',
    directory: '',
    relatedModuleNames: [],
    items: [],
    result: {
      successCount: 0,
      warningCount: 0,
      errorCount: 0
    }
  }
}

function handleCreatePatch() {
  return buildDefaultPatch()
}

function handleResetPatch(selectedPatch?: PatchModel) {
  const patches = selectedPatch ? [selectedPatch] : model.value.patches
  for (const patch of patches) {
    Object.assign(patch, buildDefaultPatch())
  }
}

async function handleOpenFile(model, key, filters?: Array<Record<string, unknown>>, onChange?: (model) => void) {
  const { filePaths } = await useOpenFileDialog({
    defaultPath: model[key] || '',
    filters
  })
  model[key] = filePaths?.[0] ?? model[key]
  onChange && onChange(model)
}

async function handleOpenDirectory(model, key) {
  const { filePaths } = await useOpenDirectoryDialog({
    defaultPath: model[key] || ''
  })

  model[key] = filePaths?.[0] ?? model[key]
}

function handleMetaFilePathChange(patch: PatchModel) {
  parsePatch(patch)
}

function handleReParsePatch(selectedPatch?: PatchModel) {
  const patches = selectedPatch ? [selectedPatch] : model.value.patches
  for (const patch of patches) {
    parsePatch(patch)
  }
}

async function parsePatch(patch: PatchModel) {
  if (patch.metaFilePath) {
    const metaFileExtension = nodePath.extname(patch.metaFilePath).toLowerCase()
    const meta = {
      name: '',
      items: [],
      relatedModuleNames: []
    }
    if (metaFileExtension === '.json') {
      const jsonMeta = await useReadJsonFile(patch.metaFilePath)
      Object.assign(meta, jsonMeta)
    }
    if (metaFileExtension === '.txt') {
      const textMeta = await transformTextMetaFile(patch)
      Object.assign(meta, textMeta)
    }
    patch.name = meta.name
    patch.directory = nodePath.dirname(patch.metaFilePath)
    const relatedModuleNames = new Set<string>()
    meta.items.forEach((item: PatchItemModel) => {
      const { moduleName, targetFilename, extraItems } = item
      relatedModuleNames.add(moduleName)
      const { modules: moduleSettings } = formattedSetting.value
      const moduleSetting = moduleSettings[moduleName]
      Object.assign(item, moduleSetting ? {
        status: 'info',
        message: '待处理'
      } : {
        status: 'error',
        message: `未找到模块配置 | ${JSON.stringify({ moduleName })}`
      }, {
        filePath: nodePath.join(patch.directory, targetFilename),
        targetBuildPackages: [],
        targetDirectCombineBuildPackages: []
      })

      extraItems.forEach(extraItem => Object.assign(extraItem, {
        filePath: nodePath.join(patch.directory, extraItem.targetFilename)
      }))
    })
    patch.items = meta.items
    patch.relatedModuleNames = meta.relatedModuleNames || [...relatedModuleNames]

    patch.result.warningCount = 0
    patch.result.errorCount = 0
    patch.items.forEach(patchItem => {
      if (patchItem.status === 'warning') {
        patch.result.warningCount++
      }
      if (patchItem.status === 'error') {
        patch.result.errorCount++
      }
    })
  } else {
    Object.assign(patch, buildDefaultPatch())
  }
}

async function transformTextMetaFile(patch: PatchModel) {
  const itemsText = await useReadFile(patch.metaFilePath)
  const patchDirectoryName = nodePath.dirname(patch.metaFilePath)
  const parsedItemsInfo = await parseItemsText(
    itemsText,
    patchDirectoryName,
    moduleName => {
      const { modules: moduleSettings } = formattedSetting.value
      const moduleSetting = moduleSettings[moduleName]
      return moduleSetting && {
        rootDirectory: patchDirectoryName,
        replacements: moduleSetting.replacements
      }
    },
    async parsedItem => {
      const parsedSourcePathFileInfo = parseFileInfo(parsedItem.sourcePath)
      if (!parsedSourcePathFileInfo) {
        parsedItem.status = 'error'
        parsedItem.message = `路径解析错误 | ${JSON.stringify({ itemText: parsedItem.text })}`
        return []
      }
      const globSourcePathPattern = nodePath.join(patchDirectoryName, `${parsedSourcePathFileInfo.baseName}$*${parsedSourcePathFileInfo.extension}`)
      const globSourcePaths = (await useGlobby(globSourcePathPattern) as string[])
      return globSourcePaths.map(globSourcePath => {
        const parsedGlobSourcePathFileInfo = parseFileInfo(globSourcePath)
        if (!parsedGlobSourcePathFileInfo) {
          parsedItem.status = 'error'
          parsedItem.message = `路径解析错误 | ${JSON.stringify({ itemText: parsedItem.text })}`
          return {
            sourcePath: '',
            targetPath: '',
            targetFilename: '',
            classPath: ''
          }
        }

        return {
          sourcePath: globSourcePath,
          targetPath: patchDirectoryName ? nodePath.join(patchDirectoryName, parsedGlobSourcePathFileInfo.filename) : '',
          targetFilename: parsedGlobSourcePathFileInfo.filename,
          classPath: parsedItem.classPath.replace(parsedSourcePathFileInfo.baseName, parsedGlobSourcePathFileInfo.baseName)
        }
      })
    }
  )

  return {
    name: patchDirectoryName,
    items: parsedItemsInfo.items,
    relatedModuleNames: parsedItemsInfo.relatedModuleNames
  }
}

async function handlePreCombinePatch(selectedPatch?: PatchModel) {
  await modelFormRef.value?.validate().then(async () => {
    combinePatchInfo.value.processing = true

    const { customSevenZip, tempUnzipDirectory, modules: moduleSettings } = formattedSetting.value
    const { buildPackages, patches } = model.value

    const selectedPatches = selectedPatch ? [selectedPatch] : patches
    const itemGroups = selectedPatches.reduce((result, patch) => {
      patch.result.warningCount = 0
      patch.result.errorCount = 0
      result.push(patch.items)
      return result
    }, ([] as Array<Array<PatchItemModel>>))

    for (let i = 0; i < itemGroups.length; i++) {
      const items = itemGroups[i]
      const patch = selectedPatches[i]
      for (const item of items) {
        const { moduleName, status } = item
        if (status === 'error') {
          continue
        }
        const moduleSetting = moduleSettings[moduleName]

        item.targetBuildPackages = []
        item.targetDirectCombineBuildPackages = []

        for (const buildPackage of buildPackages) {
          const { filePath, unzippedJarPackagePathMap } = buildPackage

          buildPackage.unzipJarPackageDestDirectory = buildPackage.unzipJarPackageDestDirectory || nodePath.join(tempUnzipDirectory, `${nodePath.parse(buildPackage.filePath).name}-${Date.now()}`)

          const jarPackagePath = moduleSetting.jarPackagePath
          const unzippedJarPackagePath = unzippedJarPackagePathMap[moduleName]
          if (jarPackagePath && !unzippedJarPackagePath) {
            try {
              await useTestArchive(customSevenZip, filePath, [jarPackagePath])
            } catch (error) {
              continue
            }

            unzippedJarPackagePathMap[moduleName] = jarPackagePath
          }

          if (unzippedJarPackagePathMap[moduleName]) {
            item.targetBuildPackages.push(buildPackage)
          }

          if (moduleSetting.directCombine && buildPackage.directCombine && moduleName === buildPackage.moduleName) {
            item.targetDirectCombineBuildPackages.push(buildPackage)
          }
        }

        if (item.targetBuildPackages.length === 0 && item.targetDirectCombineBuildPackages.length === 0) {
          item.status = 'error'
          item.message = '未找到目标构建包 | 请确认选择的构建包'
          patch.result.errorCount++
          continue
        }

        const conflicted = checkPatchItemConflict(item, patch, selectedPatches)
        if (conflicted) {
          continue
        }

        item.status = 'info'
        item.message = ''
      }
    }

    combinePatchInfo.value.processing = false
    window.$message?.info('预合并结束')
  }).catch(errors => errors && window.$message?.error('必填参数不能为空'))
    .finally(() => combinePatchInfo.value.processing = false)
}

function checkPatchItemConflict(selectedPatchItem: PatchItemModel, selectedPatch: PatchModel, selectedPatches: Array<PatchModel>): boolean {
  let result = false

  selectedPatches.forEach(patch => {
    if (patch.metaFilePath === selectedPatch.metaFilePath) {
      return
    }

    for (const item of patch.items) {
      if (item.moduleName === selectedPatchItem.moduleName && item.classPath === selectedPatchItem.classPath) {
        selectedPatchItem.status = 'warning'
        selectedPatchItem.message = `与增量包【${patch.metaFilePath}】有冲突，请重新确认`
        selectedPatch.result.warningCount++
        result = true
      }
    }
  })

  return result
}

function handleShowItemInFolder(fullPath: string) {
  useShowItemInFolder(fullPath)
}

const combinePatchInfo = ref<{
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
async function handleCombinePatch(selectedPatch?: PatchModel) {
  await handlePreCombinePatch(selectedPatch)

  modelFormRef.value?.validate().then(async () => {
    combinePatchInfo.value.processing = true
    combinePatchInfo.value.canceled = false
    combinePatchInfo.value.processedPercent = 0

    const { customSevenZip, modules: moduleSettings } = formattedSetting.value
    const { buildPackages, patches } = model.value

    for (const buildPackage of buildPackages) {
      const { filePath, unzipJarPackageDestDirectory, unzippedJarPackagePathMap } = buildPackage

      const unzippedJarPackagePaths = new Set(Object.values(unzippedJarPackagePathMap))
      for (const unzippedJarPackagePath of unzippedJarPackagePaths) {
        await useExtractFullArchive(customSevenZip, filePath, unzipJarPackageDestDirectory, [unzippedJarPackagePath])
      }
    }

    const selectedPatches = selectedPatch ? [selectedPatch] : patches
    let processedPatchCount = 0
    for (const selectedPatch of selectedPatches) {
      const { directory, items, result } = selectedPatch

      result.successCount = 0
      result.warningCount = 0
      result.errorCount = 0

      for (const item of items) {
        if (item.status === 'error') {
          result.errorCount++
          continue
        }

        const { action, moduleName, targetFilename, classPath, extraItems, targetBuildPackages, targetDirectCombineBuildPackages } = item
        const moduleSetting = moduleSettings[moduleName]
        const { defaultDirectClassPath, otherDirectClassPaths } = moduleSetting
        const classPathFileInfo = parseFileInfo(classPath)
        if (!classPathFileInfo) {
            item.status = 'error'
            item.message = `路径解析错误 | ${JSON.stringify({ item, moduleSetting })}`
            continue
        }

        for (const targetBuildPackage of targetBuildPackages) {
          if (combinePatchInfo.value.canceled) {
            return
          }

          if (item.status === 'error') {
            continue
          }

          const { unzipJarPackageDestDirectory, unzippedJarPackagePathMap } = targetBuildPackage
          const matchedUnzippedJarPackagePath = unzippedJarPackagePathMap[moduleName]
          if (matchedUnzippedJarPackagePath) {
            try {
              switch (action) {
                default:
                case 'A':
                case 'M': {
                  await useCopyFile(nodePath.join(directory, targetFilename), nodePath.join(directory, classPath))
                  await useAddArchive(customSevenZip, nodePath.join(unzipJarPackageDestDirectory, matchedUnzippedJarPackagePath), directory, [classPath])

                  for (const extraItem of extraItems) {
                    await useCopyFile(nodePath.join(directory, extraItem.targetFilename), nodePath.join(directory, extraItem.classPath))
                    await useAddArchive(customSevenZip, nodePath.join(unzipJarPackageDestDirectory, matchedUnzippedJarPackagePath), directory, [extraItem.classPath])
                  }
                  break
                }
                case 'D': {
                  await useDeleteArchive(customSevenZip, nodePath.join(unzipJarPackageDestDirectory, matchedUnzippedJarPackagePath), [classPath])
                  await useDeleteArchive(customSevenZip, nodePath.join(unzipJarPackageDestDirectory, matchedUnzippedJarPackagePath), [nodePath.join(classPathFileInfo.directory, `${classPathFileInfo.baseName}$*${classPathFileInfo.extension}`)])
                  break
                }
              }
            } catch (error) {
              item.status = 'error'
              item.message = `文件复制或压缩错误 | ${(error as Error).message}`
            }
          }
        }

        if (targetDirectCombineBuildPackages.length !== 0) {
          for (const targetDirectCombineBuildPackage of targetDirectCombineBuildPackages) {
            if (combinePatchInfo.value.canceled) {
              return
            }

            if (item.status === 'error') {
              continue
            }

            const { filePath: buildFilePath } = targetDirectCombineBuildPackage
            try {
              switch (action) {
                default:
                case 'A':
                case 'M': {
                  await useCopyFile(nodePath.join(directory, targetFilename), nodePath.join(directory, defaultDirectClassPath, classPath))
                  await useAddArchive(customSevenZip, buildFilePath, directory, [nodePath.join(defaultDirectClassPath, classPath)])

                  for (const extraItem of extraItems) {
                    await useCopyFile(nodePath.join(directory, extraItem.targetFilename), nodePath.join(directory, defaultDirectClassPath, extraItem.classPath))
                    await useAddArchive(customSevenZip, buildFilePath, directory, [nodePath.join(defaultDirectClassPath, extraItem.classPath)])
                  }

                  for (const otherDirectClassPath of otherDirectClassPaths) {
                    const replacedClassPath = classPath.replaceAll(otherDirectClassPath.replacement.source, otherDirectClassPath.replacement.target)
                    const replacedClassPathFileInfo = parseFileInfo(replacedClassPath)
                    if (!replacedClassPathFileInfo) {
                      item.status = 'error'
                      item.message = `路径解析错误 | ${JSON.stringify({ item, moduleSetting })}`
                      break
                    }

                    if (otherDirectClassPath.extensions.includes(replacedClassPathFileInfo.extension)) {
                      await useCopyFile(nodePath.join(directory, targetFilename), nodePath.join(directory, otherDirectClassPath.classPath, replacedClassPath))
                      await useAddArchive(customSevenZip, buildFilePath, directory, [nodePath.join(otherDirectClassPath.classPath, replacedClassPath)])

                      for (const extraItem of extraItems) {
                        const replacedExtraClassPath = extraItem.classPath.replaceAll(otherDirectClassPath.replacement.source, otherDirectClassPath.replacement.target)
                        await useCopyFile(nodePath.join(directory, extraItem.targetFilename), nodePath.join(directory, otherDirectClassPath.classPath, replacedExtraClassPath))
                        await useAddArchive(customSevenZip, buildFilePath, directory, [nodePath.join(otherDirectClassPath.classPath, replacedExtraClassPath)])
                      }
                    }
                  }
                  break
                }
                case 'D': {
                  await useDeleteArchive(customSevenZip, buildFilePath, [nodePath.join(defaultDirectClassPath, classPath)])
                  await useDeleteArchive(customSevenZip, buildFilePath, [nodePath.join(defaultDirectClassPath, classPathFileInfo.directory, `${classPathFileInfo.baseName}$*${classPathFileInfo.extension}`)])

                  for (const otherDirectClassPath of otherDirectClassPaths) {
                    const replacedClassPath = classPath.replaceAll(otherDirectClassPath.replacement.source, otherDirectClassPath.replacement.target)
                    const replacedClassPathFileInfo = parseFileInfo(replacedClassPath)
                    if (!replacedClassPathFileInfo) {
                      item.status = 'error'
                      item.message = `路径解析错误 | ${JSON.stringify({ item, moduleSetting })}`
                      break
                    }

                    if (otherDirectClassPath.extensions.includes(replacedClassPathFileInfo.extension)) {
                      await useDeleteArchive(customSevenZip, buildFilePath, [nodePath.join(otherDirectClassPath.classPath, replacedClassPath)])
                      await useDeleteArchive(customSevenZip, buildFilePath, [nodePath.join(otherDirectClassPath.classPath, replacedClassPathFileInfo.directory, `${replacedClassPathFileInfo.baseName}$*${replacedClassPathFileInfo.extension}`)])
                    }
                  }
                  break
                }
              }
            } catch (error) {
              item.status = 'error'
              item.message = `文件复制或压缩错误 | ${(error as Error).message}`
            }
          }
        }

        if (item.status !== 'error') {
          item.status = 'success'
          item.message = '成功'
          result.successCount++
        } else {
          result.errorCount++
        }
      }

      processedPatchCount++
      combinePatchInfo.value.processedPercent = Math.floor(processedPatchCount / selectedPatches.length * 100)
    }

    for (const buildPackage of buildPackages) {
      const { filePath, unzipJarPackageDestDirectory, unzippedJarPackagePathMap } = buildPackage
      const unzippedJarPackagePaths = new Set(Object.values(unzippedJarPackagePathMap))
      for (const unzippedJarPackagePath of unzippedJarPackagePaths) {
        await useAddArchive(customSevenZip, filePath, unzipJarPackageDestDirectory, [unzippedJarPackagePath])
      }
      await useDeleteDirectory(unzipJarPackageDestDirectory)
    }

    if (combinePatchInfo.value.processedPercent === 100) {
      combinePatchInfo.value.processing = false
      window.$message?.info('合并结束')
    }
  }).catch(errors => errors && window.$message?.error('必填参数不能为空'))
    .finally(() => combinePatchInfo.value.processing = false)
}

const settingModel = ref<SettingModel>({
  version: '',
  customSevenZip: '',
  tempUnzipDirectory: '',
  modules: [buildDefaultModuleSetting()]
})
const settingModelFormRef = ref<FormInst | null>(null)
const formattedSetting = computed<FormattedSetting>(() => {
  const settingCopy: SettingModel = JSON.parse(JSON.stringify(settingModel.value))

  const modules = settingCopy.modules.reduce((modulesResult, module) => {
    modulesResult[module.name] = {
      ...module.setting
    }
    return modulesResult
  }, {})

  return {
    customSevenZip: settingCopy.customSevenZip,
    tempUnzipDirectory: settingCopy.tempUnzipDirectory,
    modules
  }
})

function buildDefaultModuleSetting(): ModuleSettingModel {
  return {
    name: '',
    setting: {
      directCombine: false,
      jarPackagePath: '',
      defaultDirectClassPath: 'WEB-INF/classes',
      otherDirectClassPaths: [buildDefaultModuleOtherDirectClassPathSetting()],
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

function buildDefaultModuleOtherDirectClassPathSetting() {
  return {
    extensions: ['.js', '.html', '.css'],
    classPath: '.',
    replacement: {
      source: 'META-INF/resources',
      target: ''
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

function handleCreateModuleOtherDirectClassPathSetting() {
  return buildDefaultModuleOtherDirectClassPathSetting()
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
  await useLoadSetting(MODULE_NAME).then(async (setting?: SettingModel) => {
    if (setting?.version === appVersion.value) {
      settingModel.value = setting
    } else {
      settingModel.value = _defaultsDeep(setting, {
        modules: Array.from(Array(setting?.modules.length), buildDefaultModuleSetting)
      }, settingModel.value)
      settingModel.value.version = appVersion.value
    }

    if (!settingModel.value.tempUnzipDirectory) {
      settingModel.value.tempUnzipDirectory = await useGetModuleTempPath(MODULE_NAME)
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

const settingModuleOptions = computed<Array<{
  label: string
  value: string
}>>(() => {
  return Object.entries(formattedSetting.value.modules).filter(([, module]) => module.directCombine).map(([moduleName]) => ({
    label: moduleName,
    value: moduleName
  }))
})

function handleGuide() {
  setTimeout(() => {
    const driverObj = driver({
      doneBtnText: '完成',
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      steps: [
        {
          element: '.combine-patch .model .build-package-file-path',
          popover: {
            title: '构建包文件路径',
            description: '选择需要合并的构建包。'
          }
        },
        {
          element: '.combine-patch .model .patch',
          popover: {
            title: '增量包',
            description: '增量包信息，可以添加多个条目。'
          }
        },
        {
          element: '.combine-patch .model .patch .meta-file-path',
          popover: {
            title: '输入',
            description: '选择增量包元数据文件。'
          }
        },
        {
          element: '.combine-patch .model .patch .reset',
          popover: {
            title: '重置',
            description: '重置增量包信息。'
          }
        },
        {
          element: '.combine-patch .model .patch .re-parse',
          popover: {
            title: '重新解析',
            description: '重新解析增量包信息。'
          }
        },
        {
          element: '.combine-patch .model .patch .pre-combine',
          popover: {
            title: '预合并',
            description: '预合并增量包，不会真实操作文件。'
          }
        },
        {
          element: '.combine-patch .model .patch .combine',
          popover: {
            title: '合并',
            description: '合并增量包。'
          }
        },
        {
          element: '.combine-patch .model .patch .output',
          popover: {
            title: '输出',
            description: '查看增量包合并结果。'
          }
        }
      ]
    })
    driverObj.drive()
  })
}
</script>
