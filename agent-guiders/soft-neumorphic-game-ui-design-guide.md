# Soft Neumorphic Game UI Design Guide

## 1. Design Identity

The reference uses a **Soft Neumorphism / Soft UI** aesthetic.

The defining characteristics are:

- Very light, warm-white/off-white surfaces
- Softly raised and recessed UI elements
- Large rounded containers
- Pill-shaped controls
- Circular dials and radial controls
- Extremely soft ambient shadows
- Subtle inner shadows for recessed areas
- Thin, understated borders
- One controlled accent color used for active states
- Minimal visual noise
- Clean geometric typography
- Spacious layouts with strong visual breathing room

The goal is to adapt this aesthetic to a **game HUD and game interface** without turning the HUD into a generic dashboard.

The UI should feel like a **physical futuristic control interface**, where panels appear gently embedded into or raised from a soft surface.

---

# 2. Core Visual Language

### Primary aesthetic

**Soft Neumorphism + Minimal Futuristic Instrumentation**

Do not use:

- Glassmorphism as the primary style
- Heavy sci-fi HUD clutter
- Sharp cyberpunk panels
- Excessive gradients
- Neon outlines
- Generic cyan/purple/green "AI" styling
- Excessive glow
- Hard black borders
- Skeuomorphic metallic textures

The interface should remain **soft, clean, tactile and premium**.

---

# 3. Color System

The reference uses an extremely light neutral foundation with purple as the primary interactive accent.

Adapt the palette for the game as follows.

## Base Colors

```text
UI Background       #ECEDEF
Primary Surface     #F4F5F7
Raised Surface      #F1F2F4
Recessed Surface    #E4E6E9

Primary Text        #202126
Secondary Text      #6D7078
Muted Text          #9A9DA5
Disabled Text       #B8BAC0

Border              #FFFFFF
Subtle Divider      #D9DBDF
```

## Accent

Use a restrained violet/purple accent inspired by the reference.

```text
Primary Accent      #7566E8
Accent Light        #8D80F0
Accent Dark         #5D50C7
Accent Soft         #E4E0FF
```

The accent should communicate:

- active
- selected
- enabled
- charged
- available
- player-controlled

Do not use the accent on every element.

---

# 4. Game HUD Color Rules

The game HUD should remain mostly neutral.

Recommended visual distribution:

```text
70–80%    neutral/off-white UI surfaces
10–20%    dark text / secondary neutrals
5–10%     purple accent
```

Purple should be used for:

- active buttons
- selected weapons/abilities
- progress indicators
- targeting confirmation
- health/energy emphasis where appropriate
- interactive highlights
- player-owned indicators

Avoid large solid purple HUD panels.

---

# 5. HUD Transparency

For gameplay HUD elements, use **soft translucency carefully**.

Preferred:

```text
background: rgba(244,245,247,0.82–0.94)
```

For very subtle HUD elements:

```text
background: rgba(244,245,247,0.55–0.75)
```

The interface should remain readable over gameplay.

Do not make the HUD look like frosted glass.

The defining effect should still be **soft depth**, not blur.

---

# 6. Corner Radius System

Use rounded geometry throughout the interface.

### Large HUD panels

```text
24–32px
```

### Medium panels

```text
16–22px
```

### Buttons

```text
12–18px
```

### Pills

```text
999px
```

### Circular controls

Perfect circles.

Avoid sharp rectangular corners unless the game requires a special tactical element.

The overall interface should feel **soft and continuous**.

---

# 7. Button Design

Buttons should look physically raised from the UI surface.

### Default Button

Use:

- rounded/pill silhouette
- light surface
- subtle outer shadow
- very soft highlight
- dark text
- minimal border

Conceptually:

```text
background: #F1F2F4
border: 1px solid rgba(255,255,255,0.8)
box-shadow:
  6px 6px 14px rgba(180,183,190,0.28),
  -5px -5px 12px rgba(255,255,255,0.90)
```

### Hover

The button should become slightly more prominent.

Do not dramatically change its color.

Use:

- slightly stronger shadow
- subtle accent tint
- tiny elevation increase

### Active / Pressed

Use a **recessed neumorphic effect**.

The button should visually sink into the surface.

Conceptually:

```text
box-shadow:
  inset 4px 4px 8px rgba(180,183,190,0.30),
  inset -4px -4px 8px rgba(255,255,255,0.75)
```

### Selected

Use the purple accent subtly.

Example:

- purple icon
- purple progress line
- very light purple background
- small purple indicator

Avoid filling the entire button with bright purple.

---

# 8. Icon Buttons

Use circular icon buttons for:

- map
- settings
- camera
- inventory
- communication
- vehicle systems
- pause
- target lock
- ability controls

Shape:

```text
circle
```

Visual treatment:

- raised by default
- recessed when pressed
- purple accent when selected

The reference's circular controls should become a major visual language for the game HUD.

---

# 9. Circular HUD Controls

Use large circular controls for important game information.

Examples:

### Vehicle speed

Large circular gauge.

### Boost

Circular progress ring.

### Energy

Circular meter.

### Ability cooldown

Circular countdown.

### Radar

Circular recessed panel.

### Target lock

Circular confirmation indicator.

The controls should resemble **physical instrument dials**, but remain minimalist.

Avoid traditional glowing sci-fi gauges.

---

# 10. Radial Progress

Progress indicators should use thin, clean arcs.

Example:

```text
Track:
#D9DBDF

Active:
#7566E8
```

Use approximately:

```text
Track opacity: 0.45–0.70
Active stroke: 3–7px
```

Depending on scale.

The active arc should have a very subtle glow or highlight, but never become a neon effect.

---

# 11. Sliders

Sliders should follow the reference's soft tactile appearance.

### Track

Light recessed channel.

### Thumb

Small circular raised element.

### Active track

Purple.

### Inactive track

Soft gray.

The thumb should appear physically elevated above the track.

Use sliders for:

- volume
- sensitivity
- brightness
- vehicle control settings
- engine power
- boost allocation
- audio settings

---

# 12. HUD Panels

HUD panels should feel **raised from the game interface**, not like conventional rectangular windows.

Use:

- large rounded corners
- soft ambient shadow
- subtle inner highlight
- restrained opacity
- generous padding

Examples:

```text
Vehicle Status
Mission Information
Target Information
Ability Status
Mini-map
Team Information
Objective
Combat Log
```

Avoid filling the entire screen with panels.

Each panel should have a clear purpose.

---

# 13. HUD Placement

Use a balanced composition similar to the reference.

### Top-left

Possible:

- team/player information
- vehicle status
- mission state

### Top-center

Possible:

- objective
- match state
- timer

### Top-right

Possible:

- score
- team information
- secondary status

### Bottom-left

Possible:

- vehicle health
- armor
- movement information

### Bottom-center

Possible:

- ability controls
- weapon/system selection
- boost

### Bottom-right

Possible:

- radar
- target information
- combat controls

Keep the center of the screen relatively clean.

The player's view should remain dominant.

---

# 14. Vehicle Health / Armor

Do not use a generic rectangular health bar as the only representation.

Prefer:

- circular health meter
- segmented soft pill meter
- layered radial gauge
- compact recessed status module

Example hierarchy:

```text
VEHICLE
82%
ARMOR
```

Use purple as the active state.

For critical damage, introduce a restrained warm warning color only when necessary.

Do not permanently add red/orange accents to the interface.

---

# 15. Radar / Mini-map

The radar should follow the same neumorphic construction.

Use:

- circular recessed container
- soft gray background
- subtle inner shadow
- thin radial grid
- restrained purple player indicator
- minimal target markers

Do not create a glowing holographic radar.

It should feel like a **physical digital instrument**.

---

# 16. Target Lock

Target lock can use a circular system.

States:

### Searching

Neutral gray.

### Acquiring

Purple progress arc.

### Locked

Purple circular indicator with a stronger accent.

### Lost

Fade back into neutral gray.

Keep animation smooth and subtle.

Avoid aggressive flashing.

---

# 17. Cards

Cards should be rounded and soft.

Use:

```text
border-radius: 18–26px
```

Cards should have:

- light surface
- soft shadow
- minimal border
- strong spacing
- simple iconography

Cards should not look like conventional web cards with thick borders.

---

# 18. Typography

Typography should be:

- geometric
- clean
- modern
- highly readable

Recommended characteristics:

