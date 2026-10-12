import { Color3, MeshBuilder, PBRMaterial, Scene } from '@babylonjs/core';

/** A matte service bay with floor markings and a shutter, without animated showroom ornaments. */
export function createGarageBay(scene: Scene): void {
    const material = (name: string, color: string, roughness = 0.9) => {
        const value = new PBRMaterial(name, scene);
        value.albedoColor = Color3.FromHexString(color);
        value.metallic = 0;
        value.roughness = roughness;
        return value;
    };
    const concrete = material('garage-concrete', '#111827');
    const paint = material('garage-floor-paint', '#626d7c');
    const wallFinish = material('garage-wall-finish', '#080f1c');
    const shutterFinish = material('garage-shutter-finish', '#1b2637');
    const floor = MeshBuilder.CreateGround('showroom-floor', { width: 80, height: 80 }, scene);
    floor.position.y = -2.2;
    floor.material = concrete;
    floor.receiveShadows = true;
    const pad = MeshBuilder.CreateGround('service-pad', { width: 11, height: 13 }, scene);
    pad.position.y = -2.19;
    pad.material = material('garage-bay-floor', '#151e2d');
    pad.receiveShadows = true;
    for (const x of [-5.5, 5.5]) {
        const stripe = MeshBuilder.CreateGround('bay-stripe', { width: 0.1, height: 13 }, scene);
        stripe.parent = pad;
        stripe.position.set(x, 0.012, 0);
        stripe.material = paint;
    }
    // One-sided backdrop surfaces keep the vehicle visible when inspecting from behind the bay.
    const wall = MeshBuilder.CreatePlane('garage-back-wall', { width: 40, height: 12 }, scene);
    wall.parent = floor;
    wall.rotation.y = Math.PI;
    wall.position.set(0, 6, -12);
    wall.material = wallFinish;
    const door = MeshBuilder.CreatePlane('garage-shutter', { width: 9, height: 6 }, scene);
    door.parent = floor;
    door.rotation.y = Math.PI;
    door.position.set(0, 3, -11.8);
    door.material = shutterFinish;
    for (let height = 0.5; height < 6; height += 0.5) {
        const seam = MeshBuilder.CreatePlane('shutter-seam', { width: 9, height: 0.025 }, scene);
        seam.parent = door;
        seam.position.set(0, height - 3, -0.08);
        seam.material = wallFinish;
    }
}
