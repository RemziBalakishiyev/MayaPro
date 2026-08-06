import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    // FE#142: `src/routes/*.test.tsx` route-səviyyəli testlər (məs.
    // `_app.index.test.tsx`) route generatoru tərəfindən "Route eksport
    // etmir" xəbərdarlığı ilə skan olunmasın deyə istisna edilir.
    TanStackRouterVite({ routeFileIgnorePattern: "\\.test\\.tsx$" }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
