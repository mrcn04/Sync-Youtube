import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  server: {
    proxy: { "/socket.io": { target: "http://localhost:4000", ws: true } },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
