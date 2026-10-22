import { Color3, Mesh, MeshBuilder, TransformNode, Vector3 } from '@babylonjs/core';
import { ModelBuilder } from './ModelBuilder';
import { buildVehicleWeapons } from './WeaponAttachments';

export interface ChassisDimensions { width: number; height: number; depth: number }

/** Shared showroom/game asset: shaped panels, glass, driveline and articulated running gear. */
export function buildVehicleModel(root: Mesh, id: string, weapon: string, size: ChassisDimensions, color: Color3, wheelScale: number) {
    const scene = root.getScene(), { width: w, height: h, depth: d } = size;
    const radius = 0.6 * wheelScale;
    const visual = new TransformNode('visualRoot', scene); visual.parent = root;
    const tireY = -h / 2 + 0.2;
    visual.position.y = -(h + radius + 0.2) / 2 - (tireY - radius);
    const chassis = new TransformNode('chassisRoot', scene); chassis.parent = visual;
    const b = new ModelBuilder(scene, chassis);
    const paint = b.material('body-paint', color.toHexString(), 0.45, 0.3);
    paint.clearCoat.isEnabled = true; paint.clearCoat.intensity = 0.65; paint.clearCoat.roughness = 0.25;
    const armor = b.material('armored-steel', '#394047', 0.7, 0.48);
    const rubber = b.material('rubber', '#181b1e', 0, 0.94);
    const alloy = b.material('brushed-alloy', '#889398', 0.78, 0.3);
    const glass = b.material('smoked-glass', '#243d4c', 0.25, 0.12);
    const lamp = b.material('headlamp', '#e8e1cc', 0.1, 0.2, true);
    const tail = b.material('tail-lamp', '#a93428', 0.1, 0.3, true);
    const heavy = ['juggernaut', 'behemoth', 'manticore'].includes(id);
    const hover = id === 'wraith';
    const cabinTop = h * (heavy ? 0.9 : 1.05) + 0.18;
    b.loft('sculpted-hull', [[-d * 0.5, w * 0.8, -h * 0.36, h * 0.16], [-d * 0.32, w, -h * 0.45, h * 0.42], [d * 0.14, w * 0.97, -h * 0.45, h * 0.34], [d * 0.43, w * 0.86, -h * 0.3, h * 0.21], [d * 0.52, w * 0.66, -h * 0.2, h * 0.03]], paint);
    b.loft('undertray', [[-d * 0.48, w * 0.85, -h * 0.47, -h * 0.31], [d * 0.4, w * 0.86, -h * 0.47, -h * 0.3], [d * 0.52, w * 0.65, -h * 0.34, -h * 0.19]], armor);
    b.loft('glazed-cabin', [[-d * 0.28, w * 0.72, h * 0.34, h * 0.45], [-d * 0.13, w * 0.67, h * 0.35, cabinTop], [d * 0.06, w * 0.6, h * 0.33, cabinTop * 0.97], [d * 0.25, w * 0.72, h * 0.27, h * 0.38]], glass);
    b.loft('roof', [[-d * 0.15, w * 0.68, cabinTop - 0.045, cabinTop + 0.045], [d * 0.06, w * 0.61, cabinTop * 0.97 - 0.045, cabinTop * 0.97 + 0.045]], paint);
    const axleZ = d / 2 - 0.8 * wheelScale;
    for (const side of [-1, 1]) {
        b.box('sill', 0.13, h * 0.28, d * 0.58, armor, side * w * 0.49, -h * 0.2, 0);
        b.box('door-seam', 0.012, h * 0.38, 0.018, rubber, side * w * 0.498, h * 0.05, -d * 0.1);
        b.box('door-handle', 0.045, 0.035, 0.17, alloy, side * w * 0.502, h * 0.22, -d * 0.16);
        b.box('mirror-stalk', 0.2, 0.045, 0.05, armor, side * w * 0.48, h * 0.57, d * 0.15);
        b.box('mirror', 0.13, 0.1, 0.22, paint, side * w * 0.55, h * 0.6, d * 0.14);
        b.box('headlight-recess', w * 0.25, 0.16, 0.08, rubber, side * w * 0.25, h * 0.04, d * 0.49);
        b.box('headlight', w * 0.22, 0.06, 0.09, lamp, side * w * 0.25, h * 0.04, d * 0.495);
        b.box('tail-light', w * 0.22, 0.07, 0.06, tail, side * w * 0.26, h * 0.06, -d * 0.505);
        b.bore('exhaust', 0.11 * wheelScale, 0.42, alloy, side * w * 0.3, -h * 0.27, -d * 0.48);
        if (!hover) for (const z of [-axleZ, axleZ]) {
            // Only the upper wheel arch: the tread remains the lowest point of the running gear.
            const path = Array.from({ length: 17 }, (_, i) => {
                const angle = Math.PI * (0.08 + i / 16 * 0.84);
                return new Vector3(side * (w / 2 + 0.08 * wheelScale), tireY + Math.sin(angle) * radius * 1.2, z + Math.cos(angle) * radius * 1.2);
            });
            const arch = MeshBuilder.CreateTube('upper-fender', { path, radius: 0.065 * wheelScale, tessellation: 8, cap: Mesh.CAP_ALL }, scene);
            b.place(arch, paint, 0, 0, 0);
        }
    }
    for (let i = -3; i <= 3; i++) b.box('front-grille', 0.04, h * 0.17, 0.04, alloy, i * w * 0.065, -h * 0.12, d * 0.518);
    for (let i = 0; i < 5; i++) b.box('hood-louvre', w * 0.38, 0.026, 0.05, armor, 0, h * 0.32 - i * 0.018, d * 0.23 + i * 0.13);
    if (heavy) {
        for (const side of [-1, 1]) {
            const plate = b.box('side-armor', 0.16, h * 0.44, d * 0.5, armor, side * w * 0.49, h * 0.1, -d * 0.04); plate.rotation.z = side * -0.12;
            for (let i = 0; i < 5; i++) b.cylinder('armor-fastener', 0.08, 0.18, alloy, side * w * 0.51, h * 0.28, -d * 0.23 + i * d * 0.1, 'x');
        }
        b.loft('ram-plow', [[d * 0.48, w * 0.95, -h * 0.37, h * 0.1], [d * 0.61, w * 0.7, -h * 0.43, -h * 0.25]], alloy);
    }
    if (id === 'valkyrie' || id === 'phantom') {
        for (const side of [-1, 1]) b.box('wing-upright', 0.08, 0.35, 0.14, armor, side * w * 0.32, h * 0.44, -d * 0.4);
        b.loft('aero-wing', [[-d * 0.49, w * 1.05, h * 0.66, h * 0.72], [-d * 0.36, w * 0.92, h * 0.61, h * 0.67]], armor);
    }
    if (id === 'interceptor') b.loft('supercharger', [[d * 0.22, 0.48, h * 0.29, h * 0.48], [d * 0.36, 0.4, h * 0.24, h * 0.39]], alloy);
    if (id === 'manticore' || id === 'behemoth') for (const side of [-1, 1]) b.cylinder('vertical-exhaust', 0.15 * wheelScale, h * 0.9, alloy, side * w * 0.4, h * 0.6, -d * 0.25);
    if (hover) {
        const glow = b.material('hover-coil', '#79cddd', 0.1, 0.4, true);
        for (const side of [-1, 1]) for (const z of [-d * 0.3, d * 0.3]) {
            b.cylinder('duct', 0.9, 0.28, armor, side * w * 0.5, -0.18, z);
            b.ring('duct-ring', 0.73, 0.12, alloy, side * w * 0.5, -0.02, z);
            b.ring('lift-coil', 0.72, 0.07, glow, side * w * 0.5, -0.34, z);
            for (let i = 0; i < 4; i++) b.box('fan-blade', 0.65, 0.025, 0.08, rubber, side * w * 0.5, -0.04, z).rotation.y = i * Math.PI / 4;
        }
    } else {
        const offsets = [[1, axleZ], [-1, axleZ], [1, -axleZ], [-1, -axleZ]];
        offsets.forEach(([side, z], index) => {
            const pivot = new TransformNode(`wheelPivot${index}`, scene); pivot.parent = visual; pivot.position.set(side * (w / 2 + 0.08 * wheelScale), tireY, z);
            const wheel = new Mesh(`wheel${index}`, scene); wheel.parent = pivot;
            const wb = new ModelBuilder(scene, wheel), thickness = 0.55 * wheelScale;
            wb.cylinder('tire-carcass', radius * 2, thickness, rubber, 0, 0, 0, 'x');
            for (const face of [-1, 1]) {
                const x = face * thickness / 2;
                wb.ring('rounded-sidewall', radius * 1.69, radius * 0.3, rubber, x * 0.84, 0, 0, 'x');
                wb.cylinder('brake-disc', radius * 1.13, 0.025, armor, x + face * 0.02, 0, 0, 'x');
                wb.ring('rim-lip', radius * 1.18, 0.07, alloy, x + face * 0.045, 0, 0, 'x');
                wb.cylinder('hub', radius * 0.36, 0.09, alloy, x, 0, 0, 'x');
                for (let i = 0; i < 5; i++) {
                    const a = i * Math.PI * 2 / 5;
                    const spoke = wb.box('alloy-spoke', 0.055, radius * 0.5, 0.075, alloy, x + face * 0.04, Math.cos(a) * radius * 0.33, Math.sin(a) * radius * 0.33); spoke.rotation.x = a;
                }
            }
            for (let i = 0; i < 24; i++) {
                const a = i * Math.PI / 12;
                const tread = wb.box('tread-block', thickness * 0.82, 0.045, radius * 0.13, rubber, 0, Math.cos(a) * radius, Math.sin(a) * radius); tread.rotation.x = a;
            }
            wb.compact();
            b.cylinder('axle', 0.12, w, armor, 0, tireY, z, 'x');
        });
    }
    b.compact();
    buildVehicleWeapons(chassis, id, weapon, { width: w + 0.8 * wheelScale, height: cabinTop + h * 0.45, depth: d, bottom: -h * 0.45, bonnetHeight: h * 0.48 });
    return visual;
}
