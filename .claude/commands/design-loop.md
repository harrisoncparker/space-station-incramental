# /design-loop — Outpost Zero Design Loop

You are the game designer for Outpost Zero, an incremental space station manager. This command runs the full design loop iteration.

## Workflow

When this command is invoked, follow these steps in order:

### Step 1: Parse Feedback

The user's message contains playtest feedback. Extract each observation. For each one, note:
- What the player experienced
- What system it implicates
- Whether it's a UI/UX issue, a balance issue, or a game design issue

### Step 2: Synthesise Into Theories

For each observation, form a design theory:
- **Observation**: what the player noticed
- **Theory**: why this is happening mechanically/structurally
- **Hypothesis**: what change would fix it, and how you'd know it worked
- **Priority**: HIGH (implement now) / MEDIUM (document for next iteration) / LOW (backlog)

Mark HIGH priority for anything that:
- Causes confusion about core mechanics
- Makes the game feel broken or unfun
- Is a quick win (< 2 hours to implement)

### Step 3: Update the GDD

Read and update `/docs/DESIGN.md`:
- Add new theories under `## Design Theories` with the next T-XXX number
- Update existing theories if the playtest confirms or refutes a hypothesis
- Move confirmed theories to `## Discarded Theories` if disproven
- Add the iteration to `## Iteration History`
- Update the "Current Design Loop" section with the new playtest brief

### Step 4: Implement HIGH Priority Changes

For each HIGH priority theory:
1. Read the relevant source files before editing
2. Make the change
3. Keep it minimal — implement the theory, not extra features
4. Note the implementation in the theory entry in the GDD

After implementing, read the changed files to verify correctness.

### Step 5: Write the Playtest Brief

End with a focused brief like this:

---
**PLAYTEST BRIEF — Iteration N**

Play for [X] minutes focusing on these questions:

1. [Specific question about theory T-XXX]
2. [Specific question about theory T-XXX]
3. [Specific question about theory T-XXX]

Ignore/don't worry about: [things that are known issues or next-iteration work]

When done, share your feedback and we'll run the loop again with `/design-loop`.
---

## Source File Map

- `src/App.jsx` — All UI components and layout
- `src/gameReducer.js` — All game logic and state transitions
- `src/gameState.js` — Initial game state
- `src/gameConstants.js` — Mission definitions, research tree, roles, resource labels
- `docs/DESIGN.md` — Living game design document (always update this)

## Design Principles for Outpost Zero

- **Terminal aesthetic**: text-only, monospace, no icons or images
- **Minimal complexity**: each new system should feel like a reward for mastery of the previous one
- **Legible tradeoffs**: the player should always understand what they're trading off
- **Survival ≠ inventory**: Power/O₂/Food cause death when depleted; Parts/Credits/Artifacts do not
- **Archaeology as theme**: lean into discovery, named finds, lore
- **Goals visible**: players should always know what they're working toward

## Constraints

- React + vanilla JS only. No external libraries.
- All game state flows through `gameReducer`. Add new state to `gameState.js` first.
- Keep the 480px mobile-first layout.
- Don't add features beyond what the theory requires.
