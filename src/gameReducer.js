// ============================================================
// OUTPOST ZERO — Pure Game Reducer
// ============================================================
import {
  CREW_NAME_POOL, MISSIONS, ANOMALY_MISSION, RESEARCH_TREE,
  QUARTERS_BASE_COST, QUARTERS_SCALE,
} from './gameConstants';

// ── Helpers ──────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function addLog(s, text) {
  const id = s.logIdCounter;
  return {
    ...s,
    logIdCounter: id + 1,
    log: [{ id, text, tick: s.tick }, ...s.log].slice(0, 8),
  };
}

function pickName(usedNames) {
  const avail = CREW_NAME_POOL.filter(n => !usedNames.includes(n));
  if (!avail.length) return `Crew-${Math.floor(Math.random() * 999)}`;
  return avail[Math.floor(Math.random() * avail.length)];
}

function totalAssigned(roles) {
  return Object.values(roles).reduce((a, b) => a + b, 0);
}

function crewOnMission(missions) {
  return missions.reduce((s, m) => s + m.crewCount, 0);
}

function availableCrew(state) {
  const injured = state.crew.filter(c => c.status === 'injured').length;
  return state.crew.length - totalAssigned(state.roles) - crewOnMission(state.missions) - injured;
}

// Compute all resource rates given current state (used in tick + display)
export function computeRates(s) {
  const R = s.completedResearch;
  const roles = s.roles;
  const alive = s.crew.length;
  const injured = s.crew.filter(c => c.status === 'injured').length;

  let powerRate = 2.0 + roles.engineer * 1.0;
  if (R.includes('fusionCore')) powerRate *= 1.8;

  const o2Mult = R.includes('efficientRecycling') ? 0.8 : 1.0;
  const o2Consume = (alive * 0.12 + injured * 0.12) * o2Mult;
  const o2Rate = roles.lifeSupport * 0.5 - o2Consume;

  const foodConsume = alive * 0.08 + injured * 0.08;
  const foodProd = roles.hydroponics * 0.3 * (R.includes('advancedHydroponics') ? 1.5 : 1.0);
  const foodRate = foodProd - foodConsume;

  let partsRate = roles.technician * 0.2;
  if (R.includes('drillUpgrades')) partsRate *= 1.5;

  const creditsRate = roles.comms * 0.05;

  return { powerRate, o2Rate, foodRate, partsRate, creditsRate };
}

// Generate a dock event
function genDockEvent(s) {
  const id = s.eventIdCounter;
  const hasRoom = s.crew.length < s.maxCrew;
  // Migrants only appear when quarters are available; weight toward them when there's room
  const pool = ['freighter','freighter','drone','drone','inspector','distress'];
  if (hasRoom) { pool.push('migrant','migrant','migrant','refugee'); }
  const type = pool[Math.floor(Math.random() * pool.length)];
  const base = { id, type, timer: 20, eventIdCounter: s.eventIdCounter + 1 };

  if (type === 'freighter') {
    const resources = ['o2','food','parts'];
    const res = resources[Math.floor(Math.random() * resources.length)];
    const amount = 15 + Math.floor(Math.random() * 20);
    const cost = 10 + Math.floor(Math.random() * 15);
    return { ...base, res, amount, cost,
      title: 'trade freighter requesting dock.',
      desc: `offers ${amount} ${res} for ${cost} credits.` };
  }
  if (type === 'refugee') {
    const count = 1 + (Math.random() < 0.3 ? 1 : 0);
    return { ...base, count,
      foodCost: count * 15, o2Cost: count * 8,
      title: 'refugee ship requesting asylum.',
      desc: `${count} survivor(s) — costs ${count*15} food + ${count*8} O₂.` };
  }
  if (type === 'drone') {
    const resources = ['power','o2','food','parts','credits'];
    const res = resources[Math.floor(Math.random() * resources.length)];
    const amount = 8 + Math.floor(Math.random() * 15);
    return { ...base, res, amount,
      title: 'supply drone inbound.',
      desc: `free delivery: ${amount} ${res}.` };
  }
  if (type === 'inspector') {
    const targets = ['crew','surfaceOps','dock'];
    const section = targets[Math.floor(Math.random() * targets.length)];
    return { ...base, section, lockDuration: 30,
      title: 'corporate inspector inbound.',
      desc: `audit in progress. ${section} locked for 30s.` };
  }
  if (type === 'migrant') {
    const name = pickName(s.crew.map(c => c.name));
    const flavors = [
      `${name} is drifting in on a salvage vessel. seeking work.`,
      `${name} hailing from the outer belt. requests permission to board.`,
      `${name} arrived via transit shuttle. looking for a berth.`,
      `${name} was crew on a decommissioned freighter. wants aboard.`,
    ];
    return { ...base, crewName: name,
      title: `${name} requests permission to board.`,
      desc: flavors[Math.floor(Math.random() * flavors.length)] };
  }
  // distress
  return { ...base,
    foodCost: 15, o2Cost: 10,
    title: 'distress signal detected.',
    desc: 'help costs 15 food + 10 O₂. ignoring gains reputation.' };
}

