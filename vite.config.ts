import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    // FE#142: `src/routes/*.test.tsx` route-səviyyəli testlər (məs.
    // `_app.panel.test.tsx`) route generatoru tərəfindən "Route eksport
    // etmir" xəbərdarlığı ilə skan olunmasın deyə istisna edilir.
    //
    // `autoCodeSplitting`: hər route-un komponenti ayrıca chunk-a düşür.
    // Nəticə: public landing (`/`) açılanda anbar/satış/hesabat ekranları,
    // `recharts` və cədvəl kitabxanası YÜKLƏNMİR — yalnız landing chunk-ı
    // gəlir. Zəif telefonda ilk açılışın yükü buradan asılıdır.
    TanStackRouterVite({
      routeFileIgnorePattern: "\.test\.tsx$",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
