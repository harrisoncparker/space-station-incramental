# Outpost Zero — Living Game Design Document

> This document is a working record of design theories, their status, and playtest findings.
> Updated each design loop iteration. Do not edit manually — use `/design-loop` to process feedback.

---

## Narrative Bible

### Setting

**Station:** Outpost Zero — a research station in low orbit above Eridu-7. Designation chosen because it was the first (and so far only) permanent research installation in this system. The "zero" carries an unintended weight now.

**Planet:** Eridu-7 — a mid-sized rocky world at the outer edge of the accessible frontier. No breathable atmosphere, but the surface is dense with ruins. Named after the oldest city in human myth; the irony of the name was not lost on the team that first surveyed it.

**The Precursors** — the only name the research community has settled on for whoever built what's on the surface. They are completely gone. How long ago, and what finished them, is not yet understood. Their technology was substantially more advanced than ours. Handling it is probably dangerous.

### The Story

The player's crew has arrived at Outpost Zero to relieve the previous research team — a standard rotation. They find the station intact but completely empty. No crew. No distress signal. The previous team's last log entry is three weeks old.

This is no longer a routine rotation. It is a recovery mission — for the station, for the research programme, and for whatever happened to the people who were here before.

The goal is not escape. It is to rebuild the research operation, push deeper into what the Precursors left behind, and eventually piece together what happened to the first crew. The Warp Beacon, when activated, does not call for rescue — it re-establishes the station's contact with the academic institutions that funded it, signalling that Outpost Zero is operational again.

### Tone

- Deep exploration at the edge of humanity's reach. Intentional, not accidental.
- Melancholic curiosity rather than survival panic. The crew knows the stakes but chose to be here.
- The Precursors are not threatening — they are gone. But their technology is not neutral.
- Slow revelation. Early log entries are sparse and clinical. As you dig deeper, they become stranger.

### Terminology

- **Artifacts** — physical objects recovered from Precursor ruins. Museums on Earth pay well for catalogued specimens.
- **Archaeological Dig** — surface excavation of Precursor ruin sites.
- **Precursors** — the alien civilisation. Never described more specifically than this in early game. Lore is earned through research.
- **Grants** — research funding from academic institutions. Managed by Comms operators via the communications array.
- **Anomalies** — active energy signatures detected in deep orbit or on the surface that don't match any human origin. Origin unknown.

---

## Design Principles

1. **Terminal aesthetic** — text-only, monospace, no icons or images. Every element earns its space.
2. **Two progression tracks** — buildings unlock mechanics; research improves existing ones.
3. **Legible tradeoffs** — the player should always understand what they're choosing between.
4. **Survival ≠ inventory** — O₂/Food cause death when depleted; Parts/Credits/Artifacts do not.
5. **Archaeology as the beating heart** — digs, artifacts, and the research tree are the core loop. Everything else serves this.
6. **Earned revelation** — the game starts mundane and gets stranger. Lore is discovered, not explained.
7. **Vertical space is precious** — every screen element must justify its height.

---

## Command Dashboard (Iteration 4 spec)

The primary interface the player lives in. Everything time-sensitive surfaces here. Control panels (Crew, Station, Surface Ops, etc.) are scrolled to for configuration — the dashboard is for awareness and response.

### Layout concept

```
OUTPOST ZERO  ·  ERIDU-7  ·  T+847s
contact: 38s ░░░░████████████████████  ← full-width thin bar, single row

↑  Archaeological Dig · Vasquez, Kim · returns 34s
   ████████████████░░░░░░░░
⚡  freighter · offers 22 O₂ for 14 credits · 16s
   █████████░░░░░░░░░░░░░░  [accept]  [ignore]
>  shuttle returned. 4 artifacts recovered.
>  chen has boarded the station.
>  comms array online. first grant request filed.
```

### Design decisions

- **Next contact timer** — integrated into its own single compact row (label + inline progress bar), not a full section. Visually part of the header area.
- **Max simultaneous items** — 3–4 live items in the feed (e.g. 2 missions + 1 dock event). Anything beyond queues.
- **Accept/Ignore lives in the feed** — dock events show full information and action buttons inline. The Dock panel is for outgoing actions only (supply drops, etc.).
- **Log flows below live events** — same visual column, lower urgency. Recent entries fade. Everything that appears in the live section also becomes a log entry.
- **Mission completion** — when a mission resolves, it shows results in the feed for ~10 seconds before becoming a log entry. Player sees the outcome without opening a panel.
- **Progress bars** — missions show countdown as a depleting bar. Dock events show urgency as a depleting bar. Both use colour to signal state.

### Open questions

- Exact typography/spacing for "contact: 38s" row — test whether label + bar fit cleanly in one line at 480px width.
- Should the player be able to scroll the log within the feed, or is it always just the most recent N entries?
- How many log entries are visible before the feed becomes too tall? Probably 3–4.

---

## Economy

### Credits

Credits represent the station's operating budget. Two sources:

**Research grants** (passive)
- Comms operators manage grant applications with academic institutions.
- Each Comms operator generates 0.05 credits/s.
- Signal Booster building improves contact quality → faster dock events (which carry supply contracts and equipment).
- *Narrative frame:* these are the people keeping the lights on back home. More Comms = better managed relationships with funders.

