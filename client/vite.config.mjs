import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'REACT_APP_');
  if (mode === 'demo') env.REACT_APP_API_URL = '/api';
  const publicKeys = ['REACT_APP_API_URL', 'REACT_APP_SUPPORT_EMAIL', 'REACT_APP_PRIVACY_URL', 'REACT_APP_TERMS_URL'];
  return {
    plugins: [react()],
    define: Object.fromEntries(publicKeys.map(key => [`process.env.${key}`, JSON.stringify(env[key] || '')])),
    server: { proxy: { '/api': mode === 'demo' ? 'http://127.0.0.1:5000' : process.env.DEV_API_TARGET || 'http://127.0.0.1:5000' } },
    build: { outDir: 'build', sourcemap: false },
    test: { environment: 'jsdom', setupFiles: ['./src/testSetup.jsx'], restoreMocks: true, fileParallelism: false },
  };
});
