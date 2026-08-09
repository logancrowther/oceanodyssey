import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { LOCATIONS } from '../data/locationData.js';
import { getFish } from '../data/fishData.js';
import { createButton } from '../ui/Button.js';
import { createIconButton, drawShopIcon, drawBagIcon } from '../ui/iconButton.js';
import { addStatusBar } from '../ui/fishIcon.js';
import { drawHook, drawPrawn, drawFlathead } from '../ui/tackle.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { shadeColor, buildSeaPolygon, waveSurfaceY, drawSunGlow, drawBoatHull } from '../ui/oceanArt.js';
import { subheading } from '../ui/textStyle.js';

const WATERLINE_Y = 300;
const GROUND_Y = 340;
// The lake fills the whole right side of the ground, from this bank line
// (wavy, not a hard edge) out to the right edge of the screen and down to
// the bottom - a real lake taking up most of the floor, not a small pond.
const LAKE_BANK_X = 330;
const GRASS_COLOR = 0x5a9c46;
const LEDGE_COLOR = 0x8a7a63;

// The circular reel control - a fixed screen widget the player moves the
// pointer around near to actually crank the fish in. Kept forgiving on
// purpose: a real hand-drawn circle with a mouse is never perfectly smooth
// or centered, so gentle decay and a generous gain go a long way toward
// "it never works" if tuned too tight.
const REEL_WHEEL_X = 480;
const REEL_WHEEL_Y = 424;
const REEL_WHEEL_RADIUS = 62;
const REEL_TIME_LIMIT = 25000;

// The bank's x position wobbles gently with depth (y) instead of running a
// straight vertical line, so the shoreline reads as a natural, uneven edge
// like the sea's own wavy surface line.
function lakeBankX(y) {
  return LAKE_BANK_X + Math.sin(y * 0.025) * 16;
}

// Still lake surface: flat at the ground line for any x actually over the
// lake (right of the bank at that depth), or Infinity over grass so a line
// hanging there stays fully visible instead of "fading underwater".
function lakeSurfaceY(x) {
  return x > lakeBankX(GROUND_Y) ? GROUND_Y : Infinity;
}

// One reusable boulder silhouette (fixed set of angle/radius pairs, not a
// circle) - every rock on the ledge is this same shape at a different
// position, size and shade, the way the boat hull is one shape reused. More
// points with gentler radius variation than a jagged crystal reads as a
// smooth, rounded, weathered boulder instead of an angular shard.
const ROCK_SHAPE = [
  { a: 0.0, r: 1.0 },
  { a: 0.45, r: 0.92 },
  { a: 0.9, r: 1.04 },
  { a: 1.35, r: 0.9 },
  { a: 1.8, r: 1.0 },
  { a: 2.25, r: 0.94 },
  { a: 2.7, r: 1.06 },
  { a: 3.15, r: 0.9 },
  { a: 3.6, r: 1.02 },
  { a: 4.05, r: 0.92 },
  { a: 4.5, r: 1.05 },
  { a: 4.95, r: 0.9 },
  { a: 5.4, r: 1.03 },
  { a: 5.85, r: 0.95 }
];

function drawRock(g, cx, cy, rx, ry, fillColor, strokeColor) {
  const points = ROCK_SHAPE.map(({ a, r }) => ({
    x: cx + Math.cos(a) * rx * r,
    y: cy + Math.sin(a) * ry * r
  }));
  g.fillStyle(fillColor, 1);
  g.fillPoints(points, true);
  g.lineStyle(2, strokeColor, 0.65);
  g.strokePoints(points, true);
}

function quadPoint(x0, y0, cx, cy, x1, y1, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1
  };
}

function sampleQuad(x0, y0, cx, cy, x1, y1, steps) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) points.push(quadPoint(x0, y0, cx, cy, x1, y1, i / steps));
  return points;
}

// Builds a closed polygon tracing a strip of varying width along a centerline
// - wide at the start, narrow at the end - so a stroke reads as a tapered rod
// blank instead of a uniform-width line.
function taperedStrip(points, widthStart, widthEnd) {
  const n = points.length;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i += 1) {
    const r = (widthStart + (widthEnd - widthStart) * (i / (n - 1))) / 2;
    let dx;
    let dy;
    if (i === 0) {
      dx = points[1].x - points[0].x;
      dy = points[1].y - points[0].y;
    } else if (i === n - 1) {
      dx = points[i].x - points[i - 1].x;
      dy = points[i].y - points[i - 1].y;
    } else {
      dx = points[i + 1].x - points[i - 1].x;
      dy = points[i + 1].y - points[i - 1].y;
    }
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * r;
    const ny = (dx / len) * r;
    left.push({ x: points[i].x + nx, y: points[i].y + ny });
    right.push({ x: points[i].x - nx, y: points[i].y - ny });
  }
  return left.concat(right.reverse());
}

