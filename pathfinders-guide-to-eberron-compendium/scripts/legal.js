Hooks.once('ready', async () => {
  const thisVersion = "2.4.0";
  const MODULE_ID = "pathfinders-guide-to-eberron-compendium";

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
