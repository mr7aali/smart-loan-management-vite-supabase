import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import sourceIdentifierPlugin from "vite-plugin-source-identifier";

export default defineConfig(({ mode }) => {
  const isProd = mode === "prod" || process.env.BUILD_MODE === "prod";

  return {
    plugins: [
      react(),
      sourceIdentifierPlugin({
        enabled: !isProd,
        attributePrefix: "data-matrix",
        includeProps: true,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
    },
  };
});
