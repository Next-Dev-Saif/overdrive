import { Crosshair, Shield, Zap } from 'lucide-react';
import { VehicleGlyph } from './VehicleGlyph';
import './vehicle-systems.css';

const ABILITIES: Record<string, string> = { 
    interceptor: 'Lightning', 
    juggernaut: 'Shockwave', 
    phantom: 'Cloak', 
    manticore: 'EMP burst', 
    valkyrie: 'Dash', 
    wraith: 'Gravity pulse', 
    behemoth: 'Aegis dome' 
};

interface Props {
    vehicleId: string;
    health: number;
    charge: number;
    cooldownSeconds: number;
    unavailable: boolean;
    ammo: { ammo: number; maxAmmo: number; isReloading: boolean; reloadPct: number; ready?: boolean; cyclePct?: number };
    onActivate: () => void;
}

/** Creative HUD module visualizing vehicle hull integrity, overdrive reactor, and munitions cartridge status with minimum text */
export function VehicleSystems({ vehicleId, health, charge, cooldownSeconds, unavailable, ammo, onActivate }: Props) {
    const hull = Math.max(0, Math.min(100, health));
    const progress = Math.max(0, Math.min(100, charge));
    const ready = progress >= 100 && !unavailable;
    const ability = ABILITIES[vehicleId] ?? 'Overdrive';
    const status = hull <= 0 ? 'OFFLINE' : unavailable ? 'OFFLINE' : ready ? 'READY' : `${Math.ceil(cooldownSeconds)}s`;
    const ammoProgress = ammo.isReloading ? ammo.reloadPct : ammo.cyclePct ?? 100;
    const isCritical = hull <= 30 && hull > 0;

    // 10-segment tactical armor chevron matrix
    const totalChevrons = 10;
    const activeChevrons = Math.ceil((hull / 100) * totalChevrons);

    // Ballistic munition pips
    const maxPips = Number.isFinite(ammo.maxAmmo) ? Math.min(8, ammo.maxAmmo) : 0;
    const currentPips = Math.min(maxPips, ammo.ammo);

    return (
        <section className="vehicle-systems" aria-label="Vehicle systems">
            {/* Overdrive Reactor Core / Ability Dial */}
            <button
                className="overdrive-dial"
                type="button"
                onClick={onActivate}
                disabled={!ready}
                data-ready={ready}
                aria-label={`${vehicleId} ${ability}: ${status}. Activate overdrive`}
            >
                <svg className="overdrive-dial__ring" viewBox="0 0 112 112" aria-hidden="true">
                    <circle cx="56" cy="56" r="49" className="overdrive-dial__track" />
                    <circle
                        cx="56"
                        cy="56"
                        r="49"
                        pathLength="100"
                        strokeDasharray="100"
                        strokeDashoffset={100 - progress}
                        className="overdrive-dial__charge"
                        transform="rotate(-90 56 56)"
                    />
                </svg>

                <div className="overdrive-dial__glyph-wrapper">
                    <VehicleGlyph vehicleId={vehicleId} />
                </div>

                <div className="overdrive-dial__footer">
                    {ready ? (
                        <kbd className="overdrive-dial__key">SHIFT</kbd>
                    ) : (
                        <span className="overdrive-dial__timer">
                            {hull <= 0 ? 'OFFLINE' : `${Math.ceil(cooldownSeconds)}s`}
                        </span>
                    )}
                </div>
            </button>

            {/* Tactical Vehicle Stats Cluster (Minimum text, Maximum visualization) */}
            <div className="vehicle-systems__readout">
                {/* Vehicle Identity Tag */}
                <div className="vehicle-systems__identity">
                    <strong className="vehicle-name">{vehicleId.toUpperCase()}</strong>
                    <span className="ability-tag">
                        <Zap size={10} className="text-amber-400" aria-hidden="true" />
                        {ability.toUpperCase()}
                    </span>
                </div>

                {/* Creative Segmented Hull Integrity Matrix */}
                <div className="hull-meter" data-critical={isCritical} role="progressbar" aria-label="Hull integrity" aria-valuenow={Math.round(hull)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="hull-meter__header">
                        <div className="flex items-center gap-1.5">
                            <Shield size={12} className={isCritical ? 'text-red-400 animate-pulse' : 'text-amber-400'} aria-hidden="true" />
                            <span className="hull-meter__metric-title">HULL</span>
                        </div>
                        <strong className="hull-meter__val">
                            {Math.round(hull)}<small>%</small>
                        </strong>
                    </div>

                    {/* 10-Segment Tactical Chevrons */}
                    <div className="hull-chevrons" aria-hidden="true">
                        {Array.from({ length: totalChevrons }).map((_, i) => (
                            <span
                                key={i}
                                className={`hull-chevron ${i < activeChevrons ? 'active' : 'inactive'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Creative Munitions Hologram / Ammunition Cartridge Matrix */}
                <div className="weapon-readiness" data-ready={Boolean(ammo.ready && !unavailable)} data-reloading={ammo.isReloading}>
                    <div className="weapon-readiness__header">
                        <div className="flex items-center gap-1.5">
                            <Crosshair size={12} className={ammo.ready ? 'text-amber-400' : 'text-slate-400'} aria-hidden="true" />
                            <span className="weapon-readiness__title">
                                {ammo.isReloading ? 'RELOADING' : 'ORDNANCE'}
                            </span>
                        </div>
                        <strong className="weapon-readiness__val">
                            {Number.isFinite(ammo.maxAmmo) ? `${ammo.ammo}/${ammo.maxAmmo}` : '∞'}
                        </strong>
                    </div>

                    {/* Munition Visualizer: Cartridges or Heat Segments */}
                    {maxPips > 0 ? (
                        <div className="ammo-cartridge-rack" aria-label={`${ammo.ammo} of ${ammo.maxAmmo} rounds available`}>
                            {Array.from({ length: maxPips }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`ammo-cartridge ${i < currentPips ? 'loaded' : 'spent'} ${ammo.isReloading ? 'recharging' : ''}`}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="ammo-energy-cell" aria-label="Energy weapon readiness">
                            {Array.from({ length: 8 }).map((_, i) => {
                                const active = (ammoProgress / 100) * 8 > i;
                                return (
                                    <div
                                        key={i}
                                        className={`energy-cell-pip ${active ? 'active' : 'inactive'}`}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Under-magazine micro cycle / reload beam */}
                    <div className="weapon-readiness__track" role="progressbar" aria-label="Weapon cycle" aria-valuenow={Math.round(ammoProgress)} aria-valuemin={0} aria-valuemax={100}>
                        <i style={{ transform: `scaleX(${ammoProgress / 100})` }} />
                    </div>
                </div>
            </div>
        </section>
    );
}

