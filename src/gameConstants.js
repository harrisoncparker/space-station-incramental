// ============================================================
// OUTPOST ZERO — Game Constants
// ============================================================

export const TICK_MS = 1000;

export const CREW_NAME_POOL = [
  'Osei','Chen','Vasquez','Nakamura','Petrov','Abubakar','Kowalski',
  'Singh','Reyes','Müller','Tanaka','Kim','Williams','Al-Rashid',
  'Dubois','Ferreira','Johansson','Nguyen','Bakker','Özdemir','Park',
  'Ivanova','Santos','Fischer','Larsson','Lubo',
];

export const ROLES = [
  { id: 'lifeSupport', name: 'Life Support', prodDesc: '+0.5 O₂/s',      res: 'o2'    },
  { id: 'hydroponics', name: 'Hydroponics',  prodDesc: '+0.3 Food/s',    res: 'food'  },
  { id: 'technician',  name: 'Technician',   prodDesc: '+0.2 Parts/s',   res: 'parts' },
  { id: 'comms',       name: 'Comms',        prodDesc: '+0.05 Credits/s', res: null    },
];

// ── Buildings ─────────────────────────────────────────────────
// Buildings are the primary progression track: construct → unlock mechanic.
// Research is the secondary track: spend artifacts → improve existing mechanics.

export const BUILDINGS = {
  shuttleBay: {
    id: 'shuttleBay',
    name: 'Shuttle Bay',
    desc: 'Hangar for surface deployment vehicles.',
    flavor: 'we can reach the surface.',
    cost: { parts: 30 },
    unlocks: 'surfaceOps',
    requires: [],
  },
  commsArray: {
    id: 'commsArray',
    name: 'Comms Array',
    desc: 'Long-range communication and docking beacon.',
    flavor: 'we are no longer alone out here.',
    cost: { parts: 20, credits: 15 },
    unlocks: 'dock',
    requires: ['shuttleBay'],
  },
  researchLab: {
    id: 'researchLab',
    name: 'Research Lab',
    desc: 'Artifact analysis and technology development.',
    flavor: 'what did they leave behind?',
    cost: { parts: 30, credits: 25, artifacts: 5 },
    unlocks: 'research',
    requires: ['commsArray'],
  },
  storageModule: {
    id: 'storageModule',
    name: 'Storage Module',
    desc: 'Expanded capacity for all stored resources.',
    flavor: 'room to breathe.',
    cost: { parts: 40, credits: 25 },
    unlocks: null,
    effect: 'storageCap',
    requires: ['shuttleBay'],
  },
  signalBooster: {
    id: 'signalBooster',
    name: 'Signal Booster',
    desc: 'Amplifies the dock beacon signal range.',
    flavor: 'they can hear us now.',
    cost: { parts: 35, credits: 40 },
    unlocks: null,
    effect: 'dockFrequency',
    requires: ['commsArray'],
  },
  surfaceScanner: {
    id: 'surfaceScanner',
    name: 'Surface Scanner',
    desc: 'Deep-penetrating radar for locating Precursor sites.',
    flavor: 'something is down there. a lot of somethings.',
    cost: { parts: 25, credits: 20 },
    unlocks: null,
    effect: 'scanning',
    requires: ['shuttleBay'],
  },
};

// ── Precursor site pool ───────────────────────────────────────
// Discovered by scanning. Each is a one-time high-value mission.
// Sites cycle back into the pool once used.

