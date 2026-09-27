import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Split large, rarely-changing third-party libraries into their
        // own file so browsers can cache them separately from app code.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-map": ["leaflet", "react-leaflet"],
          "vendor-misc": ["axios", "socket.io-client", "react-hook-form"],
        },
      },
    },
  },
});
