// ============================================================
// OUTPOST ZERO — Initial State
// ============================================================

export const INITIAL_STATE = {
  tick: 0,

  // ── Resources ────────────────────────────────────────────
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
  maxCrew: 3,
  quartersBuilt: 0,
  roles: { lifeSupport: 1, hydroponics: 1, technician: 0, comms: 0 },
  crewIdCounter: 4,

  // ── Station (buildings) ───────────────────────────────────
  constructedBuildings: [],

  // ── Surface Ops ───────────────────────────────────────────
  missions: [],
  shuttleCount: 1,
  missionCrewCount: 1,
  selectedMission: 'mining',
  missionIdCounter: 1,

  // ── Dock ─────────────────────────────────────────────────
  dockEvents: [],
  nextDockEventIn: 65,
  outgoingDeliveries: [],
  eventIdCounter: 1,

  // ── Research ─────────────────────────────────────────────
  completedResearch: [],

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
    station: true,
    crew: true,
    surfaceOps: false,
    dock: false,
    research: false,
    log: true,
  },
  lockedSections: {},

  // ── Log ───────────────────────────────────────────────────
  log: [
    { id: 1, text: 'outpost zero online. systems nominal.', tick: 0 },
    { id: 2, text: 'life support active. crew reports ready.', tick: 0 },
  ],
  logIdCounter: 3,

  // ── Win ───────────────────────────────────────────────────
  gameWon: false,
};
