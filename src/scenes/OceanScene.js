import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { getCatchable } from '../data/catchables.js';
import { currentUpgrade } from '../data/upgradeData.js';
import { createIconButton, drawShopIcon, drawBagIcon } from '../ui/iconButton.js';
import { addStatusBar } from '../ui/fishIcon.js';
import {
  drawHook,
  drawPrawn,
  drawFlathead,
  drawSalmon,
  drawMullet,
  drawBream,
  drawTuna,
  drawTailor,
  drawTrevally,
  drawKingfish,
  drawWhiting,
  drawGreatWhite,
  drawTigerShark,
  drawBullShark,
  drawOldBoot
} from '../ui/tackle.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { shadeColor, buildSeaPolygon, drawSunGlow } from '../ui/oceanArt.js';
import { subheading, label } from '../ui/textStyle.js';

const DRAWERS = {
  prawn: drawPrawn,
  flathead: drawFlathead,
  salmon: drawSalmon,
  mullet: drawMullet,
  bream: drawBream,
  tuna: drawTuna,
  tailor: drawTailor,
  trevally: drawTrevally,
  kingfish: drawKingfish,
  whiting: drawWhiting,
  great_white: drawGreatWhite,
  tiger_shark: drawTigerShark,
  bull_shark: drawBullShark,
  old_boot: drawOldBoot
};

// Modest, natural-looking scale for whatever's actually dangling on the
// hook while fishing - NOT the big dramatic scale used for the catch
// reveal below.
const BAIT_HOOK_SCALE = {
  prawn: 0.34,
  flathead: 0.42,
  salmon: 0.4,
  mullet: 0.42,
  bream: 0.38,
  tuna: 0.36,
  tailor: 0.42,
  trevally: 0.4,
  kingfish: 0.38,
  whiting: 0.3,
  great_white: 0.3,
  tiger_shark: 0.28,
  bull_shark: 0.29,
  old_boot: 0.55
};

// A big, celebratory scale used only for the moment-of-catch reveal at
// screen center - this is where a shark gets to look genuinely enormous.
const REVEAL_SCALE = {
  prawn: 0.9,
  flathead: 0.9,
  salmon: 0.85,
  mullet: 0.9,
  bream: 0.85,
  tuna: 0.75,
  tailor: 0.95,
  trevally: 0.85,
  kingfish: 0.88,
  whiting: 0.65,
  great_white: 1.3,
  tiger_shark: 1.15,
  bull_shark: 1.2,
  old_boot: 1.1
};

// Base swimming size and speed (world px/sec) per species, tuned by feel -
// bigger/predatory fish are a bit faster. Sharks are deliberately huge -
// same "roughly as long as the character" scale established earlier -
// unmistakable the moment one shows up, not just another fish shape.
const SWIM_SCALE = {
  flathead: 0.5,
  salmon: 0.48,
  mullet: 0.5,
  bream: 0.48,
  tuna: 0.42,
  tailor: 0.5,
  trevally: 0.46,
  kingfish: 0.5,
  whiting: 0.36,
  great_white: 1.15,
  tiger_shark: 1.0,
  bull_shark: 1.05,
  old_boot: 0.5
};
const SWIM_SPEED = {
  flathead: 40,
  salmon: 55,
  mullet: 45,
  bream: 42,
  tuna: 50,
  tailor: 60,
  trevally: 55,
  kingfish: 58,
  whiting: 38,
  great_white: 48,
  tiger_shark: 52,
  bull_shark: 46,
  old_boot: 18
};

// Every regular fish spawns evenly from this pool (no Seaweed anymore).
const NORMAL_POOL = [
  'flathead',
  'salmon',
  'mullet',
  'bream',
  'tuna',
  'tailor',
  'trevally',
  'kingfish',
  'whiting',
  'old_boot'
];
// Sharks only ever get rolled for when one of these is equipped as bait,
// and only once the hook is past SHARK_MIN_DEPTH - which sits below the
// starting line's own max reach entirely, so a shark genuinely can't turn
// up until at least one line upgrade has been bought - and even then it's
// a long shot (same odds the old cast-based bite used).
const LARGE_BAIT_IDS = ['salmon', 'tuna'];
const GREAT_WHITE_CHANCE = 0.08;
const TIGER_SHARK_CHANCE = 0.14;
const BULL_SHARK_CHANCE = 0.12;
const SHARK_MIN_DEPTH = 1000;

