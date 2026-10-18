# Match setup flow

Implemented 2026-10-17. The signed-in landing screen is now the match setup itself. The earlier home, mode-selection, map-selection, lobby, standalone garage and placeholder operations pages have been removed from the app. Their old URL hashes safely resolve to setup. There is no unsupported spectator entry or navigation to empty missions, rewards, private lobbies or rankings.

## Player path

1. Choose Team battle, Free roam or Death race.
2. Choose a map (race has a fixed Blacktop Circuit).
3. Select a vehicle and weapon next to the live 3D preview. Selection applies immediately; no separate Equip or Save action. Paint is available under a compact expandable section.
4. Review the sticky summary and press Find match, Enter arena or Join race.

Race shows an unarmed Interceptor and explains trackside pickups. It preserves the player's arena loadout rather than silently overwriting it. Map cards only select; they never launch a session. Returning from a match/race keeps choices. Validated browser storage preserves mode, arena, chassis, weapon and paint across reloads; invalid or unavailable storage falls back safely. Reloading a session URL never launches a match automatically.

## Presentation and accessibility

Near-black surfaces, off-white text and grayscale map art keep the interface monochrome; vehicle paint remains player-controlled. Desktop pairs maps with equipment; mobile stacks the same content with a sticky start footer. Native radio groups and labeled selects support keyboard selection. Map selection has a visible checkmark/Selected label. All actions have at least 48px targets. Focus rings and reduced-motion rules are explicit, and muted text contrast is checked against the lightest menu surface.

Matchmaking uses a native modal dialog for keyboard containment, Escape/cancel and focus restoration. It summarizes actual choices and exposes retry/back after errors, rather than filling the screen with empty player slots. Existing socket ownership, cancellation and handoff remain in MatchmakingService. Settings contains working graphics quality, master volume and a readable controls reference.

## Verification

`npm run test:setup` simulates choice callbacks and renders headless markup with a stubbed WebGL preview: selection never starts a match; equipment applies immediately; launch is explicit; corrupted stored data falls back; race preserves arena choices and hides irrelevant selectors; all map images exist; text contrast meets AA. These tests do not establish browser layout, WebGL appearance, native-dialog focus behavior or live-server matchmaking success.

Manual acceptance: at phone, tablet and desktop widths choose each mode, change map/vehicle/weapon, inspect the preview, start/cancel/retry a queue, leave a match, visit settings, return, refresh and use keyboard-only navigation. Per Agent-execution-guide.md, no browser was opened for verification.

## Game-first presentation correction

The initial dashboard-style presentation was rejected. Setup now uses a combat-hangar composition: a large interactive vehicle stage, oversized chassis name and ability designation, directly selectable chassis/armament buttons, a compact arena thumbnail strip and a high-contrast Deploy control. The welcome heading, numbered form sections and vehicle/weapon dropdowns are removed. The mode switch stays at the top; account/settings remain secondary icon controls. Mobile stacks the vehicle stage above touch-sized selection grids. Race uses a static circuit strip instead of a nonfunctional map button. The selection, persistence and launch rules above remain unchanged.

Updated headless interaction tests pass with direct equipment buttons; TypeScript, targeted lint and production bundling pass (validation-only backend URL). No browser/visual approval has been claimed.

## Server room browser (2026-10-18)

Team battle now opens a server room directory for the chosen arena. Create a room or join a waiting room by its visible host name and unique ID. Friends choose the same arena and room. The host presses **Start battle** when everyone has joined; the existing match builder fills the remaining ten-player roster with bots and alternates human team assignment. A room host leaving before launch transfers host controls to the next player. Empty waiting rooms disappear.

Active battles are displayed as **In battle**, with joining disabled. Mid-battle joining/bot replacement is not supported. Free roam remains local and death race retains its existing server queue. Room browsing uses RoomService and useRoomBrowser; the legacy matchmaking service remains available to existing queue clients. Client and server must both be updated for the new room events.

The directory refreshes every five seconds and after membership changes. The server rechecks capacity, arena, loadout and account membership at join time. Failed joins keep the directory open with an actionable error. Socket ownership transfers to gameplay after matchFound; cancel closes the browsing socket. A dropped browsing connection removes room membership; after reconnection the player must rejoin.

`npm run test:rooms` uses an isolated localhost Socket.IO server with no database. It covers invalid loadouts, map mismatch, duplicate accounts, full and already-started rooms, host-only launch, and host reassignment. Native dialog keyboard behavior and a two-browser playthrough remain manual checks.
