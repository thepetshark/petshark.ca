'use strict';
// Written by tools/build_bundle.py: the finds, their crops and icons, and each tile's pin positions (390x844 points).
window.SINGLES = {
 "biomes": [
  {
   "id": "meadow",
   "name": "Meadow",
   "singles": [
    {
     "id": "chamomile",
     "name": "Chamomile",
     "icon": "chamomile.png",
     "crop": "specimens/chamomile.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      13,
      394,
      516,
      810
     ]
    },
    {
     "id": "sunflower-seeds",
     "name": "Sunflower seeds",
     "icon": "sunflower-seeds.png",
     "crop": "specimens/sunflower-seeds.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      516,
      172,
      1027,
      825
     ]
    },
    {
     "id": "star-petal",
     "name": "Star petal",
     "icon": "star-petal.png",
     "crop": "specimens/star-petal.jpg",
     "candidate": false,
     "fantasy": true,
     "box": [
      1029,
      213,
      1521,
      820
     ],
     "cropNight": "specimens/star-petal-night.jpg"
    }
   ],
   "tiles": [
    {
     "id": "meadow-default",
     "caption": "Default zoom",
     "image": "mockups/meadow-default.jpg",
     "pins": {
      "chamomile": [
       187.5,
       264
      ],
      "sunflower-seeds": [
       90,
       390
      ],
      "star-petal": [
       260,
       516
      ]
     }
    },
    {
     "id": "meadow-in",
     "caption": "Zoomed in",
     "image": "mockups/meadow-in.jpg",
     "pins": {
      "chamomile": [
       332,
       555
      ],
      "sunflower-seeds": [
       270,
       461
      ],
      "star-petal": [
       215,
       297.5
      ]
     },
     "night": "mockups/meadow-in-night.jpg"
    }
   ]
  },
  {
   "id": "grove",
   "name": "Grove",
   "singles": [
    {
     "id": "hazelnut",
     "name": "Hazelnuts",
     "icon": "hazelnut.png",
     "crop": "specimens/hazelnut.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      0,
      319,
      398,
      755
     ]
    },
    {
     "id": "mushroom",
     "name": "Mushrooms",
     "icon": "mushroom.png",
     "crop": "specimens/mushroom.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      398,
      381,
      763,
      752
     ]
    },
    {
     "id": "tree-resin",
     "name": "Tree resin",
     "icon": "tree-resin.png",
     "crop": "specimens/tree-resin.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      763,
      128,
      1139,
      764
     ]
    },
    {
     "id": "glowcap",
     "name": "Glowcap",
     "icon": "glowcap.png",
     "crop": "specimens/glowcap.jpg",
     "candidate": false,
     "fantasy": true,
     "box": [
      1139,
      402,
      1529,
      751
     ],
     "cropNight": "specimens/glowcap-night.jpg"
    }
   ],
   "tiles": [
    {
     "id": "grove-default",
     "caption": "Default zoom",
     "image": "mockups/grove-default.jpg",
     "pins": {
      "hazelnut": [
       106.5,
       247.5
      ],
      "mushroom": [
       122.5,
       423.5
      ],
      "tree-resin": [
       316,
       231
      ],
      "glowcap": [
       265,
       311
      ]
     }
    },
    {
     "id": "grove-in",
     "caption": "Zoomed in",
     "image": "mockups/grove-in.jpg",
     "pins": {
      "hazelnut": [
       252.5,
       481
      ],
      "mushroom": [
       310,
       538
      ],
      "tree-resin": [
       175,
       410
      ],
      "glowcap": [
       215,
       352
      ]
     },
     "night": "mockups/grove-in-night.jpg"
    }
   ]
  },
  {
   "id": "stonefield",
   "name": "Stonefield",
   "singles": [
    {
     "id": "wild-thyme",
     "name": "Wild thyme",
     "icon": "wild-thyme.svg",
     "crop": "specimens/wild-thyme.jpg",
     "candidate": true,
     "fantasy": false,
     "box": [
      13,
      65,
      531,
      470
     ]
    },
    {
     "id": "juniper-berries",
     "name": "Juniper berries",
     "icon": "juniper-berries.svg",
     "crop": "specimens/juniper-berries.jpg",
     "candidate": true,
     "fantasy": false,
     "box": [
      532,
      21,
      1018,
      466
     ]
    },
    {
     "id": "stonecrop",
     "name": "Stonecrop",
     "icon": "stonecrop.svg",
     "crop": "specimens/stonecrop.jpg",
     "candidate": true,
     "fantasy": false,
     "box": [
      1018,
      74,
      1527,
      465
     ]
    },
    {
     "id": "edelweiss",
     "name": "Edelweiss",
     "icon": "edelweiss.svg",
     "crop": "specimens/edelweiss.jpg",
     "candidate": true,
     "fantasy": false,
     "box": [
      15,
      499,
      513,
      982
     ]
    },
    {
     "id": "prickly-pear",
     "name": "Prickly pear",
     "icon": "prickly-pear.svg",
     "crop": "specimens/prickly-pear.jpg",
     "candidate": true,
     "fantasy": false,
     "box": [
      524,
      475,
      1021,
      982
     ]
    },
    {
     "id": "sparkthistle",
     "name": "Sparkthistle",
     "icon": "sparkthistle.svg",
     "crop": "specimens/sparkthistle.jpg",
     "candidate": true,
     "fantasy": true,
     "box": [
      1028,
      465,
      1515,
      986
     ],
     "cropNight": "specimens/sparkthistle-night.jpg"
    }
   ],
   "tiles": [
    {
     "id": "stonefield-v1-default",
     "caption": "Version 1, default zoom",
     "image": "mockups/stonefield-v1-default.jpg",
     "pins": {
      "wild-thyme": [
       182.5,
       201
      ],
      "juniper-berries": [
       340,
       366
      ],
      "sparkthistle": [
       235,
       522.5
      ]
     }
    },
    {
     "id": "stonefield-v1-in",
     "caption": "Version 1, zoomed in",
     "image": "mockups/stonefield-v1-in.jpg",
     "pins": {
      "wild-thyme": [
       200,
       264
      ],
      "juniper-berries": [
       350,
       569
      ],
      "sparkthistle": [
       137.5,
       617.5
      ]
     },
     "night": "mockups/stonefield-v1-in-night.jpg"
    },
    {
     "id": "stonefield-v2-default",
     "caption": "Version 2, default zoom",
     "image": "mockups/stonefield-v2-default.jpg",
     "pins": {
      "stonecrop": [
       225,
       171
      ],
      "edelweiss": [
       352.5,
       237.5
      ],
      "prickly-pear": [
       107.5,
       507.5
      ]
     }
    },
    {
     "id": "stonefield-v2-in",
     "caption": "Version 2, zoomed in",
     "image": "mockups/stonefield-v2-in.jpg",
     "pins": {
      "stonecrop": [
       187.5,
       262
      ],
      "edelweiss": [
       55,
       668.5
      ],
      "prickly-pear": [
       342.5,
       587.5
      ]
     }
    }
   ]
  },
  {
   "id": "marsh",
   "name": "Marsh",
   "singles": [
    {
     "id": "wild-mint",
     "name": "Wild mint",
     "icon": "wild-mint.png",
     "crop": "specimens/wild-mint.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      29,
      271,
      507,
      741
     ]
    },
    {
     "id": "cotton-grass",
     "name": "Cotton grass",
     "icon": "cotton-grass.png",
     "crop": "specimens/cotton-grass.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      527,
      275,
      995,
      743
     ]
    },
    {
     "id": "wisp-lily",
     "name": "Wisp lily",
     "icon": "wisp-lily.png",
     "crop": "specimens/wisp-lily.jpg",
     "candidate": false,
     "fantasy": true,
     "box": [
      1014,
      368,
      1507,
      743
     ],
     "cropNight": "specimens/wisp-lily-night.jpg"
    }
   ],
   "tiles": [
    {
     "id": "marsh-default",
     "caption": "Default zoom",
     "image": "mockups/marsh-default.jpg",
     "pins": {
      "wild-mint": [
       135,
       239
      ],
      "cotton-grass": [
       287.5,
       288
      ],
      "wisp-lily": [
       102.5,
       289
      ]
     }
    },
    {
     "id": "marsh-in",
     "caption": "Zoomed in",
     "image": "mockups/marsh-in.jpg",
     "pins": {
      "wild-mint": [
       75,
       322.5
      ],
      "cotton-grass": [
       265,
       595
      ],
      "wisp-lily": [
       294,
       319
      ]
     },
     "night": "mockups/marsh-in-night.jpg"
    }
   ]
  },
  {
   "id": "snow",
   "name": "Snow",
   "singles": [
    {
     "id": "winterberries",
     "name": "Winterberries",
     "icon": "winterberries.png",
     "crop": "specimens/winterberries.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      2,
      251,
      525,
      760
     ]
    },
    {
     "id": "snow-lichen",
     "name": "Snow lichen",
     "icon": "snow-lichen.png",
     "crop": "specimens/snow-lichen.jpg",
     "candidate": false,
     "fantasy": false,
     "box": [
      525,
      287,
      1024,
      764
     ]
    },
    {
     "id": "frostbloom",
     "name": "Frostbloom",
     "icon": "frostbloom.png",
     "crop": "specimens/frostbloom.jpg",
     "candidate": false,
     "fantasy": true,
     "box": [
      1024,
      286,
      1533,
      768
     ],
     "cropNight": "specimens/frostbloom-night.jpg"
    }
   ],
   "tiles": [
    {
     "id": "snow-default",
     "caption": "Default zoom",
     "image": "mockups/snow-default.jpg",
     "pins": {
      "winterberries": [
       75,
       170
      ],
      "snow-lichen": [
       306,
       280
      ],
      "frostbloom": [
       100,
       402.5
      ]
     }
    },
    {
     "id": "snow-in",
     "caption": "Zoomed in",
     "image": "mockups/snow-in.jpg",
     "pins": {
      "winterberries": [
       114,
       295
      ],
      "snow-lichen": [
       292.5,
       526
      ],
      "frostbloom": [
       312.5,
       391.5
      ]
     },
     "night": "mockups/snow-in-night.jpg"
    }
   ]
  }
 ]
};
