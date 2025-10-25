import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: [
        // Externalize Node.js modules that shouldn't be bundled for browser
        'better-sqlite3',
        'fs',
        'path',
        'util',
        'crypto',
        'bcryptjs',
        'jsonwebtoken',
        'helmet',
        'cors'
      ],
    },
  },
  optimizeDeps: {
    exclude: [
      // Exclude Node.js modules from dependency optimization
      'better-sqlite3',
      'bcryptjs',
      'jsonwebtoken'
    ],
  },
});