const WATERLINE_Y = 340; // matches TitleScene, so the dive starts from the identical framing
const SKY_COLOR = 0x9fd9f0;
const SURFACE_WATER_COLOR = 0x3fa9e0;
const DEEP_WATER_COLOR = 0x041423;
const DIVE_TARGET_SCROLL = 420; // how far the camera sinks before "fully submerged"

const HOOK_FOLLOW_EASE = 0.22;
const CAMERA_FOLLOW_EASE = 0.06;
const CAMERA_VIEW_OFFSET = 0.35;
const WHEEL_DEPTH_FACTOR = 0.6;

// Regular fish flee a hook moving faster than this (world px/frame-ish);
// sharks and the Boot ignore this entirely - a shark isn't spooked by
// thrashing bait, and junk isn't alive to be scared at all.
const FLEE_SPEED_THRESHOLD = 5.5;
const FLEE_RADIUS = 130;
const ATTRACT_RADIUS = 170;
const STILL_ATTRACT_RADIUS = 55;
const CATCH_RADIUS = 26;
const CALM_SPEED = 1.5;
const STILL_SPEED = 0.4;
// ~0.006 used to work out to roughly a 30%-per-second bite chance with no
// bait at all - nearly as fast as fishing with bait, which made bait feel
// pointless. This is tuned to a much rarer "got lucky" bite instead (~6%/sec).
const STILL_BITE_CHANCE_PER_TICK = 0.001;
const BOOT_ATTACH_CHANCE_PER_TICK = 0.01;

const MAX_FISH = 6;
const SPAWN_MIN_MS = 1400;
const SPAWN_MAX_MS = 2800;

// The hook reels straight up off the top of the screen once something's
// caught - depthPx away, so the trip is quick from shallow water and still
// stays bounded (never "20 years") from deep water, since the clamp caps it.
const REEL_UP_MIN_MS = 400;
const REEL_UP_MAX_MS = 2200;
const REEL_UP_MS_PER_PX = 0.4;
const HOOK_DROP_MS = 700;

function lerpColor(colorA, colorB, t) {
  const a = Phaser.Display.Color.IntegerToColor(colorA);
  const b = Phaser.Display.Color.IntegerToColor(colorB);
  const r = Math.round(a.red + (b.red - a.red) * t);
  const g = Math.round(a.green + (b.green - a.green) * t);
  const bl = Math.round(a.blue + (b.blue - a.blue) * t);
  return Phaser.Display.Color.GetColor(r, g, bl);
}

// Real open water stays basically the same bright blue for a long stretch
// before gradually dimming - not a rapid fade over your whole reachable
// depth. Uses a fixed absolute depth curve (not relative to how deep your
// current line can reach), so buying a longer line doesn't change how
// deep "still bright" or "fully dark" actually are.
const TINT_PLATEAU_PX = 700; // ~58m - stays essentially surface-colored this far down
const TINT_FULL_DARK_PX = 2800; // ~233m - reaches full darkness at this depth

function colorAtDepth(depthPx) {
  if (depthPx <= TINT_PLATEAU_PX) return SURFACE_WATER_COLOR;
  const t = Phaser.Math.Clamp((depthPx - TINT_PLATEAU_PX) / (TINT_FULL_DARK_PX - TINT_PLATEAU_PX), 0, 1);
  return lerpColor(SURFACE_WATER_COLOR, DEEP_WATER_COLOR, t * t);
}

