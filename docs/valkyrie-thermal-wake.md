# Valkyrie thermal burst

After its existing wind-up, Valkyrie keeps the forward burst and opens two blue exhaust jets with white cores. For 1.5 seconds it deposits a burning thermal wake along its actual path. Each section lasts five seconds, fading during its final second. This lets the driver cut off pursuit routes or sweep across an enemy position.

The wake deals 5 damage every 250 ms (20 damage per second while exposed), once per target per pulse regardless of overlapping sections. Its contact radius is 2.8 world units with a four-unit vertical limit. Existing team rules, damage attribution, server protection checks and local shields remain in the existing damage path. Owner death, respawn, disposal or match end cancels the wake.

The local owner evaluates damage for human vehicles; the host does so for its bots. Remote humans and remote bots invoke the same presentation recipe after the existing `abilityUsed` broadcast, with no damage callback. No additional network protocol is required. Remote trail placement follows interpolated network motion, so latency can slightly shift visual placement relative to the owning simulation. The existing combat server validates damage messages; this change does not introduce server-side trail geometry validation.

Rendering uses four jet meshes plus one mesh for all embers and flame tongues, with at most 32 trail sections. The core effect requires neither particles nor glow and remains visible on LOW. Launch sparks retain the existing quality budget. Terrain probes occur only when new sections are placed; jumps, missing ground and large position discontinuities do not create ground fire through the map.

Run `npm run test:valkyrie` for owner/bot damage, remote replay, overlap, allies, altitude, lifetime, cancellation, teleport and headless scene-render checks. Broader VFX, projectile, bot, battle and match-rule checks also pass.

Manual acceptance: activate on flat ground and hills at LOW/HIGH; cross the trail with an enemy and an ally; repeat as host bot and remote player in two clients; check death/respawn, match end, delayed snapshots and stable camera framing. Browser appearance, latency and GPU performance remain manual checks. This changes the arena Valkyrie ability; death race uses its separate shared race ability.
