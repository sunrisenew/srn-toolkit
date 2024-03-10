import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from '@renderer/App.vue'
import router from '@renderer/router/router'

import '@renderer/styles/global.styl'
import 'driver.js/dist/driver.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
