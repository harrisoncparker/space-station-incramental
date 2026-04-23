// ============================================================
// OUTPOST ZERO — Pure Game Reducer
// ============================================================
import {
  CREW_NAME_POOL, MISSIONS, ANOMALY_MISSION, RESEARCH_TREE,
  BUILDINGS, SITE_POOL, SURVIVOR_SIGNAL_POOL,
  QUARTERS_BASE_COST, QUARTERS_SCALE, RESOURCE_LABELS,
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

// Queue multiple log entries with 1-second gaps between each.
// First entry fires immediately; subsequent entries are delayed by index ticks.
function addLogSequence(s, ...texts) {
  if (!texts.length) return s;
  s = addLog(s, texts[0]);
  const queued = texts.slice(1).map((text, i) => ({ text, delay: i }));
  return { ...s, logQueue: [...(s.logQueue || []), ...queued] };
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

  const o2Mult = R.includes('efficientRecycling') ? 0.8 : 1.0;
  const o2Consume = (alive * 0.12 + injured * 0.12) * o2Mult;
  const o2Rate = roles.lifeSupport * 0.5 - o2Consume;

  const foodConsume = alive * 0.08 + injured * 0.08;
  const foodProd = roles.hydroponics * 0.3 * (R.includes('advancedHydroponics') ? 1.5 : 1.0);
  const foodRate = foodProd - foodConsume;

  let partsRate = roles.technician * 0.2;
  if (R.includes('drillUpgrades')) partsRate *= 1.5;

  const creditsRate = roles.comms * 0.05;

  return { o2Rate, foodRate, partsRate, creditsRate };
}

// Generate a dock event
function genDockEvent(s) {
  const id = s.eventIdCounter;
  const hasRoom = s.crew.length < s.maxCrew;
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
    const resources = ['o2','food','parts','credits'];
    const res = resources[Math.floor(Math.random() * resources.length)];
    const amount = 8 + Math.floor(Math.random() * 15);
    return { ...base, res, amount,
      title: 'supply drone inbound.',
      desc: `free delivery: ${amount} ${res}.` };
  }
  if (type === 'inspector') {
    const targets = ['crew','surfaceOps','dock'];
    const section = targets[Math.floor(Math.random() * targets.length)];
    return { ...base, section, lockDuration: 30, autoAccept: true,
      title: 'corporate inspector inbound.',
      desc: `mandatory audit. ${section} locked for 30s.` };
  }
  if (type === 'migrant') {
    const name = pickName(s.crew.map(c => c.name));
    return { ...base, crewName: name, autoAccept: true,
      title: `${name} has boarded the station.`,
      desc: `${name} arrived looking for work. assigned to available berth.` };
  }
  // distress
  return { ...base,
    foodCost: 15, o2Cost: 10,
    title: 'distress signal detected.',
    desc: 'help costs 15 food + 10 O₂. ignoring gains reputation.' };
}

// Resolve a dock event (shared by auto-accept and manual accept)
function resolveEvent(s, evt) {
  if (evt.type === 'freighter') {
    if (s.credits < evt.cost) return addLog(s, 'not enough credits. freighter departs.');
    s = { ...s, credits: s.credits - evt.cost, [evt.res]: clamp(s[evt.res] + evt.amount, 0, s[evt.res + 'Cap']) };
    return addLog(s, `trade complete. received ${evt.amount} ${evt.res}.`);
  }
  if (evt.type === 'refugee') {
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
    return s;
  }
  if (evt.type === 'drone') {
    s = { ...s, [evt.res]: clamp(s[evt.res] + evt.amount, 0, s[evt.res + 'Cap']) };
    return addLog(s, `supply drone received. ${evt.amount} ${evt.res} secured.`);
  }
  if (evt.type === 'inspector') {
    s = { ...s, lockedSections: { ...s.lockedSections, [evt.section]: evt.lockDuration } };
    return addLog(s, `inspector boards. ${evt.section} locked for ${evt.lockDuration}s.`);
  }
  if (evt.type === 'migrant') {
    if (s.crew.length >= s.maxCrew) return addLog(s, 'no quarters available. traveller moved on.');
    s = {
      ...s,
      crew: [...s.crew, { id: s.crewIdCounter, name: evt.crewName, status: 'available', injuredTimer: 0 }],
      crewIdCounter: s.crewIdCounter + 1,
    };
    return addLog(s, `${evt.crewName} joins the crew.`);
  }
  if (evt.type === 'distress') {
    if (s.food < evt.foodCost || s.o2 < evt.o2Cost) return addLog(s, 'insufficient resources. distress signal unanswered.');
    s = { ...s, food: s.food - evt.foodCost, o2: s.o2 - evt.o2Cost };
    return addLog(s, 'distress signal answered. resources dispatched.');
  }
  return s;
}

