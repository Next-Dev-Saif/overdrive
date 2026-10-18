import { useCallback } from 'react';
import { HoldFireButton } from '../../ui/HoldFireButton';
import type { RefObject } from 'react';
import type { RaceSnapshot } from '../../../../shared/race/types';
import { RACE_ABILITY, RACE_RULES, RACE_WEAPONS } from '../../../../shared/race/types';
import { raceStandings } from '../../../../shared/race/simulation';
import { TRACK } from '../../../../shared/race/track';
import { VehicleGlyph } from '../match/VehicleGlyph';
import type { RaceEngine } from '../../../game/race/RaceEngine';
import { TargetTracking } from '../match/TargetTracking';
import { LogOut } from 'lucide-react';

const trackPath = TRACK.map((p, i) => `${i ? 'L' : 'M'}${p.x + 220} ${p.z + 220}`).join(' ') + ' Z';
const formatTime = (ms: number) => `${Math.floor(Math.max(0, ms) / 60000)}:${String(Math.floor(Math.max(0, ms) / 1000) % 60).padStart(2, '0')}.${Math.floor(Math.max(0, ms) % 1000 / 100)}`;

export function RaceHud({ state, localId, engine: engineRef, recover, leave }: { state: RaceSnapshot; localId: string; engine: RefObject<RaceEngine | null>; recover: () => void; leave: () => void }) {
    const setFiring = useCallback((held: boolean) => {
        engineRef.current?.setFiring(held);
    }, [engineRef]);

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };

    const local = state.racers.find(car => car.id === localId)!;
    const standings = raceStandings(state.racers);
    const place = standings.findIndex(car => car.id === localId) + 1;
    const cooldown = local.lastAbility ? Math.max(0, Math.ceil((local.lastAbility + RACE_ABILITY.cooldownMs - state.serverTime) / 1000)) : 0;
    const abilityUnavailable = state.phase !== 'racing' || local.health <= 0 || local.finishedAt !== null || cooldown > 0;
    const weaponCycle = local.weapon ? Math.min(1, (state.serverTime - local.lastShot) / RACE_WEAPONS[local.weapon].interval) : 0;
    const weaponReady = state.phase === 'racing' && local.health > 0 && local.finishedAt === null && !!local.weapon && local.ammo > 0 && weaponCycle >= 1 && !!local.targetId && state.serverTime - local.targetSince >= 220;
    const ended = state.phase === 'finished';

    const inputButton = (label: string, key: 'throttle' | 'steer' | 'brake' | 'fire' | 'ability', value: number | boolean) => (
        <button
            type="button"
            aria-label={label}
            onPointerDown={event => {
                event.currentTarget.setPointerCapture(event.pointerId);
                if (engineRef.current) Object.assign(engineRef.current.touch, { [key]: value });
            }}
            onPointerUp={() => {
                if (engineRef.current) Object.assign(engineRef.current.touch, { [key]: typeof value === 'number' ? 0 : false });
            }}
            onLostPointerCapture={() => {
                if (engineRef.current) Object.assign(engineRef.current.touch, { [key]: typeof value === 'number' ? 0 : false });
            }}
        >
            {label}
        </button>
    );

    return (
        <>
            {/* Top Race Info */}
            <header className="race-hud__top">
                <div>
                    <small>POSITION</small>
                    <strong>{place}<span> / {state.racers.length}</span></strong>
                </div>
                <div>
                    <small>LAP</small>
                    <strong>{Math.min(3, local.lap + 1)}<span> / 3</span></strong>
                </div>
                <div>
                    <small>TIME</small>
                    <strong>{formatTime(state.startsAt ? (local.finishedAt ?? state.serverTime) - state.startsAt : 0)}</strong>
                </div>
            </header>

            {/* Exit button */}
            <button
                className="race-exit flex items-center gap-1.5"
                onMouseEnter={playHover}
                onClick={() => {
                    playSelect();
                    leave();
                }}
            >
                <LogOut size={13} aria-hidden="true" />
                <span>LEAVE RACE</span>
            </button>

            {/* Circuit Vector Map */}
            <div className="race-map" aria-label="Circuit map">
                <svg viewBox="0 0 440 440" role="img" aria-label="Race positions on Blacktop Circuit">
                    <path d={trackPath} fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="12" />
                    <path d={trackPath} fill="none" stroke="#08090b" strokeWidth="8" />
                    {state.racers.filter(car => car.connected).map(car => (
                        <circle
                            key={car.id}
                            cx={car.x + 220}
                            cy={car.z + 220}
                            r={car.id === localId ? 7 : 4}
                            fill={car.id === localId ? '#ffffff' : '#6b7280'}
                            stroke="#000000"
                            strokeWidth="1.5"
                        />
                    ))}
                </svg>
                <span>BLACKTOP CIRCUIT</span>
            </div>

            {/* Live Standings Column */}
            <ol className="race-standings" aria-label="Race standings">
                {standings.map((car, i) => (
                    <li key={car.id} data-local={car.id === localId}>
                        <span>0{i + 1}</span>
                        <strong>{car.id === localId ? 'YOU' : car.name}</strong>
                        <small>{!car.connected ? 'OFFLINE' : car.finishedAt !== null ? 'FINISH' : `LAP ${car.lap + 1}`}</small>
                    </li>
                ))}
            </ol>

            {/* Cockpit Status (Bottom Left) */}
            <section className="race-vehicle" aria-label="Interceptor status">
                <VehicleGlyph vehicleId="interceptor" />
                <div>
                    <strong>INTERCEPTOR</strong>
                    <label>
                        HEALTH {Math.ceil(local.health / RACE_RULES.health * 100)}%
                        <meter min="0" max={RACE_RULES.health} value={local.health} />
                    </label>
                    <span className="race-ammo" data-ready={weaponReady}>
                        <strong>{local.weapon ? `${local.weapon.toUpperCase()} · ${local.ammo} AMMO` : 'UNARMED · COLLECT A PICKUP'}</strong>
                        <small>{weaponReady ? 'READY · SPACE / FIRE' : local.weapon ? weaponCycle < 1 ? 'CYCLING' : 'ACQUIRING TARGET' : 'TRACK WEAPONS ACTIVE'}</small>
                        {local.weapon && <meter aria-label="Weapon cycle" min="0" max="1" value={weaponCycle} />}
                    </span>
                </div>
                <b>
                    {Math.round(Math.hypot(local.vx, local.vz) * 3.6)}
                    <small>KM/H</small>
                </b>
            </section>

            {/* Combat Controls & Overdrive Trigger */}
            <div className="race-controls">
                <span>[WASD] DRIVE · [SPACE] FIRE · [SHIFT] BOOST</span>
                <button
                    className="race-ability"
                    disabled={abilityUnavailable}
                    onMouseEnter={playHover}
                    onClick={() => {
                        playSelect();
                        engineRef.current?.activateAbility();
                    }}
                    aria-label={cooldown ? `Lightning recharging: ${cooldown} seconds` : 'Activate lightning boost'}
                >
                    {local.abilityTarget ? 'LIGHTNING ACTIVE' : cooldown ? `LIGHTNING · ${cooldown}S` : 'LIGHTNING READY'}
                </button>
                <button
                    onMouseEnter={playHover}
                    onClick={() => {
                        playSelect();
                        recover();
                    }}
                    disabled={state.phase !== 'racing' || local.health <= 0 || local.finishedAt !== null}
                >
                    RESET CAR
                </button>
            </div>

            {/* Mobile Touch Controls */}
            <div className="race-touch">
                <div>
                    {inputButton('STEER L', 'steer', -1)}
                    {inputButton('STEER R', 'steer', 1)}
                </div>
                <div>
                    <HoldFireButton onFiringChange={setFiring} />
                    {inputButton('BRAKE', 'brake', true)}
                    {inputButton('THROTTLE', 'throttle', 1)}
                </div>
            </div>

            <TargetTracking engineRef={engineRef} />

            {/* Phase Callouts */}
            {state.phase === 'loading' && (
                <div className="race-callout" role="status">
                    <small>STARTING RACE</small>
                    <strong>GET READY</strong>
                </div>
            )}

            {state.phase === 'countdown' && (
                <div className="race-callout" role="status">
                    <small>DEATH RACE · 3 LAPS</small>
                    <strong>{Math.max(1, Math.ceil((state.startsAt - state.serverTime) / 1000))}</strong>
                </div>
            )}

            {local.health <= 0 && !ended && (
                <div className="race-callout" role="status">
                    <strong>CAR DESTROYED</strong>
                    <small>RESPAWNING IN {Math.max(0, Math.ceil((local.respawnAt - state.serverTime) / 1000))}S</small>
                </div>
            )}

            {local.finishedAt !== null && !ended && (
                <div className="race-finished" role="status">
                    FINISHED · POSITION {local.place} · {formatTime(local.finishedAt - state.startsAt)}
                    <span>WAITING FOR RACERS · {Math.max(0, Math.ceil((state.endsAt - state.serverTime) / 1000))}S</span>
                </div>
            )}

            {ended && (
                <div className="race-results">
                    <section aria-label="Death Race results">
                        <small>RACE RESULTS</small>
                        <h1>
                            {state.winner === localId ? 'VICTORY' : local.finishedAt ? `FINISHED · POSITION 0${local.place}` : 'RACE COMPLETE'}
                        </h1>
                        <ol>
                            {standings.map((car, i) => (
                                <li key={car.id}>
                                    <span>0{car.place ?? (i + 1)}</span>
                                    <strong>{car.id === localId ? 'YOU' : car.name}</strong>
                                    <span>{car.finishedAt ? formatTime(car.finishedAt - state.startsAt) : 'DNF'}</span>
                                    <small>{i === 0 && state.winner ? 'WINNER' : ''}</small>
                                </li>
                            ))}
                        </ol>
                        <button
                            onMouseEnter={playHover}
                            onClick={() => {
                                playSelect();
                                leave();
                            }}
                        >
                            BACK TO LOBBY
                        </button>
                    </section>
                </div>
            )}
        </>
    );
}
