#!/usr/bin/env node

/**
 * Asset downloader — fetches all block and item textures from minecraft.wiki
 * and stores them in packages/client/public/textures/{blocks,items}/.
 *
 * Uses the wiki API to resolve the current filename for each asset, then
 * downloads the resolved file or tries fallback filenames.
 *
 * Usage:
 *   node tools/download-assets.mjs              # normal download
 *   node tools/download-assets.mjs --check       # only check missing
 *   node tools/download-assets.mjs --force       # re-download all
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'packages', 'client', 'public');
const BLOCK_DIR = join(PUBLIC, 'textures', 'blocks');
const ITEM_DIR = join(PUBLIC, 'textures', 'items');
const LOG_FILE = join(ROOT, 'tools', 'download-log.json');

const WIKI_BASE = 'https://minecraft.wiki/images/';
const API_BASE = 'https://minecraft.wiki/api.php';
const MAX_CONCURRENT = 8;
const TIMEOUT_MS = 15000;

// ---------- Texture filename registry ----------

function parseBlockTextureUrls() {
  const path = join(ROOT, 'packages', 'shared', 'src', 'textureUrls.ts');
  const src = readFileSync(path, 'utf-8');
  const urls = [];
  const pngRegex = /[']([^']+\.png)[']/g;
  let match;
  while ((match = pngRegex.exec(src)) !== null) {
    urls.push({ filename: match[1], url: WIKI_BASE + match[1], type: 'block' });
  }
  return urls;
}

function parseItemTextureUrls() {
  const path = join(ROOT, 'packages', 'shared', 'src', 'items.ts');
  const src = readFileSync(path, 'utf-8');
  const urls = [];

  // Parse ITEM_TEXTURE_FILE overrides: [ITEM.XXX]: 'filename.png'
  const overrideRegex = /\[(ITEM\.\w+)\]:\s*['"]([^'"]+\.png)['"]/g;
  const overrides = new Map();
  let m;
  while ((m = overrideRegex.exec(src)) !== null) {
    const itemKey = m[1];
    const filename = m[2];
    overrides.set(itemKey, filename);
    urls.push({ filename, url: WIKI_BASE + filename, type: 'item' });
  }

  const overrideKeys = new Set(overrides.keys());
  const overrideFnames = new Set(overrides.values());

  // Parse item entries: [ITEM.XXX]: { ... displayName: '...' }
  const itemEntryRegex = /\[(ITEM\.\w+)\]:\s*\{[^}]*displayName:\s*['"]([^'"]+)['"]/g;
  while ((m = itemEntryRegex.exec(src)) !== null) {
    const itemKey = m[1];
    const displayName = m[2];
    if (overrideKeys.has(itemKey)) continue;
    const name = displayName.replace(/ /g, '_');
    const filename = `Invicon_${name}.png`;
    if (!overrideFnames.has(filename)) {
      urls.push({ filename, url: WIKI_BASE + filename, type: 'item' });
    }
  }

  return urls;
}

// ---------- Wiki API filename resolution ----------

/**
 * Strip version suffix from a texture filename.
 *   "Oak_Planks_(texture)_JE6_BE3.png"  -> "Oak_Planks_(texture)"
 *   "Acacia_Fence_(texture)_JE5_BE3.png" -> "Acacia_Fence_(texture)"
 *   "Anvil_(texture)_JE5_BE2.png"       -> "Anvil_(texture)"
 */
function stripVersion(filename) {
  return filename
    .replace(/\.png$/, '')
    .replace(/_(JE\d+)(_BE\d+)?$/, '')
    .replace(/_(BE\d+)$/, '');
}

/**
 * Use the wiki API to get the actual file URL for a given page title.
 * Returns the full resolved URL or null.
 */
async function wikiApiFileUrl(pageTitle) {
  const url = `${API_BASE}?action=query&titles=File:${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=url&format=json`;
  try {
    const resp = await fetchWithTimeout(url, TIMEOUT_MS);
    if (!resp.ok) return null;
    const data = await resp.json();
    const pages = data.query.pages;
    const keys = Object.keys(pages);
    if (keys.length === 0) return null;
    const page = pages[keys[0]];
    if (page.missing !== undefined || !page.imageinfo) return null;
    return page.imageinfo[0].url.split('?')[0];
  } catch {
    return null;
  }
}

