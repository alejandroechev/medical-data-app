import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    env: {
      // Force in-memory stubs for E2E tests (no external dependencies)
      VITE_STORAGE_BACKEND: 'memory',
      VITE_DISABLE_SYNC_AUTH: '1',
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      // Disable PIN gate for E2E tests
      VITE_APP_PIN: '',
    },
  },
});