export default class FishingScene extends Phaser.Scene {
  constructor() {
    super('FishingScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    this.location = GameState.data.selectedLocation || {
      terrain: 'water',
      waterColor: LOCATIONS[0].waterColor,
      skyColor: LOCATIONS[0].skyColor,
      name: LOCATIONS[0].name
    };
    this.terrain = this.location.terrain || 'water';
    this.state = 'idle';
    this.currentLinePull = 0;
    this.tugState = { v: 0 };
    this.tugTimer = null;
    this.waveT = 0;
    this.landedFish = null;
    // 0 = hook resting above water right at the rod tip (not cast yet), 1 =
    // fully cast out at the fishing spot - animated by startCast().
    this.castProgress = 0;

    // Sunny-day sky gradient: richer blue up high, brighter/warmer near the horizon.
    const skyTop = shadeColor(this.location.skyColor, 0.7);
    const skyBottom = shadeColor(this.location.skyColor, 1.4);
    const skyG = this.add.graphics();
    skyG.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
    skyG.fillRect(0, 0, width, height);

    this.sceneGraphics = this.add.graphics();
    this.renderScenery(0);
    this.drawSun();

    if (this.terrain === 'shore') {
      this.drawLedgeAngler();
    } else if (this.terrain === 'land') {
      this.drawLakesideAngler();
    } else {
      this.drawBoat();
    }

    this.statusBar = addStatusBar(this, GameState);

    this.messageText = this.add.text(width / 2, 150, '', subheading('20px')).setOrigin(0.5);

    this.bagIconBtn = createIconButton(
      this,
      width - 40,
      92,
      22,
      drawBagIcon,
      () => {
        if (this.state !== 'idle') return;
        this.scene.start('InventoryScene');
      }
    );

    this.shopIconBtn = createIconButton(
      this,
      width - 95,
      92,
      22,
      drawShopIcon,
      () => {
        if (this.state !== 'idle') return;
        this.scene.start('ShopScene');
      }
    );

    this.castBtn = createButton(this, width / 2, height - 76, 220, 60, 'Cast Line', () => this.handleCastButton(), {
      fontSize: '22px'
    });

    this.setupReelWheel();
  }

  hasBait() {
    const id = GameState.equippedBait;
    return !!id && GameState.ownedCount(id) > 0;
  }

  // Flat, solid-color sea with just an animated wavy top edge for open water
  // and the shoreline (no gradient or texture, to match a flat cartoon-poster
  // look) - or, inland, a grass ground plane with a still lake inset into it.
  renderScenery(t) {
    const g = this.sceneGraphics;
    g.clear();
    if (this.terrain === 'land') {
      g.fillStyle(GRASS_COLOR, 1);
      g.fillRect(0, GROUND_Y, DESIGN_WIDTH, DESIGN_HEIGHT - GROUND_Y);
      g.fillStyle(shadeColor(GRASS_COLOR, 0.82), 1);
      g.fillRect(0, GROUND_Y, DESIGN_WIDTH, 8);

      // A big lake covering the whole right side of the floor, out to the
      // screen edge - a wavy bank line instead of a hard vertical seam.
      const bankPoints = [];
      for (let y = GROUND_Y; y <= DESIGN_HEIGHT; y += 12) {
        bankPoints.push({ x: lakeBankX(y), y });
      }
      const lakePoints = [
        ...bankPoints,
        { x: DESIGN_WIDTH, y: DESIGN_HEIGHT },
        { x: DESIGN_WIDTH, y: GROUND_Y }
      ];
      g.fillStyle(this.location.waterColor, 1);
      g.fillPoints(lakePoints, true);
      g.lineStyle(2, shadeColor(this.location.waterColor, 0.75), 0.8);
      g.beginPath();
      bankPoints.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
      g.strokePath();
    } else {
      g.fillStyle(this.location.waterColor, 1);
      g.fillPoints(buildSeaPolygon(DESIGN_WIDTH, DESIGN_HEIGHT, WATERLINE_Y, t), true);
    }
  }

  // Where the water's surface sits at a given world x - the wavy sea line for
  // open water/shore, or the lake's still top edge inland - used both to draw
  // the ground/lake above and to fade the fishing line as it goes underwater.
  surfaceYAt(x) {
    return this.terrain === 'land' ? lakeSurfaceY(x) : waveSurfaceY(x, WATERLINE_Y, this.waveT || 0);
  }

  drawSun() {
    drawSunGlow(this.add.graphics(), 800, 110);
  }

  drawBoat() {
    // Container origin sits exactly on the left screen edge, and the hull is
    // drawn symmetric about local x=0, so exactly the right half of the boat
    // is ever on screen - the rest is simply off-canvas, not drawn at all.
    const originX = 0;
    const originY = 300;
    const scale = 1.3;
    const container = this.add.container(originX, originY);
    container.setScale(scale);
    this.rigContainer = container;
    this.rigBaseY = originY;
    this.rocks = true;

    // Plain black stickman, seated on the bench - drawn BEFORE the hull, so
    // the hull (and bench) render in front and hide everything below the
    // gunwale line, exactly like a person actually sitting inside a boat.
    // Bigger than before: proportions below are scaled up ~1.5x from a hip anchor.
    const bodyG = this.add.graphics();
    container.add(bodyG);
    this.bodyG = bodyG;

    const black = 0x1a1a1a;
    const lineWidth = 6;
    const hip = { x: 55, y: -10 };
    // Torso, both arms, and the head all meet at this single point - a real
    // shoulder/neck joint - so nothing floats disconnected from the body.
    const neck = { x: 60, y: -56 };
    // Both hands grip the rod handle, held close to the body with the handle
    // near-vertical (lower hand near the butt, upper hand near the reel)
    // rather than out at arm's length.
    const handBack = { x: 90, y: -22 };
    const handPos = { x: 95, y: -49 };
    const headRadius = 20;
    const head = { x: neck.x, y: neck.y - headRadius };

    bodyG.lineStyle(lineWidth, black, 1);

    // Torso.
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(neck.x, neck.y);
    bodyG.strokePath();

    // Legs, bent at the knee and tucked down into the hull rather than
    // dangling out past it, so the body reads as seated inside the boat.
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(40, 8);
    bodyG.lineTo(35, 20);
    bodyG.strokePath();
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(72, 10);
    bodyG.lineTo(78, 22);
    bodyG.strokePath();

    // Back arm, bent at the elbow, gripping the rod handle near the butt.
    bodyG.beginPath();
    bodyG.moveTo(neck.x, neck.y);
    bodyG.lineTo(76, -33);
    bodyG.lineTo(handBack.x, handBack.y);
    bodyG.strokePath();

    // Front arm, bent at the elbow, gripping the rod handle near the reel.
    bodyG.beginPath();
    bodyG.moveTo(neck.x, neck.y);
    bodyG.lineTo(82, -52);
    bodyG.lineTo(handPos.x, handPos.y);
    bodyG.strokePath();

    // Round joints at the hip and neck, where multiple strokes meet, so the
    // thick lines read as one continuous, connected body instead of separate
    // segments butting into each other at sharp corners.
    bodyG.fillStyle(black, 1);
    bodyG.fillCircle(hip.x, hip.y, lineWidth / 2);
    bodyG.fillCircle(neck.x, neck.y, lineWidth / 2);

    // Plain head, no face - its bottom edge sits exactly on the neck joint.
    bodyG.lineStyle(lineWidth - 1, black, 1);
    bodyG.strokeCircle(head.x, head.y, headRadius);

    const rig = this.buildHandleAndReel(bodyG, handBack, handPos);
    this.setRodAnchors(rig, originY, scale, 380);

    const hullG = this.add.graphics();
    container.add(hullG);
    drawBoatHull(hullG);

    this.rodGraphics = this.add.graphics();
    container.add(this.rodGraphics);
    this.currentBend = 0;
    this.drawRod(0);
  }

