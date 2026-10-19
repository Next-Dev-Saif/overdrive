interface Point3 { x: number; y: number; z: number }
export interface CameraShakeRequest {
    intensity?: number;
    duration?: number;
    position?: Point3;
    radius?: number;
}

/** Local feedback is unattenuated; world impacts end at their gameplay blast radius. */
export function cameraShakeIntensity(request: CameraShakeRequest, listener?: Point3): number {
    const intensity = request.intensity ?? 1;
    if (!Number.isFinite(intensity) || intensity <= 0) return 0;
    if (!request.position) return intensity;
    const radius = request.radius ?? 0;
    if (!listener || !Number.isFinite(radius) || radius <= 0) return 0;
    const distance = Math.hypot(listener.x - request.position.x, listener.y - request.position.y, listener.z - request.position.z);
    if (!Number.isFinite(distance) || distance >= radius) return 0;
    return intensity * (1 - distance / radius);
}
