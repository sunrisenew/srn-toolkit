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
      <n-form ref="modelFormRef" class="model" :model="model" label-align="left" label-placement="left" label-width="128">
        <n-h2 prefix="bar">构建包信息</n-h2>
        <n-dynamic-input v-model:value="model.buildPackages" :min="1" :item-class="'flex-auto'" :on-create="handleCreateBuildPackage">
          <template #default="{ value: buildPackage, index: buildPackageIndex }: { value: BuildPackageModel, index: number }">
            <n-form-item class="build-package-file-path full-width" :label="`构建包文件路径 - ${buildPackageIndex + 1}`" :path="`buildPackages[${buildPackageIndex}].filePath`" :rule="{ required: true, message: '构建包文件路径不能为空' }" label-width="160">
              <n-input-group>
                <n-input v-model:value="buildPackage.filePath" readonly></n-input>
                <n-button type="info" ghost @click="handleOpenFile(buildPackage, 'filePath', [{ name: 'Build Package', extensions: ['war'] }])">选择</n-button>
              </n-input-group>
            </n-form-item>
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
                  <n-input v-model:value="patch.metaFilePath" readonly></n-input>
                  <n-button type="info" ghost @click="handleOpenFile(patch, 'metaFilePath', [{ name: 'Meta File', extensions: ['json'] }], handleMetaFilePathChange)">选择</n-button>
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
              <n-thing class="output" title="输出">
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
                      <n-grid-item :span="2">信息</n-grid-item>
                      <n-grid-item :span="22">
                        <n-text :type="item.status">{{ item.message }}</n-text>
                      </n-grid-item>
                    </n-grid>
                  </n-collapse-item>
                </n-collapse>
              </n-thing>
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
                <n-input v-model:value="settingModel.customSevenZip" clearable></n-input>
                <n-button type="info" ghost @click="handleOpenFile(settingModel, 'customSevenZip')">选择</n-button>
              </n-input-group>
            </n-form-item>
            <n-form-item class="temp-unzip-directory" label="临时解压目录" path="tempUnzipDirectory" :rule="{ required: true, message: '临时解压目录不能为空' }">
              <n-input-group>
                <n-input v-model:value="settingModel.tempUnzipDirectory" readonly></n-input>
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
                      <n-form-item label="Jar包路径" :path="`modules[${moduleIndex}].setting.jarPackagePath`" :rule="{ required: true, message: 'Jar包路径不能为空' }">
                        <n-input v-model:value="module.setting.jarPackagePath" clearable></n-input>
                      </n-form-item>
                    </n-collapse-item>
                  </n-collapse>
                </n-card>
              </template>
            </n-dynamic-input>
          </n-form>
        </template>
        <template #footer>
          <n-space justify="space-between" style="width: 100%;">
            <n-button type="info" ghost @click="handleShowSettingFileInFolder()">定位文件</n-button>
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
      action: 'A' | 'M' | 'D'
      originPath: string
      filePath: string
      moduleName: string
      moduleSetting: {
        jarPackagePath: string
      }
      targetFilename: string
      classPath: string
      extraItems: Array<{
        filePath: string
        targetFilename: string
        classPath: string
      }>
      targetBuildPackages: Array<BuildPackageModel>
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
type PatchItemModel = Model['patches'][0]['items'][0]

type SettingModel = {
  customSevenZip: string
  tempUnzipDirectory: string
  modules: Array<{
    name: string
    setting: {
      jarPackagePath: string
    }
  }>
}
type ModuleSettingModel = SettingModel['modules'][0]

</script>

<script setup lang="ts">
import { useAddArchive, useCopyFile, useDeleteArchive, useDeleteDirectory, useExtractFullArchive, useGetModuleTempPath, useLoadSetting, useNodePath, useOpenDirectoryDialog, useOpenFileDialog, useReadJsonFile, useSaveSetting, useShowItemInFolder, useShowSettingFileInFolder, useTestArchive } from '@renderer/compositions/ipc-renderer'
import { parseFileInfo } from '@renderer/utils/path'
import { driver } from 'driver.js'
import { FormInst, NBadge, NButton, NCard, NCollapse, NCollapseItem, NDivider, NDrawer, NDrawerContent, NDynamicInput, NForm, NFormItem, NGrid, NGridItem, NH1, NH2, NH3, NInput, NInputGroup, NPageHeader, NSpace, NSpin, NTag, NText, NThing } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const nodePath = useNodePath()

const route = ref(useRoute())
const title = route.value.meta?.title

onMounted(() => {
  loadSetting()
})

const model = ref<Model>({
  buildPackages: [buildDefaultBuildPackage()],
  patches: [buildDefaultPatch()]
})
const modelFormRef = ref<FormInst | null>(null)