export const SITE_POOL = [
  {
    id: 's01', name: 'Site 7-C',
    desc: 'Intact subterranean structure. Partial collapse on the eastern face.',
    baseSuccess: 0.80, risk: 'MED', duration: 90,
    getRewards: (n) => ({ artifacts: 5 + n * 2, credits: 20 + n * 8 }),
  },
  {
    id: 's02', name: 'Grid Reference 4-North',
    desc: 'Dense surface deposit concentration. High artifact yield expected.',
    baseSuccess: 0.80, risk: 'MED', duration: 90,
    getRewards: (n) => ({ artifacts: 4 + n * 2, credits: 25 + n * 6 }),
  },
  {
    id: 's03', name: 'The Spine',
    desc: 'A 40km ridge of interlocking Precursor architecture. Origin unclear.',
    baseSuccess: 0.75, risk: 'MED', duration: 100,
    getRewards: (n) => ({ artifacts: 6 + n, credits: 30 + n * 5 }),
  },
  {
    id: 's04', name: 'Resonance Point Alpha',
    desc: 'Low-level energy signature of unknown origin. Non-threatening, probably.',
    baseSuccess: 0.70, risk: 'HIGH', duration: 90,
    getRewards: (n) => ({ artifacts: 7 + n * 2, credits: 15 + n * 10 }),
  },
  {
    id: 's05', name: 'Subsurface Void B-7',
    desc: 'Scanner returns suggest an intact chamber 80 metres below the surface.',
    baseSuccess: 0.80, risk: 'MED', duration: 110,
    getRewards: (n) => ({ artifacts: 8 + n, credits: 20 + n * 7 }),
  },
  {
    id: 's06', name: 'The Archive',
    desc: 'Dense data-medium concentration. The previous team flagged this site.',
    baseSuccess: 0.75, risk: 'MED', duration: 90,
    getRewards: (n) => ({ artifacts: 6 + n * 3, credits: 10 + n * 5 }),
  },
  {
    id: 's07', name: 'Terminus Station',
    desc: 'Appears to be a transit hub of some kind. Scale is disorienting.',
    baseSuccess: 0.70, risk: 'HIGH', duration: 105,
    getRewards: (n) => ({ artifacts: 5 + n * 2, credits: 35 + n * 8 }),
  },
  {
    id: 's08', name: 'Signal Source 3',
    desc: 'Something is still transmitting down there. Short-range. Periodic.',
    baseSuccess: 0.65, risk: 'HIGH', duration: 90,
    getRewards: (n) => ({ artifacts: 9 + n * 2, credits: 25 + n * 6 }),
  },
  {
    id: 's09', name: 'The Trench',
    desc: 'A deep surface fracture exposing older strata. Multiple eras of activity.',
    baseSuccess: 0.80, risk: 'MED', duration: 95,
    getRewards: (n) => ({ artifacts: 7 + n * 2, credits: 20 + n * 7 }),
  },
  {
    id: 's10', name: 'Relay Platform',
    desc: 'A circular structure, possibly communicative in function. Still standing.',
    baseSuccess: 0.75, risk: 'MED', duration: 90,
    getRewards: (n) => ({ artifacts: 5 + n, credits: 40 + n * 10 }),
  },
  {
    id: 's11', name: 'Grid Reference 9-East',
    desc: 'High surface albedo anomaly. Possible exposed alloy deposit.',
    baseSuccess: 0.85, risk: 'LOW', duration: 80,
    getRewards: (n) => ({ artifacts: 4 + n, credits: 25 + n * 6, parts: 10 + n * 3 }),
  },
  {
    id: 's12', name: 'The Well',
    desc: 'A vertical shaft of unknown depth. Scanner returns nothing below 2km.',
    baseSuccess: 0.65, risk: 'HIGH', duration: 120,
    getRewards: (n) => ({ artifacts: 10 + n * 3, credits: 15 + n * 5 }),
  },
];

export const MISSIONS = {
  mining: {
    id: 'mining', name: 'Mining Run',
    desc: 'Ore/Parts from the surface',
    duration: 45, baseSuccess: 0.90, risk: 'LOW',
    getRewards: (n) => ({ parts: 15 + n * 5 }),
  },
  botanical: {
    id: 'botanical', name: 'Botanical Survey',
    desc: 'Food from surface flora',
    duration: 60, baseSuccess: 0.85, risk: 'LOW',
    getRewards: (n) => ({ food: 20 + n * 5 }),
  },
  archaeological: {
    id: 'archaeological', name: 'Archaeological Dig',
    desc: 'Credits + Artifacts from ruins',
    duration: 90, baseSuccess: 0.75, risk: 'MED',
    getRewards: (n) => ({ credits: 15 + n * 5, artifacts: 3 + n }),
  },
};

// ── Survivor signal pool ──────────────────────────────────────
// Discovered by scanning (mixed with precursor sites).
// Each is a one-time search-and-rescue mission with narrative outcomes.

