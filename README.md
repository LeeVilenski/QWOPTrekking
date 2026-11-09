# Nepal Trek: Ryan's Annapurna

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

## Packing
Before each day you pack Ryan's bag. Every item adds weight (wobblier, slower legs, more tiring), and leaving useful items out makes certain sections harder (no poles, no rain jacket in the drizzle, slippery rock without grippy socks...). The packing screen shows the day's forecast.

## Days
- Day 1: Up up up (ACA checkpoint to the teahouse, 3.62 km)
- Day 2: Ulleri to Ghorepani (7.89 km, +848 m)
- Day 3: Over Thapla Danda (11.64 km, up to 3,199 m then a long descent)
- Day 4: Down and up to Chhomrong (9.58 km, +713 m, big suspension bridge)
- Day 5: Sinuwa to Deurali (14.08 km, +1,571 m, through the bamboo forest; data from Aidan)
- Day 6: Deurali to ABC (7.67 km, +1,006 m, up to 4,138 m with snow; data from Aidan)
- Day 7: ABC to Lower Sinuwa (20.46 km, mostly downhill from a sunrise at 4,120 m; data from Aidan)
- Day 8: Sinuwa to Jhinu Danda (5.93 km, the finale, ending at the jeep to Pokhara; data from Aidan)

Pick a day on the title screen with ← / → (or tap the sides on a phone).

## Adding days
Add another entry to `LEVELS` in `js/levels.js`. Real GPX elevation data can replace the traced `profile` points.
