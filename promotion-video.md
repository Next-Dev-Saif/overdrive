# OVERDRIVE — 30-Second Promotional Video Production Guide

## 1. Assignment for the production agent

Produce a **finished, exactly 30.000-second promotional video** for **OVERDRIVE**, the vehicular combat game in this repository, using **Hyperframes** for editing, motion graphics, audio timing and final rendering.

This is a gameplay trailer with a short, purposeful look at the pre-match experience. Show real vehicles, real UI, deployed weapons, ability effects and battle footage. The audience must understand: **choose a combat vehicle, choose a weapon, enter battle, deploy a special ability, and fight through a death race.**

Follow the locked timeline, English narration and overlay copy below. Do not replace the trailer with a slideshow, website walkthrough, talking avatar, abstract motion graphic or unrelated AI-generated racing footage. Hyperframes is the composition/rendering tool; it does not supply authentic gameplay automatically.

**Deliverable specification**

- Master: `overdrive-promotion-30s.mp4`, 1920 × 1080, 16:9, constant 60 fps, exactly 1,800 video frames, H.264 with AAC stereo audio at 48 kHz.
- Duration: frames 0–1799; the interval ends at 30.000 seconds. No extra intro, credits, black tail or audio tail.
- Language: English. One confident, restrained announcer. No imitation of a recognizable actor or fictional character.
- Style: military vehicle-combat trailer; tactile metal, engine weight, readable action and restrained tactical typography.
- Preserve editable Hyperframes sources, local media, narration and audio stems. Supply `overdrive-promotion-30s.srt` and a short render/asset report.
- Do not publish, upload to social accounts, or alter production gameplay for this assignment.

## 2. Inspect the actual game before assembling footage

Read `agent-guiders/Agent-Guidance.md` and the applicable execution, design and testing rules. Current source code takes precedence over older planning documents.

Inspect these references:

| Reference | What to verify |
| --- | --- |
| `src/data/catalog.ts` | Exact vehicle, weapon, ability and arena names |
| `src/components/page-sections/setup/MatchSetupScreen.tsx` | Current hangar composition, mode tabs, map strip and launch control |
| `src/components/page-sections/setup/EquipmentPicker.tsx` | Real vehicle/weapon selection and paint controls |
| `src/components/ui/HUD.tsx` | Actual combat HUD, target lock, armor and weapon feedback |
| `src/components/page-sections/race/RaceHud.tsx` | Death Race HUD and lap/position presentation |
| `docs/match-setup-flow.md` | Current launch flow and team room behavior |
| `docs/combat-presentation.md` | Deployable weapon bays and combat presentation |
| `docs/bot-behavior.md` | Current bot behavior; useful for arranging encounters |
| `src/game/vfx/AbilityActivation.ts` | Real ability wind-up timing and spark effects |
| `src/game/vfx/ExplosionAftermath.ts` | Ground scorch and nuclear mushroom-cloud timing |
| `public/assets/audio/imported/README.md` | Audio provenance and available game sounds |

Use the **OVERDRIVE** spelling and existing wordmark treatment. The current menu is a vehicle-dominant, monochrome combat hangar, not the retired multi-page menu. Do not reconstruct obsolete screens from old requirements.

Do not claim paid upgrades, progression, leaderboards, ranked play, campaigns, release dates, platform availability or public access unless separately verified and approved. Do not advertise planned features as finished. Do not say “Play now,” “Wishlist now,” or show a store badge or URL without a supplied destination.

## 3. Capture plan and required media

Use existing approved captures first. If they do not exist, record the running game using the permitted capture workflow and a local test account. Follow repository/browser-access rules. If capture access or required credentials are unavailable, complete the storyboard and composition structure, then identify the specific missing footage; do not fabricate gameplay or call a placeholder render final.

Record at 1920 × 1080 or higher, ideally at 60 fps. Tune the capture machine for stable performance without inventing visual features. Capture longer takes with at least two seconds of handles on both ends. Keep the native game HUD in most battle footage, visibly establishing that the footage is gameplay. Hide browser chrome, development overlays and personal account information. Use a clean test callsign such as `DRIVER 01`.

Prepare these named editorial inputs; these are requested output names, not files assumed to exist already:

| File | Required content |
| --- | --- |
| `01-battle-hook.mp4` | Chase-view vehicle rushing past an impact, with recognizable arena and HUD |
| `02-hangar.mp4` | Full current setup screen, Interceptor prominently framed, selection UI legible |
| `03-loadout.mp4` | Genuine switch to Juggernaut and Mortar; preview visibly updates |
| `04-deploy.mp4` | Actual launch button press and entrance into the selected arena |
| `05-mortar-combat.mp4` | Weapon bay opens, mortar launches, shell hits ground near an opponent, scorch appears |
| `06-lightning.mp4` | Interceptor wind-up followed by Lightning Strike in one continuous action |
| `07-aegis.mp4` | Behemoth deploying Aegis with its actual shield effect |
| `08-nuclear-impact.mp4` | Nuke impact and at least eight uninterrupted seconds of mushroom-cloud development |
| `09-death-race.mp4` | Blacktop Circuit race: trackside weapon pickup, pursuit and overtake |
| `10-brand-background.mp4` | Clean vehicle silhouette or lingering nuclear smoke for final brand card |

For nuclear footage, frame the blast from far enough away to see **both ground contact and the top of the cap**. Record the full rise. Do not crop the mushroom into an indistinct orange flash. Camera shake must follow the game’s distance rules; do not add distant-blast shake that recreates the bug already fixed.

Capture the ground scorch on an actual supported terrain/road surface. Do not show a crater or permanent terrain deformation: the implemented aftermath is a temporary surface mark and smoke. A neutral camera view or normal spectator capture is acceptable when available; do not pretend a fabricated cinematic is player footage.

Do not infer that match entry is instant. Cut out loading and waiting, using a clean editorial transition. For team rooms, follow the real room/start flow off-screen. The trailer does not need to expose authentication or matchmaking administration.

## 4. Locked edit: exact 30-second timeline

Times are absolute composition seconds. Frame ranges are inclusive at 60 fps. All cuts fit within these intervals; transitions must not extend the runtime. Overlays listed below are **editorial trailer graphics**, not replacement game UI. Retain the actual recorded UI labels underneath.

| Scene | Time | Frames | Purpose |
| --- | --- | --- | --- |
| 01 | 00.000–02.000 | 0–119 | Immediate combat hook |
| 02 | 02.000–05.000 | 120–299 | Show the pre-match hangar |
| 03 | 05.000–08.000 | 300–479 | Select vehicle and armament |
| 04 | 08.000–10.000 | 480–599 | Launch into battle |
| 05 | 10.000–14.000 | 600–839 | Show deployed weapons and mortar aftermath |
| 06 | 14.000–18.000 | 840–1079 | Show special abilities |
| 07 | 18.000–23.000 | 1080–1379 | Nuclear impact and complete mushroom reveal |
| 08 | 23.000–27.000 | 1380–1619 | Death Race pursuit and overtake |
| 09 | 27.000–30.000 | 1620–1799 | Brand and closing invitation |

### Scene 01 — Combat hook — 00.000–02.000

**Show**

- 00.000–00.350: Start directly on a moving combat vehicle, close chase view, with an impact ahead or beside it. No fade from black.
- 00.350–01.500: Vehicle clears the smoke; show wheel movement, armored silhouette and a readable sliver of HUD.
- 01.500–02.000: Hold forward momentum into a hard cut to the hangar.

**Write on screen**

- 00.350–01.900, upper-left: `THIS IS OVERDRIVE.`

**Announce**, 00.350–01.800:

> “This is Overdrive.”

**Sound/edit**: Engine growl at the first frame; one impact hit, then the music pulse begins. No rapid strobing. The first line must remain intelligible over the impact.

### Scene 02 — Choose your machine — 02.000–05.000

**Show**

- 02.000–03.200: Full current pre-match screen. Interceptor dominates the vehicle stage; retain the wordmark, mode tabs, equipment deck and arena strip.
- 03.200–04.500: Slow editorial push-in from 100% to at most 106%, favoring the vehicle and its name while preserving essential controls.
- 04.500–05.000: Cursor moves purposefully toward the chassis selection. Do not click several controls at once.

**Write on screen**

- 02.200–04.800, upper-right in clear space: `CHOOSE YOUR MACHINE.`

**Announce**, 02.350–04.250:

> “Choose your machine.”

**Sound/edit**: Reduce battle noise to garage engine idle. Use one restrained interface hover tick. Avoid making the UI float in a fake browser or laptop mockup.

### Scene 03 — Build the loadout — 05.000–08.000

**Show**

- 05.000–06.100: Select **Juggernaut**; let the actual vehicle preview update and the chassis name become readable.
- 06.100–07.300: Select **Mortar**; show the loadout selection state and corresponding weapon preview.
- 07.300–08.000: Settle on the selected loadout with the arena strip still visible. No extra menu tour.

**Write on screen**

