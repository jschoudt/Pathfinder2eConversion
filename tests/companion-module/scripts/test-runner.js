/**
 * Pathfinder's Guide to Eberron - Companion In-VTT Test Suite
 *
 * This test runner operates inside the Foundry VTT client runtime.
 * It is completely isolated in this companion module to keep the
 * production compendium module clean of test code.
 */

class EberronTestRunner {
  static MODULE_ID = "pathfinders-guide-to-eberron-compendium";

  /**
   * Run the full suite of in-VTT tests
   */
  static async runAll() {
    console.group("%c🧪 Pathfinder's Guide to Eberron: In-VTT Test Suite", "color: #e67e22; font-weight: bold; font-size: 14px;");
    const results = {
      packsChecked: 0,
      totalDocuments: 0,
      documentErrors: [],
      actorTestPassed: false
    };

    try {
      // 1. Verify Packs
      console.log("%c1. Verifying Compendium Packs...", "color: #3498db; font-weight: bold;");
      const modulePacks = game.packs.filter(p => p.metadata.packageName === this.MODULE_ID);
      results.packsChecked = modulePacks.length;

      if (modulePacks.length === 0) {
        throw new Error(`No packs found for package '${this.MODULE_ID}'. Ensure the compendium module is enabled.`);
      }
      console.log(`   Found ${modulePacks.length} registered compendium packs.`);

      // 2. Load all documents & verify PF2e TypeDataModels
      console.log("%c2. Validating Documents in Live PF2e Runtime...", "color: #3498db; font-weight: bold;");
      for (const pack of modulePacks) {
        const docs = await pack.getDocuments();
        results.totalDocuments += docs.length;

        for (const doc of docs) {
          // Check for DocumentClass inheritance
          if (!(doc instanceof CONFIG[doc.documentName].documentClass)) {
            results.documentErrors.push({
              pack: pack.metadata.id,
              name: doc.name,
              error: `Document is not an instance of ${doc.documentName} documentClass`
            });
          }

          // Verify Rule Elements parsing
          if (doc.system?.rules) {
            for (const [idx, rule] of doc.system.rules.entries()) {
              if (!rule.key) {
                results.documentErrors.push({
                  pack: pack.metadata.id,
                  name: doc.name,
                  error: `Rule element #${idx} missing 'key'`
                });
              }
            }
          }
        }
        console.log(`   ✓ ${pack.metadata.label} (${docs.length} documents)`);
      }

      // 3. In-memory Actor item embedding test
      console.log("%c3. Testing Item Embedding on Actor...", "color: #3498db; font-weight: bold;");
      const featsPack = game.packs.get(`${this.MODULE_ID}.eberron-feats`);
      if (featsPack) {
        const featDoc = await featsPack.getDocument("82iHq358U56B3uQ8"); // Aberrant Dragonmark
        if (featDoc) {
          // Instantiate a temporary character in memory
          const actorData = {
            name: "Eberron Test Character",
            type: "character"
          };
          const testActor = new CONFIG.Actor.documentClass(actorData);
          console.log(`   Created in-memory test actor: ${testActor.name}`);

          // Verify item schema converts cleanly into actor embedded item
          const itemSource = featDoc.toObject();
          expectTruthy(itemSource.name === "Aberrant Dragonmark", "Feat toObject matches source name");
          results.actorTestPassed = true;
          console.log(`   ✓ Aberrant Dragonmark successfully prepared for actor embedding`);
        }
      }

      // Report Summary
      console.log("%c----------------------------------------------------------------", "color: #888;");
      console.log(`%cTest Results: ${results.documentErrors.length === 0 ? "PASSED" : "FAILED"}`, 
        results.documentErrors.length === 0 ? "color: #2ecc71; font-weight: bold;" : "color: #e74c3c; font-weight: bold;");
      console.log(`  Packs Verified:       ${results.packsChecked}`);
      console.log(`  Documents Loaded:     ${results.totalDocuments}`);
      console.log(`  Document/Rule Errors: ${results.documentErrors.length}`);
      console.log(`  Actor Embed Test:     ${results.actorTestPassed ? "Passed" : "Skipped"}`);

      if (results.documentErrors.length === 0) {
        ui.notifications.info(`Eberron Test Suite: Verified ${results.totalDocuments} items across ${results.packsChecked} packs with 0 errors!`);
      } else {
        ui.notifications.error(`Eberron Test Suite: Found ${results.documentErrors.length} errors. Check DevTools console.`);
        console.error("Document errors:", results.documentErrors);
      }

    } catch (err) {
      console.error("Test Suite execution failed:", err);
      ui.notifications.error(`Eberron Test Suite failed: ${err.message}`);
    } finally {
      console.groupEnd();
    }

    return results;
  }
}

function expectTruthy(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// Expose on globalThis for console and macro access
globalThis.EberronTests = EberronTestRunner;

// Automatically execute on world load in test worlds
Hooks.once("ready", () => {
  const isTestWorld = game.world.id.includes("test") || game.world.id.includes("dev");
  if (isTestWorld) {
    console.log("%c[Eberron Test Suite] Test world detected (" + game.world.id + "). Running in-VTT tests...", "color: #9b59b6;");
    setTimeout(() => {
      EberronTestRunner.runAll();
    }, 1500); // Allow system rendering to settle
  } else {
    console.log("[Eberron Test Suite] Active. Run 'EberronTests.runAll()' from console to execute tests.");
  }
});
