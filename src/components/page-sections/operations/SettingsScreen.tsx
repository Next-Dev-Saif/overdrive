import { useState } from 'react';
import { ArrowLeft, Monitor, Volume2, Gamepad2 } from 'lucide-react';
import { GraphicsSettingsManager, type GraphicsQuality } from '../../../game/settings/GraphicsSettingsManager';
import { SoundManager } from '../../../game/engine/SoundManager';
import '../setup/setup.css';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
    const [quality, setQuality] = useState(() => GraphicsSettingsManager.getInstance().getQuality());
    const [volume, setVolume] = useState(() => SoundManager.getInstance().getVolume());

    const playHover = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-hover'));
    };

    const playSelect = () => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('play-ui-select'));
    };

    return (
        <main className="match-setup setup-settings">
            <header className="setup-header">
                <div>
                    <span className="text-[10px] tracking-[0.2em] text-white/50 uppercase block mb-1">
                        OVERDRIVE
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide">
                        SETTINGS
                    </h1>
                </div>
                <button
                    type="button"
                    className="setup-back"
                    onMouseEnter={playHover}
                    onClick={() => {
                        playSelect();
                        onBack();
                    }}
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Back to Lobby
                </button>
            </header>

            <div className="setup-body">
                {/* Graphics Section */}
                <section aria-labelledby="graphics-title" className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Monitor size={18} className="text-white/70" />
                        <h2 id="graphics-title" className="text-base font-bold uppercase text-white tracking-wider">
                            Graphics Quality
                        </h2>
                    </div>
                    <p className="text-sm text-white/50">
                        Select rendering fidelity. Lower quality improves frame rate on slower machines.
                    </p>

                    <fieldset className="setup-modes mt-4">
                        <legend className="sr-only">Graphics quality</legend>
                        {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map(value => (
                            <label key={value} onMouseEnter={playHover} className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="quality"
                                    checked={quality === value}
                                    onChange={() => {
                                        playSelect();
                                        GraphicsSettingsManager.getInstance().setQuality(value);
                                        setQuality(value);
                                    }}
                                />
                                <span>{value}</span>
                            </label>
                        ))}
                    </fieldset>
                </section>

                {/* Audio Section */}
                <section aria-labelledby="audio-title" className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Volume2 size={18} className="text-white/70" />
                        <h2 id="audio-title" className="text-base font-bold uppercase text-white tracking-wider">
                            Audio
                        </h2>
                    </div>
                    <p className="text-sm text-white/50">
                        Adjust master game volume for engines, weapons, abilities, and effects.
                    </p>

                    <label className="setup-volume mt-4 block">
                        <div className="flex justify-between items-center w-full mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Master Volume</span>
                            <output className="font-mono text-white text-sm font-bold">
                                {Math.round(volume * 100)}%
                            </output>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            aria-label="Master volume"
                            onChange={event => {
                                const next = Number(event.target.value);
                                setVolume(next);
                                SoundManager.getInstance().setVolume(next);
                            }}
                        />
                    </label>
                </section>

                {/* Controls Section */}
                <section aria-labelledby="controls-title">
                    <div className="flex items-center gap-2 mb-2">
                        <Gamepad2 size={18} className="text-white/70" />
                        <h2 id="controls-title" className="text-base font-bold uppercase text-white tracking-wider">
                            Controls
                        </h2>
                    </div>
                    <p className="text-sm text-white/50 mb-4">
                        Weapons lock onto nearby opponents within range. Hold fire to shoot.
                    </p>

                    <dl className="setup-controls">
                        {[
                            ['W / ↑', 'Accelerate'],
                            ['S / ↓', 'Brake / Reverse'],
                            ['A D / ← →', 'Steer'],
                            ['SPACE', 'Fire Weapon'],
                            ['SHIFT', 'Special Ability'],
                            ['I', 'Reset Car (When Flipped)'],
                            ['TAB', 'Scoreboard'],
                            ['ESC', 'Pause Menu']
                        ].map(([key, action]) => (
                            <div key={key}>
                                <dt>{action}</dt>
                                <dd><kbd>{key}</kbd></dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </div>
        </main>
    );
}