- 05.200–07.800: `PICK YOUR FIREPOWER.`
- 06.500–07.800, smaller supporting label: `JUGGERNAUT / MORTAR`

**Announce**, 05.350–07.100:

> “Pick your firepower.”

**Sound/edit**: Two genuine UI selection clicks, synchronized to their respective actions. Use crisp cuts between captured selections if waiting would otherwise consume the scene. Do not imply unimplemented upgrade trees.

### Scene 04 — Enter battle — 08.000–10.000

**Show**

- 08.000–08.650: Click the actual launch control for the captured mode; preserve its real label.
- 08.650–09.000: Brief dark directional wipe, concealing the editorial removal of loading/waiting.
- 09.000–10.000: Vehicle accelerates into the arena from a chase-camera view. HUD comes into view naturally.

**Write on screen**

- 08.150–09.800: `ENTER THE ARENA.`

**Announce**, 08.150–09.450:

> “Enter the arena.”

**Sound/edit**: Launch confirmation, engine acceleration, then the first full percussion downbeat at 09.000. Do not show a fake “connected” or “match found” message.

### Scene 05 — Combat and mortar impact — 10.000–14.000

**Show**

- 10.000–11.200: Medium-close view of the armored bay opening and mortar lifting into position. Preserve actual deployment timing; use a separate shot if necessary.
- 11.200–12.100: Mortar firing. Keep the barrel direction and projectile trajectory consistent across the cut.
- 12.100–13.100: Ground detonation close to an opponent. HUD lock/weapon feedback should remain visible in at least one shot.
- 13.100–14.000: Smoke clears enough to reveal the dark ground scorch while the player keeps moving. Do not force the entire 14-second scorch fade into this short shot.

**Write on screen**

- 10.200–13.800: `HIT HARD. KEEP MOVING.`

**Announce**, 10.350–12.600:

> “Hit hard. Keep moving.”

**Sound/edit**: Metallic bay movement, launch thump, then impact. Duck music under the mortar transient. No kill label unless the captured game actually awards one.

### Scene 06 — Special abilities — 14.000–18.000

**Show**

- 14.000–16.300: Continuous Interceptor shot. Begin at ability activation; clearly show the bright charge sparks and deployed hardware, preserve the approximately 1.1-second wind-up, then show Lightning Strike affecting an opponent.
- 16.300–18.000: Cut to Behemoth with Aegis deploying/already becoming active. Show the shield surrounding the vehicle, with motion revealing its volume.
- These are separate vehicle demonstrations, not a single chassis changing abilities.

**Write on screen**

- 14.150–17.850, primary: `UNLEASH YOUR SPECIAL.`
- 14.200–16.200, small label: `INTERCEPTOR / LIGHTNING STRIKE`
- 16.450–17.850, replace small label with: `BEHEMOTH / AEGIS DOME`
- Confirm the catalog's displayed Aegis name before finalizing the secondary label; if its spelling differs, use the catalog spelling exactly.

**Announce**, 14.350–16.600:

> “Unleash your special.”

**Sound/edit**: Electrical charge builds into the real strike cue; shield cue follows the cut. Keep combat sci-fi colors in the game footage; do not add decorative magical particles or a neon promotional frame.

### Scene 07 — Nuclear signature moment — 18.000–23.000

**Show**

- 18.000–18.350: Nuke reaches the impact point in a wide battlefield composition.
- 18.350–19.200: Initial blast and rolling smoke. Preserve detail; do not fill the screen with a prolonged white flash.
- 19.200–21.000: Hold the shot as the column rises and the top begins spreading.
- 21.000–23.000: Reveal the broad mushroom cap and tall stem together, with vehicles or structures retained as scale references. The dark scorch should remain visible at ground level if the camera angle permits.
- Capture enough source footage to select this action cleanly. If necessary, use a modest continuous retime, no more than 1.25×, across the rise so the full shape fits. Do not jump from impact to an unrelated stock explosion.

**Write on screen**

- 18.550–20.800, upper-left away from the rising cap: `MAKE AN IMPACT.`
- 20.800–23.000: Remove the editorial headline and let the mushroom cloud own the frame.

**Announce**, 18.550–20.300:

> “Make an impact.”

**Sound/edit**: Strong low-frequency detonation with a controlled high-frequency crack, followed by a sustained rumble. Momentarily pull percussion back so the blast feels heavy. No exaggerated camera shake when the captured viewpoint is outside the effective blast radius.

### Scene 08 — Death Race — 23.000–27.000

**Show**

