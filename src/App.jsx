// ============================================================
// OUTPOST ZERO — React UI
// ============================================================
import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { gameReducer, computeRates } from './gameReducer';
import { INITIAL_STATE } from './gameState';
import {
  ROLES, MISSIONS, ANOMALY_MISSION, RESEARCH_TREE,
  QUARTERS_BASE_COST, QUARTERS_SCALE,
} from './gameConstants';

// ── Palette ────────────────────────────────────────────────────

const G   = '#4cff72';   // green  — healthy / positive
const A   = '#ffb347';   // amber  — warning
const R   = '#ff4444';   // red    — critical
const DIM = '#555';
const TX  = '#c8c8c8';
const BG  = '#0a0a0a';
const BG2 = '#0e0e0e';
const BD  = '#1e1e1e';
const MN  = "'Courier New', Courier, monospace";

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

function ResourceBar({ label, value, cap, rate }) {
  const pct  = cap > 0 ? Math.min(1, value / cap) : 0;
  const col  = resColor(pct);
  const crit = pct < 0.05;
  const rc   = rate > 0.005 ? G : rate < -0.005 ? R : DIM;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 9, minHeight: 24,
      animation: crit ? 'pulse 0.8s ease-in-out infinite' : 'none',
    }}>
      <span style={{ width: 64, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: col, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 5, background: '#161616', position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct * 100}%`, background: col, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ width: 66, textAlign: 'right', fontSize: 12, color: col, flexShrink: 0 }}>
        {fmt(value)}/{cap}
      </span>
      <span style={{ width: 58, textAlign: 'right', fontSize: 11, color: rc, flexShrink: 0 }}>
        {fmtRate(rate)}
      </span>
    </div>
  );
}

function Panel({ title, badge, open, onToggle, locked, children }) {
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
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: locked ? DIM : TX }}>
          {title}
          {badge ? <span style={{ color: A, marginLeft: 10, fontSize: 12 }}>{badge}</span> : null}
          {locked ? <span style={{ color: R, marginLeft: 10, fontSize: 10 }}>[LOCKED {locked}s]</span> : null}
        </span>
        <span style={{ color: DIM, fontSize: 18, lineHeight: 1, paddingBottom: 1 }}>
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

// ── STATUS ──────────────────────────────────────────────────────

function StatusSection({ state, rates }) {
  const { powerRate, o2Rate, foodRate, partsRate, creditsRate } = rates;
  return (
    <div>
      <ResourceBar label="Power"   value={state.power}   cap={state.powerCap}   rate={powerRate}   />
      <ResourceBar label="O₂"      value={state.o2}      cap={state.o2Cap}      rate={o2Rate}      />
      <ResourceBar label="Food"    value={state.food}    cap={state.foodCap}    rate={foodRate}    />
      <ResourceBar label="Parts"   value={state.parts}   cap={state.partsCap}   rate={partsRate}   />
      <ResourceBar label="Credits" value={state.credits} cap={state.creditsCap} rate={creditsRate} />
      {state.unlocked.research && (
        <ResourceBar label="Artifact" value={state.artifacts} cap={state.artifactsCap} rate={0} />
      )}
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
    </div>
  );
}

// ── CREW ────────────────────────────────────────────────────────

function CrewSection({ state, dispatch }) {
  const onMis  = crewOnMission(state.missions);
  const inj    = state.crew.filter(c => c.status === 'injured').length;
  const avail  = availCrew(state);
  const total  = state.crew.length;

  const q          = state.quartersBuilt;
  const partsCost  = Math.ceil(QUARTERS_BASE_COST.parts   * Math.pow(QUARTERS_SCALE, q));
  const creditCost = Math.ceil(QUARTERS_BASE_COST.credits * Math.pow(QUARTERS_SCALE, q));
  const canBuild   = state.parts >= partsCost && state.credits >= creditCost;

  return (
    <div>
      {/* Summary */}
      <div style={{ fontSize: 11, color: DIM, marginBottom: 14, letterSpacing: 0.5, lineHeight: 1.8 }}>
        {total} aboard · {onMis} on mission · {avail} unassigned
        {inj > 0 && <span style={{ color: A }}> · {inj} injured</span>}
        <span style={{ color: DIM }}> · max {state.maxCrew}</span>
      </div>

      {/* Role assignments */}
      {ROLES.map(role => {
        const count  = state.roles[role.id];
        const canInc = avail > 0;
        const canDec = count > 0;
        return (
          <div key={role.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid #141414`, padding: '5px 0', minHeight: 46,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: TX }}>{role.name}</div>
              <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>{role.prodDesc}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Btn onClick={() => dispatch({ type: 'ASSIGN_ROLE', role: role.id, delta: -1 })} disabled={!canDec} style={{ padding: '9px 15px' }}>−</Btn>
              <span style={{ width: 22, textAlign: 'center', fontSize: 15, color: count > 0 ? G : DIM }}>{count}</span>
              <Btn onClick={() => dispatch({ type: 'ASSIGN_ROLE', role: role.id, delta:  1 })} disabled={!canInc} style={{ padding: '9px 15px' }}>+</Btn>
            </div>
          </div>
        );
      })}

      {/* Crew Quarters */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
          Crew Quarters
        </div>
        <div style={{ fontSize: 11, color: DIM, marginBottom: 7 }}>
          {q} built · capacity {state.maxCrew}
          {total < state.maxCrew
            ? <span style={{ color: G }}> · {state.maxCrew - total} berth{state.maxCrew - total !== 1 ? 's' : ''} available</span>
            : <span style={{ color: A }}> · full</span>}
        </div>
        <Btn
          variant={canBuild ? 'primary' : 'default'}
          onClick={() => dispatch({ type: 'BUILD_QUARTERS' })}
          disabled={!canBuild}
          style={{ width: '100%', textAlign: 'center', fontSize: 12 }}
        >
          Build Quarters — {partsCost} parts · {creditCost} credits
        </Btn>
        <div style={{ fontSize: 10, color: DIM, marginTop: 6 }}>
          crew migrate via the dock when berths are available.
        </div>
      </div>

      {/* Roster */}
      {state.crew.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 7 }}>Roster</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {state.crew.map(c => (
              <span key={c.id} style={{
                fontSize: 11, padding: '4px 8px',
                border: `1px solid ${c.status === 'injured' ? A : '#222'}`,
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

// ── SURFACE OPS ──────────────────────────────────────────────────

function SurfaceOpsSection({ state, dispatch }) {
  const avail      = availCrew(state);
  const hasScanner = state.completedResearch.includes('deepOrbitScanner');
  const maxShuttles = state.completedResearch.includes('secondShuttle') ? 2 : 1;
  const canLaunch  = state.missions.length < maxShuttles && avail >= state.missionCrewCount;

  const allMissions = { ...MISSIONS, ...(hasScanner ? { anomaly: ANOMALY_MISSION } : {}) };
  const selDef = allMissions[state.selectedMission] || MISSIONS.mining;
  const successPct = Math.min(95, Math.round((selDef.baseSuccess + (state.missionCrewCount - 1) * 0.05) * 100));

  return (
    <div>
      {/* Active missions */}
      {state.missions.map(m => {
        const def  = m.type === 'anomaly' ? ANOMALY_MISSION : MISSIONS[m.type];
        const pct  = m.timer / m.totalTime;
        return (
          <div key={m.id} style={{ marginBottom: 12, padding: '10px 10px 8px', border: `1px solid ${BD}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: G }}>{def.name}</span>
              <span style={{ fontSize: 12, color: A }}>{m.timer}s remaining</span>
            </div>
            <div style={{ fontSize: 10, color: DIM, marginBottom: 7 }}>
              {m.crewCount} crew · {def.risk} risk
            </div>
            <div style={{ height: 3, background: '#181818' }}>
              <div style={{ width: `${pct * 100}%`, height: '100%', background: A, transition: 'width 1s linear' }} />
            </div>
          </div>
        );
      })}

      {/* Mission type selector */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: DIM, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Mission type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.values(allMissions).map(m => {
            const sel = state.selectedMission === m.id;
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
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>{m.name}</span>
                <span style={{ color: DIM, fontSize: 11 }}>{m.duration}s · {m.risk}</span>
              </button>
            );
          })}
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

const SUPPLY_RES = ['power', 'o2', 'food', 'parts'];

function DockSection({ state, dispatch }) {
  const canSupply = state.credits >= 30;
  const canSpec   = state.credits >= 80 && state.crew.length < state.maxCrew;

  return (
    <div>
      {/* Incoming events */}
      {state.dockEvents.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            Incoming
          </div>
          {state.dockEvents.map(evt => {
            const urgent = evt.timer <= 8;
            return (
              <div key={evt.id} style={{
                marginBottom: 8, padding: '10px',
                border: `1px solid ${urgent ? R : A}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: TX }}>{evt.title}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 'bold',
                    color: urgent ? R : A,
                    animation: urgent ? 'pulse 0.6s ease-in-out infinite' : 'none',
                  }}>{evt.timer}s</span>
                </div>
                <div style={{ fontSize: 11, color: DIM, marginBottom: 9, lineHeight: 1.6 }}>{evt.desc}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="primary" onClick={() => dispatch({ type: 'DOCK_ACCEPT', id: evt.id })} style={{ flex: 1, fontSize: 12 }}>Accept</Btn>
                  <Btn variant="warn"    onClick={() => dispatch({ type: 'DOCK_IGNORE', id: evt.id })} style={{ flex: 1, fontSize: 12 }}>Ignore</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
      <div style={{ fontSize: 10, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
        Outgoing
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: DIM, marginBottom: 7 }}>
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

      <div style={{ fontSize: 10, color: DIM, marginTop: 12, lineHeight: 1.8 }}>
        next event in ~{state.nextDockEventIn}s
        {state.reputation > 0 && <span style={{ color: A }}> · reputation: {state.reputation}</span>}
      </div>
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
      {tiers.map(t => {
        const techs = Object.values(RESEARCH_TREE).filter(r => r.tier === t);
        return (
          <div key={t} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, color: DIM, letterSpacing: 1.5, textTransform: 'uppercase',
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
                    <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{tech.desc}</div>
                    {!isDone && (
                      <div style={{ fontSize: 10, color: DIM, marginTop: 4 }}>
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

function LogSection({ log }) {
  return (
    <div style={{ padding: '8px 12px 14px', borderTop: `1px solid ${BD}` }}>
      {log.map((entry, i) => {
        const age    = Math.min(i / 7, 1);
        const opacity = Math.max(0.18, 1 - age * 0.82);
        return (
          <div
            key={entry.id}
            style={{
              fontSize: 12, lineHeight: 1.75,
              color: i === 0 ? TX : `rgba(200,200,200,${opacity})`,
              animation: i === 0 ? 'slideIn 0.3s ease' : 'none',
            }}
          >
            &gt; {entry.text}
          </div>
        );
      })}
      {log.length === 0 && <span style={{ fontSize: 11, color: DIM }}>—</span>}
    </div>
  );
}

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

  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', padding: '0 0 56px',
      minHeight: '100vh', background: BG, fontFamily: MN, color: TX,
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: '18px 14px 14px',
        borderBottom: `1px solid ${BD}`, marginBottom: 3,
      }}>
        <div style={{ fontSize: 20, letterSpacing: 5, color: G, textTransform: 'uppercase' }}>
          Outpost Zero
        </div>
        <div style={{ fontSize: 10, color: DIM, marginTop: 3, letterSpacing: 1 }}>
          orbital station manager · t+{state.tick}s
        </div>
      </div>

      {/* ── Status (always visible) ── */}
      <Panel title="Status" open={open.status} onToggle={() => tog('status')}>
        <StatusSection state={state} rates={rates} />
      </Panel>

      {/* ── Crew (always unlocked) ── */}
      <Panel title="Crew" open={open.crew} onToggle={() => tog('crew')} locked={lockedSections.crew}>
        <CrewSection state={state} dispatch={dispatch} />
      </Panel>

      {/* ── Surface Ops ── */}
      {unlocked.surfaceOps && (
        <Panel title="Surface Ops" open={open.surfaceOps} onToggle={() => tog('surfaceOps')} locked={lockedSections.surfaceOps}>
          <SurfaceOpsSection state={state} dispatch={dispatch} />
        </Panel>
      )}

      {/* ── Dock ── */}
      {unlocked.dock && (
        <Panel
          title="Dock"
          badge={state.dockEvents.length > 0 ? `[${state.dockEvents.length}]` : null}
          open={open.dock} onToggle={() => tog('dock')}
          locked={lockedSections.dock}
        >
          <DockSection state={state} dispatch={dispatch} />
        </Panel>
      )}

      {/* ── Research ── */}
      {unlocked.research && (
        <Panel title="Research" open={open.research} onToggle={() => tog('research')}>
          <ResearchSection state={state} dispatch={dispatch} />
        </Panel>
      )}

      {/* ── Log (always visible) ── */}
      <div style={{ marginTop: 3, border: `1px solid ${BD}` }}>
        <div style={{
          padding: '0 12px', minHeight: 44, display: 'flex', alignItems: 'center',
          background: BG2, fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: DIM,
        }}>
          Log
        </div>
        <LogSection log={state.log} />
      </div>
    </div>
  );
}
