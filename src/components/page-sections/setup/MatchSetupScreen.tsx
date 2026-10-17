import { Check, LogOut, Play, Settings, User } from 'lucide-react';
import { arenas, raceArena, vehicles, weapons } from '../../../data/catalog';
import { GarageRenderer } from '../../ui/GarageRenderer';
import { EquipmentPicker } from './EquipmentPicker';
import { SETUP_MODES, type MatchSetup } from './setupState';
import './game-lobby.css';

interface Props {
    setup: MatchSetup;
    onChange: (next: MatchSetup) => void;
    username: string;
    onStart: () => void;
    onSettings: () => void;
    onLogout: () => void;
}

export function MatchSetupScreen({ setup, onChange, username, onStart, onSettings, onLogout }: Props) {
    const race = setup.mode === 'deathrace';
    const mode = SETUP_MODES.find(item => item.id === setup.mode) ?? SETUP_MODES[0];
    const map = race ? raceArena : arenas.find(item => item.id === setup.map) ?? arenas[0];
    const vehicle = vehicles.find(item => item.id === (race ? 'interceptor' : setup.vehicle)) ?? vehicles[0];
    const weapon = weapons.find(item => item.id === setup.weapon) ?? weapons[0];

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };

    const startLabel = race ? 'Start Race' : setup.mode === 'freeroam' ? 'Enter Arena' : 'Find Match';

    return (
        <main className="game-lobby">
            {/* 3D Showroom Stage - Full Viewport Backdrop */}
            <div className="lobby-stage" aria-hidden="true">
                <GarageRenderer vehicleId={vehicle.id} weaponId={race ? 'none' : weapon.id} vehicleColor={setup.color} />
                <div className="lobby-stage-vignette" />
            </div>

            {/* Top Navigation Bar */}
            <header className="lobby-header">
                <div className="lobby-brand">
                    <span className="lobby-wordmark">OVERDRIVE</span>
                </div>

                <fieldset className="lobby-modes">
                    <legend className="sr-only">Game Mode</legend>
                    {SETUP_MODES.map(item => (
                        <label key={item.id} onMouseEnter={playHover} className="lobby-mode-tab">
                            <input
                                type="radio"
                                name="mode"
                                value={item.id}
                                checked={setup.mode === item.id}
                                onChange={() => {
                                    playSelect();
                                    onChange({ ...setup, mode: item.id });
                                }}
                            />
                            <span>{item.name}</span>
                        </label>
                    ))}
                </fieldset>

                <nav className="lobby-user-nav" aria-label="User profile and settings">
                    <div className="lobby-driver-badge" title={`Signed in as ${username}`}>
                        <User size={14} className="text-white/60" aria-hidden="true" />
                        <span>{username}</span>
                    </div>
                    <button
                        type="button"
                        className="lobby-icon-btn"
                        onClick={() => {
                            playSelect();
                            onSettings();
                        }}
                        onMouseEnter={playHover}
                        aria-label="Settings"
                        title="Settings"
                    >
                        <Settings size={18} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="lobby-icon-btn"
                        onClick={() => {
                            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-deselect'));
                            onLogout();
                        }}
                        onMouseEnter={playHover}
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <LogOut size={16} aria-hidden="true" />
                    </button>
                </nav>
            </header>

            {/* Floating Vehicle Spotlight (Top-Left overlay) */}
            <div className="lobby-spotlight" aria-live="polite">
                <span className="lobby-spotlight-class">{race ? 'Race Spec' : vehicle.role}</span>
                <h1 className="lobby-spotlight-name">{vehicle.name}</h1>
                <div className="lobby-spotlight-meta">
                    <span className="lobby-spotlight-ability">Special: {vehicle.ability}</span>
                    <span className="lobby-spotlight-detail">{vehicle.handling} Handling · {vehicle.mass}</span>
                </div>
            </div>

            {/* Bottom Floating Game Deck */}
            <div className="lobby-bottom-deck">
                {/* Equipment Picker Row */}
                <EquipmentPicker setup={setup} onChange={onChange} />

                {/* Arena Maps & Start Game Row */}
                <div className="lobby-arena-row">
                    <div className="lobby-maps-container">
                        <span className="lobby-deck-label">{race ? 'Track' : 'Arena'}</span>
                        <div className="lobby-maps-strip">
                            {race ? (
                                <div className="lobby-fixed-track">
                                    <img src="/assets/maps/blacktop.jpg" width="640" height="360" alt="Blacktop Circuit" />
                                    <div className="lobby-track-info">
                                        <strong>Blacktop Circuit</strong>
                                        <small>3 Laps · Paved Circuit</small>
                                    </div>
                                </div>
                            ) : (
                                arenas.map(item => {
                                    const selected = map.id === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className="setup-map"
                                            aria-label={item.name}
                                            aria-pressed={selected}
                                            data-selected={selected}
                                            onMouseEnter={playHover}
                                            onClick={() => {
                                                playSelect();
                                                onChange({ ...setup, map: item.id });
                                            }}
                                        >
                                            <img src={`/assets/maps/${item.id}.jpg`} width="640" height="360" alt="" />
                                            <div className="setup-map-overlay">
                                                <span>{item.name}</span>
                                                {selected && <Check size={14} className="setup-map-check" aria-label="Selected" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Start Action Button */}
                    <div className="lobby-start-container">
                        <div className="lobby-start-summary">
                            <span className="lobby-start-mode-detail">{mode.detail}</span>
                            <strong className="lobby-start-loadout">
                                {race ? 'Interceptor · Trackside weapons' : `${vehicle.name} · ${weapon.name}`}
                            </strong>
                            <small className="lobby-start-map">{map.name}</small>
                        </div>
                        <button
                            type="button"
                            className="setup-start"
                            onMouseEnter={playHover}
                            onClick={() => {
                                playSelect();
                                onStart();
                            }}
                        >
                            <span>{startLabel}</span>
                            <Play size={20} fill="currentColor" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
