// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // if using Vue

export default defineConfig({
  base: '/employee-pwa/', // <- this is important
  plugins: [vue()],
})
export default defineConfig({
  plugins: [react()],
  base: "/employee-pwa/", // replace with your repo name
})