function buildDefaultBuildPackage(): BuildPackageModel {
  return {
    filePath: '',
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
    const meta = await useReadJsonFile(patch.metaFilePath)
    patch.name = meta.name
    patch.directory = nodePath.dirname(patch.metaFilePath)
    const relatedModuleNames = new Set<string>()
    meta.items.forEach((item: PatchItemModel) => {
      const { moduleName, targetFilename, extraItems } = item
      relatedModuleNames.add(moduleName)
      const moduleSetting = formattedSetting.value.modules[moduleName]
      Object.assign(item, moduleSetting ? {
        moduleSetting: JSON.parse(JSON.stringify(moduleSetting)),
        status: 'info',
        message: '待处理'
      } : {
        status: 'error',
        message: `未找到模块配置 | ${JSON.stringify({ moduleName })}`
      }, {
        filePath: nodePath.resolve(patch.directory, targetFilename),
        targetBuildPackages: []
      })

      extraItems.forEach(extraItem => Object.assign(extraItem, {
        filePath: nodePath.resolve(patch.directory, extraItem.targetFilename)
      }))
    })
    patch.items = meta.items
    patch.relatedModuleNames = meta.relatedModuleNames || [...relatedModuleNames]
  } else {
    Object.assign(patch, buildDefaultPatch())
  }
}

async function handlePreCombinePatch(selectedPatch?: PatchModel) {
  await modelFormRef.value?.validate().then(async () => {
    combinePatchInfo.value.processing = true

    const customSevenZip = formattedSetting.value.customSevenZip
    const { buildPackages, patches } = model.value

    const selectedPatches = selectedPatch ? [selectedPatch] : patches
    const allPatchItems = selectedPatches.reduce((result, selectedPatch) => result.concat(selectedPatch.items), ([] as Array<PatchItemModel>))

    for (const patchItem of allPatchItems) {
      if (patchItem.status === 'error') {
        continue
      }

      const { moduleName, moduleSetting } = patchItem

      patchItem.targetBuildPackages = []

      for (const buildPackage of buildPackages) {
        const { filePath, unzippedJarPackagePathMap } = buildPackage

        buildPackage.unzipJarPackageDestDirectory = nodePath.resolve(formattedSetting.value.tempUnzipDirectory, `${nodePath.parse(buildPackage.filePath).name}-${Date.now()}`)

        const unzippedJarPackagePath = unzippedJarPackagePathMap[moduleName]
        if (!unzippedJarPackagePath) {
          const jarPackagePath = moduleSetting.jarPackagePath
          try {
            await useTestArchive(customSevenZip, filePath, [jarPackagePath])
          } catch (error) {
            continue
          }

          unzippedJarPackagePathMap[moduleName] = jarPackagePath
        }

        if (unzippedJarPackagePathMap[moduleName]) {
          patchItem.targetBuildPackages.push(buildPackage)
        }
      }

      if (patchItem.targetBuildPackages.length === 0) {
        patchItem.status = 'error'
        patchItem.message = '未找到目标构建包 | 请确认选择的构建包'
      }
    }

    combinePatchInfo.value.processing = false
    window.$message?.info('预合并结束')
  }).catch(errors => errors && window.$message?.error('必填参数不能为空'))
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

    const customSevenZip = formattedSetting.value.customSevenZip
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

        const { moduleName, targetFilename, classPath, extraItems, targetBuildPackages } = item

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
              switch (item.action) {
                default:
                case 'A':
                case 'M': {
                  await useCopyFile(`${directory}/${targetFilename}`, `${directory}/${classPath}`)
                  await useAddArchive(customSevenZip, nodePath.resolve(unzipJarPackageDestDirectory, matchedUnzippedJarPackagePath), directory, [classPath])

                  for (const extraItem of extraItems) {
                    await useCopyFile(`${directory}/${extraItem.targetFilename}`, `${directory}/${extraItem.classPath}`)
                    await useAddArchive(customSevenZip, nodePath.resolve(unzipJarPackageDestDirectory, matchedUnzippedJarPackagePath), directory, [extraItem.classPath])
                  }
                  break
                }
                case 'D': {
                  await useDeleteArchive(customSevenZip, nodePath.resolve(unzipJarPackageDestDirectory, matchedUnzippedJarPackagePath), [classPath])
                  const classPathFileInfo = parseFileInfo(classPath)
                  await useDeleteArchive(customSevenZip, nodePath.resolve(unzipJarPackageDestDirectory, matchedUnzippedJarPackagePath), [`${classPathFileInfo?.directory}${classPathFileInfo?.baseName}$*${classPathFileInfo?.extension}`])
                  break
                }
              }
            } catch (error) {
              item.status = 'error'
              item.message = `文件复制或压缩错误 | ${(error as Error).message}`
              result.errorCount++
            }
          }
        }

        item.status = 'success'
        item.message = '成功'
        result.successCount++
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

const MODULE_NAME = 'combine-patch'
const settingModel = ref<SettingModel>({
  customSevenZip: '',
  tempUnzipDirectory: '',
  modules: [buildDefaultModuleSetting()]
})
const settingModelFormRef = ref<FormInst | null>(null)
const formattedSetting = computed<{
  customSevenZip: string
  tempUnzipDirectory: string
  modules: {
    [key: string]: ModuleSettingModel['setting']
  }
}>(() => {
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
      jarPackagePath: ''
    }
  }
}

function handleCreateModuleSetting() {
  return buildDefaultModuleSetting()
}

const showSetting = ref(false)

async function toggleShowSetting(show: boolean) {
  show && await loadSetting()
  showSetting.value = show
}

const loadingSetting = ref(false)

async function loadSetting() {
  loadingSetting.value = true
  await useLoadSetting(MODULE_NAME).then(async setting => {
    settingModel.value = setting ?? settingModel.value
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
