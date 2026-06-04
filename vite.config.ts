import tailwindcss from '@tailwindcss/vite'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  plugins: [tailwindcss(), vueJsx()],
  server: {
    port: 5173,
  },
})