- 23.000–24.250: Moving Interceptor collects an actual trackside weapon pickup on Blacktop Circuit. Keep race HUD/lap/position information visible.
- 24.250–25.700: Pursuit shot with a legitimate weapon attack toward a rival ahead.
- 25.700–27.000: Clean overtake or side-by-side sprint out of a corner. Do not invent a finish-line win or change the position display.
- Treat this as a montage cut into a different mode. Do not imply that the Juggernaut/Mortar arena loadout transfers into race: racers start as unarmed Interceptors and collect weapons on track.

**Write on screen**

- 23.150–26.850: `RACE. FIGHT. SURVIVE.`
- 23.250–26.700, smaller label: `DEATH RACE / BLACKTOP CIRCUIT`

**Announce**, 23.300–25.700:

> “Race. Fight. Survive.”

**Sound/edit**: Engine RPM rises; pickup cue and weapon report land on the action. Restore the percussion pulse. Finish with a short tire/engine pass-by into the brand card.

### Scene 09 — Brand close — 27.000–30.000

**Show**

- 27.000–27.300: Cut to a darkened genuine vehicle silhouette or the lingering captured smoke. Settle the background; no busy montage behind the brand.
- 27.300–29.800: Strong centered wordmark and invitation, held long enough to read.
- 29.800–30.000: Hold the same image through the last frame while audio finishes. No additional black end frame is required.

**Write on screen**

- 27.200–30.000, centered primary: `OVERDRIVE`
- 27.500–30.000, centered beneath: `ENTER OVERDRIVE.`
- No URL, store icon, release date, rating badge or availability claim.

**Announce**, 27.450–29.300:

> “Enter Overdrive.”

**Sound/edit**: Final restrained impact under the wordmark; engine tail and music resolve by 30.000. Fade audio during the final 300ms without cutting off the spoken line.

## 5. Complete voiceover script

Use these lines verbatim, in this order. The per-scene windows above are authoritative; the voice track is intentionally sparse so the game can be heard.

```text
This is Overdrive.
Choose your machine.
Pick your firepower.
Enter the arena.
Hit hard. Keep moving.
Unleash your special.
Make an impact.
Race. Fight. Survive.
Enter Overdrive.
```

Direction: composed, energetic and commanding; close-mic delivery with natural emphasis on **machine**, **firepower**, **special**, **impact** and **Overdrive**. No screaming, forced gravel, exaggerated radio distortion or generic “ultimate next-generation experience” language. Pronounce OVERDRIVE as “OH-ver-drive.” Record/generate each line separately, then place it precisely; do not stretch a single narration recording to make it fit.

Generate SRT captions from the exact spoken windows. Captions use sentence case, not the all-caps headline style. Provide them as a sidecar; the master uses the specified editorial headlines rather than duplicating every line as a second burned-in text block.

## 6. Graphic and audio direction

- Derive font choices and weights from the actual UI/CSS. Use bundled/local fonts with a reliable fallback; do not invent a replacement logo.
- Editorial palette: near-black `#0A0A0B`, off-white `#F4F4F0`, restrained gray `#A6A6A6`. Let actual fire, sparks, shields and vehicle paint provide color.
- At 1080p, primary headlines roughly 64–88px, small labels 28–34px, final wordmark around 140–180px. Adjust to the real font metrics without clipping.
- Keep editorial text at least 96px from horizontal edges and 72px from vertical edges. Avoid covering target brackets, vehicles, ammo, armor, lap position or the mushroom silhouette. Favor the designated empty space; shift within safe margins if captured HUD placement requires it.
- Give overlays a restrained shadow or dark backing only where footage needs contrast. No opaque full-screen panels during gameplay.
- Reveal headlines with a 0.12–0.18s opacity/short-position movement. Do not animate letters independently or use bouncing text. Remove them in 0.1s; remain inside their assigned visibility windows.
- Prefer hard cuts and one deployment wipe. No spinning transitions, persistent glitches, decorative lens dirt or artificial handheld shake throughout.
- Music: instrumental industrial percussion and restrained bass, about 120–140 BPM. Avoid vocals competing with narration. Select music with documented promotional-use rights; repository presence alone is not proof of music licensing.
- Use authentic game SFX where rights permit. Keep a source/license manifest. Do not layer three different explosion sounds over every action.
- Mix toward approximately −14 LUFS integrated and no more than −1 dBTP; these are editorial delivery targets, not claims about the source audio. Duck music under narration and reduce harsh peaks. Confirm every word on normal laptop speakers.
- Avoid rapid full-screen flashes; retain the real blast briefly without amplifying it into a strobe.