  // A rock shelf jutting out at the waterline, on the left side of the
  // screen (same side as the boat, so the same up-and-right rod cast clears
  // the Shop/Bag icons and sun in the top-right instead of crossing through
  // them) - extends past the left edge like more coastline continues
  // off-screen, same trick the boat hull uses.
  drawLedgeAngler() {
    const originX = 140;
    const ledgeG = this.add.graphics();

    const dark = shadeColor(LEDGE_COLOR, 0.6);
    const shadow = shadeColor(LEDGE_COLOR, 0.8);
    const light = shadeColor(LEDGE_COLOR, 1.16);
    const outline = shadeColor(LEDGE_COLOR, 0.42);

    // Submerged continuation of the ramp: real underwater terrain keeps
    // sloping away from shore instead of stopping in a sheer wall right at
    // the waterline. Drawn translucent over the sea (already painted) so it
    // reads as murky rock seen through water, its edge angled to continue
    // the staircase's slope down and to the right. Two overlapping layers,
    // the outer one fainter and reaching further, so the murk fades out
    // gradually into the depths instead of stopping at one hard diagonal line.
    ledgeG.fillStyle(shadeColor(LEDGE_COLOR, 0.45), 0.22);
    ledgeG.fillPoints(
      [
        { x: originX - 200, y: WATERLINE_Y + 20 },
        { x: originX + 300, y: WATERLINE_Y + 90 },
        { x: originX + 620, y: DESIGN_HEIGHT },
        { x: originX - 200, y: DESIGN_HEIGHT }
      ],
      true
    );
    ledgeG.fillStyle(shadeColor(LEDGE_COLOR, 0.45), 0.4);
    ledgeG.fillPoints(
      [
        { x: originX - 200, y: WATERLINE_Y + 20 },
        { x: originX + 235, y: WATERLINE_Y + 80 },
        { x: originX + 460, y: DESIGN_HEIGHT },
        { x: originX - 200, y: DESIGN_HEIGHT }
      ],
      true
    );

    // Backing mass, tucked below/behind the boulder cluster so it never
    // shows its own edge - just insurance against gaps between boulders. A
    // sliver showing through just reads as a shadowed crevice, so it's kept
    // high enough to actually close the gaps between the staircase and the
    // bulk boulders behind it. Stops short of the ramp's toe on purpose -
    // past that point only the translucent submerged wedge above and the
    // small standalone stepping-stone boulders should show, not a flat-sided
    // opaque block.
    ledgeG.fillStyle(dark, 1);
    ledgeG.fillRect(originX - 200, WATERLINE_Y + 20, 350, DESIGN_HEIGHT - WATERLINE_Y - 20);

    // A real slope, not a cliff: boulders step diagonally down from high on
    // the left (more coastline implied off-screen, same trick the boat hull
    // uses) to right at the waterline, like a natural rocky beach you'd
    // actually walk down - not a pile dropped straight into the water.
    // Bulk boulders behind fill the mass under the visible staircase; the
    // last two are small and sit low enough to look half-submerged, selling
    // the ramp actually running into the water instead of stopping short.
    const boulders = [
      // Bulk, behind/below the visible staircase.
      { x: originX - 70, y: WATERLINE_Y + 90, rx: 78, ry: 58, shade: shadow },
      { x: originX + 40, y: WATERLINE_Y + 120, rx: 82, ry: 60, shade: LEDGE_COLOR },
      { x: originX - 150, y: WATERLINE_Y + 60, rx: 65, ry: 50, shade: LEDGE_COLOR },
      // The descending staircase itself, high (far left) to low (near water).
      { x: originX - 165, y: WATERLINE_Y - 30, rx: 78, ry: 50, shade: shadow },
      { x: originX - 90, y: WATERLINE_Y - 8, rx: 72, ry: 46, shade: light },
      { x: originX - 5, y: WATERLINE_Y + 12, rx: 78, ry: 46, shade: LEDGE_COLOR },
      { x: originX + 75, y: WATERLINE_Y + 32, rx: 62, ry: 40, shade: shadow },
      { x: originX + 140, y: WATERLINE_Y + 50, rx: 50, ry: 34, shade: light },
      // Small, low, half-submerged stepping stones right at the water's edge.
      { x: originX + 190, y: WATERLINE_Y + 66, rx: 34, ry: 22, shade: shadow },
      { x: originX + 225, y: WATERLINE_Y + 78, rx: 26, ry: 17, shade: LEDGE_COLOR }
    ];
    boulders.forEach(({ x, y, rx, ry, shade }) => drawRock(ledgeG, x, y, rx, ry, shade, outline));

    this.drawStandingAngler({ originX, originY: WATERLINE_Y, hookWorldY: 380 });
  }

