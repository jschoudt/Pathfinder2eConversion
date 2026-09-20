import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// Map of Scribe URLs / slugs to local Subsection files
const SLUG_TO_FILE = {
  "https://scribe.pf2.tools/v/60BxLHYq": "world-of-eberron.txt",
  "https://scribe.pf2.tools/v/jRWZ2dQp": "languages.txt",
  "https://scribe.pf2.tools/v/tsFdTP7X": "religions.txt",
  "https://scribe.pf2.tools/v/ZTooMbHZ": "planes-of-eberron.txt",
  "https://scribe.pf2.tools/v/47jFrozX": "guns-and-gears.txt",
  "https://scribe.pf2.tools/v/y0XBc8ZV": "ancestries.txt",
  "https://scribe.pf2.tools/v/R6QVPJql": "bugbears.txt",
  "https://scribe.pf2.tools/v/6fV45ooP": "eberron-changelings.txt",
  "https://scribe.pf2.tools/v/gargoyles": "gargoyles.txt",
  "https://scribe.pf2.tools/v/mdpJh63j": "gnolls.txt",
  "https://scribe.pf2.tools/v/harpies": "harpies.txt",
  "https://scribe.pf2.tools/v/ZhZBvBqQ": "kalashtar.txt",
  "https://scribe.pf2.tools/v/kalamer-landwalkers": "kalamer-landwalkers.txt",
  "https://scribe.pf2.tools/v/medusas": "medusas.txt",
  "https://scribe.pf2.tools/v/sahuagin": "sahuagin.txt",
  "https://scribe.pf2.tools/v/vBjr7BMV": "shifters.txt",
  "https://scribe.pf2.tools/v/bmXjCPvf": "warforged.txt",
  "https://scribe.pf2.tools/v/worgs": "worgs.txt",
  "https://scribe.pf2.tools/v/ruinbound": "ruinbound.txt",
  "https://scribe.pf2.tools/v/9OVOPLzM": "dragonmarks.txt",
  "https://scribe.pf2.tools/v/23V7V1pp": "backgrounds.txt",
  "https://scribe.pf2.tools/v/classes": "classes.txt",
  "https://scribe.pf2.tools/v/w6BQHy51": "archetypes.txt",
  "https://scribe.pf2.tools/v/JQJW7vp0": "wandslingers.txt",
  "https://scribe.pf2.tools/v/LyzLTFv7": "feats.txt",
  "https://scribe.pf2.tools/v/M6FQ11X3": "items-of-eberron.txt",
  "https://scribe.pf2.tools/v/s9p3sJv5": "spells.txt",
  "https://scribe.pf2.tools/v/eberron-creatures": "creatures.txt",
  "https://scribe.pf2.tools/v/eberron-equivalents": "eberron-equivalents.txt"
};

// Also support raw filenames or slugs without full URL prefix
for (const [url, file] of Object.entries({ ...SLUG_TOFILE_EXTRA() })) {
  SLUG_TO_FILE[url] = file;
}

function SLUG_TOFILE_EXTRA() {
  const extra = {};
  for (const [url, file] of Object.entries(SLUG_TO_FILE)) {
    const slug = url.replace("https://scribe.pf2.tools/v/", "");
    extra[slug] = file;
    extra[`Subsections/${file}`] = file;
  }
  return extra;
}

function inlineSubsections(text, visited = new Set()) {
  let result = text.replace(/(\r\n|\r)/g, "\n");

  for (const [pattern, fileName] of Object.entries(SLUG_TO_FILE)) {
    const filePath = path.join(ROOT_DIR, "Subsections", fileName);
    if (!fs.existsSync(filePath)) continue;

    // Match lines that contain only the URL/slug (ignoring trailing whitespace)
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lineRegex = new RegExp(`^\\s*${escaped}\\s*$`, "gm");

    if (lineRegex.test(result)) {
      if (visited.has(fileName)) {
        console.warn(`[WARN] Circular or repeated include detected for ${fileName}`);
        continue;
      }
      visited.add(fileName);
      const subContent = fs.readFileSync(filePath, "utf8");
      const inlinedSub = inlineSubsections(subContent, new Set(visited));
      result = result.replace(lineRegex, inlinedSub);
    }
  }

  return result;
}

