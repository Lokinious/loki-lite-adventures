import { defineConfig } from "@playwright/test";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: ".",
  testMatch: /campaign-regression\.spec\.ts/,
  timeout: 120_000,
  expect: {
    timeout: 15_000
  },
  fullyParallel: false,
  workers: 1,
  reporter: isCi ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: [
    {
      command: "npm run dev:server",
      url: "http://127.0.0.1:2567/health",
      reuseExistingServer: !isCi,
      timeout: 120_000
    },
    {
      command: "npm run dev --workspace client -- --host 127.0.0.1",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !isCi,
      timeout: 120_000
    }
  ]
});