  // A patch of grass at the lake's near edge, standing on the ground instead
  // of a boat or a rocky ledge - same left-side placement as the ledge, with
  // the lake positioned right where the cast naturally lands.
  drawLakesideAngler() {
    const originX = 140;
    this.drawStandingAngler({ originX, originY: GROUND_Y, hookWorldY: GROUND_Y + 70 });
  }

  // Shared standing pose (used for both the shoreline ledge and the
  // lakeside) - same body, same rod rig as the boat's seated angler, built
  // with buildHandleAndReel so all three scenes share the identical
  // handle/reel hardware and only the pose and platform differ.
  drawStandingAngler({ originX, originY, hookWorldY }) {
    const scale = 1.3;
    const container = this.add.container(originX, originY);
    container.setScale(scale);
    this.rigContainer = container;
    this.rigBaseY = originY;
    this.rocks = false;

    const bodyG = this.add.graphics();
    container.add(bodyG);
    this.bodyG = bodyG;

    const black = 0x1a1a1a;
    const lineWidth = 6;
    const hip = { x: 58, y: -5 };
    const neck = { x: 62, y: -69 };
    const handBack = { x: 92, y: -36 };
    const handPos = { x: 97, y: -63 };
    const headRadius = 20;
    const head = { x: neck.x, y: neck.y - headRadius };

    bodyG.lineStyle(lineWidth, black, 1);

    // Torso.
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(neck.x, neck.y);
    bodyG.strokePath();

    // Legs, standing straight, feet planted on the ground - roughly as long
    // as the torso (hip to neck is 64px), not a short stub.
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(48, 26);
    bodyG.lineTo(46, 60);
    bodyG.strokePath();
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(70, 26);
    bodyG.lineTo(71, 60);
    bodyG.strokePath();

    // Back arm, bent at the elbow, gripping the rod handle near the butt.
    bodyG.beginPath();
    bodyG.moveTo(neck.x, neck.y);
    bodyG.lineTo(80, -48);
    bodyG.lineTo(handBack.x, handBack.y);
    bodyG.strokePath();

    // Front arm, bent at the elbow, gripping the rod handle near the reel.
    bodyG.beginPath();
    bodyG.moveTo(neck.x, neck.y);
    bodyG.lineTo(86, -66);
    bodyG.lineTo(handPos.x, handPos.y);
    bodyG.strokePath();

    bodyG.fillStyle(black, 1);
    bodyG.fillCircle(hip.x, hip.y, lineWidth / 2);
    bodyG.fillCircle(neck.x, neck.y, lineWidth / 2);

    bodyG.lineStyle(lineWidth - 1, black, 1);
    bodyG.strokeCircle(head.x, head.y, headRadius);

    const rig = this.buildHandleAndReel(bodyG, handBack, handPos);
    this.setRodAnchors(rig, originY, scale, hookWorldY);

    this.rodGraphics = this.add.graphics();
    container.add(this.rodGraphics);
    this.currentBend = 0;
    this.drawRod(0);
  }

  // Grip/reel/apex/hook anchor points, in the rig container's LOCAL space -
  // shared by the boat, ledge and lakeside rigs so all three set them up
  // identically. hookWorldY is where the hook sits once fully cast (out in
  // the water); hookRest is a separate point right at the rod tip, just
  // above water, where the hook starts before casting - drawRod blends
  // between the two based on this.castProgress.
  setRodAnchors(rig, originY, scale, hookWorldY) {
    this.gripX = rig.gripX;
    this.gripY = rig.gripY;
    this.reelX = rig.reelX;
    this.reelY = rig.reelY;
    this.apexBaseX = this.gripX + 100;
    this.apexBaseY = (90 - originY) / scale;
    this.hookBaseX = this.apexBaseX;
    this.hookBaseY = (hookWorldY - originY) / scale;
    this.hookRestX = this.apexBaseX;
    this.hookRestY = this.apexBaseY + 16;
  }

