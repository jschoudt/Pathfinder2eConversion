[Subscribe](https://github.com/jschoudt/Pathfinder2eConversion/subscription) | [Discuss](https://github.com/jschoudt/Pathfinder2eConversion/discussions) | [Open Issue](https://github.com/jschoudt/Pathfinder2eConversion/issues)  
-
[Full Document](https://scribe.pf2.tools/v/2qF7WjsY-pathfinders-guide-to-eberron)
-
# Foundry Module - Version 2.2.2
The foundry module is available for personal use by directly installing from the module manifest URL directly.
`https://github.com/jschoudt/Pathfinder2eConversion/releases/latest/download/module.json`  
It is only available for personal use, and thus will not be made available directly by the Foundry Add-On Modules Library. Please report any issues you see on the github. 
### Installation
1. Open the foundry admin page
2. Go to the Add-On Modules tab
3. Open the install module dialogue
4. Copy paste the above manifest URL directly into the Manifest URL box at the bottom of the window and click install.

# Pathbuilder JSON - Version 1.6.6
The Pathbuilder JSON is available for personal use by adding the JSON from the `https://github.com/jschoudt/Pathfinder2eConversion/releases/latest/download/pathfinders-guide-to-eberron.json`  

# Pathfinder's Guide to Eberron  - Version 1.6.7

> [!NOTE]
> **Attribution & Project Provenance:**  
> This project is an independent continuation and fork of the original [Pathfinder2eConversion](https://github.com/TNychka/Pathfinder2eConversion) created and developed by **TNychka**, with major contributions by **John Cox** and the Eberron/Pathfinder 2e homebrew community. While this repository is maintained independently by **jschoudt**, full credit and heartfelt thanks for the original architecture, text, and conversion framework belong to **TNychka**.

The Pathfinder's guide to Eberron is a homebrew conversion of the Pathfinder 2e mechanics to support the world and Lore of Eberron. It would be prohibitive to provide all of the lore that Eberron has developed over the years - and any lore provided by this guide would be poorly repeated imitations of better summaries. This guide uses the following books as references and will provide page numbers to learn more. [D&D 3 Eberron Campaign Setting](https://www.dmsguild.com/product/28474/Eberron-Campaign-Setting-3e) by Keith Baker, [Exploring Eberron](https://www.dmsguild.com/product/315887/Exploring-Eberron) by Keith Baker, and the [Eberronicon](https://www.dmsguild.com/product/297249/Eberronicon-A-Pocket-Guide-to-the-World). All of these are available for purchase on the [Dungeon Masters Guild](https://www.dmsguild.com/) and provide all of the background information you might need to run the world of Eberron.

## Why Pathfinder 2e?
Pathfinder 2e's levelling system supports the pulp action of Eberron well. At low levels, your adventurers will fight against threats to towns or cities, while at high levels these become trivial and adventurers' will be called on to fight one or more of the threats to nations or even the entire world.

Since Eberron was developed for the D&D 3 system, translating mechanics and items to Pathfinder 2e is frequently straightforward. The Pathfinder's Guide to Eberron primarily provides support for Ancestries, Dragonmarks, Equipment, Spells, and conversions of specific mechanics or lore of the world tied to the D&D 3 and D&D 5e. 

### Ancestries
There are several unique playable Ancestries in Eberron, such as the Bugbear, Eberron Changeling, Gnoll, Kalashtar, Shifter, and Warforged. The Pathfinder's Guide to Eberron provides support for these new ancestries, or ways to play them with the existing Pathfinder 2e ancestries.

With the Pathfinder 2e feats system, there are some feats which tie Golarian lore directly into Ancestry. Suggestions are provided for altering these to fit the world of Eberron (although mechanics are rarely changed). 

### Dragonmarks
Dragonmarks are a new system of focus spells provided by the Dragonmarks which manifest on many of the Ancestries present in the world of Eberron. This guide provides the steps and support to use Dragonmarks in Eberron.

### Equipment
With the wide magic of Eberron, access to magic items and crafting supplies is different from the world of Golarion. New magic items are provided, along with common more mundane adventuring gear and weapons.

### Spells
With the arms race brought about by the last war, and the magic of dragonmarks, several new spells are introduced into the world. Eberron is a wide-magic, but low-level-magic setting, so the majority of these spells are low level as well.

### Other
This guide also provides details about running the world of Eberron to the full extent  are some what minor guides for building NPCs and PCs that fit the rich lore of the world.

## Testing & Local Debugging

The repository includes a comprehensive 325-test Vitest suite, headless Foundry v14 Document schema validators, and full local debugger support.

### Running Tests via CLI

| Command | Description |
| :--- | :--- |
| `npm test` | Runs the full 325-test Vitest suite across all 12 test files. |
| `npm run test:watch` | Interactive watch mode. Press <kbd>t</kbd> to filter by test name, <kbd>p</kbd> to filter by file, or <kbd>f</kbd> to run only failed tests. |
| `npm run test:name "<pattern>"` | Runs specific test cases matching a name, ID, or regex pattern (e.g. `npm run test:name "Warforged"`). |
| `npm test -- -t "<pattern>"` | Standard Vitest filter flag for running specific test cases by substring/regex. |
| `npm run test:failed` | Automatically re-runs only the test cases that failed during the last run. |
| `npm run test:debug` | Starts the test suite with `--inspect-brk --no-file-parallelism` on port `9229` for Node/Chrome DevTools debugging. |
| `npm run test:failed:debug` | Starts only the failed tests with `--inspect-brk` attached to the debugger. |
| `npm run validate` | Runs headless Foundry v14 Document schema and PF2e rule element validation against all 582 source documents. |

### Running & Debugging in the IDE (VS Code / Antigravity IDE)

The repository provides ready-to-use launch configurations in `.vscode/launch.json`:

1. **Debug Vitest: Current Test File:** Open any test file (e.g. `tests/ancestries.test.mjs`) and press <kbd>F5</kbd> (or select from the Run & Debug panel). It runs only that file under the debugger with full breakpoint support.
2. **Debug Vitest: By Name / Filter:** Prompts you for a test name substring or regex pattern (e.g. `Aberrant Feedback` or `Warforged`), then runs and breaks at breakpoints only within matching tests.
3. **Debug Vitest: Failed Tests (Last Run):** Automatically inspects `.vitest/test-results.json` and launches the debugger on only the tests that failed in the previous test execution.
4. **Debug Vitest: All Tests:** Runs all 325 tests sequentially (`--no-file-parallelism`) under the debugger.
5. **Debug Vitest: Interactive Watch Mode:** Starts Vitest in interactive watch mode under the debugger, allowing live breakpoint hits as you edit files or toggle filters with <kbd>t</kbd> and <kbd>f</kbd>.
6. **Attach to Node Debugger (Port 9229):** Connects to any test run started from the terminal with `npm run test:debug` or `npm run test:failed:debug`.


# Questions
Your input is greatly appreciated! I want to make contributing to this project as easy as possible. If you have questions, ideas, or suggestions, please feel free to open a new issue for the maintainer to address.

# Contributing
To use these files, copy paste each of the files into their own document at https://scribe.pf2.tools/. If modifying the main file Pathfinder-2e-Eberron-Conversion.txt you will need to change the subsection hyperlinks to reference your own documents, otherwise your changes won't be reflected. From here, adjust and modify the file to see formatting changes live and ensure that everything renders correctly. When that's complete, send the entire text back for review using a pull request. 

The subsections folder contains individual pieces of the complete document managed in smaller chunks. If you are making adjustments, you will probably be modifying one of these subsections rather than the main document. 

If you don't want to go through the hassle of figuring out github pull requests but would still like to submit, open a new issue with the new content and we'll do our best to add it in and credit you.

### License & Content Guidelines
By contributing, you agree that your contributions will be licensed under the project's **[CC BY-NC-SA 4.0 License](LICENSE.md)** and conform to the **[Third-Party Content Usage & Licensing Guide](ThirdPartyContentUsage.md)**.

## Project Provenance & Contributors
* **Original Project Creator:** [TNychka](https://github.com/TNychka/Pathfinder2eConversion) (shared under community fair use / Fan Content terms)
* **Fork Maintainer:** [jschoudt](https://github.com/jschoudt/Pathfinder2eConversion)
* **Contributors & Supporters:** Thank you to all the many people who have helped in large or small ways through feedback or suggestions:
  - John Cox (u/FranciscoBelaqua on Reddit and @franciscobelaqua on Discord) – Development of the Pathbuilder JSON
  - The Pathfinder2eCreations community, the Eberron Pathfinder2e discord community, and everyone else who contributed to both the upstream and fork repositories.

## AI Assistance & Transparency Disclosure
Artificial intelligence tools (such as large language models and generative image systems) are used to assist in the development of this conversion project:
* **Mechanical Conversion & Balance:** AI assists with preliminary stat block transcription and mechanical brainstorming. All mechanics, numbers, action costs, and rules are manually reviewed, edited, and balanced by human contributors for Pathfinder 2e Remaster fidelity.
* **Original Expression:** AI-generated text is audited against source materials to guarantee that no proprietary descriptions or flavor text from official sourcebooks are inadvertently reproduced.
* **Artwork:** Any AI-generated visual assets are used exclusively for non-commercial visual accompaniment in accordance with US Copyright Office guidelines regarding machine-generated works.

For full protocols, see the [AI Guidelines & Verification Protocol](ThirdPartyContentUsage.md#4-ai-assisted-content-guidelines--verification-protocol).
---
# Legal
*Pathfinder's Guide to Eberron is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.*

*Pathfinder's Guide to Eberron uses trademarks and/or copyrights owned by Paizo Inc., used under Paizo's Community Use Policy ([paizo.com/communityuse](https://paizo.com/communityuse)). We are expressly prohibited from charging you to use or access this content. Pathfinder's Guide to Eberron is not published, endorsed, or specifically approved by Paizo.*

For full licensing details, contributor agreements, and third-party content rules, see [LICENSE.md](LICENSE.md) and [ThirdPartyContentUsage.md](ThirdPartyContentUsage.md).

*In the event of crashing airships, attacks by the Emerald Claw, or invasions by mind-bending corruptions ascending from the depths (The Mror Holds declined to comment on whether or not they have dug too deep), don't panic... and keep at least one hero point in your back pocket.*

