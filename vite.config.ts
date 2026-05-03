import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        resolvers: [ElementPlusResolver()],
        dts: 'src/auto-imports.d.ts',
        eslintrc: { enabled: true },
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/components.d.ts',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        // REST API
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        // Django emergency admin (faqat /admin/django/ — Vue'da `/admin/users` va h.k. bor!)
        '/admin/django': {
          target: apiTarget,
          changeOrigin: true,
        },
        // Django admin static fayllari (django-static/ prefix)
        '/django-static': {
          target: apiTarget,
          changeOrigin: true,
        },
        // Backend yuklangan fayllar (avatarlar va boshqalar)
        '/media': {
          target: apiTarget,
          changeOrigin: true,
        },
        // Legacy frontend referens (JAR'dan ko'chirilgan Vue 2 SPA, /legacy/ ostida)
        '/legacy': {
          target: apiTarget,
          changeOrigin: true,
        },
        // WebSocket
        '/ws': {
          target: apiTarget.replace(/^http/, 'ws'),
          ws: true,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