  // Rod handle, modeled as real spinning-rod hardware along the hand-to-hand
  // axis: a tapered rear grip, a reel seat with a locking collar and a
  // hooded foot the reel actually mounts to, then a foregrip - instead of
  // a single plain bar. Both hands land inside this profile (rear hand on
  // the rear grip, front hand right at the seat/foregrip transition), so
  // the grip reads as continuous rather than hands floating near a handle.
  // Independent of body pose (seated or standing) - only the hand positions
  // matter - so the boat, ledge, and lakeside anglers all share this rig.
  buildHandleAndReel(bodyG, handBack, handPos) {
    const handleDx = handPos.x - handBack.x;
    const handleDy = handPos.y - handBack.y;
    const handleLen = Math.hypot(handleDx, handleDy) || 1;
    const hux = handleDx / handleLen;
    const huy = handleDy / handleLen;
    const hpx = -huy;
    const hpy = hux;
    const axisPt = (dist) => ({ x: handBack.x + hux * dist, y: handBack.y + huy * dist });
    const axisStrip = (profile) => {
      const left = profile.map(({ t, r }) => {
        const c = axisPt(t);
        return { x: c.x + hpx * r, y: c.y + hpy * r };
      });
      const right = profile.map(({ t, r }) => {
        const c = axisPt(t);
        return { x: c.x - hpx * r, y: c.y - hpy * r };
      });
      return left.concat(right.reverse());
    };

    const foamColor = 0x141414;
    const seatColor = 0x2b2b2b;

    // Rear grip: rounded butt cap tapering out to the reel seat.
    bodyG.fillStyle(foamColor, 1);
    bodyG.fillPoints(
      axisStrip([
        { t: -3, r: 3.6 },
        { t: 5, r: 3.9 },
        { t: 13, r: 3.3 }
      ]),
      true
    );
    bodyG.fillCircle(axisPt(-3).x, axisPt(-3).y, 3.6);

    // Reel seat: a wider locking collar, with a hooded foot the reel mounts to.
    bodyG.fillStyle(seatColor, 1);
    bodyG.fillPoints(
      axisStrip([
        { t: 13, r: 3.3 },
        { t: 15, r: 4.4 },
        { t: 20, r: 4.4 },
        { t: 22, r: 3.4 }
      ]),
      true
    );
    bodyG.lineStyle(0.9, 0x0d0d0d, 0.9);
    [16, 19].forEach((t) => {
      const c = axisPt(t);
      bodyG.beginPath();
      bodyG.moveTo(c.x + hpx * 4.4, c.y + hpy * 4.4);
      bodyG.lineTo(c.x - hpx * 4.4, c.y - hpy * 4.4);
      bodyG.strokePath();
    });

    const seatMid = axisPt(17.5);
    bodyG.fillStyle(0x1c1c1c, 1);
    bodyG.fillPoints(
      [
        { x: seatMid.x + hpx * 2.9, y: seatMid.y + hpy * 2.9 },
        { x: seatMid.x + hux * 2.2 + hpx * 2.9, y: seatMid.y + huy * 2.2 + hpy * 2.9 },
        { x: seatMid.x + hux * 1.8 + hpx * 7.5, y: seatMid.y + huy * 1.8 + hpy * 7.5 },
        { x: seatMid.x - hux * 1.8 + hpx * 7.5, y: seatMid.y - huy * 1.8 + hpy * 7.5 },
        { x: seatMid.x - hux * 2.2 + hpx * 2.9, y: seatMid.y - huy * 2.2 + hpy * 2.9 }
      ],
      true
    );

    // Foregrip, just past the seat.
    bodyG.fillStyle(foamColor, 1);
    bodyG.fillPoints(
      axisStrip([
        { t: 22, r: 3.4 },
        { t: 24.5, r: 3.1 },
        { t: 27, r: 2.8 }
      ]),
      true
    );

    // Grip texture ticks, on the rear grip and foregrip only.
    bodyG.lineStyle(0.8, 0x3a3a3a, 0.6);
    [-1, 3, 8, 23, 25.5].forEach((t) => {
      const c = axisPt(t);
      bodyG.beginPath();
      bodyG.moveTo(c.x + hpx * 2.3, c.y + hpy * 2.3);
      bodyG.lineTo(c.x - hpx * 2.3, c.y - hpy * 2.3);
      bodyG.strokePath();
    });

    // Reel, mounted on the seat's foot: a teardrop body, a spool with wound
    // line texture, a bail wire, and a handle crank with a knob.
    const reelMount = { x: seatMid.x + hux * 1.8 + hpx * 7.5, y: seatMid.y + huy * 1.8 + hpy * 7.5 };
    const reelCenter = { x: reelMount.x + hpx * 4.2, y: reelMount.y + hpy * 4.2 };

    const backR = 3.8;
    const frontR = 2.7;
    const backC = { x: reelCenter.x - hux * 1.2, y: reelCenter.y - huy * 1.2 };
    const frontC = { x: reelCenter.x + hux * 2.9, y: reelCenter.y + huy * 2.9 };
    bodyG.fillStyle(0x1c1c1c, 1);
    bodyG.fillCircle(backC.x, backC.y, backR);
    bodyG.fillCircle(frontC.x, frontC.y, frontR);
    bodyG.fillPoints(
      [
        { x: backC.x + hpx * backR, y: backC.y + hpy * backR },
        { x: frontC.x + hpx * frontR, y: frontC.y + hpy * frontR },
        { x: frontC.x - hpx * frontR, y: frontC.y - hpy * frontR },
        { x: backC.x - hpx * backR, y: backC.y - hpy * backR }
      ],
      true
    );

    bodyG.fillStyle(0x8a8a8a, 1);
    bodyG.fillCircle(frontC.x, frontC.y, frontR - 0.5);
    bodyG.lineStyle(0.55, 0x5a5a5a, 0.8);
    bodyG.strokeCircle(frontC.x, frontC.y, frontR - 1.1);
    bodyG.strokeCircle(frontC.x, frontC.y, frontR - 1.8);

    bodyG.lineStyle(0.8, 0xb8b8b8, 1);
    bodyG.beginPath();
    bodyG.arc(frontC.x, frontC.y, frontR + 0.9, Phaser.Math.DegToRad(-140), Phaser.Math.DegToRad(60), false);
    bodyG.strokePath();

    bodyG.lineStyle(0.9, 0x2b2b2b, 1);
    const crankBase = { x: backC.x + hux * 0.9, y: backC.y + huy * 0.9 };
    const crankTip = { x: crankBase.x + hpx * (backR + 2.8), y: crankBase.y + hpy * (backR + 2.8) };
    bodyG.beginPath();
    bodyG.moveTo(crankBase.x, crankBase.y);
    bodyG.lineTo(crankTip.x, crankTip.y);
    bodyG.strokePath();
    bodyG.fillStyle(0x2b2b2b, 1);
    bodyG.fillCircle(crankTip.x, crankTip.y, 1.1);

    // Grip point, in the rig container's LOCAL space (not world space) so
    // the whole rig - rod, line, hook - moves together with its container.
    const blankStart = axisPt(27);
    return { gripX: blankStart.x, gripY: blankStart.y, reelX: reelCenter.x, reelY: reelCenter.y };
  }

