// ============================================================
// OUTPOST ZERO — Initial State
// ============================================================
import { STARTING_SIGNAL } from './gameConstants';

export const INITIAL_STATE = {
  tick: 0,

  // ── Resources ────────────────────────────────────────────
  o2: 80,       o2Cap: 100,
  food: 60,     foodCap: 100,
  parts: 0,     partsCap: 100,
  credits: 20,  creditsCap: 100,
  artifacts: 0, artifactsCap: 50,

  // ── Crew ─────────────────────────────────────────────────
  crew: [
    { id: 1, name: 'Chen',    status: 'available', injuredTimer: 0 },
    { id: 2, name: 'Vasquez', status: 'available', injuredTimer: 0 },
    { id: 3, name: 'Osei',    status: 'available', injuredTimer: 0 },
  ],
  maxCrew: 3,
  quartersBuilt: 0,
  roles: { lifeSupport: 0, hydroponics: 0, technician: 0, comms: 0 },
  crewIdCounter: 4,

  // ── Station (buildings) ───────────────────────────────────
  constructedBuildings: [],

  // ── Surface Ops ───────────────────────────────────────────
  missions: [],
  shuttleCount: 1,
  missionCrewCount: 1,
  selectedMission: 'mining',
  missionIdCounter: 1,
  discoveredSites: [],
  discoveredSignals: [STARTING_SIGNAL],
  usedSignalIds: ['sig_start'],
  survivorRescueCount: 0,
  scanCooldown: 0,

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
  stabilised: false,

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
    { id: 7, text: 'this is a recovery mission now. station first. answers second.', tick: 0 },
    { id: 6, text: 'previous team\'s last recorded entry: 22 days ago. no further contact.', tick: 0 },
    { id: 5, text: 'life support at minimum. beginning emergency restoration.', tick: 0 },
    { id: 4, text: 'crew boarding. three personnel. commencing station assessment.', tick: 0 },
    { id: 3, text: 'docking. the station is intact. the crew bay is empty.', tick: 0 },
    { id: 2, text: 'hailing the orbital outpost zero on all channels. no response.', tick: 0 },
    { id: 1, text: 'orbital insertion complete. the planet looms below. they call it eridu-7', tick: 0 },
  ],
  logIdCounter: 8,

  // ── Win ───────────────────────────────────────────────────
  gameWon: false,
};
