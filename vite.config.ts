import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [react(), wasm()],
  server: { port: 5173 },
  build: {
    target: "es2022",
    outDir: "dist",
    rollupOptions: {
      // The compiled contract JS is served from public/ at runtime.
      // Mark it external so Rollup does not try to bundle or resolve it.
      external: ["/managed/bboard/contract/index.js"],
    },
  },
});
