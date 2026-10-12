import { Color3, DynamicTexture, FresnelParameters, Mesh, MeshBuilder, Scene, StandardMaterial } from '@babylonjs/core';
import { trackPose } from '../../../shared/race/track';
import type { RacePickup } from '../../../shared/race/types';

/** Translucent energy shell, luminous core and upright label; owned by the race scene. */
export function createRacePickup(scene: Scene, pickup: RacePickup): Mesh {
    const color = pickup.item === 'health' ? new Color3(.25, 1, .5) : new Color3(.4, .8, 1);
    const pose = trackPose(pickup.distance, pickup.lane);
    const shell = MeshBuilder.CreateSphere(`race-pickup-${pickup.item}`, { diameter: 3.2, segments: 16 }, scene);
    shell.position.set(pose.x, pose.y + 2.5, pose.z);
    shell.metadata = { roadHeight: pose.y };
    const material = new StandardMaterial(`pickup-shell-${pickup.id}`, scene);
    material.diffuseColor = color.scale(.2); material.emissiveColor = color;
    material.alpha = .25; material.backFaceCulling = false; material.disableLighting = true;
    material.opacityFresnelParameters = new FresnelParameters();
    material.opacityFresnelParameters.leftColor = Color3.White();
    material.opacityFresnelParameters.rightColor = new Color3(.12, .12, .12);
    material.opacityFresnelParameters.power = 2;
    shell.material = material; shell.isPickable = false;
    const core = MeshBuilder.CreateSphere(`pickup-core-${pickup.id}`, { diameter: .65, segments: 8 }, scene);
    core.parent = shell; core.isPickable = false;
    const coreMaterial = new StandardMaterial(`pickup-core-material-${pickup.id}`, scene);
    coreMaterial.emissiveColor = color.scale(1.5); coreMaterial.disableLighting = true;
    core.material = coreMaterial;
    const ring = MeshBuilder.CreateTorus(`pickup-orbit-${pickup.id}`, { diameter: 2.5, thickness: .06, tessellation: 32 }, scene);
    ring.parent = shell; ring.rotation.z = .4; ring.material = coreMaterial; ring.isPickable = false;
    const label = MeshBuilder.CreatePlane(`pickup-label-${pickup.id}`, { width: 5, height: 1.25 }, scene);
    label.parent = shell; label.position.y = 2.4; label.billboardMode = Mesh.BILLBOARDMODE_ALL; label.isPickable = false;
    const text = new DynamicTexture(`pickup-text-${pickup.id}`, { width: 256, height: 64 }, scene, false);
    text.hasAlpha = true;
    text.drawText(pickup.item.toUpperCase(), null, 43, 'bold 30px monospace', '#ffffff', 'transparent', true);
    const labelMaterial = new StandardMaterial(`pickup-label-material-${pickup.id}`, scene);
    labelMaterial.diffuseTexture = text; labelMaterial.emissiveColor = Color3.White(); labelMaterial.disableLighting = true;
    label.material = labelMaterial;
    return shell;
}
