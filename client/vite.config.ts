import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ws": {
        target: "ws://localhost:3001",
        ws: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      // Without this, v8 only reports files a test actually imported —
      // untested files (most of the React UI) would silently vanish from
      // the report instead of showing up as 0%.
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/main.tsx"],
    },
  },
});
