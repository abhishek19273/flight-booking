import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to the backend server
      '/users': 'http://localhost:3000',
      '/airports': 'http://localhost:3000',
      '/flights': 'http://localhost:3000',
      '/bookings': 'http://localhost:3000',
      '/payments': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
