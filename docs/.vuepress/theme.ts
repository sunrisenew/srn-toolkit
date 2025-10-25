import { hopeTheme } from 'vuepress-theme-hope'
import { zhNavbar } from './navbar/index.js'
import { zhSidebar } from './sidebar/index.js'

export default hopeTheme({
  hostname: 'https://srn-toolkit.sunrisenew.cn',
  author: {
    name: 'sunrisenew',
    url: 'https://srn-toolkit.sunrisenew.cn',
    email: 'sunrisenew@foxmail.com'
  },
  logo: '/logo.svg',
  navbar: zhNavbar,
  sidebar: zhSidebar,
  displayFooter: true,
  footer: '',
  copyright: 'Copyright © 2022-present sunrisenew',
  editLink: false,
  markdown: {
    highlighter: {
      type: 'prismjs',
      theme: 'tomorrow'
    },
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    demo: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    mermaid: true,
    playground: {
      presets: ['ts', 'vue']
    },
    spoiler: true,
    stylize: [
      {
        matcher: 'Recommended',
        replacer: ({ tag }) => {
          if (tag === 'em') {
            return {
              tag: 'Badge',
              attrs: { type: 'tip' },
              content: 'Recommended'
            }
          }
          return null
        }
      }
    ],
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true
  },
  plugins: {
    comment: false,
    components: {
      components: ['Badge', 'VPCard']
    }
  }
})
