# Third-Party Content & Licensing Compliance Guide

This guide establishes the legal boundaries, licensing frameworks, and writing rules for **Pathfinder's Guide to Eberron** (and associated Foundry VTT / Pathbuilder modules). 

Both human contributors and AI assistants working on this repository **must** follow these guidelines to ensure the project remains strictly non-infringing and license-compliant.

---

## 1. Core Principles: Idea vs. Expression

Under US copyright law (17 U.S.C. § 102(b)):
* **Game Mechanics are Not Protected:** Rules, numbers, action economies, mathematical formulas, and mechanical systems are not copyrightable. Translating a 5e or 3.5e concept into Pathfinder 2e mechanics (Ancestry feats, action costs, dice formulas, degrees of success) is legally permissible.
* **Creative Expression IS Protected:** The specific text, descriptions, lore paragraphs, dialogue, tables of lore, and artwork created by Wizards of the Coast or Keith Baker are copyrighted expression.
* **The Golden Rule:** **Never copy-paste flavor text, lore summaries, or descriptions.** Always write mechanical descriptions, feats, and item fluff in your **own original words**, and direct users to the official or third-party source books for full background lore via citations.

---

## 2. Applicable Legal Frameworks

### A. The Open Game License (OGL) & Eberron
> [!WARNING]
> **Eberron is NOT covered by the OGL.**
> The Open Game License (OGL 1.0a) specifically excludes **Product Identity (PI)**. All proper nouns, locations (e.g., Sharn, Khorvaire, Mournland), deities, dragonmarked houses, factions, and Eberron-specific setting concepts belong exclusively to Wizards of the Coast LLC as Product Identity. You cannot legally publish Eberron lore or names under the OGL.

### B. Wizards of the Coast Fan Content Policy
Because the OGL does not permit Eberron content, this project operates under the **[Wizards of the Coast Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)**.

Requirements:
1. **Strictly Non-Commercial:** The repository, files, releases, and tools must remain 100% free of charge. No paywalls, paid tiers, or monetization.
2. **Mandatory Fan Content Disclaimer:** Every distribution channel (README, PDF header, Foundry module dialog) must include the exact WotC disclaimer (see Section 6).
3. **No Official Logos:** Never use official D&D, Eberron, or WotC logo graphics or trade dress. Descriptive use of the word "Eberron" is permitted.
4. **No Full Substitutes:** The project must never serve as a free substitute for buying the official rulebooks or setting supplements.

### C. Paizo Community Use Policy (CUP) & Open RPG Creative (ORC) License
Because this project uses Pathfinder 2nd Edition rules:
1. Include Paizo's required **Community Use Policy** notice.
2. Standard PF2e terms, traits, conditions, and mechanics can be freely utilized under Paizo's open licensing frameworks.

---

## 3. Source-by-Source Rules

### 1. Wizards of the Coast (3e / 3.5e, 4e, 5e, 5.5e / 2024)
*Books include: Eberron Campaign Setting (3.5e), Player's Guide to Eberron (3.5e), Wayfinder's Guide to Eberron, Eberron: Rising from the Last War (5e), etc.*

* **Allowed:**
  * Adapting races/ancestries (Warforged, Kalashtar, Shifters, Changeling), Dragonmarks (as focus spells/feats), Eberron-specific items, and prestige classes into PF2e mechanics.
  * Writing short, original mechanical descriptions that fit PF2e formatting.
  * Referring to setting elements, cities, factions, and deities by name.
* **Prohibited:**
  * Copying flavor text, history sections, or descriptive blocks from WotC sourcebooks.
  * Uploading extracts, scans, or ripped text files from official WotC PDFs.

---

### 2. Keith Baker’s DMs Guild Books
*Titles include: Exploring Eberron, Chronicles of Eberron, Frontiers of Eberron: Quickstone, etc. (KB Presents)*

* **Legal Status:**
  * DMs Guild products operate under the **DMs Guild Community Content Agreement**. That agreement permits sharing content *only among other creators publishing within DMs Guild*. It grants **no rights** for external distribution (like a public GitHub repo).
  * Keith Baker and his co-authors own the copyright to their original text, lore, artwork, and 5e mechanics.
* **Allowed:**
  * Designing original PF2e equivalents for concepts Keith introduced (e.g., Dhakaani weapon traditions, Malenti feats, Ruinbound Magus mechanics, Aereni Aeromancers).
  * Writing all ability names and descriptions in your own words.
  * **Citing book titles and page numbers** so users can read the original lore in the source book.
* **Prohibited:**
  * Copy-pasting text, tables, quotes, or illustrations from *Exploring Eberron*, *Chronicles of Eberron*, or *Frontiers of Eberron*.
  * Copying 5e mechanics verbatim.

---

### 3. D&D Beyond Partner Content (5.5e / 2024 Keith Baker Releases)
*Titles include: Chronicles of Eberron and Frontiers of Eberron adapted for D&D Beyond.*

* **Allowed:**
  * Translating 2024/5.5e rule updates into PF2e Remaster mechanics in your own original phrasing.
  * Linking to the official D&D Beyond product page.
* **Prohibited:**
  * Scraping or republishing raw data or compendium files from D&D Beyond.

---

### 4. Keith Baker’s Blog ([keith-baker.com](https://keith-baker.com/))
*Keith regularly publishes deep dives into Eberron lore, cultures, and "In My Eberron" (IMHO) interpretations.*

* **Allowed:**
  * Using Keith's articles as inspiration for new PF2e character options, items, or archetypes.
  * Summarizing general lore concepts in your own words.
  * Providing direct links and citations to the relevant blog article.
* **Prohibited:**
  * Copying full paragraphs or entire articles from the blog into conversion documents.

---

