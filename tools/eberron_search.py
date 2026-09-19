#!/usr/bin/env python3
"""
Eberron Offline Source Indexer & Citation Engine
Searches and extracts text from your personal, DRM-free Eberron PDFs and extracted DDB Foundry journals.
Matches citation standards required in ThirdPartyContentUsage.md.
"""

import os
import sys
import re
import json
import sqlite3
import argparse
import subprocess
from pathlib import Path

DEFAULT_SOURCES_DIR = Path("_sources/dmsguild")
DEFAULT_JOURNALS_DIR = Path("_sources/foundry_extracted/ddb_journals")
DEFAULT_DB_PATH = Path(".sources_index.db")

KNOWN_METADATA = {
    "exploring_eberron_5_5e": {
        "title": "Exploring Eberron (5.5e Update)",
        "author": "Keith Baker",
        "url": "https://www.dmsguild.com/product/315808/Exploring-Eberron"
    },
    "exploring_eberron": {
        "title": "Exploring Eberron",
        "author": "Keith Baker",
        "url": "https://www.dmsguild.com/product/315808/Exploring-Eberron"
    },
    "frontiers_of_eberron_quickstone": {
        "title": "Frontiers of Eberron: Quickstone",
        "author": "Keith Baker",
        "url": "https://www.dmsguild.com/product/468819/Frontiers-of-Eberron-Quickstone"
    },
    "chronicles_of_eberron": {
        "title": "Chronicles of Eberron",
        "author": "Keith Baker",
        "url": "https://www.dmsguild.com/product/415474/Chronicles-of-Eberron"
    },
    "eberronicon": {
        "title": "Eberronicon: A Pocket Guide to the World",
        "author": "Across Eberron",
        "url": "https://www.dmsguild.com/product/297249/Eberronicon-A-Pocket-Guide-to-the-World"
    },
    "psion-s-primer": {
        "title": "The Korranberg Chronicle: Psion's Primer",
        "author": "Anthony J. Turco",
        "url": "https://www.dmsguild.com/product/299141/The-Korranberg-Chronicle-Psions-Primer--A-Complete-Psionics-System"
    },
    "adventurers_almanac": {
        "title": "The Korranberg Chronicle: Adventurers Almanac",
        "author": "Anthony J. Turco",
        "url": "https://www.dmsguild.com/product/262406/The-Korranberg-Chronicle-Adventurers-Almanac"
    },
    "threat_dispatch": {
        "title": "The Korranberg Chronicle: Threat Dispatch",
        "author": "Anthony J. Turco",
        "url": "https://www.dmsguild.com/product/287315/The-Korranberg-Chronicle-Threat-Dispatch"
    },
    "hektula": {
        "title": "Hektula's Khyber Codex",
        "author": "KB Presents",
        "url": "https://www.dmsguild.com/product/428276/Hektulas-Khyber-Codex"
    },
    "morgrave_miscellany": {
        "title": "Morgrave Miscellany",
        "author": "Keith Baker & Ruty Rutenberg",
        "url": "https://www.dmsguild.com/product/270012/Morgrave-Miscellany"
    }
}

def resolve_book_metadata(filename: str):
    clean_name = filename.lower()
    for key, meta in KNOWN_METADATA.items():
        if key in clean_name:
            return meta["title"], meta["author"], meta["url"]
    
    # Clean filename fallback
    stem = Path(filename).stem
    stem = re.sub(r'^\d+[-_]?', '', stem)
    stem = re.sub(r'[_-]+', ' ', stem).strip()
    return stem, "Unknown Author", "https://www.dmsguild.com/"

