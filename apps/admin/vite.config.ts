import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (
            id.includes('@tiptap') ||
            id.includes('prosemirror') ||
            id.includes('@mantine/tiptap')
          ) {
            return 'tiptap'
          }
          if (id.includes('emoji-mart') || id.includes('@emoji-mart')) {
            return 'emoji'
          }
          if (id.includes('@tabler/icons-react')) {
            return 'icons'
          }
          if (id.includes('@tanstack')) {
            return 'query'
          }
          if (
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('\\react\\') ||
            id.includes('scheduler') ||
            id.includes('react-router') ||
            id.includes('@mantine')
          ) {
            return 'framework'
          }
        },
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))
