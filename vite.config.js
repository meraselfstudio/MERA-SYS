import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        // If needed for backend proxying
      },
    },
    build: {
      target: 'es2015',
      minify: 'terser',
      cssCodeSplit: true,
      sourcemap: mode === 'production' ? false : 'inline',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase': ['@supabase/supabase-js'],
            'charts': ['recharts'],
            'ui': ['lucide-react', 'clsx'],
            'utils': ['papaparse', 'date-fns', 'zustand'],
          },
        },
      },
    },
    define: {
      __DEV__: JSON.stringify(mode === 'development'),
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'papaparse',
        'recharts',
      ],
    },
  };
});
