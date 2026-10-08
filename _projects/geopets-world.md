---
layout: project
title: Geo Pets World
subtitle: Open the map and collect what is nearby
description: A location-based creature-collecting game, rebuilt from my own Geo Pets prototype with AI agents as the development team.
kind: game
status: in-development
year: 2026
platforms: [Android]
engine: Unity
featured: true
image: /assets/img/projects/geopets-world/card.jpg
image_alt: Three phone screens showing a floating island village with a windmill, cottages and bridges
links:
  devlog: /geopets-world/devlog/
theme:
  bar: "#f7f9f3"
  background: "#e4eadd"
  surface: "#f7f9f3"
  text: "#1d3a30"
  accent: "#366950"
  accent_ink: "#f7f9f3"
  pattern: /assets/img/projects/geopets-world/pattern.png
  hero: /assets/img/projects/geopets-world/hero.jpg
  hero_alt: The game's map seen from above, with stony hills, a grove of trees, a market landmark, a pickup pin and a Wildling with three chickens near the shore
---

Geo Pets World is a game you play by going out. The map is the real one around you, drawn as a small 3D world: the roads, the shoreline and the lie of the land come from map and elevation data, and the biome you are standing in decides how the ground looks and what lives on it. Open the map and there is something nearby to collect, a creature to trap, a patch where a worker can gather, a stall to trade at, and above it all your own Hometown floating in the clouds. It is a rebuild of Geo Pets, a prototype I programmed myself, and this time I did not write the code.

## The world

The map has three zooms, and each one changes the camera: close in with a horizon, the everyday view, and almost straight down with the whole range ring in sight. The light follows the real time of day, so shadows swing round and the map keeps its own colours under the moon at night. Water has depth and schools of fish, with a turtle, a ray or an eel surfacing now and then, and by day a skein of birds crosses the whole map. Five biomes so far: Meadow, Grove, Marsh, Stonefield and Snow.

![The same shore at three zooms: close in with the player's ring in the water, the everyday view, and the wide view at night with the water's glow and the pins still readable](/assets/img/projects/geopets-world/world-zooms.jpg)

## Collecting, crafting and trading

Wildlings appear in the world and are caught with traps and bait. Workers are hired at resource patches, a river shoal or a woodland, and keep gathering while you are away. What they bring home goes into Hometown's buildings, a Mill, a Bakery, a Care Bench and a Workbench, and what you make there is sold on a player market that other players browse. Every player's save lives in the cloud, and only the market is run by the server: the rest of the game is worked out on the phone.

![A worker's river shoal ready to collect on the map, and Hometown on its floating island with a crafting-ready notice](/assets/img/projects/geopets-world/home-and-work.jpg)

## How it was made

AI agents wrote the code, the tests, the tooling and the mockups, working as my development team, and I ran the project the way a game team runs: nothing was built from a single prompt and left to run. Over four weeks from September 2026 the work went through the same steps every time.

1. Workshop. I set the pillars and the priorities, and we settled the open questions in writing before anything was drawn.
2. Mockups. Working browser mockups for every screen and look, 38 bundles in all, reviewed on my notes; whole visual directions were set aside after review.
3. Specs. The agreed design went into epics and issues with acceptance criteria, 418 issues across ten epics, and a decision ledger recorded about 280 of my calls in my own words, each linked to the issue where I made it.
4. Implementation. The agents built to the issues on one shared branch, with reviewed mockups first for any new screen.
5. Testing and review. Unit tests, live checks that drive the running game and capture what it drew, and an audit of delegated work by a second, different model before I accepted it, which caught defects that passing tests had missed. I accepted, revised or rejected each result myself.

## From mockup to game

A reviewed mockup came first for every look, and the game was then checked against it in pixels. The water went from a browser study to the game's shader in a day; Stonefield's rugged ground was shaped to a set of painted references with the roads kept clear of peaks and boulders.

![The water study beside the water in the game, and the painted Stonefield reference beside the game's Stonefield](/assets/img/projects/geopets-world/mockup-to-game.jpg)

## Ideas explored and set aside

The [Dev Log](/geopets-world/devlog/) shows 43 of the design experiments in the order they were made, each a working page shown as built: four art directions that were not taken, the map at night, beams that lower a trap from the sky, a 3D Hometown, production lines, icons and portraits, and more. Many were explored and dropped, which is the point of showing them.

![Eight Dev Log entries: four art directions, biome horizons, the map at night, placement beams, a 3D Hometown, production buildings, creature portraits and single finds on the map](/assets/img/projects/geopets-world/explored.jpg)

## Where it stands

A development build runs on my Android phone, and the screens on this page are taken from it. The project is paused at the prototype stage since early October 2026 while I rethink the core loop.

## Credits

Map data © Mapbox and © OpenStreetMap contributors, shown through the Online Maps plugin for Unity. The buildings and creatures in these screens are placeholder art from asset packs while the game's own art is decided. Interface typeface: Nunito, under the SIL Open Font License.
