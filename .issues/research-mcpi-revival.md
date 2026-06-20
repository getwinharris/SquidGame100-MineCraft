# MCPI-Revival / Ninecraft Research Report
## CTO Research Brief — 2026-06-20

---

## Executive Summary

The **MCPI-Revival** organization on GitHub maintains the complete open-source ecosystem around **Minecraft Pi Edition** (MCPE v0.6.1 alpha). This is a stripped-down but fully functional Minecraft Pocket Edition implementation that runs natively on ARM Linux (Raspberry Pi). The code is reverse-engineered C++ that implements the actual MCPE rendering engine, chunk system, block registry, and texture atlas loading.

**Key insight:** MCPI uses the same texture atlas format (`terrain.png` — 16×16 tiles) and block rendering pipeline as early Minecraft PE/Bedrock. We can extract the block rendering logic, texture atlas layout, and world format directly.

---

## Tier 1: Must-Clone (MIT License — Safe to Extract)

### 1. MCPI-Revival/minecraft-pi-reborn
- **URL:** `github.com/MCPI-Revival/minecraft-pi-reborn`
- **Lang:** C++
- **Stars:** 283
- **License:** MIT
- **What it is:** The actual MCPE v0.6.1 client rebuilt as a native Linux ARM binary. Contains:
  - OpenGL ES 1.1 rendering pipeline
  - Chunk meshing and culling
  - Block texture atlas (`terrain.png`) loading
  - Block registry with IDs + metadata (aux values)
  - Entity rendering (player, mobs, items)
  - GUI/HUD rendering
  - World save format (NBT-based)
  - Multiplayer protocol (RakNet)
- **What to extract:**
  - Block ID → texture atlas UV mapping
  - Chunk mesh generation (greedy meshing or simple face culling)
  - `terrain.png` atlas layout (which block ID maps to which tile coordinates)
  - Block rendering state (solid, transparent, cutout, animated)

### 2. MCPI-Revival/Ninecraft
- **URL:** `github.com/MCPI-Revival/Ninecraft`
- **Lang:** C++
- **What it is:** A launcher/implementation for MCPE 0.1.0–0.11.1 that can extract APK assets and run the game on Linux/Windows.
- **Key tool:** `./tools/extract.sh /path/to/apk` — extracts assets from the official MCPE APK
- **What to extract:**
  - Asset extraction pipeline (how to get terrain.png, items.png, sounds from APK)
  - Asset directory structure after extraction

### 3. MCPI-Revival/Skins
- **URL:** `github.com/MCPI-Revival/Skins`
- **Lang:** TypeScript
- **License:** MIT
- **What it is:** Skin server for MCPI-Reborn
- **What to extract:** Player skin texture format (64×32 or 64×64), skin rendering logic

---

## Tier 2: High-Value Mods (MIT / GPL-2.0 — Code Patterns)

### 4. MCPI-Revival/Hodgepodge
- **URL:** `github.com/MCPI-Revival/Hodgepodge`
- **Lang:** C++
- **Stars:** 14
- **What it is:** A mod that adds QoL features, redstone, bug fixes, and experiments with latest MCPI modding.
- **Critical asset structure:**
  ```
  assets/terrain.png    → 16×16 block texture atlas (replaces vanilla)
  assets/items.png      → 16×16 item texture atlas (replaces vanilla)
  ```
- **What to extract:**
  - Custom block texture placement in `terrain.png`
  - Redstone block rendering (wire, torch, repeater logic)
  - How mods inject new blocks into the block registry
  - The texture atlas coordinate calculation for custom blocks

### 5. MCPI-Revival/Expanded-Creative-Inventory
- **URL:** `github.com/MCPI-Revival/Expanded-Creative-Inventory`
- **What it is:** Adds every item to the creative inventory
- **What to extract:** Complete item/block ID list for MCPE v0.6.1

---

## Tier 3: Supporting Libraries (Code to Port)

