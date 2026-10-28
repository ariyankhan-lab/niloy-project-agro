import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
 testDir: './tests/e2e', fullyParallel: true, forbidOnly: !!process.env.CI,
 retries: process.env.CI ? 2 : 0, reporter: 'list',
 use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } },
 projects: [{name:'chromium', use:{...devices['Desktop Chrome']}}, {name:'mobile', use:{...devices['Pixel 7']}}],
 webServer: { command: 'npm run dev -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false, env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' } },
})