def init_db(db_path: Path):
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE,
            filepath TEXT,
            title TEXT,
            author TEXT,
            url TEXT,
            num_pages INTEGER,
            file_mtime REAL,
            file_size INTEGER,
            indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5 (
            book_id UNINDEXED,
            page_num UNINDEXED,
            text,
            tokenize='porter unicode61'
        )
    """)
    con.commit()
    return con

def get_pdftotext():
    pdftotext = "/opt/homebrew/bin/pdftotext"
    if os.path.exists(pdftotext):
        return pdftotext
    import shutil
    res = shutil.which("pdftotext")
    if res:
        return res
    raise RuntimeError("pdftotext utility not found. Please install poppler via 'brew install poppler'.")

def index_books(sources_dir: Path, db_path: Path, priority_only: bool = False, force: bool = False):
    if not sources_dir.exists():
        print(f"Error: Sources directory '{sources_dir}' does not exist.")
        sys.exit(1)

    pdftotext = get_pdftotext()
    con = init_db(db_path)
    cur = con.cursor()

    pdf_files = []
    for root, _, files in os.walk(sources_dir):
        for f in files:
            if f.lower().endswith(".pdf"):
                full_path = Path(root) / f
                pdf_files.append(full_path)

    def priority_score(p: Path):
        name = p.name.lower()
        if "exploring_eberron" in name and "5_5" in name:
            return 0
        if "quickstone" in name or "frontiers_of_eberron" in name:
            return 1
        if "chronicles_of_eberron" in name:
            return 2
        if "exploring_eberron" in name:
            return 3
        if "eberronicon" in name:
            return 4
        if "korranberg" in name or "psion" in name:
            return 5
        if "hektula" in name:
            return 6
        return 100

    pdf_files.sort(key=priority_score)

    if priority_only:
        pdf_files = [p for p in pdf_files if priority_score(p) < 100]

    print(f"Discovered {len(pdf_files)} PDF(s) to check/index.")

    indexed_count = 0
    skipped_count = 0

    for i, pdf_path in enumerate(pdf_files, 1):
        rel_filename = pdf_path.name
        mtime = os.path.getmtime(pdf_path)
        size = os.path.getsize(pdf_path)

        cur.execute("SELECT id, file_mtime, file_size FROM books WHERE filename = ?", (rel_filename,))
        row = cur.fetchone()
        if row and not force:
            existing_id, existing_mtime, existing_size = row
            if existing_mtime == mtime and existing_size == size:
                skipped_count += 1
                continue
            else:
                cur.execute("DELETE FROM pages_fts WHERE book_id = ?", (existing_id,))
                cur.execute("DELETE FROM books WHERE id = ?", (existing_id,))
                con.commit()

        print(f"[{i}/{len(pdf_files)}] Indexing: {rel_filename} ({size / (1024*1024):.1f} MB)...", end="", flush=True)

        try:
            res = subprocess.run([pdftotext, str(pdf_path), "-"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
            if res.returncode != 0:
                print(" FAILED (pdftotext error)")
                continue

            raw_pages = res.stdout.split("\x0c")
            if raw_pages and not raw_pages[-1].strip():
                raw_pages.pop()

            title, author, url = resolve_book_metadata(rel_filename)
            cur.execute("""
                INSERT INTO books (filename, filepath, title, author, url, num_pages, file_mtime, file_size)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (rel_filename, str(pdf_path.resolve()), title, author, url, len(raw_pages), mtime, size))
            book_id = cur.lastrowid

            pages_data = []
            for page_num, page_content in enumerate(raw_pages, 1):
                clean_text = page_content.strip()
                if clean_text:
                    pages_data.append((book_id, page_num, clean_text))

            cur.executemany("INSERT INTO pages_fts (book_id, page_num, text) VALUES (?, ?, ?)", pages_data)
            con.commit()
            print(f" Done ({len(raw_pages)} pages)")
            indexed_count += 1

        except subprocess.TimeoutExpired:
            print(" TIMEOUT")
        except Exception as e:
            print(f" ERROR: {e}")

    print(f"\nPDF Indexing finished: {indexed_count} indexed, {skipped_count} up-to-date.")

