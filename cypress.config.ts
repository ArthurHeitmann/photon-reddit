import {defineConfig} from 'cypress'
import installLogsPrinter from "cypress-terminal-report/src/installLogsPrinter";

export default defineConfig({
  projectId: 'vha2vq',
  viewportWidth: 1500,
  viewportHeight: 900,
  defaultCommandTimeout: 10000,
  numTestsKeptInMemory: 50,
  scrollBehavior: false,
  e2e: {
    setupNodeEvents(on, config) {
      installLogsPrinter(on)
    },
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
