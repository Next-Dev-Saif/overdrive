import type { VehicleConfig } from './VehicleController';

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/** Bounded tire response in metres/seconds; signed speed handles reverse without flipping wheel input. */
export function vehicleHandling(config: VehicleConfig, speed: number, lateralSpeed: number, yawSpeed: number, steeringAngle: number, throttle: number, dt: number) {
    const weight = Math.max(.8, Math.min(2.2, Math.sqrt(config.mass / 1200)));
    const wheelbase = Math.max(2.6, (config.depth ?? 4.5) * .64);
    const agility = Math.max(.7, Math.min(1.8, (config.steeringSpeed ?? 3) / 2.8));
    const maxLateralAcceleration = (24 + 6 * agility) / Math.sqrt(weight);
    const curvature = Math.tan(steeringAngle) / wheelbase;

    // Fast, responsive combat yaw: agile vehicles rotate aggressively into turns;
    // yaw rate scales smoothly with speed without artificially forcing emergency braking.
    const maxYawRate = Math.min(2.4, (1.3 + 0.6 * agility) / Math.sqrt(weight) * 1.5);
    const maxDynamicYaw = (maxLateralAcceleration * 1.35) / Math.max(3.5, Math.abs(speed));
    const yawLimit = Math.max(1.35 * agility, Math.min(maxYawRate, maxDynamicYaw));
    const desiredYaw = clamp(speed * curvature, yawLimit);
    const yawDelta = clamp((desiredYaw - yawSpeed) * (1 - Math.exp(-dt * 11 / weight)), 4.8 / weight * dt);

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

        // When applying throttle while cornering, maintain engine drive through the turn.
        // Moderate tire scrub reduces straight-line acceleration slightly at full lock,
        // but NEVER applies a sudden brake or kills forward momentum.
        const lock = (.7 + Math.min(5, config.steeringSpeed) * .035) / (1 + Math.abs(speed) * .012);
        const steerFraction = Math.min(1, Math.abs(steeringAngle) / Math.max(.01, lock));
        // Sustainable cornering speed at full lock (e.g. 78-88% of max speed)
        const cornerGripSpeed = limit * (0.78 + 0.10 * (1 - config.driftFactor));
        if (directionalSpeed > cornerGripSpeed) {
            // Shed excess speed gently at the grip limit instead of slamming a 10m/s² emergency brake
            const excessSpeed = directionalSpeed - cornerGripSpeed;
            const scrubDrag = Math.min(excessSpeed, (2.4 / Math.sqrt(weight)) * steerFraction * dt);
            driveDelta -= Math.sign(throttle) * scrubDrag;
        } else {
            // Below corner grip speed: power through the turn with only subtle tire scrub
            driveDelta *= Math.max(0.78, 1 - steerFraction * 0.22);
        }
    } else {
        // Coasting: natural rolling resistance plus extra scrub when steering
        const steerFraction = Math.min(1, Math.abs(steeringAngle) / .7);
        const coastDrag = (.55 + speed * speed * .0015 + steerFraction * 1.5) * dt;
        driveDelta = -Math.sign(speed) * Math.min(Math.abs(speed), coastDrag);
    }

    // Exponential relaxation is frame-rate independent; tire force has a finite friction budget.
    const grip = Math.max(5.2, Math.min(11, (1 - config.driftFactor) * 48 + 4.6));
    // Feed forward the centripetal force for the actual yaw, then correct residual
    // slip. Damping slip alone requires sustained sideways sliding to make a turn.
    const corneringDelta = speed * (yawSpeed + yawDelta) * dt;
    const lateralDelta = clamp(corneringDelta - lateralSpeed * (1 - Math.exp(-grip * dt)), maxLateralAcceleration * dt);
    return { driveDelta, lateralDelta, yawDelta, braking };
}

/** Mechanical steering rack: heavy cars take longer to change lock; fast cars use shallower lock. */
export function advanceSteering(config: VehicleConfig, current: number, input: number, speed: number, dt: number): number {
    const weight = Math.max(.8, Math.sqrt(config.mass / 1200));
    const lock = (.7 + Math.min(5, config.steeringSpeed) * .035) / (1 + Math.abs(speed) * .012);
    return current + clamp(input * lock - current, 3.8 / weight * dt);
}
