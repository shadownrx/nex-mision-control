import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    setupFiles: ["./tests/setup.ts"],
    environment: "node",
    // DB-backed files share one local database and wipe tables in
    // beforeEach: running files in parallel deletes rows created by an
    // in-flight file (Ticket 08: parallel `npm test` flaked with
    // "create returned null"; sequential runs green).
    fileParallelism: false,
  },
});
