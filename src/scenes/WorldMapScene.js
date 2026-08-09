import Phaser from 'phaser';
import { LOCATIONS } from '../data/locationData.js';
import { createButton } from '../ui/Button.js';
import { addStatusBar, drawFlagMarker } from '../ui/fishIcon.js';
import GameState from '../systems/GameState.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { heading, subheading } from '../ui/textStyle.js';

// Flat water everywhere, same as it's always been, except a small deep abyss
// patch tucked into the bottom-left corner. A click's water/sky color always
// matches what that spot looks like once the player actually travels there,
// since both the map and the travel color read the same isDeepZone check.
const BRIGHT_WATER = LOCATIONS[0].waterColor;
const DEEP_WATER = LOCATIONS[3].waterColor;
const BRIGHT_SKY = LOCATIONS[0].skyColor;
const DEEP_SKY = LOCATIONS[3].skyColor;

// Base radius of the deep-abyss patch, measured from the bottom-left corner
// (0, DESIGN_HEIGHT) - small and tucked into the corner, not spreading
// across the map.
const DEEP_RADIUS = 170;

// Width of the soft feathered edge drawn around the patch (see the ocean
// rendering below) - a short blend right at the boundary only, not a
// gradient across the whole screen.
const DEEP_FADE_WIDTH = 46;

// The patch's edge isn't a perfect circle - its radius wobbles with the
// angle from the corner (two overlaid sine waves at different frequencies,
// same trick as the sea's wavy top edge) so the boundary reads as an uneven,
// natural coastline instead of a drafting-compass arc.
function abyssRadius(theta) {
  return DEEP_RADIUS + 22 * Math.sin(theta * 6) + 12 * Math.sin(theta * 11 + 1.7);
}

function isDeepZone(x, y) {
  const dx = x;
  const dy = y - DESIGN_HEIGHT;
  const theta = Math.atan2(dy, dx);
  return Math.hypot(dx, dy) < abyssRadius(theta);
}

function lerpColor(colorA, colorB, t) {
  const a = Phaser.Display.Color.IntegerToColor(colorA);
  const b = Phaser.Display.Color.IntegerToColor(colorB);
  const r = Math.round(a.red + (b.red - a.red) * t);
  const g = Math.round(a.green + (b.green - a.green) * t);
  const bl = Math.round(a.blue + (b.blue - a.blue) * t);
  return Phaser.Display.Color.GetColor(r, g, bl);
}

// How close to the coastline (in design pixels) counts as "the border" -
// standing right at the edge instead of out in open water or deep inland.
// Kept thin on purpose: at the island's scale, anything wider starts eating
// into what should read as solid interior (especially the narrow tail),
// making "shore" swallow the middle of the island instead of just its rim.
const SHORE_THRESHOLD = 14;

