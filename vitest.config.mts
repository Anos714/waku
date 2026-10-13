import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // All tests live under tests/, mirroring the source layout, so the app
    // tree stays free of test files.
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "out"],
  },
});
