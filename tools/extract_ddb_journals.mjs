#!/usr/bin/env node
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';

const DEFAULT_PACK_PATH = path.resolve('_foundry/data/Data/worlds/dnd2024-test/packs/ddb-dnd2024-test-ddb-journals');
const OUTPUT_BASE_DIR = path.resolve('_sources/foundry_extracted/ddb_journals');

export function cleanHtmlToMarkdown(html) {
  if (!html) return '';

  return html
    // Remove navigation blocks and scripts
    .replace(/<div id="comp-next-nav"[^>]*>.*?<\/div>/gis, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

    // Headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n\n#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n\n##### $1\n\n')

    // Bold / Italic
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')

    // Paragraphs & Breaks
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n\n---\n\n')

    // Blockquotes & Epigraphs
    .replace(/<aside[^>]*class="[^"]*epigraph[^"]*"[^>]*>(.*?)<\/aside>/gis, (_, content) => {
      return '\n\n> ' + content.trim().replace(/\n+/g, '\n> ') + '\n\n';
    })
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) => {
      return '\n\n> ' + content.trim().replace(/\n+/g, '\n> ') + '\n\n';
    })

    // Lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')

    // Remove figure blocks and images
    .replace(/<figure[^>]*>.*?<\/figure>/gis, '')
    .replace(/<img[^>]*>/gi, '')

    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, '')

    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')

    // Clean whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