// Traced pixel-for-pixel from the reference image (360 boundary points,
// extracted by scanning the source PNG for green-vs-blue pixels and casting
// rays out from the landmass's centroid), then scaled/positioned to fit the
// map's safe area. Not a generated or hand-guessed shape.
const ISLAND_OUTLINE = [
  [588, 240], [587, 242], [587, 243], [587, 245], [587, 246], [587, 247], [586, 249], [586, 250], [585, 252], [585, 253],
  [585, 254], [587, 256], [587, 258], [588, 259], [588, 261], [588, 262], [587, 263], [587, 265], [587, 267], [588, 269],
  [588, 270], [588, 272], [589, 274], [589, 276], [589, 277], [589, 279], [588, 280], [588, 282], [589, 285], [593, 288],
  [593, 290], [597, 295], [603, 301], [607, 306], [607, 309], [607, 312], [610, 316], [611, 319], [611, 322], [613, 327],
  [614, 331], [614, 335], [615, 338], [620, 347], [621, 351], [626, 360], [627, 366], [632, 376], [635, 383], [637, 390],
  [639, 398], [640, 406], [641, 413], [645, 424], [647, 434], [654, 452], [656, 463], [656, 471], [656, 480], [654, 486],
  [650, 490], [637, 476], [607, 431], [596, 415], [588, 408], [583, 405], [579, 404], [575, 403], [572, 402], [568, 401],
  [564, 399], [556, 384], [552, 381], [547, 374], [544, 372], [541, 370], [538, 367], [533, 357], [530, 355], [528, 350],
  [525, 345], [522, 339], [520, 335], [518, 333], [515, 328], [514, 326], [512, 325], [511, 325], [509, 326], [508, 327],
  [506, 329], [505, 317], [504, 315], [503, 314], [501, 313], [500, 312], [499, 311], [498, 310], [497, 307], [496, 305],
  [495, 304], [494, 303], [493, 303], [492, 303], [491, 303], [489, 303], [488, 302], [488, 302], [487, 301], [486, 301],
  [484, 301], [483, 301], [482, 301], [481, 300], [480, 299], [480, 298], [478, 298], [477, 298], [476, 298], [475, 297],
  [474, 297], [472, 297], [472, 296], [471, 295], [470, 295], [469, 294], [468, 293], [467, 292], [466, 292], [466, 290],
  [466, 289], [462, 292], [460, 292], [459, 291], [457, 291], [456, 291], [455, 291], [453, 290], [451, 290], [450, 289],
  [449, 289], [447, 288], [446, 287], [445, 287], [443, 286], [441, 286], [439, 286], [438, 285], [436, 284], [434, 284],
  [433, 283], [431, 282], [430, 281], [429, 280], [428, 279], [425, 278], [424, 277], [421, 277], [419, 276], [416, 275],
  [415, 274], [413, 272], [412, 271], [410, 270], [407, 269], [404, 268], [403, 266], [401, 265], [398, 263], [396, 262],
  [394, 260], [394, 258], [394, 256], [396, 254], [396, 252], [396, 250], [396, 248], [396, 246], [396, 245], [396, 242],
  [396, 240], [396, 238], [396, 237], [397, 235], [399, 233], [399, 231], [400, 229], [400, 228], [400, 226], [396, 223],
  [394, 220], [392, 218], [389, 216], [387, 213], [382, 210], [379, 206], [372, 202], [370, 199], [369, 196], [367, 193],
  [358, 186], [346, 179], [339, 173], [312, 158], [304, 151], [310, 149], [312, 146], [315, 143], [322, 143], [326, 141],
  [329, 138], [329, 134], [332, 132], [336, 130], [340, 128], [344, 127], [347, 125], [349, 122], [351, 119], [358, 120],
  [361, 119], [367, 120], [371, 119], [374, 118], [378, 117], [380, 115], [385, 115], [389, 115], [394, 115], [397, 115],
  [410, 126], [414, 127], [417, 126], [420, 125], [422, 125], [425, 125], [428, 125], [431, 125], [434, 125], [437, 125],
  [439, 124], [441, 123], [444, 123], [446, 121], [447, 120], [450, 120], [452, 119], [455, 120], [457, 119], [459, 119],
  [462, 119], [464, 118], [467, 119], [470, 120], [472, 121], [475, 123], [477, 123], [479, 123], [481, 122], [483, 121],
  [485, 120], [487, 120], [489, 120], [491, 119], [493, 117], [496, 117], [497, 117], [500, 118], [502, 118], [504, 117],
  [506, 116], [508, 116], [511, 116], [513, 116], [515, 116], [517, 116], [519, 117], [522, 117], [524, 116], [526, 117],
  [528, 117], [530, 117], [532, 118], [535, 118], [537, 119], [539, 119], [541, 119], [543, 119], [546, 119], [548, 119],
  [551, 118], [554, 116], [559, 110], [561, 112], [563, 113], [565, 114], [567, 115], [570, 116], [570, 121], [572, 122],
  [574, 123], [576, 124], [579, 125], [580, 127], [582, 128], [584, 129], [586, 131], [588, 132], [589, 134], [590, 136],
  [591, 139], [591, 143], [592, 145], [594, 146], [594, 150], [594, 152], [596, 154], [596, 157], [597, 159], [597, 162],
  [596, 166], [597, 168], [597, 170], [600, 170], [601, 171], [603, 172], [603, 175], [604, 177], [604, 179], [606, 181],
  [606, 183], [608, 184], [607, 186], [606, 190], [604, 193], [604, 195], [603, 197], [602, 200], [600, 203], [599, 205],
  [598, 207], [598, 209], [597, 211], [596, 213], [596, 215], [595, 217], [594, 219], [593, 220], [594, 222], [594, 223],
  [593, 225], [593, 227], [592, 228], [593, 230], [592, 231], [592, 233], [591, 235], [591, 236], [589, 237], [589, 239]
];

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Phaser.Math.Clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function distToPolygonBoundary(x, y, poly) {
  let min = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xj, yj] = poly[j];
    const [xi, yi] = poly[i];
    const d = distToSegment(x, y, xj, yj, xi, yi);
    if (d < min) min = d;
  }
  return min;
}