export default class OceanScene extends Phaser.Scene {
  constructor() {
    super('OceanScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;

    this.waveT = 0;
    this.phase = 'diving';
    this.landedCatch = null;
    this.maxDepthPx = currentUpgrade(GameState.lineLengthTier).maxDepth;
    this.depthOrigin = 0;
    // How far "down" the world content is currently scrolled - NOT real
    // camera scroll. Every other scene positions its UI using the
    // setZoom+centerOn trick (see below), which permanently offsets the
    // camera's actual scroll to a non-zero baseline; real camera scrolling
    // on top of that would silently break every button's position (that
    // baseline is exactly what setScrollFactor(0) would cancel out). So
    // "diving deeper" is simulated by translating a dedicated world
    // container instead, leaving the camera itself untouched and every
    // fixed-position HUD element working exactly like it does everywhere
    // else in this game.
    this.scroll = { y: 0 };
    this.swimmers = [];
    this.nextSwimmerId = 1;
    this.hook = { x: width / 2, y: 0 };
    this.hookSpeed = 0;
    this.pointerActive = false;
    this.pointerTargetX = this.hook.x;
    this.pointerTargetY = this.hook.y;

    this.worldContainer = this.add.container(0, 0);

    // Depth-tinted water fills the whole world, redrawn every frame from
    // the current view band - cheap (one rect) and needs no giant
    // pre-rendered texture.
    this.waterG = this.add.graphics();
    this.worldContainer.add(this.waterG);

    // The exact same sky/sea/sun composition as TitleScene, positioned at
    // the top of the world - diving is just this content sliding up out of
    // view into the water drawn by waterG.
    this.skyG = this.add.graphics();
    const skyTop = shadeColor(SKY_COLOR, 0.85);
    const skyBottom = shadeColor(SKY_COLOR, 1.2);
    this.skyG.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
    this.skyG.fillRect(0, 0, width, WATERLINE_Y + 260);
    this.worldContainer.add(this.skyG);
    const sunG = this.add.graphics();
    drawSunGlow(sunG, 800, 110);
    this.worldContainer.add(sunG);
    this.seaG = this.add.graphics();
    this.worldContainer.add(this.seaG);
    this.renderSurfaceSea(0);

    this.fishG = this.add.graphics();
    this.worldContainer.add(this.fishG);
    this.hookG = this.add.graphics();
    this.worldContainer.add(this.hookG);

    this.statusBar = addStatusBar(this, GameState);
    this.depthText = this.add.text(34, 118, '', label('14px', { color: '#bfe9ff' }));
    this.messageText = this.add.text(width / 2, 60, '', subheading('16px')).setOrigin(0.5);

    createIconButton(this, width - 40, 92, 22, drawBagIcon, () => this.scene.start('InventoryScene'));
    createIconButton(this, width - 95, 92, 22, drawShopIcon, () => this.scene.start('ShopScene'));

    this.input.on('pointermove', (pointer) => {
      if (this.phase !== 'playing') return;
      this.pointerTargetX = pointer.worldX;
      this.pointerTargetY = pointer.worldY + this.scroll.y;
      this.pointerActive = true;
    });

    this.input.on('wheel', (pointer, over, dx, dy) => {
      if (this.phase !== 'playing') return;
      this.pointerTargetY = Phaser.Math.Clamp(
        this.pointerTargetY + dy * WHEEL_DEPTH_FACTOR,
        this.depthOrigin,
        this.depthOrigin + this.maxDepthPx
      );
      this.pointerActive = true;
    });

    this.startDive();
  }

  renderSurfaceSea(t) {
    this.seaG.clear();
    this.seaG.fillStyle(SURFACE_WATER_COLOR, 1);
    this.seaG.fillPoints(buildSeaPolygon(DESIGN_WIDTH, DESIGN_HEIGHT, WATERLINE_Y, t), true);
  }

  // Phase 1 - the view starts framed exactly like the title screen (sky
  // above, sea below) and sinks straight down until it's fully submerged.
  startDive() {
    this.phase = 'diving';
    this.tweens.add({
      targets: this.scroll,
      y: DIVE_TARGET_SCROLL,
      duration: 1500,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.depthOrigin = DIVE_TARGET_SCROLL;
        this.hook.y = this.depthOrigin;
        this.startHookDrop();
      }
    });
  }

