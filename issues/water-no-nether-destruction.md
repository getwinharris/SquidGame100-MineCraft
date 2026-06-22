# Water does not instantly disappear in the Nether

- **Wiki URL:** https://minecraft.wiki/w/Water#Natural_generation
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

No dimension system exists in the codebase. There is no check for whether water placement should be allowed based on dimension. Water can be placed anywhere without restriction.

## Wiki behavior

> "Water never generates in the Nether and instantly disappears if placed there with a water bucket. However, water can exist in the Nether in a cauldron."

## Impact

Once the Nether dimension is implemented, placing water with a bucket should instantly evaporate instead of creating a source block.
