---
layout: project
title: IdLings
subtitle: From a Unity prototype to the App Store
description: A story-driven idle game I rebuilt from my old Unity prototype using Godot in five days, directing AI agents as my development team.
kind: game
status: released
year: 2026
platforms: [iPhone]
engine: Godot
image: /assets/img/projects/idlings/card.jpg
image_alt: Freed fairies and their kitties on the forest floor, one saying "Every upgrade makes us stronger. Keep going!"
links:
  app_store: https://apps.apple.com/us/app/idlings/id6816804643
  devlog: /idlings/devlog/
  support: /idlings/
  privacy: /idlings/privacy/
theme:
  bar: "#ECEEA6"
  background: "#D8E5C3"
  surface: "#FFFFFF"
  text: "#223C3A"
  accent: "#785022"
  accent_ink: "#FFFFFF"
  pattern: /assets/img/projects/idlings/pattern.png
  hero: /assets/img/projects/idlings/hero.jpg
  hero_alt: Freed fairies and their kitties on the forest floor, one saying "Every upgrade makes us stronger. Keep going!"
---

IdLings is a free idle game for iPhone: Mr Moody has turned thirteen forest fairies to stone, and you tap them free and race his clock, round after round. Unlike most idle games, it can be finished, and it has a funny ending that is worth playing all the way through to see. I started it in Unity years ago and never finished it. In September 2026 I rebuilt it in Godot with AI agents as my development team, and I ran them the way I would run any development team.

## How it was made

It was not a one-prompt build. It went through the same pipeline I used on my Unity games, and I made the calls at every step:

1. Workshop. I wrote the brief and the game concept, then settled the open design questions with the agents: the currencies, the time skips, the prices, no ads and no data collected.
2. Mockups. 24 dated rounds of mockups, each revised on my notes. I signed off the full set of screens before any UI was built, then workshopped the animations and a readability redesign on the phone.
3. Specs. An approved design plan with a measurable definition of done, a style guide, and 134 GitHub issues: epics, and tasks with acceptance criteria.
4. Implementation. Claude Code agents (Claude Opus 5.5 and Claude Fable 5.1) built the game to the issues, and OpenAI's Codex generated the new art (icons, the wooden menu signs, the app icon, the achievement badges and new animation frames), using the original sprites as references.
5. Testing and review. 407 automated tests, 114 reference screens, a balance simulation and runs on an iPhone. My playtests raised 26 issues, and all 26 are closed.
6. Release. I submitted it on 29 September 2026, and it went on sale on the App Store on 7 October.

The build itself took five days, 25 to 29 September, in 274 commits. The agents worked under my own plugin set for Claude Code and Codex: autonomy rules that let them make reversible calls and log them for my review while I kept spending, credentials and release; conventions for GitHub issues and decision records; and a shared library of iOS build lessons.

![The main screen in five steps: the Unity prototype, mockups v1, v2 and v3, and version 1.0](/assets/img/projects/idlings/evolution.jpg)

## The game

![Three screens from the game: the story's opening, the forest with fairies freed, and the fight with Mr Moody and his clock](/assets/img/projects/idlings/screens-play.jpg)

Each fairy you free gathers fairy Dust and helps break the next statue. When Mr Moody's clock runs out the stone comes back, but the fairies' light becomes Moonstones, and every round goes further. There are no ads, no accounts and no data collected, and everything in the shop can also be earned by playing.

## Where it started

The Unity version was mine alone: the code, and the C# framework under it (MMG, the same one behind [Mushi Poi](/projects/mushipoi/)). Its data tables and art carried over into the rebuild. The [Dev Log](/idlings/devlog/) shows every step in order, from my first Unity scenes in 2020 to the release.

## Credits

Characters and cats from "Lovely 2D Cat", the forest from "Simple 2d cartoon forest environment" and UI pieces from "Low Poly UI Kit" (Unity Asset Store), with new frames drawn from them. Fonts: ThaleahFat by Rick Hoppmann (Tiny Worlds), CC BY 4.0; Pixel Miners by heaven castro; Lilita One and Nunito.
