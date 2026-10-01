import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
});
