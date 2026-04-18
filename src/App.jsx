// ============================================================
// OUTPOST ZERO — React UI
// ============================================================
import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { gameReducer, computeRates } from './gameReducer';
import { INITIAL_STATE } from './gameState';
import {
  ROLES, MISSIONS, ANOMALY_MISSION, RESEARCH_TREE,
  BUILDINGS, QUARTERS_BASE_COST, QUARTERS_SCALE, SITE_POOL,
} from './gameConstants';

// ── Palette ────────────────────────────────────────────────────

const G   = '#4cff72';   // green  — healthy / positive
const A   = '#ffb347';   // amber  — warning
const R   = '#ff4444';   // red    — critical
const DIM = '#c0c0c0';
const TX  = '#f0f0f0';
const BG  = '#000';
const BG2 = '#060606';
const BD  = '#2a2a2a';
const MN  = "'Courier New', Courier, monospace";
const INV = '#55aaee';   // blue   — inventory resource (no danger)

// ── Tiny helpers ───────────────────────────────────────────────

function fmt(n, decimals = 0) {
  return Number(n).toFixed(decimals);
}
function fmtRate(r) {
  return (r >= 0 ? '+' : '') + r.toFixed(2) + '/s';
}
function resColor(pct) {
  if (pct < 0.05) return R;
  if (pct < 0.20) return A;
  return G;
}

function crewOnMission(missions) {
  return missions.reduce((s, m) => s + m.crewCount, 0);
}
function totalRoles(roles) {
  return Object.values(roles).reduce((a, b) => a + b, 0);
}
function availCrew(state) {
  const inj = state.crew.filter(c => c.status === 'injured').length;
  return state.crew.length - totalRoles(state.roles) - crewOnMission(state.missions) - inj;
}

// ── Shared UI pieces ───────────────────────────────────────────

function Btn({ children, onClick, variant = 'default', disabled, style = {} }) {
  const vc = { default: [TX, DIM], primary: [G, G], warn: [A, A], danger: [R, R] };
  const [color, border] = disabled ? [DIM, '#2a2a2a'] : (vc[variant] || vc.default);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: 'none',
        border: `1px solid ${border}`,
        color,
        fontFamily: MN,
        fontSize: 13,
        padding: '9px 13px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: 44,
        minWidth: 44,
        lineHeight: 1.3,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function ProgressBar({ pct, color, height = 3 }) {
  return (
    <div style={{ height, background: '#181818', marginTop: 4, borderRadius: 1 }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, height: '100%', background: color, transition: 'width 1s linear', borderRadius: 1 }} />
    </div>
  );
}

