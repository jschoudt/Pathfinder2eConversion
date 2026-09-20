#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const MODULE_DIR = 'pathfinders-guide-to-eberron';
const DIST_DIR = path.resolve('dist');

function getRepoInfo() {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    // Match git@github.com:owner/repo.git or https://github.com/owner/repo.git
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  } catch {}
  return { owner: 'jschoudt', repo: 'Pathfinder2eConversion' };
}

async function uploadAsset(uploadUrlTemplate, filePath, fileName, token) {
  const uploadUrl = uploadUrlTemplate.replace(/\{(\?.*)?\}$/, '') + `?name=${encodeURIComponent(fileName)}`;
  const fileStat = await stat(filePath);
  const fileBuffer = await readFile(filePath);

  let contentType = 'application/octet-stream';
  if (fileName.endsWith('.json')) contentType = 'application/json';
  if (fileName.endsWith('.zip')) contentType = 'application/zip';
  if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
  if (fileName.endsWith('.md')) contentType = 'text/markdown';

  console.log(`   ⬆️  Uploading ${fileName} (${(fileStat.size / (1024 * 1024)).toFixed(2)} MB)...`);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': contentType,
      'Content-Length': fileStat.size.toString(),
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: fileBuffer
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload ${fileName} (${res.status} ${res.statusText}): ${errText}`);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Pathfinder\'s Guide to Eberron - Release Publisher');
  console.log('='.repeat(60) + '\n');

  // 1. Build and package everything first
  console.log('📦 Ensuring all artifacts are compiled and packaged in dist/...');
  execSync('node tools/package_release.mjs', { stdio: 'inherit' });

  // 2. Read manifest version
  const manifestPath = path.join(MODULE_DIR, 'module.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const version = manifest.version;
  const tag = `v${version}`;
  const releaseTitle = `Pathfinder's Guide to Eberron ${tag}`;

  // Read release notes
  const notesPath = path.join(DIST_DIR, 'RELEASE_NOTES.md');
  const releaseBody = existsSync(notesPath)
    ? await readFile(notesPath, 'utf-8')
    : `Release notes for version ${tag}.`;

  const { owner, repo } = getRepoInfo();
  console.log(`\n🎯 Target Repository: ${owner}/${repo}`);
  console.log(`📌 Target Release:    ${tag}`);

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  if (!token) {
    console.log('\n💡 No GITHUB_TOKEN environment variable detected for direct API upload.');
    console.log('   All 6 release deliverables are compiled and verified in dist/:\n');
    const distFiles = await readdir(DIST_DIR);
    for (const f of distFiles.sort()) {
      console.log(`     - dist/${f}`);
    }
    console.log('\nTo publish this release automatically:');
    console.log(`   1. Push a git tag to trigger the GitHub Actions release workflow:`);
    console.log(`        git tag ${tag}`);
    console.log(`        git push origin ${tag}`);
    console.log(`\n   2. Or set GITHUB_TOKEN and re-run:`);
    console.log(`        GITHUB_TOKEN=your_token npm run release:create\n`);
    return;
  }

  console.log(`\n🔐 Found GITHUB_TOKEN. Creating release on GitHub via REST API...`);

  // Check if release already exists
  let releaseData = null;
  const getReleaseRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (getReleaseRes.ok) {
    releaseData = await getReleaseRes.json();
    console.log(`   Release ${tag} already exists (ID: ${releaseData.id}). Updating assets...`);
  } else if (getReleaseRes.status === 404) {
    console.log(`   Creating new release for tag ${tag}...`);
    const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        tag_name: tag,
        name: releaseTitle,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create release (${createRes.status}): ${errText}`);
    }
    releaseData = await createRes.json();
  } else {
    const errText = await getReleaseRes.text();
    throw new Error(`Failed checking release status (${getReleaseRes.status}): ${errText}`);
  }

  const existingAssets = releaseData.assets || [];
  const uploadUrlTemplate = releaseData.upload_url;

  // Release assets to upload
  const assetsToUpload = [
    'pathfinders-guide-to-eberron.zip',
    'module.json',
    'pathfinders-guide-to-eberron-tests.zip',
    'pathfinders-guide-to-eberron.json',
    'pathfinders-guide-to-eberron.pdf',
    'pathfinders-guide-to-eberron-text.zip'
  ];

  for (const assetName of assetsToUpload) {
    const assetPath = path.join(DIST_DIR, assetName);
    if (!existsSync(assetPath)) {
      console.warn(`⚠️ Asset missing: ${assetPath}`);
      continue;
    }

    // Delete existing asset if it exists
    const existing = existingAssets.find(a => a.name === assetName);
    if (existing) {
      console.log(`   🗑️  Replacing existing asset ${assetName} (ID: ${existing.id})...`);
      await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${existing.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
    }

    await uploadAsset(uploadUrlTemplate, assetPath, assetName, token);
  }

  console.log(`\n🎉 RELEASE PUBLISHED SUCCESSFULLY!`);
  console.log(`   URL: ${releaseData.html_url || `https://github.com/${owner}/${repo}/releases/tag/${tag}`}`);
}

main().catch(err => {
  console.error('\n❌ Release creation failed:', err);
  process.exit(1);
});
