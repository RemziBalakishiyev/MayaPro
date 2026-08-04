import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Ayrı vitest konfiqurasiyası (vite.config.ts-dən) — TanStackRouterVite
 * plugin-i test rejimində router codegen işə salmasın deyə buraya
 * qoşulmur; alias-lar isə eyni saxlanılır ki, `@/...` importları işləsin.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
