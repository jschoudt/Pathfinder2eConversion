import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { FOUNDRY_OPTIONS_PATH, getModuleManifest, FOUNDRY_APP_DIR, PF2E_SYSTEM_DIR } from './setup.mjs';
import path from 'node:path';

describe('Security & Environment Configuration', () => {
  it('should ensure UPnP is strictly disabled in Foundry options.json', async () => {
    if (!existsSync(FOUNDRY_OPTIONS_PATH)) return;

    const content = await readFile(FOUNDRY_OPTIONS_PATH, 'utf-8');
    const options = JSON.parse(content);
    expect(options.upnp).toBe(false);
  });

  it('should declare module compatibility matching installed Foundry and PF2e versions', async () => {
    const manifest = await getModuleManifest();

    expect(manifest.id).toBe('pathfinders-guide-to-eberron-compendium');
    expect(manifest.compatibility.minimum).toBeDefined();
    expect(manifest.compatibility.verified).toBeDefined();

    // Check against installed Foundry package if present
    const fPkgPath = path.join(FOUNDRY_APP_DIR, 'package.json');
    if (existsSync(fPkgPath)) {
      const fPkg = JSON.parse(await readFile(fPkgPath, 'utf-8'));
      const major = fPkg.version.split('.')[0];
      // Verified should match current installed major version (v14)
      expect(manifest.compatibility.verified.startsWith(major)).toBe(true);
    }

    // Check against installed PF2e system if present
    const sJsonPath = path.join(PF2E_SYSTEM_DIR, 'system.json');
    if (existsSync(sJsonPath)) {
      const sJson = JSON.parse(await readFile(sJsonPath, 'utf-8'));
      const pf2eRel = manifest.relationships?.systems?.find(s => s.id === 'pf2e');
      expect(pf2eRel).toBeDefined();
      expect(pf2eRel.compatibility.minimum).toBeDefined();
      expect(pf2eRel.compatibility.verified).toBe(sJson.version);
    }
  });
});