export const SURVIVOR_SIGNAL_POOL = [
  {
    id: 'sig_01', name: 'Research Wing Transponder',
    desc: 'Repeating signal from the eastern research corridor. Manual origin — someone set this deliberately.',
    duration: 65,
  },
  {
    id: 'sig_02', name: 'East Ridge Survey Marker',
    desc: 'A survey beacon repurposed as a distress signal. Standard-issue station equipment.',
    duration: 80,
  },
  {
    id: 'sig_03', name: 'Camp Foxtrot Beacon',
    desc: 'Field camp designator transmitting on emergency band. The camp is not on any official manifest.',
    duration: 90,
  },
  {
    id: 'sig_04', name: 'Northern Excavation Post',
    desc: 'Signal origin is 4km north, near the dig perimeter. Intermittent — battery failing.',
    duration: 85,
  },
  {
    id: 'sig_05', name: 'Atmospheric Array Station 2',
    desc: 'One of the surface weather monitoring posts. Something is using its transmitter.',
    duration: 70,
  },
  {
    id: 'sig_06', name: 'Perimeter Post Seven',
    desc: 'Outer boundary marker, manually activated. Posts like this require a keycard to trigger.',
    duration: 75,
  },
  {
    id: 'sig_07', name: 'Emergency Shelter Bravo',
    desc: 'Pre-positioned emergency shelter, beacon active. Shelters are stocked for 30 days.',
    duration: 80,
  },
  {
    id: 'sig_08', name: 'Deep Dig Station Four',
    desc: 'Signal is coming from 60 metres below the surface. The dig shaft shows signs of recent use.',
    duration: 95,
  },
  {
    id: 'sig_09', name: 'Transit Corridor Seven',
    desc: "A maintenance tunnel connecting the station's outer modules. Signal is weak but steady.",
    duration: 70,
  },
  {
    id: 'sig_10', name: 'Surface Lab Omega',
    desc: 'Auxiliary research post, supposed to be decommissioned two years ago. Apparently not.',
    duration: 85,
  },
  {
    id: 'sig_11', name: 'Relay Station Kilo',
    desc: 'Communications relay on the southern plateau. Its antenna array is still active.',
    duration: 90,
  },
  {
    id: 'sig_12', name: 'Western Approach Beacon',
    desc: 'Landing approach marker, repurposed. The signal pattern matches a personal distress code.',
    duration: 75,
  },
  {
    id: 'sig_13', name: 'Archive Sublevel B',
    desc: "The station's lower archive level. No one was assigned here — and yet.",
    duration: 80,
  },
  {
    id: 'sig_14', name: 'Southern Ridge Repeater',
    desc: 'Signal booster station on the ridge line, 6km out. Something is sheltering near the equipment.',
    duration: 95,
  },
  {
    id: 'sig_15', name: 'Crawler Bay Delta',
    desc: 'The vehicle depot signal. Someone drove a crawler out there and stopped transmitting.',
    duration: 85,
  },
];

export const STARTING_SIGNAL = {
  id: 'sig_start',
  name: 'Sublevel 3 Beacon',
  desc: 'A weak repeating signal from beneath the lower access corridor. Human-band frequency. Close.',
  duration: 60,
};

export const ANOMALY_MISSION = {
  id: 'anomaly', name: 'Anomaly Scan',
  desc: 'Probe deep orbit anomalies — high risk, high reward',
  duration: 120, baseSuccess: 0.60, risk: 'HIGH',
  getRewards: (n) => ({ artifacts: 8 + n * 2, credits: 30 + n * 10 }),
};

export const RESEARCH_TREE = {
  efficientRecycling: {
    id: 'efficientRecycling', name: 'Efficient Recycling',
    desc: 'O₂ consumption -20%',
    tier: 1, artifactCost: 10, creditCost: 10, requires: [],
  },
  drillUpgrades: {
    id: 'drillUpgrades', name: 'Drill Upgrades',
    desc: 'Parts/s +50%',
    tier: 1, artifactCost: 10, creditCost: 10, requires: [],
  },
  advancedHydroponics: {
    id: 'advancedHydroponics', name: 'Advanced Hydroponics',
    desc: 'Food production +50%',
    tier: 2, artifactCost: 35, creditCost: 35,
    requires: ['efficientRecycling'],
  },
  secondShuttle: {
    id: 'secondShuttle', name: 'Second Shuttle',
    desc: 'Run 2 missions simultaneously',
    tier: 2, artifactCost: 35, creditCost: 35,
    requires: ['drillUpgrades'],
  },
  expeditionPlanning: {
    id: 'expeditionPlanning', name: 'Expedition Planning',
    desc: 'Mission duration -30%',
    tier: 3, artifactCost: 90, creditCost: 90,
    requires: ['advancedHydroponics'],
  },
  crewExpansion: {
    id: 'crewExpansion', name: 'Crew Expansion',
    desc: 'Max crew +4',
    tier: 3, artifactCost: 90, creditCost: 90,
    requires: ['secondShuttle'],
  },
  deepOrbitScanner: {
    id: 'deepOrbitScanner', name: 'Deep Orbit Scanner',
    desc: 'Unlocks anomaly missions',
    tier: 4, artifactCost: 200, creditCost: 200,
    requires: ['expeditionPlanning'],
  },
  warpBeacon: {
    id: 'warpBeacon', name: 'Warp Beacon',
    desc: 'Broadcast location — triggers finale',
    tier: 4, artifactCost: 200, creditCost: 200,
    requires: ['crewExpansion', 'deepOrbitScanner'],
  },
};

export const RESOURCE_LABELS = {
  o2: 'O₂', food: 'Food',
  parts: 'Parts', credits: 'Credits', artifacts: 'Artifacts',
};

export const QUARTERS_BASE_COST = { parts: 20, credits: 15 };
export const QUARTERS_SCALE = 1.15;
