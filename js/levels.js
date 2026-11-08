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
  },
  {
    id: 2,
    title: "Day 2: Ulleri to Ghorepani",
    subtitle: "Ulleri's stone steps to the Poon Hill gate",
    date: "30 Oct 2026",
    lengthKm: 7.89,
    profile: [
      [0.0, 2102], [0.3, 2150], [0.6, 2185], [1.0, 2215], [1.3, 2240],
      [1.5, 2262], [1.8, 2292], [2.1, 2290], [2.4, 2288], [2.7, 2320],
      [3.0, 2365], [3.3, 2390], [3.6, 2425], [4.0, 2450], [4.3, 2495],
      [4.6, 2525], [4.9, 2532], [5.1, 2525], [5.4, 2565], [5.8, 2610],
      [6.2, 2650], [6.6, 2700], [6.9, 2750], [7.2, 2785], [7.5, 2810],
      [7.7, 2845], [7.89, 2887]
    ],
    stairs: [[0.0, 0.95], [2.5, 3.2], [4.1, 4.6], [5.3, 5.9], [6.6, 7.89]],
    snacks: [
      { km: 1.2, type: "tea" },
      { km: 2.6, type: "snickers" },
      { km: 3.9, type: "dalbhat" },
      { km: 5.3, type: "snickers" },
      { km: 6.4, type: "tea" },
      { km: 7.3, type: "snickers" }
    ],
    // It was a wet, grey day
    weather: [
      { from: 0.0, to: 2.9, type: "drizzle" },
      { from: 3.6, to: 6.1, type: "drizzle" },
      { from: 6.4, to: 7.7, type: "wind" }
    ],
    wet: [[0.15, 0.7], [2.6, 3.0], [5.35, 5.8], [7.6, 7.85]],
    bridge: [2.15, 2.4],
    donkeys: [1.5, 4.7, 6.9],
    porters: [0.6, 3.0, 5.0, 7.1],
    scenery: [
      { km: 0.05, type: "village" },
      { km: 1.0, type: "flags" },
      { km: 3.4, type: "flags" },
      { km: 3.85, type: "village" },
      { km: 4.05, type: "village" },
      { km: 6.0, type: "flags" },
      { km: 7.82, type: "gate" },
      { km: 7.89, type: "teahouse" }
    ],
    friends: [
      { km: 0.5, say: "Legs ok after yesterday?" },
      { km: 3.6, say: "Nangethanti for lunch!" },
      { km: 6.8, say: "Poon Hill at 5am tomorrow!" }
    ],
    ryan: { steps: 13444, moving: "2:25:56", movingSec: 8756, gain: 848 }
  }
];