def index_ddb_journals(journals_dir: Path, db_path: Path, force: bool = False):
    con = init_db(db_path)
    cur = con.cursor()

    manifest_configs = [
        {
            "id": "exploring_eberron_5_5e",
            "json_file": journals_dir / "exploring_eberron_5_5e" / "exploring_eberron_5_5e_sections.json",
            "filename": "Exploring_Eberron_5_5e_DDB.json",
            "title": "Exploring Eberron (5.5e D&D Beyond)",
            "author": "Keith Baker",
            "url": "https://www.dmsguild.com/product/315808/Exploring-Eberron",
            "extract_script": "tools/extract_ddb_journals.mjs"
        },
        {
            "id": "frontiers_of_eberron_quickstone",
            "json_file": journals_dir / "frontiers_of_eberron_quickstone" / "frontiers_of_eberron_quickstone_sections.json",
            "filename": "Frontiers_of_Eberron_Quickstone_DDB.json",
            "title": "Frontiers of Eberron: Quickstone (D&D Beyond)",
            "author": "Keith Baker",
            "url": "https://www.dmsguild.com/product/468819/Frontiers-of-Eberron-Quickstone",
            "extract_script": "tools/extract_ddb_journals.mjs"
        },
        {
            "id": "forge_of_the_artificer",
            "json_file": journals_dir.parent / "forge_of_the_artificer" / "forge_of_the_artificer_sections.json",
            "filename": "Eberron_Forge_of_the_Artificer.json",
            "title": "Eberron: Forge of the Artificer",
            "author": "Andrew Clayton, Kim Mantas, et al.",
            "url": "https://foundryvtt.com/packages/dnd-forge-artificer",
            "extract_script": "tools/extract_forge_artificer.mjs"
        }
    ]

    for conf in manifest_configs:
        json_file = conf["json_file"]
        if not json_file.exists() and "extract_script" in conf:
            script_path = Path(conf["extract_script"])
            if script_path.exists():
                print(f"Extracting {conf['title']} from Foundry...")
                subprocess.run(["node", str(script_path)], check=True)

    for conf in manifest_configs:
        json_file = conf["json_file"]
        if not json_file.exists():
            print(f"Skipping {conf['title']} (File not found: {json_file})")
            continue

        file_stat = json_file.stat()
        file_mtime = file_stat.st_mtime
        file_size = file_stat.st_size

        cur.execute("SELECT id, file_mtime FROM books WHERE filename = ?", (conf["filename"],))
        row = cur.fetchone()

        if row and not force:
            old_id, old_mtime = row
            if old_mtime == file_mtime:
                print(f"Skipping {conf['title']} (already up-to-date)")
                continue
            else:
                cur.execute("DELETE FROM pages_fts WHERE book_id = ?", (old_id,))
                cur.execute("DELETE FROM books WHERE id = ?", (old_id,))
                con.commit()
        elif row and force:
            cur.execute("DELETE FROM pages_fts WHERE book_id = ?", (row[0],))
            cur.execute("DELETE FROM books WHERE id = ?", (row[0],))
            con.commit()

        with open(json_file, "r", encoding="utf-8") as f:
            sections = json.load(f)

        print(f"Indexing '{conf['title']}' ({len(sections)} sections)...", end="", flush=True)

        cur.execute("""
            INSERT INTO books (filename, filepath, title, author, url, num_pages, file_mtime, file_size)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (conf["filename"], str(json_file), conf["title"], conf["author"], conf["url"], len(sections), file_mtime, file_size))

        book_id = cur.lastrowid

        pages_data = []
        for s in sections:
            sec_name = s.get("sectionName", "").strip()
            ch_name = s.get("chapterName", "").strip()
            if sec_name and sec_name != ch_name:
                page_ref = f"{ch_name} - {sec_name}"
            else:
                page_ref = ch_name

            raw_text = s.get("text", "").strip()
            if raw_text:
                full_text = f"Section: {page_ref}\n\n{raw_text}"
                pages_data.append((book_id, page_ref, full_text))

        cur.executemany("INSERT INTO pages_fts (book_id, page_num, text) VALUES (?, ?, ?)", pages_data)
        con.commit()
        print(f" Done ({len(pages_data)} sections indexed)")

def search_index(db_path: Path, query: str, book_filter: str = None, limit: int = 8):
    if not db_path.exists():
        print(f"Index database '{db_path}' not found. Please run 'python3 tools/eberron_search.py index' first.")
        sys.exit(1)

    con = sqlite3.connect(db_path)
    cur = con.cursor()

    sql = """
        SELECT 
            b.title, 
            b.author, 
            b.url, 
            b.filename, 
            p.page_num, 
            snippet(pages_fts, 2, '>>>', '<<<', '...', 25) AS match_snippet,
            bm25(pages_fts) AS rank
        FROM pages_fts p
        JOIN books b ON p.book_id = b.id
        WHERE pages_fts MATCH ?
    """
    params = [query]

    if book_filter:
        sql += " AND (b.title LIKE ? OR b.filename LIKE ?)"
        params.extend([f"%{book_filter}%", f"%{book_filter}%"])

    sql += " ORDER BY rank LIMIT ?"
    params.append(limit)

    cur.execute(sql, params)
    results = cur.fetchall()

    if not results:
        print(f"No results found for query: '{query}'")
        return

    print(f"\nFound {len(results)} match(es) for '{query}':\n" + "=" * 70)
    for r in results:
        title, author, url, filename, page_num, snippet, rank = r
        clean_snippet = snippet.replace("\n", " ").strip()

        if str(page_num).startswith("Chapter") or " - " in str(page_num) or not str(page_num).isdigit():
            page_cite = f"Section: {page_num}"
        else:
            page_cite = f"p. {page_num}"

        url_label = "Foundry VTT" if "foundryvtt.com" in url else "DMs Guild" if "dmsguild.com" in url else "Reference"
        print(f"\n📖 Book: {title}")
        print(f"📄 Location: {page_num}  |  File: {filename}")
        print(f"📝 Snippet: {clean_snippet}")
        print(f"🏷️ Citation: **Reference:** *{title}* ({page_cite}), by {author} ([{url_label}]({url}))")
        print("-" * 70)

def read_page(db_path: Path, book_pattern: str, page_target: str, count: int = 1):
    if not db_path.exists():
        print(f"Index database '{db_path}' not found.")
        sys.exit(1)

    con = sqlite3.connect(db_path)
    cur = con.cursor()

    cur.execute("SELECT id, title, filename, num_pages FROM books WHERE filename LIKE ? OR title LIKE ? LIMIT 1", 
                (f"%{book_pattern}%", f"%{book_pattern}%"))
    book = cur.fetchone()
    if not book:
        print(f"No book found matching '{book_pattern}'.")
        return

    book_id, title, filename, num_pages = book

    # Check if target is integer or text
    if str(page_target).isdigit():
        target_num = int(page_target)
        if filename.endswith(".json"):
            # Journal section by 1-based index
            offset = max(0, target_num - 1)
            cur.execute("""
                SELECT page_num, text FROM pages_fts 
                WHERE book_id = ?
                LIMIT ? OFFSET ?
            """, (book_id, count, offset))
        else:
            # PDF page numbers
            end_page = min(target_num + count - 1, num_pages)
            cur.execute("""
                SELECT page_num, text FROM pages_fts 
                WHERE book_id = ? AND CAST(page_num AS INTEGER) >= ? AND CAST(page_num AS INTEGER) <= ?
                ORDER BY CAST(page_num AS INTEGER) ASC
            """, (book_id, target_num, end_page))
    else:
        # String match on section title
        cur.execute("""
            SELECT page_num, text FROM pages_fts 
            WHERE book_id = ? AND page_num LIKE ?
            LIMIT ?
        """, (book_id, f"%{page_target}%", count))

    pages = cur.fetchall()
    if not pages:
        print(f"No section or page found matching '{page_target}' in {title}.")
        return

    print(f"\nReading {title} ({len(pages)} section(s)):\n" + "=" * 70)
    for p_num, text in pages:
        print(f"\n--- [LOCATION: {p_num}] ---")
        print(text[:3000] + ("\n... [truncated]" if len(text) > 3000 else ""))

def list_books(db_path: Path):
    if not db_path.exists():
        print(f"Index database '{db_path}' not found.")
        sys.exit(1)

    con = sqlite3.connect(db_path)
    cur = con.cursor()
    cur.execute("SELECT id, title, filename, num_pages, author FROM books ORDER BY title ASC")
    books = cur.fetchall()

    print(f"\nIndexed Books ({len(books)} total):\n" + "=" * 70)
    for b_id, title, filename, pages, author in books:
        print(f"#{b_id:02d}: {title} ({pages} pages/sections) | Author: {author} [{filename}]")

def main():
    parser = argparse.ArgumentParser(description="Eberron Source Search & Citation Tool")
    parser.add_argument("--sources", type=Path, default=DEFAULT_SOURCES_DIR, help="Path to sources PDF directory")
    parser.add_argument("--journals-dir", type=Path, default=DEFAULT_JOURNALS_DIR, help="Path to extracted DDB journals directory")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH, help="Path to SQLite index database")

    subparsers = parser.add_subparsers(dest="command", required=True)

    # index
    index_parser = subparsers.add_parser("index", help="Index PDF files into SQLite FTS")
    index_parser.add_argument("--priority-only", action="store_true", help="Index only Keith Baker core books and primary titles first")
    index_parser.add_argument("--force", action="store_true", help="Re-index all files even if unchanged")

    # index-journals
    journal_parser = subparsers.add_parser("index-journals", help="Index extracted DDB Foundry journals into SQLite FTS")
    journal_parser.add_argument("--force", action="store_true", help="Re-index journals even if already indexed")

    # search
    search_parser = subparsers.add_parser("search", help="Search the index for a keyword or phrase")
    search_parser.add_argument("query", type=str, help="Search query (supports FTS5 syntax)")
    search_parser.add_argument("--book", type=str, help="Filter by book title or filename")
    search_parser.add_argument("--limit", type=int, default=6, help="Maximum number of results to display")

    # read
    read_parser = subparsers.add_parser("read", help="Read exact text from a specific page or section")
    read_parser.add_argument("book", type=str, help="Book title or filename substring")
    read_parser.add_argument("page", type=str, help="Page number or section name to read")
    read_parser.add_argument("--count", type=int, default=1, help="Number of consecutive pages/sections to read")

    # list
    subparsers.add_parser("list", help="List all indexed books and page counts")

    args = parser.parse_args()

    if args.command == "index":
        index_books(args.sources, args.db, priority_only=args.priority_only, force=args.force)
        index_ddb_journals(args.journals_dir, args.db, force=args.force)
    elif args.command == "index-journals":
        index_ddb_journals(args.journals_dir, args.db, force=args.force)
    elif args.command == "search":
        search_index(args.db, args.query, book_filter=args.book, limit=args.limit)
    elif args.command == "read":
        read_page(args.db, args.book, args.page, count=args.count)
    elif args.command == "list":
        list_books(args.db)

if __name__ == "__main__":
    main()
