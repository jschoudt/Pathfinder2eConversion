#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const CONFIG_FILE = path.resolve('foundryconfig.json');

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
  const optionsPath = path.join(dataPath, 'Config', 'options.json');

  // Verify UPnP status in options.json
  if (existsSync(optionsPath)) {
    try {
      const rawOptions = await readFile(optionsPath, 'utf-8');
      const options = JSON.parse(rawOptions);
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
  console.log(`🚀 Starting Foundry VTT server:`);
  console.log(`   - App:  ${foundryAppPath}`);
  console.log(`   - Data: ${dataPath}\n`);

  const extraArgs = process.argv.slice(2);
  const child = spawn(process.execPath, [foundryAppPath, `--dataPath=${dataPath}`, ...extraArgs], {
    stdio: 'inherit'
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  // Forward signals to child process
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

main().catch(console.error);
