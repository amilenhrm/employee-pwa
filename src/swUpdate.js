// src/swUpdate.js
import { registerSW } from 'virtual:pwa-register'
import toast from 'react-hot-toast'
import { APP_VERSION } from './version'

export const setupPWAUpdate = () => {
  const updateSW = registerSW({
    onNeedRefresh() {
      // 🔔 Toast for new version detected
      toast.success(`App updated to v${APP_VERSION} — reloading...`, {
        duration: 2500,
        icon: '🔄',
      })
      setTimeout(() => {
        updateSW(true) // activate new SW
        window.location.reload() // refresh app
      }, 2500)
    },
    onOfflineReady() {
      toast('App ready to work offline ✅', {
        icon: '📦',
      })
    },
  })
}