  // Draws a realistic tapered fishing rod - reel, thick butt tapering to a
  // thin tip, line guides - from hand to rod tip, then a separate thin line
  // continuing on from the tip down to the hook. `bend` (0 = at rest) flattens
  // the rod's arc and pulls the hook taut, simulating a fish straining the
  // line. `pull` (0-1, pulses while a fish is on) drags the rod tip and hook
  // down and pulls the hand/reel down slightly too - the fish yanking the
  // line down rather than the rod jiggling side to side.
  drawRod(bend, pull = 0) {
    const g = this.rodGraphics;
    g.clear();

    // The hand dips a little with each tug, and the rod's grip point (and
    // the reel mounted on it) moves with it, so the whole rig stays attached
    // to the stickman - see the matching this.bodyG.y offset in update().
    const handDip = pull * 2.5;
    const gripX = this.gripX;
    const gripY = this.gripY + handDip;
    const reelX = this.reelX;
    const reelY = this.reelY + handDip;

    const apexX = this.apexBaseX - bend * 0.3;
    const apexY = this.apexBaseY + bend * 1.1 + pull * 24;

    // Blend the hook between its resting spot (right at the rod tip, above
    // water) and its fully-cast spot out in the water, driven by
    // castProgress - plus a little upward arc mid-flight so it reads as a
    // toss out over the water rather than a straight slide.
    const t = this.castProgress;
    const arc = Math.sin(t * Math.PI) * 30;
    const castX = Phaser.Math.Linear(this.hookRestX, this.hookBaseX, t);
    const castY = Phaser.Math.Linear(this.hookRestY, this.hookBaseY, t) - arc;
    const hookX = castX - bend * 0.5;
    const hookY = castY - bend * 0.4 + pull * 34;

    const c1x = gripX + (apexX - gripX) * 0.5 + 20;
    const c1y = gripY + (apexY - gripY) * 0.9;
    const c2x = apexX + (hookX - apexX) * 0.3;
    const c2y = apexY + (hookY - apexY) * 0.7;

    // Rod blank: grip -> rod tip (apex). Thick where it meets the foregrip,
    // tapering to a whippy thin tip, like a real graphite blank - plus a
    // slim highlight stripe down the middle for a rounded, glossy look.
    const rodPoints = sampleQuad(gripX, gripY, c1x, c1y, apexX, apexY, 16);
    g.fillStyle(0x272b23, 1);
    g.fillPoints(taperedStrip(rodPoints, 4.6, 1), true);
    g.fillStyle(0x4a5142, 0.55);
    g.fillPoints(taperedStrip(rodPoints, 1.3, 0.25), true);
    g.lineStyle(1, 0x11130f, 0.6);
    g.beginPath();
    g.moveTo(rodPoints[0].x, rodPoints[0].y);
    rodPoints.slice(1).forEach((p) => g.lineTo(p.x, p.y));
    g.strokePath();

    // Line guides, spaced closer together toward the tip (as on a real rod,
    // where guide spacing shrinks with the blank's diameter), each with a
    // small thread-wrap band at its foot.
    const guideSpecs = [
      [0.1, 3.2],
      [0.24, 2.7],
      [0.4, 2.2],
      [0.56, 1.8],
      [0.72, 1.4],
      [0.87, 1.1],
      [0.97, 0.8]
    ];
    guideSpecs.forEach(([gt, r]) => {
      const p = quadPoint(gripX, gripY, c1x, c1y, apexX, apexY, gt);
      const wrap = quadPoint(gripX, gripY, c1x, c1y, apexX, apexY, Math.max(0, gt - 0.015));
      g.fillStyle(0x8a1620, 0.9);
      g.fillCircle(wrap.x, wrap.y, 1.1);
      g.lineStyle(1, 0xd7dde0, 1);
      g.strokeCircle(p.x, p.y, r);
    });

    // Line strung from the reel, along the rod through the guides, to the
    // tip - connecting the reel to the water line below into one continuous
    // thread instead of the line only starting at the tip.
    g.lineStyle(1, 0xe4e4e4, 0.85);
    g.beginPath();
    g.moveTo(reelX, reelY);
    g.lineTo(gripX, gripY);
    rodPoints.slice(1).forEach((p) => g.lineTo(p.x, p.y));
    g.strokePath();

    // Thin fishing line from the rod tip down to the hook, fading out as it
    // crosses the water's surface - so it reads as sinking into the water
    // rather than floating visibly through it. The line's own points (and
    // the hook's) are untouched; only how much of it gets drawn changes. The
    // rig container can rock independently of the sea (the boat) or sit
    // still (ledge/lakeside), so points have to be converted to world space
    // before comparing them against the water line.
    const matrix = this.rigContainer.getWorldTransformMatrix();
    const worldPt = {};
    const toWorld = (x, y) => {
      matrix.transformPoint(x, y, worldPt);
      return worldPt;
    };

    const fadeDist = 26;
    const lineAlphaAt = (localX, localY) => {
      const w = toWorld(localX, localY);
      return Phaser.Math.Clamp(1 - (w.y - this.surfaceYAt(w.x)) / fadeDist, 0, 1);
    };

    const linePoints = sampleQuad(apexX, apexY, c2x, c2y, hookX, hookY, 20);
    for (let i = 0; i < linePoints.length - 1; i += 1) {
      const p0 = linePoints[i];
      const p1 = linePoints[i + 1];
      const alpha = lineAlphaAt((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
      if (alpha <= 0.02) continue;
      g.lineStyle(1.5, 0xf0f0f0, alpha * 0.9);
      g.beginPath();
      g.moveTo(p0.x, p0.y);
      g.lineTo(p1.x, p1.y);
      g.strokePath();
    }

    // Whatever's on the hook - the equipped bait before a catch, or the
    // landed fish being hauled up after one - drawn BEHIND the hook (not in
    // front of it) and centered right on the hook's bend, so the hook reads
    // as actually skewered through it rather than just floating alongside.
    const hookAlpha = lineAlphaAt(hookX, hookY);
    const dangle = Math.sin(this.waveT * 3) * 0.18;
    if (this.landedFish) {
      drawFlathead(g, hookX + 2, hookY + 3, 0.42, Math.PI / 2 + dangle);
    } else if (GameState.equippedBait === 'prawn') {
      drawPrawn(g, hookX + 2, hookY + 1, 0.34, dangle);
    }

    // The hook itself, modeled properly (eye, shank, curved bend, barb)
    // instead of a plain squiggle, drawn on top so its point visibly pokes
    // through whatever's threaded onto it - same underwater fade as the line.
    if (hookAlpha > 0.02) {
      drawHook(g, hookX, hookY, 0.55, 0, hookAlpha);
    }
  }

  handleCastButton() {
    if (this.state === 'idle') this.startCast();
  }

  startCast() {
    // Fishing bare-hooked is allowed - it just won't attract much (chances
    // get tuned down for it later). Bait is only spent if there's actually
    // some equipped.
    if (this.hasBait()) {
      GameState.consumeEquippedBait();
      this.statusBar.refresh();
    }
    this.state = 'waiting';
    this.landedFish = null;
    this.castBtn.setLabel('Waiting...');
    this.castBtn.setEnabled(false);
    this.setNavEnabled(false);
    this.showMessage('Waiting for a bite...');
    this.currentBend = 0;
    this.currentLinePull = 0;

    // The actual cast: the hook flies out from the rod tip to the fishing
    // spot, arcing up over the water before it settles in place (the arc
    // itself lives in drawRod, driven by this value).
    this.castProgress = 0;
    this.tweens.add({
      targets: this,
      castProgress: 1,
      duration: 550,
      ease: 'Cubic.easeOut'
    });

    this.time.delayedCall(Phaser.Math.Between(1000, 2200), () => this.onBite());
  }

  onBite() {
    if (this.state !== 'waiting') return;
    this.state = 'biting';
    this.pendingFishId = 'flathead';
    const fish = getFish(this.pendingFishId);

    // Every catch is its own size, rolled fresh - bigger ones weigh more AND
    // fight harder (both the required rotation and the decay scale with the
    // same roll as the weight), so a big fish is a heavier, meaningfully
    // tougher fight instead of just "the same fish, more of it".
    const sizeRoll = Phaser.Math.FloatBetween(0.75, 1.75);
    const sizeLabel = sizeRoll < 1.0 ? 'a small' : sizeRoll > 1.4 ? 'a big' : 'an average-sized';
    this.pendingWeightKg = Math.round(fish.baseWeightKg * sizeRoll * 10) / 10;
    this.showMessage(`${sizeLabel} ${fish.name} is on the line! Reel it in!`);
    this.castBtn.setLabel('Reeling...');
    this.castBtn.setEnabled(false);
    this.currentLinePull = 0;
    this.tugState.v = 0;
    this.scheduleTug();

    this.reelRotation = 0;
    this.reelRequired = fish.turnsRequired * Math.PI * 2 * sizeRoll;
    this.reelDecayPerSecond = fish.decayPerSecond * sizeRoll;
    this.reelHandleAngle = 0;
    this.reelLastX = null;
    this.reelLastY = null;
    this.reelDeadline = this.time.now + REEL_TIME_LIMIT;
    this.reelWheelG.setVisible(true);
    this.reelHint.setVisible(true);
    this.redrawReelWheel();
  }

  // Schedules the next sharp tug on the line after a random pause - real
  // fish don't pull on a steady rhythm, they jerk unpredictably. Purely
  // visual flavor (rod bend/hand dip) - independent of the reel wheel's
  // actual win/lose logic.
  scheduleTug() {
    if (this.state !== 'biting') return;
    this.tugTimer = this.time.delayedCall(Phaser.Math.Between(150, 550), () => this.doTug());
  }

  // One tug: a sharp, fast yank down, then a slightly slower ease back to
  // rest, with a random strength each time - then schedules the next one.
  doTug() {
    if (this.state !== 'biting') return;
    const strength = Phaser.Math.FloatBetween(0.45, 1);
    this.tweens.add({
      targets: this.tugState,
      v: strength,
      duration: Phaser.Math.Between(60, 120),
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        this.currentLinePull = this.tugState.v;
      },
      onComplete: () => {
        this.tweens.add({
          targets: this.tugState,
          v: 0,
          duration: Phaser.Math.Between(150, 260),
          ease: 'Sine.easeIn',
          onUpdate: () => {
            this.currentLinePull = this.tugState.v;
          },
          onComplete: () => this.scheduleTug()
        });
      }
    });
  }

  // The circular reel control: move the mouse (or a finger) around near it,
  // like actually cranking a real reel handle. Tracks plain pointer
  // movement - no click-and-hold required. Progress is driven by raw
  // distance the pointer travels (converted to an equivalent rotation via
  // arc-length = radius * angle), not by computing the angle around the
  // wheel's center and diffing it frame to frame - the angle-based version
  // still weirdly failed in real play even after dropping the click
  // requirement, and distance is both simpler (no wraparound math, no
  // dead-zone/max-radius cutoffs that can silently eat real movement) and
  // far more forgiving of an imprecise, not-quite-circular real mouse path.
  setupReelWheel() {
    this.reelWheelG = this.add.graphics().setVisible(false);
    this.reelHint = this.add
      .text(REEL_WHEEL_X, REEL_WHEEL_Y - REEL_WHEEL_RADIUS - 24, 'Move in circles to reel it in!', subheading('16px'))
      .setOrigin(0.5)
      .setVisible(false);

    // No hit zone needed - this just reads every pointermove over the whole
    // canvas while biting, whether or not a button is held.
    this.reelLastX = null;
    this.reelLastY = null;

    this.input.on('pointermove', (pointer) => {
      if (this.state !== 'biting') return;
      if (this.reelLastX === null) {
        this.reelLastX = pointer.worldX;
        this.reelLastY = pointer.worldY;
        return;
      }
      const moved = Math.hypot(pointer.worldX - this.reelLastX, pointer.worldY - this.reelLastY);
      this.reelRotation = Phaser.Math.Clamp(this.reelRotation + moved / REEL_WHEEL_RADIUS, 0, this.reelRequired);
      this.reelHandleAngle = Math.atan2(pointer.worldY - REEL_WHEEL_Y, pointer.worldX - REEL_WHEEL_X);
      this.reelLastX = pointer.worldX;
      this.reelLastY = pointer.worldY;
    });
  }

  redrawReelWheel() {
    const g = this.reelWheelG;
    g.clear();

    // Outer track.
    g.lineStyle(6, 0x0c2430, 0.4);
    g.strokeCircle(REEL_WHEEL_X, REEL_WHEEL_Y, REEL_WHEEL_RADIUS);

    // Progress arc - how much line has been reeled in.
    const progress = this.reelRequired > 0 ? this.reelRotation / this.reelRequired : 0;
    if (progress > 0.001) {
      g.lineStyle(8, 0x4ad991, 0.95);
      g.beginPath();
      g.arc(REEL_WHEEL_X, REEL_WHEEL_Y, REEL_WHEEL_RADIUS, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
      g.strokePath();
    }

    // Center hub, and a handle knob orbiting it - spins as the player drags
    // in circles, so the cranking motion itself is visible.
    g.fillStyle(0x1f6f8b, 1);
    g.fillCircle(REEL_WHEEL_X, REEL_WHEEL_Y, 14);
    g.lineStyle(3, 0x0c2430, 0.6);
    g.strokeCircle(REEL_WHEEL_X, REEL_WHEEL_Y, 14);

    const hx = REEL_WHEEL_X + Math.cos(this.reelHandleAngle) * (REEL_WHEEL_RADIUS - 10);
    const hy = REEL_WHEEL_Y + Math.sin(this.reelHandleAngle) * (REEL_WHEEL_RADIUS - 10);
    g.lineStyle(4, 0xffe17d, 1);
    g.beginPath();
    g.moveTo(REEL_WHEEL_X, REEL_WHEEL_Y);
    g.lineTo(hx, hy);
    g.strokePath();
    g.fillStyle(0xffe17d, 1);
    g.fillCircle(hx, hy, 6);
  }

  hideReelWheel() {
    this.reelWheelG.setVisible(false);
    this.reelHint.setVisible(false);
    this.reelLastX = null;
    this.reelLastY = null;
  }

  landFish() {
    this.state = 'result';
    this.landedFish = this.pendingFishId;
    this.hideReelWheel();
    this.castBtn.setEnabled(false);

    if (this.tugTimer) {
      this.tugTimer.remove(false);
      this.tugTimer = null;
    }
    this.tweens.killTweensOf(this.tugState);
    this.currentLinePull = 0;

    const snap = { bend: 26 };
    this.tweens.add({
      targets: snap,
      bend: 0,
      duration: 550,
      ease: 'Elastic.easeOut',
      onUpdate: () => {
        this.currentBend = snap.bend;
      }
    });

    const fish = getFish(this.landedFish);
    GameState.addItem(fish.id, 1);
    this.showMessage(`Caught a ${this.pendingWeightKg}kg ${fish.name}!`);
    this.statusBar.refresh();

    this.time.delayedCall(1400, () => this.resetToIdle());
  }

  loseFish() {
    this.state = 'result';
    this.landedFish = null;
    this.hideReelWheel();
    this.castBtn.setEnabled(false);

    if (this.tugTimer) {
      this.tugTimer.remove(false);
      this.tugTimer = null;
    }
    this.tweens.killTweensOf(this.tugState);
    this.currentLinePull = 0;

    const snap = { bend: 14 };
    this.tweens.add({
      targets: snap,
      bend: 0,
      duration: 350,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        this.currentBend = snap.bend;
      }
    });

    this.showMessage('The fish got away...');
    this.time.delayedCall(1400, () => this.resetToIdle());
  }

  resetToIdle() {
    this.state = 'idle';
    this.castBtn.setLabel('Cast Line');
    this.castBtn.setEnabled(true);
    this.setNavEnabled(true);
    this.showMessage('');

    // Reel the hook back up to the rod tip so it's ready to cast again -
    // whatever's dangling on it (the caught fish) disappears once it
    // reaches the tip, as if collected right then.
    this.tweens.add({
      targets: this,
      castProgress: 0,
      duration: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.landedFish = null;
      }
    });
  }

