import { isVisibleModelMesh } from '../../game/models/ModelBounds';
import { useEffect, useRef, useState } from 'react';
import { Engine, Scene, Vector3, ArcRotateCamera, Color4, Color3, HemisphericLight, DirectionalLight, ShadowGenerator, MeshBuilder, PBRMaterial, Mesh } from '@babylonjs/core';
import type { RemoteVehicle } from '../../game/entities/RemoteVehicle';
import { RotateCcw } from 'lucide-react';
import { createGarageBay } from '../page-sections/garage/createGarageBay';
import { VehicleFactory } from '../../game/entities/VehicleFactory';

interface GarageRendererProps { vehicleId: string; weaponId: string; vehicleColor?: string; environment?: 'showroom' | 'garage'; }

/** Each preview owns its materials; disposing the network wrapper also removes its scene observer. */
function disposePreview(vehicle: RemoteVehicle) {
    const materials = new Set(vehicle.mesh.getChildMeshes().map(mesh => mesh.material));
    vehicle.dispose();
    materials.forEach(material => material?.dispose());
}

/** One scene per preview; equipment changes are cancellation-safe and dispose their owned materials. */
export function GarageRenderer({ vehicleId, weaponId, vehicleColor, environment = 'showroom' }: GarageRendererProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<Scene | null>(null);
    const resetViewRef = useRef<(() => void) | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        let engine: Engine | undefined;
        let resize: ResizeObserver | undefined;
        try {
            engine = new Engine(canvas, true, { stencil: true, powerPreference: 'high-performance' });
            engine.setHardwareScalingLevel(Math.max(1, (window.devicePixelRatio || 1) / 1.5));
            const scene = new Scene(engine); sceneRef.current = scene;
            scene.clearColor = Color4.FromHexString('#020617ff');
            scene.skipPointerMovePicking = true;
            scene.ambientColor = new Color3(0.22, 0.24, 0.28);
            const camera = new ArcRotateCamera('showroom-camera', Math.PI / 3, 1.15, 11, new Vector3(0, 0.4, 0), scene);
            camera.attachControl(canvas, true); camera.lowerRadiusLimit = 6; camera.upperRadiusLimit = 20;
            camera.lowerBetaLimit = 0.35; camera.upperBetaLimit = 1.45; camera.wheelPrecision = 45;
            const fill = new HemisphericLight('fill', new Vector3(0, 1, 0), scene); fill.intensity = 1.15; fill.groundColor = new Color3(0.2, 0.22, 0.26);
            const key = new DirectionalLight('key', new Vector3(-1, -2, 1), scene); key.position.set(8, 12, -8); key.intensity = 2.4;
            const rim = new DirectionalLight('rim', new Vector3(1, -0.5, -1), scene); rim.diffuse = environment === 'garage' ? new Color3(0.9, 0.9, 0.85) : new Color3(0.66, 0.78, 1); rim.intensity = 1.6;
            const shadows = new ShadowGenerator(environment === 'garage' ? 1024 : 2048, key); shadows.usePercentageCloserFiltering = true;
            
            if (environment === 'garage') {
                createGarageBay(scene);
            } else {
                // Premium dark reflective floor
                const floor = MeshBuilder.CreateGround('showroom-floor', { width: 200, height: 200 }, scene); 
                floor.position.y = -2.2; floor.receiveShadows = true;
                const floorMat = new PBRMaterial('floor-finish', scene); 
                floorMat.albedoColor = Color3.FromHexString('#020617'); 
                floorMat.metallic = 0.95; 
                floorMat.roughness = 0.15; 
                floor.material = floorMat;
            
                // Hexagonal main service pad
                const pad = MeshBuilder.CreateCylinder('service-pad', { diameter: 14, height: 0.15, tessellation: 6 }, scene); 
                pad.position.y = -2.25; 
                const padMat = new PBRMaterial('pad-mat', scene);
                padMat.albedoColor = Color3.FromHexString('#0f172a');
                padMat.metallic = 0.8;
                padMat.roughness = 0.3;
                pad.material = padMat;
                pad.receiveShadows = true;

                // Inner glowing LED ring
                const glowRing = MeshBuilder.CreateTorus('glow-ring', { diameter: 10, thickness: 0.08, tessellation: 64 }, scene);
                glowRing.parent = pad;
                glowRing.position.y = 0.08; 
                const glowMat = new PBRMaterial('glow-mat', scene);
                glowMat.albedoColor = Color3.Black();
                glowMat.emissiveColor = Color3.White();
                glowMat.emissiveIntensity = 4.0;
                glowMat.disableLighting = true;
                glowRing.material = glowMat;

                // Outer thin metallic ring
                const outerRing = MeshBuilder.CreateTorus('outer-ring', { diameter: 18, thickness: 0.03, tessellation: 64 }, scene);
                outerRing.parent = pad;
                outerRing.position.y = -0.05;
                const outerMat = new PBRMaterial('outer-mat', scene);
                outerMat.albedoColor = Color3.White();
                outerMat.metallic = 1.0;
                outerMat.roughness = 0.2;
                outerMat.alpha = 0.4;
                outerMat.transparencyMode = PBRMaterial.MATERIAL_ALPHABLEND;
                outerRing.material = outerMat;
            }
            const motion = matchMedia('(prefers-reduced-motion: reduce)');
            let orbit = environment !== 'garage';
            const stopOrbit = () => { orbit = false; };
            canvas.addEventListener('pointerdown', stopOrbit);
            engine.runRenderLoop(() => { if (orbit && !motion.matches) camera.alpha += Math.min(engine!.getDeltaTime(), 40) * 0.00007; scene.render(); });
            resize = new ResizeObserver(() => { engine?.resize(); if (environment === 'garage') resetViewRef.current?.(); }); resize.observe(canvas);
            return () => { canvas.removeEventListener('pointerdown', stopOrbit); resize?.disconnect(); sceneRef.current = null; resetViewRef.current = null; engine?.dispose(); };
        } catch (error) {
            console.error('[GarageRenderer] Could not initialize preview.', error);
            sceneRef.current = null;
            // External WebGL construction can fail synchronously.
            // oxlint-disable-next-line react-hooks/set-state-in-effect
            setStatus('error'); engine?.dispose();
        }
    }, [retry, environment]);

    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        let cancelled = false;
        let model: Mesh | undefined;
        let remote: RemoteVehicle | undefined;
        // Status tracks the external scene's asynchronous asset lifecycle.
        // oxlint-disable-next-line react-hooks/set-state-in-effect
        setStatus('loading');
        VehicleFactory.createRemoteVehicle(scene, vehicleId, weaponId, Vector3.Zero(), vehicleColor, 1).then(vehicle => {
            if (cancelled || scene.isDisposed) { disposePreview(vehicle); return; }
            remote = vehicle;
            model = vehicle.mesh;
            // The showroom is an asset preview, so network health indicators are hidden.
            model.getChildMeshes().filter(mesh => mesh.name === 'healthBar').forEach(mesh => mesh.setEnabled(false));
            const meshes = model.getChildMeshes().filter(mesh => mesh.isEnabled() && mesh.getTotalVertices() > 0);
            meshes.forEach(mesh => mesh.computeWorldMatrix(true));
            const bottom = Math.min(...meshes.map(mesh => mesh.getBoundingInfo().boundingBox.minimumWorld.y));
            scene.getMeshByName('showroom-floor')!.position.y = bottom - 0.17;
            scene.getMeshByName('service-pad')!.position.y = bottom - 0.09;
            const camera = scene.activeCamera as ArcRotateCamera;
            const bounds = model.getHierarchyBoundingVectors(true, isVisibleModelMesh);
            const focus = bounds.min.add(bounds.max).scale(0.5);
            const size = Math.max(4, bounds.max.subtract(bounds.min).length());
            const resetView = () => {
                camera.alpha = Math.PI / 3;
                camera.beta = 1.15;
                if (environment === 'garage') {
                    camera.setTarget(focus);
                    const aspect = scene.getEngine().getAspectRatio(camera);
                    const halfFov = Math.min(camera.fov / 2, Math.atan(Math.tan(camera.fov / 2) * aspect));
                    const radius = size * 0.6 / Math.sin(halfFov);
                    camera.lowerRadiusLimit = size * 0.8;
                    camera.upperRadiusLimit = radius * 2;
                    camera.radius = radius;
                    camera.panningSensibility = 0;
                } else {
                    camera.radius = vehicleId === 'behemoth' ? 15 : vehicleId === 'juggernaut' ? 13 : 10;
                }
            };
            resetViewRef.current = resetView;
            resetView();
            const shadow = scene.getLightByName('key')?.getShadowGenerator() as ShadowGenerator;
            shadow?.addShadowCaster(model, true);
            setStatus('ready');
        }).catch(error => {
            if (!cancelled) {
                console.error('[GarageRenderer] Could not prepare vehicle preview.', error);
                setStatus('error');
            }
        });
        return () => { cancelled = true; resetViewRef.current = null; if (remote) disposePreview(remote) };
    }, [vehicleId, weaponId, vehicleColor, retry, environment]);

    return <div className="showroom"><canvas ref={canvasRef} aria-label={`${vehicleId} with ${weaponId}. Drag or use arrow keys to orbit; scroll to zoom.`} tabIndex={0} />
        {status !== 'ready' && <div className="preview-status" role="status">{status === 'loading' ? 'Preparing vehicle…' : <>Preview unavailable <button onClick={() => setRetry(n => n + 1)}>Retry preview</button></>}</div>}
        {environment === 'garage' && status === 'ready' && <button className="garage-preview-reset" aria-label="Reset vehicle view" title="Reset view" onClick={() => resetViewRef.current?.()}><RotateCcw size={16} aria-hidden="true" /></button>}
        <span className="orbit-hint">Drag to inspect · Scroll to zoom</span>
    </div>;
}
