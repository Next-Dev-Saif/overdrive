import { ChevronsUp, FastForward, Radio, Shield, ShieldOff, ShieldCheck, Zap, EyeOff, Radiation, Crosshair } from 'lucide-react';
import './vehicle-status-effect.css';

/** Compact, shape-coded telegraphs replace floating status sentences for every vehicle. */
export function VehicleStatusEffect({ status }: { status: string }) {
    const expired = status.includes('EXPIRED');
    const lift = /AIRBORNE|GRAV|BLAST/.test(status);
    const shield = /SHIELD|ABSORB|ALLY/.test(status);
    const electrical = /EMP|STUN/.test(status);
    const dash = status.includes('DASH');
    const cloak = status.includes('CLOAK');
    const radiation = status.includes('RADIATION');
    const kind = lift ? 'lift' : expired ? 'expired' : shield ? 'shield' : electrical ? 'electrical' : dash ? 'dash' : cloak ? 'cloak' : radiation ? 'radiation' : 'impact';
    const Icon = lift ? ChevronsUp : expired ? ShieldOff : shield ? Shield : electrical ? Zap : dash ? FastForward : cloak ? EyeOff : radiation ? Radiation : Radio;
    return <span className={`vehicle-status-effect vehicle-status-effect--${kind}`} role="img" aria-label={status}>
        <i aria-hidden="true" /><Icon size={28} strokeWidth={2} aria-hidden="true" /><i aria-hidden="true" />
    </span>;
}

/** Relationship has both a unique silhouette and a color; names remain accessible. */
export function VehicleRelationship({ ally, name }: { ally: boolean; name: string }) {
    const Icon = ally ? ShieldCheck : Crosshair;
    return <span className={`vehicle-relationship ${ally ? 'vehicle-relationship--ally' : 'vehicle-relationship--hostile'}`} role="img" aria-label={`${ally ? 'Ally' : 'Hostile'}: ${name}`}>
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
    </span>;
}
