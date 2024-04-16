<template>
  <ul class="versions">
    <li class="electron-version">Application v{{ appVersion }}</li>
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
    <li class="v8-version">V8 v{{ versions.v8 }}</li>
  </ul>
</template>

<script setup lang="ts">
import { useGetAppVersion } from '@renderer/compositions/ipc-renderer'
import { onMounted, ref } from 'vue'

const appVersion = ref('')

onMounted(async () => {
  appVersion.value = await useGetAppVersion()
})

const versions = ref({ ...window.electron.process.versions })
</script>

<style scoped lang="stylus">
.versions
  display: flex
  justify-content: space-between
  padding: 10px
  margin: 0
  list-style: none
</style>
