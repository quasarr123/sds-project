import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The browser only talks to :3000. Requests to /api are forwarded to the backend,
// so the session cookie works without any CORS setup.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