async function extractDDBJournals(packPath = DEFAULT_PACK_PATH, outputDir = OUTPUT_BASE_DIR) {
  if (!existsSync(packPath)) {
    console.error(`❌ Pack directory does not exist: ${packPath}`);
    process.exit(1);
  }

  console.log(`\n📦 Reading DDB Journals from: ${packPath}`);
  await mkdir(outputDir, { recursive: true });

  // Create temporary copy without lock to allow reading even when Foundry is running
  const tmpDir = path.resolve('_sources/.tmp_ddb_journals_' + Date.now());
  await cp(packPath, tmpDir, {
    recursive: true,
    filter: (src) => !src.endsWith('LOCK')
  });

  const db = new ClassicLevel(tmpDir, { keyEncoding: 'utf8', valueEncoding: 'json' });
  const journals = new Map();
  const pageMap = new Map();

  try {
    await db.open();
    for await (const [key, value] of db.iterator()) {
      if (!value) continue;
      if (key.startsWith('!journal!') && !key.startsWith('!journal.pages!')) {
        journals.set(value._id, value);
      } else if (key.startsWith('!journal.pages!')) {
        const idKey = key.replace('!journal.pages!', '');
        pageMap.set(idKey, value);
      }
    }
  } finally {
    try {
      await db.close();
    } catch {}
    await rm(tmpDir, { recursive: true, force: true });
  }

  console.log(`Found ${journals.size} parent journals and ${pageMap.size} embedded pages.`);

  const books = {
    exeb: {
      id: 'exploring_eberron_5_5e',
      title: 'Exploring Eberron (5.5e Update)',
      author: 'Keith Baker',
      url: 'https://www.dmsguild.com/product/315808/Exploring-Eberron',
      chapters: []
    },
    foeq: {
      id: 'frontiers_of_eberron_quickstone',
      title: 'Frontiers of Eberron: Quickstone',
      author: 'Keith Baker',
      url: 'https://www.dmsguild.com/product/468819/Frontiers-of-Eberron-Quickstone',
      chapters: []
    }
  };

  // Organize chapters into books
  for (const [journalId, journal] of journals) {
    const bookCode = (journal.flags?.ddb?.bookCode || '').toLowerCase();
    if (!books[bookCode]) continue;

    const chapterOrder = journal.flags?.ddb?.ddbId ?? journal.sort ?? 0;
    const slug = journal.flags?.ddb?.slug || journal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Resolve pages
    const pageIds = Array.isArray(journal.pages) ? journal.pages : [];
    const chapterPages = [];

    for (let i = 0; i < pageIds.length; i++) {
      const pageId = typeof pageIds[i] === 'string' ? pageIds[i] : pageIds[i]?._id;
      const pageDoc = pageMap.get(`${journalId}.${pageId}`);
      if (!pageDoc) continue;

      const rawContent = pageDoc.text?.content || '';
      const markdown = cleanHtmlToMarkdown(rawContent);

      chapterPages.push({
        pageId,
        sort: pageDoc.sort ?? i,
        name: pageDoc.name,
        rawLength: rawContent.length,
        textLength: markdown.length,
        markdown
      });
    }

    chapterPages.sort((a, b) => a.sort - b.sort);

    books[bookCode].chapters.push({
      journalId,
      name: journal.name,
      chapterOrder,
      slug,
      pages: chapterPages
    });
  }

  // Sort chapters for each book
  for (const book of Object.values(books)) {
    book.chapters.sort((a, b) => a.chapterOrder - b.chapterOrder);
  }

  // Output files
  const extractionSummary = [];

  for (const book of Object.values(books)) {
    const bookDir = path.join(outputDir, book.id);
    const chaptersDir = path.join(bookDir, 'chapters');
    await mkdir(chaptersDir, { recursive: true });

    let totalChars = 0;
    let totalWords = 0;
    let totalSections = 0;
    const fullBookMarkdown = [];
    const structuredSections = [];

    fullBookMarkdown.push(`# ${book.title}\n**Author:** ${book.author}\n**Reference URL:** ${book.url}\n\n---\n`);

    for (let i = 0; i < book.chapters.length; i++) {
      const ch = book.chapters[i];
      const chPrefix = String(i).padStart(2, '0');
      const safeChName = ch.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const chFilename = `${chPrefix}_${safeChName}.md`;
      const chFilePath = path.join(chaptersDir, chFilename);

      const chContent = [];
      chContent.push(`# ${ch.name}\n\n`);

      for (let pIdx = 0; pIdx < ch.pages.length; pIdx++) {
        const page = ch.pages[pIdx];
        totalSections++;
        totalChars += page.markdown.length;
        const words = page.markdown.split(/\s+/).filter(Boolean).length;
        totalWords += words;

        // Skip duplicate title if page name equals chapter name
        if (page.name !== ch.name) {
          chContent.push(`## ${page.name}\n\n`);
        }
        chContent.push(page.markdown + '\n\n');

        structuredSections.push({
          bookId: book.id,
          bookTitle: book.title,
          chapterOrder: ch.chapterOrder,
          chapterName: ch.name,
          sectionOrder: pIdx,
          sectionName: page.name,
          pageId: page.pageId,
          charCount: page.markdown.length,
          wordCount: words,
          text: page.markdown
        });
      }

      const chapterMarkdown = chContent.join('');
      await writeFile(chFilePath, chapterMarkdown, 'utf-8');
      fullBookMarkdown.push(chapterMarkdown);
    }

    // Write full book file & structured sections JSON
    const fullBookPath = path.join(bookDir, `${book.id}_full.md`);
    await writeFile(fullBookPath, fullBookMarkdown.join('\n---\n\n'), 'utf-8');

    const sectionsJsonPath = path.join(bookDir, `${book.id}_sections.json`);
    await writeFile(sectionsJsonPath, JSON.stringify(structuredSections, null, 2), 'utf-8');

    extractionSummary.push({
      book: book.title,
      chapters: book.chapters.length,
      sections: totalSections,
      characters: totalChars,
      words: totalWords,
      outputDir: bookDir
    });
  }

  console.log('\n📊 Extraction Summary:');
  for (const s of extractionSummary) {
    console.log(`\n📘 ${s.book}`);
    console.log(`   - Chapters: ${s.chapters}`);
    console.log(`   - Sections/Pages: ${s.sections}`);
    console.log(`   - Words: ${s.words.toLocaleString()}`);
    console.log(`   - Characters: ${s.characters.toLocaleString()}`);
    console.log(`   - Saved to: ${s.outputDir}`);
  }

  return extractionSummary;
}

// Run if called directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('tools/extract_ddb_journals.mjs')) {
  extractDDBJournals().catch((err) => {
    console.error('Extraction failed:', err);
    process.exit(1);
  });
}
