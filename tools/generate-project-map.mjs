#!/usr/bin/env node
/**
 * MineCraft Project Knowledge Graph Generator
 *
 * Pattern from GutConference & bapXphpAiBackend:
 *   1. registry() — source of truth for what the project contains
 *   2. scan() — discover actual files, compare to registry, find gaps
 *   3. renderMermaid() — generate the flowchart
 *   4. CLI wrapper — call scan, render, write output
 *
 * Usage: node tools/generate-project-map.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'docs', 'systematic-map.mmd');

function md5(s) {
  return createHash('md5').update(s).digest('hex').slice(0, 12);
}

// ── 1. REGISTRY ─────────────────────────────────────────────────────
// The source of truth for what the project contains.
// Like PHP projects' registry(): manually curated, then verified by scan().

function registry() {
  return {
    workspaces: [
      { id: 'shared', path: 'packages/shared', label: '@sg100/shared', role: 'Protocol, config, registry' },
      { id: 'client', path: 'packages/client', label: '@sg100/client', role: 'Vite + three.js browser client' },
      { id: 'server', path: 'packages/server', label: '@sg100/server', role: 'Fastify + WebSocket server' },
      { id: 'docker',  path: 'packages/docker',  label: 'Docker',          role: 'Container & proxy assets' },
    ],
    modules: [
      { file: 'packages/shared/src/index.ts',        workspace: 'shared', exports: ['blocks','blockRegistry','config','rng','protocol','textureUrls'] },
      { file: 'packages/shared/src/blocks.ts',       workspace: 'shared', exports: ['BLOCK','VANILLA_BLOCK_IDS','BLOCK_COLORS','BLOCK_TEXTURES','BLOCK_HARDNESS','BLOCK_LUMINANCE','BLOCK_TRANSPARENT','BLOCK_REQUIRES_TOOL','BLOCK_LAYER'] },
      { file: 'packages/shared/src/blockRegistry.ts', workspace: 'shared', exports: ['BlockRegistry','blockRegistry','BlockModel','BlockState','BlockInfo'] },
      { file: 'packages/shared/src/config.ts',       workspace: 'shared', exports: ['PROJECT_NAME','PROTOCOL_VERSION','MAX_PLAYERS_PER_ROOM','SERVER_TICK_HZ','CHUNK_SIZE','WORLD_HEIGHT','DEFAULT_PORTS'] },
      { file: 'packages/shared/src/protocol.ts',     workspace: 'shared', exports: ['HelloMessageSchema','PingMessageSchema','ClientMessageSchema','WelcomeMessageSchema','PongMessageSchema','ErrorMessageSchema','ServerMessageSchema','msg','parseClientMessage','parseServerMessage'] },
      { file: 'packages/shared/src/rng.ts',          workspace: 'shared', exports: ['createRng','hashSeed'] },
      { file: 'packages/shared/src/textureUrls.ts',  workspace: 'shared', exports: ['getTextureUrl'] },
      { file: 'packages/client/src/main.ts',         workspace: 'client', exports: [] },
      { file: 'packages/client/src/scene.ts',        workspace: 'client', exports: ['createScene'] },
      { file: 'packages/client/src/net.ts',          workspace: 'client', exports: ['connectToServer'] },
      { file: 'packages/server/src/index.ts',        workspace: 'server', exports: [] },
    ],
    npmPackages: ['three', 'zod', 'fastify', 'ws'],
    configs: [
      'package.json', 'tsconfig.base.json', 'eslint.config.js',
      '.prettierrc.json', '.prettierignore', '.gitignore',
      'packages/client/package.json', 'packages/client/tsconfig.json',
      'packages/client/vite.config.ts',
      'packages/server/package.json', 'packages/server/tsconfig.json',
      'packages/shared/package.json', 'packages/shared/tsconfig.json',
    ],
    deploy: [
      'docker-compose.yml',
      'packages/docker/client.Dockerfile',
      'packages/docker/server.Dockerfile',
      'packages/docker/Caddyfile',
    ],
    dox: [
      'AGENTS.md', 'packages/AGENTS.md',
      'packages/client/AGENTS.md', 'packages/server/AGENTS.md',
      'packages/shared/AGENTS.md', 'packages/docker/AGENTS.md',
      '.github/AGENTS.md', '.harness/AGENTS.md',
    ],
    docs: [
      'README.md', 'docs/systematic-map.mmd',
    ],
    tests: [
      'test-game.spec.ts',
    ],
    harness: [
      '.harness/agent.md',
      '.harness/plans/stage0-smoke.yaml',
      '.harness/qa/smoke/stage0-smoke.mjs',
      '.harness/qa/smoke/protocol-probe.mjs',
      '.harness/qa/smoke/discovery.mjs',
      '.harness/qa/playability/playability.mjs',
      '.harness/reins/browser-qa/agent.md',
      '.harness/reins/game-fixer/agent.md',
      '.harness/reins/game-reviewer/agent.md',
      '.harness/reins/player-1/agent.md',
    ],
    issues: [
      '.issues/01-protocol-not-strict.md',
      '.issues/02-ping-t-no-sanity.md',
      '.issues/03-bad-message-not-disambiguated.md',
      '.issues/04-hello-not-idempotent.md',
      '.issues/05-client-onerror-conflates-protocol-and-transport.md',
      '.issues/06-rtt-uses-echoed-t.md',
      '.issues/README.md',
      '.issues/research-mcpi-revival.md',
    ],
    ci: [
      '.github/workflows/ci.yml',
      '.github/workflows/deploy.yml',
    ],
  };
}

// ── 2. SCAN ─────────────────────────────────────────────────────────
// Discover actual files, compare to registry, find gaps.

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function extractImports(filePath) {
  try {
    const src = readFileSync(filePath, 'utf8');
    const imports = [];
    for (const m of src.matchAll(/import\s+(?:{[^}]*}|[A-Za-z_$][A-Za-z0-9_$]*)\s+from\s+['"]([^'"]+)['"]/g)) {
      imports.push(m[1]);
    }
    for (const m of src.matchAll(/import\s+['"]([^'"]+)['"]/g)) {
      imports.push(m[1]);
    }
    return imports;
  } catch { return []; }
}

function extractExports(filePath) {
  try {
    const src = readFileSync(filePath, 'utf8');
    const exports = [];
    for (const m of src.matchAll(/export\s+(?:const|let|var|function|class|interface|type|enum|async\s+function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g)) {
      exports.push(m[1]);
    }
    return exports;
  } catch { return []; }
}

function resolveImport(fromFile, imp, allFiles) {
  if (imp.startsWith('@sg100/')) {
    return `packages/${imp.replace('@sg100/', '')}/src/index.ts`;
  }
  if (imp.startsWith('.')) {
    const dir = fromFile.replace(/\/[^/]+$/, '');
    for (const ext of ['', '.ts', '.js', '.mjs']) {
      const candidate = relative(ROOT, join(dir, imp + ext));
      if (allFiles.includes(candidate)) return candidate;
    }
  }
  return null;
}

function scan(reg) {
  const allFiles = walk(ROOT).map(f => relative(ROOT, f));
  const fileSet = new Set(allFiles);

  // Import graph from .ts files
  const importEdges = [];
  const npmUsage = new Map();
  for (const mod of reg.modules) {
    if (!fileSet.has(mod.file)) continue;
    const imports = extractImports(join(ROOT, mod.file));
    for (const imp of imports) {
      if (!imp.startsWith('.') && !imp.startsWith('@sg100/')) {
        if (!npmUsage.has(imp)) npmUsage.set(imp, []);
        npmUsage.get(imp).push(mod.file);
        importEdges.push({ from: mod.file, to: `npm:${imp}`, type: 'npm' });
        continue;
      }
      const target = resolveImport(mod.file, imp, allFiles);
      if (target && fileSet.has(target)) {
        importEdges.push({ from: mod.file, to: target, type: 'import' });
      }
    }
  }

  // Workspace dependency edges
  const workspaceEdges = [
    { from: 'packages/client/package.json', to: 'packages/shared/package.json', type: 'workspace-dep' },
    { from: 'packages/server/package.json', to: 'packages/shared/package.json', type: 'workspace-dep' },
  ];

  // DOX ownership edges
  const doxEdges = [
    { from: 'AGENTS.md', to: 'packages/AGENTS.md', type: 'dox-parent' },
    { from: 'packages/AGENTS.md', to: 'packages/client/AGENTS.md', type: 'dox-parent' },
    { from: 'packages/AGENTS.md', to: 'packages/server/AGENTS.md', type: 'dox-parent' },
    { from: 'packages/AGENTS.md', to: 'packages/shared/AGENTS.md', type: 'dox-parent' },
    { from: 'packages/AGENTS.md', to: 'packages/docker/AGENTS.md', type: 'dox-parent' },
    { from: 'AGENTS.md', to: '.github/AGENTS.md', type: 'dox-parent' },
    { from: 'AGENTS.md', to: '.harness/AGENTS.md', type: 'dox-parent' },
  ];

  // Deploy reference edges
  const deployEdges = [
    { from: 'docker-compose.yml', to: 'packages/docker/client.Dockerfile', type: 'deploy-ref' },
    { from: 'docker-compose.yml', to: 'packages/docker/server.Dockerfile', type: 'deploy-ref' },
    { from: 'docker-compose.yml', to: 'packages/docker/Caddyfile', type: 'deploy-ref' },
  ];

  // Config reference edges
  const configEdges = [
    { from: 'packages/client/tsconfig.json', to: 'tsconfig.base.json', type: 'config-ref' },
    { from: 'packages/server/tsconfig.json', to: 'tsconfig.base.json', type: 'config-ref' },
    { from: 'packages/shared/tsconfig.json', to: 'tsconfig.base.json', type: 'config-ref' },
    { from: 'packages/client/vite.config.ts', to: 'packages/client/src/main.ts', type: 'config-ref' },
  ];

  // Test target edges
  const testEdges = [
    { from: 'test-game.spec.ts', to: 'packages/client/index.html', type: 'test-target' },
  ];

  // Gaps
  const gaps = [];
  const missingModules = reg.modules.filter(m => !fileSet.has(m.file));
  for (const m of missingModules) {
    gaps.push({ severity: 'high', type: 'module_missing', detail: `${m.file} declared in registry but not on disk` });
  }
  const missingDox = reg.dox.filter(f => !fileSet.has(f));
  for (const f of missingDox) {
    gaps.push({ severity: 'medium', type: 'dox_missing', detail: `${f} declared in registry but not on disk` });
  }
  const missingCi = reg.ci.filter(f => !fileSet.has(f));
  for (const f of missingCi) {
    gaps.push({ severity: 'high', type: 'ci_missing', detail: `${f} declared in registry but not on disk` });
  }
  const missingDeploy = reg.deploy.filter(f => !fileSet.has(f));
  for (const f of missingDeploy) {
    gaps.push({ severity: 'high', type: 'deploy_missing', detail: `${f} declared in registry but not on disk` });
  }

  // Content-based gaps
  const serverFile = reg.modules.find(m => m.file === 'packages/server/src/index.ts');
  if (serverFile && fileSet.has(serverFile.file)) {
    const src = readFileSync(join(ROOT, serverFile.file), 'utf8');
    if (!src.includes('setInterval') && !src.includes('tick')) {
      gaps.push({ severity: 'high', type: 'no_game_loop', detail: 'server has no tick loop, no world state sync' });
    }
  }
  const sceneFile = reg.modules.find(m => m.file === 'packages/client/src/scene.ts');
  if (sceneFile && fileSet.has(sceneFile.file)) {
    const src = readFileSync(join(ROOT, sceneFile.file), 'utf8');
    if (!src.includes('Worker')) {
      gaps.push({ severity: 'medium', type: 'no_web_workers', detail: 'scene.ts runs on main thread, no greedy meshing worker' });
    }
  }

  return {
    allFiles,
    fileSet,
    importEdges,
    workspaceEdges,
    doxEdges,
    deployEdges,
    configEdges,
    testEdges,
    npmUsage,
    gaps,
    summary: {
      files: allFiles.length,
      modules: reg.modules.length,
      npm_packages: npmUsage.size,
      import_edges: importEdges.length,
      gap_count: gaps.length,
    },
  };
}

// ── 3. RENDER MERMAID ───────────────────────────────────────────────

function renderMermaid(reg, scanResult) {
  const L = [];

  L.push('flowchart LR');
  L.push('  classDef workspace fill:#e3f2fd,stroke:#1976d2,color:#0d47a1');
  L.push('  classDef module fill:#ecfdf5,stroke:#047857,color:#064e3b');
  L.push('  classDef config fill:#fef3c7,stroke:#b45309,color:#78350f');
  L.push('  classDef deploy fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d');
  L.push('  classDef dox fill:#e0f2fe,stroke:#0369a1,color:#0c4a6e');
  L.push('  classDef doc fill:#f5f5f5,stroke:#757575,color:#212121');
  L.push('  classDef test fill:#ede9fe,stroke:#6d28d9,color:#3b0764');
  L.push('  classDef harness fill:#ecfdf5,stroke:#059669,color:#064e3b');
  L.push('  classDef issue fill:#fef2f2,stroke:#dc2626,color:#991b1b');
  L.push('  classDef ci fill:#f3f4f6,stroke:#4b5563,color:#1f2937');
  L.push('  classDef npm fill:#fafafa,stroke:#9e9e9e,color:#424242');
  L.push('  classDef gap fill:#ff1744,stroke:#d50000,color:#ffffff');
  L.push(`  %% Summary: ${JSON.stringify(scanResult.summary)}`);

  // ── Workspaces subgraph
  L.push('\n  subgraph WORKSPACES["Workspaces"]');
  for (const ws of reg.workspaces) {
    L.push(`    ws_${ws.id}["${ws.label}\\n${ws.role}"]:::workspace`);
  }
  L.push('  end');

  // ── Modules subgraphs per workspace
  for (const ws of reg.workspaces) {
    const mods = reg.modules.filter(m => m.workspace === ws.id);
    if (mods.length === 0) continue;
    const key = `MOD_${ws.id.toUpperCase()}`;
    L.push('\n  subgraph ' + key + '["' + ws.id + ' modules"]');
    for (const mod of mods) {
      const nodeId = 'mod_' + md5(mod.file);
      const short = mod.file.replace('packages/' + ws.id + '/src/', '');
      const expStr = mod.exports.length > 0 ? `\\nexports: ${mod.exports.slice(0, 4).join(', ')}${mod.exports.length > 4 ? '...' : ''}` : '';
      L.push(`    ${nodeId}["${short}${expStr}"]:::module`);
    }
    L.push('  end');
  }

  // ── npm packages
  L.push('\n  subgraph NPM["npm packages"]');
  for (const pkg of reg.npmPackages) {
    L.push(`    npm_${pkg}["${pkg}"]:::npm`);
  }
  L.push('  end');

  // ── Config
  L.push('\n  subgraph CONFIG["Config"]');
  for (const f of reg.configs) {
    if (!scanResult.fileSet.has(f)) continue;
    const nodeId = 'cfg_' + md5(f);
    const short = f.replace('packages/', '').replace('/package.json', '/pkg.json').replace('/tsconfig.json', '/tsconfig');
    L.push(`    ${nodeId}["${short}"]:::config`);
  }
  L.push('  end');

  // ── Deploy
  L.push('\n  subgraph DEPLOY["Deployment"]');
  for (const f of reg.deploy) {
    const nodeId = 'dep_' + md5(f);
    const short = f.replace('packages/docker/', '');
    L.push(`    ${nodeId}["${short}"]:::deploy`);
  }
  L.push('  end');

  // ── DOX
  L.push('\n  subgraph DOX["DOX (AGENTS.md)"]');
  for (const f of reg.dox) {
    const nodeId = 'dox_' + md5(f);
    const short = f === 'AGENTS.md' ? 'root AGENTS.md' : f.replace('packages/', '').replace('/AGENTS.md', '');
    L.push(`    ${nodeId}["${short}"]:::dox`);
  }
  L.push('  end');

  // ── Docs
  L.push('\n  subgraph DOCS["Docs"]');
  for (const f of reg.docs) {
    const nodeId = 'doc_' + md5(f);
    L.push(`    ${nodeId}["${f}"]:::doc`);
  }
  L.push('  end');

  // ── Tests
  L.push('\n  subgraph TEST["Tests"]');
  for (const f of reg.tests) {
    const nodeId = 'test_' + md5(f);
    L.push(`    ${nodeId}["${f}"]:::test`);
  }
  L.push('  end');

  // ── Harness
  L.push('\n  subgraph HARNESS["Harness (agent team)"]');
  for (const f of reg.harness) {
    const nodeId = 'harn_' + md5(f);
    const short = f.replace('.harness/', '');
    L.push(`    ${nodeId}["${short}"]:::harness`);
  }
  L.push('  end');

  // ── Issues
  L.push('\n  subgraph ISSUES["Issues"]');
  for (const f of reg.issues) {
    const nodeId = 'iss_' + md5(f);
    const short = f.replace('.issues/', '');
    L.push(`    ${nodeId}["${short}"]:::issue`);
  }
  L.push('  end');

  // ── CI
  L.push('\n  subgraph CI["CI (.github)"]');
  for (const f of reg.ci) {
    const nodeId = 'ci_' + md5(f);
    const short = f.replace('.github/workflows/', '');
    L.push(`    ${nodeId}["${short}"]:::ci`);
  }
  L.push('  end');

  // ── Gaps
  if (scanResult.gaps.length > 0) {
    L.push('\n  subgraph GAP["Gaps & Missing Links"]');
    for (let i = 0; i < scanResult.gaps.length; i++) {
      const g = scanResult.gaps[i];
      L.push(`    gap_${i}["[${g.severity}] ${g.type}\\n${g.detail}"]:::gap`);
    }
    L.push('  end');
  }

  // ── Edges: workspace dependencies
  L.push('\n  %% Workspace dependencies');
  for (const e of scanResult.workspaceEdges) {
    const fromId = 'cfg_' + md5(e.from);
    const toId = 'cfg_' + md5(e.to);
    L.push(`  ${fromId} --> ${toId}`);
  }

  // ── Edges: module imports
  L.push('\n  %% Module imports');
  for (const e of scanResult.importEdges) {
    if (e.type !== 'import') continue;
    const fromId = 'mod_' + md5(e.from);
    const toId = 'mod_' + md5(e.to);
    L.push(`  ${fromId} --> ${toId}`);
  }

  // ── Edges: npm usage
  L.push('\n  %% npm package usage');
  for (const e of scanResult.importEdges) {
    if (e.type !== 'npm') continue;
    const fromId = 'mod_' + md5(e.from);
    const pkg = e.to.replace('npm:', '');
    L.push(`  ${fromId} -.uses.-> npm_${pkg}`);
  }

  // ── Edges: DOX ownership
  L.push('\n  %% DOX ownership');
  for (const e of scanResult.doxEdges) {
    const fromId = 'dox_' + md5(e.from);
    const toId = 'dox_' + md5(e.to);
    L.push(`  ${fromId} --> ${toId}`);
  }

  // ── Edges: deploy references
  L.push('\n  %% Deploy references');
  for (const e of scanResult.deployEdges) {
    const fromId = 'dep_' + md5(e.from);
    const toId = 'dep_' + md5(e.to);
    L.push(`  ${fromId} -.ref.-> ${toId}`);
  }

  // ── Edges: config references
  L.push('\n  %% Config references');
  for (const e of scanResult.configEdges) {
    const fromId = 'cfg_' + md5(e.from);
    const toId = 'cfg_' + md5(e.to);
    L.push(`  ${fromId} -.ref.-> ${toId}`);
  }

  // ── Edges: test targets
  L.push('\n  %% Test targets');
  for (const e of scanResult.testEdges) {
    const fromId = 'test_' + md5(e.from);
    // test targets client html, which is part of the client workspace
    L.push(`  ${fromId} -.tests.-> ws_client`);
  }

  // ── Gap edges
  if (scanResult.gaps.length > 0) {
    L.push('\n  %% Gap edges');
    for (let i = 0; i < scanResult.gaps.length; i++) {
      L.push(`  GAP -.-> gap_${i}`);
    }
  }

  return L.join('\n') + '\n';
}

// ── 4. CLI ──────────────────────────────────────────────────────────

const reg = registry();
const result = scan(reg);
const mmd = renderMermaid(reg, result);
writeFileSync(OUT, mmd);

console.log(JSON.stringify(result.summary, null, 2));
console.log(`Wrote docs/systematic-map.mmd (${mmd.length} bytes)`);
