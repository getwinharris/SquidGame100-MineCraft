/**
 * Inventory system — item stacks, slot management, crafting grid.
 * Minecraft Earth style: unlimited inventory slots and stack sizes.
 */

import { getItemProperties } from './items.js';

// ─── Item Stack ────────────────────────────────────────────────────────────────

export interface ItemStack {
  itemId: number;    // 0 = empty
  count: number;     // unlimited in Minecraft Earth
  durability?: number; // remaining durability for tools/armor
}

export function createStack(itemId: number, count = 1): ItemStack | null {
  if (itemId === 0) return null;
  const props = getItemProperties(itemId);
  if (!props) return null;
  // Minecraft Earth: unlimited stack size
  return {
    itemId,
    count,
    durability: props.durability,
  };
}

export function isEmpty(stack: ItemStack | null): boolean {
  return !stack || stack.count <= 0 || stack.itemId === 0;
}

export function canStack(a: ItemStack | null, b: ItemStack | null): boolean {
  if (isEmpty(a) || isEmpty(b)) return false;
  if (a!.itemId !== b!.itemId) return false;
  const props = getItemProperties(a!.itemId);
  if (!props) return false;
  return a!.count + b!.count <= props.maxStackSize;
}

export function mergeStacks(a: ItemStack, b: ItemStack): ItemStack {
  const props = getItemProperties(a.itemId);
  const maxStack = props?.maxStackSize ?? 64;
  const totalCount = a.count + b.count;
  const merged: ItemStack = {
    itemId: a.itemId,
    count: Math.min(totalCount, maxStack),
    durability: a.durability,
  };
  return merged;
}

// ─── Inventory Layout (Minecraft Java Edition) ─────────────────────────────────
//
//  Slot indices:
//  0-8:    Hotbar (bottom row)
//  9-35:   Main inventory (3 rows × 9 columns)
//  36-39:  Armor (helmet=36, chestplate=37, leggings=38, boots=39)
//  40:     Offhand (shield)
//
//  Crafting grid (2×2 in inventory):
//  41, 42
//  43, 44
//
//  Crafting output:
//  45
//
//  Total: 46 slots

export const HOTBAR_SIZE = 9;
export const MAIN_SIZE = 27;
export const ARMOR_SIZE = 4;
export const OFFHAND_SIZE = 1;
export const CRAFTING_GRID_SIZE = 4;
export const CRAFTING_OUTPUT_SIZE = 1;
export const TOTAL_SLOTS = HOTBAR_SIZE + MAIN_SIZE + ARMOR_SIZE + OFFHAND_SIZE + CRAFTING_GRID_SIZE + CRAFTING_OUTPUT_SIZE; // 46

// Slot ranges
export const SLOT = {
  HOTBAR_START: 0,
  HOTBAR_END: 8,
  MAIN_START: 9,
  MAIN_END: 35,
  ARMOR_START: 36,
  ARMOR_END: 39,
  OFFHAND: 40,
  CRAFT_GRID_START: 41,
  CRAFT_GRID_END: 44,
  CRAFT_OUTPUT: 45,
} as const;

// Armor slot mapping (body part → slot index)
export const ARMOR_SLOT = {
  HELMET: 36,
  CHESTPLATE: 37,
  LEGGINGS: 38,
  BOOTS: 39,
} as const;

// ─── Inventory Class ───────────────────────────────────────────────────────────

export class Inventory {
  slots: (ItemStack | null)[] = new Array(TOTAL_SLOTS).fill(null);
  selectedHotbar = 0;

  /** Get item at slot index. */
  getSlot(index: number): ItemStack | null {
    if (index < 0 || index >= TOTAL_SLOTS) return null;
    return this.slots[index];
  }

  /** Set item at slot index. */
  setSlot(index: number, stack: ItemStack | null): void {
    if (index < 0 || index >= TOTAL_SLOTS) return;
    this.slots[index] = stack;
  }

  /** Get currently selected hotbar item. */
  getHeldItem(): ItemStack | null {
    return this.getSlot(this.selectedHotbar);
  }

  /** Set selected hotbar slot. */
  selectHotbar(index: number): void {
    if (index >= 0 && index < HOTBAR_SIZE) {
      this.selectedHotbar = index;
    }
  }

  /** Add item to inventory, returns leftover count that didn't fit. Minecraft Earth: unlimited stacks. */
  addItem(itemId: number, count = 1): number {
    const props = getItemProperties(itemId);
    if (!props) return count;
    let remaining = count;

    // Minecraft Earth: stack with existing items without limit
    for (let i = 0; i < TOTAL_SLOTS && remaining > 0; i++) {
      const existing = this.slots[i];
      if (existing && existing.itemId === itemId) {
        existing.count += remaining;
        remaining = 0;
      }
    }

    // Then try empty slots
    for (let i = 0; i < TOTAL_SLOTS && remaining > 0; i++) {
      if (!this.slots[i]) {
        this.slots[i] = { itemId, count: remaining, durability: props.durability };
        remaining = 0;
      }
    }

    return remaining;
  }

  /** Remove item from inventory, returns number actually removed. */
  removeItem(itemId: number, count = 1): number {
    let removed = 0;
    for (let i = TOTAL_SLOTS - 1; i >= 0 && removed < count; i--) {
      const stack = this.slots[i];
      if (stack && stack.itemId === itemId) {
        const toRemove = Math.min(count - removed, stack.count);
        stack.count -= toRemove;
        removed += toRemove;
        if (stack.count <= 0) this.slots[i] = null;
      }
    }
    return removed;
  }

