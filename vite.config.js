import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8081';
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
                '/api': {
                    target: apiTarget,
                    changeOrigin: true,
                },
                '/admin': {
                    target: apiTarget,
                    changeOrigin: true,
                },
                '/static': {
                    target: apiTarget,
                    changeOrigin: true,
                },
                '/media': {
                    target: apiTarget,
                    changeOrigin: true,
                },
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
    };
});
