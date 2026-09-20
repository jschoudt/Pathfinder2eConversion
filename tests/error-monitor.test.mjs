import { describe, it, expect, beforeEach } from 'vitest';
import { EberronErrorMonitor, EberronTestRunner, EberronErrorSidebarTab, EberronErrorDetailSheet } from './companion-module/scripts/test-runner.js';

describe('In-VTT Error Monitor & Test Failure Registration', () => {
  // Mock sessionStorage
  let mockStorage = {};
  globalThis.sessionStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { mockStorage = {}; }
  };

  beforeEach(() => {
    mockStorage = {};
    EberronErrorMonitor.errors = [];
    EberronErrorMonitor.selectedIndex = -1;
  });

  describe('Module Error Filtering', () => {
    it('should detect errors matching module name, compendium paths, and eberron scripts', () => {
      expect(EberronErrorMonitor.isEberronError(
        'TypeError: Cannot read properties of undefined',
        'at Item.prepareData (modules/pathfinders-guide-to-eberron/scripts/legal.js:10:5)',
        'modules/pathfinders-guide-to-eberron/scripts/legal.js'
      )).toBe(true);

      expect(EberronErrorMonitor.isEberronError(
        'PF2E RuleElement syntax error in Compendium.pathfinders-guide-to-eberron.eberron-feats.Sqebf5czsENUz1e8',
        'at RuleElements.fromOwnedItem',
        'systems/pf2e/pf2e.mjs'
      )).toBe(true);

      expect(EberronErrorMonitor.isEberronError(
        'Failed to load eberron-heritages item',
        '',
        ''
      )).toBe(true);

      expect(EberronErrorMonitor.isEberronError(
        'Rhaan Clan (Compendium.pathfinders-guide-to-eberron.eberron-heritages.Item.wqxUNiiFoPee9HZo): element-validation failure at system.traits.value\n  gnoll is not a valid choice',
        '',
        'console.warn'
      )).toBe(true);
    });

    it('should ignore errors that are unrelated to the Eberron module', () => {
      expect(EberronErrorMonitor.isEberronError(
        'Error: Failed to connect to server',
        'at WebSocket.onerror (foundry.js:100)',
        'foundry.js'
      )).toBe(false);

      expect(EberronErrorMonitor.isEberronError(
        'TypeError: Cannot read properties of null',
        'at ddb-importer/index.js:55:12',
        'modules/ddb-importer/index.js'
      )).toBe(false);
    });
  });

  describe('Deduplication & Count Tracking', () => {
    it('should record unique errors as separate entries', () => {
      EberronErrorMonitor.captureError({
        message: 'Error in Warforged Armor',
        stack: 'Error: at pathfinders-guide-to-eberron/armor.js:1',
        source: 'armor.js'
      });

      EberronErrorMonitor.captureError({
        message: 'Error in Shifter Shift Shape',
        stack: 'Error: at pathfinders-guide-to-eberron/shifter.js:5',
        source: 'shifter.js'
      });

      expect(EberronErrorMonitor.errors.length).toBe(2);
      expect(EberronErrorMonitor.errors[0].count).toBe(1);
      expect(EberronErrorMonitor.errors[1].count).toBe(1);
      expect(EberronErrorMonitor.getTotalOccurrences()).toBe(2);
    });

    it('should deduplicate duplicate errors by incrementing count rather than adding new items', () => {
      const err = {
        message: 'Repeated rule error in pathfinders-guide-to-eberron',
        stack: 'Error: at Compendium.pathfinders-guide-to-eberron\n  at RuleElement.test\n  at evaluate',
        source: 'rule-elements.js'
      };

      EberronErrorMonitor.captureError(err);
      EberronErrorMonitor.captureError(err);
      EberronErrorMonitor.captureError(err);

      expect(EberronErrorMonitor.errors.length).toBe(1);
      expect(EberronErrorMonitor.errors[0].count).toBe(3);
      expect(EberronErrorMonitor.getTotalOccurrences()).toBe(3);
      expect(EberronErrorMonitor.errors[0].lastSeen.getTime()).toBeGreaterThanOrEqual(
        EberronErrorMonitor.errors[0].firstSeen.getTime()
      );
    });
  });

  describe('Newest Error Auto-Selection on Re-raise', () => {
    it('should ensure the newest error is selected when raised or re-raised', () => {
      EberronErrorMonitor.captureError({
        message: 'First Eberron Error',
        stack: 'at pathfinders-guide-to-eberron:1'
      });
      expect(EberronErrorMonitor.selectedIndex).toBe(0);

      EberronErrorMonitor.captureError({
        message: 'Second Eberron Error',
        stack: 'at pathfinders-guide-to-eberron:2'
      });
      expect(EberronErrorMonitor.selectedIndex).toBe(1);

      // User manually selects the first error
      EberronErrorMonitor.selectedIndex = 0;
      expect(EberronErrorMonitor.selectedIndex).toBe(0);

      // A third error occurs -> re-raise must select the newest error
      EberronErrorMonitor.captureError({
        message: 'Third Eberron Error',
        stack: 'at pathfinders-guide-to-eberron:3'
      });
      expect(EberronErrorMonitor.selectedIndex).toBe(2);
      expect(EberronErrorMonitor.errors[EberronErrorMonitor.selectedIndex].message).toBe('Third Eberron Error');
    });
  });

  describe('Storage Persistence', () => {
    it('should persist errors across dialog dismissals and page reloads via storage', () => {
      EberronErrorMonitor.captureError({
        message: 'Persistent Eberron Error',
        stack: 'at pathfinders-guide-to-eberron:10'
      });

      expect(mockStorage[EberronErrorMonitor.STORAGE_KEY]).toBeDefined();

      // Simulate a page reload / fresh state
      EberronErrorMonitor.errors = [];
      EberronErrorMonitor.selectedIndex = -1;
      expect(EberronErrorMonitor.errors.length).toBe(0);

      EberronErrorMonitor.loadFromStorage();
      expect(EberronErrorMonitor.errors.length).toBe(1);
      expect(EberronErrorMonitor.errors[0].message).toBe('Persistent Eberron Error');
      expect(EberronErrorMonitor.selectedIndex).toBe(0);
    });
  });

  describe('Markdown Formatter & Test Failure Integration', () => {
    it('should generate formatted markdown for clipboard copying', () => {
      EberronErrorMonitor.captureError({
        message: 'Test Markdown Error in pathfinders-guide-to-eberron',
        stack: 'Error: Something failed\n    at eval (file.js:10)',
        source: 'file.js'
      });

      const md = EberronErrorMonitor.formatAllErrorsMarkdown();
      expect(md).toContain('# 🚨 Eberron Module Error Report');
      expect(md).toContain('Test Markdown Error');
      expect(md).toContain('Error: Something failed');
      expect(md).toContain('```');
    });

    it('should register captured runtime errors as test failures in runAll()', async () => {
      EberronErrorMonitor.captureError({
        message: 'Broken Feat Rule in pathfinders-guide-to-eberron',
        stack: 'at pathfinders-guide-to-eberron/feats:5',
        source: 'feats'
      });

      const results = await EberronTestRunner.runAll();
      expect(results.runtimeErrors.length).toBe(1);
      expect(results.passed).toBe(false);
    });
  });

  describe('Server-Side Error Bridge & Log Parser', () => {
    it('should correctly parse multiline Foundry server logs', async () => {
      const { parseServerLogBlock, isRelevantServerLog } = await import('../tools/server_error_bridge.mjs');

      const sampleLines = [
        'FoundryVTT | 2026-09-20 07:10:26 | [warn] You are specifying a forced deletion key "-=inSlot" using legacy syntax which should be migrated to instead pass {inSlot: _del} or {inSlot: new foundry.data.operators.ForcedDeletion()}.',
        'Error: You are specifying a forced deletion key "-=inSlot" using legacy syntax which should be migrated to instead pass {inSlot: _del} or {inSlot: new foundry.data.operators.ForcedDeletion()}.',
        '    at logCompatibilityWarning (file:///app/common/utils/logging.mjs:37:17)',
        '    at _migrateDeletionKey (file:///app/common/utils/helpers.mjs:459:7)',
        '    at mergeObject (file:///app/common/utils/helpers.mjs:1159:24)'
      ];

      expect(isRelevantServerLog(sampleLines.join('\n'))).toBe(true);

      const parsed = parseServerLogBlock(sampleLines);
      expect(parsed).not.toBeNull();
      expect(parsed.level).toBe('warn');
      expect(parsed.source).toBe('Foundry Server');
      expect(parsed.message).toContain('You are specifying a forced deletion key "-=inSlot"');
      expect(parsed.stack).toContain('at logCompatibilityWarning');
      expect(parsed.stack).toContain('at _migrateDeletionKey');
    });

    it('should buffer and flush server logs using createLogCollector', async () => {
      const { createLogCollector } = await import('../tools/server_error_bridge.mjs');

      const captured = [];
      const collector = createLogCollector({
        onLog: (err) => captured.push(err),
        minBufferMs: 10
      });

      collector.feed('FoundryVTT | 2026-09-20 07:10:26 | [error] Eberron compendium pack error\n');
      collector.feed('    at loadPack (file:///app/pack.mjs:10:5)\n');
      collector.flush();

      expect(captured.length).toBe(1);
      expect(captured[0].level).toBe('error');
      expect(captured[0].message).toContain('Eberron compendium pack error');
      expect(captured[0].stack).toContain('at loadPack');
    });

    it('should stream server errors via HTTP and Server-Sent Events', async () => {
      const { startServerErrorBridge } = await import('../tools/server_error_bridge.mjs');

      const bridge = await startServerErrorBridge({ port: 0 }); // Random available port
      expect(bridge.port).toBeGreaterThan(0);

      // Record a test server error
      bridge.recordError({
        message: 'Server-side Eberron database migration failure',
        stack: 'Error: at Compendium.pathfinders-guide-to-eberron (server.mjs:50)',
        level: 'error',
        source: 'Foundry Server'
      });

      // Verify HTTP fetch
      const res = await fetch(`http://localhost:${bridge.port}/api/server-errors`);
      const errors = await res.json();
      expect(errors.length).toBe(1);
      expect(errors[0].message).toContain('database migration failure');

      // Test ingestion into EberronErrorMonitor
      EberronErrorMonitor.captureError({
        message: errors[0].message,
        stack: errors[0].stack,
        source: errors[0].source,
        type: 'server-error'
      });

      expect(EberronErrorMonitor.errors.length).toBe(1);
      expect(EberronErrorMonitor.errors[0].type).toBe('server-error');

      // Verify HTML badge rendering includes SERVER
      const html = EberronErrorMonitor.buildDialogHTML();
      expect(html).toContain('SERVER');
      expect(html).toContain('Foundry Server (Node.js)');

      await bridge.close();
    });
  });

  describe('Sidebar Tab & Floating Error Detail Sheet', () => {
    it('should render an empty state in the sidebar tab when no errors exist', () => {
      EberronErrorMonitor.errors = [];
      const html = EberronErrorSidebarTab.buildTabHTML();
      expect(html).toContain('0 Active Errors');
      expect(html).toContain('running cleanly');
      expect(html).toContain('disabled'); // buttons disabled when empty
    });

    it('should render error directory list with search, inline copy, and inspect buttons', () => {
      EberronErrorMonitor.captureError({
        message: 'Syntax error in Dragonmark rule element',
        stack: 'Error at rule-elements.js:42',
        source: 'rule-elements.js',
        type: 'runtime'
      });
      EberronErrorMonitor.captureError({
        message: 'Server migration warning for Eberron',
        stack: 'Error at server.mjs:12',
        source: 'Foundry Server',
        type: 'server-warning'
      });

      const html = EberronErrorSidebarTab.buildTabHTML();
      expect(html).toContain('eberron-error-directory-list');
      expect(html).toContain('Syntax error in Dragonmark rule element');
      expect(html).toContain('Server migration warning for Eberron');
      expect(html).toContain('data-action="copyAll"');
      expect(html).toContain('data-action="clearAll"');
      expect(html).toContain('data-action="copySingle"');
      expect(html).toContain('data-action="inspectSingle"');
      expect(html).toContain('SRV');
      expect(html).toContain('CLI');
    });

    it('should filter errors in buildTabHTML when filter text is provided', () => {
      EberronErrorMonitor.captureError({
        message: 'Warforged racial trait error',
        stack: 'Error at warforged.js:10',
        source: 'warforged.js'
      });
      EberronErrorMonitor.captureError({
        message: 'Kalashtar psionic power error',
        stack: 'Error at kalashtar.js:20',
        source: 'kalashtar.js'
      });

      const html = EberronErrorSidebarTab.buildTabHTML('warforged');
      expect(html).toContain('display:flex;'); // Warforged is visible
      expect(html).toContain('display:none;'); // Kalashtar is hidden
    });

    it('should instantiate and render EberronErrorDetailSheet for a specific error', async () => {
      const err = {
        id: 'err_test_1',
        message: 'Critical failure loading Eberron item',
        stack: 'Error: at Compendium.eberron (item.js:10)\n    at Object.load',
        source: 'item.js',
        type: 'runtime',
        count: 3,
        firstSeen: new Date(),
        lastSeen: new Date()
      };

      const sheet = new EberronErrorDetailSheet(err);
      expect(sheet.errorData).toBe(err);

      const html = await sheet._renderHTML();
      expect(html).toContain('Critical failure loading Eberron item');
      expect(html).toContain('x3 occurrences');
      expect(html).toContain('Stack Trace');
      expect(html).toContain('item.js');
      expect(html).toContain('data-action="copyError"');
      expect(html).toContain('data-action="closeWindow"');
    });
  });
});
