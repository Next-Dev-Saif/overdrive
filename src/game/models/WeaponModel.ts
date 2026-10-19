import { Mesh, TransformNode } from '@babylonjs/core';
import { ModelBuilder } from './ModelBuilder';

export type WeaponHousing = 'sport' | 'compact' | 'armored' | 'industrial';

/** Articulated yaw/pitch mounts preserve WeaponController's discovery names. */
export function buildWeaponModel(parent: TransformNode, id: string, height: number, scale = 1, housing: WeaponHousing = 'sport', accent = '#cf973f', side = 0) {
    const scene = parent.getScene();
    const yaw = new Mesh('turret_base', scene); yaw.parent = parent; yaw.position.y = height; yaw.scaling.setAll(scale);
    const base = new ModelBuilder(scene, yaw);
    const steel = ModelBuilder.steelSurface(scene);
    const dark = base.material('weapon-carbon', '#1d2429', 0.65, 0.46);
    const alloy = ModelBuilder.steelSurface(scene, true);
    const warning = base.material('weapon-marking', accent, 0.35, 0.52);
    const energy = base.material('weapon-energy', '#70d5e3', 0.2, 0.2, true);
    base.cylinder('bearing', 0.95, 0.16, dark);
    base.ring('bearing-race', 0.8, 0.06, alloy, 0, 0.09, 0);
    for (const side of [-1, 1]) base.cylinder('trunnion', 0.27, 0.2, alloy, side * 0.42, 0.35, 0, 'x');
    const pitch = new Mesh('turretbox', scene); pitch.parent = yaw; pitch.position.y = 0.38;
    const b = new ModelBuilder(scene, pitch);
    const muzzle = (x: number, y: number, z: number) => {
        const socket = new TransformNode('muzzle_socket', scene);
        socket.parent = pitch;
        socket.position.set(x, y, z);
        return socket;
    };
    b.loft('receiver', [[-0.65, 0.65, -0.23, 0.25], [-0.35, 0.85, -0.3, 0.34], [0.3, 0.68, -0.22, 0.26]], steel);
    for (const side of [-1, 1]) {
        b.cylinder('hydraulic', 0.13, 0.75, alloy, side * 0.39, -0.13, 0.1, 'z');
        for (let i = 0; i < 4; i++) b.box('cooling-vent', 0.025, 0.13, 0.07, dark, side * 0.429, 0.07, -0.35 + i * 0.12);
    }
    // Vehicle-specific shells retain the recognizable mechanism for each weapon type.
    if (housing === 'sport') {
        b.loft('aero-receiver-cover', [[-0.68, 0.72, 0.18, 0.3], [-0.24, 0.82, 0.24, 0.4], [0.2, 0.62, 0.18, 0.28]], dark);
        b.box('receiver-stripe', 0.14, 0.025, 0.58, warning, 0, 0.4, -0.22);
    } else if (housing === 'compact') {
        for (const flank of [-1, 1]) b.box('flush-receiver-panel', 0.06, 0.34, 0.7, dark, flank * 0.43, 0, -0.22);
        b.box('compact-sight', 0.12, 0.08, 0.3, warning, 0, 0.35, -0.25);
    } else {
        for (const flank of [-1, 1]) {
            b.box('armored-cheek', 0.12, 0.52, 0.95, dark, flank * 0.48, 0, -0.2);
            b.box('cheek-marking', 0.025, 0.12, 0.45, warning, flank * 0.55, 0.12, -0.2);
        }
        if (housing === 'industrial') {
            b.box('industrial-top-guard', 1.08, 0.12, 0.85, steel, 0, 0.42, -0.24);
            for (const flank of [-1, 1]) b.cylinder('external-recoil-ram', 0.12, 0.85, alloy, flank * 0.58, -0.18, 0.14, 'z');
        }
    }
    if (id === 'minigun') {
        b.cylinder('rotor', 0.64, 0.35, dark, 0, 0, 0.36, 'z');
        for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3, x = Math.cos(a) * 0.21, y = Math.sin(a) * 0.21;
            b.bore('barrel', 0.072, 1.35, alloy, x, y, 1.05);
            muzzle(x, y, 1.7);
        }
        for (const z of [0.58, 1.5]) b.ring('barrel-clamp', 0.55, 0.1, dark, 0, 0, z, 'z');
        b.cylinder('ammunition-drum', 0.64, 0.48, dark, (side || -1) * 0.65, 0, -0.22, 'x');
        for (let i = 0; i < 7; i++) b.cylinder('feed-round', 0.07, 0.27, warning, (side || -1) * (0.57 - i * 0.08), 0.32, -0.25, 'z');
    } else if (id === 'plasma') {
        b.bore('barrel', 0.22, 1.45, dark, 0, 0, 0.9);
        for (let i = 0; i < 5; i++) {
            b.ring('induction-coil', 0.48, 0.07, energy, 0, 0, 0.4 + i * 0.22, 'z');
            for (const side of [-1, 1]) b.box('heat-sink', 0.13, 0.48, 0.065, alloy, side * 0.31, 0, 0.4 + i * 0.22);
        }
        b.bore('muzzle-shroud', 0.32, 0.26, steel, 0, 0, 1.58);
        muzzle(0, 0, 1.69);
    } else if (id === 'missile') {
        for (const side of [-1, 1]) for (const y of [-0.2, 0.2]) {
            b.bore('barrel', 0.185, 1.25, steel, side * 0.3, y, 0.52);
            b.cylinder('warhead', 0.22, 0.3, warning, side * 0.3, y, 0.92, 'z', 0.02).rotation.x = -Math.PI / 2;
            b.ring('tube-lip', 0.36, 0.04, alloy, side * 0.3, y, 1.16, 'z');
            muzzle(side * 0.3, y, 1.18);
        }
        b.box('sight', 0.18, 0.12, 0.35, dark, 0, 0.48, 0.25);
    } else if (id === 'mortar') {
        b.bore('barrel', 0.32, 1.8, steel, 0, 0.1, 0.8);
        for (const z of [0.25, 1.3]) b.ring('reinforcement', 0.67, 0.09, alloy, 0, 0.1, z, 'z');
        for (const side of [-1, 1]) b.cylinder('recoil-piston', 0.16, 1.1, dark, side * 0.4, -0.1, 0.65, 'z');
        b.bore('muzzle-brake', 0.4, 0.35, dark, 0, 0.1, 1.63);
        muzzle(0, 0.1, 1.79);
    } else {
        b.bore('barrel', 0.46, 2.1, steel, 0, 0.08, 0.65);
        b.cylinder('payload', 0.66, 0.65, warning, 0, 0.08, 1.38, 'z', 0.05).rotation.x = -Math.PI / 2;
        for (const z of [-0.1, 0.7]) b.ring('restraint-band', 0.96, 0.08, dark, 0, 0.08, z, 'z');
        for (const side of [-1, 1]) b.box('blast-shield', 0.12, 0.8, 1.5, dark, side * 0.6, -0.05, 0.25);
        muzzle(0, 0.08, 1.72);
    }
    b.compact(); base.compact();
    return yaw;
}
