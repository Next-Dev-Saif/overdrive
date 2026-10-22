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
    deckRearHeight?: number;
    deckFrontHeight?: number;
}

interface AttachmentProfile {
    placement: 'bonnet';
    housing: WeaponHousing;
    scale: number;
    forward: number;
    accent: string;
}

/** Fractions refer to the visible model, never the invisible physics collider. */
export const WEAPON_ATTACHMENTS: Record<string, AttachmentProfile> = {
    interceptor: { placement: 'bonnet', housing: 'sport', scale: 0.24, forward: 0.38, accent: '#a8b6c0' },
    juggernaut: { placement: 'bonnet', housing: 'armored', scale: 0.26, forward: 0.38, accent: '#b6945b' },
    phantom: { placement: 'bonnet', housing: 'compact', scale: 0.21, forward: 0.38, accent: '#6e8995' },
    manticore: { placement: 'bonnet', housing: 'armored', scale: 0.24, forward: 0.38, accent: '#b99b61' },
    valkyrie: { placement: 'bonnet', housing: 'sport', scale: 0.25, forward: 0.38, accent: '#a4bfc4' },
    wraith: { placement: 'bonnet', housing: 'compact', scale: 0.22, forward: 0.38, accent: '#779a9b' },
    behemoth: { placement: 'bonnet', housing: 'industrial', scale: 0.28, forward: 0.38, accent: '#d2a34f' },
};

// Apply after the chassis clamp so every bay, weapon and support shrinks consistently.
const WEAPON_ASSEMBLY_SCALE = 0.65;

/** Bound the complete cassette to the available front-deck footprint. */
export function getWeaponAssemblyScale(vehicleId: string, width: number, depth: number): number {
    const profile = WEAPON_ATTACHMENTS[vehicleId] ?? WEAPON_ATTACHMENTS.interceptor;
    return Math.min(
        Math.min(1.05, Math.max(0.32, width * profile.scale)) * WEAPON_ASSEMBLY_SCALE,
        depth * (0.5 - profile.forward) / 2.2,
    );
}

/** Build stationary load-bearing brackets and independent articulated weapon pods. */
export function buildVehicleWeapons(parent: TransformNode, vehicleId: string, weaponId: string, envelope: WeaponEnvelope): void {
    parent.metadata = { ...parent.metadata, weaponEnvelope: { ...envelope } };
    if (weaponId === 'none') return;
    const profile = WEAPON_ATTACHMENTS[vehicleId] ?? WEAPON_ATTACHMENTS.interceptor;
    const scale = getWeaponAssemblyScale(vehicleId, envelope.width, envelope.depth);
    // A single deck cassette bears directly on the bonnet, with no side outriggers.
    const mount = new TransformNode('weapon_mount_bonnet', parent.getScene());
    mount.parent = parent;
    mount.position.set(0, envelope.bonnetHeight + scale * 0.08, envelope.depth * profile.forward);
    mount.metadata = { placement: profile.placement, vehicleId };
    const b = new ModelBuilder(parent.getScene(), mount);
    const steel = ModelBuilder.steelSurface(b.scene);
    const accent = b.material('attachment-trim', profile.accent, 0.7, 0.36);
    // The solid pad follows the bonnet slope; its top supports the level cassette.
    const rear = (envelope.deckRearHeight ?? envelope.bonnetHeight) - mount.position.y;
    const front = (envelope.deckFrontHeight ?? envelope.bonnetHeight) - mount.position.y;
    b.loft('deck-plinth', [
        [-scale * .625, scale * .9, rear - scale * .02, 0],
        [scale * .625, scale * .9, front - scale * .02, 0],
    ], steel);
    b.box('mount-saddle', scale * 1.05, scale * 0.12, scale * 1.1, steel);
    b.box('mount-id-stripe', scale * 0.65, scale * 0.025, scale * 0.1, accent, 0, scale * 0.07, -scale * 0.44);
    b.compact();
    const turret = buildWeaponModel(mount, weaponId, scale * 0.13, scale, profile.housing, profile.accent);
    buildWeaponBay(mount, turret, scale);
}
