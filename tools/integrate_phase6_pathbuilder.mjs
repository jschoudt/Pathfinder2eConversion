import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PACK_PATH = path.resolve('pathbuilder-custom-pack/pathfinders-guide-to-eberron.json');
const README_PATH = path.resolve('pathbuilder-custom-pack/README.md');

async function run() {
  const pack = JSON.parse(await readFile(PACK_PATH, 'utf-8'));

  // 1. Add Arcane Harpoon Cannon to listCustomWeapons if missing
  if (!pack.listCustomWeapons) pack.listCustomWeapons = [];
  if (!pack.listCustomWeapons.some(w => w.name === 'Arcane Harpoon Cannon')) {
    pack.listCustomWeapons.push({
      databaseID: 1,
      uniqueIdentiier: 'gm23odo5-d6wf-gwyf-9988-776655443322',
      name: 'Arcane Harpoon Cannon',
      hands: '2',
      description: 'Mounted to an airship bow or gunwale, this heavy arcane launcher fires a barbed dragonshard spear attached to a high-tensile steel tow cable (Range 120 ft). Harpoons target vessels or Huge or smaller creatures on hit.',
      src: "Pathfinder's Guide to Eberron",
      proficiencyType: 2,
      damage: 12,
      damageType: 'P',
      group: 'Bow',
      weaponTraits: 'Magical, Tethered, Uncommon, 3rd Party'
    });
    console.log('Added Arcane Harpoon Cannon to listCustomWeapons');
  }

  // 2. Add Overcharge Elemental Ring to listCustomFeats if missing
  if (!pack.listCustomFeats) pack.listCustomFeats = [];
  if (!pack.listCustomFeats.some(f => f.name === 'Overcharge Elemental Ring')) {
    pack.listCustomFeats.push({
      id: 'bjcu17lg-sllo-r3jy-1122-334455667788',
      name: 'Overcharge Elemental Ring',
      level: 1,
      traits: ['Air', 'Fire', 'Magical', '3rd Party'],
      actionType: 'Action',
      actions: 1,
      type: 'Feat',
      src: "Pathfinder's Guide to Eberron",
      description: 'You push the bound elemental spirit past containment safety governors. The airship gains a +15-foot status bonus to Fly Speed for the round. Attempt a DC 5 flat check; on failure, the airship is slowed 1 for 1 round.'
    });
    console.log('Added Overcharge Elemental Ring to listCustomFeats');
  }

  await writeFile(PACK_PATH, JSON.stringify(pack, null, 2) + '\n');
  console.log(`Saved ${PACK_PATH}`);
  console.log(`Total weapons: ${pack.listCustomWeapons.length}`);
  console.log(`Total feats: ${pack.listCustomFeats.length}`);

  // Update README
  let readme = await readFile(README_PATH, 'utf-8');
  readme = readme.replace(/- \*\*Feats & Classes \(\d+\):\*\*/, `- **Feats & Classes (${pack.listCustomFeats.length}):**`);
  readme = readme.replace(/- \*\*Weapons & Equipment \(\d+\):\*\*/, `- **Weapons & Equipment (${pack.listCustomWeapons.length}):**`);
  await writeFile(README_PATH, readme);
  console.log(`Updated ${README_PATH}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
