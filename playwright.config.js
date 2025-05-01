// @ts-check
import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:5173";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? [["dot"], ["github"], ["html"]] : "html",
    use: {
        baseURL,
        headless: true,
        trace: "on-first-retry",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
        {
            name: "firefox",
            use: { ...devices["Desktop Firefox"] },
        },
        {
            name: "webkit",
            use: { ...devices["Desktop Safari"] },
        },
    ],

    webServer: {
        command: "npm start",
        url: baseURL,
        timeout: 120 * 1000,
        reuseExistingServer: false,  // 🔄 Force un nouveau serveur
    },
});
