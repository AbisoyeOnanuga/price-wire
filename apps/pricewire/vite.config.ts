import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "web"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
});