```text
Headings:
Semi-bold / Bold

Body:
Regular / Medium

HUD labels:
Medium / Semi-bold

Numbers:
Medium / Semi-bold
```

Use uppercase sparingly for system labels:

```text
ARMOR
BOOST
TARGET
SPEED
OBJECTIVE
```

Avoid overly futuristic distorted fonts.

Numbers should be highly legible during gameplay.

---

# 19. Shadows

Shadows are one of the most important elements of the aesthetic.

Use **large, soft, low-opacity shadows**.

Avoid:

- hard black shadows
- sharp drop shadows
- exaggerated depth
- strong outer glow

The UI should appear to have subtle physical depth.

Think:

> soft light source + soft raised surface

rather than:

> neon glowing interface.

---

# 20. Borders

Borders should be extremely subtle.

Preferred:

```text
1px solid rgba(255,255,255,0.65–0.9)
```

or a very light gray.

Borders should reinforce the shape without becoming visually dominant.

Never use thick borders around every HUD element.

---

# 21. Icons

Icons should be:

- thin
- geometric
- simple
- consistent
- monochrome by default

Inactive:

```text
#6D7078
```

Active:

```text
#7566E8
```

Avoid detailed illustrated icons.

The icon should remain readable at small sizes.

---

# 22. Animation

Animations should feel physical and tactile.

### Button press

Small downward movement.

### Button release

Small upward movement.

### Panel appearance

Soft fade + slight scale.

### Circular meter

Smooth arc transition.

### Selection

Soft purple emphasis.

### HUD notifications

Fade/slide gently.

Avoid:

- glitch effects
- excessive particles
- aggressive flashing
- cyberpunk scanlines
- constant pulsing
- excessive glow

The UI should feel **calm, premium and controlled**.

---

# 23. Game-Specific Adaptation

The reference is a music/audio control interface.

For the combat game, preserve the **visual system**, not the original components.

For example:

```text
REFERENCE                GAME HUD

Volume Dial       →      Vehicle Health / Armor Dial

Bass Dial         →      Energy / Boost Dial

Music Slider      →      Ability / Power Slider

Play Button       →      Main Combat Ability

Track Display     →      Target / Mission Status

Top Controls      →      Game System Controls

Rounded Panel     →      HUD Module

Purple Arc        →      Active Status / Progress
```

Do not literally reproduce the music player layout.

Translate its visual language into combat instrumentation.

---

# 24. What The HUD Should Feel Like

The final interface should feel:

**Soft**
**Premium**
**Tactile**
**Minimal**
**Futuristic**
**Instrument-like**
**Clean**
**Controlled**

It should NOT feel:

**Cyberpunk**
**Neon**
**Holographic**
**Glitchy**
**Overly technical**
**Generic sci-fi**
**Dashboard-heavy**

---

# 25. Design Rule

The most important rule:

> **Borrow the reference's surface treatment, shapes, depth, spacing and color philosophy — not its literal layout.**

The game should still have a strong combat HUD hierarchy.

The neumorphic treatment is the visual skin applied to:

- gauges
- buttons
- panels
- indicators
- meters
- radar
- target systems
- vehicle status
- abilities
- menus
- settings
- notifications

Every component should feel like it belongs to the same physical interface system.

---

# 26. Quick Style Checklist

Before approving any HUD component, verify:

- [ ] Soft rounded geometry
- [ ] Light neutral base
- [ ] Subtle depth
- [ ] Soft outer shadow
- [ ] Subtle inner shadow where appropriate
- [ ] Minimal border
- [ ] Purple used selectively
- [ ] No neon glow
- [ ] No cyan/purple/green sci-fi overload
- [ ] No sharp cyberpunk panels
- [ ] No unnecessary gradients
- [ ] Clear typography
- [ ] Strong readability
- [ ] Comfortable spacing
- [ ] Tactile interaction states
- [ ] Center gameplay view remains unobstructed

## Final Visual Direction

**Soft Neumorphic Futuristic Combat HUD**

A clean, premium, tactile interface built from softly raised and recessed surfaces, rounded controls, circular instrumentation, restrained violet accents and spacious composition.

The UI should look like a sophisticated physical control system translated into a modern game HUD — **not like a conventional sci-fi HUD.**
