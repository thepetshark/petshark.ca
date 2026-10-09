---
layout: project
title: "Tanks Mate 2: Toon Tanks"
description: A toony arcade tank battle for up to four friends on one network, with bots to fill out ten-tank fights through a sunny resort town.
kind: game
status: in-development
year: 2026
platforms: [Windows]
engine: Unity
image: /assets/img/projects/tanksmatetoon/card.jpg
image_alt: "The Tanks Mate 2: Toon Tanks logo, three cartoon tanks in a comic burst, over a street of the resort town"
links:
  devlog: /tanksmatetoon/devlog/
theme:
  bar: "#FFF3D1"
  background: "#1C2A4F"
  surface: "#FFFFFF"
  text: "#1C2A4F"
  accent: "#B4360E"
  accent_ink: "#FFFFFF"
  pattern: /assets/img/projects/tanksmatetoon/pattern.png
  hero: /assets/img/projects/tanksmatetoon/hero.jpg
  hero_alt: A red cartoon tank in a street of the resort town, aiming at a purple tank by the palm trees, with the scoreboard, the battle clock and the radar along the top
---

Tanks Mate 2: Toon Tanks is a party game for Windows PCs in which cartoon tanks fight through a sunny resort town. I made it for my kids, as a fun game to play together. One player hosts on their PC, up to three friends on the same network join from theirs, and bots take as many of the ten seats as the host likes, so it also works as a game for one. Matches are every tank for itself, or Red against Blue.

## How it plays

- You drive the tracks with the keyboard or the left stick, and turn the camera and the turret with the mouse or the right stick. The mouse wheel zooms, the middle button looks straight down the barrel, and holding Ctrl swings the camera round the tank while the turret keeps its aim.
- Before a match each player picks a tank, the quick Scout or the slow, hard-hitting Bruiser, in one of 26 skins, with one of six abilities: Speed Burst, Double Shot, Shield, Mine Layer, Homing Missile or Dash Ram.
- Power-ups appear around the town: Repair, Rapid Fire, Triple Shot, Bouncing Shells and the Mega Shell.
- The host sets the kill target and the time. By default the first to 10 kills wins, or whoever leads after five minutes, and in a team match the first team to 20. A destroyed tank comes back three seconds later, protected for a moment.
- Bots come in five levels. Each player picks their own, and a bot plays at the level of the player it is fighting. Bots on the higher levels go for repairs, take cover, dodge shells and wait round corners.

![A red tank firing in a town street, with black smoke rising beside it and scorch marks on the road](/assets/img/projects/tanksmatetoon/battle.jpg)

## The town

The battlefield is a whole resort town, about 144 by 120 metres of streets, plazas and alleys, big enough to flank an enemy or get away from one. Almost everything in it reacts to the tanks:

- Palm trees and street lights shake at a bump, and a shell or a fast ram knocks them down for good.
- Fire hydrants fly off and leave a jet of water behind.
- Chairs, tables, bins and scooters get shoved aside. Cars and concrete barriers are heavy and slow you right down.
- Cars catch fire when they are hit and then explode, leaving a smoking wreck to hide behind. Barrels go up at a single shot.
- Shells and blasts leave scorch marks that fade after 45 seconds. The buildings never break, so the streets keep their shape.

![The resort town from above: streets, plazas, parks and the buildings between them](/assets/img/projects/tanksmatetoon/town-map.jpg)

## Playing together

Games on your network show up in a list, or you can type the host's address. The host's PC runs the match, so everyone sees the same thing. In the lobby the players' tanks stand on spot-lit pedestals in the skins they picked, while the host chooses the mode, the time, the kill target and how many bots join. In a team match it is Red against Blue, five seats a side, with no friendly fire.

![The lobby: the player's tank on a pedestal, the ten seats with their bots, and the match options](/assets/img/projects/tanksmatetoon/lobby.jpg)

## How it was made

I made the game with Claude Code, an AI coding agent. I wrote the brief, made the design calls, played the builds and passed on what my kids said. Claude Code wrote the code, the tests and the tools, made the game's own sounds and music in code, and wrote each decision into the project's GitHub issues for me to check. OpenAI's Codex drew the logo, the game icon and the pictures on the newer skins, and Claude Code wrote a tool that paints them onto the tanks.

It took under five days, from the first commit on the evening of 3 October 2026 to the build my kids are playing now. The [Dev Log](/tanksmatetoon/devlog/) goes through it build by build, including the four builds the agent held back.

## Credits

Tanks and their sounds from *Kawaii Tanks Project (Free)*, the town from *Modular Resort Town*, and explosions and other effects from *Epic Toon FX* and the *Cartoon FX Remaster* packs, all from the Unity Asset Store. The logo, the game icon and the pictures on the newer skins were drawn with OpenAI's Codex. The gameplay, the skins, the other sounds and the music were made for this project.
