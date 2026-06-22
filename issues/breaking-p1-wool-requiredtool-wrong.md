# P1: Wool requiredTool is 'shears' — should be 'none'

**Wiki URL:** https://minecraft.wiki/w/Wool
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

In `blockProperties.ts`, wool has `requiredTool: 'shears'`.

## Wiki behavior

Wool can be mined by hand — it drops itself regardless of tool. Shears are just the fastest way to break it (speed != requirement).

The wiki defines:
- Shears break wool at 5× speed
- Sword breaks wool at 0.1s slower than shears (sword has special interaction)
- Hand still drops the wool block

If `requiredTool` is 'shears', then the mining formula treats hand-break as "cannot harvest" and applies the 5× penalty, making hand-mining wool take 5× longer than it should.

Also, sword vs wool is a special case: the sword normally has a 1.5× penalty against blocks, but wool negates that penalty.

## Impact

Wool cannot be mined effectively by hand (should be ~0.3s, but takes ~1.5s). This is especially problematic because when a player first encounters a sheep, they need to craft shears to collect wool efficiently, but in vanilla you can punch sheep and break wool by hand just fine.
