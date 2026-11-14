import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The Go function serves the build from /app/ (static/app). The page routes
// (/, /login, /register, /dashboard, /admin/users) return the same index.html.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: command === "build" ? "/app/" : "/",
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
        },
        "/session": {
          target: env.API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
        },
        "/register": {
          target: env.API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
          bypass: (req) => (req.method === "GET" ? "/index.html" : undefined),
        },
      },
    },
    build: {
      outDir: "../static/app",
      emptyOutDir: true,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["src/test/setup.ts"],
      css: false,
    },
  };
});