/**
 * Try to find a face texture via allimages prefix search.
 * Many face textures exist on the wiki filesystem without a File: page.
 */
async function searchImagesByPrefix(prefix) {
  const url = `${API_BASE}?action=query&list=allimages&aiprefix=${encodeURIComponent(prefix)}&ailimit=5&format=json`;
  try {
    const resp = await fetchWithTimeout(url, TIMEOUT_MS);
    if (!resp.ok) return null;
    const data = await resp.json();
    const images = data.query.allimages;
    if (!images || images.length === 0) return null;
    // Prefer files that contain "JE" (versioned, most likely correct)
    const ranked = images.sort((a, b) => {
      const aScore = a.name.includes('_JE') ? 2 : a.name.includes('texture') ? 1 : 0;
      const bScore = b.name.includes('_JE') ? 2 : b.name.includes('texture') ? 1 : 0;
      return bScore - aScore;
    });
    return ranked[0].url.split('?')[0];
  } catch {
    return null;
  }
}

/**
 * Resolve a filename to a downloadable wiki URL using multiple strategies.
 */
async function resolveTextureUrl(filename) {
  // Strategy 1: Try the exact filename directly
  const exactUrl = WIKI_BASE + filename;
  const exactBuf = await tryDownload(exactUrl);
  if (exactBuf) return exactUrl;

  const isDirFace = filename.includes('_(top_') || filename.includes('_(side_') || filename.includes('_(bottom_') || filename.includes('_(front_');
  const base = stripVersion(filename);

  // Strategy 2: Try API with the version-stripped name (spaces → underscores OK)
  const resolvedStripped = await wikiApiFileUrl(base + '.png');
  if (resolvedStripped) return resolvedStripped;

  // Strategy 3: For `_(texture)` face textures, try with the base name (remove `_(texture)`)
  if (base.endsWith('_(texture)')) {
    const noSuffix = base.replace(/_(texture)$/, '');
    const resolvedNoSuffix = await wikiApiFileUrl(noSuffix + '.png');
    if (resolvedNoSuffix) return resolvedNoSuffix;
  }

  // Strategy 4: For face textures (top, side, etc.), search by prefix
  if (isDirFace || base.includes('_(texture)')) {
    // Strip parenthesized face descriptor to get the raw block name for search
    const searchPrefix = base.replace(/_(?=\().*$/, '');
    const searched = await searchImagesByPrefix(searchPrefix);
    if (searched) return searched;
  }

  return null;
}

// ---------- Download ----------

async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return resp;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Try to download a PNG from a URL. Validates it's a real PNG.
 */
async function tryDownload(url) {
  try {
    const resp = await fetchWithTimeout(url, TIMEOUT_MS);
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 100) return null;
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) return null;
    return buf;
  } catch {
    return null;
  }
}

async function downloadFile(entry, dest, force) {
  if (!force && existsSync(dest)) {
    return { status: 'skipped', reason: 'exists' };
  }

  mkdirSync(dirname(dest), { recursive: true });

  const filename = entry.filename;
  const url = entry.url;

  // Strategy 1: Try resolving via wiki API (handles version bumps, redirects)
  if (entry.type === 'block') {
    const resolvedUrl = await resolveTextureUrl(filename);
    if (resolvedUrl) {
      const buf = await tryDownload(resolvedUrl);
      if (buf) {
        writeFileSync(dest, buf);
        const actualFile = basename(resolvedUrl);
        if (actualFile !== filename) {
          return { status: 'downloaded', size: buf.length, note: `api: ${actualFile}` };
        }
        return { status: 'downloaded', size: buf.length };
      }
    }
  }

  // Strategy 2: Try the exact URL from the source file
  const buf = await tryDownload(url);
  if (buf) {
    writeFileSync(dest, buf);
    return { status: 'downloaded', size: buf.length };
  }

  return { status: 'failed', reason: 'all attempts 404' };
}

/**
 * Generate alternate filenames with different version suffixes.
 */
