# Foundry VTT Dev & Test Accelerator Extension

A lightweight Manifest V3 Chrome extension designed to eliminate round-trip latency when testing Foundry VTT.

## Features
- **Instant Auto-Login**: Automatically selects "Gamemaster" on the `/join` screen and submits before the page even finishes rendering.
- **Auto-Launch World**: If you ever land on the `/setup` screen, automatically launches the `pf2e-test` world.
- **NUE & Tour Suppression**: Silences first-time tours, tips, and welcome popups.
- **Console Automation API**: Exposes `window.__FOUNDRY_DEV_HELPER__` in the main page context:
  - `__FOUNDRY_DEV_HELPER__.runTests()`
  - `__FOUNDRY_DEV_HELPER__.getErrors()`
  - `__FOUNDRY_DEV_HELPER__.copyAllErrors()`
  - `__FOUNDRY_DEV_HELPER__.clearErrors()`
  - `__FOUNDRY_DEV_HELPER__.openErrorTab()`

## How to Load in Chrome
1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** in the top right.
3. Click **Load unpacked** and select the `tools/foundry-dev-helper/` directory.

## How to Load in Playwright
Pass the `--load-extension` and `--disable-extensions-except` flags in your launch options:
```javascript
const browser = await chromium.launchPersistentContext('/tmp/user-data', {
  headless: false,
  args: [
    `--disable-extensions-except=${path.resolve('tools/foundry-dev-helper')}`,
    `--load-extension=${path.resolve('tools/foundry-dev-helper')}`
  ]
});
```