  setNavEnabled(value) {
    this.shopIconBtn.setEnabled(value);
    this.bagIconBtn.setEnabled(value);
  }

  showMessage(text) {
    this.messageText.setText(text);
  }

  update(time, delta) {
    this.waveT += delta * 0.001;
    this.renderScenery(this.waveT);

    // Gentle rocking, synced to the same wave clock as the calmer sea - only
    // the boat rocks; a stickman standing on solid ground (ledge or lake
    // shore) stays put.
    if (this.rocks) {
      this.rigContainer.rotation = Math.sin(this.waveT * 1.3) * 0.02;
      this.rigContainer.y = this.rigBaseY + Math.sin(this.waveT * 1.3 + 0.6) * 2;
    }

    if (this.state === 'biting') {
      // Passive decay - the fish pulls back if you're not actively
      // cranking, so standing still isn't a safe strategy.
      this.reelRotation = Math.max(0, this.reelRotation - this.reelDecayPerSecond * (delta / 1000));
      this.redrawReelWheel();

      if (this.reelRotation >= this.reelRequired) {
        this.landFish();
      } else if (time > this.reelDeadline) {
        this.loseFish();
      }

      // Steady base tension; the sharp, randomly-timed tugs (scheduled via
      // scheduleTug/doTug) drive this.currentLinePull independently.
      this.currentBend = 6;
    }

    // The stickman's hand dips down a little with each tug too, matched to
    // the offset drawRod applies to the grip point so the hand stays glued
    // to the handle - kept subtle so the character doesn't bounce around.
    this.bodyG.y = this.currentLinePull * 2.5;

    // Redrawn every frame (not just while biting) since the rod rocks with
    // the boat and the line's underwater fade tracks the animated sea.
    this.drawRod(this.currentBend, this.currentLinePull);
  }
}
