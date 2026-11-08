// Level data. Distances are real kilometres along the trail, elevations real metres.
// Profile points were traced from Ryan's Strava elevation chart. Swap in GPX data later.
window.LEVELS = [
  {
    id: 1,
    title: "Day 1: Up up up",
    subtitle: "ACA checkpoint to the teahouse",
    date: "29 Oct 2026",
    lengthKm: 3.62,
    profile: [
      [0.0, 1460], [0.1, 1468], [0.25, 1474], [0.4, 1488], [0.5, 1495],
      [0.65, 1494], [0.8, 1484], [0.9, 1490], [1.0, 1512], [1.1, 1500],
      [1.2, 1482], [1.3, 1492], [1.45, 1530], [1.6, 1560], [1.75, 1595],
      [1.9, 1625], [2.1, 1675], [2.3, 1735], [2.5, 1790], [2.7, 1850],
      [2.9, 1910], [3.1, 1960], [3.3, 2030], [3.45, 2070], [3.62, 2100]
    ],
    // Stone staircase sections [fromKm, toKm]
    stairs: [[1.45, 1.8], [2.05, 2.55], [3.2, 3.62]],
    snacks: [
      { km: 0.7, type: "tea" },
      { km: 1.6, type: "snickers" },
      { km: 2.3, type: "dalbhat" },
      { km: 3.05, type: "tea" }
    ],
    weather: [
      { from: 1.55, to: 2.35, type: "drizzle" },
      { from: 2.7, to: 3.4, type: "wind" }
    ],
    scenery: [
      { km: 0.0, type: "checkpoint" },
      { km: 1.2, type: "waterfall" },
      { km: 2.0, type: "village" },
      { km: 2.25, type: "village" },
      { km: 2.6, type: "flags" },
      { km: 3.0, type: "flags" },
      { km: 3.62, type: "teahouse" }
    ],
    donkeys: [0.95, 2.65],
    // Suspension bridge over the Modi Khola near the start [fromKm, toKm]
    bridge: [0.22, 0.4],
    // Wet, slippery stone by the waterfall and in the drizzle
    wet: [[1.12, 1.32], [1.85, 1.95]],
    porters: [0.55, 1.75, 2.95],
    friends: [
      { km: 0.85, say: "Morning Ryan!" },
      { km: 2.4, say: "Up up up!" }
    ],
    ryan: { steps: 7756, moving: "1:29:10", movingSec: 5350, elapsed: "2:12:47", gain: 684 }
  }
];
