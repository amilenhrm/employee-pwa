// src/version.js
import packageInfo from '../package.json'

// 📦 Version number galing sa package.json
export const APP_VERSION = packageInfo.version

// 🕒 Build date (kukunin sa system time tuwing build)
export const BUILD_DATE = new Date().toLocaleDateString('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
})
