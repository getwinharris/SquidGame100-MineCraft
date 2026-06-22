#!/usr/bin/env bash
set -euo pipefail

# MineCraft Dev Cycle
# player-1 research → issues → game-fixer fix → game-reviewer verify → loop
# CEO orchestrates. Never writes game code.

CYCLE_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$CYCLE_DIR/.." && pwd)"
CYCLE_LOG="$CYCLE_DIR/cycle.log"
STATE_FILE="$CYCLE_DIR/cycle.state"

log()  { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$CYCLE_LOG"; }
die()  { log "FATAL: $*"; exit 1; }

verify_baseline() {
    log "=== Baseline verification ==="
    (cd "$REPO_DIR" && npm run typecheck) || die "typecheck failed"
    (cd "$REPO_DIR" && npm run build) || die "build failed"
    log "Baseline PASS"
}

# Read/write cycle state
next_phase() {
    if [[ -f "$STATE_FILE" ]]; then
        cat "$STATE_FILE"
    else
        echo "research"
    fi
}

set_phase() {
    echo "$1" > "$STATE_FILE"
    log "Phase set to: $1"
}

# Next un-researched wiki topic
next_topic() {
    # Read Gameplay Rules Contract, find next unresearched mechanic
    local researched_file="$CYCLE_DIR/researched-topics.txt"
    touch "$researched_topics"

    # Topics from root AGENTS.md Gameplay Rules Contract
    local topics=(
        "water-flow" "lava-flow" "leaves-decay" "bed-respawn" "creeper-explosion"
        "furnace-smelting" "crafting-grid" "enchanting" "brewing" "redstone-dust"
        "piston-mechanics" "block-drops" "experience-orbs" "hunger-mechanics"
        "mob-spawning" "daylight-cycle" "weather" "tnt" "farmland" "ice"
        "mining-tiers" "item-durability" "anvil" "smithing" "trade-villager"
    )

    for t in "${topics[@]}"; do
        if ! grep -q "$t" "$researched_file" 2>/dev/null; then
            echo "$t"
            return
        fi
    done
    echo "ALL-RESEARCHED"  # loop pauses
}

run_research() {
    local topic="$1"
    log "=== PHASE: player-1 research: $topic ==="
    echo "$topic" >> "$CYCLE_DIR/researched-topics.txt"
    log "Ready for player-1 sub-agent: research $topic from minecraft.wiki"
    log "Output: issues/$topic-*.md + research-report.md"
}

run_fix_cycle() {
    local issue_file="$1"
    log "=== PHASE: game-fixer fix: $issue_file ==="
    log "Ready for game-fixer sub-agent: fix issue $issue_file"
    log "Output: deliverable.md"
}

run_review_cycle() {
    log "=== PHASE: game-reviewer verify ==="
    log "Ready for game-reviewer sub-agent: verify deliverable.md"
    log "Output: review.md"
}

# === MAIN ===
log "=== Cycle start ==="
verify_baseline

case "$(next_phase)" in
    research)
        TOPIC="$(next_topic)"
        if [[ "$TOPIC" == "ALL-RESEARCHED" ]]; then
            log "All topics researched. Restarting from first."
            > "$CYCLE_DIR/researched-topics.txt"
            TOPIC="water-flow"
        fi
        run_research "$TOPIC"
        set_phase "fix"
        ;;

    fix)
        ISSUES_DIR="$CYCLE_DIR/../issues"
        if ls "$ISSUES_DIR"/*.md 1>/dev/null 2>&1; then
            for f in "$ISSUES_DIR"/*.md; do
                [[ -f "$f" ]] || continue
                RUNNING="$CYCLE_DIR/running-issue.txt"
                if [[ ! -f "$RUNNING" ]]; then
                    echo "$f" > "$RUNNING"
                    run_fix_cycle "$(basename "$f")"
                    set_phase "review"
                    break
                fi
            done
        else
            log "No issues to fix. Back to research."
            set_phase "research"
        fi
        ;;

    review)
        run_review_cycle
        # After review, clean up and loop
        rm -f "$CYCLE_DIR/running-issue.txt"
        # Remove the fixed issue file
        for f in "$ISSUES_DIR"/*.md; do
            if [[ -f "$f" ]]; then
                rm "$f"
                log "Removed processed issue: $f"
                break
            fi
        done
        set_phase "fix"  # try next issue, or go to research if none left
        ;;
esac

log "=== Cycle iteration complete ==="
echo ""
echo "Run this script again to continue the loop."
echo "In real operation, CEO launches sub-agents for each phase."