// isSurvival=true → warning colours + pulse when critical (O₂/Food)
// isSurvival=false → neutral inventory colour, no panic (Parts/Credits/Artifacts)
function ResourceBar({ label, value, cap, rate, isSurvival = true }) {
  const pct  = cap > 0 ? Math.min(1, value / cap) : 0;
  const col  = isSurvival ? resColor(pct) : INV;
  const crit = isSurvival && pct < 0.05;
  const rc   = rate > 0.005 ? G : rate < -0.005 ? (isSurvival ? R : DIM) : DIM;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 9, minHeight: 24,
      animation: crit ? 'pulse 0.8s ease-in-out infinite' : 'none',
    }}>
      <span style={{ width: 64, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: col, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 5, background: '#161616', position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct * 100}%`, background: col, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ width: 66, textAlign: 'right', fontSize: 12, color: col, flexShrink: 0 }}>
        {fmt(value)}/{cap}
      </span>
      <span style={{ width: 58, textAlign: 'right', fontSize: 12, color: rc, flexShrink: 0 }}>
        {fmtRate(rate)}
      </span>
    </div>
  );
}

function Panel({ title, badge, open, onToggle, locked, summary, children }) {
  return (
    <div style={{ marginBottom: 2, border: `1px solid ${BD}` }}>
      <div
        role="button"
        tabIndex={0}
        onClick={locked ? undefined : onToggle}
        onKeyDown={e => e.key === 'Enter' && !locked && onToggle()}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 12px', minHeight: 46, background: BG2,
          cursor: locked ? 'default' : 'pointer', userSelect: 'none',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: locked ? DIM : TX, flexShrink: 0 }}>
          {title}
          {badge ? <span style={{ color: A, marginLeft: 10, fontSize: 12 }}>{badge}</span> : null}
          {locked ? <span style={{ color: R, marginLeft: 10, fontSize: 10 }}>[LOCKED {locked}s]</span> : null}
        </span>
        {!open && !locked && summary && (
          <span style={{ fontSize: 10, flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
            {summary}
          </span>
        )}
        <span style={{ color: DIM, fontSize: 18, lineHeight: 1, paddingBottom: 1, flexShrink: 0 }}>
          {locked ? '×' : open ? '−' : '+'}
        </span>
      </div>
      {open && !locked && (
        <div style={{ padding: 12, borderTop: `1px solid ${BD}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── COMMAND FEED ───────────────────────────────────────────────
// Single always-visible column: live missions → dock events (inline actions) → recent log

function CommandFeed({ state, dispatch }) {
  const { missions, dockEvents, unlocked, log } = state;

  return (
    <div style={{ padding: '8px 14px 10px', background: BG, borderBottom: `1px solid ${BD}` }}>
      {/* Active missions */}
      {missions.map((m, i) => {
        const def = m.type === 'anomaly' ? ANOMALY_MISSION
                  : m.type === 'site'    ? SITE_POOL.find(p => p.id === m.siteId)
                  :                        MISSIONS[m.type];
        if (!def) return null;
        const returning = m.timer <= 10;
        const pct = m.totalTime > 0 ? m.timer / m.totalTime : 0;
        return (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, lineHeight: 1.4 }}>
              <span style={{ color: returning ? G : A }}>
                {returning ? '↓' : '↑'} {def.name} · {m.crewCount} crew
              </span>
              <span style={{
                color: returning ? G : DIM, fontWeight: 'bold',
                animation: returning ? 'pulse 0.8s ease-in-out infinite' : 'none',
              }}>
                {m.timer}s
              </span>
            </div>
            <ProgressBar pct={pct} color={returning ? G : A} />
          </div>
        );
      })}

      {/* Dock events — full info + inline accept/ignore */}
      {unlocked.dock && dockEvents.map(evt => {
        const urgent = evt.timer <= 8;
        return (
          <div key={evt.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, lineHeight: 1.4 }}>
              <span style={{ color: urgent ? R : A }}>⚡ {evt.title}</span>
              <span style={{
                color: urgent ? R : DIM, fontWeight: 'bold',
                animation: urgent ? 'pulse 0.6s ease-in-out infinite' : 'none',
              }}>
                {evt.timer}s
              </span>
            </div>
            <div style={{ fontSize: 11, color: DIM, marginTop: 2, marginBottom: 5, lineHeight: 1.5 }}>
              {evt.desc}
            </div>
            <ProgressBar pct={evt.timer / 20} color={urgent ? R : A} height={2} />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {evt.type === 'inspector' ? (
                <Btn variant="warn" onClick={() => dispatch({ type: 'DOCK_ACCEPT', id: evt.id })} style={{ flex: 1, fontSize: 11, padding: '7px 10px' }}>Comply</Btn>
              ) : (
                <>
                  <Btn variant="primary" onClick={() => dispatch({ type: 'DOCK_ACCEPT', id: evt.id })} style={{ flex: 1, fontSize: 11, padding: '7px 10px' }}>Accept</Btn>
                  <Btn variant="warn"    onClick={() => dispatch({ type: 'DOCK_IGNORE', id: evt.id })} style={{ flex: 1, fontSize: 11, padding: '7px 10px' }}>Ignore</Btn>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Recent log entries — flow below live items, lower urgency */}
      {log.slice(0, 4).map((entry, i) => {
        const opacity = Math.max(0.18, 1 - i * 0.22);
        return (
          <div key={entry.id} style={{
            fontSize: 12, lineHeight: 1.75,
            color: i === 0 && (missions.length === 0 && dockEvents.length === 0)
              ? TX
              : `rgba(200,200,200,${opacity})`,
            animation: i === 0 ? 'slideIn 0.3s ease' : 'none',
          }}>
            &gt; {entry.text}
          </div>
        );
      })}
    </div>
  );
}

// ── OBJECTIVES STRIP ───────────────────────────────────────────

function getObjectives(state) {
  const objectives = [];
  const done = state.completedResearch;
  const built = state.constructedBuildings;

  // Early game: building the station
  if (!built.includes('shuttleBay')) {
    if (state.parts >= 30) {
      objectives.push({ text: 'shuttle bay ready to construct', key: 'build-shuttle' });
    } else {
      objectives.push({ text: 'gather parts to construct a shuttle bay', key: 'parts' });
    }
  } else if (!built.includes('commsArray')) {
    objectives.push({ text: 'construct a comms array to contact passing ships', key: 'build-comms' });
  } else if (!built.includes('researchLab')) {
    objectives.push({ text: 'build a research lab to study recovered artifacts', key: 'build-research' });
  } else {
    // Research progression goals
    const tier1Done = done.includes('efficientRecycling') && done.includes('drillUpgrades');
    const tier2Done = done.includes('advancedHydroponics') && done.includes('secondShuttle');
    const tier3Done = done.includes('expeditionPlanning') && done.includes('crewExpansion');

    if (!tier1Done) {
      objectives.push({ text: 'analyse artifacts to develop new technologies', key: 'r1' });
    } else if (!tier2Done) {
      objectives.push({ text: 'push deeper into the ruins — advanced research awaits', key: 'r2' });
    } else if (!tier3Done) {
      objectives.push({ text: 'the anomaly readings are getting stronger', key: 'r3' });
    } else if (!done.includes('warpBeacon')) {
      objectives.push({ text: 'the warp beacon is within reach — signal for rescue', key: 'beacon' });
    } else {
      objectives.push({ text: 'activate the warp beacon', key: 'win' });
    }
  }

  // Secondary: always show a station-building goal if one is available
  const nextBuilding = Object.values(BUILDINGS).find(b =>
    !built.includes(b.id) && b.requires.every(r => built.includes(r))
  );
  if (nextBuilding && objectives[0]?.key !== `build-${nextBuilding.id}`) {
    // Don't duplicate if primary already covers it
    const already = objectives.some(o => o.key.startsWith('build-'));
    if (!already) {
      objectives.push({ text: `${nextBuilding.name.toLowerCase()} available for construction`, key: `build-${nextBuilding.id}` });
    }
  }

  // Scanner hint
  if (built.includes('surfaceScanner') && state.discoveredSites.length === 0 && state.scanCooldown === 0) {
    objectives.push({ text: 'run a surface scan to locate precursor sites', key: 'scan' });
  }

  // Crew growth hint
  if (state.crew.length >= state.maxCrew && state.maxCrew < 8 && built.includes('shuttleBay')) {
    objectives.push({ text: 'expand crew quarters to take on more hands', key: 'q' });
  }

  return objectives.slice(0, 2);
}

function ObjectivesStrip({ state }) {
  if (state.gameWon) return null;
  const objectives = getObjectives(state);
  if (!objectives.length) return null;

  return (
    <div style={{
      padding: '8px 14px',
      background: BG,
      borderBottom: `1px solid ${BD}`,
    }}>
      <div style={{ fontSize: 10, color: DIM, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>
        objectives
      </div>
      {objectives.map(obj => (
        <div key={obj.key} style={{ fontSize: 12, color: '#4ccc66', lineHeight: 1.7 }}>
          › {obj.text}
        </div>
      ))}
    </div>
  );
}

// ── OPERATIONS (resources + crew combined) ──────────────────────

const DESC = { fontSize: 11, color: DIM, marginBottom: 12, lineHeight: 1.5 };

const OPS_ROWS = [
  { label: 'O₂',      res: 'o2',      cap: 'o2Cap',      role: 'lifeSupport', isSurvival: true  },
  { label: 'Food',    res: 'food',    cap: 'foodCap',    role: 'hydroponics', isSurvival: true  },
  { label: 'Parts',   res: 'parts',   cap: 'partsCap',   role: 'technician',  isSurvival: false },
  { label: 'Credits', res: 'credits', cap: 'creditsCap', role: 'comms',       isSurvival: false },
];

function OperationsSection({ state, rates, dispatch }) {
  const { o2Rate, foodRate, partsRate, creditsRate } = rates;
  const rateMap = { lifeSupport: o2Rate, hydroponics: foodRate, technician: partsRate, comms: creditsRate };
  const avail       = availCrew(state);
  const onMis       = crewOnMission(state.missions);
  const total       = state.crew.length;
  const injured     = state.crew.filter(c => c.status === 'injured');

  return (
    <div>
      <div style={DESC}>Assign workers to each station system to maintain resource production.</div>

      {/* Crew summary */}
      <div style={{ fontSize: 12, color: DIM, marginBottom: injured.length ? 6 : 14, lineHeight: 1.8 }}>
        {total} aboard · {onMis} on mission · {avail} unassigned · max {state.maxCrew}
      </div>
      {injured.length > 0 && (
        <div style={{ fontSize: 11, color: A, marginBottom: 14 }}>
          {injured.map(c => `${c.name} recovering — ${c.injuredTimer}s`).join(' · ')}
        </div>
      )}

      {/* Column header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
        <span style={{ fontSize: 9, color: DIM, letterSpacing: 2, textTransform: 'uppercase', width: 98, textAlign: 'center' }}>
          Workers
        </span>
      </div>

      {/* Resource + worker rows */}
      {OPS_ROWS.map(row => {
        const value  = state[row.res];
        const cap    = state[row.cap];
        const rate   = rateMap[row.role];
        const pct    = cap > 0 ? Math.min(1, value / cap) : 0;
        const col    = row.isSurvival ? resColor(pct) : INV;
        const crit   = row.isSurvival && pct < 0.05;
        const rc     = rate > 0.005 ? G : rate < -0.005 ? (row.isSurvival ? R : DIM) : DIM;
        const count  = state.roles[row.role];
        const canInc = avail > 0;
        const canDec = count > 0;
        return (
          <div key={row.role} style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            animation: crit ? 'pulse 0.8s ease-in-out infinite' : 'none',
          }}>
            <span style={{ width: 56, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: col, flexShrink: 0 }}>
              {row.label}
            </span>
            <div style={{ flex: 1, height: 4, background: '#161616', position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct * 100}%`, background: col, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ width: 58, textAlign: 'right', fontSize: 11, color: col, flexShrink: 0 }}>
              {fmt(value)}/{cap}
            </span>
            <span style={{ width: 52, textAlign: 'right', fontSize: 11, color: rc, flexShrink: 0 }}>
              {fmtRate(rate)}
            </span>
            <Btn onClick={() => dispatch({ type: 'ASSIGN_ROLE', role: row.role, delta: -1 })} disabled={!canDec} style={{ padding: '6px 11px', fontSize: 13, minHeight: 34, minWidth: 34 }}>−</Btn>
            <span style={{ width: 14, textAlign: 'center', fontSize: 14, color: count > 0 ? G : DIM }}>{count}</span>
            <Btn onClick={() => dispatch({ type: 'ASSIGN_ROLE', role: row.role, delta:  1 })} disabled={!canInc} style={{ padding: '6px 11px', fontSize: 13, minHeight: 34, minWidth: 34 }}>+</Btn>
          </div>
        );
      })}

      {/* Artifacts — no crew role, recovered via missions */}
      {state.unlocked.research && (() => {
        const pct = state.artifactsCap > 0 ? Math.min(1, state.artifacts / state.artifactsCap) : 0;
        return (
          <>
            <div style={{ borderTop: `1px solid ${BD}`, margin: '8px 0 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 56, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: INV, flexShrink: 0 }}>
                Artif.
              </span>
              <div style={{ flex: 1, height: 4, background: '#161616', position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct * 100}%`, background: INV, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ width: 58, textAlign: 'right', fontSize: 11, color: INV, flexShrink: 0 }}>
                {fmt(state.artifacts)}/{state.artifactsCap}
              </span>
              <span style={{ width: 52, textAlign: 'right', fontSize: 11, color: DIM, flexShrink: 0 }}>
                +0.00/s
              </span>
              <span style={{ width: 98, textAlign: 'center', fontSize: 10, color: DIM, flexShrink: 0, letterSpacing: 0.5 }}>
                via missions
              </span>
            </div>
          </>
        );
      })()}

      {/* Win state */}
      {state.gameWon && (
        <div style={{
          marginTop: 14, padding: '12px', border: `1px solid ${G}`,
          color: G, fontSize: 12, letterSpacing: 1, lineHeight: 1.8, textAlign: 'center',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          ◈ WARP BEACON ACTIVE ◈<br />
          rescue fleet inbound. outpost zero survives.<br />
          — mission complete —
        </div>
      )}

      {/* Roster */}
      {state.crew.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BD}` }}>
          <div style={{ fontSize: 11, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 }}>Roster</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {state.crew.map(c => (
              <span key={c.id} style={{
                fontSize: 12, padding: '4px 8px',
                border: `1px solid ${c.status === 'injured' ? A : '#2a2a2a'}`,
                color: c.status === 'injured' ? A : DIM,
              }}>
                {c.name}
                {c.status === 'injured' ? ` [−${c.injuredTimer}s]` : ''}
                {c.specialist ? ' ★' : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── STATION (construction) ──────────────────────────────────────

function StationSection({ state, dispatch }) {
  const built = state.constructedBuildings;
  const total = state.crew.length;

  const q          = state.quartersBuilt;
  const partsCost  = Math.ceil(QUARTERS_BASE_COST.parts   * Math.pow(QUARTERS_SCALE, q));
  const creditCost = Math.ceil(QUARTERS_BASE_COST.credits * Math.pow(QUARTERS_SCALE, q));
  const canBuildQ  = state.parts >= partsCost && state.credits >= creditCost;

  return (
    <div>
      <div style={DESC}>Construct buildings to expand station capabilities and unlock new sections.</div>
      {/* One-time station buildings */}
      {Object.values(BUILDINGS).map(b => {
        const isDone   = built.includes(b.id);
        const reqsMet  = b.requires.every(r => built.includes(r));
        const canAfford = Object.entries(b.cost).every(([res, amt]) => (state[res] || 0) >= amt);
        const canBuild  = !isDone && reqsMet && canAfford;

        return (
          <div key={b.id} style={{
            marginBottom: 6, padding: '9px 10px',
            border: `1px solid ${isDone ? '#1a2a1a' : reqsMet ? BD : '#141414'}`,
            opacity: isDone ? 0.55 : reqsMet ? 1 : 0.4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: isDone ? G : TX }}>
                  {isDone ? '✓ ' : ''}{b.name}
                </div>
                <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>{b.desc}</div>
                {!isDone && (
                  <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>
                    {Object.entries(b.cost).map(([res, amt]) => `${amt} ${res}`).join(' · ')}
                    {!reqsMet && <span style={{ color: R }}> · locked</span>}
                    {reqsMet && !canAfford && <span style={{ color: R }}> · insufficient</span>}
                  </div>
                )}
              </div>
              {!isDone && reqsMet && (
                <Btn
                  variant={canBuild ? 'primary' : 'default'}
                  onClick={() => dispatch({ type: 'BUILD', buildingId: b.id })}
                  disabled={!canBuild}
                  style={{ fontSize: 11, padding: '9px 12px', flexShrink: 0 }}
                >
                  Build
                </Btn>
              )}
            </div>
          </div>
        );
      })}

      {/* Crew Quarters (repeatable) */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BD}` }}>
        <div style={{ fontSize: 11, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
          Crew Quarters
        </div>
        <div style={{ fontSize: 12, color: DIM, marginBottom: 7 }}>
          {q} built · capacity {state.maxCrew}
          {total < state.maxCrew
            ? <span style={{ color: G }}> · {state.maxCrew - total} berth{state.maxCrew - total !== 1 ? 's' : ''} available</span>
            : <span style={{ color: A }}> · full</span>}
        </div>
        <Btn
          variant={canBuildQ ? 'primary' : 'default'}
          onClick={() => dispatch({ type: 'BUILD_QUARTERS' })}
          disabled={!canBuildQ}
          style={{ width: '100%', textAlign: 'center', fontSize: 12 }}
        >
          Build Quarters — {partsCost} parts · {creditCost} credits
        </Btn>
        <div style={{ fontSize: 11, color: DIM, marginTop: 6 }}>
          crew arrive automatically when berths are available.
        </div>
      </div>
    </div>
  );
}

// ── SURFACE OPS ──────────────────────────────────────────────────

function SurfaceOpsSection({ state, dispatch }) {
  const avail           = availCrew(state);
  const hasScanner      = state.completedResearch.includes('deepOrbitScanner');
  const hasExpPlan      = state.completedResearch.includes('expeditionPlanning');
  const hasSurfScanner  = state.constructedBuildings.includes('surfaceScanner');
  const maxShuttles     = state.completedResearch.includes('secondShuttle') ? 2 : 1;
  const canLaunch       = state.missions.length < maxShuttles && avail >= state.missionCrewCount;
  const canScan         = hasSurfScanner && state.scanCooldown === 0
                          && state.discoveredSites.length < 3 && state.parts >= 5;

  const allMissions = { ...MISSIONS, ...(hasScanner ? { anomaly: ANOMALY_MISSION } : {}) };

  // Resolve selected mission def (standard, anomaly, or discovered site)
  let selDef;
  if (state.selectedMission && state.selectedMission.startsWith('site_')) {
    const sid = state.selectedMission.slice(5);
    selDef = SITE_POOL.find(p => p.id === sid) || MISSIONS.mining;
  } else {
    selDef = allMissions[state.selectedMission] || MISSIONS.mining;
  }

  const successPct = Math.min(95, Math.round((selDef.baseSuccess + (state.missionCrewCount - 1) * 0.05) * 100));
  const durMult    = hasExpPlan ? 0.7 : 1.0;

  return (
    <div>
      <div style={DESC}>Launch surface missions to recover resources, artifacts, and crew.</div>
      {/* Active missions */}
      {state.missions.map(m => {
        const def = m.type === 'anomaly' ? ANOMALY_MISSION
                  : m.type === 'site'    ? SITE_POOL.find(p => p.id === m.siteId)
                  :                        MISSIONS[m.type];
        if (!def) return null;
        const pct = m.totalTime > 0 ? m.timer / m.totalTime : 0;
        return (
          <div key={m.id} style={{ marginBottom: 12, padding: '10px 10px 8px', border: `1px solid ${BD}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: m.type === 'site' ? A : G }}>{def.name}</span>
              <span style={{ fontSize: 12, color: A }}>{m.timer}s remaining</span>
            </div>
            <div style={{ fontSize: 10, color: DIM, marginBottom: 7 }}>
              {m.crewCount} crew · {def.risk} risk
            </div>
            <ProgressBar pct={pct} color={m.type === 'site' ? A : A} />
          </div>
        );
      })}

      {/* Surface Scanner action */}
      {hasSurfScanner && (
        <div style={{ marginBottom: 12, padding: '9px 10px', border: `1px solid ${BD}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: TX }}>Surface Scanner</div>
              <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>
                {state.scanCooldown > 0
                  ? `cooldown: ${state.scanCooldown}s`
                  : state.discoveredSites.length >= 3
                  ? 'site queue full (max 3)'
                  : '5 parts · identifies a precursor site'}
              </div>
            </div>
            <Btn
              variant={canScan ? 'primary' : 'default'}
              onClick={() => dispatch({ type: 'SCAN' })}
              disabled={!canScan}
              style={{ fontSize: 11, padding: '9px 12px', flexShrink: 0 }}
            >
              Scan
            </Btn>
          </div>
          {state.scanCooldown > 0 && (
            <ProgressBar pct={state.scanCooldown / 90} color={DIM} />
          )}
        </div>
      )}

      {/* Mission type selector */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: DIM, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Mission type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Standard missions */}
          {Object.values(allMissions).map(m => {
            const sel = state.selectedMission === m.id;
            const rw = m.getRewards ? m.getRewards(state.missionCrewCount) : null;
            const rewardStr = rw
              ? Object.entries(rw).map(([k, v]) => k === 'newCrew' ? '+1 crew' : `+${v} ${k}`).join(' · ')
              : '';
            const displayDur = Math.ceil(m.duration * durMult);
            return (
              <button
                key={m.id}
                onClick={() => dispatch({ type: 'SET_MISSION', missionType: m.id })}
                style={{
                  background: sel ? '#141414' : 'none',
                  border: `1px solid ${sel ? G : BD}`,
                  color: sel ? G : DIM,
                  fontFamily: MN, fontSize: 12,
                  padding: '9px 10px', cursor: 'pointer',
                  textAlign: 'left', minHeight: 44,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{m.name}</span>
                  <span style={{ color: DIM, fontSize: 11 }}>{displayDur}s · {m.risk}</span>
                </div>
                {sel && rewardStr && (
                  <div style={{ fontSize: 11, color: INV, marginTop: 3 }}>
                    est. reward ({state.missionCrewCount} crew): {rewardStr}
                  </div>
                )}
              </button>
            );
          })}

          {/* Discovered Precursor sites */}
          {state.discoveredSites.length > 0 && (
            <>
              <div style={{
                fontSize: 9, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase',
                marginTop: 6, marginBottom: 2, paddingTop: 8, borderTop: `1px solid ${BD}`,
              }}>
                Precursor Sites
              </div>
              {state.discoveredSites.map(site => {
                const mKey = `site_${site.id}`;
                const sel  = state.selectedMission === mKey;
                const rw   = site.getRewards ? site.getRewards(state.missionCrewCount) : null;
                const rewardStr = rw
                  ? Object.entries(rw).map(([k, v]) => `+${v} ${k}`).join(' · ')
                  : '';
                const displayDur = Math.ceil(site.duration * durMult);
                return (
                  <button
                    key={mKey}
                    onClick={() => dispatch({ type: 'SET_MISSION', missionType: mKey })}
                    style={{
                      background: sel ? '#120f00' : 'none',
                      border: `1px solid ${sel ? A : '#2a2010'}`,
                      color: sel ? A : '#6a5a30',
                      fontFamily: MN, fontSize: 12,
                      padding: '9px 10px', cursor: 'pointer',
                      textAlign: 'left', minHeight: 44,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{site.name}</span>
                      <span style={{ color: sel ? '#6a5a30' : DIM, fontSize: 11 }}>{displayDur}s · {site.risk}</span>
                    </div>
                    <div style={{ fontSize: 11, color: sel ? '#8a7a50' : '#555', marginTop: 2, lineHeight: 1.4 }}>
                      {site.desc}
                    </div>
                    {sel && rewardStr && (
                      <div style={{ fontSize: 11, color: A, marginTop: 4 }}>
                        est. reward ({state.missionCrewCount} crew): {rewardStr}
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Crew count + launch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: DIM }}>crew:</span>
        <Btn
          onClick={() => dispatch({ type: 'SET_MISSION_CREW', count: state.missionCrewCount - 1 })}
          disabled={state.missionCrewCount <= 1}
          style={{ padding: '9px 15px' }}
        >−</Btn>
        <span style={{ width: 18, textAlign: 'center', fontSize: 16, color: TX }}>{state.missionCrewCount}</span>
        <Btn
          onClick={() => dispatch({ type: 'SET_MISSION_CREW', count: state.missionCrewCount + 1 })}
          disabled={state.missionCrewCount >= 3 || state.missionCrewCount >= avail}
          style={{ padding: '9px 15px' }}
        >+</Btn>
        <span style={{ fontSize: 11, color: DIM }}>
          success:{' '}
          <span style={{ color: successPct >= 85 ? G : successPct >= 70 ? A : R }}>
            {successPct}%
          </span>
        </span>
      </div>

      <Btn
        variant={canLaunch ? 'primary' : 'default'}
        onClick={() => dispatch({ type: 'LAUNCH_MISSION' })}
        disabled={!canLaunch}
        style={{ width: '100%', fontSize: 12 }}
      >
        {state.missions.length >= maxShuttles
          ? 'all shuttles in flight'
          : avail < state.missionCrewCount
          ? `not enough crew (need ${state.missionCrewCount} available)`
          : `Launch — ${selDef.name}`}
      </Btn>

      {maxShuttles > 1 && (
        <div style={{ fontSize: 10, color: DIM, marginTop: 6, textAlign: 'center' }}>
          {state.missions.length}/{maxShuttles} shuttles active
        </div>
      )}
    </div>
  );
}

// ── DOCK ────────────────────────────────────────────────────────

const SUPPLY_RES = ['o2', 'food', 'parts'];

function DockSection({ state, dispatch }) {
  const canSupply = state.credits >= 30;
  const canSpec   = state.credits >= 80 && state.crew.length < state.maxCrew;

  return (
    <div>
      <div style={DESC}>Request supply drops and hire specialists from ships passing through the system.</div>
      {/* In-transit deliveries */}
      {state.outgoingDeliveries.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {state.outgoingDeliveries.map((d, i) => (
            <div key={i} style={{ fontSize: 11, color: DIM, marginBottom: 4 }}>
              &rarr; {d.res} supply drop — arrives in {d.timer}s
            </div>
          ))}
        </div>
      )}

      {/* Outgoing panel */}
      <div style={{ fontSize: 11, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
        Outgoing
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: DIM, marginBottom: 7 }}>
          Request Supply Drop — 30 credits · 60s delivery
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {SUPPLY_RES.map(res => (
            <Btn key={res} onClick={() => dispatch({ type: 'REQUEST_SUPPLY', res })} disabled={!canSupply} style={{ fontSize: 12 }}>
              {res}
            </Btn>
          ))}
        </div>
      </div>

      <Btn
        variant={canSpec ? 'primary' : 'default'}
        onClick={() => dispatch({ type: 'HIRE_SPECIALIST' })}
        disabled={!canSpec}
        style={{ width: '100%', fontSize: 12 }}
      >
        {state.crew.length >= state.maxCrew
          ? 'crew capacity full'
          : 'Hire Specialist — 80 credits'}
      </Btn>

    </div>
  );
}

// ── RESEARCH ────────────────────────────────────────────────────

const TIER_LABELS = ['', 'Basic', 'Advanced', 'Specialized', 'Experimental'];

function ResearchSection({ state, dispatch }) {
  const done = state.completedResearch;
  const tiers = [1, 2, 3, 4];

  return (
    <div>
      <div style={DESC}>Spend artifacts and credits to develop new technologies and improve station efficiency.</div>
      {tiers.map(t => {
        const techs = Object.values(RESEARCH_TREE).filter(r => r.tier === t);
        return (
          <div key={t} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase',
              marginBottom: 6, paddingBottom: 5, borderBottom: `1px solid ${BD}`,
            }}>
              Tier {t} — {TIER_LABELS[t]}
            </div>
            {techs.map(tech => {
              const isDone     = done.includes(tech.id);
              const reqsMet    = tech.requires.every(r => done.includes(r));
              const canAfford  = state.artifacts >= tech.artifactCost && state.credits >= tech.creditCost;
              const canResearch = !isDone && reqsMet && canAfford;

              return (
                <div key={tech.id} style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  gap: 10, marginBottom: 6, padding: '9px 10px',
                  border: `1px solid ${isDone ? '#1a2a1a' : reqsMet ? BD : '#141414'}`,
                  opacity: isDone ? 0.55 : reqsMet ? 1 : 0.4,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: isDone ? G : TX }}>
                      {isDone ? '✓ ' : ''}{tech.name}
                    </div>
                    <div style={{ fontSize: 12, color: DIM, marginTop: 2 }}>{tech.desc}</div>
                    {!isDone && (
                      <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>
                        {tech.artifactCost} artifacts · {tech.creditCost} credits
                        {!reqsMet && <span style={{ color: R }}> · locked</span>}
                        {reqsMet && !canAfford && <span style={{ color: R }}> · insufficient resources</span>}
                      </div>
                    )}
                  </div>
                  {!isDone && reqsMet && (
                    <Btn
                      variant={canResearch ? 'primary' : 'default'}
                      onClick={() => dispatch({ type: 'RESEARCH', techId: tech.id })}
                      disabled={!canResearch}
                      style={{ fontSize: 11, padding: '9px 12px', flexShrink: 0 }}
                    >
                      Research
                    </Btn>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── LOG ────────────────────────────────────────────────────────

// ── ROOT APP ───────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const rates = useMemo(() => computeRates(state), [state]);
  const tog   = useCallback(sec => dispatch({ type: 'TOGGLE_SECTION', section: sec }), []);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, []);

  const { open, unlocked, lockedSections } = state;

  // ── Panel summaries (shown when collapsed) ──
  const o2Col  = state.o2 / state.o2Cap < 0.2 ? A : G;
  const fCol   = state.food / state.foodCap < 0.2 ? A : G;
  const avail  = availCrew(state);
  const operationsSummary = (
    <span>
      <span style={{ color: o2Col }}>O₂ {fmt(state.o2)}</span>
      <span style={{ color: DIM }}> · </span>
      <span style={{ color: fCol }}>Food {fmt(state.food)}</span>
      <span style={{ color: DIM }}> · </span>
      <span style={{ color: avail > 0 ? G : A }}>{avail} free</span>
    </span>
  );

  const builtCount = state.constructedBuildings.length;
  const totalBuildings = Object.keys(BUILDINGS).length;
  const stationSummary = `${builtCount}/${totalBuildings} built · ${state.quartersBuilt} quarters`;

  const surfSummary = state.missions.length > 0
    ? <span><span style={{ color: A }}>{state.missions.length} in flight</span></span>
    : <span style={{ color: DIM }}>ready</span>;

  const dockEvtCount = state.dockEvents.length;
  const dockSummary = dockEvtCount > 0
    ? <span style={{ color: A }}>{dockEvtCount} incoming · supply &amp; hires available</span>
    : <span style={{ color: DIM }}>supply drops · crew hires</span>;

  const researchDone = state.completedResearch.length;
  const researchSummary = (
    <span>
      <span style={{ color: G }}>{researchDone}/8</span>
      <span style={{ color: DIM }}> · </span>
      <span style={{ color: INV }}>{fmt(state.artifacts)} artifacts</span>
    </span>
  );

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', padding: '0 0 56px',
      minHeight: '100vh', background: BG, fontFamily: MN, color: TX,
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '14px 14px 0', borderBottom: `1px solid ${BD}` }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          paddingBottom: 10,
        }}>
          <div style={{ fontSize: 18, letterSpacing: 4, color: G, textTransform: 'uppercase' }}>
            Outpost Zero
          </div>
          <div style={{ fontSize: 10, color: DIM, letterSpacing: 1 }}>
            eridu-7 · t+{state.tick}s
          </div>
        </div>
        {/* Contact timer — compact row with inline fill bar */}
        {unlocked.dock && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
            <span style={{ fontSize: 10, color: DIM, flexShrink: 0, minWidth: 86 }}>
              contact: {state.nextDockEventIn}s
            </span>
            <div style={{ flex: 1, height: 2, background: '#181818', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(0, Math.min(100, (1 - state.nextDockEventIn / 65) * 100))}%`,
                height: '100%', background: '#3a3a3a', borderRadius: 1,
                transition: 'width 1s linear',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Objectives (always visible) ── */}
      <ObjectivesStrip state={state} />

      {/* ── Command feed: missions + dock events + recent log ── */}
      <CommandFeed state={state} dispatch={dispatch} />

      {/* ── Operations ── */}
      <Panel title="Operations" open={open.status} onToggle={() => tog('status')} summary={operationsSummary}>
        <OperationsSection state={state} rates={rates} dispatch={dispatch} />
      </Panel>

      {/* ── Station (construction) ── */}
      <Panel title="Station" open={open.station} onToggle={() => tog('station')} summary={stationSummary}>
        <StationSection state={state} dispatch={dispatch} />
      </Panel>

      {/* ── Surface Ops ── */}
      {unlocked.surfaceOps && (
        <Panel title="Surface Ops" open={open.surfaceOps} onToggle={() => tog('surfaceOps')} locked={lockedSections.surfaceOps} summary={surfSummary}>
          <SurfaceOpsSection state={state} dispatch={dispatch} />
        </Panel>
      )}

      {/* ── Dock ── */}
      {unlocked.dock && (
        <Panel
          title="Dock"
          open={open.dock} onToggle={() => tog('dock')}
          locked={lockedSections.dock}
          summary={dockSummary}
        >
          <DockSection state={state} dispatch={dispatch} />
        </Panel>
      )}

      {/* ── Research ── */}
      {unlocked.research && (
        <Panel title="Research" open={open.research} onToggle={() => tog('research')} summary={researchSummary}>
          <ResearchSection state={state} dispatch={dispatch} />
        </Panel>
      )}

    </div>
  );
}
