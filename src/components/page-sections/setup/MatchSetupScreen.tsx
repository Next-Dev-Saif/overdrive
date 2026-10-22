import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, LogOut, Play, Settings, Shield, User, Wrench, Zap } from 'lucide-react';
import { arenas, raceArena, vehicles, weapons } from '../../../data/catalog';
import { GarageRenderer } from '../../ui/GarageRenderer';
import { GarageModal } from '../garage/GarageModal';
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

/** Standalone component for the top-right Garage CTA and slide modal to keep MatchSetupScreen pure and hook-safe */
function GarageButton({ setup, onChange }: { setup: MatchSetup; onChange: (next: MatchSetup) => void }) {
    const [open, setOpen] = useState(false);
    const vehicle = vehicles.find(item => item.id === setup.vehicle) ?? vehicles[0];

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };

    return (
        <>
            <button
                type="button"
                className="lobby-garage-btn"
                onClick={() => {
                    playSelect();
                    setOpen(true);
                }}
                onMouseEnter={playHover}
                aria-label="Open Garage and Armory"
            >
                <Wrench size={16} className="text-amber-400" aria-hidden="true" />
                <span className="lobby-garage-btn-text">GARAGE</span>
                <span className="lobby-garage-btn-badge">{vehicle.name}</span>
            </button>
            {open && (
                <GarageModal
                    setup={setup}
                    onChange={onChange}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
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

    const startLabel = race ? 'START RACE' : setup.mode === 'freeroam' ? 'ENTER ARENA' : 'START MATCH';

    return (
        <main className="game-lobby">
            {/* 3D Showroom Stage - Full Bleed Canvas */}
            <div className="lobby-stage" aria-hidden="true">
                <GarageRenderer 
                    vehicleId={vehicle.id} 
                    weaponId={race ? 'none' : weapon.id} 
                    vehicleColor={setup.color} 
                />
                <div className="lobby-stage-vignette" />
            </div>

            {/* Absolute Transparent Header on Canvas - No Background Bar */}
            <header className="lobby-header">
                <div className="lobby-brand">
                    <span className="lobby-wordmark">OVERDRIVE</span>
                    <span className="lobby-submark">TACTICAL MOTOR-COMBAT</span>
                </div>

                {/* Mode Selector Center Tabs */}
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

                {/* Top-Right Navigation: GARAGE BUTTON + Driver Tag + Settings */}
                <nav className="lobby-user-nav" aria-label="User profile, garage, and settings">
                    {/* Primary Garage CTA */}
                    <GarageButton setup={setup} onChange={onChange} />

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

            {/* Sleek Minimalist Vehicle Telemetry Bracket (Bottom-Left) */}
            <div className="lobby-minimal-vehicle" aria-label="Current Vehicle Loadout">
                <div className="lobby-mv-bracket" aria-hidden="true" />
                <div className="lobby-mv-header">
                    <span className="lobby-mv-loadout">{race ? 'Start unarmed' : `${vehicle.name} · ${weapon.name}`}</span>
                </div>
                <div className="lobby-mv-sub">
                    <span className="lobby-mv-role">
                        <Shield size={11} className="text-amber-400 inline mr-1" aria-hidden="true" />
                        {race ? 'BLACKTOP CIRCUIT SPEC' : `${vehicle.role} // ${vehicle.handling.toUpperCase()}`}
                    </span>
                    <span className="lobby-mv-ability">
                        <Zap size={11} className="text-amber-400 inline mr-1" aria-hidden="true" />
                        {vehicle.ability.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Bottom-Right Command Area: Large Map Dropdown + Start Match CTA */}
            <div className="lobby-command-dock">
                {/* Large Map Dropdown Selector with Images and Short Descriptions */}
                <details className="lobby-map-dropdown-wrapper">
                    {/* Dropdown Trigger Card */}
                    <summary 
                        className="lobby-map-trigger"
                        onMouseEnter={playHover}
                        aria-label={`Select arena. Current: ${map.name}`}
                    >
                        <img 
                            src={race ? '/assets/maps/blacktop.jpg' : `/assets/maps/${map.id}.jpg`} 
                            width="96" 
                            height="56" 
                            alt="" 
                            className="lobby-trigger-thumb"
                        />
                        <div className="lobby-trigger-info">
                            <span className="lobby-trigger-label">
                                {race ? 'RACE CIRCUIT' : 'SELECTED ARENA'}
                            </span>
                            <strong className="lobby-trigger-name">{map.name}</strong>
                            <small className="lobby-trigger-terrain">{map.terrain}</small>
                        </div>
                        <div className="lobby-trigger-icon">
                            <ChevronDown size={20} className="lobby-icon-closed" aria-hidden="true" />
                            <ChevronUp size={20} className="lobby-icon-open" aria-hidden="true" />
                        </div>
                    </summary>

                    {/* Dropdown Menu (Floats directly above trigger card with full preview images and descriptions) */}
                    <div 
                        className="lobby-map-dropdown-menu"
                        role="listbox" 
                        aria-label="Available Combat Arenas"
                    >
                        <div className="lobby-dropdown-header">
                            <span className="lobby-dropdown-title">SELECT COMBAT ARENA</span>
                            <span className="lobby-dropdown-subtitle">
                                {race ? 'Dedicated Circuit' : `${arenas.length} Arenas Available`}
                            </span>
                        </div>

                        <div className="lobby-dropdown-list">
                            {race ? (
                                <div className="lobby-map-item active setup-map">
                                    <img 
                                        src="/assets/maps/blacktop.jpg" 
                                        width="180" 
                                        height="100" 
                                        alt="Blacktop Circuit" 
                                        className="lobby-map-thumb"
                                    />
                                    <div className="lobby-map-item-info">
                                        <div className="lobby-map-item-row">
                                            <strong className="lobby-map-item-name">Blacktop Circuit</strong>
                                            <span className="lobby-map-item-terrain">Paved circuit · 3 Laps · Start unarmed</span>
                                        </div>
                                        <p className="lobby-map-item-desc">{raceArena.detail}</p>
                                    </div>
                                    <Check size={18} className="lobby-map-item-check" aria-hidden="true" />
                                </div>
                            ) : (
                                arenas.map(item => {
                                    const isSelected = map.id === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            aria-label={item.name}
                                            data-selected={isSelected}
                                            className="setup-map"
                                            onMouseEnter={playHover}
                                            onClick={(e) => {
                                                playSelect();
                                                onChange({ ...setup, map: item.id });
                                                if (e?.currentTarget) {
                                                    const details = (e.currentTarget as HTMLElement).closest('details');
                                                    if (details) details.removeAttribute('open');
                                                }
                                            }}
                                        >
                                            <img 
                                                src={`/assets/maps/${item.id}.jpg`} 
                                                width="180" 
                                                height="100" 
                                                alt={item.name} 
                                                className="lobby-map-thumb"
                                            />
                                            <div className="lobby-map-item-info">
                                                <div className="lobby-map-item-row">
                                                    <strong className="lobby-map-item-name">{item.name}</strong>
                                                    <span className="lobby-map-item-terrain">{item.terrain}</span>
                                                </div>
                                                <p className="lobby-map-item-desc">{item.detail}</p>
                                            </div>
                                            {isSelected && (
                                                <Check size={18} className="lobby-map-item-check" aria-hidden="true" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </details>

                {/* Big Radiant Combat Start Action Button (Heavy user attracting, minimalistic info) */}
                <div className="lobby-start-box">
                    <button
                        type="button"
                        className="setup-start"
                        onMouseEnter={playHover}
                        onClick={() => {
                            playSelect();
                            onStart();
                        }}
                    >
                        <div className="lobby-start-glow-effect" aria-hidden="true" />
                        <div className="lobby-start-cta-content">
                            <span className="lobby-start-cta-mode">{mode.name.toUpperCase()}</span>
                            <span className="lobby-start-cta-title">{startLabel}</span>
                        </div>
                        <div className="lobby-start-cta-icon" aria-hidden="true">
                            <Play size={26} fill="currentColor" />
                        </div>
                    </button>
                </div>
            </div>
        </main>
    );
}

