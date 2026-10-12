# 5v5 Team Deathmatch Plan

## Goal

Evolve Death Arena from free-for-all behavior into a deterministic 5v5 Team Deathmatch (TDM) mode. Every match contains exactly five Alpha combatants and five Bravo combatants. Human vacancies may be filled by bots, while one authoritative roster drives gameplay rules and presentation.

## Recommended launch rules

- Two teams: `alpha` and `bravo`, five combatants each.
- Five-minute match, first team to 25 eliminations wins; highest score wins at timeout.
- Friendly fire is disabled for weapons and offensive chassis abilities.
- A destroyed vehicle respawns after three seconds at a safe team spawn with two seconds of invulnerability.
- Matchmaking accepts up to ten humans and fills vacancies with bots after a bounded wait. The first deliverable can retain the current two-human minimum while making the roster scalable to ten humans.
- A tie at timeout is reported as a draw. Overtime is a later mode rule, not hidden inside the initial implementation.

These are implementation defaults and can be changed before Phase 1 without altering the architecture.

## Findings in the current build

- The server labels two matched humans as Team A and Team B, while the host locally creates eight bots.
- Team membership is not stored on `PlayerState`, bot state, vehicle metadata, or weapon ownership.
- AI acquires the nearest living vehicle regardless of side.
- Weapon target pools and HUD scene scans treat every non-local vehicle as hostile.
- Direct fire, projectiles, area abilities, and physics effects have separate damage paths with no shared friendly-fire policy.
- The five-minute timer and countdown are client-owned; there is no authoritative score, winner, or match result.
- Health, destruction, ability, respawn, and disconnect events are partly global rather than consistently scoped to the match room.
- The HUD kill feed and medals are inferred locally, and the debrief deliberately has no competitive result.
- Bot IDs and bot health are not registered in a server-side match roster, so bot eliminations cannot yet be scored or validated consistently.

## Architecture

### Shared match contracts

Create a dependency-light shared module consumed by client and server:

```ts
type TeamId = 'alpha' | 'bravo';
type CombatantKind = 'human' | 'bot';
type MatchPhase = 'assembling' | 'intro' | 'countdown' | 'playing' | 'ended';

interface MatchMember {
  entityId: string;
  userId?: string;
  displayName: string;
  kind: CombatantKind;
  teamId: TeamId;
  vehicleId: string;
  weaponId: string;
  connected: boolean;
}

interface MatchSnapshot {
  matchId: string;
  roomId: string;
  mapId: string;
  phase: MatchPhase;
  startsAt: number;
  endsAt: number;
  scoreLimit: number;
  scores: Record<TeamId, number>;
  roster: MatchMember[];
  winner: TeamId | 'draw' | null;
}
```

Centralize mode constants, team capacity, duration, score limit, respawn delay, invulnerability, and spawn layouts. Do not leave rule numbers scattered through React, the engine, and the server.

### Server-owned match session

Replace the queue's ad-hoc `roomId/isHost/team` payload with a `MatchSession` registry keyed by `matchId`.

The server owns:

- team balancing and the exact 5+5 roster;
- room membership and event scoping;
- synchronized phase timestamps and remaining time;
- team score, elimination attribution, final result, and one-time reward settlement;
- human disconnect/reconnect status and optional bot substitution;
- validation that attacker and target exist, belong to the same match, are opponents, and are damageable.

For the first version, the elected host may continue simulating bots, but it must register the eight bot members with the server. The server remains authoritative for roster, team policy, health, scoring, and result. Fully server-simulated physics is a separate competitive-hardening project.

### Client combatant registry

Add one engine-owned `CombatantRegistry` instead of repeatedly scanning scene meshes. It maps `entityId` to vehicle, display name, kind, team, health, alive state, and spawn slot.

The registry supplies:

- `getAllies(teamId)` and `getEnemies(teamId)`;
- team-filtered weapon target pools;
- team-filtered AI candidates;
- radar/nameplate snapshots for the HUD;
- stable lookup for remote shots, damage, kill feed, and spectator selection.

Babylon mesh metadata may mirror `entityId` and `teamId` for ray-hit resolution, but the registry is the source of truth.

### Unified combat policy

Introduce a single `CombatRules.canAffect(source, target, effect)` decision used by:

- hitscan weapons;
- guided and area projectiles;
- shockwave, EMP, lightning, gravity, and damage-over-time abilities;
- knockback, stun, and other hostile status effects.

All damage requests include attacker ID, target ID, weapon/effect ID, and client shot sequence. The server rejects allies, self-hits where disallowed, cross-room targets, dead/invulnerable targets, malformed damage, and duplicate sequences. Visual-only remote shots never apply authoritative damage.

### Match state flow

```text
queueJoined
  → matchFound(MatchSnapshot)
  → joinMatch
  → rosterReady
  → matchPhaseChanged(intro/countdown/playing, server timestamp)
  → damageRequested
  → damageApplied
  → combatantDestroyed + scoreUpdated
  → respawnScheduled + combatantRespawned
  → matchEnded(final snapshot)
```

The client estimates the timer from server timestamps and resynchronizes from snapshots. React should not own or duplicate live match truth. Per-frame transforms remain in Babylon; low-frequency score/roster/phase snapshots reach React through an external-store subscription rather than Context or a 30 ms scene scan.

## Gameplay behavior

### Matchmaking and roster

- Queue by mode and map.
- Prevent duplicate user entries and remove cancelled/disconnected entries.
- Balance humans across teams by count; later MMR balancing can replace the strategy without changing contracts.
- Fill each team to five with uniquely identified bots.
- Send every client the complete roster, its own team, spawn slot, and authoritative timing.
- Only the host registers/simulates bots; fail over or end safely if the host disconnects. Host migration may be deferred if explicitly surfaced.