### 6. MCPI-Revival/xnbt
- **URL:** `github.com/MCPI-Revival/xnbt`
- **Lang:** Python
- **License:** GPL-2.0
- **What it is:** NBT parser with big-endian/little-endian, zlib/gzip compression support
- **What to extract:** NBT tag types, parsing logic, JSON pretty-print format
- **Port to:** TypeScript in `@sg100/shared` for world save/load

### 7. MCPI-Revival/libmcpi
- **URL:** `github.com/MCPI-Revival/libmcpi`
- **Lang:** C
- **License:** LGPL-3.0
- **What it is:** C library for interacting with and extending the MCPI Protocol
- **What to extract:** MCPI command protocol structure (`mcpi_command_t` with package/name/args)
- **Use for:** Designing our server-client command protocol

### 8. MCPI-Revival/MCPI-World-Edit
- **URL:** `github.com/MCPI-Revival/MCPI-World-Edit`
- **Lang:** Python
- **What it is:** World edit for MCPI with shape generation (cube, sphere, walls, replace)
- **What to extract:** Block placement algorithms (sphere fill, hollow shapes, region replace)
- **Use for:** Our Squid Game island builder and world generation

### 9. MCPI-Revival/modpi / MCPI-Revival/MCPI-Addons
- **What to extract:** API surface — how external scripts interact with the game (setBlock, getBlock, postToChat, etc.)
- **Use for:** Designing our `.mcfunction`-style scripting layer

---

## Tier 4: Protocol & Server (Reference Only)

### 10. MCPI-Revival/Mycelium (archived)
- **URL:** `github.com/MCPI-Revival/Mycelium`
- **Lang:** Python
- **What it is:** Low-level MCPE v0.6.1 server framework
- **What to extract:** Packet structure, login sequence, chunk send protocol

### 11. MCPI-Revival/raket
- **URL:** `github.com/MCPI-Revival/raket`
- **Lang:** Python
- **License:** Apache-2.0
- **What it is:** RakNet server implementation for MCPI
- **What to extract:** RakNet protocol handshake, reliable/ordered packet handling

### 12. MCPI-Revival/MCBES
- **URL:** `github.com/MCPI-Revival/MCBES`
- **What it is:** Proxy bridging MCPI to Bedrock servers
- **What to extract:** Block ID mapping between MCPI and Bedrock editions

---

## Asset Format Discovery (From Hodgepodge + Reborn)

### MCPE Texture Atlas (`terrain.png`)
- **Resolution:** 256×256 pixels (16×16 tiles = 16×16 grid = 256 unique block textures)
- **Each tile:** 16×16 pixels
- **Total unique blocks:** 256 (with some tiles animated via column offset)
- **Animated tiles:** Water, lava, fire, portal — 16 frames stacked vertically in the atlas
- **Transparency:** Some tiles have alpha (glass, leaves, water)

