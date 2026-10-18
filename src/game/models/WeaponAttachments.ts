import { buildWeaponBay } from './WeaponBay';
import { TransformNode } from '@babylonjs/core';
import { ModelBuilder } from './ModelBuilder';
import { buildWeaponModel, type WeaponHousing } from './WeaponModel';

/** Chassis-local measurements; imported bounds include the actual authored body scale. */
export interface WeaponEnvelope {
    width: number;
    height: number;
    depth: number;
    bottom: number;
    bonnetHeight: number;
    sideAnchorWidth?: number;
}

interface AttachmentProfile {
    placement: 'bonnet' | 'sides';
    housing: WeaponHousing;
    scale: number;
    forward: number;
    elevation: number;
    accent: string;
}

/** Fractions refer to the visible model, never the invisible physics collider. */
export const WEAPON_ATTACHMENTS: Record<string, AttachmentProfile> = {
    interceptor: { placement: 'bonnet', housing: 'sport', scale: 0.24, forward: 0.32, elevation: 0, accent: '#a8b6c0' },
    juggernaut: { placement: 'sides', housing: 'armored', scale: 0.26, forward: 0.18, elevation: 0.57, accent: '#b6945b' },
    phantom: { placement: 'sides', housing: 'compact', scale: 0.21, forward: 0.29, elevation: 0.48, accent: '#6e8995' },
    manticore: { placement: 'sides', housing: 'armored', scale: 0.24, forward: 0.24, elevation: 0.54, accent: '#b99b61' },
    valkyrie: { placement: 'bonnet', housing: 'sport', scale: 0.25, forward: 0.34, elevation: 0, accent: '#a4bfc4' },
    wraith: { placement: 'bonnet', housing: 'compact', scale: 0.22, forward: 0.33, elevation: 0, accent: '#779a9b' },
    behemoth: { placement: 'sides', housing: 'industrial', scale: 0.28, forward: 0.27, elevation: 0.53, accent: '#d2a34f' },
};

// Apply after the chassis clamp so every bay, weapon and support shrinks consistently.
const WEAPON_ASSEMBLY_SCALE = 0.65;

/** Build stationary load-bearing brackets and independent articulated weapon pods. */
export function buildVehicleWeapons(parent: TransformNode, vehicleId: string, weaponId: string, envelope: WeaponEnvelope): void {
    parent.metadata = { ...parent.metadata, weaponEnvelope: { ...envelope } };
    if (weaponId === 'none') return;
    const profile = WEAPON_ATTACHMENTS[vehicleId] ?? WEAPON_ATTACHMENTS.interceptor;
    const scale = Math.min(1.05, Math.max(0.32, envelope.width * profile.scale)) * WEAPON_ASSEMBLY_SCALE;
    const sides = profile.placement === 'sides' ? [-1, 1] : [0];
    for (const side of sides) {
        const mount = new TransformNode(`weapon_mount_${side < 0 ? 'left' : side > 0 ? 'right' : 'bonnet'}`, parent.getScene());
        mount.parent = parent;
        // Side pods sit outboard of the entire body, keeping barrels clear of cab/ladder.
        mount.position.set(
            side * (envelope.width / 2 + scale * 1.4),
            side ? envelope.bottom + envelope.height * profile.elevation : envelope.bonnetHeight + scale * 0.08,
            envelope.depth * profile.forward,
        );
        mount.metadata = { placement: profile.placement, vehicleId };
        const b = new ModelBuilder(parent.getScene(), mount);
        const steel = b.material('attachment-steel', '#303b43', 0.72, 0.43);
        const accent = b.material('attachment-trim', profile.accent, 0.7, 0.36);
        if (side) {
            const anchorX = side * ((envelope.sideAnchorWidth ?? envelope.width) / 2 - envelope.width / 2 - scale * 1.4);
            b.box('body-anchor', scale * 0.16, scale * 0.56, scale * 1.3, steel, anchorX, -scale * 0.08, 0);
            for (const z of [-0.35, 0.35]) {
                b.box('outrigger', Math.abs(anchorX) + scale * 0.12, scale * 0.16, scale * 0.18, steel, anchorX / 2, -scale * 0.12, z * scale);
                b.cylinder('anchor-bolt', scale * 0.12, scale * 0.18, accent, anchorX, scale * 0.08, z * scale, 'x');
            }
        } else {
            for (const x of [-0.32, 0.32]) b.box('bonnet-rail', scale * 0.13, scale * 0.16, scale * 1.25, steel, x * scale, -scale * 0.06, 0);
        }
        b.box('mount-saddle', scale * 1.05, scale * 0.12, scale * 1.1, steel);
        b.box('mount-id-stripe', scale * 0.65, scale * 0.025, scale * 0.1, accent, 0, scale * 0.07, -scale * 0.44);
        b.compact();
        const turret = buildWeaponModel(mount, weaponId, scale * 0.13, scale, profile.housing, profile.accent, side);
        buildWeaponBay(mount, turret, scale);
    }
}
