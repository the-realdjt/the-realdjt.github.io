
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // 🚨 这一行是你的救命代码！专门适配你的 GitHub Pages 地址！
  base: '/huoshanbei1/health_sys/',
  server: {
    proxy: {
      "/api": "http://127.0.0.1:3000"
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts"
  }
});
