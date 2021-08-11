import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import eslintPlugin from 'vite-plugin-eslint';

const packageJson = require('./package.json');

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [reactRefresh(), eslintPlugin()],
  define: {
    __VERSION__: JSON.stringify(packageJson.version)
  },
});
