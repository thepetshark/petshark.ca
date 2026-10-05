/* Real game content shared by every direction, as a plain global so the pages
   open straight from disk. Names, rarities, biomes and item titles are copied
   from Assets/_GeoPets/Content/Definitions/Balance (2026-09-20). Levels, found
   flags, counts and prices are ILLUSTRATIVE and exist only to fill a mockup. */
window.GPW = {
  biomes: {
    meadow: "Meadow", grove: "Grove", marsh: "Marsh",
    stonefield: "Stonefield", snow: "Snow", town: "Town"
  },
  // "town" marks the three location-tagged species that have no biome.
  wildlings: [
    { slug: "dapplehop",     name: "Dapplehop",     rarity: "common",   biome: "meadow",     level: 3, found: true },
    { slug: "reedshield",    name: "Reedshield",    rarity: "rare",     biome: "marsh",      level: 1, found: true },
    { slug: "mossshell",     name: "Mossshell",     rarity: "uncommon", biome: "meadow",     level: 2, found: true },
    { slug: "petal-bud",     name: "Petal Bud",     rarity: "uncommon", biome: "meadow",     level: 1, found: true,  family: 1 },
    { slug: "petal-bloom",   name: "Petal Bloom",   rarity: "uncommon", biome: "meadow",     level: 4, found: true,  family: 2 },
    { slug: "petal-blossom", name: "Petal Blossom", rarity: "uncommon", biome: "meadow",     level: 0, found: false, family: 3 },
    { slug: "mossbrush",     name: "Mossbrush",     rarity: "common",   biome: "grove",      level: 3, found: true },
    { slug: "thimblepaw",    name: "Thimblepaw",    rarity: "common",   biome: "grove",      level: 1, found: true },
    { slug: "leafnap",       name: "Leafnap",       rarity: "common",   biome: "grove",      level: 3, found: true },
    { slug: "lilykip",       name: "Lilykip",       rarity: "common",   biome: "marsh",      level: 3, found: true },
    { slug: "gildfin",       name: "Gildfin",       rarity: "common",   biome: "marsh",      level: 3, found: true },
    { slug: "cragcurl",      name: "Cragcurl",      rarity: "uncommon", biome: "stonefield", level: 1, found: true },
    { slug: "dunebuckle",    name: "Dunebuckle",    rarity: "common",   biome: "stonefield", level: 3, found: true },
    { slug: "frostscamper",  name: "Frostscamper",  rarity: "common",   biome: "snow",       level: 1, found: true },
    { slug: "snowbrush",     name: "Snowbrush",     rarity: "uncommon", biome: "snow",       level: 0, found: false },
    { slug: "crumbcourier",  name: "Crumbcourier",  rarity: "common",   biome: "town",       level: 2, found: true },
    { slug: "porchwhistle",  name: "Porchwhistle",  rarity: "common",   biome: "town",       level: 1, found: true },
    { slug: "pennyplume",    name: "Pennyplume",    rarity: "uncommon", biome: "town",       level: 1, found: true }
  ],
  items: [
    { slug: "softwood",     title: "Softwood",     kind: "Material", count: 13 },
    { slug: "wheat",        title: "Wheat",        kind: "Material", count: 24 },
    { slug: "water",        title: "Water",        kind: "Material", count: 26 },
    { slug: "stone",        title: "Stone",        kind: "Material", count: 8 },
    { slug: "egg",          title: "Egg",          kind: "Material", count: 5 },
    { slug: "milk",         title: "Milk",         kind: "Material", count: 3 },
    { slug: "blackberries", title: "Blackberries", kind: "Material", count: 11 },
    { slug: "flour",        title: "Flour",        kind: "Product",  count: 6 },
    { slug: "biscuit",      title: "Biscuit",      kind: "Product",  count: 4 },
    { slug: "berry-tonic",  title: "Berry tonic",  kind: "Product",  count: 2 },
    { slug: "wooden-trap",  title: "Wooden Trap",  kind: "Tool",     count: 3 }
  ],
  wallet: { coins: 60, water: 26 },
  copy: {
    splash: { heading: "Ready to explore?", status: "Playing as a guest", primary: "Continue", secondary: ["Create account", "Sign in"] },
    hire: { place: "Riverside woodland", yieldLine: "5 wood per worker", timeLine: "60 seconds of work", prompt: "Pay for this single assignment?", coins: 10, water: 1 }
  }
};
