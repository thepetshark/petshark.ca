---
layout: default
title: Mushi Poi
#permalink: /projects/mushipoi/
---

# **Mushi Poi: A Development Story**

## **Project Overview**

**Mushi Poi** is a parallax side-scrolling puzzle platformer I designed for tablets (iOS/Android). It was an ambitious project for me, and it represents my unique twist on the classic "guide the creatures" genre, which I've always loved from games like *Lemmings*. My core idea was to flip the script: instead of directly controlling the creatures, you manipulate the environment to ensure their safe passage.

### **The Story**

I wanted a simple and charming narrative to drive the game. I came up with the Mushi, a peaceful tribe of round, white puffballs living in the Mushi Kingdom. The inciting incident is a great whirlwind that tears through their land, scattering the Mushi far and wide.

From there, the player's mission is clear: find the lost Mushi and guide them on their long journey home. I designed this journey to take them through diverse environments like meadows, forests, and treacherous mountains, all leading back to the safety of the Mushi Kingdom.

## **My Approach to Gameplay**

The core of Mushi Poi is what I call "indirect control." The Mushi have a mind of their own and will perpetually walk towards the level's exit. I wanted the player to feel like a guardian, so their role is to interact with a variety of puzzle elements to clear the path and protect the Mushi from harm.

### **A Modern Take on a Classic**

While I was heavily inspired by *Lemmings*, where players assign roles to individual creatures, I wanted to try something different. In Mushi Poi, I made the player interact directly with the world. This creates a frantic, engaging challenge where you often have to manage multiple moving parts of a level simultaneously. I designed the game from the ground up for tablets to really lean into multitouch controls, allowing players to tap, hold, and slide multiple objects at once.

### **Building an Interactive World**

I filled the levels with unique, physics-based objects to create interesting puzzles:

* **Buttons:** I implemented different button types. A quick tap might activate a springboard to launch Mushi over a gap, while pressing and holding another could keep a gate open or a bridge lowered.  
* **Movable Blocks:** I added massive stone blocks that players can slide to create new paths, form temporary bridges, or strategically block a group of Mushi to time their release through a dangerous area.  
* **Environmental Hazards:** To add more challenge, I created dynamic threats that require direct interaction. For instance, players have to use their fingers to plug fissures leaking poison gas or shield Mushi from falling objects.  
* **Lost Mushi:** I wanted to reward exploration, so I hid "lost Mushi" in many stages. Guiding one of your Mushi to them rescues the lost one, adding it to your group for the rest of the journey.

## **The Journey Home: Worlds & Progression**

I structured the Mushi's journey across four distinct worlds, each designed to introduce new mechanics and more complex puzzles.

* **World 1: Breezy Meadow:** This is a sunny and vibrant world that I designed as an introduction to the core mechanics.  
* **World 2: Gloomy Forest:** I wanted to change the mood, so this is a spooky, darker world that introduces new hazards and puzzle elements.  
* **World 3: Broken Cliffs:** Here, the Mushi begin their ascent up the mountains. I focused on creating puzzles around treacherous cliffs and verticality.  
* **World 4: Frozen Peaks:** This is the final, most challenging world I designed, set in a snowy, icy landscape.

Each world consists of multiple levels, and I broke each level down into five stages. To create a sense of consequence, the number of Mushi you save in one stage becomes your starting number for the next. This makes every Mushi precious.

### **Survival Mode**

For players who wanted the ultimate challenge, I added a Survival Mode. The goal here is to complete all 60+ levels in a single, continuous run. You start with a set number of Mushi, and that's all you get. The only way to increase your numbers is by rescuing the lost Mushi scattered throughout the levels. I also planned for a leaderboard to track how far players can travel before their last Mushi is lost.

## **Under the Hood: A Technical Deep Dive**

I built Mushi Poi in Unity with a personal focus on creating a robust, scalable, and performance-optimized experience for mobile devices. As I look back at the project's source code, I can see several key systems I engineered that formed the backbone of the game.

### **My Custom Game Framework ("MMG Framework")**

Early on, I decided to build a proprietary, reusable framework to keep the project organized. This core system I created handled everything from application startup (Bootstrap.cs) and scene management to a hierarchical UI system that managed popups, screen transitions, and notifications. Building this custom framework was a lot of work, but it allowed for a clean separation between my core engine code and the game-specific logic, which made the project easier to manage and scale.

### **The Modular Interactive World**

The game's rich puzzle design was only possible because I developed a flexible, modular system of over 40 unique "Blocks and Triggers." Each puzzle piece—from a SpringLauncher to a FragileBlock or a TimedActivatorButton—was built as a self-contained component. I used an interface-driven architecture (IActivator.cs) which allowed me to rapidly design and implement new gameplay ideas.

### **Crafting the Mushi AI**

I didn't want the Mushi to feel like simple walking sprites. In the Mushi.cs controller, I implemented a state machine to govern their behavior (e.g., Idle, Hop, Peril, Death). I also gave them physics-based movement and used raycasting so they could navigate the environment and avoid obstacles. This gave them a more dynamic and believable presence in the world.

### **Optimizing for Mobile**

Since this was a tablet game, performance was a top priority from day one. I focused on a few key areas:

* **Object Pooling (FastPool):** To avoid performance stutters from constantly creating and destroying objects (like Mushi or visual effects), I integrated an object pooling system. This kept a ready supply of objects in memory, recycling them as needed, which made a huge difference.  
* **Multi-Touch Controller:** I wrote a dedicated controller (MultiTouchController.cs) to handle the complex touch inputs. A key feature I added was built-in support for editor simulation, which allowed me to test multi-touch functionality without constantly deploying to a device.  
* **Parallax Engine:** To achieve the look I wanted, I developed a custom engine (ParallaxEngine.cs) to create the beautiful, multi-layered scrolling backgrounds. This gave the game a great sense of depth on screen.

### **Streamlining the Workflow**

Creating over 60 levels was a daunting task, so I knew I needed an efficient workflow. For this, I relied heavily on the Tile Editor plugin, which let me build out the platforming levels from pre-made tilesets. This tool allowed me to rapidly design, build, and edit level ideas. The combination of the Tile Editor and my modular "Blocks and Triggers" system created a really intuitive and powerful level design process. In fact, it was so straightforward that I was able to bring in a couple of level designers to help create challenges, and they picked it up almost immediately. A huge part of this success was the editor simulation I'd set up; it allowed them to test their puzzles and even make changes on-the-fly at runtime, all without leaving the Unity editor.