Hooks.once('ready', async () => {
  const thisVersion = "2.4.0";
  const MODULE_ID = "pathfinders-guide-to-eberron";

  game.settings.register(MODULE_ID, 'license-accepted', {
    name: "License Accepted",
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, 'accepted-version', {
    name: "Accepted Version",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  const lastAcceptedVersion = game.settings.get(MODULE_ID, 'accepted-version');
  const isLicenseAccepted = game.settings.get(MODULE_ID, 'license-accepted');

  if (isLicenseAccepted && lastAcceptedVersion === thisVersion) {
    return;
  }

  const legalContent = `
    <div class="eberron-legal-dialog" style="max-height: 450px; overflow-y: auto; padding: 0.5rem;">
      <h2>Pathfinder's Guide to Eberron (v${thisVersion})</h2>
      <p><b>Original Author & Creator:</b> <a href="https://github.com/TNychka/Pathfinder2eConversion" target="_blank">TNychka</a> | 
         <b>Maintainer:</b> <a href="https://github.com/jschoudt/Pathfinder2eConversion" target="_blank">jschoudt</a></p>
      
      <hr/>
      <h3>Wizards of the Coast Fan Content Notice</h3>
      <p><em>Pathfinder's Guide to Eberron</em> is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.</p>
      <p>This document can only be utilized for personal use and not to create new games incorporating Wizards IP or anything else that can or will be distributed that does not also conform to Wizards of the Coast’s Fan Content Policy.</p>
      <p>Eberron and its respective logo are trademarks of Wizards of the Coast, Inc., in the U.S.A. and other countries.</p>

      <hr/>
      <h3>Paizo Community Use Notice</h3>
      <p><em>Pathfinder's Guide to Eberron</em> uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (<a href="https://paizo.com/communityuse" target="_blank">paizo.com/communityuse</a>). We are expressly prohibited from charging you to use or access this content. <em>Pathfinder's Guide to Eberron</em> is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit <a href="https://paizo.com" target="_blank">paizo.com</a>.</p>

      <hr/>
      <h3>AI Assistance & Transparency Disclosure</h3>
      <p><b>Alpha Notice:</b> The current content is considered <b>Alpha</b>; a large portion of it is AI-generated. While it has been lightly reviewed, it has not been deeply reviewed for mechanics, playability, etc.</p>
      <p>Artificial intelligence tools (such as large language models) assist in the maintenance and development of this conversion project:</p>
      <ul>
        <li><b>Alpha State & Review:</b> Content is in active development and has not yet undergone deep playtesting or comprehensive manual balance auditing.</li>
        <li><b>Mechanical Conversion & Balance:</b> AI assists with preliminary stat block transcription and mechanical drafting for Pathfinder 2e Remaster fidelity.</li>
        <li><b>Original Expression:</b> Text is audited against source materials to guarantee that no proprietary descriptions or flavor text from official sourcebooks are inadvertently reproduced.</li>
        <li><b>Artwork:</b> Any visual assets are used exclusively for non-commercial visual accompaniment in accordance with US Copyright Office guidelines regarding machine-generated works.</li>
      </ul>
      <p>For complete protocols, see our <a href="https://github.com/jschoudt/Pathfinder2eConversion/blob/main/ThirdPartyContentUsage.md#4-ai-assisted-content-guidelines--verification-protocol" target="_blank">AI Guidelines & Verification Protocol</a>.</p>
    </div>
  `;

  // Modern DialogV2 (Foundry v12+) with fallback to legacy Dialog (v11)
  if (foundry?.applications?.api?.DialogV2) {
    await foundry.applications.api.DialogV2.prompt({
      window: { title: "Pathfinder's Guide to Eberron - License & Community Notices" },
      content: legalContent,
      ok: {
        label: "I Accept",
        icon: "fa-solid fa-check",
        callback: () => {
          game.settings.set(MODULE_ID, 'license-accepted', true);
          game.settings.set(MODULE_ID, 'accepted-version', thisVersion);
        }
      },
      rejectClose: false
    });
  } else {
    new Dialog({
      title: "Pathfinder's Guide to Eberron - Legal & Community Notices",
      content: legalContent,
      buttons: {
        close: {
          label: "Close",
          icon: '<i class="fas fa-times"></i>'
        },
        accept: {
          label: "I Accept",
          icon: '<i class="fas fa-check"></i>',
          callback: () => {
            game.settings.set(MODULE_ID, 'license-accepted', true);
            game.settings.set(MODULE_ID, 'accepted-version', thisVersion);
          }
        }
      },
      default: "accept"
    }).render(true);
  }
});
