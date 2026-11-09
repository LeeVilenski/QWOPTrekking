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
  },
  {
    id: 3,
    title: "Day 3: Over Thapla Danda",
    subtitle: "Up into the fog at 3,199 m, then a long wet descent",
    date: "31 Oct 2026",
    lengthKm: 11.64,
    profile: [
      [0.0, 2885], [0.4, 2875], [0.8, 2905], [1.2, 2995], [1.6, 3065],
      [2.0, 3150], [2.3, 3180], [2.5, 3199], [2.8, 3190], [3.2, 3182],
      [3.5, 3160], [4.0, 3075], [4.5, 3010], [5.0, 2935], [5.5, 2855],
      [6.0, 2765], [6.5, 2715], [7.0, 2665], [7.4, 2685], [7.7, 2690],
      [7.95, 2650], [8.2, 2560], [8.4, 2532], [8.6, 2565], [8.9, 2630],
      [9.3, 2700], [9.6, 2670], [10.0, 2630], [10.5, 2530], [11.0, 2450],
      [11.4, 2375], [11.64, 2330]
    ],
    // "Wet and so steps up and down"
    stairs: [[0.8, 1.6], [2.0, 2.4], [3.6, 4.6], [5.2, 6.1], [8.0, 8.35], [8.6, 9.2], [10.1, 11.2]],
    snacks: [
      { km: 1.0, type: "tea" },
      { km: 2.55, type: "snickers" },
      { km: 4.8, type: "tea" },
      { km: 6.6, type: "dalbhat" },
      { km: 8.9, type: "snickers" },
      { km: 10.4, type: "tea" }
    ],
    weather: [
      { from: 0.0, to: 11.64, type: "drizzle" },
      { from: 1.7, to: 3.8, type: "fog" },
      { from: 2.2, to: 3.3, type: "wind" },
      { from: 9.2, to: 9.8, type: "fog" }
    ],
    wet: [[0.9, 1.4], [3.7, 4.3], [5.3, 5.9], [8.1, 8.5], [10.2, 10.8]],
    bridge: [8.38, 8.46],
    bridgeStyle: "plank",
    donkeys: [1.3, 5.6, 9.9],
    porters: [0.5, 3.4, 7.2, 10.8],
    scenery: [
      { km: 0.05, type: "village" },
      { km: 1.4, type: "flags" },
      { km: 2.5, type: "sign", text: ["WELCOME TO", "THAPLA DANDA", "GHOREPANI, MYAGDI"], sub: "3165m" },
      { km: 2.6, type: "flags" },
      { km: 6.7, type: "village" },
      { km: 7.6, type: "flags" },
      { km: 9.3, type: "flags" },
      { km: 11.64, type: "teahouse" }
    ],
    friends: [
      { km: 0.6, say: "Is this rain ever stopping?" },
      { km: 3.0, say: "Can't see a thing!" },
      { km: 6.0, say: "Downhill! My knees..." },
      { km: 8.3, say: "Mind the planks!" }
    ],
    ryan: { steps: 21590, moving: "3:57:41", movingSec: 14261, gain: 615 }
  },
  {
    id: 4,
    title: "Day 4: Down and up to Chhomrong",
    subtitle: "What goes down must go up",
    date: "1 Nov 2026",
    lengthKm: 9.58,
    finishText: "Cold beer in Chhomrong!",
    profile: [
      [0.0, 2260], [0.3, 2195], [0.6, 2150], [0.9, 2075], [1.1, 1985],
      [1.3, 1930], [1.4, 1922], [1.6, 2005], [1.9, 2025], [2.2, 2045],
      [2.5, 2030], [2.8, 2058], [3.1, 2075], [3.4, 2115], [3.7, 2175],
      [4.0, 2195], [4.3, 2200], [4.6, 2265], [4.9, 2280], [5.3, 2305],
      [5.6, 2300], [5.9, 2318], [6.2, 2325], [6.4, 2347], [6.6, 2335],
      [6.9, 2280], [7.2, 2200], [7.5, 2120], [7.8, 2040], [8.1, 1970],
      [8.3, 1930], [8.5, 1892], [8.65, 1898], [8.9, 1965], [9.2, 2020],
      [9.4, 2035], [9.58, 2065]
    ],
    stairs: [[0.4, 1.3], [3.3, 3.9], [4.4, 4.8], [6.7, 7.9], [8.7, 9.58]],
    snacks: [
      { km: 1.5, type: "tea" },
      { km: 3.0, type: "snickers" },
      { km: 4.7, type: "dalbhat" },
      { km: 6.4, type: "snickers" },
      { km: 8.0, type: "tea" },
      { km: 9.1, type: "snickers" }
    ],
    // Finally a clear, hot day
    weather: [
      { from: 0.0, to: 9.58, type: "sun" },
      { from: 5.8, to: 6.6, type: "wind" }
    ],
    wet: [[1.3, 1.45], [8.42, 8.55]],
    // The long suspension bridge in Ryan's selfie, over the Chhomrong Khola
    bridge: [8.42, 8.68],
    donkeys: [2.0, 5.0, 7.4],
    porters: [0.8, 3.6, 6.0, 8.9],
    scenery: [
      { km: 0.05, type: "village" },
      { km: 1.0, type: "flags" },
      { km: 2.3, type: "village" },
      { km: 4.0, type: "flags" },
      { km: 5.5, type: "village" },
      { km: 6.4, type: "flags" },
      { km: 9.3, type: "village" },
      { km: 9.58, type: "teahouse" }
    ],
    friends: [
      { km: 0.5, say: "Sun's out! Finally!" },
      { km: 2.0, say: "Down. Then up. Then down." },
      { km: 6.6, say: "Is that Annapurna South?!" },
      { km: 8.3, say: "Selfie on the bridge!" }
    ],
    ryan: { steps: 19652, moving: "3:22:03", movingSec: 12123, gain: 713 }
  },
  {
    id: 5,
    title: "Day 5: Sinuwa to Deurali",
    subtitle: "Through Bamboo, Dovan and Himalaya. The big one.",
    date: "2 Nov 2026",
    lengthKm: 14.08,
    finishText: "Made it to Deurali!",
    profile: [
      [0.0, 2060], [0.5, 2140], [1.0, 2190], [1.5, 2300], [1.8, 2330],
      [2.2, 2340], [2.6, 2360], [3.0, 2420], [3.3, 2430], [3.6, 2445],
      [4.0, 2450], [4.2, 2425], [4.4, 2395], [4.6, 2340], [4.9, 2305],
      [5.1, 2312], [5.3, 2300], [5.6, 2330], [6.0, 2390], [6.5, 2430],
      [7.0, 2470], [7.3, 2468], [7.8, 2495], [8.3, 2510], [8.6, 2540],
      [9.0, 2580], [9.4, 2620], [9.8, 2650], [10.2, 2720], [10.6, 2790],
      [11.0, 2840], [11.5, 2852], [11.8, 2880], [12.2, 2950], [12.6, 3040],
      [12.9, 3120], [13.2, 3100], [13.5, 3110], [13.8, 3170], [14.08, 3224]
    ],
    stairs: [[0.3, 1.6], [2.8, 3.4], [4.2, 4.9], [5.6, 6.1], [10.0, 10.9], [12.1, 12.9], [13.6, 14.08]],
    bamboo: [[3.4, 6.4]],
    snacks: [
      { km: 1.3, type: "tea" },
      { km: 2.9, type: "snickers" },
      { km: 4.6, type: "tea" },
      { km: 6.4, type: "dalbhat" },
      { km: 8.5, type: "snickers" },
      { km: 10.3, type: "tea" },
      { km: 12.0, type: "snickers" },
      { km: 13.3, type: "tea" }
    ],
    weather: [
      { from: 0.0, to: 3.4, type: "sun" },
      { from: 6.4, to: 9.5, type: "sun" },
      { from: 10.8, to: 14.08, type: "fog" },
      { from: 12.0, to: 14.08, type: "wind" },
      { from: 12.6, to: 14.08, type: "drizzle" }
    ],
    wet: [[4.6, 5.0], [7.2, 7.4], [12.7, 13.1]],
    bridge: [5.15, 5.27],
    bridgeStyle: "plank",
    donkeys: [1.8, 5.8, 9.2],
    porters: [0.7, 3.2, 6.8, 9.8, 12.4],
    scenery: [
      { km: 0.05, type: "village" },
      { km: 1.1, type: "flags" },
      { km: 3.0, type: "village" },
      { km: 6.4, type: "village" },
      { km: 7.6, type: "flags" },
      { km: 9.6, type: "village" },
      { km: 11.6, type: "flags" },
      { km: 13.9, type: "village" },
      { km: 14.08, type: "teahouse" }
    ],
    friends: [
      { km: 0.6, say: "Big day today, lads." },
      { km: 4.0, say: "Welcome to Bamboo!" },
      { km: 7.0, say: "Dovan for lunch?" },
      { km: 9.8, say: "Himalaya. The hotel, not the range." },
      { km: 12.5, say: "Getting chilly up here..." }
    ],
    // From Aidan's watch: Ryan hasn't uploaded this one yet
    ryan: { steps: 24368, moving: "4:55:44", movingSec: 17744, gain: 1571 }
  },
  {
    id: 6,
    title: "Day 6: Deurali to ABC",
    subtitle: "What a day!!!! Up to Annapurna Base Camp, 4,130 m",
    date: "3 Nov 2026",
    lengthKm: 7.67,
    finishText: "ANNAPURNA BASE CAMP, BABYYYY!",
    treeline: 3550,
    snowline: 3900,
    profile: [
      [0.0, 3200], [0.2, 3195], [0.5, 3230], [0.8, 3282], [1.0, 3300],
      [1.4, 3305], [1.7, 3310], [2.0, 3340], [2.3, 3368], [2.6, 3420],
      [3.0, 3480], [3.3, 3540], [3.6, 3600], [3.8, 3628], [3.9, 3600],
      [4.1, 3650], [4.4, 3700], [4.8, 3780], [5.2, 3840], [5.6, 3900],
      [6.0, 3930], [6.3, 3960], [6.5, 3978], [6.6, 3962], [6.8, 4010],
      [7.2, 4060], [7.4, 4092], [7.5, 4085], [7.67, 4138]
    ],
    stairs: [[0.4, 0.9], [2.4, 3.6], [4.0, 4.6], [6.6, 7.0]],
    snacks: [
      { km: 1.2, type: "tea" },
      { km: 2.5, type: "snickers" },
      { km: 4.3, type: "dalbhat" },
      { km: 5.6, type: "tea" },
      { km: 6.7, type: "snickers" }
    ],
    weather: [
      { from: 0.0, to: 4.0, type: "sun" },
      { from: 4.6, to: 7.67, type: "wind" },
      { from: 5.4, to: 7.67, type: "snow" }
    ],
    wet: [[1.5, 1.8], [5.8, 6.2], [7.0, 7.3]],
    bridge: [1.85, 1.95],
    bridgeStyle: "plank",
    donkeys: [],
    porters: [0.8, 2.8, 5.0, 6.9],
    scenery: [
      { km: 0.05, type: "village" },
      { km: 1.0, type: "flags" },
      { km: 4.35, type: "village" },
      { km: 4.45, type: "board", text: ["WELCOME TO", "MACHHAPUCHHRE BASE CAMP", "3700m"] },
      { km: 5.9, type: "flags" },
      { km: 7.55, type: "board", text: ["NAMASTE", "ANNAPURNA BASE CAMP", "4130m"] },
      { km: 7.67, type: "teahouse" }
    ],
    friends: [
      { km: 0.6, say: "Base camp today, boys!" },
      { km: 3.4, say: "Can you feel the altitude?" },
      { km: 4.5, say: "MBC! Nearly there!" },
      { km: 6.3, say: "Snow!! Actual snow!" },
      { km: 7.3, say: "What a day!!!!" }
    ],
    // From Aidan's watch
    ryan: { steps: 13938, moving: "2:49:58", movingSec: 10198, gain: 1006 }
  },
  {
    id: 7,
    title: "Day 7: ABC to Lower Sinuwa",
    subtitle: "Biggest day, but mostly downhill. Epic sunrise start.",
    date: "4 Nov 2026",
    lengthKm: 20.46,
    finishText: "Back down to Lower Sinuwa!",
    dawn: 2.5,
    treeline: 3550,
    snowline: 3900,
    profile: [
      [0.0, 4120], [0.5, 4080], [1.0, 4020], [1.5, 3990], [2.0, 3940],
      [2.5, 3870], [3.0, 3780], [3.5, 3700], [4.0, 3620], [4.5, 3520],
      [5.0, 3400], [5.5, 3340], [6.0, 3310], [6.5, 3290], [7.0, 3270],
      [7.5, 3210], [8.0, 3180], [8.5, 3140], [9.0, 3100], [9.5, 2980],
      [10.0, 2880], [10.5, 2830], [11.0, 2780], [11.5, 2700], [12.0, 2620],
      [12.5, 2570], [13.0, 2530], [13.5, 2500], [14.0, 2470], [14.5, 2400],
      [15.0, 2340], [15.4, 2318], [15.8, 2360], [16.2, 2420], [16.8, 2445],
      [17.4, 2438], [17.8, 2420], [18.4, 2390], [19.0, 2375], [19.5, 2340],
      [20.0, 2230], [20.46, 2140]
    ],
    stairs: [[2.8, 3.4], [4.4, 5.1], [9.3, 10.1], [11.3, 12.1], [14.3, 15.2], [15.6, 16.3], [19.6, 20.46]],
    bamboo: [[11.0, 13.6]],
    snacks: [
      { km: 1.8, type: "tea" },
      { km: 4.4, type: "snickers" },
      { km: 7.0, type: "tea" },
      { km: 9.6, type: "dalbhat" },
      { km: 12.4, type: "snickers" },
      { km: 15.0, type: "tea" },
      { km: 17.6, type: "snickers" },
      { km: 19.4, type: "tea" }
    ],
    weather: [
      { from: 0.0, to: 2.5, type: "snow" },
      { from: 3.0, to: 9.0, type: "sun" },
      { from: 9.0, to: 10.5, type: "fog" },
      { from: 13.6, to: 17.0, type: "sun" },
      { from: 17.5, to: 20.46, type: "drizzle" }
    ],
    wet: [[1.0, 1.4], [9.4, 9.9], [15.2, 15.45], [19.7, 20.2]],
    bridge: [15.3, 15.38],
    bridgeStyle: "plank",
    donkeys: [8.4, 13.0, 17.0],
    porters: [1.2, 4.8, 7.6, 10.4, 14.2, 18.4],
    scenery: [
      { km: 0.08, type: "board", text: ["NAMASTE", "ANNAPURNA BASE CAMP", "4130m"] },
      { km: 1.6, type: "flags" },
      { km: 3.5, type: "board", text: ["WELCOME TO", "MACHHAPUCHHRE BASE CAMP", "3700m"] },
      { km: 5.6, type: "village" },
      { km: 8.1, type: "village" },
      { km: 9.6, type: "village" },
      { km: 11.6, type: "village" },
      { km: 14.0, type: "flags" },
      { km: 16.6, type: "village" },
      { km: 18.4, type: "flags" },
      { km: 20.4, type: "village" },
      { km: 20.46, type: "teahouse" }
    ],
    friends: [
      { km: 0.4, say: "Look at that sunrise!!" },
      { km: 3.6, say: "Bye bye, MBC" },
      { km: 7.0, say: "Downhill all day, they said" },
      { km: 11.5, say: "Bamboo again!" },
      { km: 15.6, say: "Wait, why are we going UP?" },
      { km: 19.0, say: "Nearly there, knees" }
    ],
    // From Aidan's watch
    ryan: { steps: 27486, moving: "5:39:44", movingSec: 20384, gain: 422 }
  }
];
