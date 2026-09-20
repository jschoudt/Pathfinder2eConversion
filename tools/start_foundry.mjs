#!/usr/bin/env node
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const CONFIG_FILE = path.resolve('foundryconfig.json');

async function closeFoundryChromeTabs(port = 30000) {
  if (process.platform !== 'darwin') return;
  const script = `
    if application "Google Chrome" is running then
      tell application "Google Chrome"
        set winList to every window
        repeat with w in winList
          set tabCount to count of tabs of w
          set closeList to {}
          repeat with t in tabs of w
            set tUrl to (URL of t as text)
            if tUrl contains "localhost:${port}" or tUrl contains "127.0.0.1:${port}" then
              set end of closeList to t
            end if
          end repeat
          if (count of closeList) is equal to tabCount and tabCount > 0 then
            close w
          else
            repeat with t in closeList
              close t
            end repeat
          end if
        end repeat
      end tell
    end if
  `;
  try {
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
  } catch (_) {}
}

async function launchFoundryChrome(profileDirectory = "Profile 1", targetUrl = "http://localhost:30000/join") {
  if (process.platform !== 'darwin') return;
  try {
    const devHelperPath = path.resolve('tools/foundry-dev-helper');
    const extFlag = existsSync(devHelperPath) ? ` --load-extension="${devHelperPath}"` : '';
    console.log(`🌐 Launching Google Chrome ("${profileDirectory}") with Dev Helper -> ${targetUrl}`);
    await execAsync(`open -na "Google Chrome" --args --profile-directory="${profileDirectory}"${extFlag} "${targetUrl}"`);
  } catch (err) {
    console.warn(`⚠️ Could not launch Chrome: ${err.message}`);
  }
}

async function main() {
  if (!existsSync(CONFIG_FILE)) {
    console.error(`Error: Configuration file '${CONFIG_FILE}' not found.`);
    process.exit(1);
  }

  const rawConfig = await readFile(CONFIG_FILE, 'utf-8');
  let config;
  try {
    config = JSON.parse(rawConfig);
  } catch (err) {
    console.error(`Error parsing foundryconfig.json:`, err.message);
    process.exit(1);
  }

  const dataPath = path.resolve(config.dataPath || './_foundry/data');
  const foundryAppPath = path.resolve(config.foundryAppPath || './_foundry/app/main.mjs');
  const chromeProfile = config.chromeProfile || "Profile 1";
  const optionsPath = path.join(dataPath, 'Config', 'options.json');
  let foundryPort = 30000;

  // Verify UPnP status in options.json
  if (existsSync(optionsPath)) {
    try {
      const rawOptions = await readFile(optionsPath, 'utf-8');
      const options = JSON.parse(rawOptions);
      if (options.port) foundryPort = options.port;
      if (options.upnp === true) {
        console.error('\n' + '='.repeat(70));
        console.error('🛑 SECURITY CHECK FAILED: UPnP is ENABLED in options.json!');
        console.error('='.repeat(70));
        console.error(`File: ${optionsPath}`);
        console.error('Foundry server startup blocked: UPnP must be DISABLED to protect your');
        console.error('local network and prevent automatic router port forwarding.');
        console.error('\nPlease edit the file and set "upnp": false before starting Foundry.');
        console.error('='.repeat(70) + '\n');
        process.exit(1);
      }
    } catch (err) {
      console.warn(`Warning: Could not parse ${optionsPath}:`, err.message);
    }
  }

  console.log(`\n🛡️  Security check passed: UPnP is DISABLED.`);

  // Cleanly close any existing Foundry Chrome tabs/windows before launch
  await closeFoundryChromeTabs(foundryPort);

  // Initialize Real-time Server Error Bridge
  const persistPath = path.resolve('tests/companion-module/server-errors.json');
  const portPath = path.resolve('tests/companion-module/bridge-port.json');
  let bridge;
  try {
    const { startServerErrorBridge, createLogCollector } = await import('./server_error_bridge.mjs');
    bridge = await startServerErrorBridge({
      port: 30005,
      persistPath,
      onClientConnected: (count) => {
        // Connected client notification
      }
    });

    // Write active bridge port for companion module discovery
    await writeFile(portPath, JSON.stringify({ port: bridge.port }), 'utf-8');
    console.log(`📡 Server Error Bridge active on http://localhost:${bridge.port} (SSE enabled)`);

    var collector = createLogCollector({
      onLog: (err) => {
        bridge.recordError(err);
      }
    });
  } catch (err) {
    console.warn(`⚠️ Could not start Server Error Bridge: ${err.message}. Continuing without server bridge.`);
  }

  // Auto-compile any modified source packs into LevelDB before starting Foundry
  try {
    const { buildPacks } = await import('./build_packs.mjs');
    await buildPacks({ incremental: true, verbose: true });
  } catch (err) {
    console.warn(`⚠️ Warning: Could not run incremental pack build: ${err.message}`);
  }

  console.log(`🚀 Starting Foundry VTT server:`);
  console.log(`   - App:  ${foundryAppPath}`);
  console.log(`   - Data: ${dataPath}\n`);

  const extraArgs = process.argv.slice(2);
  const child = spawn(process.execPath, [foundryAppPath, `--dataPath=${dataPath}`, '--noipdiscovery', ...extraArgs], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  let chromeLaunched = false;
  const launchChromeIfReady = () => {
    if (chromeLaunched) return;
    chromeLaunched = true;
    launchFoundryChrome(chromeProfile, `http://localhost:${foundryPort}/join`);
  };

  const chromeTimer = setTimeout(launchChromeIfReady, 3500);

  if (collector) {
    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
      collector.feed(chunk);
      if (chunk.toString().includes('Server started and listening on port')) {
        clearTimeout(chromeTimer);
        launchChromeIfReady();
      }
    });

    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      collector.feed(chunk);
    });
  } else {
    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
      if (chunk.toString().includes('Server started and listening on port')) {
        clearTimeout(chromeTimer);
        launchChromeIfReady();
      }
    });
    child.stderr.pipe(process.stderr);
  }

  child.on('exit', async (code, signal) => {
    clearTimeout(chromeTimer);
    if (collector) collector.flush();
    if (bridge) await bridge.close();
    if (existsSync(portPath)) {
      try { await unlink(portPath); } catch (e) {}
    }

    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  // Forward signals to child process
  process.on('SIGINT', async () => {
    clearTimeout(chromeTimer);
    if (collector) collector.flush();
    if (bridge) await bridge.close();
    child.kill('SIGINT');
  });
  process.on('SIGTERM', async () => {
    clearTimeout(chromeTimer);
    if (collector) collector.flush();
    if (bridge) await bridge.close();
    child.kill('SIGTERM');
  });
}

main().catch(console.error);
