# Concrete powder does not harden in water

- **Wiki URL:** https://minecraft.wiki/w/Water#Hardening_concrete_powder
- **Gap type:** `completeness`
- **Priority:** P3

## Our implementation

Concrete powder blocks exist in the block registry but show no concrete block definitions in `packages/shared/src/blocks.ts`. No concrete powder → concrete conversion mechanic exists.

## Wiki behavior

> "When water comes into contact with concrete powder, the powder hardens into solid concrete."

## Impact

Concrete powder placed in or near water remains as powder. Concrete is a popular building material, but this gap is cosmetic/build-focused rather than gameplay-critical.