### 5. Keith Baker’s Patreon & Discord
*Keith operates a Patreon for Eberron patrons featuring early access articles, playtests, and discussions.*

* **Allowed:**
  * Reading for personal inspiration.
* **Strictly Prohibited:**
  * **Never publish or adapt paywalled Patreon drafts, playtest mechanics, or patron-only text.**
  * All public adaptations must wait until content has been released publicly by the creator or author team.

---

### 6. Other Third-Party Content (e.g., *Eberronicon*, Anthony Joyce-Rivera, Wayne Chang)
* **Allowed:**
  * Recommending and linking to these products as great resources.
  * Citing page numbers for reference.
* **Prohibited:**
  * Reproducing their text, charts, or artwork without explicit written permission from the copyright holder.

---

## 4. AI-Assisted Content Guidelines & Verification Protocol

> [!WARNING]
> **Alpha Status & Mechanical Disclaimer:** The current content is considered **Alpha**; a large portion of it is AI-generated. While it has been lightly reviewed, it has not been deeply reviewed for mechanics, playability, encounter balance, etc. Community playtesting and issue submissions are actively encouraged.

Generative AI (Large Language Models and image generation models) can be powerful assistants for mechanical conversion, mathematical balancing, drafting stat blocks, and generating visual assets. However, because AI models are trained on internet datasets that include copyrighted material, strict protocols must be observed:

### A. The "Human in the Loop" Requirement
* **Alpha State & Review:** Material is in active development. Human contributors perform initial syntax, formatting, and schema audits, with deeper playtest review ongoing.
* **No Unvetted AI Content:** Never merge raw, unreviewed text generated by an AI directly into the codebase. 
* **PF2e Remaster Verification:** Verify that the AI correctly adheres to Pathfinder 2e Remaster terminology (e.g., *Vitality/Void* instead of *Positive/Negative*, *Off-guard* instead of *Flat-footed*, *Spell Rank* instead of *Spell Level*, proper 3-action economy symbology `[one-action]`, `[two-actions]`, etc.).
* **Mathematical Balance:** Always check level-appropriate DCs, attack bonuses, damage dice, and save progressions against the official *Pathfinder Gamemastery Guide / GM Core* monster and hazard creation benchmarks.

### B. Anti-Plagiarism & Text Regurgitation Audit
* LLMs can occasionally reproduce verbatim phrases or paragraphs from copyrighted D&D books that exist in their training data.
* **Audit Requirement:** Whenever an AI generates flavor text or ability write-ups for Eberron monsters, factions, or items, verify that the text does not mirror the exact wording in *Eberron: Rising from the Last War*, *Exploring Eberron*, or other official books.
* When in doubt, rewrite the descriptive text completely in your own words.

### C. AI-Generated Artwork & Visual Assets
* **Permitted Use:** AI-generated images (e.g., created via Midjourney, DALL-E, Stable Diffusion, or Imagen) are permitted for non-commercial character portraits, token art, and thematic illustration.
* **Ethical Prompting:** Do **not** prompt AI art generators with the names of specific living artists (e.g., avoid *"in the style of Wayne Reynolds"* or *"by Jesper Ejsing"*). Prompt for styles, atmospheres, and moods instead (e.g., *"pulpmagazine fantasy, art deco fantasy, watercolor illustration"*).
* **Legal Status (USCO Guidance):** Per the US Copyright Office, raw AI outputs lacking human creative authorship enter the public domain. Contributors cannot claim exclusive copyright over raw AI-generated art; it is provided solely as non-commercial decorative accompaniment.

---

## 5. Contributor Checklist: Writing a Conversion

When adding or revising a mechanic (Ancestry, Feat, Item, Spell, Archetype):

- [ ] **1. Fresh Text:** Is the flavor text completely rewritten from scratch in original wording?
- [ ] **2. PF2e Native Design:** Are the mechanics built for Pathfinder 2e (using Remaster terms such as Off-guard, Vitality/Void, Spell rank) rather than copied 5e text?
- [ ] **3. AI Verification (if applicable):** Has AI-generated content been human-audited for originality, Remaster terms, and mathematical balance?
- [ ] **4. No Trademarked Artwork/Maps:** Are there any copyrighted art assets, logos, or maps included? (Only use public domain, verified AI-generated, or self-created original art).
- [ ] **5. Clear Citation:** Does the entry include a citation pointing to the official book, DMs Guild title, or blog post for full lore?
- [ ] **6. No Paywall Material:** Is any of this material sourced from a private Patreon or subscription-only channel?

---

## 6. Required Legal Notices

Ensure that any major publication artifact (`README.md`, PDF front matter, Foundry module `legal.js`) retains these statements:

### Wizards of the Coast Fan Content Notice
> *Pathfinder's Guide to Eberron is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.*
>
> *This document can only be utilized for personal use and not to create new games incorporating Wizards IP or anything else that can or will be distributed that does not also conform to Wizards of the Coast’s Fan Content Policy.*
>
> *Eberron and its respective logo are trademarks of Wizards of the Coast, Inc., in the U.S.A. and other countries.*

### Paizo Community Use Notice
> *Pathfinder's Guide to Eberron uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy (paizo.com/communityuse). We are expressly prohibited from charging you to use or access this content. Pathfinder's Guide to Eberron is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit paizo.com.*

---

## 7. Citation Reference Template

Use this format when referencing third-party books or blog articles in conversion entries:

```markdown
### [Feature / Option Name]
**Reference:** *[Book Title]* (p. XX), by [Author] ([DMs Guild / Store Link])
*Optional Blog Reference:* [Keith Baker: "Article Title"](https://keith-baker.com/article-slug)

[Your original 1-2 sentence description summarizing the concept in your own words]

**PF2e Mechanics / Stat Block**
...
```
