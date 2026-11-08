# QWOP Trekking: Ryan's Annapurna

A wobbly, tongue-in-cheek browser walking sim based on Ryan's Annapurna Base Camp trek.

Play: open `index.html` in a browser (works on desktop and phones). No build step.

## Controls
- **Desktop:** hold `A`/`D` (or `←`/`→`) to swing a leg and release to plant it (longer hold = longer stride, too long = the splits), hold `W`/`S` or `↑`/`↓` to lean forward/back, hold `Space` for trekking poles, `M` mutes, `Esc` (or the ☰ button) pauses, with options to resume, restart the day or choose another day.
- **Phone:** BACK / LEFT / POLES / RIGHT / FWD buttons (hold LEFT/RIGHT to swing a leg) (landscape works best).

## Files
- `js/levels.js`: level data (elevation profile traced from Strava, snacks, weather, scenery).
- `js/game.js`: physics, drawing, HUD.
- `js/audio.js`: generated music and sound effects.
- `assets/ryan-face.png` (optional): a square, front-on face photo. If present, it replaces the drawn face.

## Days
- Day 1: Up up up (ACA checkpoint to the teahouse, 3.62 km)
- Day 2: Ulleri to Ghorepani (7.89 km, +848 m)

Pick a day on the title screen with ← / → (or tap the sides on a phone).

## Adding days
Add another entry to `LEVELS` in `js/levels.js`. Real GPX elevation data can replace the traced `profile` points.