// ── Main Reducer ──────────────────────────────────────────────

export function gameReducer(state, action) {
  switch (action.type) {

    // ── TICK ────────────────────────────────────────────────
    case 'TICK': {
      let s = { ...state, tick: state.tick + 1 };
      const { powerRate, o2Rate, foodRate, partsRate, creditsRate } = computeRates(s);

      // Apply resource rates
      const newParts = clamp(s.parts + partsRate, 0, s.partsCap);
      s = {
        ...s,
        power:   clamp(s.power   + powerRate,   0, s.powerCap),
        o2:      clamp(s.o2      + o2Rate,      0, s.o2Cap),
        food:    clamp(s.food    + foodRate,    0, s.foodCap),
        parts:   newParts,
        credits: clamp(s.credits + creditsRate, 0, s.creditsCap),
        totalPartsCollected: s.totalPartsCollected + Math.max(0, newParts - s.parts),
      };

      // Crew death from resource deprivation (one per 10 ticks)
      if ((s.o2 <= 0 || s.food <= 0) && s.crew.length > 0 && s.tick % 10 === 0) {
        const killer = s.o2 <= 0 ? 'O₂ deprivation' : 'starvation';
        const dead = s.crew[s.crew.length - 1];
        s = { ...s, crew: s.crew.slice(0, -1) };
        s = addLog(s, `${dead.name} lost to ${killer}.`);
        // Trim over-assigned roles
        let excess = totalAssigned(s.roles) - (s.crew.length - crewOnMission(s.missions));
        if (excess > 0) {
          const newRoles = { ...s.roles };
          for (const r of ['comms','technician','hydroponics','lifeSupport','engineer']) {
            while (newRoles[r] > 0 && excess > 0) { newRoles[r]--; excess--; }
          }
          s = { ...s, roles: newRoles };
        }
      }

      // Injury timers
      s = {
        ...s,
        crew: s.crew.map(c => {
          if (c.status !== 'injured') return c;
          const t = c.injuredTimer - 1;
          return t <= 0 ? { ...c, status: 'available', injuredTimer: 0 }
                       : { ...c, injuredTimer: t };
        }),
      };

      // Mission timers
      const done = [];
      const active = [];
      for (const m of s.missions) {
        if (m.timer <= 1) done.push(m);
        else active.push({ ...m, timer: m.timer - 1 });
      }
      s = { ...s, missions: active };

      for (const m of done) {
        const def = m.type === 'anomaly' ? ANOMALY_MISSION : MISSIONS[m.type];
        const sr = Math.min(0.95, def.baseSuccess + (m.crewCount - 1) * 0.05);
        const success = Math.random() < sr;

        if (success) {
          const rw = def.getRewards(m.crewCount);
          s = {
            ...s,
            parts:     clamp(s.parts     + (rw.parts     || 0), 0, s.partsCap),
            food:      clamp(s.food      + (rw.food      || 0), 0, s.foodCap),
            credits:   clamp(s.credits   + (rw.credits   || 0), 0, s.creditsCap),
            artifacts: clamp(s.artifacts + (rw.artifacts || 0), 0, s.artifactsCap),
            totalMissionsCompleted: s.totalMissionsCompleted + 1,
          };
          if (rw.newCrew && s.crew.length < s.maxCrew) {
            const name = pickName(s.crew.map(c => c.name));
            s = {
              ...s,
              crew: [...s.crew, { id: s.crewIdCounter, name, status: 'available', injuredTimer: 0 }],
              crewIdCounter: s.crewIdCounter + 1,
            };
            s = addLog(s, `shuttle returns. ${name} joins the crew.`);
          } else {
            s = addLog(s, `shuttle returns from ${def.name.toLowerCase()}. cargo secured.`);
          }
        } else {
          s = addLog(s, `shuttle returns from ${def.name.toLowerCase()}. mission failed.`);
          // 30% injury chance
          if (Math.random() < 0.3) {
            const avail = s.crew.filter(c => c.status === 'available');
            if (avail.length) {
              const victim = avail[Math.floor(Math.random() * avail.length)];
              s = {
                ...s,
                crew: s.crew.map(c => c.id === victim.id
                  ? { ...c, status: 'injured', injuredTimer: 60 } : c),
              };
              s = addLog(s, `${victim.name} injured on the dig. recovery in 60s.`);
            }
          }
        }
      }

      // Dock event countdown
      let nextIn = s.nextDockEventIn - 1;
      if (nextIn <= 0 && s.unlocked.dock) {
        if (s.dockEvents.length < 3) {
          const evt = genDockEvent(s);
          s = {
            ...s,
            dockEvents: [...s.dockEvents, evt],
            eventIdCounter: evt.eventIdCounter,
          };
          s = addLog(s, evt.title);
        }
        const commsBonus = s.roles.comms * 8;
        nextIn = Math.max(20, 45 + Math.floor(Math.random() * 46) - commsBonus);
      }
      s = { ...s, nextDockEventIn: nextIn };

      // Dock event timers
      const expiredEvts = [];
      const liveEvts = [];
      for (const e of s.dockEvents) {
        if (e.timer <= 1) expiredEvts.push(e);
        else liveEvts.push({ ...e, timer: e.timer - 1 });
      }
      s = { ...s, dockEvents: liveEvts };
      for (const e of expiredEvts) {
        s = addLog(s, `${e.type === 'freighter' ? 'freighter' : e.type} departs without response.`);
      }

      // Outgoing deliveries
      const arrived = [];
      const pending = [];
      for (const d of s.outgoingDeliveries) {
        if (d.timer <= 1) arrived.push(d);
        else pending.push({ ...d, timer: d.timer - 1 });
      }
      s = { ...s, outgoingDeliveries: pending };
      for (const d of arrived) {
        const capKey = d.res + 'Cap';
        s = { ...s, [d.res]: clamp(s[d.res] + d.amount, 0, s[capKey]) };
        s = addLog(s, `supply drop arrived. ${d.amount} ${d.res} delivered.`);
      }

      // Locked section timers
      const newLocked = {};
      for (const [sec, t] of Object.entries(s.lockedSections)) {
        if (t > 1) newLocked[sec] = t - 1;
        else s = addLog(s, `${sec} access restored.`);
      }
      s = { ...s, lockedSections: newLocked };

      // Unlock progression
      if (!s.unlocked.surfaceOps && s.totalPartsCollected >= 30) {
        s = {
          ...s,
          unlocked: { ...s.unlocked, surfaceOps: true },
          open: { ...s.open, surfaceOps: true },
        };
        s = addLog(s, 'surface ops online. shuttle ready for deployment.');
      }
      if (!s.unlocked.dock && s.totalMissionsCompleted >= 1) {
        s = {
          ...s,
          unlocked: { ...s.unlocked, dock: true },
          open: { ...s.open, dock: true },
        };
        s = addLog(s, 'dock systems active. awaiting incoming traffic.');
      }
      if (!s.unlocked.research && s.unlocked.dock) {
        s = {
          ...s,
          unlocked: { ...s.unlocked, research: true },
          open: { ...s.open, research: true },
        };
        s = addLog(s, 'research terminal online. knowledge is power.');
      }

      return s;
    }

    // ── ASSIGN ROLE ─────────────────────────────────────────
    case 'ASSIGN_ROLE': {
      const { role, delta } = action;
      const newCount = state.roles[role] + delta;
      if (newCount < 0) return state;
      // Can't assign more than available crew
      const avail = availableCrew(state);
      if (delta > 0 && avail <= 0) return state;
      if (delta > 0 && newCount > state.crew.length - crewOnMission(state.missions)) return state;
      return { ...state, roles: { ...state.roles, [role]: newCount } };
    }

    // ── BUILD QUARTERS ───────────────────────────────────────
    case 'BUILD_QUARTERS': {
      const q = state.quartersBuilt;
      const partsCost  = Math.ceil(QUARTERS_BASE_COST.parts   * Math.pow(QUARTERS_SCALE, q));
      const creditCost = Math.ceil(QUARTERS_BASE_COST.credits * Math.pow(QUARTERS_SCALE, q));
      if (state.parts < partsCost || state.credits < creditCost) return state;
      let s = {
        ...state,
        parts:         state.parts   - partsCost,
        credits:       state.credits - creditCost,
        quartersBuilt: q + 1,
        maxCrew:       state.maxCrew + 1,
      };
      return addLog(s, `crew quarters constructed. capacity now ${s.maxCrew}.`);
    }

    // ── SET MISSION TYPE ────────────────────────────────────
    case 'SET_MISSION': return { ...state, selectedMission: action.missionType };

    // ── SET MISSION CREW COUNT ──────────────────────────────
    case 'SET_MISSION_CREW': {
      const n = clamp(action.count, 1, 3);
      return { ...state, missionCrewCount: n };
    }

    // ── LAUNCH MISSION ──────────────────────────────────────
    case 'LAUNCH_MISSION': {
      const maxShuttles = state.completedResearch.includes('secondShuttle') ? 2 : 1;
      if (state.missions.length >= maxShuttles) return state;
      const n = state.missionCrewCount;
      if (availableCrew(state) < n) return state;
      const type = state.selectedMission;
      // Check anomaly requires research
      if (type === 'anomaly' && !state.completedResearch.includes('deepOrbitScanner')) return state;
      const def = type === 'anomaly' ? ANOMALY_MISSION : MISSIONS[type];
      const mission = {
        id: state.missionIdCounter,
        type, crewCount: n,
        timer: def.duration, totalTime: def.duration,
      };
      let s = {
        ...state,
        missions: [...state.missions, mission],
        missionIdCounter: state.missionIdCounter + 1,
      };
      return addLog(s, `shuttle launched on ${def.name.toLowerCase()}. ${n} crew aboard.`);
    }

    // ── DOCK EVENT ACCEPT ───────────────────────────────────
    case 'DOCK_ACCEPT': {
      const evt = state.dockEvents.find(e => e.id === action.id);
      if (!evt) return state;
      let s = { ...state, dockEvents: state.dockEvents.filter(e => e.id !== action.id) };

      if (evt.type === 'freighter') {
        if (s.credits < evt.cost) return addLog(s, 'not enough credits. freighter departs.');
        s = { ...s, credits: s.credits - evt.cost, [evt.res]: clamp(s[evt.res] + evt.amount, 0, s[evt.res + 'Cap']) };
        s = addLog(s, `trade complete. received ${evt.amount} ${evt.res}.`);
      } else if (evt.type === 'refugee') {
        if (s.food < evt.foodCost || s.o2 < evt.o2Cost) return addLog(s, 'insufficient resources. refugee ship turns away.');
        if (s.crew.length >= s.maxCrew) return addLog(s, 'crew quarters full. refugee ship turns away.');
        s = { ...s, food: s.food - evt.foodCost, o2: s.o2 - evt.o2Cost };
        let added = 0;
        while (s.crew.length < s.maxCrew && added < evt.count) {
          const name = pickName(s.crew.map(c => c.name));
          s = { ...s, crew: [...s.crew, { id: s.crewIdCounter, name, status: 'available', injuredTimer: 0 }], crewIdCounter: s.crewIdCounter + 1 };
          s = addLog(s, `${name} boards from the refugee ship.`);
          added++;
        }
      } else if (evt.type === 'drone') {
        s = { ...s, [evt.res]: clamp(s[evt.res] + evt.amount, 0, s[evt.res + 'Cap']) };
        s = addLog(s, `supply drone received. ${evt.amount} ${evt.res} secured.`);
      } else if (evt.type === 'inspector') {
        s = { ...s, lockedSections: { ...s.lockedSections, [evt.section]: evt.lockDuration } };
        s = addLog(s, `inspector boards. ${evt.section} locked for ${evt.lockDuration}s.`);
      } else if (evt.type === 'migrant') {
        if (s.crew.length >= s.maxCrew) return addLog(s, 'no quarters available. traveller turned away.');
        s = {
          ...s,
          crew: [...s.crew, { id: s.crewIdCounter, name: evt.crewName, status: 'available', injuredTimer: 0 }],
          crewIdCounter: s.crewIdCounter + 1,
        };
        s = addLog(s, `${evt.crewName} joins the crew.`);
      } else if (evt.type === 'distress') {
        if (s.food < evt.foodCost || s.o2 < evt.o2Cost) return addLog(s, 'insufficient resources. distress signal unanswered.');
        s = { ...s, food: s.food - evt.foodCost, o2: s.o2 - evt.o2Cost };
        s = addLog(s, 'distress signal answered. resources dispatched.');
      }
      return s;
    }

    // ── DOCK EVENT IGNORE ───────────────────────────────────
    case 'DOCK_IGNORE': {
      const evt = state.dockEvents.find(e => e.id === action.id);
      if (!evt) return state;
      let s = { ...state, dockEvents: state.dockEvents.filter(e => e.id !== action.id) };
      if (evt.type === 'distress') {
        s = { ...s, reputation: s.reputation + 10 };
        s = addLog(s, 'distress signal ignored. reputation logged.');
      } else {
        s = addLog(s, `${evt.type} dismissed.`);
      }
      return s;
    }

    // ── REQUEST SUPPLY DROP ─────────────────────────────────
    case 'REQUEST_SUPPLY': {
      const cost = 30;
      if (state.credits < cost) return state;
      const delivery = { res: action.res, amount: 25, timer: 60 };
      let s = {
        ...state,
        credits: state.credits - cost,
        outgoingDeliveries: [...state.outgoingDeliveries, delivery],
      };
      return addLog(s, `supply drop ordered. ${action.res} inbound in 60s.`);
    }

    // ── HIRE SPECIALIST ──────────────────────────────────────
    case 'HIRE_SPECIALIST': {
      const cost = 80;
      if (state.credits < cost) return state;
      if (state.crew.length >= state.maxCrew) return state;
      const name = pickName(state.crew.map(c => c.name));
      let s = {
        ...state,
        credits: state.credits - cost,
        crew: [...state.crew, { id: state.crewIdCounter, name, status: 'available', injuredTimer: 0, specialist: true }],
        crewIdCounter: state.crewIdCounter + 1,
      };
      return addLog(s, `specialist ${name} hired and en route.`);
    }

    // ── RESEARCH ────────────────────────────────────────────
    case 'RESEARCH': {
      const tech = RESEARCH_TREE[action.techId];
      if (!tech) return state;
      if (state.completedResearch.includes(tech.id)) return state;
      if (state.artifacts < tech.artifactCost || state.credits < tech.creditCost) return state;
      if (!tech.requires.every(r => state.completedResearch.includes(r))) return state;

      let s = {
        ...state,
        artifacts: state.artifacts - tech.artifactCost,
        credits:   state.credits   - tech.creditCost,
        completedResearch: [...state.completedResearch, tech.id],
      };

      // Apply immediate effects
      if (tech.id === 'secondShuttle')   s = { ...s, shuttleCount: 2 };
      if (tech.id === 'crewExpansion')   s = { ...s, maxCrew: s.maxCrew + 4 };
      if (tech.id === 'warpBeacon')      s = { ...s, gameWon: true };

      return addLog(s, `research complete: ${tech.name.toLowerCase()}.`);
    }

    // ── TOGGLE SECTION ──────────────────────────────────────
    case 'TOGGLE_SECTION':
      return { ...state, open: { ...state.open, [action.section]: !state.open[action.section] } };

    default:
      return state;
  }
}
