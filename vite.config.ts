import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { LiveEngine } from "./src/live/LiveEngine";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function liveEnginePlugin(): Plugin {
  return {
    name: "live-engine",
    configureServer(server) {
      const engine = LiveEngine.getInstance();
      server.middlewares.use((req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        const url = new URL(req.url, "http://localhost");
        if (url.pathname === "/api/live-state") {
          const payload = engine.getState();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(payload));
          return;
        }

        if (url.pathname === "/api/live-recommendations") {
          const userId = url.searchParams.get("userId") ?? "";
          const method = url.searchParams.get("method") ?? "";
          const topK = Number(url.searchParams.get("topK") ?? "10");
          const payload = engine.recommend(userId, method, topK);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(payload));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  root: "dashboard",
  plugins: [react(), liveEnginePlugin()],
  build: {
    outDir: "../dist",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@dashboard": path.resolve(__dirname, "dashboard")
    }
  }
});
