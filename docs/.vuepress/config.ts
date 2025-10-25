import { resolve } from 'node:path'
import { defineUserConfig } from 'vuepress'
import theme from './theme.js'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: '文档',
  description: '文档',
  theme,
  dest: 'out/docs',
  alias: {
    '@images': resolve(__dirname, '../images')
  },
  shouldPrefetch: false
})
