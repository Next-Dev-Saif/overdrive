import type { VehicleConfig } from './VehicleController';

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/** Bounded tire response in metres/seconds; signed speed handles reverse without flipping wheel input. */
export function vehicleHandling(config: VehicleConfig, speed: number, lateralSpeed: number, yawSpeed: number, steeringAngle: number, throttle: number, dt: number) {
    const weight = Math.max(.8, Math.min(2.2, Math.sqrt(config.mass / 1200)));
    const wheelbase = Math.max(2.6, (config.depth ?? 4.5) * .64);
    const maxLateralAcceleration = 17 / Math.sqrt(weight);
    const desiredYaw = clamp(speed * Math.tan(steeringAngle) / wheelbase, Math.min(1.9, maxLateralAcceleration / Math.max(2, Math.abs(speed))));
    const yawDelta = clamp((desiredYaw - yawSpeed) * (1 - Math.exp(-dt * 10 / weight)), 4.6 / weight * dt);
    const braking = throttle * speed < 0 && Math.abs(speed) > .15;
    let driveDelta: number;
    if (braking) {
        // Braking cannot cross zero within this frame and become an unintended reverse launch.
        driveDelta = -Math.sign(speed) * Math.min(Math.abs(speed), 15 / Math.sqrt(weight) * Math.abs(throttle) * dt);
    } else if (Math.abs(throttle) > .01) {
        const reverse = throttle < 0;
        const limit = config.maxSpeed * (reverse ? .36 : 1);
        const directionalSpeed = speed * Math.sign(throttle);
        const acceleration = reverse ? Math.abs(config.reverseAcceleration) * .85 : config.acceleration * 1.35;
        const taper = Math.max(0, Math.min(1, (limit - directionalSpeed) / Math.max(2, limit * .22)));
        driveDelta = Math.sign(throttle) * Math.min(Math.max(0, limit - directionalSpeed), acceleration * Math.abs(throttle) * taper * dt);
    } else {
        driveDelta = -Math.sign(speed) * Math.min(Math.abs(speed), (.55 + speed * speed * .0015) * dt);
    }
    // Exponential relaxation is frame-rate independent; tire force has a finite friction budget.
    const grip = Math.max(4.8, Math.min(10, (1 - config.driftFactor) * 48 + 4.2));
    const lateralDelta = clamp(-lateralSpeed * (1 - Math.exp(-grip * dt)), maxLateralAcceleration * dt);
    return { driveDelta, lateralDelta, yawDelta, braking };
}

/** Mechanical steering rack: heavy cars take longer to change lock; fast cars use shallower lock. */
export function advanceSteering(config: VehicleConfig, current: number, input: number, speed: number, dt: number): number {
    const weight = Math.max(.8, Math.sqrt(config.mass / 1200));
    const lock = (.7 + Math.min(5, config.steeringSpeed) * .035) / (1 + Math.abs(speed) * .012);
    return current + clamp(input * lock - current, 3.8 / weight * dt);
}
