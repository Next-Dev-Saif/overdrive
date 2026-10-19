# Bot combat behavior

Arena bots make tactical decisions every 250ms. Initial sensing is staggered across vehicles, with at most four target visibility rays and three obstacle feelers per decision. Physics, aim alignment, weapon deployment, damage and cooldown authority remain in their existing controllers.

## Arena decisions

- Rank enemies within 160 units by distance and health, with a 22-point retention bonus for the current target. Allies, dead, disposed, cloaked and respawn-protected vehicles are excluded. Only visible candidates can be selected.
- Coordinate the weapon's preferred target with movement intent. The weapon still applies its own range, field-of-view and line-of-sight checks. Wait at least 400ms after acquisition before firing, and require aligned, ready hardware.
- Approach distant opponents, engage within the weapon's envelope, withdraw when too close or reloading nearby, and retreat under pressure at low health. Hysteresis reduces repeated direction changes.
- Ideal engagement distances: minigun 32, plasma 42, missile 50, mortar 65, nuke 95 units. Nuclear fire is withheld inside 75 units, providing clearance beyond its 60-unit blast radius.
- Use three speed-sensitive obstacle feelers to slow or steer toward clearance. After two seconds without meaningful movement, reverse and turn for one second; alternate recovery direction on subsequent attempts.
- Investigate the last seen point for up to two seconds, then perform a slow turning search. Hidden targets are not continuously tracked. Disabled, dead and inactive bots clear movement and weapon intent.

## Ability opportunities

All abilities require a visible target held for at least 750ms, availability under the existing cooldown, and a non-disabled bot. Thresholds include deployment margin.

| Vehicle | Activation condition |
| --- | --- |
| Interceptor | Target within 62 units and clearly ahead |
| Juggernaut | Target within 23 units |
| Manticore | Target within 38 units, ahead or under pressure |
| Wraith | Target within 30 units; multiple nearby opponents or reloading |
| Phantom | Below 60% health and taking damage or facing multiple opponents |
| Behemoth | Below 75% health and taking damage or facing multiple opponents |
| Valkyrie | Clear front/diagonal route; aligned chase at 50–95 units, or low-health escape away from an attacker |

Pressure lasts 2.5 seconds after health loss; multiple enemies means at least two sensed opponents within 45 units. No per-frame random ability rolls are used.

## Race bots

Road-following and corner braking remain unchanged. Combat requests now require a valid target held for 400ms. Lightning requires a target inside 80% of its maximum range and a useful damage, empty-ammo or low-health opportunity. Unarmed bots acquire ability targets. Existing server checks still own protection, visibility, cooldown, ammunition and wind-up cancellation.

## Validation and limits

Run `npm run test:bots`, `npm run test:race`, `npm run test:battle` and `npm run test:projectiles`. Headless checks cover tactical states, all ability policies, reaction delay, target filtering, obstacle stopping, recovery, disabled-state cleanup, bounded ray counts and race combat.

Manual acceptance: play each arena with close-range and explosive loadouts; observe range spacing, pillar avoidance, cloak/disengagement, repeated recovery, retreat while damaged, and useful ability timing. Test team battle on the host and remote client, then race with and without weapon pickups.

Navigation uses local obstacle avoidance, not a global route planner. Complex enclosed obstacles, narrow passages and cliff edges need in-game evaluation and may require a later navigation layer. No browser playtest or measured FPS comparison was performed for this change.
