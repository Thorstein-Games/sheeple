import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Public rooms use Colyseus quickplay matchmaking (joinOrCreate with no
  // roomCode), so concurrent tests' hosts can be matched into the same room
  // on the shared dev server. Run serially to keep each test's room isolated.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm dev",
      url: "http://localhost:3000",
      // Don't load the shared Thorstein Games bar from production in tests.
      env: { NEXT_PUBLIC_TG_BAR_SRC: "" },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "pnpm dev",
      cwd: "../megingjord",
      url: "http://localhost:2567/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