**Artifact sales** (active, player choice)
- Artifacts can be sold to museums via the dock once the Comms Array is built.
- Creates the central economic tension of a research station: **spend artifacts on research** (permanent capability upgrade) vs. **sell for credits** (operational funding now).
- Player should feel the compromise. Selling a valuable find for budget money is a real fieldwork dilemma.
- *Status: designed, not yet implemented.*

### Open questions

- Credits-per-artifact exchange rate. Should it be fixed or variable (museum interest fluctuates)?
- Should grant income scale with research completed (i.e. publishing findings increases your reputation with funders)?
- Is there a risk of the artifact sale mechanic making credits too easy once the Comms Array is up?

---

## Progression Systems

### Track 1 — Buildings (unlock mechanics)

Buildings are constructed in the Station panel. They are the primary progression track.

**One-time buildings (current):**
| Building | Cost | Effect |
|----------|------|--------|
| Shuttle Bay | 30 parts | Unlocks Surface Ops |
| Comms Array | 20 parts, 15 credits | Unlocks Dock |
| Research Lab | 30 parts, 25 credits, 5 artifacts | Unlocks Research |
| Storage Module | 40 parts, 25 credits | +50 to all resource caps |
| Signal Booster | 35 parts, 40 credits | Faster dock events |

**Repeatable buildings (current):**
| Building | Base cost | Effect |
|----------|-----------|--------|
| Crew Quarters | 20 parts, 15 credits (×1.15 each) | +1 max crew |

**Repeatable buildings (planned — Iteration 4):**
| Building | Base cost | Effect |
|----------|-----------|--------|
| Landing Craft | TBD parts + credits | +1 simultaneous mission slot (replaces Second Shuttle research) |

**Design note:** Crew Quarters should move from the Crew panel into the Station panel alongside other buildings. The Crew panel handles assignment and roster only.

**Design note:** "Second Shuttle" research should be replaced by a Landing Craft building, keeping the research tree for efficiency upgrades only.

**Future buildings (not yet designed):**
- Something that unlocks the scanning mechanic for mission discovery
- Station expansion options (more habitat, more lab space)
- Something tied to the Precursor tech narrative

### Track 2 — Research (improve mechanics)

Spend artifacts + credits to unlock efficiency improvements and late-game capabilities. All gated behind the Research Lab building.

**Current tree:**
| Tech | Tier | Cost | Effect |
|------|------|------|--------|
| Efficient Recycling | 1 | 10 art, 10cr | O₂ consumption -20% |
| Drill Upgrades | 1 | 10 art, 10cr | Parts/s +50% |
| Advanced Hydroponics | 2 | 35 art, 35cr | Food/s +50% |
| Second Shuttle | 2 | 35 art, 35cr | **→ to be replaced by Landing Craft building** |
| Expedition Planning | 3 | 90 art, 90cr | Mission duration -30% |
| Crew Expansion | 3 | 90 art, 90cr | Max crew +4 |
| Deep Orbit Scanner | 4 | 200 art, 200cr | Unlocks anomaly missions |
| Warp Beacon | 4 | 200 art, 200cr | Rebuilds comms — wins game |

**Esoteric lettering for locked research** (planned — Iteration 4)
- Locked research entries show name/description in a substituted "alien" script.
- As requirements are partially met, characters resolve toward latin script.
- When fully affordable, text is fully readable.
- Serves as atmosphere and as a subtle indicator of progress.
- Unicode block candidates: Runic (ᚠᚢᚦ), or a consistent substitution cipher for the precursor script.

### Mission Discovery — Scanning (planned, post Iteration 4)

**Always-available missions** (current set — Mining, Botanical Survey, Archaeological Dig, Rescue Op)

**Discovered missions** — using a scanner (either a building or the Deep Orbit Scanner research), the crew can probe for specific sites:
- Each scan returns a named site with a short descriptor: "Site 7-C: Intact subterranean structure"
- Named sites offer better rewards and one-time lore fragments
- Late-game scans start returning sites that reference the missing first crew
- Anomaly missions remain as the highest-tier discovered missions

*Status: designed, not yet implemented. Requires deciding where scanning lives (building? research? surface ops action?)*

---

## Crew Pipeline

- **Before Comms Array:** Crew can only be added via Rescue Ops (surface mission). This is narratively appropriate — you're finding survivors from the previous team.
- **After Comms Array:** Migrants auto-board when berths are available. Rate influenced by Comms operators and Signal Booster.
- **This needs to be communicated to the player** — a note in the Station panel or objectives ("once the comms array is online, arriving researchers will board automatically").

---

## Opening Log (draft — awaiting playtest feedback)

The following entries appear at game start, replacing the current generic messages. They run chronologically to set the scene before the player's first interaction.

```
orbital insertion complete. eridu-7 below.
hailing outpost zero on all channels. no response.
docking. the station is intact. the crew bay is empty.
life support at minimum. beginning emergency restoration.
the previous team's last log entry: 22 days ago.
surface scans confirm: the ruins are still there. they're not going anywhere.
this is a recovery mission now. station first. answers second.
```