function* alternateFilenames(filename) {
  yield filename;
  const versionMatch = filename.match(/^(.+?)(?:_(?:JE\d+)(?:_BE\d+)?)(\.png)$/);
  if (versionMatch) {
    const base = versionMatch[1];
    const ext = versionMatch[2];
    yield `${base}${ext}`;
    for (const v of ['JE1', 'JE2', 'JE3', 'JE4', 'JE5', 'JE6', 'JE7', 'JE8', 'JE9']) {
      yield `${base}_${v}${ext}`;
      yield `${base}_${v}_BE1${ext}`;
      yield `${base}_${v}_BE2${ext}`;
      yield `${base}_${v}_BE3${ext}`;
    }
  }
  const justJeMatch = filename.match(/^(.+?)_JE(\d+)(\.png)$/);
  if (justJeMatch && !justJeMatch[1].includes('_BE')) {
    const base = justJeMatch[1];
    const ext = justJeMatch[3];
    const currentJe = parseInt(justJeMatch[2]);
    for (let v = Math.max(1, currentJe - 2); v <= currentJe + 6; v++) {
      if (v !== currentJe) {
        yield `${base}_JE${v}${ext}`;
        yield `${base}_JE${v}_BE1${ext}`;
        yield `${base}_JE${v}_BE2${ext}`;
        yield `${base}_JE${v}_BE3${ext}`;
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const force = args.includes('--force');

  console.log(`🔍 Parsing textureUrl.ts...`);
  const blockUrls = parseBlockTextureUrls();
  console.log(`   Found ${blockUrls.length} block texture URLs`);

  console.log(`🔍 Parsing items.ts...`);
  const itemUrls = parseItemTextureUrls();
  console.log(`   Found ${itemUrls.length} item texture URLs`);

  // Load existing log for resume info
  let log = {};
  if (existsSync(LOG_FILE)) {
    try { log = JSON.parse(readFileSync(LOG_FILE, 'utf-8')); } catch {}
  }

  const allUrls = [...blockUrls, ...itemUrls];
  // Deduplicate by filename
  const seen = new Map();
  for (const entry of allUrls) {
    if (!seen.has(entry.filename)) seen.set(entry.filename, entry);
  }
  const uniqueUrls = [...seen.values()];

  console.log(`\n📦 Total unique textures to process: ${uniqueUrls.length}`);
  console.log(`   Block dir: ${BLOCK_DIR}`);
  console.log(`   Item dir:  ${ITEM_DIR}\n`);

  if (checkOnly) {
    let missing = 0;
    for (const entry of uniqueUrls) {
      const dest = join(entry.type === 'block' ? BLOCK_DIR : ITEM_DIR, entry.filename);
      if (!existsSync(dest)) {
        console.log(`   MISSING: ${entry.filename}`);
        missing++;
      }
    }
    console.log(`\n${missing} files missing out of ${uniqueUrls.length}`);
    return;
  }

  // Process in batches
  const results = { downloaded: 0, skipped: 0, failed: 0, total: uniqueUrls.length };
  const failedFiles = [];

  for (let i = 0; i < uniqueUrls.length; i += MAX_CONCURRENT) {
    const batch = uniqueUrls.slice(i, i + MAX_CONCURRENT);
    const promises = batch.map(async (entry) => {
      const dest = join(entry.type === 'block' ? BLOCK_DIR : ITEM_DIR, entry.filename);
      const result = await downloadFile(entry, dest, force);
      return { entry, result };
    });

    const batchResults = await Promise.all(promises);
    for (const { entry, result } of batchResults) {
      if (result.status === 'downloaded') {
        results.downloaded++;
        if (results.downloaded % 50 === 0) {
          console.log(`   Progress: ${results.downloaded} downloaded, ${results.failed} failed, ${results.skipped} skipped`);
        }
      } else if (result.status === 'skipped') {
        results.skipped++;
      } else {
        results.failed++;
        failedFiles.push({ filename: entry.filename, url: entry.url, reason: result.reason });
      }
      log[entry.filename] = { status: result.status, time: Date.now() };
    }
  }

  // Save log
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   Downloaded: ${results.downloaded}`);
  console.log(`   Skipped:    ${results.skipped}`);
  console.log(`   Failed:     ${results.failed}`);
  console.log(`   Total:      ${results.total}`);

  if (failedFiles.length > 0) {
    console.log(`\n⚠️  Failed downloads:`);
    for (const f of failedFiles.slice(0, 20)) {
      console.log(`   ${f.filename} — ${f.reason}`);
    }
    if (failedFiles.length > 20) {
      console.log(`   ... and ${failedFiles.length - 20} more`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