## 7. Hyperframes implementation workflow

Official references checked while preparing this brief:

- [Hyperframes introduction](https://hyperframes.app/docs/1-startup/1-introduction)
- [Hyperframes quickstart](https://hyperframes.app/docs/1-startup/2-quickstart)
- [Hyperframes rendering](https://hyperframes.app/docs/3-guides/4-rendering)
- [Official repository](https://github.com/heygen-com/hyperframes)

Verify the installed version and its documentation before writing the composition. Use the available Hyperframes agent skill if installed; do not assume a skill or CLI exists. Keep the video project separate from the game runtime, for example `video/overdrive-promotion/`.

The documented model is HTML composition with explicitly timed media and seekable animations. The root identifies the composition and canvas dimensions. Timed elements use `class="clip"`, `data-start`, `data-duration` and `data-track-index`; paused GSAP timelines are registered on `window.__timelines`. Follow the installed version's media trimming and audio rules rather than guessing attribute names.

Use prerecorded clips for battle action. Do not try to run live multiplayer/Havok simulation inside the frame-seeking composition: game time, network time and render-seek time are different. Every requested timestamp must resolve reproducibly.

Recommended editorial track organization:

| Track | Content |
| --- | --- |
| 0 | Full-frame gameplay/menu footage and closing background |
| 1 | Brief deployment transition and necessary contrast backing |
| 2 | Main headlines and final wordmark |
| 3 | Secondary vehicle/mode labels |
| 4 | Voiceover clips |
| 5 | Music bed |
| 6 | SFX and source gameplay audio |

Confirm stacking/mixing semantics in the installed version. Trim footage into exact shot-length local files if source-offset support is unclear. Keep all asset paths relative to the video project. Do not depend on hotlinked fonts or temporary remote URLs in the final render.

Typical documented commands, to be checked against the installed CLI:

```sh
npx hyperframes doctor
npx hyperframes render --fps 60 --quality high --output overdrive-promotion-30s.mp4
```

Run commands from the video project directory. Set composition duration to 30 seconds and dimensions to 1920 × 1080 in the appropriate version-supported configuration. Use documented composition validation before rendering. Do not add guessed flags. Inspect the exported file's duration, frame rate, frame count and audio rather than trusting configuration alone.

## 8. Production and quality gates

1. Inventory genuine captures and licensed audio; mark every missing input before assembly.
2. Select source in/out points and record them in a shot manifest. Respect the nine fixed intervals.
3. Produce all nine narration clips; verify their pronunciation and assigned duration.
4. Build the Hyperframes composition using real media, exact text and deterministic animation.
5. Render a draft; inspect the rendered frames at every cut and at 03.5, 06.5, 11.0, 15.2, 17.0, 21.5, 25.0 and 28.5 seconds. Follow project permissions for preview/browser access.
6. Review motion continuously, not only as stills. Check charge-before-discharge, weapon trajectory, legible HUD, audio synchronization and the entire nuclear silhouette.
7. Confirm the before-match UI is recognizably the current game; check no personal details or development UI are visible.
8. Check the mushroom cloud at both laptop-sized playback and full resolution. It must read as a stem and broad cap, not a blown-out flash or generic smoke puff.
9. Confirm scorch appears after impact. Do not claim the video shows its entire fade when the shot is shorter than the effect lifetime.
10. Render the final master and verify exactly 1,800 frames at 60 fps, 30.000-second video duration, correct audio format and no clipped ending. Account for encoder audio padding separately; it must not extend the playback beyond the intended ending.
11. Check all media are linked, fonts resolved and no placeholder remains. Reopen the final exported MP4 and listen end-to-end.
12. Deliver editable source and a truthful report of capture/build versions, licenses, export settings and any unverified item.

## 9. Final delivery checklist

- [ ] `overdrive-promotion-30s.mp4` — final 30-second master.
- [ ] `overdrive-promotion-30s.srt` — captions matching the nine narrated windows.
- [ ] Editable Hyperframes composition and pinned dependency/version information.
- [ ] Local source clips, voiceover, music/SFX stems, and shot in/out manifest.
- [ ] Asset/license manifest and concise QA report.
- [ ] No invented gameplay, public-release claims, substitute stock vehicles or unimplemented features.
- [ ] Pre-match UI, combat, ability activation, mortar scorch, large nuclear mushroom cloud and Death Race are all clearly shown.

**The final impression must be a real, playable vehicle-combat game with weight and personality: a deliberate loadout, a readable fight, a signature nuclear spectacle, and a strong OVERDRIVE close.**
