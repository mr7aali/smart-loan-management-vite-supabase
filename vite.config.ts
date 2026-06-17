import fs from "fs";
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import sourceIdentifierPlugin from "vite-plugin-source-identifier";

function loadLocalHttpsOptions() {
  const certDir = path.resolve(__dirname, ".cert");
  const pfxPath = path.join(certDir, "localhost-dev.pfx");
  const passphrasePath = path.join(certDir, "localhost-dev.passphrase");

  if (!fs.existsSync(pfxPath) || !fs.existsSync(passphrasePath)) {
    return undefined;
  }

  return {
    pfx: fs.readFileSync(pfxPath),
    passphrase: fs.readFileSync(passphrasePath, "utf8").trim(),
  };
}

export default defineConfig(({ mode }) => {
  const isProd = mode === "prod" || process.env.BUILD_MODE === "prod";
  const localHttps = loadLocalHttpsOptions();

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
      headers: {
        "Permissions-Policy": "unload=*",
      },
      host: "localhost",
      https: localHttps,
      port: 5173,
    },
    preview: {
      headers: {
        "Permissions-Policy": "unload=*",
      },
      host: "localhost",
      https: localHttps,
    },
    build: {
      // Long-term cacheable vendor chunks. Marketing pages benefit because
      // browsers cache react/router/icons across the marketing -> app flow.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/react-router") ||
              id.includes("/scheduler/")
            ) {
              return "vendor-react";
            }
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("/recharts/") || id.includes("/d3-")) {
              return "vendor-charts";
            }
            if (id.includes("/lucide-react/")) return "vendor-icons";
            if (id.includes("/lodash")) return "vendor-lodash";
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
  };
});
