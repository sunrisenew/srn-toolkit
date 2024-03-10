<template>
  <n-layout class="layout" content-style="height: 100%;" :native-scrollbar="false" has-sider>
    <n-layout-sider v-model:collapsed="menuCollapsed" class="layout-sider" show-trigger="bar" collapse-mode="width" :collapsed-width="64" :native-scrollbar="false" bordered>
      <n-menu ref="menuRef" :options="menuOptions" :value="currentRouteName" :collapsed="menuCollapsed" :collapsed-width="64"></n-menu>
    </n-layout-sider>
    <n-layout class="sub-layout mount-root" content-style="height: 100%; display: flex; flex-direction: column" :native-scrollbar="false">
      <n-layout-header bordered>
        <n-page-header>
          <template #title>
            <n-breadcrumb>
              <n-breadcrumb-item v-for="breadcrumbItem in breadcrumbItems" :key="breadcrumbItem.key" :clickable="breadcrumbItem.clickable" :href="breadcrumbItem.clickable ? breadcrumbItem.path : ''">
                <n-icon v-if="breadcrumbItem.icon" class="prefix-icon">
                  <img :src="breadcrumbItem.icon" />
                </n-icon>
                <span>{{ breadcrumbItem.label }}</span>
              </n-breadcrumb-item>
            </n-breadcrumb>
          </template>
        </n-page-header>
      </n-layout-header>
      <n-layout-content class="layout-content" content-style="padding: 24px" :native-scrollbar="false">
        <router-view #="{ Component }">
          <keep-alive>
            <component :is="Component"></component>
          </keep-alive>
        </router-view>
      </n-layout-content>
      <n-layout-footer bordered>
        <versions></versions>
      </n-layout-footer>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import Versions from '@renderer/components/Versions.vue'
import { useCreateBrowserWindow } from '@renderer/compositions/ipc-renderer'
import { MenuInst, MenuOption, NBreadcrumb, NBreadcrumbItem, NIcon, NLayout, NLayoutContent, NLayoutFooter, NLayoutHeader, NLayoutSider, NMenu, NPageHeader } from 'naive-ui'
import { computed, h, ref, watch } from 'vue'
import { RouteLocationMatched, RouteRecord, RouteRecordRaw, RouterLink, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const routes = router.getRoutes()
const currentRouteName = computed(() => route.name?.toString())

const menuRef = ref<MenuInst | null>(null)
const menuOptions = routes.filter(route => route.meta?.root).map(mapRouteToMenu)
const menuCollapsed = ref(false)

watch([currentRouteName, menuRef], () => menuRef.value?.showOption(currentRouteName.value))

function mapRouteToMenu(route: RouteRecord | RouteRecordRaw) {
  const menuOption: MenuOption = {
    key: route.name?.toString(),
    label: route.meta?.createWindow ? () => h('a', {
      onClick() {
        useCreateBrowserWindow(route.meta?.createWindowChannel)
      }
    }, route.meta?.title) : () => route.meta?.unroutable ? route.meta?.title : h(RouterLink, {
      to: {
        name: route.name?.toString()
      }
    }, () => route.meta?.title),
    icon: () => route.meta?.icon ? h(NIcon, undefined, () => h('img', {
      src: route.meta?.icon
    })) : undefined,
    show: !route.meta?.hidden
  }

  if (route.children?.length) {
    menuOption.children = route.children.map(mapRouteToMenu)
  }

  return menuOption
}

const breadcrumbItems = computed(() => route.matched.map(mapRouteToBreadcrumbItem))

function mapRouteToBreadcrumbItem(route: RouteLocationMatched) {
  return {
    key: route.name?.toString(),
    label: route.meta?.title,
    icon: route.meta?.icon,
    clickable: !route.meta?.unroutable,
    path: router.resolve(route).href
  }
}
</script>

<style scoped lang="stylus">
.layout
  width: 100vw
  height: 100vh
</style>
