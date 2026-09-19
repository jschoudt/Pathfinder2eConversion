import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const RESULTS_FILE = path.resolve('.vitest/test-results.json');
const isDebug = process.argv.includes('--debug') || process.argv.includes('--inspect-brk');
const extraArgs = process.argv.slice(2).filter((arg) => arg !== '--debug' && arg !== '--inspect-brk');

if (!fs.existsSync(RESULTS_FILE)) {
  console.log('⚠️  No previous test run report found (.vitest/test-results.json).');
  console.log('👉 Please run "npm test" first to generate test results.\n');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
} catch (err) {
  console.error('❌ Failed to parse test report:', err.message);
  process.exit(1);
}

const failedFiles = new Set();
const failedTests = [];

for (const suite of report.testResults || []) {
  for (const assertion of suite.assertionResults || []) {
    if (assertion.status === 'failed') {
      const relPath = path.relative(process.cwd(), suite.name);
      failedFiles.add(relPath);
      failedTests.push({
        file: relPath,
        name: assertion.title || assertion.fullName
      });
    }
  }
}

if (failedTests.length === 0) {
  console.log('✅ No failed test cases recorded in the last run! (All tests passed cleanly).');
  console.log('👉 To run the full test suite in debugger, use:');
  console.log('   npm run test:debug');
  console.log('👉 To run a specific test by name, use:');
  console.log('   npm test -- -t "<test-name>"');
  console.log('👉 Or select "Debug Vitest: By Name / Filter" in the IDE Debugger.\n');
  process.exit(0);
}

console.log(`\n🔍 Found ${failedTests.length} failed test case(s) across ${failedFiles.size} file(s):`);
for (const t of failedTests) {
  console.log(`   - [${t.file}] ${t.name}`);
}

// Build regex pattern matching failed test titles
const pattern = failedTests
  .map((t) => t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const args = ['run', ...Array.from(failedFiles), '-t', pattern, ...extraArgs];

if (isDebug) {
  args.unshift('--inspect-brk', '--no-file-parallelism');
  console.log('\n🐞 Launching debugger on failed tests with --inspect-brk --no-file-parallelism...');
  console.log('   Debugger listening on 127.0.0.1:9229. Attach your IDE debugger or Chrome DevTools (chrome://inspect).\n');
} else {
  console.log('\n🚀 Re-running failed tests...\n');
}

const vitestBin = path.resolve('node_modules/.bin/vitest');
const result = spawnSync(vitestBin, args, { stdio: 'inherit' });
process.exit(result.status ?? 0);
