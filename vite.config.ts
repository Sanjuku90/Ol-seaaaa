import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Conditional imports for Replit environment
let replitPlugins: any[] = [];
if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
  try {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    const { devBanner } = await import("@replit/vite-plugin-dev-banner");
    const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
    replitPlugins = [
      cartographer(), 
      devBanner(),
      runtimeErrorOverlay.default(),
    ];
  } catch (e) {
    console.warn("Replit plugins not found, skipping...");
  }
}

export default defineConfig({
  plugins: [
    react(),
    ...replitPlugins,
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: {
      clientPort: 443,
    },
    allowedHosts: true,
  },
});