### Spawning and respawning

- Define five authored spawn transforms per team per arena, facing toward combat.
- Use spawn slots rather than random coordinates.
- On respawn, select the safest valid team slot, clear velocities/status effects, restore health/ammo, and apply visible invulnerability.
- Never let the local `VehicleController` choose a random respawn in networked TDM.

### AI

- Assign every bot a team at creation.
- Acquire only living, visible opponents.
- Share enemy candidates with its `WeaponController`; never include allies in lock-on pools.
- Avoid immediate target thrashing, add teammate spacing, and prefer enemies threatening nearby allies when distances are similar.
- Do not implement advanced squad commands in the first release.

### Scoring and results

- Increment the opposing team once per confirmed elimination.
- Suicides/environment deaths do not award an enemy point unless a recent valid attacker exists within the assist window.
- Ignore duplicate destruction events.
- End immediately at score limit or at the authoritative timeout.
- Freeze combat input, publish the final snapshot, then show victory/defeat/draw and the team roster in the debrief.
- Settle XP/scrap/MMR once from the final server result, not per unverified client event.

## Visual and UX plan

### Pre-match

- Rename Death Arena to Team Deathmatch where applicable.
- Matchmaking overlay becomes a compact Alpha-versus-Bravo formation: five slots on each side, with human/bot/connecting labels and accessible text status.
- Lobby briefing states 5v5, score limit, duration, friendly-fire policy, arena, and loadout.

### In-match identification

- Add restrained semantic tokens for Alpha and Bravo. Do not overwrite the player's chosen vehicle paint.
- Add a small team beacon/marker above each vehicle plus a distinct ally chevron and enemy diamond; shape and label supplement color.
- Allies: persistent name and health marker at useful range, subdued on radar.
- Enemies: hostile diamond/name/health only when visible or detected; cloaked enemies remain hidden according to existing rules.
- Radar renders allies and enemies with different shapes and includes off-radar edge indicators.
- Crosshair cannot lock allies. If a manual ray crosses an ally, show a brief `ALLY — FIRE BLOCKED` status rather than a hit marker.

### HUD

- Primary top-center element: `ALPHA 00 — 00 BRAVO` with the match timer directly beneath it.
- Small local team identifier near match info.
- Team-aware kill feed with icons/labels, not color alone.
- Optional compact roster panel on a held key; do not permanently cover driving space.
- Match point and final-minute states use short, non-looping transitions and respect reduced motion.

### End state

- Replace the generic run log with Victory, Defeat, or Draw.
- Show final team scores, player eliminations/deaths/assists when authoritative data exists, and explicit rewards returned by the server.
- Preserve replay, garage, and menu actions.

## Delivery phases

### Phase 0 — Contracts and regression baseline

- Add shared IDs, snapshots, event payloads, mode configuration, and type guards.
- Add tests for balancing, five-per-team invariants, opponent checks, score limits, and duplicate eliminations.
- Keep existing free-roam behavior isolated.

### Phase 1 — Server match sessions

- Build queue buckets, exact rosters, room-scoped events, phase timestamps, bot registration, server health, score, respawn, and results.
- Eliminate global match broadcasts.
- Add disconnect cleanup and explicit host-loss behavior.

### Phase 2 — Client roster and entity ownership

- Type `roomData`; remove `any` from match-critical payloads.
- Add the combatant registry and attach team metadata to local, remote, and bot vehicles.
- Make network callbacks consume snapshots/deltas idempotently.

### Phase 3 — Team-safe combat and AI

- Filter targeting and AI by opponent team.
- Route every direct, projectile, area, ability, status, and physics effect through the combat policy.
- Add invulnerability and authoritative destruction deduplication.

### Phase 4 — Spawn, lifecycle, score, and results

- Add arena team spawn sets, safe respawns, synchronized countdown/timer, score limit, match end, and debrief payload.
- Stop local random respawns and client-owned winner logic.

### Phase 5 — Team visuals and responsive HUD

- Implement team markers, radar shapes, nameplates, scoreboard, kill feed, roster overlay, matchmaking formation, lobby copy, and final result screen.
- Verify keyboard operation, 375 px layout, contrast, non-color cues, and reduced motion.

### Phase 6 — Hardening and rollout

- Run server unit/integration tests with two and ten socket clients.
- Run headless Babylon tests with ten combatants and all weapons/abilities.
- Test late join rejection, disconnects, duplicate hits, friendly-fire attempts, score-limit/timeout races, host loss, respawn safety, and stale packets.
- Run client/server lint, type checks, production builds, and multiplayer soak tests.
- Keep TDM behind a mode/config flag until the acceptance matrix passes.

## Acceptance criteria

- Every TDM snapshot contains exactly five Alpha and five Bravo members with unique entity IDs.
- No weapon, ability, status, or knockback path can affect an ally when friendly fire is off.
- AI targets only opposing-team combatants.
- All match traffic is room-scoped; simultaneous matches cannot observe or damage one another.
- Score changes exactly once per authoritative elimination and every client converges on the same score/timer/result.
- Respawns occur only at valid team spawns with the configured protection window.
- HUD, radar, nameplates, lock-on, kill feed, and debrief consistently identify teams without relying only on color.
- A host and non-host render the same ten-member roster and final result.
- Free roam still works and does not inherit TDM restrictions.
- Client and server builds, lint, unit tests, socket integration tests, and headless model/combat checks pass.

## Explicitly deferred

- Parties, team switching, voice chat, ranked/MMR team balancing, capture objectives, overtime, advanced squad orders, dedicated server-side physics, and host migration unless selected as a launch requirement.

