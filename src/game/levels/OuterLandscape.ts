import { Color3, Matrix, Mesh, MeshBuilder, Quaternion, Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import { buildLandscapeTerrain, landscapeNoise } from './LandscapeTerrain';

interface LandscapeInstance { x: number; y: number; z: number; width: number; height: number; depth: number; yaw: number }

/** Biome-specific scenery, composed in uneven clusters and batched by material. Never collidable. */
export function buildOuterLandscape(scene: Scene, theme: string, radius: number): void {
    const desert = theme === 'wasteland', ice = theme === 'glacial', city = theme === 'neon';
    const seed = desert ? 17 : ice ? 53 : city ? 91 : 37;
    const random = (i: number, channel: number) => landscapeNoise(i * 3.17, channel * 7.91, seed);
    const heightAt = buildLandscapeTerrain(scene, theme, radius);
    const material = (name: string, color: string, glow = false) => {
        const mat = new StandardMaterial(`horizon-${name}`, scene);
        mat.diffuseColor = Color3.Lerp(Color3.FromHexString(color), scene.fogColor, .14);
        mat.emissiveColor = mat.diffuseColor.scale(glow ? .85 : .18); mat.specularColor.setAll(0); mat.fogEnabled = false;
        return mat;
    };
    const foliage = material('foliage', ice ? '#42626a' : desert ? '#796747' : '#365448');
    const bark = material('bark', desert ? '#69523a' : '#4d5149');
    const stone = material('rock', ice ? '#9fb7bf' : desert ? '#a8835f' : '#62716d');
    const snow = ice ? material('snow', '#d7e5e6') : null;
    const batch = (mesh: Mesh, instances: LandscapeInstance[], mat: StandardMaterial) => {
        if (!instances.length) { mesh.dispose(); return; }
        const transforms = new Float32Array(instances.length * 16);
        instances.forEach((p, i) => Matrix.Compose(new Vector3(p.width, p.height, p.depth), Quaternion.RotationYawPitchRoll(p.yaw, 0, 0), new Vector3(p.x, p.y, p.z)).copyToArray(transforms, i * 16));
        mesh.material = mat; mesh.thinInstanceSetBuffer('matrix', transforms, 16, true);
        mesh.isPickable = false; mesh.metadata = { presentationOnly: true, outerLandscape: true }; mesh.freezeWorldMatrix();
    };
    const trunks: LandscapeInstance[] = [], crowns: LandscapeInstance[] = [], caps: LandscapeInstance[] = [], rocks: LandscapeInstance[] = [];
    // Grove centres leave broad gaps and view corridors instead of forming a uniform tree fence.
    const count = desert ? 110 : city ? 140 : 480;
    for (let i = 0; i < count; i++) {
        const cluster = i % 11, a = cluster * 2.39996 + (random(i, 1) - .5) * .38;
        const r = radius + 35 + random(i, 2) * (desert ? 155 : 125), x = Math.cos(a) * r, z = Math.sin(a) * r;
        const base = heightAt(x, z) - 2, h = (desert ? 5 : 13) + random(i, 3) * (desert ? 11 : 24);
        const yaw = random(i, 4) * Math.PI * 2, width = h * (.22 + random(i, 5) * .16);
        const pose = { x, z, yaw, depth: width, width, height: h, y: base };
        trunks.push({ ...pose, width: h * .055, depth: h * .055, height: h * .65, y: base + h * .325 });
        if (desert) {
            // Sparse acacia scrub, squat crowns and exposed trunks fit the dry environment.
            crowns.push({ ...pose, width: width * 1.7, depth: width * 1.4, height: h * .3, y: base + h * .7 });
        } else {
            for (let tier = 0; tier < 3; tier++) {
                crowns.push({ ...pose, width: width * (1.25 - tier * .28), depth: width * (1.25 - tier * .28), height: h * .55, y: base + h * (.43 + tier * .22) });
                if (ice) caps.push({ ...pose, width: width * (.9 - tier * .2), depth: width * (.9 - tier * .2), height: h * .36, y: base + h * (.53 + tier * .22) });
            }
        }
    }
    batch(MeshBuilder.CreateCylinder('horizon-tree-trunks', { diameter: 1, height: 1, tessellation: 5 }, scene), trunks, bark);
    const canopy = desert ? MeshBuilder.CreateIcoSphere('horizon-acacias', { radius: .5, subdivisions: 1, flat: true }, scene) : MeshBuilder.CreateCylinder('horizon-layered-pines', { diameterBottom: 1, diameterTop: 0, height: 1, tessellation: 7 }, scene);
    batch(canopy, crowns, foliage);
    if (snow) batch(MeshBuilder.CreateCylinder('horizon-snow-boughs', { diameterBottom: 1, diameterTop: 0, height: 1, tessellation: 7 }, scene), caps, snow);
    for (let i = 0; i < 95; i++) {
        const a = random(i, 6) * Math.PI * 2, r = radius + 35 + random(i, 7) * 220;
        const x = Math.cos(a) * r, z = Math.sin(a) * r, h = 5 + random(i, 8) * (ice ? 35 : 17);
        rocks.push({ x, z, y: heightAt(x, z) + h * .23, width: h * (.65 + random(i, 9)), height: h, depth: h * .7, yaw: a });
    }
    batch(MeshBuilder.CreateIcoSphere('horizon-boulder-fields', { radius: .5, subdivisions: 1, flat: true }, scene), rocks, stone);
    if (city || theme === 'facility') buildOuterDistricts(scene, theme, radius, heightAt, random, material, batch);
}

/** A few recognizable districts: staggered towers for Neon, tanks and gantries for Facility. */
function buildOuterDistricts(
    scene: Scene, theme: string, radius: number, heightAt: (x: number, z: number) => number,
    random: (i: number, channel: number) => number,
    material: (name: string, color: string, glow?: boolean) => StandardMaterial,
    batch: (mesh: Mesh, instances: LandscapeInstance[], mat: StandardMaterial) => void,
): void {
    const city = theme === 'neon', blocks: LandscapeInstance[] = [], details: LandscapeInstance[] = [], windows: LandscapeInstance[] = [];
    for (let i = 0; i < (city ? 68 : 22); i++) {
        const district = i % 5, a = district * 1.2566 + .3 + (random(i, 11) - .5) * .52;
        const r = radius + 85 + random(i, 12) * 150, x = Math.cos(a) * r, z = Math.sin(a) * r;
        const h = city ? 30 + Math.pow(random(i, 13), 1.8) * 175 : 18 + random(i, 13) * 32;
        const w = 12 + random(i, 14) * 22, d = 15 + random(i, 15) * 23, base = heightAt(x, z) - 3;
        const pose = { x, z, y: base + h / 2, width: w, height: h, depth: d, yaw: -a };
        blocks.push(pose);
        if (city) {
            details.push({ ...pose, width: w * .68, depth: d * .65, height: h * .18, y: base + h * 1.06 });
            if (i % 4 === 0) details.push({ ...pose, width: 1.2, depth: 1.2, height: 22, y: base + h * 1.18 + 9 });
            for (let row = 0; row < Math.floor(h / 7); row++) {
                if (random(i + row, 17) < .28) continue;
                // Light bands wrap around towers so all approach directions have a lit silhouette.
                windows.push({ ...pose, width: w + .15, depth: d + .15, height: .65, y: base + 5 + row * 7 });
            }
        } else {
            for (const side of [-1, 1]) details.push({ ...pose, x: x + side * w * .7, width: 2, depth: 2, height: h * 1.3, y: base + h * .65 });
            details.push({ ...pose, width: w * 1.8, height: 2, depth: 3, y: base + h * 1.28 });
        }
    }
    const buildings = material('district-shells', city ? '#26323e' : '#68767a');
    const trim = material('district-rooftops', city ? '#35424c' : '#95805f');
    const geometry = city ? MeshBuilder.CreateBox('horizon-city-districts', { size: 1 }, scene) : MeshBuilder.CreateCylinder('horizon-refinery-tanks', { diameter: 1, height: 1, tessellation: 12 }, scene);
    batch(geometry, blocks, buildings);
    batch(MeshBuilder.CreateBox('horizon-district-details', { size: 1 }, scene), details, trim);
    if (city) batch(MeshBuilder.CreateBox('horizon-window-bands', { size: 1 }, scene), windows, material('district-windows', '#8caeae', true));
}