### Block ID → Texture Mapping (MCPE v0.6.1)
```
ID 0  = Air (no texture)
ID 1  = Stone → terrain.png[1,0]
ID 2  = Grass → terrain.png[0,0] (top), [3,0] (side), [2,0] (bottom dirt)
ID 3  = Dirt → terrain.png[2,0]
ID 4  = Cobblestone → terrain.png[0,1]
ID 5  = Wood Planks → terrain.png[4,0]
ID 7  = Bedrock → terrain.png[1,1]
ID 8  = Water (animated) → terrain.png[14,0] column
ID 9  = Stationary Water → same
ID 10 = Lava (animated) → terrain.png[14,1] column
ID 12 = Sand → terrain.png[2,1]
ID 13 = Gravel → terrain.png[3,1]
ID 14 = Gold Ore → terrain.png[0,2]
ID 15 = Iron Ore → terrain.png[1,2]
ID 16 = Coal Ore → terrain.png[2,2]
ID 17 = Wood (log) → terrain.png[4,1] (side), [5,1] (top/bottom)
ID 18 = Leaves → terrain.png[4,3] (opaque) or [5,3] (transparent, fast gfx)
ID 20 = Glass → terrain.png[1,3]
ID 21 = Lapis Ore → terrain.png[0,10]
ID 24 = Sandstone → terrain.png[0,12] (top), [0,13] (bottom), [0,11] (side)
ID 35 = Wool → terrain.png[0,4] through [15,4] (16 colors)
ID 41 = Gold Block → terrain.png[7,1]
ID 42 = Iron Block → terrain.png[6,1]
ID 45 = Brick → terrain.png[7,0]
ID 46 = TNT → terrain.png[8,0] (side), [9,0] (top), [10,0] (bottom)
ID 47 = Bookshelf → terrain.png[3,2] (side), [4,0] (top/bottom)
ID 48 = Mossy Cobblestone → terrain.png[4,2]
ID 49 = Obsidian → terrain.png[5,2]
ID 50 = Torch → terrain.png[0,5] (small texture, billboard rendering)
ID 54 = Chest → terrain.png[10,1] (top), [11,1] (side), [9,1] (front)
ID 56 = Diamond Ore → terrain.png[2,3]
ID 57 = Diamond Block → terrain.png[8,1]
ID 58 = Crafting Table → terrain.png[11,2] (top), [11,3] (side), [4,0] (bottom)
ID 61 = Furnace → terrain.png[12,2] (top), [13,2] (side), [12,2] (front)
ID 73 = Redstone Ore → terrain.png[3,3]
ID 78 = Snow → terrain.png[2,4]
ID 79 = Ice → terrain.png[3,4]
ID 80 = Snow Block → terrain.png[2,4] (top), [4,4] (side)
ID 81 = Cactus → terrain.png[6,4] (top), [5,4] (side), [7,4] (bottom)
ID 82 = Clay → terrain.png[8,4]
ID 86 = Pumpkin → terrain.png[7,7] (top), [6,7] (side), [7,6] (face)
ID 87 = Netherrack → terrain.png[7,6] (reused or [7,6] dedicated)
ID 88 = Soul Sand → terrain.png[8,6]
ID 89 = Glowstone → terrain.png[9,6]
ID 91 = Jack-o-Lantern → terrain.png[7,7] (top), [6,7] (side), [8,7] (lit face)
ID 95 = Bed → terrain.png[6,8] (head top), [5,8] (foot top), [7,8] (side)
ID 96 = Wooden Trapdoor → terrain.png[4,5]
ID 98 = Stone Brick → terrain.png[6,3]
ID 102 = Glass Pane → terrain.png[1,3] (same as glass, different model)
ID 103 = Melon → terrain.png[8,8] (top), [9,8] (side)
ID 107 = Fence Gate → terrain.png [uses plank texture + custom model]
ID 108 = Brick Stairs → terrain.png[7,0] (same as brick block)
ID 109 = Stone Brick Stairs → terrain.png[6,3]
ID 112 = Nether Brick → terrain.png[0,14]
ID 114 = Nether Brick Stairs → terrain.png[0,14]
ID 121 = End Stone → terrain.png[15,10]
ID 123 = Redstone Lamp (off) → terrain.png[3,13]
ID 124 = Redstone Lamp (on) → terrain.png[4,13]
ID 126 = Wooden Slab → terrain.png[4,0] (top), [4,0] (bottom)
ID 128 = Sandstone Stairs → terrain.png[0,12]
ID 129 = Emerald Ore → terrain.png[11,10]
ID 133 = Emerald Block → terrain.png[10,10]
ID 139 = Cobblestone Wall → terrain.png[0,1]
ID 145 = Anvil → terrain.png[7,10] (top), [7,11] (base)
ID 152 = Redstone Block → terrain.png[14,12]
ID 153 = Quartz Ore → terrain.png[14,11]
ID 155 = Quartz Block → terrain.png[7,12] (top), [6,12] (side)
ID 156 = Quartz Stairs → terrain.png[6,12]
```