  // Phase 2 - the hook and line drop in from above the top of the now-fully
  // -underwater screen down to a shallow resting depth.
  startHookDrop() {
    this.phase = 'dropping';
    this.hook.x = DESIGN_WIDTH / 2;
    this.hook.y = this.depthOrigin - 60;
    this.pointerTargetX = this.hook.x;
    this.pointerTargetY = this.depthOrigin + 90;
    this.tweens.add({
      targets: this.hook,
      y: this.depthOrigin + 90,
      duration: HOOK_DROP_MS,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.phase = 'playing';
        this.scheduleSpawn();
      }
    });
  }

  scheduleSpawn() {
    if (this.phase !== 'playing') return;
    this.spawnTimer = this.time.delayedCall(Phaser.Math.Between(SPAWN_MIN_MS, SPAWN_MAX_MS), () => {
      this.trySpawnFish();
      this.scheduleSpawn();
    });
  }

  pickSpawnId() {
    const baitId = GameState.equippedBait;
    const hookDepth = this.hook.y - this.depthOrigin;
    if (LARGE_BAIT_IDS.includes(baitId) && hookDepth >= SHARK_MIN_DEPTH) {
      const roll = Math.random();
      if (roll < GREAT_WHITE_CHANCE) return 'great_white';
      if (roll < GREAT_WHITE_CHANCE + TIGER_SHARK_CHANCE) return 'tiger_shark';
      if (roll < GREAT_WHITE_CHANCE + TIGER_SHARK_CHANCE + BULL_SHARK_CHANCE) return 'bull_shark';
    }
    return Phaser.Utils.Array.GetRandom(NORMAL_POOL);
  }

  trySpawnFish() {
    if (this.swimmers.length >= MAX_FISH) return;
    const itemId = this.pickSpawnId();
    const fromLeft = Math.random() < 0.5;
    const y = Phaser.Math.Clamp(
      this.scroll.y + Phaser.Math.Between(60, DESIGN_HEIGHT - 60),
      this.depthOrigin,
      this.depthOrigin + this.maxDepthPx
    );
    const x = fromLeft ? -40 : DESIGN_WIDTH + 40;
    const dirSign = fromLeft ? 1 : -1;
    const speed = SWIM_SPEED[itemId] || 40;
    // Repurposes each species' old reel-fight difficultyMultiplier as a
    // wariness factor now that there's no reel minigame to apply it to - a
    // rarer/tougher species (higher multiplier) spooks at a lower hook
    // speed than a common one does.
    const wariness = getCatchable(itemId).difficultyMultiplier || 1;
    this.swimmers.push({
      id: this.nextSwimmerId++,
      itemId,
      isBoot: itemId === 'old_boot',
      isShark: itemId === 'great_white' || itemId === 'tiger_shark' || itemId === 'bull_shark',
      wariness,
      spooked: false,
      x,
      y,
      vx: dirSign * speed,
      vy: Phaser.Math.FloatBetween(-6, 6),
      state: 'cruising',
      sizeRoll: Phaser.Math.FloatBetween(0.75, 1.75)
    });
  }

  updateHook() {
    const prevX = this.hook.x;
    const prevY = this.hook.y;
    if (this.pointerActive) {
      this.hook.x += (this.pointerTargetX - this.hook.x) * HOOK_FOLLOW_EASE;
      this.hook.y += (this.pointerTargetY - this.hook.y) * HOOK_FOLLOW_EASE;
    }
    this.hook.x = Phaser.Math.Clamp(this.hook.x, 24, DESIGN_WIDTH - 24);
    this.hook.y = Phaser.Math.Clamp(this.hook.y, this.depthOrigin, this.depthOrigin + this.maxDepthPx);
    this.hookSpeed = Phaser.Math.Distance.Between(prevX, prevY, this.hook.x, this.hook.y);
  }

  updateScroll() {
    const maxScroll = Math.max(this.depthOrigin, this.depthOrigin + this.maxDepthPx - DESIGN_HEIGHT);
    const target = Phaser.Math.Clamp(this.hook.y - DESIGN_HEIGHT * CAMERA_VIEW_OFFSET, this.depthOrigin, maxScroll);
    this.scroll.y += (target - this.scroll.y) * CAMERA_FOLLOW_EASE;
  }

  updateSwimmers(deltaMs) {
    const dt = deltaMs / 1000;
    const hook = this.hook;
    const hookIsCalm = this.hookSpeed <= CALM_SPEED;
    const hookIsStill = this.hookSpeed <= STILL_SPEED;
    const baitEquipped = !!GameState.equippedBait;

    for (let i = this.swimmers.length - 1; i >= 0; i -= 1) {
      const f = this.swimmers[i];
      const dx = hook.x - f.x;
      const dy = hook.y - f.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      // A more wary species (see trySpawnFish) spooks at a lower hook
      // speed than a common one does.
      const fleeThreshold = FLEE_SPEED_THRESHOLD / (f.wariness || 1);

      if (f.isBoot) {
        // Junk isn't alive - it never flees a fast hook, and it isn't
        // lured by bait either, but it can still drift in and attach
        // whenever it happens to be near the hook, any hook state.
        if (f.state !== 'attracted' && dist < STILL_ATTRACT_RADIUS + 30 && Math.random() < BOOT_ATTACH_CHANCE_PER_TICK) {
          f.state = 'attracted';
        }
      } else if (f.spooked) {
        // Once scared off by a fast-moving hook, a fish never trusts it
        // again - no more bait attraction, no more still-hook luck, it
        // just keeps clearing out until it swims off and despawns.
        f.state = 'fleeing';
      } else if (!f.isShark && this.hookSpeed > fleeThreshold && dist < FLEE_RADIUS) {
        f.state = 'fleeing';
        f.spooked = true;
      } else if (baitEquipped && hookIsCalm && dist < ATTRACT_RADIUS) {
        f.state = 'attracted';
      } else if (!baitEquipped && hookIsStill && dist < STILL_ATTRACT_RADIUS && f.state !== 'attracted') {
        if (Math.random() < STILL_BITE_CHANCE_PER_TICK) f.state = 'attracted';
      }

      if (f.state === 'attracted') {
        const speed = (SWIM_SPEED[f.itemId] || 40) * 1.3;
        f.vx = (dx / dist) * speed;
        f.vy = (dy / dist) * speed;
      } else if (f.state === 'fleeing') {
        const speed = (SWIM_SPEED[f.itemId] || 40) * 1.8;
        f.vx = -(dx / dist) * speed;
        f.vy = -(dy / dist) * speed;
      } else {
        f.vy = Phaser.Math.Clamp(f.vy + Phaser.Math.FloatBetween(-4, 4), -20, 20);
      }

      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.y = Phaser.Math.Clamp(f.y, this.depthOrigin, this.depthOrigin + this.maxDepthPx);

      if (f.state === 'attracted' && dist < CATCH_RADIUS) {
        this.catchFish(f);
        this.swimmers.splice(i, 1);
        continue;
      }

      if (f.x < -80 || f.x > DESIGN_WIDTH + 80) {
        this.swimmers.splice(i, 1);
      }
    }
  }

  // Whatever's biting gets reeled straight up off the top of the screen
  // before anything else happens - the deeper it was hooked, the faster
  // the hook travels, so a catch from way down doesn't take forever to
  // land (REEL_UP_MIN_MS/MAX_MS clamp the trip either way).
  catchFish(f) {
    const info = getCatchable(f.itemId);
    const weightKg = Math.round(info.baseWeightKg * f.sizeRoll * 10) / 10;
    const value = Math.max(1, Math.round(weightKg * info.valuePerKg));
    const depthPx = Math.max(0, this.hook.y - this.depthOrigin);

    this.phase = 'reeling';
    if (this.spawnTimer) this.spawnTimer.remove(false);
    this.landedCatch = { itemId: f.itemId, weightKg };

    const targetY = this.depthOrigin - 60;
    const duration = Phaser.Math.Clamp(depthPx * REEL_UP_MS_PER_PX, REEL_UP_MIN_MS, REEL_UP_MAX_MS);

    this.tweens.add({
      targets: this.hook,
      y: targetY,
      duration,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        if (GameState.equippedBait) {
          GameState.consumeEquippedBait();
        }
        GameState.addCatch(f.itemId, weightKg, value);
        this.statusBar.refresh();
        this.landedCatch = null;
        this.showCatchReveal(f.itemId, info.name, weightKg, value, () => this.startHookDrop());
      }
    });
  }

  showCatchReveal(itemId, name, weightKg, value, onDone) {
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    const cx = width / 2;
    const cy = height / 2 - 30;
    const g = this.add.graphics();
    const drawer = DRAWERS[itemId];
    const scale = REVEAL_SCALE[itemId] || 0.8;
    if (drawer) drawer(g, cx, cy, scale, 0, 1);

    const txt = this.add
      .text(cx, cy + 100, `Caught a ${weightKg}kg ${name}!\nWorth ~$${value}`, {
        ...subheading('18px', { color: '#ffe17d' }),
        align: 'center'
      })
      .setOrigin(0.5);

    g.setAlpha(0);
    txt.setAlpha(0);
    this.tweens.add({
      targets: [g, txt],
      alpha: 1,
      duration: 250,
      yoyo: true,
      hold: 1300,
      onComplete: () => {
        g.destroy();
        txt.destroy();
        onDone();
      }
    });
  }

  redrawWaterTint() {
    const topDepth = Math.max(0, this.scroll.y - this.depthOrigin);
    const bottomDepth = Math.max(0, this.scroll.y - this.depthOrigin + DESIGN_HEIGHT);
    const topColor = colorAtDepth(topDepth);
    const bottomColor = colorAtDepth(bottomDepth);
    this.waterG.clear();
    this.waterG.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    this.waterG.fillRect(0, this.scroll.y - 4, DESIGN_WIDTH, DESIGN_HEIGHT + 8);
  }

  redrawFishAndHook() {
    const g = this.fishG;
    g.clear();
    this.swimmers.forEach((f) => {
      const drawer = DRAWERS[f.itemId];
      if (!drawer) return;
      const facingRight = f.vx >= 0;
      const tilt = Phaser.Math.Clamp(f.vy / 80, -0.3, 0.3);
      const scale = (SWIM_SCALE[f.itemId] || 0.5) * Phaser.Math.Clamp(f.sizeRoll, 0.55, 1.9);
      g.save();
      g.translateCanvas(f.x, f.y);
      g.scaleCanvas(facingRight ? -1 : 1, 1);
      g.rotateCanvas(tilt);
      drawer(g, 0, 0, scale, 0, 1);
      g.restore();
    });

    const hg = this.hookG;
    hg.clear();
    if (this.phase !== 'diving') {
      hg.lineStyle(1.5, 0xf0f0f0, 0.85);
      hg.beginPath();
      hg.moveTo(this.hook.x, this.depthOrigin - 60);
      hg.lineTo(this.hook.x, this.hook.y);
      hg.strokePath();

      const dangle = Math.sin(this.waveT * 3) * 0.15;
      if (this.landedCatch && DRAWERS[this.landedCatch.itemId]) {
        // Whatever just got caught rides up on the hook during the reel-in,
        // instead of the bait that was there before it bit.
        const lc = this.landedCatch;
        const scale = (BAIT_HOOK_SCALE[lc.itemId] || 0.4) * Phaser.Math.Clamp(lc.weightKg / (getCatchable(lc.itemId).baseWeightKg || 1), 0.55, 1.9);
        DRAWERS[lc.itemId](hg, this.hook.x + 2, this.hook.y + 1, scale, dangle, 1);
      } else {
        const baitId = GameState.equippedBait;
        if (baitId && DRAWERS[baitId]) {
          const equippedCatch = GameState.data.catches.find((c) => c.uid === GameState.equippedCatchUid);
          const baitScale = BAIT_HOOK_SCALE[baitId] * (equippedCatch ? Phaser.Math.Clamp(equippedCatch.weightKg / (getCatchable(baitId).baseWeightKg || 1), 0.55, 1.9) : 1);
          DRAWERS[baitId](hg, this.hook.x + 2, this.hook.y + 1, baitScale, dangle, 1);
        }
      }
      drawHook(hg, this.hook.x, this.hook.y, 0.6, 0, 1);
    }
  }

  update(time, deltaMs) {
    this.waveT += deltaMs * 0.001;
    this.renderSurfaceSea(this.waveT);

    if (this.phase === 'playing') {
      this.updateHook();
      this.updateScroll();
      this.updateSwimmers(deltaMs);
      const depthM = Math.round((this.hook.y - this.depthOrigin) / 12);
      this.depthText.setText(`Depth: ${depthM}m`);
    }

    // Everything "underwater" (sky/sea/water tint/fish/hook) lives in
    // worldContainer at absolute content coordinates - shifting the whole
    // container by -scroll.y each frame is what makes diving/descending
    // actually move the view, while every fixed-position HUD element
    // (status bar, nav icons, depth text) stays exactly where it always is.
    this.worldContainer.y = -this.scroll.y;

    this.redrawWaterTint();
    this.redrawFishAndHook();
  }
}
