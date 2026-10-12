import { Color3, DynamicTexture, Mesh, MeshBuilder, StandardMaterial } from '@babylonjs/core';
import type { TeamId } from '../../../shared/match';

const TEAM_STYLE: Record<TeamId, { color: string; glyph: string }> = {
    alpha: { color: '#39b8c9', glyph: 'A  ▲' },
    bravo: { color: '#d9823b', glyph: 'B  ◆' },
};

/** Adds a lightweight billboard that keeps team identity visible without repainting the vehicle. */
export function attachTeamMarker(root: Mesh, teamId: TeamId, isLocal = false): Mesh | null {
    if (isLocal) return null;
    const scene = root.getScene();
    const style = TEAM_STYLE[teamId];
    const marker = MeshBuilder.CreatePlane(`team-marker-${teamId}`, { width: 2.5, height: 0.75 }, scene);
    marker.billboardMode = Mesh.BILLBOARDMODE_ALL;
    marker.isPickable = false;
    marker.metadata = { presentationOnly: true, teamId };

    const updatePosition = () => {
        const rootPosition = root.getAbsolutePosition();
        const labelHeight = typeof root.metadata?.labelHeight === 'number' ? root.metadata.labelHeight - 0.9 : 4.9;
        marker.position.set(rootPosition.x, rootPosition.y + labelHeight, rootPosition.z);
    };
    updatePosition();
    const observer = scene.onBeforeRenderObservable.add(updatePosition);
    root.onDisposeObservable.addOnce(() => {
        scene.onBeforeRenderObservable.remove(observer);
        marker.dispose(false, true);
    });

    const texture = new DynamicTexture(`team-marker-texture-${root.uniqueId}`, { width: 256, height: 80 }, scene, true);
    texture.hasAlpha = true;
    texture.drawText(style.glyph, null, 54, 'bold 38px monospace', style.color, 'rgba(8, 14, 18, 0.82)', true, true);
    const material = new StandardMaterial(`team-marker-material-${root.uniqueId}`, scene);
    material.diffuseTexture = texture;
    material.emissiveColor = Color3.FromHexString(style.color).scale(0.6);
    material.opacityTexture = texture;
    material.disableLighting = true;
    marker.material = material;
    return marker;
}
