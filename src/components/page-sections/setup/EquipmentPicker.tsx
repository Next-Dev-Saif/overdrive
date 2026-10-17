import { Check, Palette } from 'lucide-react';
import { vehicles, weapons } from '../../../data/catalog';
import type { MatchSetup } from './setupState';

const PAINT_PRESETS = [
    { label: 'Matte Carbon', color: '#141518' },
    { label: 'Arctic White', color: '#f5f6f8' },
    { label: 'Gunmetal', color: '#383c44' },
    { label: 'Battleship', color: '#636a75' },
    { label: 'Stealth Slate', color: '#242831' },
    { label: 'Alloy Silver', color: '#a0a7b5' },
];

export function EquipmentPicker({ setup, onChange }: { setup: MatchSetup; onChange: (next: MatchSetup) => void }) {
    const race = setup.mode === 'deathrace';
    const vehicle = vehicles.find(item => item.id === (race ? 'interceptor' : setup.vehicle)) ?? vehicles[0];
    const weapon = weapons.find(item => item.id === setup.weapon) ?? weapons[0];

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };

    if (race) {
        return (
            <div className="lobby-race-loadout-banner">
                <div className="lobby-race-pill">
                    <span className="lobby-deck-label">Race Specification</span>
                    <strong>Interceptor · Start unarmed</strong>
                    <small>Collect weapons and power-ups directly on the track. Arena loadout is preserved.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="lobby-equipment-deck">
            {/* Cars Strip */}
            <div className="lobby-deck-section">
                <span className="lobby-deck-label">Car</span>
                <div className="lobby-carousel-row" role="radiogroup" aria-label="Cars">
                    {vehicles.map(item => {
                        const selected = vehicle.id === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className="lobby-deck-card"
                                data-selected={selected}
                                aria-pressed={selected}
                                onMouseEnter={playHover}
                                onClick={() => {
                                    playSelect();
                                    onChange({ ...setup, vehicle: item.id });
                                }}
                            >
                                <span className="lobby-card-title">{item.name}</span>
                                <span className="lobby-card-sub">{item.handling}</span>
                                {selected && <Check size={12} className="lobby-check-icon" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Weapons Strip */}
            <div className="lobby-deck-section">
                <span className="lobby-deck-label">Weapon</span>
                <div className="lobby-carousel-row" role="radiogroup" aria-label="Weapons">
                    {weapons.map(item => {
                        const selected = weapon.id === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className="lobby-deck-card"
                                data-selected={selected}
                                aria-pressed={selected}
                                onMouseEnter={playHover}
                                onClick={() => {
                                    playSelect();
                                    onChange({ ...setup, weapon: item.id });
                                }}
                            >
                                <span className="lobby-card-title">{item.name}</span>
                                <span className="lobby-card-sub">{item.ammo}</span>
                                {selected && <Check size={12} className="lobby-check-icon" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Paint Finish */}
            <div className="lobby-deck-section lobby-paint-deck">
                <span className="lobby-deck-label">
                    <Palette size={12} aria-hidden="true" /> Color
                </span>
                <div className="lobby-paint-swatches">
                    {PAINT_PRESETS.map(preset => (
                        <button
                            key={preset.color}
                            type="button"
                            title={preset.label}
                            aria-label={preset.label}
                            data-selected={setup.color.toLowerCase() === preset.color.toLowerCase()}
                            className="lobby-color-swatch"
                            style={{ backgroundColor: preset.color }}
                            onMouseEnter={playHover}
                            onClick={() => {
                                playSelect();
                                onChange({ ...setup, color: preset.color });
                            }}
                        />
                    ))}
                    <label className="lobby-custom-color-label" title="Custom Color">
                        <input
                            type="color"
                            aria-label="Custom color picker"
                            className="lobby-paint-input"
                            value={setup.color}
                            onChange={e => onChange({ ...setup, color: e.target.value })}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
