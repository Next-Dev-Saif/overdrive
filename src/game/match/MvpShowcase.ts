import { isVisibleModelMesh } from '../models/ModelBounds';
import { ArcRotateCamera, Color3, Mesh, MeshBuilder, Quaternion, Scene, StandardMaterial, Vector3 } from '@babylonjs/core';

const SHOWCASE_LAYER = 0x10000000;

/** Owns a presentation-only vehicle, stage and orbit camera; never moves a live combatant. */
export class MvpShowcase {
    private readonly vehicle: Mesh;
    private readonly camera: ArcRotateCamera;
    private readonly stage: Mesh;
    private readonly stageMaterial: StandardMaterial;
    private readonly previousCamera;
    private readonly center = new Vector3(0, 200, 0);
    private readonly focus: Vector3;
    private readonly size: number;
    private elapsed = 0;
    private disposed = false;
    private readonly reducedMotion: boolean;

    constructor(privateScene: Scene, source: Mesh, reducedMotion = false) {
        this.scene = privateScene;
        this.reducedMotion = reducedMotion;
        this.previousCamera = this.scene.activeCamera;
        this.vehicle = source.clone('mvp-presentation', null, false);
        this.vehicle.position.copyFrom(this.center);
        this.vehicle.rotationQuaternion = Quaternion.Identity();
        this.vehicle.setEnabled(true);
        for (const mesh of [this.vehicle, ...this.vehicle.getChildMeshes()]) {
            mesh.unfreezeWorldMatrix();
            mesh.metadata = { presentationOnly: true };
            mesh.layerMask = SHOWCASE_LAYER;
            mesh.isPickable = false;
            // Destroyed/cloaked combatants must still have a complete presentation model.
            if (mesh !== this.vehicle) mesh.isVisible = !mesh.name.includes('healthBar');
            mesh.visibility = 1;
            mesh.computeWorldMatrix(true);
        }
        const bounds = this.vehicle.getHierarchyBoundingVectors(true, isVisibleModelMesh);
        const dimensions = bounds.max.subtract(bounds.min);
        this.size = Math.max(4, dimensions.length());
        const lift = this.center.y - bounds.min.y + 0.25;
        this.vehicle.position.y += lift;
        this.focus = bounds.min.add(bounds.max).scale(0.5).add(new Vector3(0, lift, 0));

        this.stage = MeshBuilder.CreateCylinder('mvp-podium', { diameter: this.size * 1.8, height: 0.4, tessellation: 48 }, this.scene);
        this.stage.position.copyFrom(this.center);
        this.stage.layerMask = SHOWCASE_LAYER;
        this.stage.isPickable = false;
        this.stageMaterial = new StandardMaterial('mvp-podium-material', this.scene);
        this.stageMaterial.diffuseColor = new Color3(0.16, 0.18, 0.22);
        this.stageMaterial.emissiveColor = new Color3(0.04, 0.04, 0.05);
        this.stage.material = this.stageMaterial;

        this.camera = new ArcRotateCamera('mvp-camera', Math.PI / 2 + 0.6, Math.PI / 2.8, this.size * 2, this.focus, this.scene);
        this.camera.layerMask = SHOWCASE_LAYER;
        this.camera.minZ = 0.1;
        this.scene.activeCamera = this.camera;
        this.update();
        this.scene.onBeforeRenderObservable.add(this.update);
    }

    private readonly scene: Scene;

    private update = () => {
        const delta = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 0.05);
        this.elapsed += delta;
        if (!this.reducedMotion) {
            this.camera.alpha -= delta * 0.3;
            this.vehicle.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.elapsed * 0.65, Math.sin(this.elapsed * 2) * 0.05, 0);
        }
        // Fit the full model even in a narrow portrait viewport, leaving space for the caption.
        const aspect = this.scene.getEngine().getAspectRatio(this.camera);
        const halfFov = Math.min(this.camera.fov / 2, Math.atan(Math.tan(this.camera.fov / 2) * aspect));
        this.camera.radius = this.size * 0.7 / Math.sin(halfFov);
        this.camera.setTarget(this.focus);
    };

    /** Removes callbacks and presentation resources without disposing shared vehicle materials. */
    public dispose(): void {
        if (this.disposed) return;
        this.disposed = true;
        this.scene.onBeforeRenderObservable.removeCallback(this.update);
        if (this.scene.activeCamera === this.camera) this.scene.activeCamera = this.previousCamera;
        this.camera.dispose();
        this.vehicle.dispose(false, false);
        this.stage.dispose();
        this.stageMaterial.dispose();
    }
}
