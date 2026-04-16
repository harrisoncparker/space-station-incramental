# Outpost Zero — Living Game Design Document

> This document is a working record of design theories, their status, and playtest findings.
> Updated each design loop iteration. Do not edit manually — use `/design-loop` to process feedback.

---

## Current Design Loop: Iteration 2

**Playtest date:** 2026-04-16
**Status:** Changes implemented. Awaiting playtest feedback.

### Playtest Brief (Iteration 2)

Play the game with these specific questions in mind:

1. **Resource clarity** — Do Parts, Credits, and Artifacts feel clearly separate from Power/O₂/Food? Does the dashboard feel less noisy?
2. **Panel summaries** — Can you keep panels collapsed and still feel informed? Does the summary line in each header give you enough at-a-glance info?
3. **Urgency strip** — Do you notice the alert bar at the top when a mission is running or a dock event arrives? Does it reduce missed dock events?
4. **Objectives** — Do the listed objectives help orient you? Do they feel achievable? Do they ever feel wrong or misleading?
5. **Mission rewards** — Is it now clear that sending more crew gets better rewards?

---

## Design Theories

### T-001 · Resource Dual Classification
**Status:** ✅ Implemented (Iteration 2)

**Observation:** Credits flash warning indicators when low, but low credits isn't dangerous — it just means you can't buy things. Same for Parts (low = slow) and Artifacts (low = can't research). Only Power, O₂, and Food cause crew death.

**Theory:** Treating survival resources (Power, O₂, Food) differently from inventory resources (Parts, Credits, Artifacts) will reduce UI noise and help players correctly prioritise what needs attention.

**Hypothesis:** Players will feel less overwhelmed by warning signals and will correctly identify actual emergencies vs. "I'm just broke."

**Implementation:** ResourceBar accepts `isSurvival` prop. Survival resources use warning colours (amber/red) and pulse animation at low levels. Inventory resources use a neutral blue colour with no pulse.

---

### T-002 · Collapsed Panel Summaries
**Status:** ✅ Implemented (Iteration 2)

**Observation:** Players want to collapse panels to reduce clutter but lose all information when they do.

**Theory:** Showing a one-line summary in each panel header when collapsed lets players keep the UI compact without going blind.

**Hypothesis:** Players will collapse panels more and feel less stressed about missing information.

**Implementation:** Panel component accepts `summary` prop, shown inline in header when closed.

---

### T-003 · Time-Critical Urgency Strip
**Status:** ✅ Implemented (Iteration 2)

**Observation:** Dock events expire in 20 seconds and are easy to miss if the Dock panel is collapsed. Mission return timers are buried inside Surface Ops.

**Theory:** A persistent strip between the header and panels showing active missions and dock events (especially urgent ones) will surface time-sensitive information regardless of panel state.

**Hypothesis:** Players will miss fewer dock events and feel more in-control of time-pressure moments.

**Implementation:** `ActiveAlerts` strip always rendered when there are active missions or dock events. Dock events flash red when ≤8s remaining.

---

### T-004 · Visible Objectives
**Status:** ✅ Implemented (Iteration 2)

**Observation:** Player reported "the game lacks goals — I want to feel like I'm working towards something." No short- or medium-term goals are surfaced to the player. Progression milestones exist in the reducer but are invisible.

**Theory:** Displaying 1–3 contextual objectives derived from current game state will give the player clear direction and a sense of progress.

**Hypothesis:** Players will have clearer intent at each phase of the game and spend less time wondering what to do next.

**Implementation:** `ObjectivesStrip` below header, computed from game state. Shows current milestone, next unlock target, and a research/build goal.

---

### T-005 · Mission Crew Reward Clarity
**Status:** ✅ Implemented (Iteration 2)

**Observation:** Player asked "do I get more resources if I send more people?" — this mechanic exists but is invisible in the UI.

**Theory:** Showing estimated rewards per crew count in the mission selector will make the crew/reward tradeoff legible and encourage strategic crew allocation.

**Implementation:** Mission selector shows reward preview that updates as crew count changes.

---

### T-006 · Power as a Meaningful Resource
**Status:** 📋 Theory — Not Yet Implemented

**Observation:** Power constantly caps at 100. Base generation (+2.0/s) alone fills the cap. Players have no reason to assign engineers and no reason to care about power as a system.

**Theory:** Power should be a constrained and strategically interesting resource. Options:
- A. **Power consumers**: Station modules (research terminal, dock beacon, life support upgrades) draw power. Engineers become critical for enabling those systems.
- B. **Reduced base generation**: Set base to +0.5/s so engineers matter from the start.
- C. **Power grid events**: Occasional power spikes/outages that require engineer headcount to resolve.

**Recommended direction:** Combine B + A. Reduce base power to +0.5/s. As the player builds modules, those modules draw power, creating an ongoing tension between engineer allocation and other roles.

**Hypothesis:** Players will have a reason to assign engineers and actively manage power as a resource.

**Risk:** If power scarcity is too punishing early, it may compound O₂/Food stress in an unfun way. Test carefully.

---

### T-007 · Archaeology Theme Depth
**Status:** 📋 Theory — Not Yet Implemented

**Observation:** Player noted the game "seems to become about archaeology" but it "feels underdeveloped and a bit of a grind." Digs just produce numbers; there's no narrative or variety.

**Theory:** Leaning into the archaeology theme with discoverable lore, named artifacts, and a "field journal" will make the mid-game feel like genuine exploration rather than farming.

**Proposed mechanics:**
- Named artifact types (Ancient Navigation Chip, Crystalline Data Core, etc.) with short discovery logs
- A "Discoveries" section in the log showing notable finds
- Rare dig events: "The crew uncovers an intact structure — requesting additional survey time." (Extended mission for big reward)
- Each research tech feels like it's derived from a specific discovery

**Hypothesis:** Players will feel more invested in running digs and research will feel like it has narrative weight.

---

### T-008 · Staged Complexity Onboarding
**Status:** 📋 Theory — Not Yet Implemented

**Observation:** Player felt overwhelmed at the start (too much visible immediately) then under-challenged later (mastered everything, got bored). The complexity curve is flat rather than escalating.

**Theory:** The game should start with 2 crew, only survival resources visible, and no crew panel beyond role assignment. Systems should unlock one at a time in response to concrete actions, not just timers.

**Proposed progression gates:**
- Start: 2 crew, only Power/O₂/Food shown. No parts visible yet.
- First milestone: Assign all crew to roles → "systems nominal" → Parts resource appears, Technician role appears
- Second milestone: Accumulate 30 parts → Surface Ops unlock (current)
- Third milestone: Complete first mission → Dock unlock (current)
- New milestone: Reach 5 crew → Station Construction panel unlocks (see T-010)

**Hypothesis:** Each new system feels like a reward, and the player spends time mastering each layer before the next arrives.

**Risk:** Hiding content early may frustrate experienced players. Consider a "veteran mode" with everything unlocked from start.

---

### T-009 · Station Construction Expansion
**Status:** 📋 Theory — Not Yet Implemented

**Observation:** "I feel like there should be more that I can build to upgrade my station." Currently only Crew Quarters can be built. This is a classic idle game affordance the player expects.

**Theory:** A dedicated "Construct" tab (or expand Crew tab) with 5–8 buildable modules will give players meaningful agency in customising their station and create a more satisfying mid-game progression loop.

**Proposed modules:**
| Module | Cost | Effect |
|--------|------|--------|
| Solar Array | 30 parts · 20 credits | +1.0 Power/s base |
| O₂ Scrubber | 25 parts · 20 credits | −15% O₂ consumption |
| Hydroponics Bay | 35 parts · 25 credits | +0.4 Food/s base (stackable ×2) |
| Storage Expansion | 40 parts · 30 credits | +50 to all resource caps |
| Repair Bay | 50 parts · 40 credits | Halves crew injury recovery time |
| Signal Booster | 30 parts · 50 credits | +50% dock event frequency |
| Shuttle Bay Ext. | 60 parts · 50 credits | Required for second shuttle (replaces research?) |

**Hypothesis:** Players will feel more invested in their station and have clearer mid-game goals beyond "keep running digs."

---

### T-010 · Achievement-Based Unlocks
**Status:** 📋 Theory — Not Yet Implemented

**Observation:** Player felt progression "doesn't increase much" after initial unlocks. The current system unlocks sections by thresholds (30 parts, 1 mission) but doesn't celebrate or explain these moments.

**Theory:** Frame unlocks as explicit achievements with a moment of recognition. "You've done X — this unlocks Y." Show a brief unlock notification rather than just auto-opening a panel.

**Proposed implementation:**
- Unlock notifications appear as a prominent log entry with a special style
- The objectives strip updates to acknowledge the milestone
- Each unlock has a name/title: "SURFACE ACCESS GRANTED", "DOCK CLEARANCE OBTAINED"

---

## Discarded Theories

*(none yet)*

---

## Iteration History

| Iteration | Date | Key Changes | Verdict |
|-----------|------|-------------|---------|
| 1 | 2026-04-16 | Initial prototype | First playtest complete |
| 2 | 2026-04-16 | T-001 through T-005 | Awaiting playtest |