// 'water' out in the open sea (boat), 'shore' right at the coastline in
// either direction (standing on a ledge), 'land' well inside the island
// (standing at a lake) - shore wins whenever a click lands close enough to
// the traced coastline, regardless of which side it's technically on.
function terrainAt(x, y) {
  if (distToPolygonBoundary(x, y, ISLAND_OUTLINE) < SHORE_THRESHOLD) return 'shore';
  return pointInPolygon(x, y, ISLAND_OUTLINE) ? 'land' : 'water';
}

function nameForTerrain(terrain) {
  if (terrain === 'shore') return 'The Shoreline';
  if (terrain === 'land') return 'Island Lake';
  return 'Open Water';
}

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super('WorldMapScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    this.selectedPoint = null;
    this.flagMarker = null;

    // Ocean: one flat solid blue, edge to edge - plus a small dark deep-abyss
    // patch tucked into the bottom-left corner. Only the patch's own edge
    // gets a soft feather (a handful of concentric wavy wedges stepping from
    // bright to deep over DEEP_FADE_WIDTH px) - the rest of the map stays
    // flat, no gradient washing across the whole screen.
    const oceanG = this.add.graphics();
    oceanG.fillStyle(BRIGHT_WATER, 1);
    oceanG.fillRect(0, 0, width, height);

    // Many thin bands instead of a few thick ones - each step's color delta
    // gets small enough that the eye stops seeing individual rings and reads
    // it as one smooth blend, same principle as a print halftone.
    const arcSteps = 64;
    const fadeSteps = 90;
    for (let i = 0; i <= fadeSteps; i += 1) {
      const t = i / fadeSteps;
      const extra = DEEP_FADE_WIDTH * (1 - t);
      const wedge = [{ x: 0, y: height }];
      for (let a = 0; a <= arcSteps; a += 1) {
        const theta = -Math.PI / 2 + (Math.PI / 2) * (a / arcSteps);
        const r = abyssRadius(theta) + extra;
        wedge.push({ x: r * Math.cos(theta), y: height + r * Math.sin(theta) });
      }
      oceanG.fillStyle(lerpColor(BRIGHT_WATER, DEEP_WATER, t), 1);
      oceanG.fillPoints(wedge, true);
    }

    // Island: the traced outline, filled flat green with a thin darker-green
    // edge - the coastline's jaggedness is already real, traced data.
    const landPoints = ISLAND_OUTLINE.map(([x, y]) => ({ x, y }));
    const islandG = this.add.graphics();
    islandG.fillStyle(0x4caf50, 1);
    islandG.fillPoints(landPoints, true);
    islandG.lineStyle(2, 0x2e7d32, 0.8);
    islandG.strokePoints(landPoints, true);

    this.add
      .text(width / 2, 98, 'Choose a Fishing Spot', heading('30px'))
      .setOrigin(0.5);

    addStatusBar(this, GameState);

    // Free placement: click open water for a boat trip, right at the
    // coastline to fish from a ledge, or well inland for a lake. Clicks in
    // the reserved title/status band up top or the Confirm button band down
    // below don't count as map clicks (currentlyOver catches actual button
    // hits; the y bands catch clicks that land near text/status but not on
    // an interactive zone).
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      if (currentlyOver.length > 0) return;
      const x = pointer.worldX;
      const y = pointer.worldY;
      if (y < 125 || y > height - 142) return;
      this.placeFlag(x, y);
    });

    this.confirmBtn = createButton(
      this,
      width / 2,
      height - 110,
      220,
      56,
      'Confirm',
      () => {
        if (!this.selectedPoint) return;
        const { x, y, terrain } = this.selectedPoint;
        const deep = isDeepZone(x, y);
        const waterColor = deep ? DEEP_WATER : BRIGHT_WATER;
        const skyColor = deep ? DEEP_SKY : BRIGHT_SKY;
        GameState.data.selectedLocation = {
          terrain,
          x,
          y,
          waterColor,
          skyColor,
          name: nameForTerrain(terrain)
        };
        GameState.save();
        this.scene.start('FishingScene');
      },
      { fontSize: '22px' }
    );
    this.confirmBtn.setEnabled(false);
  }

  placeFlag(x, y) {
    const terrain = terrainAt(x, y);
    this.selectedPoint = { x, y, terrain };

    if (this.flagMarker) this.flagMarker.destroy();
    this.flagMarker = drawFlagMarker(this, x, y);

    this.confirmBtn.setEnabled(true);
  }
}
