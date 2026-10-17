import { isVisibleModelMesh } from '../../game/models/ModelBounds';
import { useEffect, useRef, useState } from 'react';
import { Engine, Scene, Vector3, ArcRotateCamera, Color4, Color3, HemisphericLight, DirectionalLight, ShadowGenerator, Mesh } from '@babylonjs/core';
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
            engine.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1));
            const scene = new Scene(engine); sceneRef.current = scene;
            scene.clearColor = Color4.FromHexString('#161616ff');
            scene.skipPointerMovePicking = true;
            scene.ambientColor = new Color3(0.22, 0.24, 0.28);
            const camera = new ArcRotateCamera('showroom-camera', Math.PI / 3, 1.15, 11, new Vector3(0, 0.4, 0), scene);
            camera.attachControl(canvas, true); camera.lowerRadiusLimit = 6; camera.upperRadiusLimit = 20;
            camera.lowerBetaLimit = 0.35; camera.upperBetaLimit = 1.45; camera.wheelPrecision = 45;
            const fill = new HemisphericLight('fill', new Vector3(0, 1, 0), scene); fill.intensity = 1.25; fill.groundColor = new Color3(0.22, 0.24, 0.28);
            const key = new DirectionalLight('key', new Vector3(-1, -2, 1), scene); key.position.set(8, 12, -8); key.intensity = 2.4;
            const rim = new DirectionalLight('rim', new Vector3(1, -0.5, -1), scene); rim.diffuse = new Color3(0.9, 0.9, 0.9); rim.intensity = 1.6;
            const topLight = new DirectionalLight('top-down', new Vector3(0, -1, 0.3), scene); topLight.position.set(0, 14, -2); topLight.intensity = 1.2;
            const shadows = new ShadowGenerator(2048, key); shadows.usePercentageCloserFiltering = true;
            
            createGarageBay(scene, shadows);
            const motion = matchMedia('(prefers-reduced-motion: reduce)');
            let orbit = environment !== 'garage';
            const stopOrbit = () => { orbit = false; };
            canvas.addEventListener('pointerdown', stopOrbit);
            engine.runRenderLoop(() => { if (orbit && !motion.matches) camera.alpha += Math.min(engine!.getDeltaTime(), 40) * 0.00007; scene.render(); });
            resize = new ResizeObserver(() => { engine?.setHardwareScalingLevel(1 / (window.devicePixelRatio || 1)); engine?.resize(); if (environment === 'garage') resetViewRef.current?.(); }); resize.observe(canvas);
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

    return <div className="showroom"><canvas ref={canvasRef} aria-label={`${vehicleId}${weaponId && weaponId !== 'none' ? ` with ${weaponId}` : ", unarmed"}. Drag or use arrow keys to orbit; scroll to zoom.`} tabIndex={0} />
        {status !== 'ready' && <div className="preview-status" role="status">{status === 'loading' ? 'Preparing vehicle…' : <>Preview unavailable <button onClick={() => setRetry(n => n + 1)}>Retry preview</button></>}</div>}
        {environment === 'garage' && status === 'ready' && <button className="garage-preview-reset" aria-label="Reset vehicle view" title="Reset view" onClick={() => resetViewRef.current?.()}><RotateCcw size={16} aria-hidden="true" /></button>}
        <span className="orbit-hint">Drag to inspect · Scroll to zoom</span>
    </div>;
}
