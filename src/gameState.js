// ============================================================
// OUTPOST ZERO — Initial State
// ============================================================

export const INITIAL_STATE = {
  tick: 0,

  // ── Resources ────────────────────────────────────────────
  power: 50,    powerCap: 100,
  o2: 80,       o2Cap: 100,
  food: 60,     foodCap: 100,
  parts: 0,     partsCap: 100,
  credits: 20,  creditsCap: 500,
  artifacts: 0, artifactsCap: 50,

  // ── Crew ─────────────────────────────────────────────────
  crew: [
    { id: 1, name: 'Chen',    status: 'available', injuredTimer: 0 },
    { id: 2, name: 'Vasquez', status: 'available', injuredTimer: 0 },
    { id: 3, name: 'Osei',    status: 'available', injuredTimer: 0 },
  ],
  maxCrew: 3,      // tight from the start — build quarters to expand
  quartersBuilt: 0,
  roles: { engineer: 0, lifeSupport: 1, hydroponics: 1, technician: 0, comms: 0 },
  crewIdCounter: 4,

  // ── Surface Ops ───────────────────────────────────────────
  missions: [],          // active missions in flight
  shuttleCount: 1,
  missionCrewCount: 1,   // UI: how many crew queued for next mission
  selectedMission: 'mining',
  missionIdCounter: 1,

  // ── Dock ─────────────────────────────────────────────────
  dockEvents: [],        // live incoming events
  nextDockEventIn: 65,
  outgoingDeliveries: [],
  eventIdCounter: 1,

  // ── Research ─────────────────────────────────────────────
  completedResearch: [], // array of research IDs

  // ── Progression tracking ──────────────────────────────────
  totalPartsCollected: 0,
  totalMissionsCompleted: 0,
  reputation: 0,

  // ── Section unlock/open state ─────────────────────────────
  unlocked: {
    surfaceOps: false,
    dock: false,
    research: false,
  },
  open: {
    status: true,
    crew: true,
    surfaceOps: false,
    dock: false,
    research: false,
    log: true,
  },
  lockedSections: {},   // sectionId → remaining lock ticks

  // ── Log ───────────────────────────────────────────────────
  log: [
    { id: 1, text: 'outpost zero online. systems nominal.', tick: 0 },
    { id: 2, text: 'life support active. crew reports ready.', tick: 0 },
  ],
  logIdCounter: 3,

  // ── Win ───────────────────────────────────────────────────
  gameWon: false,
};
