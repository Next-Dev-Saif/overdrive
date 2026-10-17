import { buildOuterLandscape } from '../levels/OuterLandscape';
import { Color3, Color4, HemisphericLight, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3, VertexData } from '@babylonjs/core';
import { CHECKPOINTS, LENGTHS, ROAD_WIDTH, TRACK, trackPose } from '../../../shared/race/track';

/** Closed, seamless asphalt ribbon with continuous barriers and authored race markings. */
export function buildRaceTrack(scene: Scene): void {
    scene.clearColor = new Color4(.12, .15, .18, 1);
    scene.fogMode = Scene.FOGMODE_EXP2; scene.fogDensity = .0015; scene.fogColor = new Color3(.12, .15, .18);
    const light = new HemisphericLight('race-daylight', new Vector3(.3, 1, -.4), scene); light.intensity = 1.25;
    const material = (name: string, color: string) => { const mat = new StandardMaterial(name, scene); mat.diffuseColor = Color3.FromHexString(color); mat.specularColor.set(.06, .06, .06); return mat; };
    const asphalt = material('race-asphalt', '#303338'), gravel = material('race-infield', '#5c655b');
    const white = material('race-paint', '#e5e4dc'), dark = material('race-barrier', '#686f76');
    const ground = MeshBuilder.CreateGround('race-surrounds', { width: 1000, height: 1000 }, scene); ground.position.y = -.12; ground.material = gravel;
    buildOuterLandscape(scene, 'race', 370);
    const positions: number[] = [], indices: number[] = [], uvs: number[] = [];
    for (let i = 0; i <= TRACK.length; i++) {
        const pose = trackPose(i === TRACK.length ? 0 : LENGTHS[i]);
        for (const side of [-1, 1]) { positions.push(pose.x + pose.tz * ROAD_WIDTH / 2 * side, pose.y, pose.z - pose.tx * ROAD_WIDTH / 2 * side); uvs.push(side > 0 ? 1 : 0, i / 8); }
        if (i < TRACK.length) { const k = i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const road = new Mesh('race-tarmac', scene); const data = new VertexData(); const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals); data.positions = positions; data.indices = indices; data.normals = normals; data.uvs = uvs; data.applyToMesh(road); road.material = asphalt;
    const scenery: Mesh[] = [];
    const mark = (name: string, distance: number, lane: number, width: number, length: number, height: number, mat: StandardMaterial) => {
        const pose = trackPose(distance, lane); const mesh = MeshBuilder.CreateBox(name, { width, depth: length * Math.sqrt(1 + pose.grade * pose.grade), height }, scene);
        mesh.position.set(pose.x, pose.y + height / 2, pose.z); mesh.rotation.set(pose.pitch, pose.yaw, 0); mesh.material = mat; mesh.isPickable = false; scenery.push(mesh); return mesh;
    };
    for (let i = 0; i < TRACK.length; i++) {
        const length = LENGTHS[i + 1] - LENGTHS[i], distance = LENGTHS[i] + length / 2;
        for (const side of [-1, 1]) {
            mark('race-safety-barrier', distance, side * (ROAD_WIDTH / 2 + .5), 1, length + .4, 1.5, i % 4 < 2 ? white : dark);
            mark('race-edge-line', distance, side * (ROAD_WIDTH / 2 - .8), .18, length + .1, .035, white);
        }
        const elevation = trackPose(distance).y;
        if (elevation > .8) {
            const deck = mark('race-bridge-deck', distance, 0, ROAD_WIDTH + 2, length + .5, .8, dark);
            deck.position.y -= .85;
            if (i % 8 === 0 && elevation > 4) {
                for (const side of [-1, 1]) {
                    const support = mark('race-bridge-pier', distance, side * 9, 2, 3, elevation, dark);
                    support.position.y = elevation / 2 - .1; support.rotation.x = 0;
                }
                const beam = mark('race-bridge-crossbeam', distance, 0, ROAD_WIDTH + 2, 2, 1, dark);
                beam.position.y -= 1.8;
            }
        }
        if (i % 4 === 0) mark('race-lane-dash', distance, 0, .18, 3, .04, white);
    }
    for (let lane = -5; lane <= 5; lane++) for (let row = 0; row < 2; row++) mark('race-finish-checker', row * 1.5, lane * 2, 2, 1.5, .05, (lane + row) % 2 ? white : asphalt);
    for (let i = 0; i < 6; i++) mark('race-grid-slot', -10 - Math.floor(i / 2) * 10, i % 2 ? 4 : -4, 5, .3, .04, white);
    for (const checkpoint of CHECKPOINTS) {
        const distance = LENGTHS[checkpoint];
        for (const side of [-1, 1]) { const post = mark('race-checkpoint-post', distance, side * 13, .6, .6, 5, white); post.rotation.x = 0; }
        if (checkpoint === 0) { const gantry = mark('race-start-gantry', distance, 0, 27, .8, .7, dark); gantry.position.y = trackPose(distance).y + 6; }
    }
    // Batch only static scenery, leaving articulated vehicles and pickups independent.
    for (const mat of [white, dark, asphalt]) {
        const meshes = scenery.filter(mesh => mesh.material === mat);
        for (let i = 0; i < meshes.length; i += 96) {
            const batch = Mesh.MergeMeshes(meshes.slice(i, i + 96), true, true);
            if (batch) { batch.name = 'race-static-scenery'; batch.isPickable = false; batch.freezeWorldMatrix(); }
        }
    }
}
