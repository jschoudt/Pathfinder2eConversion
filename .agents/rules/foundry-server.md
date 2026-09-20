# Foundry Server & In-VTT Verification Workflow

For any task that modifies Foundry compendium objects (`src/packs/*` or module code):

1. **Vitest & Schema Verification:**
   - Run `npm run validate` and `npm test`.
2. **Build Packs:**
   - Recompile LevelDB compendiums using `npm run build` (ensure Foundry is stopped beforehand so LevelDB is unlocked).
3. **Start Foundry & Chrome:**
   - Launch Foundry and Chrome via `npm run foundry:start` (which loads the Dev Helper extension to log in as GM and unpause the world).
4. **Client In-VTT Test Execution & Error Fetch:**
   - Wait for the client to connect, execute the in-VTT test suite (`EberronTestRunner.runAll()`), and stream logs to the server bridge.
   - Fetch client and server errors via the supervisor endpoints:
     - `http://localhost:30005/api/client-errors`
     - `http://localhost:30005/api/server-errors`
5. **Address Errors:**
   - Process and fix all reported errors until both client and server error counts are 0.
   - Re-validate and re-build packs as necessary.
6. **Lifecycle Management:**
   - Shut down any temporary Foundry server process started by the agent before finishing the task, or ensure it is running cleanly per user preferences.

