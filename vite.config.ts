import { defineConfig, loadEnv } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import * as path from 'path';

const packageJson = require('./package.json');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  console.log('env', env);
  return {
    base: './',
    plugins: [reactRefresh()],
    define: {
      __VERSION__: JSON.stringify(packageJson.version)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      proxy: {
        '/v1': {
          target: 'http://10.200.20.28:5080',
          changeOrigin: true
        }
      }
    }
  };
});
