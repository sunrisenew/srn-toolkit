import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 标题 */
    title?: string
    /** 图标 */
    icon: string
    /** 是否根路由 */
    root?: boolean
    /** 是否不可路由 */
    unroutable?: boolean
    /** 是否隐藏 */
    hidden?: boolean
    /** 是否创建窗口 */
    createWindow?: boolean
    /** 创建窗口的管道 */
    createWindowChannel?: string
  }
}