  /** Remove item at specific slot, returns number actually removed. */
  removeSlot(index: number, count = 1): number {
    const stack = this.slots[index];
    if (!stack) return 0;
    const toRemove = Math.min(count, stack.count);
    stack.count -= toRemove;
    if (stack.count <= 0) this.slots[index] = null;
    return toRemove;
  }

  /** Check if inventory contains at least `count` of `itemId`. */
  contains(itemId: number, count = 1): boolean {
    let total = 0;
    for (const stack of this.slots) {
      if (stack && stack.itemId === itemId) {
        total += stack.count;
        if (total >= count) return true;
      }
    }
    return false;
  }

  /** Count total of an item across all slots. */
  countItem(itemId: number): number {
    let total = 0;
    for (const stack of this.slots) {
      if (stack && stack.itemId === itemId) {
        total += stack.count;
      }
    }
    return total;
  }

  /** Swap two slots. */
  swapSlots(a: number, b: number): void {
    const temp = this.slots[a];
    this.slots[a] = this.slots[b];
    this.slots[b] = temp;
  }

  /** Move item from one slot to another (with stacking). Returns leftover. */
  moveItem(from: number, to: number): ItemStack | null {
    const fromStack = this.slots[from];
    const toStack = this.slots[to];

    if (!fromStack) return null;

    if (!toStack) {
      this.slots[to] = fromStack;
      this.slots[from] = null;
      return null;
    }

    if (canStack(fromStack, toStack)) {
      const props = getItemProperties(fromStack.itemId);
      const maxStack = props?.maxStackSize ?? 64;
      const canAdd = maxStack - toStack.count;
      const toMove = Math.min(fromStack.count, canAdd);
      toStack.count += toMove;
      fromStack.count -= toMove;
      if (fromStack.count <= 0) this.slots[from] = null;
      return fromStack.count > 0 ? fromStack : null;
    }

    // Can't stack — swap
    this.swapSlots(from, to);
    return null;
  }

  /** Get armor points from equipped armor. */
  getArmorPoints(): { helmet: number; chestplate: number; leggings: number; boots: number; total: number } {
    let helmet = 0, chestplate = 0, leggings = 0, boots = 0;
    
    const h = this.getSlot(ARMOR_SLOT.HELMET);
    if (h) { const p = getItemProperties(h.itemId); helmet = p?.armorPoints ?? 0; }
    
    const c = this.getSlot(ARMOR_SLOT.CHESTPLATE);
    if (c) { const p = getItemProperties(c.itemId); chestplate = p?.armorPoints ?? 0; }
    
    const l = this.getSlot(ARMOR_SLOT.LEGGINGS);
    if (l) { const p = getItemProperties(l.itemId); leggings = p?.armorPoints ?? 0; }
    
    const b = this.getSlot(ARMOR_SLOT.BOOTS);
    if (b) { const p = getItemProperties(b.itemId); boots = p?.armorPoints ?? 0; }
    
    return { helmet, chestplate, leggings, boots, total: helmet + chestplate + leggings + boots };
  }

  /** Get equipped weapon damage. */
  getWeaponDamage(): number {
    const held = this.getHeldItem();
    if (!held) return 1; // fist
    const props = getItemProperties(held.itemId);
    return props?.damage ?? 1;
  }

  /** Get total armor toughness. */
  getArmorToughness(): number {
    let total = 0;
    for (const slotIdx of [ARMOR_SLOT.HELMET, ARMOR_SLOT.CHESTPLATE, ARMOR_SLOT.LEGGINGS, ARMOR_SLOT.BOOTS]) {
      const stack = this.getSlot(slotIdx);
      if (stack) {
        const props = getItemProperties(stack.itemId);
        total += props?.armorToughness ?? 0;
      }
    }
    return total;
  }

  /** Serialize for network/storage. */
  serialize(): Array<{ slot: number; itemId: number; count: number; durability?: number }> {
    const data: Array<{ slot: number; itemId: number; count: number; durability?: number }> = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const stack = this.slots[i];
      if (stack) {
        data.push({
          slot: i,
          itemId: stack.itemId,
          count: stack.count,
          durability: stack.durability,
        });
      }
    }
    return data;
  }

  /** Deserialize from network/storage. */
  static deserialize(data: Array<{ slot: number; itemId: number; count: number; durability?: number }>): Inventory {
    const inv = new Inventory();
    for (const entry of data) {
      inv.slots[entry.slot] = {
        itemId: entry.itemId,
        count: entry.count,
        durability: entry.durability,
      };
    }
    return inv;
  }
}

// ─── Crafting Table Inventory (3×3 grid) ───────────────────────────────────────

export const CRAFTING_TABLE_GRID_SIZE = 9;
export const CRAFTING_TABLE_SLOTS = CRAFTING_TABLE_GRID_SIZE + 1; // 9 grid + 1 output

export class CraftingTableInventory {
  grid: (ItemStack | null)[] = new Array(CRAFTING_TABLE_GRID_SIZE).fill(null);
  output: ItemStack | null = null;

  getGridSlot(row: number, col: number): ItemStack | null {
    return this.grid[row * 3 + col];
  }

  setGridSlot(row: number, col: number, stack: ItemStack | null): void {
    this.grid[row * 3 + col] = stack;
  }

  clearGrid(): void {
    this.grid.fill(null);
    this.output = null;
  }
}