export function compileDocument() {
  console.log("Reading master document Pathfinder-2e-Eberron-Conversion.txt...");
  const masterPath = path.join(ROOT_DIR, "Pathfinder-2e-Eberron-Conversion.txt");
  const masterContent = fs.readFileSync(masterPath, "utf8");

  console.log("Inlining all 27 subsection files...");
  const unified = inlineSubsections(masterContent);

  console.log("Unified markdown length:", unified.length, "characters");

  // Read app.js to extract action images & scribecss
  const appJsPath = "/tmp/scribe_app.js";
  if (!fs.existsSync(appJsPath)) {
    console.log("Fetching scribe app.js...");
    execSync(`curl -s "https://scribe.pf2.tools/app/app.js" > /tmp/scribe_app.js`);
  }
  const appJs = fs.readFileSync(appJsPath, "utf8");

  const startImg = appJs.indexOf("images = {");
  const endImg = appJs.indexOf("\n}", startImg);
  const imagesStr = appJs.slice(startImg + 9, endImg + 2);

  const startCss = appJs.indexOf("scribecss = `");
  const endCss = appJs.indexOf("`.trim();", startCss);
  const scribecss = appJs.slice(startCss + 13, endCss);

  // Asset paths relative to output HTML
  const htmlPath = path.join(ROOT_DIR, "pathfinders-guide-to-eberron.html");

  const htmlTemplate = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Pathfinder's Guide to Eberron</title>
  <link rel="stylesheet" href="tools/scribe-assets/bootstrap.min.css">
  <link rel="stylesheet" href="tools/scribe-assets/all.min.css">
  <link rel="stylesheet" href="tools/scribe-assets/font.css">
  <link rel="stylesheet" href="tools/scribe-assets/app.css">
  <style>
    ${scribecss}
    @page {
      size: A4 portrait !important;
      margin: 0 !important;
    }
    html, body {
      background: #333;
      margin: 0;
      padding: 0;
    }
    .printing {
      background: #333;
      padding: 0;
      margin: 0;
    }
    .bg-paper {
      background: #eee url('tools/scribe-assets/paper.jpg') !important;
    }
    /* In print mode, background should be white/neutral for high fidelity printing */
    @media print {
      html, body, .printing {
        background: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .page {
        margin: 0 !important;
        page-break-after: always !important;
        box-shadow: none !important;
      }
    }
    /* On screen preview mode */
    @media screen {
      .page {
        margin: 20px auto !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
      }
    }
  </style>
  <script src="tools/scribe-assets/lodash.min.js"></script>
  <script src="tools/scribe-assets/showdown.min.js"></script>
  <script src="tools/scribe-assets/purify.min.js"></script>
</head>
<body class="printing">
  <div id="result">
    <div id="loading" style="color: #fff; font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>Assembling Pathfinder's Guide to Eberron...</h2>
      <p>Rendering pages and typesetting layout...</p>
    </div>
  </div>

  <script id="raw-markdown" type="text/markdown">
${unified.replace(/<\/script>/gi, "<\\/script>")}
  </script>

  <script>
    const images = ${imagesStr};

    const converter = new showdown.Converter({
      simpleLineBreaks: true,
      ghCompatibleHeaderId: true,
      noHeaderId: true,
      tables: true,
      openLinksInNewWindow: true,
      simplifiedAutoLink: true,
      parseImgDimensions: true,
      strikethrough: true,
      tasklists: true,
      smoothLivePreview: true,
    });

    function splitTraits(str) {
      let result = [];
      let special = ['unique', 'rare', 'uncommon', 'lg', 'ng', 'cg', 'ln', 'n', 'cn', 'le', 'ne', 'ce', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
      let arr = str.toLowerCase().split(/\\s*,\\s*/gmi);
      for (let t of special) {
        if (arr.find(i => i == t)) result.push(t);
      }
      return [...result, ..._.difference(arr, special)];
    }

    function renderPage(str, watermark, title) {
      let size = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
      let alignment = ['lg', 'ng', 'cg', 'ln', 'n', 'cn', 'le', 'ne', 'ce'];
      let type = ['city', 'village', 'metropolis', 'town'];

      let traitEdge = '<div class="pf-trait pf-trait-edge">&nbsp;</div>';
      let contentStart = '<div class="content" data-markdown="1">';
      let contentEnd = '</div>';
      let columnStart = '<div class="flex-even column" data-markdown="1">';
      let columnEnd = '</div>';
      let pageStart = '<div class="bg-paper page d-flex flex-wrap a4" data-markdown="1"><div class="page-overlay"></div>' + columnStart + contentStart;
      let pageEnd = contentEnd + columnEnd;

      if (watermark) pageEnd += '<div class="watermark">' + watermark + '</div>';
      if (title) pageEnd += '<div class="title"><h1>' + title + '</h1></div>';

      pageEnd += '</div>';

      let data = str
        .replace(/^( +)/gm, (m, p1) => '&nbsp;'.repeat(p1.length))
        .replace(/^-+$/gmi, '<hr>\\n')
        .replace(/^(\\w+) *\\(([\\s\\S]+?)\\n\\)/gmi, (m, p1, p2) => {
          p2 = p2.replace(/^(\\||col(umn)?)$/gmi, columnEnd + columnStart);
          p1 = p1.toLowerCase();
          let suffix = p1 === 'head' ? '\\n/\\n' : '';
          return contentEnd + '<div class="' + p1 + ' d-flex flex-wrap" data-markdown="1">' + columnStart + p2 + columnEnd + '</div>' + contentStart + suffix;
        })
        .replace(/^; *(.*)$/gmi, (m, p1) => {
          let result = '<div class="traits">' + traitEdge + '!--';
          for (let trait of splitTraits(p1)) {
            let color = trait;
            if (size.includes(trait)) color = 'size';
            if (type.includes(trait)) color = 'type';
            if (alignment.includes(trait)) color = 'align';
            result += '--!<div class="pf-trait pf-trait-' + color + '">' + trait + '</div>!--';
          }
          return result + '--!' + traitEdge + '</div>';
        })
        .replace(/^\\.\\s*(.*)$/gmi, '<div class="tfoot">$1</div>')
        .replace(/^(\\||col(umn)?)$/gmi, contentEnd + columnEnd + columnStart + contentStart)
        .replace(/^(\\/|break)$/gmi, contentEnd + columnEnd + '<div class="content w-100"></div>' + columnStart + contentStart);

      data = pageStart + data + pageEnd;
      data = DOMPurify.sanitize(converter.makeHtml(data))
        .replace(/<p><\\/p>/gmi, '')
        .replace(/<p><strong>/gmi, '<p class="hang"><strong>')
        .replace(/<div data-markdown="1" class="content"><\\/div>/gmi, '')
        .replace(/!--/gmi, '<!--')
        .replace(/--!/gmi, '-->')
        .replace(/<hr><br>/gmi, '<hr>')
        .replace(/<h2.*?>(.*?) +(\\d+[stndrh]{2})(?: +<a.*<\\/a>)*<\\/h2>/gmi, '<div class="p d-flex"><h2>$1</h2><h2 class="mr-0 my-0 ml-auto">$2</h2></div>')
        .replace(/:(aaa|aa|a|r|f):/gmi, (m, p1) => '<img src="' + images[p1.toLowerCase()] + '" class="text-img">')
        .replace(/\\[(aaa|aa|a|r|f)\\]/gmi, (m, p1) => '<img src="' + images[p1.toLowerCase()] + '" class="text-img">');

      return data;
    }

    function buildAll() {
      let raw = document.getElementById("raw-markdown").textContent.trim();
      raw = raw.replace(/(\\r\\n|\\n|\\r)/g, '\\n');

      let watermark = '';
      let title = '';

      let watermarkmatch = [...raw.matchAll(/^watermark *\\( *\\n([\\s\\S]+?)\\n\\)/gmi)];
      for (let i of watermarkmatch) watermark += i[1];
      raw = raw.replace(/^watermark *\\([\\s\\S]+?\\n\\)/gmi, '');

      let titlematch = [...raw.matchAll(/^title *\\( *\\n([\\s\\S]+?)\\n\\)/gmi)];
      for (let i of titlematch) title += i[1];
      raw = raw.replace(/^title *\\([\\s\\S]+?\\n\\)/gmi, '');

      // Strip HTML comments
      raw = raw.replace(/<!--[\\s\\S]*?-->/gmi, '');

      // Handle TOC markers
      let toc = [];
      let tocmatch = [...raw.matchAll(/^\\#+.+?\\(\\(([\\+*]*)(.+?)\\)\\)/gmi)];
      let n = 0;
      for (let i of tocmatch) {
        toc.push({
          depth: i[1].length,
          match: i[1] + i[2],
          key: i[2],
          index: n
        });
        n += 1;
      }
      for (let i of toc) {
        i.id = i.key.toLowerCase().replace(/\\W/gmi, '-');
        raw = raw.replace('((' + i.match + '))', '<a id="toc-' + i.id + '"></a><a id="toc-' + i.id + '-' + i.index + '"></a>');
      }

      // Split pages
      const rawPages = raw.split(/^(?:\\=|page)\\s*$/mi).map(p => p.trim()).filter(Boolean);
      console.log('Total pages to render:', rawPages.length);

      const container = document.getElementById("result");
      container.innerHTML = '';

      for (let idx = 0; idx < rawPages.length; idx++) {
        const pageHtml = renderPage(rawPages[idx], watermark, title);
        const temp = document.createElement("div");
        temp.innerHTML = pageHtml;
        container.appendChild(temp.firstElementChild || temp);
      }

      document.body.setAttribute("data-rendered", "true");
      document.body.setAttribute("data-page-count", rawPages.length);
      console.log('Rendering complete! Total pages:', rawPages.length);
    }

    // Run buildAll immediately since script is at the bottom of the body
    try {
      buildAll();
    } catch (err) {
      console.error("buildAll error:", err);
    }
    window.addEventListener("DOMContentLoaded", () => {
      if (!document.body.hasAttribute("data-rendered")) {
        buildAll();
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlTemplate, "utf8");
  console.log(`Generated HTML document: ${htmlPath} (${fs.statSync(htmlPath).size} bytes)`);
  return htmlPath;
}

export function findChromePath() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  if (process.platform === "darwin") {
    const macPaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
    ];
    for (const p of macPaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (process.platform === "win32") {
    const winPaths = [
      process.env["PROGRAMFILES"] + "\\Google\\Chrome\\Application\\chrome.exe",
      process.env["PROGRAMFILES(X86)"] + "\\Google\\Chrome\\Application\\chrome.exe",
      process.env["LOCALAPPDATA"] + "\\Google\\Chrome\\Application\\chrome.exe"
    ];
    for (const p of winPaths) {
      if (p && fs.existsSync(p)) return p;
    }
  } else {
    // Linux / CI runners
    const linuxPaths = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium"
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  // Fallback to checking PATH
  try {
    const which = execSync(
      process.platform === "win32"
        ? "where chrome"
        : "which google-chrome || which google-chrome-stable || which chromium-browser || which chromium || which chrome",
      { encoding: "utf8" }
    ).trim().split("\n")[0].trim();
    if (which && fs.existsSync(which)) return which;
  } catch {}

  return null;
}

export function generatePdf() {
  const htmlPath = compileDocument();
  const pdfPath = path.join(ROOT_DIR, "pathfinders-guide-to-eberron.pdf");
  const chromePath = findChromePath();

  if (!chromePath) {
    throw new Error(`Google Chrome or Chromium was not found on this system.`);
  }

  console.log(`Generating PDF via Chrome headless (${chromePath})...`);
  console.log(`Output: ${pdfPath}`);

  // Headless flags including Linux CI container sandbox accommodations
  const flags = [
    '--headless=new',
    '--no-pdf-header-footer',
    `--print-to-pdf="${pdfPath}"`,
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=25000',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ].join(' ');

  const cmd = `"${chromePath}" ${flags} "file://${htmlPath}"`;
  
  execSync(cmd, { stdio: "inherit" });

  const stat = fs.statSync(pdfPath);
  console.log(`\nSUCCESS! PDF generated successfully.`);
  console.log(`File: ${pdfPath}`);
  console.log(`Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB (${stat.size} bytes)`);
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--html-only")) {
    compileDocument();
  } else {
    generatePdf();
  }
}
