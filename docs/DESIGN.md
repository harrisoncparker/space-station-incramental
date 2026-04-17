# Outpost Zero — Living Game Design Document

> This document is a working record of design theories, their status, and playtest findings.
> Updated each design loop iteration. Do not edit manually — use `/design-loop` to process feedback.

---

## Current Design Loop: Iteration 3

**Playtest date:** 2026-04-17
**Status:** Changes implemented. Awaiting playtest feedback.

### Playtest Brief (Iteration 3)

Play for **15–20 minutes** focusing on these questions:

1. **Building progression** — Does constructing the Shuttle Bay, Comms Array, and Research Lab feel like meaningful achievements? Does each unlock feel earned?
2. **Two-track clarity** — Is the distinction between buildings (unlock mechanics) and research (improve mechanics) clear and satisfying?
3. **Early game pacing** — With only O₂/Food/Parts visible and the Station panel guiding you, does the start feel more focused? Or still too much?
4. **Urgency strip** — The progress bars and larger text — do you notice missions and dock events reliably?
5. **Auto-boarding crew** — Migrants now board automatically when berths are available. Does this feel right, or did you miss the choice?
6. **Inspector forced compliance** — Inspectors now lock sections automatically (no ignore option). Does this feel appropriately disruptive?
7. **Panel summaries with colour** — Are the coloured resource values in collapsed headers useful at a glance?

Don't worry about: archaeology theme depth (T-007, coming next), power (removed per your request).

---

## Design Theories

### T-001 · Resource Dual Classification
**Status:** ✅ Confirmed (Iteration 2 → 3)

**Verdict:** Player confirmed "I like the colours there are no alarms for inventory items." Theory validated.

---

### T-002 · Collapsed Panel Summaries
**Status:** ✅ Confirmed, iterated (Iteration 3)

**Verdict:** Player liked the concept. Iteration 3 adds colour-coded values (O₂ in green/amber, Parts in blue) per player request for "more colour to make it more readable at a glance."

---

### T-003 · Time-Critical Urgency Strip
**Status:** ✅ Iterated (Iteration 3)

**Verdict:** Player said "really nice although it could be a bit larger" and wanted "semi graphical element like a loading bar." Iteration 3 adds progress bars and increases text size to 12px.

---

### T-004 · Visible Objectives → Immersive Objectives
**Status:** ✅ Overhauled (Iteration 3)

**Observation from playtest 2:** Player wanted objectives to be "more immersive intrinsic objectives" rather than "collect X of Y to unlock Z."

**Theory:** Objectives should read like narrative goals, not checklists. "gather parts to construct a shuttle bay" > "collect 30 parts to unlock surface ops."

**Implementation:** Objectives now reference buildings by name and use narrative language. Secondary objectives highlight available constructions.

---

### T-005 · Mission Crew Reward Clarity
**Status:** ✅ Confirmed (Iteration 2)

**Verdict:** Player said "the mission reward change is good." Iteration 3 also shows adjusted duration when Expedition Planning is researched.

---

### T-006 · Power Resource Removal
**Status:** ✅ Implemented (Iteration 3)

**Observation:** Power was always at 100%, served no purpose, and created a meaningless Engineer role.

**Decision:** Remove entirely. Power resource, Engineer role, and Fusion Core research all removed. Replaced Fusion Core with Expedition Planning (-30% mission duration) which serves the same tree position but addresses a real player need (dig grind).

---

### T-011 · Building-Based Progression (Two-Track System)
**Status:** ✅ Implemented (Iteration 3)

**Observation:** Player said "unlocking the missions could be something you need to build" and "there are two tracks — buildings unlock mechanics and research improves efficiency."

**Theory:** Replacing invisible threshold-based unlocks with explicit player-constructed buildings creates agency, clarity, and a sense of achievement. The game now has two clean progression tracks:
- **Buildings**: Shuttle Bay → Comms Array → Research Lab (+ Storage Module, Signal Booster). Each building unlocks a game section.
- **Research**: Spend artifacts + credits to improve existing systems (efficiency, capacity, capabilities).

**Buildings implemented:**
| Building | Cost | Effect |
|----------|------|--------|
| Shuttle Bay | 30 parts | Unlocks Surface Ops |
| Comms Array | 20 parts, 15 credits | Unlocks Dock |
| Research Lab | 30 parts, 25 credits, 5 artifacts | Unlocks Research |
| Storage Module | 40 parts, 25 credits | +50 to resource caps |
| Signal Booster | 35 parts, 40 credits | Faster dock events |

**Hypothesis:** Players will feel each unlock is earned, understand the two tracks, and have clearer goals.

---

### T-012 · Auto-Resolution for Non-Choice Events
**Status:** ✅ Implemented (Iteration 3)

**Observation:** Player said "having to make sure you don't miss a notification to fill your new berths seems annoying" and "you shouldn't be able to ignore audits."

**Theory:** Some dock events aren't real choices. Migrants should auto-board when berths are available. Inspectors should auto-lock (mandatory compliance). This reduces friction on non-strategic events and focuses player attention on events that actually require a decision (freighters, refugees, distress signals).

**Implementation:**
- Migrants auto-board when berths available (speed determined by Comms investment/Signal Booster)
- Inspectors auto-lock (no ignore button, forced compliance)
- Reputation system removed (was meaningless with no mechanics attached)

---

### T-007 · Archaeology Theme Depth
**Status:** 📋 Theory — Not Yet Implemented

**Observation:** Player noted the game "seems to become about archaeology" but it "feels underdeveloped and a bit of a grind." Digs just produce numbers; there's no narrative or variety.

**Theory:** Leaning into the archaeology theme with discoverable lore, named artifacts, and a "field journal" will make the mid-game feel like genuine exploration rather than farming.

**Proposed mechanics:**
- Named artifact types (Ancient Navigation Chip, Crystalline Data Core, etc.) with short discovery logs
- A "Discoveries" section showing notable finds
- Rare dig events: "The crew uncovers an intact structure" (extended mission for big reward)
- Research techs feel like they're derived from specific discoveries

---

### T-008 · Staged Complexity Onboarding
**Status:** 🔄 Partially addressed by T-011

The building system naturally stages complexity (you see only Status + Station + Crew at start). Further staging (hiding Parts until Technician is assigned, etc.) deferred to see if buildings alone solve it.

---

### T-009 · Station Construction Expansion
**Status:** 🔄 Partially addressed by T-011

5 buildings implemented. More can be added as the game design matures. Possible future buildings:
- Repair Bay (faster injury recovery)
- Hydroponics Bay (base food production)
- O₂ Scrubber (base O₂ production)
- Observatory (unlocks some late-game mechanic)

---

### T-010 · Achievement-Based Unlocks
**Status:** 🔄 Addressed by T-011

Building construction IS the achievement. Each building creates a visible, player-driven unlock moment with a log message and flavor text.

---

## Discarded Theories

### T-006 (original) · Power as a Meaningful Resource
**Discarded:** Player requested removal. Power was consistently at 100% and added no strategic depth. Removed entirely in Iteration 3.

---

## Iteration History

| Iteration | Date | Key Changes | Verdict |
|-----------|------|-------------|---------|
| 1 | 2026-04-16 | Initial prototype | First playtest complete |
| 2 | 2026-04-16 | Resource classification, objectives, urgency strip, panel summaries, reward preview | Colours confirmed, objectives needed narrative voice |
| 3 | 2026-04-17 | Building system, power removed, auto-resolve events, immersive objectives, urgency bars, coloured summaries | Awaiting playtest |
