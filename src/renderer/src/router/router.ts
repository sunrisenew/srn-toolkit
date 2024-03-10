import RouteLayout from '@renderer/layouts/RouteLayout.vue'
import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@renderer/views/Home.vue'),
      meta: {
        title: '首页',
        icon: new URL('@sicons/ionicons5/Home.svg', import.meta.url).href,
        root: true,
        hidden: true
      }
    },
    {
      path: '/docs',
      name: 'docs',
      component: () => '',
      meta: {
        title: '文档',
        icon: new URL('@sicons/ionicons5/DocumentText.svg', import.meta.url).href,
        root: true,
        hidden: true,
        createWindow: true,
        createWindowChannel: 'docs-window:create'
      }
    },
    {
      path: '/toolkit',
      name: 'toolkit',
      component: RouteLayout,
      meta: {
        title: '工具箱',
        icon: new URL('@sicons/ionicons5/Construct.svg', import.meta.url).href,
        root: true,
        unroutable: true
      },
      children: [{
        path: 'patch',
        name: 'patch',
        component: RouteLayout,
        meta: {
          title: '增量包',
          icon: new URL('@sicons/ionicons5/FileTrayFull.svg', import.meta.url).href,
          unroutable: true
        },
        children: [
          {
            path: 'extract-patch',
            name: 'extract-patch',
            component: () => import('@renderer/views/toolkit/patch/ExtractPatch.vue'),
            meta: {
              title: '抽取增量包',
              icon: new URL('@sicons/ionicons5/Folder.svg', import.meta.url).href
            }
          },
          {
            path: 'combine-patch',
            name: 'combine-patch',
            component: () => import('@renderer/views/toolkit/patch/CombinePatch.vue'),
            meta: {
              title: '合并增量包',
              icon: new URL('@sicons/ionicons5/FolderOpen.svg', import.meta.url).href
            }
          }
        ]
      }]
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@renderer/views/About.vue'),
      meta: {
        title: '关于',
        icon: new URL('@sicons/ionicons5/InformationCircle.svg', import.meta.url).href,
        root: true,
        hidden: true
      }
    }
  ]
})
