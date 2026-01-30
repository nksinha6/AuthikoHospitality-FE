import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: mode === "development" ? "/" : "/biz/",
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ["jspdf", "jspdf-autotable", "xlsx", "file-saver"],
    },

    server: {
      proxy: {
        "/api": {
          target: env.API_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
