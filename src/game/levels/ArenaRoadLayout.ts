/** Shared road footprint for texturing and scenery clearance. Distances are in world metres. */
export interface RoadSegment { ax: number; az: number; bx: number; bz: number; length: number }
export interface ArenaRoadLayout { size: number; radius: number; width: number; segments: RoadSegment[] }

/** A flanking loop, central crossing, both five-player spawn lanes and six outer access routes. */
export function createArenaRoadLayout(size: number): ArenaRoadLayout {
    const radius = size * .235;
    const segments: RoadSegment[] = [];
    const add = (ax: number, az: number, bx: number, bz: number) => segments.push({ ax, az, bx, bz, length: Math.hypot(bx - ax, bz - az) });
    add(-radius, 0, radius, 0);
    add(0, -radius, 0, radius);
    for (const z of [-100, 100]) {
        const halfLength = Math.sqrt(Math.max(0, radius * radius - z * z));
        add(-halfLength, z, halfLength, z);
    }
    // Thread between the authored cover rings and perimeter landmarks, rather than through them.
    for (let i = 0; i < 6; i++) {
        const angle = (i + .85) * Math.PI / 3;
        add(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.cos(angle) * size * .435, Math.sin(angle) * size * .435);
    }
    return { size, radius, width: 18, segments };
}

/** Nearest two routes allow paint to stop cleanly at a junction without overlapping lane stripes. */
export function sampleArenaRoad(layout: ArenaRoadLayout, x: number, z: number) {
    let distance = Math.abs(Math.hypot(x, z) - layout.radius), secondDistance = Infinity;
    let along = (Math.atan2(z, x) + Math.PI) * layout.radius;
    for (const segment of layout.segments) {
        const dx = segment.bx - segment.ax, dz = segment.bz - segment.az;
        const t = Math.max(0, Math.min(1, ((x - segment.ax) * dx + (z - segment.az) * dz) / (segment.length * segment.length)));
        const candidate = Math.hypot(x - segment.ax - dx * t, z - segment.az - dz * t);
        if (candidate < distance) { secondDistance = distance; distance = candidate; along = t * segment.length; }
        else secondDistance = Math.min(secondDistance, candidate);
    }
    return { distance, secondDistance, along };
}

export function isOnArenaRoad(layout: ArenaRoadLayout, x: number, z: number, clearance = 0): boolean {
    return sampleArenaRoad(layout, x, z).distance <= layout.width / 2 + clearance;
}

/** Bounded rejection sampling keeps grass, rubble and glowing shards off the pavement and shoulders. */
export function sampleRoadsidePoint(layout: ArenaRoadLayout): { x: number; z: number } {
    for (let attempt = 0; attempt < 24; attempt++) {
        const radius = layout.size * .46 * Math.pow(Math.random(), 1.2), angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
        if (!isOnArenaRoad(layout, x, z, 3)) return { x, z };
    }
    return { x: layout.size * .32, z: layout.size * .18 };
}
