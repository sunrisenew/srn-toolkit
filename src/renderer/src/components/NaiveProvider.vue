<template>
  <n-config-provider :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN" namespace="srn" abstract inline-theme-disabled>
    <n-global-style></n-global-style>
    <n-dialog-provider>
      <n-loading-bar-provider>
        <n-message-provider>
          <n-modal-provider>
            <n-notification-provider>
              <slot></slot>
              <naive-provider-content></naive-provider-content>
            </n-notification-provider>
          </n-modal-provider>
        </n-message-provider>
      </n-loading-bar-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { dateZhCN, GlobalThemeOverrides, NConfigProvider, NDialogProvider, NGlobalStyle, NLoadingBarProvider, NMessageProvider, NModalProvider, NNotificationProvider, useDialog, useLoadingBar, useMessage, useModal, useNotification, useThemeVars, zhCN } from 'naive-ui'
import { defineComponent, ref } from 'vue'

const themeVars = useThemeVars()
const themeOverrides = ref<GlobalThemeOverrides>({
  common: {
    primaryColor: themeVars.value.infoColor,
    primaryColorHover: themeVars.value.infoColorHover,
    primaryColorPressed: themeVars.value.infoColorPressed,
    primaryColorSuppl: themeVars.value.infoColorSuppl
  }
})

const NaiveProviderContent = defineComponent({
  setup() {
    window.$dialog = useDialog()
    window.$loadingBar = useLoadingBar()
    window.$message = useMessage()
    window.$modal = useModal()
    window.$notification = useNotification()
  },
  render() {
    return ''
  }
})
</script>
