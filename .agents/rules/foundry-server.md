# Foundry Server Process Lifecycle

- **Do not leave the Foundry server running** after completing a task or turn.
- The user prefers to start/re-run `npm run foundry:start` themselves in their terminal to monitor console output directly and ensure the latest code versions are loaded.
- If a temporary Foundry server process was started for automated browser verification during execution, always shut it down before finishing the task.
