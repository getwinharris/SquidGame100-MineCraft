# Game Resource Extraction & Design Reference

This document summarizes the logic and assets extracted from external Squid Game Minecraft repositories. While these repositories use Java (Spigot/Paper API), they serve as the authoritative design reference for our browser-based recreation.

## Extracted Repositories
- `ArkFlame/SquidGame`
- `JossArchived/SquidGame`
- `ChristianWalken/MIneCraft_SquidGame`

## 1. Game State & Messaging Reference
The following game states and notifications are identified as critical for the player experience:

| State | Trigger | Notification / Message |
|---|---|---|
| **Join** | Player enters arena | `[Player] has joined the game (Current/Max)` |
| **Wait** | Not enough players | `Not enough players to start the game, [Required] required.` |
| **Countdown**| Timer reaching 0 | `The game starts in [Seconds] seconds.` |
| **Start** | Game begins | `The game has started Good luck!` |
| **Elimination**| Player dies | `[Player] has been eliminated.` |
| **Timeout** | Timer ends | Game-timeout state $\rightarrow$ automatic elimination for those not finished. |
| **Win** | Last one standing | `[Player] has won the game` |

## 2. Mini-Game Design Notes
- **Glass Bridge:** Specifically referenced as "2 rows of platforms will be generated."
- **Final Game:** PvP is activated at the start of the final match.
- **UI:** Use of a Scoreboard to track survivors and current game phase.

## 3. Asset Gap Analysis
The extracted repositories contain no custom 3D models or textures (they rely on vanilla Minecraft assets). 

**Action Item:** Our engine must provide:
- 16×16 PNG textures for the "Squid Game" themed blocks (Pink Guard, Young-hee, Glass, Gold).
- Custom JSON models for the "Doll" and "Vault" entities to match the visual identity.

## 4. Implementation Path
We will map these Java-based plugin events (e.g., `PlayerJoinEvent` $\rightarrow$ `SQUID_GAME_JOINED`) to our authoritative WebSocket protocol defined in `packages/shared/src/protocol.ts`.
