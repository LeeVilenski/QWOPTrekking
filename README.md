# QWOP Trekking: Ryan's Annapurna

A wobbly, tongue-in-cheek browser walking sim based on Ryan's Annapurna Base Camp trek.

Play: open `index.html` in a browser (works on desktop and phones). No build step.

## Controls
- **Desktop:** `A`/`D` or `←`/`→` alternate legs, hold `W`/`S` or `↑`/`↓` to lean forward/back, hold `Space` for trekking poles, `M` mutes.
- **Phone:** BACK / LEFT / POLES / RIGHT / FWD buttons (landscape works best).

## Files
- `js/levels.js`: level data (elevation profile traced from Strava, snacks, weather, scenery).
- `js/game.js`: physics, drawing, HUD.
- `js/audio.js`: generated music and sound effects.
- `assets/ryan-face.png` (optional): a square, front-on face photo. If present, it replaces the drawn face.

## Adding days
Add another entry to `LEVELS` in `js/levels.js`. Real GPX elevation data can replace the traced `profile` points.
