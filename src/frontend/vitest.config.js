import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
      {
        // The real package's dist/index.js imports a subpath (dist/blob) that
        // the pnpm/Vitest resolver cannot resolve here. The generated backend
        // wrapper only uses ExternalBlob as a type, so route the module to a
        // test stub that exports it.
        find: "@caffeineai/object-storage",
        replacement: fileURLToPath(
          new URL("./src/test/object-storage-stub.ts", import.meta.url),
        ),
      },
    ],
    dedupe: ["@icp-sdk/core"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