// ── Main Reducer ──────────────────────────────────────────────

export function gameReducer(state, action) {
  switch (action.type) {

    // ── TICK ────────────────────────────────────────────────
    case 'TICK': {
      let s = {
        ...state,
        tick: state.tick + 1,
        scanCooldown: Math.max(0, state.scanCooldown - 1),
      };

      // Flush queued log entries whose delay has elapsed
      const readyLogs   = (s.logQueue || []).filter(l => l.delay <= 0);
      const pendingLogs = (s.logQueue || []).filter(l => l.delay > 0).map(l => ({ ...l, delay: l.delay - 1 }));
      s = { ...s, logQueue: pendingLogs };
      for (const l of readyLogs) s = addLog(s, l.text);
      const { o2Rate, foodRate, partsRate, creditsRate } = computeRates(s);

      // Apply resource rates
      const newParts = clamp(s.parts + partsRate, 0, s.partsCap);
      s = {
        ...s,
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
          for (const r of ['comms','technician','hydroponics','lifeSupport']) {
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
        // Signal missions: narrative outcomes only, never mechanical failure
        if (m.type === 'signal') {
          const survivalChance = Math.min(0.85, 0.40 + m.crewCount * 0.15);
          const survived = Math.random() < survivalChance;
          if (survived) {
            if (s.crew.length < s.maxCrew) {
              const name = pickName(s.crew.map(c => c.name));
              s = {
                ...s,
                crew: [...s.crew, { id: s.crewIdCounter, name, status: 'available', injuredTimer: 0 }],
                crewIdCounter: s.crewIdCounter + 1,
                survivorRescueCount: (s.survivorRescueCount || 0) + 1,
                totalMissionsCompleted: s.totalMissionsCompleted + 1,
              };
              s = addLog(s, `search team returns. survivor located — ${(m.signalName || 'signal source').toLowerCase()}. ${name} is aboard.`);
            } else {
              s = {
                ...s,
                survivorRescueCount: (s.survivorRescueCount || 0) + 1,
                totalMissionsCompleted: s.totalMissionsCompleted + 1,
              };
              s = addLog(s, `search team returns. survivor located — no available quarters.`);
            }
          } else {
            const failRoll = Math.random();
            if (failRoll < 0.40) {
              const amount = 3 + Math.floor(Math.random() * 4);
              s = { ...s, artifacts: clamp(s.artifacts + amount, 0, s.artifactsCap) };
              s = addLog(s, `search team returns. no survivor — only remains. recovered research equipment from the site. +${amount} artifacts.`);
            } else if (failRoll < 0.70) {
              const amount = 20 + Math.floor(Math.random() * 16);
              s = { ...s, food: clamp(s.food + amount, 0, s.foodCap) };
              s = addLog(s, `search team returns. false signal — previous crew stored emergency rations here. +${amount} food.`);
            } else {
              const amount = 15 + Math.floor(Math.random() * 11);
              s = { ...s, parts: clamp(s.parts + amount, 0, s.partsCap) };
              s = addLog(s, `search team returns. the signal was a disabled surface crawler — still transmitting. salvaged components. +${amount} parts.`);
            }
          }
          continue;
        }

        const def = m.type === 'anomaly' ? ANOMALY_MISSION
                  : m.type === 'site'    ? SITE_POOL.find(p => p.id === m.siteId)
                  :                        MISSIONS[m.type];
        if (!def) continue;
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
          const rewardStr = Object.entries(rw)
            .filter(([k]) => k !== 'newCrew' && (rw[k] || 0) > 0)
            .map(([k, v]) => `+${v} ${RESOURCE_LABELS[k] || k}`)
            .join(' · ');
          if (rw.newCrew && s.crew.length < s.maxCrew) {
            const name = pickName(s.crew.map(c => c.name));
            s = {
              ...s,
              crew: [...s.crew, { id: s.crewIdCounter, name, status: 'available', injuredTimer: 0 }],
              crewIdCounter: s.crewIdCounter + 1,
            };
            s = addLog(s, `${def.name.toLowerCase()} returns. ${name} joins the crew.`);
          } else {
            s = addLog(s, `${def.name.toLowerCase()} returns. ${rewardStr}.`);
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
          s = { ...s, eventIdCounter: evt.eventIdCounter };

          if (evt.autoAccept) {
            // Auto-resolve: inspectors and migrants don't wait for input
            s = resolveEvent(s, evt);
          } else {
            s = { ...s, dockEvents: [...s.dockEvents, evt] };
            s = addLog(s, evt.title);
          }
        }
        const commsBonus = s.roles.comms * 8;
        const baseDock = s.constructedBuildings.includes('signalBooster') ? 30 : 45;
        nextIn = Math.max(15, baseDock + Math.floor(Math.random() * 46) - commsBonus);
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

      // NOTE: No automatic unlock progression here.
      // All section unlocks happen through the BUILD action.

      return s;
    }

    // ── BUILD (station construction) ────────────────────────
    case 'BUILD': {
      const building = BUILDINGS[action.buildingId];
      if (!building) return state;
      if (state.constructedBuildings.includes(building.id)) return state;

      // Check prerequisites
      if (!building.requires.every(r => state.constructedBuildings.includes(r))) return state;

      // Check costs
      for (const [res, amount] of Object.entries(building.cost)) {
        if ((state[res] || 0) < amount) return state;
      }

      // Deduct costs
      let s = { ...state };
      for (const [res, amount] of Object.entries(building.cost)) {
        s = { ...s, [res]: s[res] - amount };
      }

      s = { ...s, constructedBuildings: [...s.constructedBuildings, building.id] };

      // Apply section unlock
      if (building.unlocks) {
        s = {
          ...s,
          unlocked: { ...s.unlocked, [building.unlocks]: true },
          open: { ...s.open, [building.unlocks]: true },
        };
      }

      // Apply building-specific effects
      if (building.effect === 'storageCap') {
        s = {
          ...s,
          o2Cap: s.o2Cap + 50,
          foodCap: s.foodCap + 50,
          partsCap: s.partsCap + 50,
          creditsCap: s.creditsCap + 250,
          artifactsCap: s.artifactsCap + 25,
        };
      }
      // signalBooster effect is applied in the dock event countdown (TICK)

      return addLog(s, `${building.name.toLowerCase()} constructed. ${building.flavor}`);
    }

    // ── ASSIGN ROLE ─────────────────────────────────────────
    case 'ASSIGN_ROLE': {
      const { role, delta } = action;
      const newCount = state.roles[role] + delta;
      if (newCount < 0) return state;
      const avail = availableCrew(state);
      if (delta > 0 && avail <= 0) return state;
      if (delta > 0 && newCount > state.crew.length - crewOnMission(state.missions)) return state;
      let s = { ...state, roles: { ...state.roles, [role]: newCount } };
      if (!state.stabilised && s.roles.lifeSupport >= 1 && s.roles.hydroponics >= 1) {
        s = { ...s, stabilised: true };
        s = addLogSequence(s,
          'life support and hydroponics online. the station will hold.',
          'the sublevel 3 beacon is still transmitting — someone is out there.'
        );
      }
      return s;
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

      let def, isSite = false, siteId = null, isSignal = false, signalId = null, signalName = null;
      if (type === 'anomaly') {
        if (!state.completedResearch.includes('deepOrbitScanner')) return state;
        def = ANOMALY_MISSION;
      } else if (type.startsWith('site_')) {
        const sid = type.slice(5);
        const site = state.discoveredSites.find(s => s.id === sid);
        if (!site) return state;
        def = SITE_POOL.find(p => p.id === sid);
        if (!def) return state;
        isSite = true;
        siteId = sid;
      } else if (type.startsWith('signal_')) {
        const sid = type.slice(7);
        const signal = (state.discoveredSignals || []).find(s => s.id === sid);
        if (!signal) return state;
        def = signal;
        isSignal = true;
        signalId = sid;
        signalName = signal.name;
      } else {
        def = MISSIONS[type];
      }
      if (!def) return state;

      const durMult = state.completedResearch.includes('expeditionPlanning') ? 0.7 : 1.0;
      const duration = Math.ceil(def.duration * durMult);

      const mission = {
        id: state.missionIdCounter,
        type: isSignal ? 'signal' : isSite ? 'site' : type,
        siteId,
        signalId,
        signalName,
        crewCount: n,
        timer: duration, totalTime: duration,
      };

      let s = {
        ...state,
        missions: [...state.missions, mission],
        missionIdCounter: state.missionIdCounter + 1,
        discoveredSites: isSite
          ? state.discoveredSites.filter(s => s.id !== siteId)
          : state.discoveredSites,
        discoveredSignals: isSignal
          ? (state.discoveredSignals || []).filter(s => s.id !== signalId)
          : (state.discoveredSignals || []),
        usedSignalIds: isSignal
          ? [...(state.usedSignalIds || []), signalId]
          : (state.usedSignalIds || []),
        selectedMission: (isSite || isSignal) ? 'mining' : state.selectedMission,
      };
      const launchMsg = isSignal
        ? `search team launched: ${def.name.toLowerCase()}. ${n} crew aboard.`
        : `shuttle launched: ${def.name.toLowerCase()}. ${n} crew aboard.`;
      return addLog(s, launchMsg);
    }

    // ── SCAN ────────────────────────────────────────────────
    case 'SCAN': {
      if (!state.constructedBuildings.includes('surfaceScanner')) return state;
      if (state.scanCooldown > 0) return state;
      if (state.parts < 5) return state;

      const sitesFull   = state.discoveredSites.length >= 3;
      const signalsFull = (state.discoveredSignals || []).length >= 3;
      if (sitesFull && signalsFull) return addLog(state, 'scanner queue full (max 3 sites, 3 signals).');

      const usedSiteIds  = state.discoveredSites.map(s => s.id);
      const usedSigIds   = state.usedSignalIds || [];
      const discSigIds   = (state.discoveredSignals || []).map(s => s.id);
      const availSites   = sitesFull ? [] : SITE_POOL.filter(s => !usedSiteIds.includes(s.id));
      const availSignals = signalsFull ? [] : SURVIVOR_SIGNAL_POOL.filter(
        s => !usedSigIds.includes(s.id) && !discSigIds.includes(s.id)
      );

      const combined = [
        ...availSites.map(s => ({ kind: 'site', data: s })),
        ...availSignals.map(s => ({ kind: 'signal', data: s })),
      ];
      if (!combined.length) return addLog(state, 'scan complete. nothing new detected.');

      const pick = combined[Math.floor(Math.random() * combined.length)];
      let s = { ...state, parts: state.parts - 5, scanCooldown: 90 };

      if (pick.kind === 'signal') {
        s = { ...s, discoveredSignals: [...(s.discoveredSignals || []), pick.data] };
        return addLog(s, `scan complete. distress signal detected: ${pick.data.name.toLowerCase()}.`);
      } else {
        s = { ...s, discoveredSites: [...s.discoveredSites, pick.data] };
        return addLog(s, `scan complete. site identified: ${pick.data.name.toLowerCase()}.`);
      }
    }

    // ── DOCK EVENT ACCEPT ───────────────────────────────────
    case 'DOCK_ACCEPT': {
      const evt = state.dockEvents.find(e => e.id === action.id);
      if (!evt) return state;
      let s = { ...state, dockEvents: state.dockEvents.filter(e => e.id !== action.id) };
      return resolveEvent(s, evt);
    }

    // ── DOCK EVENT IGNORE ───────────────────────────────────
    case 'DOCK_IGNORE': {
      const evt = state.dockEvents.find(e => e.id === action.id);
      if (!evt) return state;
      let s = { ...state, dockEvents: state.dockEvents.filter(e => e.id !== action.id) };
      return addLog(s, `${evt.type} dismissed.`);
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