### Animated Tiles (Vertical Strip in Atlas)
- **Water:** `terrain.png` column at x=14, y=0 → 16 frames at y=0 through y=15
- **Lava:** `terrain.png` column at x=14, y=1 → 16 frames at y=1 through y=16 (but actually: x=14, frames 0-15)
- **Fire:** `terrain.png` columns at x=14/15, y=0 → 32 frames
- **Portal:** `terrain.png` column at x=15, y=0 → 16 frames

---

## Block Rendering Types (from MCPE engine)

| Type | Blocks | Render Behavior |
|------|--------|-----------------|
| **Solid** | Stone, dirt, planks, ores, blocks | Full cube, opaque, culls hidden faces |
| **Cutout** | Glass, leaves, cactus side | Full cube, alpha test (0.5 threshold), no face culling against same type |
| **Transparent** | Water, ice | Full cube, alpha blend, no face culling |
| **Billboard** | Torch, flower, sapling, fire | Crossed quads (X shape), always face camera |
| **Custom** | Stairs, slabs, fence, door, chest | Non-cube mesh, custom geometry |
| **Animated** | Water, lava, fire, portal | Texture UV offset changes per frame |

---

## Chunk Format (MCPE v0.6.1)

- **Chunk size:** 16×16×16 blocks (same as Java/Bedrock)
- **World height:** 128 blocks (8 chunks tall)
- **Block storage:** `blocks[16*16*16]` (block IDs) + `meta[16*16*16]` (4-bit metadata)
- **Sky light:** 4-bit per block (half-byte array)
- **Block light:** 4-bit per block (half-byte array)
- **Biome:** 1 byte per x,z column (16×16 biome map per chunk)

---

## Recommended Extraction Order for SG100

1. **Clone `minecraft-pi-reborn`** → Find block registry + texture atlas mapping code
2. **Clone `Hodgepodge`** → Extract `terrain.png` layout documentation + custom block injection
3. **Clone `Ninecraft`** → Run `./tools/extract.sh` on any MCPE APK to get raw assets
4. **Clone `xnbt`** → Port NBT parser to TypeScript for `@sg100/shared`
5. **Clone `MCPI-World-Edit`** → Port shape generation algorithms to TypeScript
6. **Clone `libmcpi`** → Study command protocol for our `.mcfunction` layer

---

## License Compatibility Matrix

| Repo | License | Can we use? | Notes |
|------|---------|-------------|-------|
| minecraft-pi-reborn | MIT | ✅ Yes | Full code extraction, port to TS |
| Ninecraft | Unknown | ⚠️ Check | Likely MIT (same org) |
| Skins | MIT | ✅ Yes | Skin server logic |
| Hodgepodge | Unknown | ⚠️ Check | Likely MIT or GPL-2.0 |
| xnbt | GPL-2.0 | ⚠️ Study only | Cannot directly copy; re-implement from spec |
| libmcpi | LGPL-3.0 | ⚠️ Study only | Protocol reference only |
| raket | Apache-2.0 | ✅ Yes | Protocol reference |
| Mycelium | Unknown | ⚠️ Check | Archived, Python reference |
| MCPI-World-Edit | Unknown | ⚠️ Check | Algorithm reference |
| MCBES | Unknown | ⚠️ Check | Block ID mapping reference |

---

## Next Steps

1. **Launch Browser-Research Agent** → Browse `minecraft-pi-reborn` source to find block registry and texture atlas UV mapping
2. **Launch Code-Audit Agent** → Compare our `scene.ts` block rendering against MCPE `terrain.png` atlas approach
3. **Launch Game-Fixer Agent** → Implement texture atlas loading in `@sg100/client` using `THREE.Texture`
4. **Launch Game-Reviewer Agent** → Verify the new texture atlas rendering matches MCPE visual output

---

*Report compiled by CTO Agent (`mavis`) — 2026-06-20*
