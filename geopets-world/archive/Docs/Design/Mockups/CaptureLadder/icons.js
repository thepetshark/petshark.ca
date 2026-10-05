'use strict';
// Flat symbols in the game's icon language: 64-unit grid, 3.2-unit dark-green contour, flat fills.
// Drawn in code for review; generated item icons would replace them in the game.
(function () {
  const INK = '#24483B';
  const o = `stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"`;
  const hi = `stroke="#FFFDF6" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".75"`;
  // Line art drawn as a thick ink stroke with a coloured core, so thin shapes keep the contour.
  const line = (d, c, w = 5) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 3.2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  const T = {
    tuft: (a, b) => `<path d="M16 52C10 42 14 28 24 22C23 30 27 34 31 32C29 22 36 12 45 9C41 19 46 25 51 30C56 37 54 49 45 53C36 57 23 58 16 52Z" fill="${a}" ${o}/><path d="M24 46C28 40 33 38 38 40M30 52C34 47 40 46 45 47" stroke="${b}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    down: (a, b) => `<path d="M14 44C8 42 8 32 15 30C14 22 24 18 29 23C32 15 45 15 47 24C55 23 59 32 53 38C58 44 52 52 45 50C42 56 32 57 28 51C21 54 14 50 14 44Z" fill="${a}" ${o}/><path d="M22 38C25 35 29 35 32 37M36 32C39 29 43 30 45 32" stroke="${b}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    feather: (a, b) => `<path d="M49 12C58 25 50 43 33 45C27 46 21 46 17 51C16 41 21 30 29 24C35 19 43 15 49 12Z" fill="${a}" ${o}/>${line('M12 56L47 16', b, 2.6)}<path d="M26 40L33 30M31 43L39 31M37 42L44 30" stroke="${b}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>`,
    scale: (a, b) => `<path d="M32 9C44 11 53 20 53 32C53 45 43 54 32 56C21 54 11 45 11 32C11 20 20 11 32 9Z" fill="${a}" ${o}/><path d="M20 30C26 24 38 24 44 30M22 40C27 35 37 35 42 40" stroke="${b}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    pebble: (a, b) => `<ellipse cx="32" cy="36" rx="21" ry="15" fill="${a}" ${o}/><path d="M21 31C24 27 29 25 34 25" ${hi}/><circle cx="40" cy="40" r="2.2" fill="${b}"/>`,
    crystal: (a, b) => `<path d="M32 7L47 27L41 57H23L17 27Z" fill="${a}" ${o}/><path d="M32 7L30 57M17 27L47 27" stroke="${b}" stroke-width="2.4" fill="none" opacity=".85"/>`,
    pearl: (a, b) => `<circle cx="32" cy="34" r="17" fill="${a}" ${o}/><path d="M24 28C26 24 30 22 34 22" ${hi}/><circle cx="40" cy="40" r="3" fill="${b}" opacity=".7"/>`,
    rose: (a, b) => `<path d="M32 12C38 16 40 22 38 26C45 23 52 27 52 33C52 40 45 42 40 40C43 47 38 54 32 54C26 54 21 47 24 40C19 42 12 40 12 33C12 27 19 23 26 26C24 22 26 16 32 12Z" fill="${a}" ${o}/><circle cx="32" cy="33" r="6" fill="${b}" ${o}/>`,
    quill: (a, b) => `<path d="M9 55L47 15L54 10L50 18L13 58Z" fill="${a}" ${o}/><path d="M47 15L54 10L50 18Z" fill="${b}" ${o}/>`,
    whisker: (a) => `${line('M10 40C24 26 42 22 56 24', a, 3)}${line('M12 50C26 38 42 34 54 36', a, 3)}<circle cx="10" cy="45" r="4" fill="${INK}"/>`,
    antler: (a) => `${line('M22 57C22 42 30 28 46 12', a, 5)}${line('M27 42L13 33', a, 4.4)}${line('M33 31L25 17', a, 4.4)}${line('M40 21L50 25', a, 4.4)}`,
    trinket: (a, b) => `<circle cx="30" cy="38" r="15" fill="none" stroke="${INK}" stroke-width="10"/><circle cx="30" cy="38" r="15" fill="none" stroke="${a}" stroke-width="5"/><path d="M42 12L50 20L42 28L34 20Z" fill="${b}" ${o}/>`,
    clover: (a, b, n = 3) => {
      const leaves = n === 4 ? [[32, 20], [44, 32], [32, 44], [20, 32]] : [[32, 19], [43, 33], [21, 33]];
      return `${line('M32 34L36 58', b, 3)}${leaves.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${n === 4 ? 9.5 : 10.5}" fill="${a}" ${o}/>`).join('')}<circle cx="32" cy="32" r="3" fill="${b}"/>`;
    },
    acorn: (a, b, two = false) => {
      const one = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 2C-12 16 -6 26 0 29C6 26 12 16 12 2Z" fill="${a}" ${o}/><path d="M-15 3C-15 -6 -8 -11 0 -11C8 -11 15 -6 15 3Z" fill="${b}" ${o}/>${line('M0 -11L3 -17', b, 2.4)}</g>`;
      return two ? one(22, 30, .85) + one(42, 32, .85) : one(32, 29, 1);
    },
    dots: (a, b) => `<path d="M8 40C8 30 20 26 32 26C44 26 56 30 56 40C56 50 44 54 32 54C20 54 8 50 8 40Z" fill="${b}" ${o}/>${[[20, 38], [30, 44], [40, 37], [46, 45], [26, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${a}" ${o}/>`).join('')}`,
    crumbs: (a, b) => `<path d="M12 44L20 22L36 18L46 30L40 46Z" fill="${a}" ${o}/><circle cx="26" cy="32" r="2.4" fill="${b}"/><circle cx="34" cy="28" r="2.4" fill="${b}"/>${[[50, 44], [46, 54], [54, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${a}" ${o}/>`).join('')}`,
    sprig: (a, b) => `${line('M14 54C24 42 34 28 50 12', b, 3)}${[[22, 40], [30, 30], [38, 22], [28, 46], [36, 36]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" transform="rotate(${i % 2 ? 30 : -30} ${x} ${y})" fill="${a}" ${o}/>`).join('')}`,
    onion: (a, b) => `${line('M32 22L28 8', b, 3.4)}${line('M32 22L38 8', b, 3.4)}<path d="M32 20C44 26 50 36 46 46C42 54 22 54 18 46C14 36 20 26 32 20Z" fill="${a}" ${o}/><path d="M26 34C27 40 30 45 34 47" ${hi}/>`,
    melon: (a, b) => `<path d="M8 28H56C56 44 45 56 32 56C19 56 8 44 8 28Z" fill="${b}" ${o}/><path d="M14 28H50C50 40 42 50 32 50C22 50 14 40 14 28Z" fill="${a}"/>${[[24, 36], [32, 40], [40, 36]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.8" fill="${INK}"/>`).join('')}`,
    berries: (a, b) => `${line('M32 22L40 8', b, 3)}${[[24, 30], [40, 30], [32, 40], [22, 44], [42, 44], [32, 52]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${a}" ${o}/>`).join('')}`,
    millet: (a, b) => `${line('M22 58C26 40 34 24 46 10', b, 3)}${[[30, 40], [34, 32], [38, 25], [42, 18], [26, 48]].map(([x, y]) => `<ellipse cx="${x + 6}" cy="${y}" rx="5" ry="3.4" fill="${a}" ${o}/><ellipse cx="${x - 5}" cy="${y + 3}" rx="5" ry="3.4" fill="${a}" ${o}/>`).join('')}`,
    steamegg: (a) => `<path d="M32 22C42 22 48 34 48 43C48 52 41 58 32 58C23 58 16 52 16 43C16 34 22 22 32 22Z" fill="${a}" ${o}/>${line('M24 16C21 12 27 9 24 4', '#9FC3C9', 2.6)}${line('M40 16C37 12 43 9 40 4', '#9FC3C9', 2.6)}<path d="M24 38C25 33 28 30 31 29" ${hi}/>`,
    bamboo: (a, b) => `<rect x="22" y="8" width="16" height="48" rx="5" fill="${a}" ${o}/><path d="M22 24H38M22 40H38" stroke="${INK}" stroke-width="3"/><path d="M38 20C46 16 52 18 56 22C50 26 44 26 38 24Z" fill="${b}" ${o}/>`,
    apple: (a, b) => `<path d="M32 22C38 16 52 18 52 34C52 48 42 58 34 56C32 55 32 55 30 56C22 58 12 48 12 34C12 18 26 16 32 22Z" fill="${a}" ${o}/>${line('M32 22L32 12', '#7A5A3A', 2.6)}<path d="M34 14C40 8 48 10 50 12C44 16 38 16 34 14Z" fill="${b}" ${o}/><path d="M20 30C21 26 24 24 27 24" ${hi}/>`,
    lily: (a, b) => `${[0, 72, 144, 216, 288].map(r => `<ellipse cx="32" cy="19" rx="7.5" ry="12" transform="rotate(${r} 32 34)" fill="${a}" ${o}/>`).join('')}<circle cx="32" cy="34" r="6" fill="${b}" ${o}/>`,
    peanut: (a, b) => `<path d="M24 10C33 10 36 20 34 26C33 30 38 34 40 38C44 46 40 56 30 56C20 56 17 47 20 41C22 37 20 32 18 28C14 20 17 10 24 10Z" fill="${a}" ${o}/><path d="M23 20L28 22M24 44L29 46M31 50L35 48" stroke="${b}" stroke-width="2.4" stroke-linecap="round"/>`,
    clam: (a, b) => `<path d="M8 44C8 26 20 14 32 14C44 14 56 26 56 44C48 50 16 50 8 44Z" fill="${a}" ${o}/><path d="M32 18V46M20 22L25 46M44 22L39 46M13 32L19 46M51 32L45 46" stroke="${b}" stroke-width="2.4" stroke-linecap="round"/><rect x="26" y="46" width="12" height="7" rx="2" fill="${a}" ${o}/>`,
    fish: (a, b) => `<path d="M8 32C16 20 34 17 46 25L57 17V47L46 39C34 47 16 44 8 32Z" fill="${a}" ${o}/><circle cx="20" cy="30" r="2.8" fill="${INK}"/><path d="M30 25C33 29 33 35 30 39M38 26C40 29 40 35 38 38" stroke="${b}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    heart: (a, b) => `<path d="M32 56C16 45 8 35 8 24C8 16 14 10 21 10C26 10 30 13 32 17C34 13 38 10 43 10C50 10 56 16 56 24C56 35 48 45 32 56Z" fill="${a}" ${o}/><path d="M32 22L35 29L42 30L37 35L38 42L32 38L26 42L27 35L22 30L29 29Z" fill="${b}" ${o}/>`,
    glass: (a, b) => `<path d="M20 14L42 10L54 30L44 52L20 54L10 34Z" fill="${a}" ${o} opacity=".95"/><path d="M20 24L30 20M16 34L22 32" ${hi}/><circle cx="38" cy="40" r="3" fill="${b}" opacity=".6"/>`,
    // gear, by category, filled with the tier colour
    trap: (a, b) => `<rect x="10" y="18" width="44" height="34" rx="4" fill="${a}" ${o}/><path d="M20 18V52M32 18V52M44 18V52" stroke="${b}" stroke-width="3"/><path d="M6 20L32 8L58 20" fill="none" ${o}/>`,
    bait: (a, b) => `<circle cx="32" cy="34" r="20" fill="${a}" ${o}/>${[[24, 28], [38, 26], [30, 40], [42, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.8" fill="${b}"/>`).join('')}<path d="M18 30C19 24 23 20 28 18" ${hi}/>`,
    lasso: (a) => `<ellipse cx="34" cy="26" rx="20" ry="13" fill="none" stroke="${INK}" stroke-width="9.6"/><ellipse cx="34" cy="26" rx="20" ry="13" fill="none" stroke="${a}" stroke-width="5"/>${line('M17 33C12 42 18 50 12 58', a, 5)}`,
    charm: (a, b) => `${line('M32 6V16', b, 2.6)}<circle cx="32" cy="36" r="18" fill="${a}" ${o}/><path d="M32 24L35.5 32.5L44 33.5L37.5 39L39.5 47L32 42.5L24.5 47L26.5 39L20 33.5L28.5 32.5Z" fill="${b}" ${o}/>`,
    // processed goods and world materials without a game icon
    board: (a, b) => `<path d="M8 26L44 14L56 22L20 36Z" fill="${a}" ${o}/><path d="M8 26V36L20 46V36Z M20 36V46L56 32V22Z" fill="${b}" ${o}/>`,
    spool: (a, b) => `<rect x="18" y="10" width="28" height="8" rx="2" fill="${b}" ${o}/><rect x="18" y="46" width="28" height="8" rx="2" fill="${b}" ${o}/><rect x="22" y="18" width="20" height="28" fill="${a}" ${o}/><path d="M22 26H42M22 34H42" stroke="${INK}" stroke-width="2"/>`,
    coil: (a) => `${line('M32 12C46 12 50 22 50 30C50 40 42 48 32 48C22 48 16 42 16 34C16 26 22 22 30 22C38 22 42 26 42 32C42 38 36 40 32 40', a, 5)}${line('M32 48L30 58', a, 5)}`,
    cloth: (a, b) => `<path d="M10 20H50L54 28H14Z" fill="${b}" ${o}/><path d="M10 20V48H50V20" fill="${a}" ${o}/><path d="M14 28V48M22 20V48" stroke="${b}" stroke-width="2.4"/>`,
    block: (a, b) => `<path d="M10 24L32 14L54 24L32 34Z" fill="${b}" ${o}/><path d="M10 24V44L32 54V34Z M32 34V54L54 44V24Z" fill="${a}" ${o}/>`,
    pot: (a) => `<path d="M20 12H44V18C52 24 54 34 50 44C46 54 18 54 14 44C10 34 12 24 20 18Z" fill="${a}" ${o}/><path d="M18 18H46" stroke="${INK}" stroke-width="3"/>`,
    jar: (a, b) => `<rect x="20" y="8" width="24" height="9" rx="2" fill="${b}" ${o}/><path d="M18 17H46L50 26V52C50 55 48 57 45 57H19C16 57 14 55 14 52V26Z" fill="#FFFDF6" ${o}/><path d="M17 32H47V52C47 54 46 55 44 55H20C18 55 17 54 17 52Z" fill="${a}"/>`,
    bolt: (a, b) => `<path d="M24 10H40L46 20L40 30H24L18 20Z" fill="${a}" ${o}/><rect x="27" y="30" width="10" height="26" fill="${b}" ${o}/><path d="M27 38H37M27 46H37" stroke="${INK}" stroke-width="2"/>`,
    lens: (a) => `<circle cx="28" cy="28" r="18" fill="${a}" ${o}/>${line('M41 41L55 55', '#8E7A5A', 5)}<path d="M18 24C19 19 23 15 28 14" ${hi}/>`,
    leaf: (a, b) => `<path d="M12 52C12 30 26 12 54 10C54 36 38 52 12 52Z" fill="${a}" ${o}/><path d="M16 48C26 36 36 26 48 16" stroke="${b}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    mushroom: (a, b) => `<path d="M8 32C8 18 20 10 32 10C44 10 56 18 56 32Z" fill="${a}" ${o}/><path d="M24 32H40V52C40 55 38 56 36 56H28C26 56 24 55 24 52Z" fill="${b}" ${o}/><circle cx="22" cy="22" r="3" fill="#FFFDF6"/><circle cx="38" cy="18" r="2.6" fill="#FFFDF6"/>`,
    stalks: (a, b) => `${[[22, 58, 18, 10], [32, 58, 32, 6], [42, 58, 46, 12]].map(([x1, y1, x2, y2]) => line(`M${x1} ${y1}L${x2} ${y2}`, a, 4)).join('')}<path d="M26 34L20 26M36 28L42 20M38 44L44 38" stroke="${b}" stroke-width="3" stroke-linecap="round"/>`,
    flower: (a, b) => `${line('M32 36L32 58', '#6E9A55', 3)}${[0, 60, 120, 180, 240, 300].map(r => `<ellipse cx="32" cy="16" rx="6" ry="9" transform="rotate(${r} 32 26)" fill="${a}" ${o}/>`).join('')}<circle cx="32" cy="26" r="6" fill="${b}" ${o}/>`,
    seeds: (a) => `${[[22, 26], [38, 22], [30, 38], [44, 40], [18, 44]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="8.5" transform="rotate(20 ${x} ${y})" fill="${a}" ${o}/>`).join('')}`,
    blob: (a) => `<path d="M32 8C40 20 50 28 50 40C50 50 42 57 32 57C22 57 14 50 14 40C14 28 24 20 32 8Z" fill="${a}" ${o}/><path d="M24 38C25 32 28 28 32 26" ${hi}/>`,
    rock: (a, b) => `<path d="M10 46L18 22L34 14L50 22L56 44L44 54H20Z" fill="${a}" ${o}/><path d="M18 22L30 34L50 22M30 34L32 54" stroke="${b}" stroke-width="2.6" fill="none"/>`,
    log: (a, b) => `<path d="M16 20H46C52 20 56 27 56 34C56 41 52 48 46 48H16Z" fill="${a}" ${o}/><ellipse cx="16" cy="34" rx="8.5" ry="14" fill="${b}" ${o}/><ellipse cx="16" cy="34" rx="3.6" ry="6" fill="none" stroke="${INK}" stroke-width="2"/><path d="M28 28H44M32 40H48" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>`,
    wedge: (a, b) => `<path d="M8 38L48 18L56 38Z" fill="${b}" ${o}/><path d="M8 38H56V50H8Z" fill="${a}" ${o}/><circle cx="20" cy="44" r="2.6" fill="#C9A02E"/><circle cx="36" cy="45" r="2" fill="#C9A02E"/><circle cx="40" cy="30" r="3" fill="#E0B64E"/>`,
    egg: (a) => `<path d="M32 9C42 9 50 25 50 38C50 50 42 57 32 57C22 57 14 50 14 38C14 25 22 9 32 9Z" fill="${a}" ${o}/><path d="M22 34C23 26 26 20 30 17" ${hi}/>`,
    basket: (a, b) => `${line('M18 30C18 12 46 12 46 30', b, 3.4)}<path d="M9 30H55L48 55H16Z" fill="${a}" ${o}/><path d="M13 40H51M15 48H49M24 30L26 55M32 30V55M40 30L38 55" stroke="${b}" stroke-width="2.4"/>`,
    lump: (a, b) => `<path d="M12 42C8 32 16 20 28 20C32 12 46 14 48 24C56 26 58 38 52 44C48 54 20 56 12 42Z" fill="${a}" ${o}/><circle cx="26" cy="34" r="2.6" fill="${b}"/><circle cx="40" cy="38" r="2.2" fill="${b}"/>`,
  };

  // item id -> [template, colour a, colour b, extra]
  const MAP = {
    // signature drops
    'clover-bundle': ['clover', '#7FAF63', '#4E7A3A'], 'pheasant-feather': ['feather', '#C07A3E', '#6B3F1E'],
    'russet-tuft': ['tuft', '#C0672F', '#F2D8BE'], 'acorn-cache': ['acorn', '#B98545', '#7A5A3A', true],
    'wool-tuft': ['down', '#EEE6D4', '#C9BBA0'], 'shed-scute': ['scale', '#C9AA84', '#8C6E4E'],
    'smooth-pebble': ['pebble', '#9AA5A8', '#6E7A7D'], 'duckweed-clump': ['dots', '#8CBF5A', '#9FC3C9'],
    'ermine-tuft': ['tuft', '#9A6A42', '#F3E8D2'], 'frost-tuft': ['tuft', '#F4F6F8', '#B7C6D2'],
    'pilfered-crumbs': ['crumbs', '#D9A864', '#8C5A2E'], 'shiny-trinket': ['trinket', '#D8B44A', '#8FC6D9'],
    'gull-feather': ['feather', '#E9ECEF', '#8995A0'], 'eucalyptus-sprig': ['sprig', '#9CB8A6', '#6E8A6A'],
    'shed-quill': ['quill', '#E7D8B6', '#3C3A34'], 'wild-onion': ['onion', '#E9D6DA', '#6E9A55'],
    'mountain-down': ['down', '#E3DACB', '#B3A48A'], 'sun-warmed-stone': ['pebble', '#D69A5C', '#9E6534'],
    'wild-melon': ['melon', '#E97F6E', '#7FAF63'], 'mossy-scute': ['scale', '#7A9A5E', '#4E6A3A'],
    'heron-plume': ['feather', '#A9B6C2', '#5F6E7C'], 'antler-tine': ['antler', '#CFAE84'],
    'night-down': ['down', '#6F6C8C', '#A7A4C4'],
    'berry-stash': ['berries', '#C4485A', '#6E9A55'], 'shifting-scale': ['scale', '#7DBB8E', '#3E8A9E'],
    'golden-millet': ['millet', '#E0B64E', '#9E8A4A'], 'desert-rose': ['rose', '#D9A07E', '#B06E4E'],
    'pink-plume': ['feather', '#EFA2B6', '#B35D78'], 'lynx-whisker': ['whisker', '#F2EEE4'],
    'hot-spring-egg': ['steamegg', '#F3E6C8'], 'sea-glass': ['glass', '#A7D8C8', '#4E9A86'],
    'sweet-bamboo': ['bamboo', '#9CC46A', '#6E9A55'], 'windfall-apple': ['apple', '#D9503E', '#7FAF63'],
    'snowcloud-tuft': ['tuft', '#E3E6EA', '#8A94A0'], 'dragon-scale': ['scale', '#9C8A52', '#5E5230'],
    'iceberg-shard': ['crystal', '#C4E6F4', '#7FB3CC'], 'river-lily': ['lily', '#F4E4EC', '#E0B64E'],
    'moonstripe-tuft': ['tuft', '#EEEAF4', '#3C3A4A'], 'mammoth-wool': ['down', '#8A5E3A', '#C49A6E'],
    'trunkful-peanuts': ['peanut', '#D9B27E', '#9E7A4E'], 'river-pearl': ['pearl', '#F4EFE6', '#C9BBA0'],
    'seafloor-clam': ['clam', '#C9A6B8', '#8E6A7C'],
    fish: ['fish', '#8FB3CE', '#4E7A9A'], wool: ['down', '#F4EFE3', '#C9BBA0'],
    'bighorn-tuft': ['tuft', '#C9B08A', '#F3E8D2'], 'eye-feather': ['feather', '#3E8A9E', '#E0B64E'],
    'sunlit-feather': ['feather', '#E0B64E', '#8A5E1E'],
    // rare drops
    'four-leaf-clover': ['clover', '#5FAF5A', '#3E7A36', 4], 'silver-acorn': ['acorn', '#C8CED4', '#8A949E'],
    'moon-pearl': ['pearl', '#E7E4F4', '#8E86C4'], 'aurora-shard': ['crystal', '#9FE0C8', '#B48AD9'],
    'starheart': ['heart', '#E9A0B0', '#F2CF5A'],
    // processed goods
    plank: ['board', '#D9B07A', '#B98A54'], twine: ['spool', '#D9C79A', '#9E7A4E'], rope: ['coil', '#C9A56E'],
    linen: ['cloth', '#EEE8D8', '#C9BBA0'], brick: ['block', '#C4674E', '#E08A70'], 'clay-pot': ['pot', '#C98A5E'],
    glass: ['glass', '#CDE7EE', '#7FB3CC'], sugar: ['block', '#F4F1EA', '#FFFFFF'], butter: ['block', '#F2D680', '#F8E6A4'],
    'berry-syrup': ['jar', '#B33A4E', '#9E7A4E'], nectar: ['jar', '#E8B84A', '#9E7A4E'],
    'iron-fitting': ['bolt', '#8E969C', '#6E767C'], 'copper-wire': ['coil', '#C8743E'], 'crystal-lens': ['lens', '#D6EEF4'],
    'herbal-infusion': ['jar', '#8CB86A', '#9E7A4E'], 'glow-paste': ['jar', '#B6E27A', '#6E9A55'], 'moon-ink': ['jar', '#4E4A7C', '#9E7A4E'],
    // world materials without a game icon
    'clover-leaf': ['clover', '#8CBF6A', '#5E8A45'], 'button-mushroom': ['mushroom', '#EDE3D2', '#F6F0E4'],
    'reed-fiber': ['stalks', '#B9A56A', '#8A9A5E'], sunseed: ['seeds', '#6E6048'], 'supple-vine': ['sprig', '#7FA85A', '#5E7A3A'],
    chamomile: ['flower', '#FFFDF6', '#E8C24A'], flax: ['stalks', '#C9B88A', '#7E9ACC'], sugarcane: ['stalks', '#B8C87A', '#7E9A4A'],
    porcini: ['mushroom', '#9A6A3E', '#EEDDC0'], 'amber-resin': ['blob', '#E0A040'], 'golden-pollen': ['seeds', '#EEC84E'],
    glowmoss: ['dots', '#B6E27A', '#6E9A55'], 'forest-truffle': ['lump', '#5E4A3E', '#8E7A6A'], mooncap: ['mushroom', '#7C76B4', '#E4E0F4'],
    'star-petal': ['flower', '#F4E4A4', '#E8A04A'], 'clay-lump': ['lump', '#C98A5E', '#9E6A44'], sandstone: ['rock', '#E0C08E', '#B39A6A'],
    'copper-ore': ['rock', '#9E7A64', '#C8743E'], quartz: ['crystal', '#EEF2F4', '#B8C8D0'], 'iron-ore': ['rock', '#8A8A88', '#B35A3E'],
    coal: ['lump', '#4A4A48', '#6E6E6A'],
    // version 3 materials and goods
    hardwood: ['log', '#8A5E36', '#D9B07A'], hazelnut: ['acorn', '#A8743E', '#8AAE5A', true],
    mushroom: ['mushroom', '#C9A27A', '#F1E6D2'], 'tree-resin': ['blob', '#E0A040'], truffle: ['lump', '#5E4A3E', '#8E7A6A'],
    glowcap: ['mushroom', '#9ED66A', '#E8F4D0'], clay: ['lump', '#C98A5E', '#9E6A44'], 'goat-milk': ['jar', '#FBF8F0', '#9E7A4E'],
    reeds: ['stalks', '#B9A56A', '#8A9A5E'], 'wild-mint': ['sprig', '#6FBF8A', '#4E8A5E'], 'cotton-grass': ['down', '#FBF8F0', '#B8B09A'],
    'duck-egg': ['egg', '#CFE3DA'], 'wisp-lily': ['lily', '#D8F0F4', '#9FE0C8'], ice: ['crystal', '#D6EEF7', '#9CC8DC'],
    winterberries: ['berries', '#C43A3A', '#5E7A4A'], 'snow-lichen': ['sprig', '#D6DCC8', '#9AA58A'], 'yak-milk': ['jar', '#F2E6CC', '#7A5A3A'],
    frostbloom: ['flower', '#CFE6F7', '#7FB3E0'], 'sunflower-seeds': ['seeds', '#4A4038'],
    beam: ['board', '#A9784A', '#8A5E36'], 'reed-basket': ['basket', '#D9C08A', '#9E8A5A'], felt: ['cloth', '#D8CFC0', '#B3A690'],
    cheese: ['wedge', '#F2C94E', '#F8E08A'], 'yak-cream': ['jar', '#FBF3DC', '#9E7A4E'], 'herbal-tonic': ['jar', '#8CB86A', '#9E7A4E'],
    bandage: ['spool', '#FFFDF6', '#C9BBA0'], 'frost-essence': ['jar', '#9CD4EE', '#9E7A4E'], 'lichen-salve': ['jar', '#C9D1B8', '#9E7A4E'],
    mortar: ['block', '#D8D2C4', '#EEEAE0'], 'opal-shard': ['crystal', '#E6ECF4', '#E3A2C8'], thunderstone: ['crystal', '#6E7AA4', '#F2CF5A'],
  };

  // Traps and bait, each its own shape. A trap stands on its habitat's ground and a bait sits on a dish,
  // so each kind keeps one family look; the tier colour stays on the trap's body and on the bait's dish.
  const CREAM = '#FFFDF6', WOOD = '#B98A54';
  const thin = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  const crescent = (cx, cy, r, fill, edge = o) => `<path d="M${cx} ${cy - r}A${r} ${r} 0 1 0 ${cx} ${cy + r}A${r * .6} ${r} 0 1 1 ${cx} ${cy - r}Z" fill="${fill}" ${edge}/>`;
  const star = (cx, cy, r, fill, edge = thin) => `<path d="M${[...Array(10)].map((_, i) => { const q = -Math.PI / 2 + i * Math.PI / 5, s = i % 2 ? r * .45 : r; return `${(cx + s * Math.cos(q)).toFixed(1)} ${(cy + s * Math.sin(q)).toFixed(1)}`; }).join('L')}Z" fill="${fill}" ${edge}/>`;
  const GROUND = {
    land: `<ellipse cx="32" cy="54" rx="27" ry="6" fill="#A7C47A" ${o}/>`,
    shore: `<ellipse cx="32" cy="54" rx="27" ry="6" fill="#E6CF98" ${o}/><circle cx="14" cy="55" r="1.6" fill="${INK}" opacity=".45"/><circle cx="50" cy="56" r="1.6" fill="${INK}" opacity=".45"/>`,
    water: `<path d="M4 50C9 46 14 46 19 50C24 54 29 54 34 50C39 46 44 46 49 50C53 53 57 53 60 51V59H4Z" fill="#8EC3D6" ${o}/><path d="M12 55C15 54 18 54 21 55M40 55C43 54 46 54 49 55" stroke="${CREAM}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`,
  };
  const raft = a => `<rect x="8" y="38" width="48" height="9" rx="3" fill="${a}" ${o}/><path d="M20 38V47M32 38V47M44 38V47" stroke="${INK}" stroke-width="2"/>`;
  const stake = (x, top, a) => `<path d="M${x} 53V${top + 6}L${x + 3.5} ${top}L${x + 7} ${top + 6}V53Z" fill="${a}" ${o}/>`;
  const TRAPS = {
    'timber-crate': a => `<circle cx="40" cy="48" r="3.4" fill="#E8B86E" ${thin}/><g transform="rotate(-20 15 51)"><rect x="15" y="23" width="36" height="28" rx="2" fill="${a}" ${o}/><path d="M27 23V51M39 23V51" stroke="${INK}" stroke-width="2"/><rect x="19" y="27" width="28" height="20" fill="none" stroke="${CREAM}" stroke-width="2" opacity=".55"/><path d="M19 47L47 27" stroke="${CREAM}" stroke-width="2.6" opacity=".75"/></g>${line('M46 54L48.8 39.5', WOOD, 2.6)}`,
    'reed-hide': a => `${line('M30 18L22.5 7', '#C9B06A', 2.6)}${line('M32 18V5.5', '#C9B06A', 2.6)}${line('M34 18L41.5 7', '#C9B06A', 2.6)}<path d="M12 52L27 17H37L52 52Z" fill="${a}" ${o}/><path d="M20 52L29 19M27.5 52L31 19M36.5 52L33 19M44 52L35 19" stroke="${CREAM}" stroke-width="2" opacity=".55"/><path d="M25 52L32 36L39 52Z" fill="${INK}"/><rect x="25.5" y="15" width="13" height="6" rx="2" fill="${WOOD}" ${thin}/>`,
    'drift-basket': a => `<path d="M14 20L52 29C57 30 57 38 52 39L14 48Z" fill="${a}" ${o}/><path d="M25 23V45.5M35 25.5V43M45 27.5V41M16 34H55" stroke="${CREAM}" stroke-width="2.2" opacity=".6"/><ellipse cx="14" cy="34" rx="6" ry="14" fill="${a}" ${o}/><ellipse cx="14" cy="34" rx="2.6" ry="8" fill="${INK}"/>`,
    'padded-den': a => `<path d="M10 52C10 28 20 14 32 14C44 14 54 28 54 52Z" fill="${a}" ${o}/><path d="M15 38C22 31 42 31 49 38" stroke="${CREAM}" stroke-width="2.2" fill="none" opacity=".55"/>${[[22, 25], [32, 21], [42, 25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${CREAM}" opacity=".8"/>`).join('')}<path d="M21 52V42C21 33 43 33 43 42V52Z" fill="${INK}"/><rect x="18" y="45" width="28" height="8" rx="4" fill="#F2C9C0" ${o}/>`,
    'tide-bell': a => `<circle cx="32" cy="9" r="4" fill="none" stroke="${INK}" stroke-width="6.4"/><circle cx="32" cy="9" r="4" fill="none" stroke="${WOOD}" stroke-width="3"/><path d="M17 48C18 42 18 36 18 29C18 19 24 13 32 13C40 13 46 19 46 29C46 36 46 42 47 48Z" fill="${a}" ${o}/><path d="M24 21C22 27 22 36 22 44M40 21C42 27 42 36 42 44" stroke="${CREAM}" stroke-width="2.2" opacity=".55" fill="none"/><path d="M25 27C27 25 29 25 31 27C33 29 35 29 37 27" stroke="${CREAM}" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="11" y="45" width="42" height="7" rx="3.5" fill="${a}" ${o}/><path d="M27 45V38C27 33 37 33 37 38V45Z" fill="${INK}"/>`,
    'floating-trap': a => `${line('M24 15C24 6 40 6 40 15', WOOD, 2.6)}<rect x="15" y="14" width="34" height="26" rx="3" fill="${a}" ${o}/><path d="M23.5 17V37M32 17V37M40.5 17V37" stroke="${CREAM}" stroke-width="2.6" opacity=".7"/><ellipse cx="18" cy="44" rx="10" ry="6" fill="#E58E5A" ${o}/><ellipse cx="46" cy="44" rx="10" ry="6" fill="#E58E5A" ${o}/><path d="M18 38.6V49.4M46 38.6V49.4" stroke="${CREAM}" stroke-width="3"/>`,
    'reinforced-trap': a => `<rect x="10" y="17" width="44" height="35" rx="3" fill="${a}" ${o}/><rect x="10" y="20" width="44" height="6" fill="#A3ABB0" ${o}/><rect x="10" y="43" width="44" height="6" fill="#A3ABB0" ${o}/>${[15, 32, 49].map(x => `<circle cx="${x}" cy="23" r="1.6" fill="${INK}"/><circle cx="${x}" cy="46" r="1.6" fill="${INK}"/>`).join('')}<rect x="21" y="29" width="22" height="11" rx="1.5" fill="${INK}"/><path d="M26.5 29.5V39.5M32 29.5V39.5M37.5 29.5V39.5" stroke="#A3ABB0" stroke-width="2.4"/>`,
    'frost-weir': a => `${[[9, 19], [18, 13], [27, 20], [36, 15], [45, 21]].map(([x, t]) => stake(x, t, a)).join('')}<rect x="6" y="31" width="52" height="6" rx="3" fill="#D6EEF7" ${o}/>${[15, 26, 37, 48].map(x => `<path d="M${x - 2} 37L${x} 44L${x + 2} 37Z" fill="#EAF6FB" ${thin}/>`).join('')}${line('M52 3V15M46.8 6L57.2 12M46.8 12L57.2 6', '#D6EEF7', 2.2)}`,
    'lantern-raft': a => `${line('M46 39V11', WOOD, 3)}${line('M46 12H32', WOOD, 3)}${line('M32 12V18', WOOD, 2)}<path d="M26 20H38L37 34H27Z" fill="#F2CF5A" ${o}/><path d="M32 23C34.5 26 34.5 29 32 31C29.5 29 29.5 26 32 23Z" fill="#E08A3A"/><path d="M24.5 21L32 16L39.5 21Z" fill="${a}" ${o}/><rect x="25.5" y="33" width="13" height="4" rx="1" fill="${a}" ${o}/>${raft(a)}`,
    'storm-cage': a => `<circle cx="32" cy="7" r="3" fill="none" stroke="${INK}" stroke-width="2.6"/><path d="M14 48V30C14 19 22 10 32 10C42 10 50 19 50 30V48" fill="#EEF2F4" stroke="${INK}" stroke-width="9.6" stroke-linejoin="round"/><path d="M14 48V30C14 19 22 10 32 10C42 10 50 19 50 30V48" fill="none" stroke="${a}" stroke-width="5" stroke-linejoin="round"/><path d="M23 46V15M41 46V15" stroke="${a}" stroke-width="3"/><path d="M35 15L24 32H31L27 45L40 27H33L37 15Z" fill="#F2CF5A" ${o}/><rect x="9" y="45" width="46" height="7" rx="2" fill="${a}" ${o}/>`,
    'moon-weir': a => `${[[10, 28], [19, 21], [28, 17], [37, 21], [46, 28]].map(([x, t]) => stake(x, t, a)).join('')}${line('M8 40C20 35 44 35 56 40', '#E4E0F4', 3.4)}${crescent(20, 12, 8, '#F2E6A4')}${star(46, 10, 4.5, '#F2E6A4')}`,
    'sun-raft': a => `${line('M40 40V7', WOOD, 3)}<path d="M41 7L51 10L41 13Z" fill="${a}" ${o}/><path d="M38 10V35H14C18 25 26 16 38 10Z" fill="${CREAM}" ${o}/>${[0, 45, 90, 135, 180, 225, 270, 315].map(d => { const q = d * Math.PI / 180; return `<path d="M${(29 + 7.5 * Math.cos(q)).toFixed(1)} ${(26 + 7.5 * Math.sin(q)).toFixed(1)}L${(29 + 10 * Math.cos(q)).toFixed(1)} ${(26 + 10 * Math.sin(q)).toFixed(1)}" stroke="#E0A040" stroke-width="2" stroke-linecap="round"/>`; }).join('')}<circle cx="29" cy="26" r="5.5" fill="#F2CF5A" ${thin}/>${raft(a)}`,
  };
  const CRUST = '#E3AE62', CRUST_LIGHT = '#F1CF8E', CRUST_DARK = '#C98A4A';
  const dish = a => `<ellipse cx="32" cy="51" rx="27" ry="7.5" fill="${a}" ${o}/><ellipse cx="32" cy="50" rx="19" ry="4" fill="none" stroke="${CREAM}" stroke-width="1.8" opacity=".5"/>`;
  const tin = (top, fill = CRUST_DARK) => `<path d="M11 ${top}L15 49H49L53 ${top}Z" fill="${fill}" ${o}/><path d="M19 ${top + 2}L21 48M27 ${top + 2}L28 48M37 ${top + 2}L36 48M45 ${top + 2}L43 48" stroke="${INK}" stroke-width="1.8" opacity=".45"/>`;
  const BAITS = {
    'milk-bun': () => `<path d="M12 48C12 32 21 22 32 22C43 22 52 32 52 48C52 50 12 50 12 48Z" fill="#E9C48A" ${o}/><path d="M16 36C19 27 26 23 32 23C38 23 45 27 48 36C45 38 43 34 40 37C37 40 35 34 32 37C29 40 27 34 24 37C21 39 19 35 16 36Z" fill="${CREAM}" ${thin}/>`,
    'egg-pie': () => `${tin(38)}<ellipse cx="32" cy="37" rx="22" ry="8" fill="${CRUST_LIGHT}" ${o}/><path d="M22 36C22 31 28 30 32 31C37 29 43 32 42 36C42 40 36 41 32 40C27 41 22 40 22 36Z" fill="${CREAM}" ${thin}/><ellipse cx="32" cy="35.5" rx="5" ry="3.6" fill="#F2B233" ${thin}/>`,
    'fish-cake': () => `<path d="M12 34V42C12 47 52 47 52 42V34Z" fill="${CRUST_DARK}" ${o}/><ellipse cx="32" cy="34" rx="20" ry="8" fill="#E8B86E" ${o}/><path d="M21 34C24 30 32 30 37 33L43 29.5V38.5L37 35C32 38 24 38 21 34Z" fill="#8FB3CE" ${thin}/><circle cx="25" cy="33.4" r="1.3" fill="${INK}"/>`,
    'clover-cake': () => `<path d="M13 30V46C13 50 51 50 51 46V30Z" fill="#DDEBC0" ${o}/><path d="M13 39C13 42 51 42 51 39" stroke="#7FAF63" stroke-width="3" fill="none"/><ellipse cx="32" cy="30" rx="19" ry="5.5" fill="#F4F8EA" ${o}/>${line('M32 24L34 30', '#4E7A3A', 1.8)}${[[27.5, 21], [36.5, 21], [32, 14.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="#6FA85A" ${thin}/>`).join('')}`,
    'hazelnut-cookie': () => `<path d="M12 36V41C12 46 52 46 52 41V36Z" fill="#B87A3E" ${o}/><ellipse cx="32" cy="36" rx="20" ry="9" fill="#D9A864" ${o}/>${[[22, 36], [40, 38], [30, 41], [44, 34]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.7" fill="#7A4E2A"/>`).join('')}<circle cx="32" cy="27" r="7" fill="#A8743E" ${o}/><path d="M26 24.5C28 20.5 36 20.5 38 24.5C35 26 29 26 26 24.5Z" fill="#E3C99A" ${thin}/>`,
    'egg-pocket': () => `<path d="M10 46C10 28 20 20 32 20C44 20 54 28 54 46Z" fill="${CRUST}" ${o}/><path d="M16 46C16 32 24 26 32 26C40 26 48 32 48 46Z" fill="${CRUST_LIGHT}"/>${[160, 138, 116, 94, 72, 50, 28].map(d => { const q = d * Math.PI / 180; return `<path d="M${(32 + 21.5 * Math.cos(q)).toFixed(1)} ${(46 - 25.5 * Math.sin(q)).toFixed(1)}L${(32 + 16.5 * Math.cos(q)).toFixed(1)} ${(46 - 20 * Math.sin(q)).toFixed(1)}" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`; }).join('')}<path d="M25 40L29 34M35 40L39 34" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="32" cy="42" rx="3.4" ry="2.2" fill="#F2B233" ${thin}/>`,
    'pond-pie': () => `${tin(40)}<ellipse cx="32" cy="39" rx="22" ry="8" fill="${CRUST}" ${o}/>${[[21, -22], [32, 0], [43, 22]].map(([x, r]) => `<g transform="rotate(${r} ${x} 39)"><ellipse cx="${x}" cy="39" rx="5.4" ry="2" fill="${INK}"/><path d="M${x - 4.6} 39C${x - 5} 32 ${x - 3} 25 ${x} 21C${x + 3} 25 ${x + 5} 32 ${x + 4.6} 39Z" fill="#A9C3D6" ${thin}/><path d="M${x - 3.8} 32C${x - 1.2} 34 ${x + 1.2} 34 ${x + 3.8} 32" stroke="${INK}" stroke-width="1.6" fill="none"/><circle cx="${x - 1.2}" cy="27.5" r="1.5" fill="${INK}"/><path d="M${x - 1.8} 21.8L${x} 24.2L${x + 1.8} 21.8" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linejoin="round"/></g>`).join('')}`,
    'sunseed-wafer': () => [0, -9].map((dy, i) => `<g transform="translate(0 ${dy})"><path d="M12 40V44L26 51V47Z" fill="#C9A25E" ${o}/><path d="M26 47V51L54 44V40Z" fill="#D9B274" ${o}/><path d="M12 40L40 33L54 40L26 47Z" fill="#E8C98A" ${o}/>${i ? '<path d="M22 37.5L36 44.2M31 35.3L45 42" stroke="#C9A25E" stroke-width="1.8"/>' : ''}</g>`).join('') + [[28, 32], [37, 30], [41, 36]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="2.8" ry="4.6" transform="rotate(${[-30, 20, 60][i]} ${x} ${y})" fill="#4A4038" ${thin}/><path d="M${x} ${y - 2.6}V${y + 2.6}" transform="rotate(${[-30, 20, 60][i]} ${x} ${y})" stroke="${CREAM}" stroke-width="1.2" opacity=".7"/>`).join(''),
    'berry-tart': () => `${tin(38, CRUST)}<ellipse cx="32" cy="38" rx="22" ry="7" fill="${CRUST_LIGHT}" ${o}/><ellipse cx="32" cy="37.5" rx="17" ry="4.6" fill="#8E2E3E"/>${[[23, 35], [32, 36], [41, 35], [27, 29], [37, 29], [32, 23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#C4485A" ${thin}/>`).join('')}<path d="M36 19C40 14 46 14 48 16C44 20 40 20 36 19Z" fill="#7FAF63" ${thin}/>`,
    'cheese-pie': () => `<path d="M10 38L54 36V46L10 48Z" fill="#F4D873" ${o}/><path d="M10 44.5L54 42.5V46L10 48Z" fill="${CRUST}" ${thin}/><path d="M10 38L42 24C48 26 52 30 54 36Z" fill="#F2C94E" ${o}/>${line('M42 24C48 26 52 30 54 36', CRUST, 4)}${[[30, 32, 2.6], [40, 30, 2], [22, 36, 1.8], [36, 40, 2], [22, 41.6, 1.6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .75}" fill="#D9A830"/>`).join('')}`,
    'riverside-roll': () => `<path d="M10 40C10 47 54 47 54 40L50 36H14Z" fill="${CRUST}" ${o}/><path d="M14 37C18 39 22 35 26 38C30 40 34 36 38 39C42 40 46 36 50 38" stroke="#7FAF63" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M6 35C12 29 36 28 46 33L58 27V41L46 36C36 40 12 40 6 35Z" fill="#8FB3CE" ${thin}/><circle cx="10" cy="33.6" r="1.3" fill="${INK}"/><path d="M13 34C13 22 51 22 51 34C43 36 21 36 13 34Z" fill="#E9C48A" ${o}/>${[[24, 28], [32, 26], [40, 28]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="1" fill="${CREAM}"/>`).join('')}`,
    'glow-crumb': () => `<path d="M13 47L17 37L27 35L31 43L25 49Z" fill="#C7E88E" ${o}/><path d="M29 46L33 31L45 29L49 41L41 48Z" fill="#B6E27A" ${o}/><path d="M21 35L27 23L37 25L35 35L25 39Z" fill="#D5EFA6" ${o}/>${[[25, 43], [39, 38], [29, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#6E9A55"/>`).join('')}<circle cx="52" cy="46" r="2.6" fill="#C7E88E" ${thin}/>${star(47, 16, 6, CREAM)}${star(15, 24, 4, CREAM)}`,
    'star-petal-cake': () => `<path d="M12 38V46C12 50 52 50 52 46V38Z" fill="#F4E4EC" ${o}/><ellipse cx="32" cy="38" rx="20" ry="5" fill="#FBF3F6" ${o}/><path d="M19 27V34C19 38 45 38 45 34V27Z" fill="#F4E4EC" ${o}/><ellipse cx="32" cy="27" rx="13" ry="4" fill="#FBF3F6" ${o}/><path d="M13 44C20 47 44 47 51 44M20 33C25 35 39 35 44 33" stroke="#E9A0B0" stroke-width="2.4" fill="none"/>${star(32, 17, 8.5, '#F4E4A4')}<circle cx="32" cy="17.6" r="2.2" fill="#E8A04A"/>`,
    'smoked-cheese-pie': () => `${line('M24 25C20 21 28 17 24 11', '#B8B4AA', 2.6)}${line('M38 25C34 20 42 16 38 9', '#B8B4AA', 2.6)}<path d="M10 36H54V46C54 48 52 49 50 49H14C12 49 10 48 10 46Z" fill="#E8DCC6" ${o}/><path d="M10 36L16 28H48L54 36Z" fill="#C9803E" ${o}/><path d="M22 32H30M34 32H42" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M17 36V40.5C17 42.5 21 42.5 21 40.5V36ZM37 36V39.5C37 41.5 40.5 41.5 40.5 39.5V36Z" fill="#F2C94E" ${thin}/>`,
    'fishers-chowder': () => `${line('M41 32L53 12', '#B8B4AA', 3)}${line('M24 26C21 22 27 18 24 13', '#B8C8D0', 2.4)}${line('M33 25C30 21 36 17 33 12', '#B8C8D0', 2.4)}<path d="M10 34C10 44 20 50 32 50C44 50 54 44 54 34Z" fill="${WOOD}" ${o}/><path d="M14 42C22 45 42 45 50 42" stroke="${CREAM}" stroke-width="2.2" fill="none" opacity=".6"/><ellipse cx="32" cy="34" rx="22" ry="6" fill="#F2E6C8" ${o}/>${[[22, 34, '#E08A3A'], [30, 36, '#7FAF63'], [38, 33, '#E08A3A'], [44, 35, '#7FAF63']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${c}"/>`).join('')}`,
    'frostbloom-wafer': () => `<path d="M12 38V43C12 47 52 47 52 43V38Z" fill="#D9B274" ${o}/><ellipse cx="32" cy="38" rx="20" ry="8" fill="#E8C98A" ${o}/><path d="M18 36L24 42M24 33L34 43.5M34 32L44 42M42 33L47 38M46 36L40 42M40 32.5L30 43.5M30 32L20 42" stroke="#C9A25E" stroke-width="1.6"/>${[0, 72, 144, 216, 288].map(r => `<ellipse cx="32" cy="22" rx="4.6" ry="7" transform="rotate(${r} 32 29)" fill="#CFE6F7" ${thin}/>`).join('')}<circle cx="32" cy="29" r="3.6" fill="#7FB3E0" ${thin}/>`,
    'star-bonbon': () => `<path d="M21 36L8 27L11 36L8 45Z" fill="#F2CF5A" ${o}/><path d="M43 36L56 27L53 36L56 45Z" fill="#F2CF5A" ${o}/><ellipse cx="32" cy="36" rx="14" ry="11" fill="#E9A0B0" ${o}/>${star(32, 36.5, 6.5, '#F2CF5A')}`,
    'dusk-pie': () => `${tin(40, '#B87A3E')}<path d="M12 40C12 24 22 16 32 16C42 16 52 24 52 40C52 43 12 43 12 40Z" fill="#D9985A" ${o}/><path d="M14 40C18 43 22 43 26 40.5C30 43 34 43 38 40.5C42 43 46 43 50 40" stroke="${INK}" stroke-width="2" fill="none" opacity=".5"/>${crescent(30, 28, 5.5, INK, '')}${star(42, 26, 3, INK, '')}${star(21, 32, 2.4, INK, '')}`,
    'lily-fish-pie': () => `<path d="M8 38C14 27 32 25 42 33L55 25V49L42 41C32 49 14 49 8 38Z" fill="${CRUST}" ${o}/><path d="M24 34C26 37 26 41 24 44M30 32C32 36 32 41 30 45M36 33C38 36 38 41 36 44" stroke="${CRUST_DARK}" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="16" cy="36" r="2.4" fill="${INK}"/>${[0, 72, 144, 216, 288].map(r => `<ellipse cx="42" cy="15" rx="3.8" ry="6" transform="rotate(${r} 42 21)" fill="${CREAM}" ${thin}/>`).join('')}<circle cx="42" cy="21" r="2.8" fill="#E0B64E" ${thin}/>`,
  };

  const TIER = { 1: '#6F7F64', 2: '#4A7F47', 3: '#2F6690', 4: '#6A4D96', 5: '#A87520', 6: '#A87520' };
  const PNG = { softwood: 'wood', wheat: 'wheat', blackberry: 'blackberry', stone: 'stone', egg: 'egg', milk: 'milk', water: 'water', energy: 'energy', flour: 'flour', biscuit: 'biscuit', 'wooden-trap': 'trap', 'berry-tonic': 'care', 'wild-herb': 'herb' };

  function svg(item) {
    if (PNG[item.id]) return `<img class="ic" src="assets/icons/${PNG[item.id]}.png" alt="">`;
    const tier = TIER[item.tier] || INK;
    if (item.kind === 'trap' && TRAPS[item.id]) {
      const ground = GROUND[item.habitat] || GROUND.land;
      return `<svg class="ic" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${item.habitat === 'water' ? TRAPS[item.id](tier) + ground : ground + TRAPS[item.id](tier)}</svg>`;
    }
    if (item.kind === 'bait' && BAITS[item.id]) return `<svg class="ic" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${dish(tier)}${BAITS[item.id]()}</svg>`;
    let spec = MAP[item.id];
    if (!spec && ['trap', 'bait', 'lasso', 'charm'].includes(item.kind)) spec = [item.kind, TIER[item.tier] || INK, '#FFFDF6'];
    if (!spec) spec = ['lump', '#C9BBA0', '#9E8A6A'];
    const [t, a, b, extra] = spec;
    return `<svg class="ic" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${T[t](a, b, extra)}</svg>`;
  }
  window.LadderIcons = { svg, TIER };
})();
