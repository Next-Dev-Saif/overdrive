import { VehicleGlyph } from './VehicleGlyph';
import './vehicle-systems.css';

const ABILITIES: Record<string, string> = { interceptor: 'Lightning', juggernaut: 'Shockwave', phantom: 'Cloak', manticore: 'EMP burst', valkyrie: 'Dash', wraith: 'Gravity pulse', behemoth: 'Aegis dome' };
interface Props {
    vehicleId: string;
    health: number;
    charge: number;
    cooldownSeconds: number;
    unavailable: boolean;
    ammo: { ammo: number; maxAmmo: number; isReloading: boolean; reloadPct: number };
    onActivate: () => void;
}

/** Compact hull readout paired with a selectable chassis overdrive dial. */
export function VehicleSystems({ vehicleId, health, charge, cooldownSeconds, unavailable, ammo, onActivate }: Props) {
    const hull = Math.max(0, Math.min(100, health));
    const progress = Math.max(0, Math.min(100, charge));
    const ready = progress >= 100 && !unavailable;
    const ability = ABILITIES[vehicleId] ?? 'Overdrive';
    const status = hull <= 0 ? 'Destroyed' : unavailable ? 'Unavailable' : ready ? 'Ready' : `${Math.ceil(cooldownSeconds)}s`;
    return <section className="vehicle-systems" aria-label="Vehicle systems">
        <button className="overdrive-dial" type="button" onClick={onActivate} disabled={!ready} data-ready={ready} aria-label={`${vehicleId} ${ability}: ${status}. Activate overdrive`}>
            <svg className="overdrive-dial__ring" viewBox="0 0 112 112" aria-hidden="true">
                <circle cx="56" cy="56" r="51" className="overdrive-dial__track" />
                <circle cx="56" cy="56" r="51" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progress} className="overdrive-dial__charge" transform="rotate(-90 56 56)" />
            </svg>
            <VehicleGlyph vehicleId={vehicleId} />
            <span className="overdrive-dial__status">{status}</span>
        </button>
        <div className="vehicle-systems__readout">
            <div className="vehicle-systems__identity"><strong>{vehicleId}</strong><span>{ability} <kbd>SPACE</kbd></span></div>
            <div className="hull-meter" data-critical={hull <= 30}>
                <div className="hull-meter__label"><span>HULL INTEGRITY</span><strong>{Math.round(hull)}<small>%</small></strong></div>
                <div className="hull-meter__track" role="progressbar" aria-label="Hull integrity" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hull)}>
                    <span style={{ transform: `scaleX(${hull / 100})` }} />
                </div>
                <span className="hull-meter__condition">{hull <= 0 ? 'SYSTEM FAILURE' : hull <= 30 ? 'CRITICAL DAMAGE' : 'SYSTEMS ONLINE'}</span>
            </div>
            {Number.isFinite(ammo.maxAmmo) && <div className="vehicle-ammo"><span>{ammo.isReloading ? `RELOADING ${Math.round(ammo.reloadPct)}%` : 'ORDNANCE'}</span><strong>{ammo.ammo}<span> / {ammo.maxAmmo}</span></strong></div>}
        </div>
    </section>;
}
