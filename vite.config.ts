import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import path from "path";

export default defineConfig({
  plugins: [react(), wasm()],
  resolve: {
    alias: {
      // Map the contract package alias so Vite resolves it correctly without mangling
      "@midnight-ntwrk/umbra-contract": path.resolve(
        import.meta.dirname,
        "preprod-deployment/contracts/src/index.ts"
      ),
      // Polyfill isomorphic-ws for browser
      "isomorphic-ws": path.resolve(import.meta.dirname, "browser-ws-polyfill.js"),
    },
  },
  server: { port: 5173 },
  build: {
    target: "esnext",
    outDir: "dist",
  },
});
