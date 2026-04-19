import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/HouseHoldTracker/",   // ← add this line
  server: {
    port: 5173,
    proxy: {
      // During local dev, proxy /api calls to the Express backend
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
