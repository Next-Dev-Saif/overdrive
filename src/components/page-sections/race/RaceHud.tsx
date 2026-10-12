import type { RefObject } from 'react';
import type { RaceSnapshot } from '../../../../shared/race/types';
import { RACE_ABILITY, RACE_RULES } from '../../../../shared/race/types';
import { raceStandings } from '../../../../shared/race/simulation';
import { TRACK } from '../../../../shared/race/track';
import { VehicleGlyph } from '../match/VehicleGlyph';
import type { RaceEngine } from '../../../game/race/RaceEngine';
import { TargetTracking } from '../match/TargetTracking';

const trackPath = TRACK.map((p, i) => `${i ? 'L' : 'M'}${p.x + 220} ${p.z + 220}`).join(' ') + ' Z';
const formatTime = (ms: number) => `${Math.floor(Math.max(0, ms) / 60000)}:${String(Math.floor(Math.max(0, ms) / 1000) % 60).padStart(2, '0')}.${Math.floor(Math.max(0, ms) % 1000 / 100)}`;

/** Race-only HUD: ordered laps, server standings, pickup ammo and finish results. */
export function RaceHud({ state, localId, engine, recover, leave }: { state: RaceSnapshot; localId: string; engine: RefObject<RaceEngine | null>; recover: () => void; leave: () => void }) {
    const local = state.racers.find(car => car.id === localId)!;
    const standings = raceStandings(state.racers), place = standings.findIndex(car => car.id === localId) + 1;
    const cooldown = local.lastAbility ? Math.max(0, Math.ceil((local.lastAbility + RACE_ABILITY.cooldownMs - state.serverTime) / 1000)) : 0;
    const abilityUnavailable = state.phase !== 'racing' || local.health <= 0 || local.finishedAt !== null || cooldown > 0;
    const ended = state.phase === 'finished';
    const inputButton = (label: string, key: 'throttle' | 'steer' | 'brake' | 'fire' | 'ability', value: number | boolean) => <button type="button" aria-label={label}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); if (engine.current) Object.assign(engine.current.touch, { [key]: value }); }}
        onPointerUp={() => { if (engine.current) Object.assign(engine.current.touch, { [key]: typeof value === 'number' ? 0 : false }); }}
        onLostPointerCapture={() => { if (engine.current) Object.assign(engine.current.touch, { [key]: typeof value === 'number' ? 0 : false }); }}>{label}</button>;
    return <>
        <header className="race-hud__top"><div><small>POSITION</small><strong>{place}<span> / {state.racers.length}</span></strong></div><div><small>LAP</small><strong>{Math.min(3, local.lap + 1)}<span> / 3</span></strong></div><div><small>RACE TIME</small><strong>{formatTime(state.startsAt ? (local.finishedAt ?? state.serverTime) - state.startsAt : 0)}</strong></div></header>
        <button className="race-exit" onClick={leave}>Leave race</button>
        <div className="race-map" aria-label="Circuit map"><svg viewBox="0 0 440 440" role="img" aria-label="Race positions on Blacktop Circuit"><path d={trackPath} fill="none" stroke="#777e86" strokeWidth="14" /><path d={trackPath} fill="none" stroke="#20252c" strokeWidth="9" />{state.racers.filter(car => car.connected).map(car => <circle key={car.id} cx={car.x + 220} cy={car.z + 220} r={car.id === localId ? 9 : 5} fill={car.id === localId ? '#fff' : '#a0a8b0'} stroke="#111" strokeWidth="2" />)}</svg><span>BLACKTOP CIRCUIT</span></div>
        <ol className="race-standings" aria-label="Race standings">{standings.map((car, i) => <li key={car.id} data-local={car.id === localId}><span>{i + 1}</span><strong>{car.id === localId ? 'YOU' : car.name}</strong><small>{!car.connected ? 'LEFT' : car.finishedAt !== null ? 'FINISHED' : `L${car.lap + 1}`}</small></li>)}</ol>
        <section className="race-vehicle" aria-label="Interceptor status"><VehicleGlyph vehicleId="interceptor" /><div><strong>INTERCEPTOR</strong><label>HULL {Math.ceil(local.health / RACE_RULES.health * 100)}%<meter min="0" max={RACE_RULES.health} value={local.health} /></label><span>{local.weapon ? `${local.weapon.toUpperCase()} · ${local.ammo} SHOTS` : 'UNARMED · COLLECT A PICKUP'}</span></div><b>{Math.round(Math.hypot(local.vx, local.vz) * 3.6)}<small>KM/H</small></b></section>
        <div className="race-controls"><span>WASD drive · B brake · Auto-fire · SPACE overdrive</span><button className="race-ability" disabled={abilityUnavailable} onClick={() => engine.current?.activateAbility()} aria-label={cooldown ? `Lightning recharging: ${cooldown} seconds` : 'Activate lightning overdrive'}>{local.abilityTarget ? 'LIGHTNING · CHARGING' : cooldown ? `LIGHTNING · ${cooldown}s` : 'LIGHTNING · READY'}</button><button onClick={recover} disabled={state.phase !== 'racing' || local.health <= 0 || local.finishedAt !== null}>Recover · lose weapon</button></div>
        <div className="race-touch"><div>{inputButton('Left', 'steer', -1)}{inputButton('Right', 'steer', 1)}</div><div>{inputButton('Brake', 'brake', true)}{inputButton('Drive', 'throttle', 1)}</div></div>
        <TargetTracking engineRef={engine} />
        {state.phase === 'loading' && <div className="race-callout" role="status">Waiting for drivers</div>}
        {state.phase === 'countdown' && <div className="race-callout" role="status"><small>THREE LAPS. ONE WINNER.</small><strong>{Math.max(1, Math.ceil((state.startsAt - state.serverTime) / 1000))}</strong></div>}
        {local.health <= 0 && !ended && <div className="race-callout" role="status"><strong>WRECKED</strong><small>Returning to checkpoint in {Math.max(0, Math.ceil((local.respawnAt - state.serverTime) / 1000))}s</small></div>}
        {local.finishedAt !== null && !ended && <div className="race-finished" role="status">FINISHED · P{local.place} · {formatTime(local.finishedAt - state.startsAt)}<span>Waiting for the field · {Math.max(0, Math.ceil((state.endsAt - state.serverTime) / 1000))}s</span></div>}
        {ended && <div className="race-results"><section aria-label="Death Race results"><small>DEATH RACE / BLACKTOP CIRCUIT</small><h1>{state.winner === localId ? 'FIRST TO THE LINE' : local.finishedAt ? `FINISHED P${local.place}` : 'RACE COMPLETE'}</h1><ol>{standings.map((car, i) => <li key={car.id}><span>{car.place ?? '—'}</span><strong>{car.id === localId ? 'YOU' : car.name}</strong><span>{car.finishedAt ? formatTime(car.finishedAt - state.startsAt) : 'DNF'}</span><small>{i === 0 && state.winner ? 'WINNER' : ''}</small></li>)}</ol><button onClick={leave}>Return to race setup</button></section></div>}
    </>;
}
