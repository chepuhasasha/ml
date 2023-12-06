import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import replace from "@rollup/plugin-replace";

export default defineConfig({
  plugins: [
    vue(),
    replace({
      preventAssignment: false,
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
  ],
  build: {
    cssCodeSplit: true,
    lib: {
      entry: "./src/main.ts",
      formats: ["umd"],
      name: "SNAKE_CLIENT",
      fileName: () => "index.js",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
