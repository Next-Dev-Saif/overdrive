import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Check, Shield, Crosshair, Palette, Gauge } from 'lucide-react';
import { vehicles, weapons } from '../../../data/catalog';
import type { MatchSetup } from '../setup/setupState';
import { VehicleAbilityGraphic } from './VehicleAbilityGraphic';
import './garage.css';

const PAINT_PRESETS = [
    { label: 'Matte Carbon', color: '#141518' },
    { label: 'Arctic White', color: '#f5f6f8' },
    { label: 'Gunmetal', color: '#383c44' },
    { label: 'Battleship', color: '#636a75' },
    { label: 'Stealth Slate', color: '#242831' },
    { label: 'Alloy Silver', color: '#a0a7b5' },
    { label: 'Inferno Orange', color: '#b54c30' },
    { label: 'Cyber Gold', color: '#d2a34f' },
];

interface Props {
    setup: MatchSetup;
    onChange: (next: MatchSetup) => void;
    onClose: () => void;
}

export function GarageModal({ setup, onChange, onClose }: Props) {
    const race = setup.mode === 'deathrace';
    const vehicleIndex = Math.max(0, vehicles.findIndex(v => v.id === (race ? 'interceptor' : setup.vehicle)));
    const weaponIndex = Math.max(0, weapons.findIndex(w => w.id === setup.weapon));

    const currentVehicle = vehicles[vehicleIndex] ?? vehicles[0];
    const currentWeapon = weapons[weaponIndex] ?? weapons[0];

    const modalRef = useRef<HTMLDivElement>(null);

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };

    const prevVehicle = () => {
        if (race) return;
        playSelect();
        const nextIdx = (vehicleIndex - 1 + vehicles.length) % vehicles.length;
        onChange({ ...setup, vehicle: vehicles[nextIdx].id });
    };

    const nextVehicle = () => {
        if (race) return;
        playSelect();
        const nextIdx = (vehicleIndex + 1) % vehicles.length;
        onChange({ ...setup, vehicle: vehicles[nextIdx].id });
    };

    const prevWeapon = () => {
        playSelect();
        const nextIdx = (weaponIndex - 1 + weapons.length) % weapons.length;
        onChange({ ...setup, weapon: weapons[nextIdx].id });
    };

    const nextWeapon = () => {
        playSelect();
        const nextIdx = (weaponIndex + 1) % weapons.length;
        onChange({ ...setup, weapon: weapons[nextIdx].id });
    };

    // Keyboard navigation: Left/Right to slide vehicles, Escape to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowLeft' && !race) {
                e.preventDefault();
                prevVehicle();
            } else if (e.key === 'ArrowRight' && !race) {
                e.preventDefault();
                nextVehicle();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    return (
        <div 
            className="garage-modal-overlay" 
            role="dialog" 
            aria-modal="true" 
            aria-label="Garage and Armory"
            ref={modalRef}
            data-lenis-prevent="true"
        >
            {/* Top Bar Navigation */}
            <div className="garage-topbar">
                <div className="garage-topbar-title">
                    <span className="garage-badge">HANGAR // ARMORY</span>
                    <h2 className="garage-heading">VEHICLE LOADOUT</h2>
                </div>
                <div className="garage-topbar-actions">
                    <span className="garage-shortcut-hint">ESC or CLICK OUTSIDE TO CLOSE</span>
                    <button
                        type="button"
                        className="garage-close-btn"
                        onClick={() => {
                            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-deselect'));
                            onClose();
                        }}
                        onMouseEnter={playHover}
                        aria-label="Close Garage"
                        title="Close Garage (ESC)"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Left Control Panel: Minimal Vehicle Selection */}
            <div className="garage-side-panel garage-panel-left">
                <div className="garage-panel-header">
                    <span className="garage-section-tag">01 / CHASSIS</span>
                    <div className="garage-stepper-counter">
                        <span>{String(vehicleIndex + 1).padStart(2, '0')}</span>
                        <span className="text-white/30">/</span>
                        <span>{String(vehicles.length).padStart(2, '0')}</span>
                    </div>
                </div>

                {/* Vehicle Slide Carousel Controls */}
                <div className="garage-slide-selector" aria-label="Vehicle Selector">
                    <button
                        type="button"
                        className="garage-slide-btn"
                        onClick={prevVehicle}
                        disabled={race}
                        onMouseEnter={playHover}
                        aria-label="Previous Vehicle"
                        title="Previous Vehicle (Left Arrow)"
                    >
                        <ChevronLeft size={22} aria-hidden="true" />
                    </button>

                    <div className="garage-slide-display">
                        <span className="garage-chassis-role">{race ? 'LOCKED SPEC' : currentVehicle.role}</span>
                        <h3 className="garage-chassis-name">{currentVehicle.name}</h3>
                        <div className="garage-chassis-tags">
                            <span className="garage-tag"><Gauge size={11} /> {currentVehicle.handling}</span>
                            <span className="garage-tag"><Shield size={11} /> {currentVehicle.mass}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="garage-slide-btn"
                        onClick={nextVehicle}
                        disabled={race}
                        onMouseEnter={playHover}
                        aria-label="Next Vehicle"
                        title="Next Vehicle (Right Arrow)"
                    >
                        <ChevronRight size={22} aria-hidden="true" />
                    </button>
                </div>

                {/* Direct Dot Indicators */}
                {!race && (
                    <div className="garage-dots-row" role="tablist" aria-label="Vehicle quick select">
                        {vehicles.map((v, i) => (
                            <button
                                key={v.id}
                                type="button"
                                role="tab"
                                aria-selected={i === vehicleIndex}
                                aria-label={v.name}
                                className={`garage-dot ${i === vehicleIndex ? 'active' : ''}`}
                                onClick={() => {
                                    playSelect();
                                    onChange({ ...setup, vehicle: v.id });
                                }}
                                onMouseEnter={playHover}
                            />
                        ))}
                    </div>
                )}

                {/* Enlarged Vehicle Ability Graphic Showcase */}
                <div className="garage-ability-showcase">
                    <div className="garage-ability-graphic-wrap">
                        <VehicleAbilityGraphic vehicleId={currentVehicle.id} ability={currentVehicle.ability} />
                    </div>
                    <div className="garage-ability-info">
                        <span className="garage-ability-sub">SPECIAL ABILITY</span>
                        <strong className="garage-ability-title">{currentVehicle.ability}</strong>
                    </div>
                </div>
            </div>

            {/* Right Control Panel: Minimal Weapon & Paint Selection */}
            <div className="garage-side-panel garage-panel-right">
                <div className="garage-panel-header">
                    <span className="garage-section-tag">02 / ORDNANCE</span>
                    <div className="garage-stepper-counter">
                        <span>{String(weaponIndex + 1).padStart(2, '0')}</span>
                        <span className="text-white/30">/</span>
                        <span>{String(weapons.length).padStart(2, '0')}</span>
                    </div>
                </div>

                {/* Weapon Slide Carousel Controls */}
                <div className="garage-slide-selector" aria-label="Weapon Selector">
                    <button
                        type="button"
                        className="garage-slide-btn"
                        onClick={prevWeapon}
                        onMouseEnter={playHover}
                        aria-label="Previous Weapon"
                        title="Previous Weapon"
                    >
                        <ChevronLeft size={22} aria-hidden="true" />
                    </button>

                    <div className="garage-slide-display">
                        <span className="garage-chassis-role">{currentWeapon.role}</span>
                        <h3 className="garage-chassis-name">{currentWeapon.name}</h3>
                        <div className="garage-chassis-tags">
                            <span className="garage-tag"><Crosshair size={11} /> {currentWeapon.range}M</span>
                            <span className="garage-tag">AMMO: {currentWeapon.ammo}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="garage-slide-btn"
                        onClick={nextWeapon}
                        onMouseEnter={playHover}
                        aria-label="Next Weapon"
                        title="Next Weapon"
                    >
                        <ChevronRight size={22} aria-hidden="true" />
                    </button>
                </div>

                {/* Direct Dot Indicators for Weapons */}
                <div className="garage-dots-row" role="tablist" aria-label="Weapon quick select">
                    {weapons.map((w, i) => (
                        <button
                            key={w.id}
                            type="button"
                            role="tab"
                            aria-selected={i === weaponIndex}
                            aria-label={w.name}
                            className={`garage-dot ${i === weaponIndex ? 'active' : ''}`}
                            onClick={() => {
                                playSelect();
                                onChange({ ...setup, weapon: w.id });
                            }}
                            onMouseEnter={playHover}
                        />
                    ))}
                </div>

                {/* Sleek Minimal Combat Badge */}
                <div className="garage-mini-badge">
                    <Crosshair size={13} className="text-cyan-400" aria-hidden="true" />
                    <span>{currentWeapon.role.toUpperCase()} // CADENCE: {currentWeapon.interval}MS</span>
                </div>

                {/* Paint Finish Customizer */}
                <div className="garage-paint-section">
                    <div className="garage-panel-header" style={{ marginBottom: '6px', borderBottom: 'none', paddingBottom: 0 }}>
                        <span className="garage-section-tag">
                            <Palette size={12} /> 03 / CHASSIS COAT
                        </span>
                    </div>
                    <div className="garage-paint-swatches">
                        {PAINT_PRESETS.map(preset => (
                            <button
                                key={preset.color}
                                type="button"
                                title={preset.label}
                                aria-label={preset.label}
                                className={`garage-color-swatch ${setup.color.toLowerCase() === preset.color.toLowerCase() ? 'active' : ''}`}
                                style={{ backgroundColor: preset.color }}
                                onMouseEnter={playHover}
                                onClick={() => {
                                    playSelect();
                                    onChange({ ...setup, color: preset.color });
                                }}
                            >
                                {setup.color.toLowerCase() === preset.color.toLowerCase() && (
                                    <Check size={12} className="garage-swatch-check" />
                                )}
                            </button>
                        ))}
                        <label className="garage-custom-color-picker" title="Custom Hex Color">
                            <input
                                type="color"
                                aria-label="Custom color picker"
                                value={setup.color}
                                onChange={e => onChange({ ...setup, color: e.target.value })}
                            />
                        </label>
                    </div>
                </div>

                {/* Confirm Action */}
                <button
                    type="button"
                    className="garage-confirm-btn"
                    onClick={() => {
                        playSelect();
                        onClose();
                    }}
                    onMouseEnter={playHover}
                >
                    <Check size={16} aria-hidden="true" />
                    <span>CONFIRM LOADOUT</span>
                </button>
            </div>
        </div>
    );
}