*Feedback requested: tone, pacing, information density. Too sparse? Too much? Does it establish the right feeling at the start?*

**Variants to consider:**
- Should any entries be attributed to a specific crew member (e.g. "Chen: docking now. place gives me the creeps.")?
- Should the last entry of the previous crew appear in the log as a found object?
- Should the alien presence be hinted at more directly, or should that be earned through first dig?

---

## Design Theories

### T-001 · Resource Dual Classification
**Status:** ✅ Confirmed (Iteration 2)

### T-002 · Collapsed Panel Summaries
**Status:** ✅ Confirmed, iterated (Iteration 3 — added colour coding)

### T-003 · Time-Critical Urgency Strip → Command Dashboard
**Status:** 🔄 Evolving — Iteration 4 will replace the urgency strip with a full command dashboard

### T-004 · Visible Objectives → Immersive Objectives
**Status:** ✅ Implemented (Iteration 3)

### T-005 · Mission Crew Reward Clarity
**Status:** ✅ Confirmed (Iteration 2)

### T-006 · Power Resource Removal
**Status:** ✅ Implemented (Iteration 3)

### T-007 · Archaeology Theme Depth
**Status:** 📋 Theory — addressed by narrative bible, scanning mechanic designed but not implemented

### T-008 · Staged Complexity Onboarding
**Status:** 🔄 Partially addressed by building system

### T-011 · Building-Based Progression (Two-Track System)
**Status:** ✅ Confirmed (Iteration 3 playtest)
**Verdict:** Player confirmed "the two tracks work for me." Buildings should include repeatable types (quarters, landing crafts). More buildings needed post-Research Lab.

### T-012 · Auto-Resolution for Non-Choice Events
**Status:** ✅ Confirmed (Iteration 3)
**Verdict:** Player didn't notice auto-boarding, which means it worked silently — but needs better communication.

### T-013 · Command Dashboard (replacing Urgency Strip)
**Status:** 📋 Designed — ready to implement in Iteration 4

Combining the urgency strip, log, and dock event response into a single always-visible feed at the top of the screen. Accept/Ignore buttons live in the feed. Log flows below live events in the same column. Everything the player needs to respond to is in one place without scrolling.

### T-014 · Narrative Identity (Eridu-7, Precursors, Empty Station)
**Status:** 📋 Designed — implementation begins in Iteration 4 with opening logs and terminology

The game's identity is now: a research station orbiting a world dense with alien ruins. The player's crew arrives to find the previous team missing. The mission is reconstruction and discovery, not survival.

### T-015 · Credit Economy (Grants + Artifact Sales)
**Status:** 📋 Designed — artifact sales mechanic not yet implemented

### T-016 · Scanning for Mission Opportunities
**Status:** 📋 Designed conceptually — needs placement decision before implementation

### T-017 · Esoteric Lettering for Locked Research
**Status:** 📋 Designed — implement alongside Research panel iteration

### T-018 · Repeatable Buildings (Landing Crafts, Crew Quarters in Station panel)
**Status:** 📋 Designed — Crew Quarters to move to Station panel; Landing Craft to replace Second Shuttle research

---

## Open Questions

| # | Question | Context |
|---|----------|---------|
| OQ-01 | Artifact sale rate — fixed or variable? | Credits economy |
| OQ-02 | Do research completions increase grant income? | Credits economy |
| OQ-03 | Where does scanning live — building, research, or action? | Scanning mechanic |
| OQ-04 | How many log entries visible in the feed? | Dashboard design |
| OQ-05 | Should opening logs include crew voices, or stay system-voice only? | Narrative |
| OQ-06 | What is the precursor script cipher? Which Unicode block? | Esoteric lettering |
| OQ-07 | Landing Craft cost — should it scale like Crew Quarters? | Building system |
| OQ-08 | What buildings come after the Research Lab chain? | Progression |
| OQ-09 | Should the Warp Beacon win condition be reframed narratively? | Story |
| OQ-10 | Last entry from the previous crew — shown in opening log? | Narrative |

---

## Discarded

### Power as a meaningful resource
**Discarded Iteration 3:** Always at 100%, no strategic depth, Engineer role served nothing. Removed entirely.

### Reputation system
**Discarded Iteration 3:** No mechanics attached. Removed.

### Threshold-based unlocks (30 parts → Surface Ops, 1 mission → Dock)
**Discarded Iteration 3:** Replaced by building-based progression. Player agency over unlocks.

---

## Iteration History

| # | Date | Key Changes | Verdict |
|---|------|-------------|---------|
| 1 | 2026-04-16 | Initial prototype | First playtest |
| 2 | 2026-04-16 | Resource classification, objectives, urgency strip, panel summaries, reward preview | Colours confirmed; objectives needed narrative voice |
| 3 | 2026-04-17 | Building system, power removed, auto-resolve events, immersive objectives, urgency bars, coloured summaries | Two tracks confirmed; credits slow; dashboard direction set |
| 4 | TBD | Command dashboard, narrative identity, repeatable buildings, credit economy | — |
