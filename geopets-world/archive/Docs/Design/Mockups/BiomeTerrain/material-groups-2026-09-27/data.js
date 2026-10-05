'use strict';
// Written by tools/build_bundle.py.
window.MG = {
 "stone": [
  {
   "id": "a-boulders",
   "name": "Boulder cluster",
   "build": "One large boulder and four to six smaller ones, each a subdivided box; scree as instanced pebbles.",
   "tris": "700 at home, 300 small",
   "sheet": "sheets/stone-a-boulders-sheet.jpg",
   "stonefield": "tiles/stone-a-boulders-stonefield.jpg",
   "meadow": "tiles/stone-a-boulders-meadow.jpg"
  },
  {
   "id": "b-mound",
   "name": "Rock mound",
   "build": "One sculpted low hill mesh, plus three or four boulders reused from the cluster.",
   "tris": "600 at home, 250 small",
   "sheet": "sheets/stone-b-mound-sheet.jpg",
   "stonefield": "tiles/stone-b-mound-stonefield.jpg",
   "meadow": "tiles/stone-b-mound-meadow.jpg"
  },
  {
   "id": "c-stepped",
   "name": "Stepped quarry",
   "build": "Bevelled boxes for the steps and the stacked blocks; the pit floor is a flat plane.",
   "tris": "500 at home, 200 small",
   "sheet": "sheets/stone-c-stepped-sheet.jpg",
   "stonefield": "tiles/stone-c-stepped-stonefield.jpg",
   "meadow": "tiles/stone-c-stepped-meadow.jpg"
  },
  {
   "id": "d-tor",
   "name": "Tor",
   "build": "Two or three flattened rounded slabs stacked, and loose boulders at the base.",
   "tris": "650 at home, 250 small",
   "sheet": "sheets/stone-d-tor-sheet.jpg",
   "stonefield": "tiles/stone-d-tor-stonefield.jpg",
   "meadow": "tiles/stone-d-tor-meadow.jpg"
  },
  {
   "id": "e-slabs",
   "name": "Slab outcrop",
   "build": "Five to seven bevelled tilted slabs and instanced rubble.",
   "tris": "500 at home, 200 small",
   "sheet": "sheets/stone-e-slabs-sheet.jpg",
   "stonefield": "tiles/stone-e-slabs-stonefield.jpg",
   "meadow": "tiles/stone-e-slabs-meadow.jpg"
  }
 ],
 "groups": [
  {
   "id": "clay",
   "name": "Clay",
   "concepts": [
    {
     "letter": "A",
     "text": "an open pit of smooth orange-brown clay with a few cut clay blocks stacked at its edge",
     "build": "A dished pit mesh and bevelled blocks.",
     "tris": "400",
     "at": [
      178,
      229
     ]
    },
    {
     "letter": "B",
     "text": "an eroded clay bank: a low rounded mound of layered orange and ochre clay with one side cut away as a smooth scooped face",
     "build": "One layered mound mesh with a cut face.",
     "tris": "350",
     "at": [
      318,
      242
     ]
    },
    {
     "letter": "C",
     "text": "a row of shallow terraced clay pits stepping down, each with smooth wet-looking clay, and a neat stack of drying clay bricks",
     "build": "Three stepped pit meshes and a stack of bevelled bricks.",
     "tris": "550",
     "at": [
      101,
      653
     ]
    },
    {
     "letter": "D",
     "text": "a round pool of soft wet grey-brown clay with a cracked, dried, paler rim of hexagonal clay plates around it",
     "build": "A flat pool disc and a ring of plate tiles.",
     "tris": "450",
     "at": [
      337,
      759
     ]
    }
   ],
   "sheet": "sheets/clay-sheet.jpg",
   "map": "tiles/clay-map.jpg"
  },
  {
   "id": "copper-ore",
   "name": "Copper ore",
   "concepts": [
    {
     "letter": "A",
     "text": "an outcrop of grey rocks streaked with bright copper-orange veins and patches of green patina",
     "build": "Rounded rocks with a second vein material.",
     "tris": "500",
     "at": [
      171,
      252
     ]
    },
    {
     "letter": "B",
     "text": "one tall rounded rock face with a thick band of bright copper running across it, green patina dripping below the band",
     "build": "One tall rock face with a banded material.",
     "tris": "350",
     "at": [
      319,
      246
     ]
    },
    {
     "letter": "C",
     "text": "a cluster of rounded boulders crusted in turquoise-green verdigris, with matte copper-orange nuggets at their feet",
     "build": "Rounded boulders and small nugget spheres.",
     "tris": "550",
     "at": [
      70,
      666
     ]
    },
    {
     "letter": "D",
     "text": "a low rock split open along a crack, its inside faces solid copper orange, green patina on the outside",
     "build": "One rock split into two halves.",
     "tris": "350",
     "at": [
      323,
      426
     ]
    }
   ],
   "sheet": "sheets/copper-ore-sheet.jpg",
   "map": "tiles/copper-ore-map.jpg"
  },
  {
   "id": "iron-ore",
   "name": "Iron ore",
   "concepts": [
    {
     "letter": "A",
     "text": "an outcrop of dark charcoal-grey rocks with rust-red streaks",
     "build": "Rounded rocks with a second streak material.",
     "tris": "500",
     "at": [
      174,
      234
     ]
    },
    {
     "letter": "B",
     "text": "a patch of rust-red iron-stained ground with a few dark rounded stones lying in it",
     "build": "A ground decal and a few stones.",
     "tris": "200",
     "at": [
      294,
      246
     ]
    },
    {
     "letter": "C",
     "text": "a cluster of short stout six-sided dark rock columns, rust staining down their sides",
     "build": "Six-sided prisms of three heights.",
     "tris": "300",
     "at": [
      120,
      652
     ]
    },
    {
     "letter": "D",
     "text": "a big dark boulder split in two, showing a darker smooth metallic-grey core with a rust-orange rim",
     "build": "One boulder split into two halves with a core material.",
     "tris": "400",
     "at": [
      338,
      607
     ]
    }
   ],
   "sheet": "sheets/iron-ore-sheet.jpg",
   "map": "tiles/iron-ore-map.jpg"
  },
  {
   "id": "quartz",
   "name": "Quartz",
   "concepts": [
    {
     "letter": "A",
     "text": "a grey rock outcrop bristling with pale white crystal points",
     "build": "A rounded rock and five to seven crystal prisms.",
     "tris": "450",
     "at": [
      174,
      222
     ]
    },
    {
     "letter": "B",
     "text": "a rounded grey boulder split open like a geode, its hollow lined with pale crystal points",
     "build": "A hollowed boulder half and small prisms inside.",
     "tris": "550",
     "at": [
      163,
      271
     ]
    },
    {
     "letter": "C",
     "text": "a single large cluster of tall pale crystal spires rising straight out of the ground, with small ones round it",
     "build": "Tall and short crystal prisms in one cluster.",
     "tris": "350",
     "at": [
      327,
      495
     ]
    },
    {
     "letter": "D",
     "text": "a line of pale crystal points growing along a crack in the flat slabs, like a vein breaking the surface",
     "build": "A row of small prisms along a ground decal.",
     "tris": "300",
     "at": [
      104,
      663
     ]
    }
   ],
   "sheet": "sheets/quartz-sheet.jpg",
   "map": "tiles/quartz-map.jpg"
  },
  {
   "id": "thunderstone",
   "name": "Thunderstone",
   "concepts": [
    {
     "letter": "A",
     "text": "a cluster of dark slate-indigo boulders crossed by thin gold cracks",
     "build": "Rounded boulders with a gold crack material.",
     "tris": "500",
     "at": [
      162,
      216
     ]
    },
    {
     "letter": "B",
     "text": "a shallow round crater with a scorched darker ring, a dark indigo stone lying at its centre with gold cracks",
     "build": "A dished crater, a ground decal and one stone.",
     "tris": "350",
     "at": [
      296,
      246
     ]
    },
    {
     "letter": "C",
     "text": "a tall dark indigo standing stone, slightly leaning, with gold veins running up it and a few smaller dark stones round it",
     "build": "One tall leaning stone and a few small ones.",
     "tris": "300",
     "at": [
      66,
      405
     ]
    },
    {
     "letter": "D",
     "text": "a dark indigo rock split by a lightning-like zigzag crack whose edges are gold",
     "build": "One rock split along a zigzag, gold on the split faces.",
     "tris": "400",
     "at": [
      319,
      512
     ]
    }
   ],
   "sheet": "sheets/thunderstone-sheet.jpg",
   "map": "tiles/thunderstone-map.jpg"
  }
 ],
 "round2": [
  {
   "id": "lineup",
   "title": "All six in the colour plan",
   "sheets": [
    "sheets/r2-lineup-sheet.jpg"
   ],
   "tiles": [
    "tiles/r2-lineup-map.jpg"
   ]
  },
  {
   "id": "clay",
   "title": "Clay in greys",
   "sheets": [
    "sheets/r2-clay-sheet.jpg"
   ],
   "tiles": [
    "tiles/r2-clay-map.jpg"
   ]
  },
  {
   "id": "copper",
   "title": "Copper shapes and colours",
   "sheets": [
    "sheets/r2-copper-shapes.jpg",
    "sheets/r2-copper-colours.jpg"
   ],
   "tiles": [
    "tiles/r2-copper-map.jpg"
   ]
  },
  {
   "id": "iron",
   "title": "Iron colours",
   "sheets": [
    "sheets/r2-iron-sheet.jpg"
   ],
   "tiles": [
    "tiles/r2-iron-map.jpg"
   ]
  },
  {
   "id": "quartz",
   "title": "Quartz vein in pieces",
   "sheets": [
    "sheets/r2-quartz-sheet.jpg"
   ],
   "tiles": [
    "tiles/r2-quartz-map.jpg"
   ]
  },
  {
   "id": "thunderstone",
   "title": "Thunderstone crater on flat ground",
   "sheets": [
    "sheets/r2-thunderstone-sheet.jpg"
   ],
   "tiles": [
    "tiles/r2-thunderstone-map.jpg"
   ]
  }
 ],
 "alternate": {
  "stonefield": "tiles/stone-b-mound-stonefield.jpg",
  "meadow": "tiles/stone-a-boulders-meadow.jpg"
 }
};
