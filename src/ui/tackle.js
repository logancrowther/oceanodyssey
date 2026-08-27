import Phaser from 'phaser';

// Phaser's Graphics API has no quadraticBezierTo path-building method (that
// only exists on Phaser.Curves.Path, a completely different class) - this
// samples a quadratic Bezier curve as a short run of straight lineTo
// segments instead, given the already-current pen position (x0,y0) from the
// moveTo/lineTo immediately before it. Used everywhere a fish needs a
// genuinely curved stroke or fill edge.
function quadCurveTo(g, x0, y0, cx, cy, x1, y1, steps = 10) {
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    g.lineTo(x, y);
  }
}

// A properly modeled fish hook - eye, straight shank, curved bend, barbed
// point - instead of a three-point squiggle. The bend is built as explicit
// sampled points around the circle rather than a canvas arc() call, so the
// sweep direction is never ambiguous (an earlier arc()-based version swept
// the wrong way and curled up over the top instead of down through the
// bottom, reading as backwards). Drawn with Graphics'
// save/translateCanvas/rotateCanvas/restore so it can be "stamped" at any
// position/rotation onto a shared Graphics object (the rod's, redrawn every
// frame) without needing its own Container.
export function drawHook(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;
  const color = 0x555a5e;

  // Eye, where the line ties on.
  g.lineStyle(2.2 * s, color, alpha);
  g.strokeCircle(0, -15 * s, 2.6 * s);

  // Shank straight down from the eye, then a smooth bend sweeping through
  // the bottom of a circle and back up into the point - a normal J-curve,
  // not a loop over the top.
  const bendCX = 7 * s;
  const bendCY = 3 * s;
  const bendR = 7 * s;
  const points = [
    { x: 0, y: -12.4 * s },
    { x: 0, y: bendCY }
  ];
  const steps = 20;
  const startDeg = 180;
  const endDeg = -35;
  for (let i = 1; i <= steps; i += 1) {
    const deg = startDeg + (endDeg - startDeg) * (i / steps);
    const rad = Phaser.Math.DegToRad(deg);
    points.push({ x: bendCX + Math.cos(rad) * bendR, y: bendCY + Math.sin(rad) * bendR });
  }

  g.lineStyle(2.2 * s, color, alpha);
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((p) => g.lineTo(p.x, p.y));
  g.strokePath();

  // Barb, a small flick just behind the point, angled back against the
  // curve's own direction of travel.
  const tip = points[points.length - 1];
  const tipRad = Phaser.Math.DegToRad(endDeg);
  const barbAngle = tipRad + Math.PI * 0.65;
  g.beginPath();
  g.moveTo(tip.x, tip.y);
  g.lineTo(tip.x + Math.cos(barbAngle) * 3.5 * s, tip.y + Math.sin(barbAngle) * 3.5 * s);
  g.strokePath();

  g.restore();
}

// A curled prawn/shrimp, modeled to actually look like the animal - a
// segmented curled body, a fanned tail, a rounded head with a pointed
// rostrum and an eye, thin trailing antennae, and a few small legs. Pale
// pinkish-grey, like a raw/live prawn, not the bright orange of a cooked one.
export function drawPrawn(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xcf9e8f;
  const darkColor = 0xa8776a;
  const shellLine = 0x8a5c50;

  // Curved centerline the body curls along - head at one end, tail at the
  // other.
  const centerR = 13 * s;
  const startA = Math.PI * 0.15;
  const endA = Math.PI * 1.55;
  const steps = 8;
  const spine = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = startA + (endA - startA) * (i / steps);
    spine.push({ x: Math.cos(a) * centerR, y: Math.sin(a) * centerR });
  }

  // Body segments - overlapping plates shrinking toward the tail, each with
  // a shell-line stroke so they read as separate armor rings, not one tube.
  for (let i = 0; i < spine.length - 1; i += 1) {
    const p0 = spine[i];
    const p1 = spine[i + 1];
    const w = (7 - i * 0.55) * s;
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * w;
    const ny = (dx / len) * w;
    const quad = [
      { x: p0.x + nx, y: p0.y + ny },
      { x: p1.x + nx * 0.9, y: p1.y + ny * 0.9 },
      { x: p1.x - nx * 0.9, y: p1.y - ny * 0.9 },
      { x: p0.x - nx, y: p0.y - ny }
    ];
    g.fillStyle(i % 2 === 0 ? bodyColor : darkColor, alpha);
    g.fillPoints(quad, true);
    g.lineStyle(1 * s, shellLine, 0.6 * alpha);
    g.strokePoints([quad[0], quad[1]], false);
  }

  // Head - a rounded blob with a small pointed rostrum and a dark eye dot.
  const head = spine[0];
  g.fillStyle(bodyColor, alpha);
  g.fillCircle(head.x, head.y, 7 * s);
  g.fillTriangle(
    head.x - 8 * s, head.y - 2 * s,
    head.x - 8 * s, head.y + 2 * s,
    head.x - 14 * s, head.y
  );
  g.fillStyle(0x2a1a16, alpha);
  g.fillCircle(head.x - 2 * s, head.y - 2 * s, 1.4 * s);

  // Thin trailing antennae.
  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.beginPath();
  g.moveTo(head.x - 6 * s, head.y - 3 * s);
  g.lineTo(head.x - 20 * s, head.y - 10 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(head.x - 6 * s, head.y + 3 * s);
  g.lineTo(head.x - 18 * s, head.y + 9 * s);
  g.strokePath();

  // Small legs along the inner curve of the body.
  g.lineStyle(0.8 * s, darkColor, 0.7 * alpha);
  [2, 4, 6].forEach((i) => {
    const p = spine[i];
    if (!p) return;
    g.beginPath();
    g.moveTo(p.x, p.y);
    g.lineTo(p.x + 2 * s, p.y + 6 * s);
    g.strokePath();
  });

  // Tail fan, at the end of the spine.
  const tail = spine[spine.length - 1];
  const tailPrev = spine[spine.length - 2];
  const tdx = tail.x - tailPrev.x;
  const tdy = tail.y - tailPrev.y;
  const tlen = Math.hypot(tdx, tdy) || 1;
  const tux = tdx / tlen;
  const tuy = tdy / tlen;
  const tpx = -tuy;
  const tpy = tux;
  g.fillStyle(darkColor, alpha);
  g.fillTriangle(
    tail.x, tail.y,
    tail.x + tux * 8 * s + tpx * 5 * s, tail.y + tuy * 8 * s + tpy * 5 * s,
    tail.x + tux * 8 * s - tpx * 5 * s, tail.y + tuy * 8 * s - tpy * 5 * s
  );

  g.restore();
}

// A small soft-plastic swimbait, molded in a single flat, solid yellow
// (unlike any real bait's shading, a moulded lure is one uniform colour)
// - a small generic baitfish shape with a flat paddle tail instead of a
// forked one, a moulded gill crease instead of any real fin structure,
// and a single jig hook piercing straight up through its back instead of
// the Prawn/Squid's own hookless flesh. Never rigged with the old dangle
// wobble every real bait gets on the hook (see OceanScene) - a solid
// plastic lure hangs still, it doesn't wriggle.
export function drawPlasticLure(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xf5d520;
  const bodyDark = 0xd4a800;
  const darkColor = 0x2a2410;
  const hookColor = 0x8c8c90;

  const body = [
    { x: -10, y: 0 },
    { x: -7, y: -4.5 },
    { x: -1, y: -6 },
    { x: 6, y: -4 },
    { x: 6, y: 4 },
    { x: -1, y: 6 },
    { x: -7, y: 4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // A flat paddle tail - the real soft-plastic swimbait's own
  // distinguishing feature, unlike any actual fish's forked tail.
  g.fillStyle(bodyDark, alpha);
  g.fillTriangle(6 * s, 0, 15 * s, -5 * s, 15 * s, 5 * s);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(6 * s, 0, 15 * s, -5 * s, 15 * s, 5 * s);

  // A moulded gill crease line, standing in for any real fin structure.
  g.lineStyle(0.7 * s, bodyDark, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-4 * s, -5 * s);
  g.lineTo(-2 * s, 5 * s);
  g.strokePath();

  // Small bead eye.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-6 * s, -1 * s, 1.1 * s);

  // A single jig hook piercing straight up through the back - the real
  // rigging for a soft-plastic swimbait like this, not a dangling treble.
  g.lineStyle(1 * s, hookColor, 0.9 * alpha);
  g.beginPath();
  g.moveTo(-1 * s, -5 * s);
  g.lineTo(-1 * s, -11 * s);
  quadCurveTo(g, -1 * s, -11 * s, 3 * s, -12 * s, 3 * s, -8 * s);
  g.strokePath();

  g.restore();
}

// The same small soft-plastic swimbait as the Plastic Lure right above -
// identical shape, rigging, and stillness on the hook - just moulded in a
// shimmering gold instead of plain yellow, and radiating its own soft
// glow the way the Abyssal Bait does. A rarer, fancier cousin of the
// same lure, not a different design.
export function drawShimmeringLure(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xffd84a;
  const bodyDark = 0xc99000;
  const darkColor = 0x3a2c08;
  const hookColor = 0x8c8c90;
  const glowColor = 0xffe680;

  // A soft golden glow behind the shell - the same layered-translucent
  // -circles trick used for the Abyssal Bait/catch-reveal glows.
  [
    [9, 0.1],
    [6.5, 0.16],
    [4, 0.26]
  ].forEach(([r, a]) => {
    g.fillStyle(glowColor, a * alpha);
    g.fillCircle(0, 0, r * s);
  });

  const body = [
    { x: -10, y: 0 },
    { x: -7, y: -4.5 },
    { x: -1, y: -6 },
    { x: 6, y: -4 },
    { x: 6, y: 4 },
    { x: -1, y: 6 },
    { x: -7, y: 4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(bodyDark, alpha);
  g.fillTriangle(6 * s, 0, 15 * s, -5 * s, 15 * s, 5 * s);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(6 * s, 0, 15 * s, -5 * s, 15 * s, 5 * s);

  g.lineStyle(0.7 * s, bodyDark, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-4 * s, -5 * s);
  g.lineTo(-2 * s, 5 * s);
  g.strokePath();

  // A bright glinting bead eye - shimmering, unlike the Plastic Lure's
  // plain dark one.
  g.fillStyle(0xfff6d0, alpha);
  g.fillCircle(-6 * s, -1 * s, 1.1 * s);
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-6 * s, -1 * s, 0.5 * s);

  g.lineStyle(1 * s, hookColor, 0.9 * alpha);
  g.beginPath();
  g.moveTo(-1 * s, -5 * s);
  g.lineTo(-1 * s, -11 * s);
  quadCurveTo(g, -1 * s, -11 * s, 3 * s, -12 * s, 3 * s, -8 * s);
  g.strokePath();

  g.restore();
}

// A glowing abyssal jig - not organic bait at all, a small dark artificial
// lure built around a real photophore-style glowing core (the same
// bioluminescent-lure trick the Dragonfish itself uses to hunt, borrowed
// here since the bait is meant to work by imitating exactly that). Spiny,
// dark, and radiating its own soft light - nothing else in the tackle box
// looks remotely like it.
export function drawAbyssalBait(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const shellColor = 0x151022;
  const darkColor = 0x040308;
  const glowColor = 0x6ad8f0;
  const glowCore = 0xd8f8ff;
  const hookColor = 0x6a6a72;

  // A soft radiating glow behind the shell - the same layered-translucent
  // -circles trick used for the catch-reveal glow, just small and local.
  [
    [7, 0.12],
    [5, 0.2],
    [3, 0.32]
  ].forEach(([r, a]) => {
    g.fillStyle(glowColor, a * alpha);
    g.fillCircle(0, 0, r * s);
  });

  // A small, dark, spiny ovoid shell around the glowing core.
  const shell = [
    { x: -8, y: 0 },
    { x: -6, y: -5 },
    { x: 0, y: -7 },
    { x: 6, y: -4 },
    { x: 8, y: 0 },
    { x: 6, y: 4 },
    { x: 0, y: 7 },
    { x: -6, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(shellColor, alpha);
  g.fillPoints(shell, true);
  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(shell, true);

  // Thin spines radiating off the shell.
  g.lineStyle(0.8 * s, darkColor, 0.75 * alpha);
  [-2.4, -1.2, 0, 1.2, 2.4].forEach((angle) => {
    const dx = Math.cos(angle) * 12 * s;
    const dy = Math.sin(angle) * 12 * s;
    g.beginPath();
    g.moveTo(Math.cos(angle) * 6 * s, Math.sin(angle) * 6 * s);
    g.lineTo(dx, dy);
    g.strokePath();
  });

  // The glowing photophore core, visible through the shell.
  g.fillStyle(glowColor, 0.9 * alpha);
  g.fillCircle(0, 0, 2.6 * s);
  g.fillStyle(glowCore, alpha);
  g.fillCircle(0, 0, 1.2 * s);

  // A single barbed hook trailing off the back.
  g.lineStyle(1 * s, hookColor, 0.9 * alpha);
  g.beginPath();
  g.moveTo(8 * s, 0);
  quadCurveTo(g, 8 * s, 0, 15 * s, 3 * s, 13 * s, 8 * s);
  g.strokePath();

  g.restore();
}

// Deep Sea Bait - real bait, not a lure (no rigged hook, same as the
// Prawn/Squid it sits next to in the crate), cut from something pulled up
// from real depth: a single smooth, curled, tapering strip like the
// Squid's own, but dark, cold-toned flesh instead of pale pink, with a
// faint bioluminescent sheen along one edge and a couple of tiny glowing
// flecks - a real field mark of the deep, but understated next to the
// Abyssal Bait's own much brighter glow.
export function drawDeepSeaBait(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const fleshColor = 0x2c2438;
  const fleshDark = 0x1a1522;
  const darkColor = 0x0c0910;
  const glowColor = 0x6ad8c8;

  const centerR = 15 * s;
  const startA = Math.PI * 0.1;
  const endA = Math.PI * 1.35;
  const steps = 14;
  const spine = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = startA + (endA - startA) * (i / steps);
    spine.push({ x: Math.cos(a) * centerR, y: Math.sin(a) * centerR });
  }

  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i += 1) {
    const p0 = spine[Math.max(0, i - 1)];
    const p1 = spine[Math.min(steps, i + 1)];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (5 - (i / steps) * 4.2) * s;
    left.push({ x: spine[i].x + nx * w, y: spine[i].y + ny * w });
    right.push({ x: spine[i].x - nx * w, y: spine[i].y - ny * w });
  }
  const outline = left.concat(right.reverse());

  g.fillStyle(fleshColor, alpha);
  g.fillPoints(outline, true);
  g.fillStyle(fleshDark, 0.4 * alpha);
  g.fillPoints(left.concat(spine.slice().reverse()), true);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(outline, true);

  // A faint bioluminescent sheen along the outer edge - a real trait of
  // whatever this was cut from, not the Squid's own blood blush.
  g.lineStyle(1.4 * s, glowColor, 0.3 * alpha);
  g.beginPath();
  left.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
  g.strokePath();

  // A couple of tiny glowing flecks - understated next to the Abyssal
  // Bait's own much bigger, brighter glow.
  [4, 9].forEach((i) => {
    const p = spine[i];
    g.fillStyle(glowColor, 0.25 * alpha);
    g.fillCircle(p.x, p.y, 2 * s);
    g.fillStyle(glowColor, 0.8 * alpha);
    g.fillCircle(p.x, p.y, 0.7 * s);
  });

  g.restore();
}

// Colossal Bait - real bait, not a lure (no dangling treble, no moulded
// plastic - a genuine rigged deadbait), and built deliberately bulkier
// and deeper-bodied than anything else in the tackle box: a whole oily
// baitfish, silver-blue and scaled, rigged nose-to-tail on a single
// oversized hook - the real big-game trick of using a big whole fish to
// draw a bigger one in, not a small scrap of flesh like the rest.
export function drawColossalBait(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x8aa0b8;
  const backColor = 0x445868;
  const bellyColor = 0xd8e0e4;
  const darkColor = 0x1c2630;
  const hookColor = 0x8c8c90;

  // A deep, chunky whole-fish body - noticeably bulkier than the Deep Sea
  // Bait's thin strip or the Prawn/Squid's own slim curves.
  const body = [
    { x: -15, y: 0 },
    { x: -12, y: -6 },
    { x: -4, y: -9 },
    { x: 5, y: -8 },
    { x: 12, y: -5 },
    { x: 12, y: 5 },
    { x: 5, y: 8 },
    { x: -4, y: 9 },
    { x: -12, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A real forked tail - this is a whole fish, not a scrap.
  g.fillStyle(backColor, alpha);
  g.fillTriangle(11 * s, -3 * s, 20 * s, -8 * s, 14 * s, 0);
  g.fillTriangle(11 * s, 3 * s, 20 * s, 8 * s, 14 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(11 * s, -3 * s, 20 * s, -8 * s, 14 * s, 0);
  g.strokeTriangle(11 * s, 3 * s, 20 * s, 8 * s, 14 * s, 0);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Pale belly, dark oily-blue back - real baitfish countershading, the
  // opposite of Deep Sea Bait's own uniformly dark flesh.
  g.fillStyle(bellyColor, 0.75 * alpha);
  g.fillEllipse(-1 * s, 4 * s, 22 * s, 8 * s);
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillEllipse(-1 * s, -5 * s, 22 * s, 7 * s);
  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  // A row of faint scale lines - a whole real fish, not moulded plastic.
  g.lineStyle(0.6 * s, darkColor, 0.3 * alpha);
  [-8, -3, 2, 7].forEach((sx) => {
    g.beginPath();
    g.moveTo(sx * s, -6 * s);
    g.lineTo(sx * s, 6 * s);
    g.strokePath();
  });

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-10 * s, -1 * s, 1.3 * s);

  // The single oversized hook, rigged straight through the body nose to
  // tail - the real big-game deadbait rig, not a treble or a jig hook.
  g.lineStyle(1.3 * s, hookColor, 0.9 * alpha);
  g.beginPath();
  g.moveTo(-11 * s, 0);
  g.lineTo(9 * s, 0);
  quadCurveTo(g, 9 * s, 0, 16 * s, 2 * s, 13 * s, 9 * s);
  g.strokePath();

  g.restore();
}

// A cut squid tentacle bait - a single smooth, curled, tapering strip (not
// segmented armor plates like the Prawn's), with a row of small round
// sucker discs down the inner curve - the real bait's own unmistakable
// feature - in pale, translucent pinkish-white flesh with a faint blood
// blush at the cut end. Nothing shared with the Prawn beyond "curved bait
// shape" - no legs, no antennae, no shell segments, no tail fan.
export function drawSquid(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const fleshColor = 0xe8d6d2;
  const bloodColor = 0xc9a8a0;
  const suckerColor = 0xa8746a;
  const darkColor = 0x8a6058;

  // A single smooth, curled, tapering strip along a curved centerline -
  // real squid flesh has no segments or plates, just a smooth taper.
  const centerR = 15 * s;
  const startA = Math.PI * 0.1;
  const endA = Math.PI * 1.35;
  const steps = 14;
  const spine = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = startA + (endA - startA) * (i / steps);
    spine.push({ x: Math.cos(a) * centerR, y: Math.sin(a) * centerR });
  }

  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i += 1) {
    const p0 = spine[Math.max(0, i - 1)];
    const p1 = spine[Math.min(steps, i + 1)];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (5 - (i / steps) * 4.2) * s;
    left.push({ x: spine[i].x + nx * w, y: spine[i].y + ny * w });
    right.push({ x: spine[i].x - nx * w, y: spine[i].y - ny * w });
  }
  const outline = left.concat(right.reverse());

  g.fillStyle(fleshColor, alpha);
  g.fillPoints(outline, true);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokePoints(outline, true);

  // A faint blood blush near the wider cut end, like a real freshly-cut
  // piece of bait rather than a whole clean animal.
  g.fillStyle(bloodColor, 0.4 * alpha);
  g.fillEllipse(spine[0].x, spine[0].y, 9 * s, 7 * s);

  // The row of small round sucker discs down the inner curve - the real
  // bait's own unmistakable feature.
  g.fillStyle(suckerColor, 0.85 * alpha);
  for (let i = 2; i < steps - 1; i += 2) {
    const p = spine[i];
    g.fillCircle(p.x, p.y, 1.4 * s);
    g.lineStyle(0.6 * s, darkColor, 0.6 * alpha);
    g.strokeCircle(p.x, p.y, 1.4 * s);
  }

  g.restore();
}

// A flathead fish - the distinctive silhouette is a flat, low-profile head
// (eyes set high, almost froglike) with the body's dorsal hump rising up
// right behind it, tapering back to the tail - not a generic fish-emoji
// blob. Sandy/olive with darker mottled camouflage, matching a real
// bottom-dweller's coloring.
export function drawFlathead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const baseColor = 0xb0925f;
  const darkColor = 0x7a5f3a;
  const finColor = 0x8a6f45;

  const body = [
    { x: -32, y: -2 },
    { x: -22, y: -5 },
    { x: -11, y: -11 },
    { x: 0, y: -13 },
    { x: 11, y: -10 },
    { x: 20, y: -6 },
    { x: 27, y: -3 },
    { x: 27, y: 3 },
    { x: 20, y: 6 },
    { x: 10, y: 8 },
    { x: -2, y: 8 },
    { x: -15, y: 6 },
    { x: -28, y: 2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Tail fin, fanning out past the body's end.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -3 * s, 27 * s, 3 * s, 40 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(27 * s, -3 * s, 27 * s, 3 * s, 40 * s, 0);

  // Pectoral fin, just behind the head.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 4 * s, -14 * s, 14 * s, -2 * s, 8 * s);

  // Body.
  g.fillStyle(baseColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.4 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Mottled camouflage blotches - a bottom-dweller's sandy pattern.
  g.fillStyle(darkColor, 0.55 * alpha);
  [
    [-14, -4, 4],
    [-2, -6, 3.5],
    [8, -3, 3],
    [-8, 3, 3],
    [4, 4, 2.6]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 2 * s, br * 1.3 * s));

  // Eye, set high on the flat head - flathead eyes sit almost on top,
  // froglike, not on the side like most fish.
  g.fillStyle(0xf2e6c8, alpha);
  g.fillCircle(-21 * s, -6 * s, 2.6 * s);
  g.fillStyle(0x201510, alpha);
  g.fillCircle(-20.5 * s, -6 * s, 1.4 * s);

  g.restore();
}

// A mullet - a stouter, more cylindrical body than the Australian Salmon's, with a
// blunt rounded snout instead of a pointed one, two clearly separate dorsal
// fins (a small spiny one and a smaller soft one behind it, with a gap
// between - the classic mullet silhouette, not one continuous fin), and a
// handful of thin dark horizontal stripes running the length of the flank
// instead of scattered spots. Blue-grey back, silver sides, pale belly.
export function drawMullet(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc9d3d6;
  const backColor = 0x51606b;
  const bellyColor = 0xf2f5f2;
  const finColor = 0x8a97a0;
  const darkColor = 0x2b3338;
  const stripeColor = 0x3c4952;

  // Blunter, more rounded head than the Australian Salmon's pointed one, and a
  // stouter, more cylindrical midsection.
  const body = [
    { x: -30, y: 0 },
    { x: -29, y: -4 },
    { x: -22, y: -7 },
    { x: -10, y: -9 },
    { x: 2, y: -9 },
    { x: 12, y: -7 },
    { x: 20, y: -4 },
    { x: 26, y: -2 },
    { x: 26, y: 2 },
    { x: 20, y: 4 },
    { x: 12, y: 7 },
    { x: 2, y: 9 },
    { x: -10, y: 9 },
    { x: -22, y: 7 },
    { x: -29, y: 4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Moderately forked tail, out past the caudal peduncle.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -2 * s, 40 * s, -9 * s, 32 * s, 0);
  g.fillTriangle(26 * s, 2 * s, 40 * s, 9 * s, 32 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(26 * s, -2 * s, 40 * s, -9 * s, 32 * s, 0);
  g.strokeTriangle(26 * s, 2 * s, 40 * s, 9 * s, 32 * s, 0);

  // Pectoral, pelvic and anal fins - small and swept back.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-14 * s, 4 * s, -21 * s, 12 * s, -10 * s, 7 * s);
  g.fillTriangle(-2 * s, 8 * s, -6 * s, 15 * s, 4 * s, 9 * s);
  g.fillTriangle(12 * s, 6 * s, 16 * s, 12 * s, 20 * s, 7 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Blue-grey back band, following the top of the body's own profile.
  const topProfile = [
    { x: -29, y: -4 },
    { x: -22, y: -7 },
    { x: -10, y: -9 },
    { x: 2, y: -9 },
    { x: 12, y: -7 },
    { x: 20, y: -4 },
    { x: 26, y: -2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.8 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip along the bottom edge.
  const bottomProfile = [
    { x: -22, y: 7 },
    { x: -10, y: 9 },
    { x: 2, y: 9 },
    { x: 12, y: 7 },
    { x: 20, y: 4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // A handful of thin dark horizontal stripes running the length of the
  // flank - the mullet's signature marking, instead of scattered spots.
  g.lineStyle(1 * s, stripeColor, 0.65 * alpha);
  [-5, -1.5, 2].forEach((sy) => {
    g.beginPath();
    g.moveTo(-20 * s, sy * s);
    g.lineTo(22 * s, (sy - 1) * s);
    g.strokePath();
  });

  // Two separate dorsal fins with a clear gap between them - the spiny
  // first dorsal and the smaller soft second dorsal - unlike the Australian Salmon's
  // single dorsal-plus-adipose arrangement.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -9 * s, 0 * s, -8.5 * s, -3 * s, -18 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-6 * s, -9 * s, 0 * s, -8.5 * s, -3 * s, -18 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(8 * s, -8 * s, 13 * s, -7 * s, 10 * s, -14 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(8 * s, -8 * s, 13 * s, -7 * s, 10 * s, -14 * s);

  // Gill line, marking the gill cover just behind the head.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -6 * s);
  g.lineTo(-17 * s, 6 * s);
  g.strokePath();

  // Eye, mid-set, with a rounded blunt snout in front of it.
  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-24 * s, -2 * s, 2.6 * s);
  g.fillStyle(0x131a1c, alpha);
  g.fillCircle(-23.6 * s, -2 * s, 1.4 * s);

  g.restore();
}

// A bream - a tall, deep, laterally-compressed oval body (not an elongated
// torpedo like the Australian Salmon/Mullet), a steep sloped forehead, one long
// continuous dorsal fin running most of the back with a spiny zigzag front
// section blending into a rounded soft rear lobe, and the dark shoulder
// spot just behind the gill cover that's the real fish's own field mark.
// Silvery-bronze, not blue-grey or sandy like the others.
export function drawBream(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xcfc7a8;
  const backColor = 0x8f8560;
  const bellyColor = 0xf3ecd6;
  const finColor = 0x8f8560;
  const darkColor = 0x3a3628;
  const spotColor = 0x2a251c;

  // Deep oval/diamond silhouette - height is most of the length, unlike the
  // elongated fish, with a steep rising forehead just behind the small
  // mouth.
  const body = [
    { x: -26, y: 0 },
    { x: -23, y: -6 },
    { x: -15, y: -13 },
    { x: -3, y: -18 },
    { x: 9, y: -17 },
    { x: 18, y: -13 },
    { x: 24, y: -7 },
    { x: 26, y: -2 },
    { x: 26, y: 2 },
    { x: 24, y: 7 },
    { x: 18, y: 13 },
    { x: 9, y: 17 },
    { x: -3, y: 18 },
    { x: -15, y: 13 },
    { x: -23, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Forked tail, out past the caudal peduncle.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -2 * s, 39 * s, -9 * s, 32 * s, 0);
  g.fillTriangle(26 * s, 2 * s, 39 * s, 9 * s, 32 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(26 * s, -2 * s, 39 * s, -9 * s, 32 * s, 0);
  g.strokeTriangle(26 * s, 2 * s, 39 * s, 9 * s, 32 * s, 0);

  // Anal fin and pelvic/pectoral fins - small and swept back.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-14 * s, 9 * s, -19 * s, 16 * s, -8 * s, 12 * s);
  g.fillTriangle(2 * s, 15 * s, -1 * s, 22 * s, 8 * s, 16 * s);
  g.fillTriangle(-18 * s, -2 * s, -24 * s, 4 * s, -14 * s, 3 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Bronze-grey back band, following the top of the body's own profile.
  const topProfile = [
    { x: -23, y: -6 },
    { x: -15, y: -13 },
    { x: -3, y: -18 },
    { x: 9, y: -17 },
    { x: 18, y: -13 },
    { x: 24, y: -7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 7 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip along the bottom edge.
  const bottomProfile = [
    { x: -15, y: 13 },
    { x: -3, y: 18 },
    { x: 9, y: 17 },
    { x: 18, y: 13 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 5 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // One long dorsal fin the length of most of the back - a zigzag row of
  // short spines up front blending into one larger rounded soft lobe
  // behind, all as a single continuous fin (not two separate ones like the
  // Mullet's).
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -11, y: -14 },
    { x: -7, y: -16 },
    { x: -3, y: -17.5 },
    { x: 1, y: -17 },
    { x: 4, y: -16 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = ((b0.x + b1.x) / 2) * 1;
    const tipY = Math.min(b0.y, b1.y) - 7 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  spineBase.forEach((p, i) => {
    if (i === spineBase.length - 1) return;
    const next = spineBase[i + 1];
    const tipX = ((p.x + next.x) / 2) * 1;
    const tipY = Math.min(p.y, next.y) - 7 * s;
    g.strokeTriangle(p.x, p.y, next.x, next.y, tipX, tipY);
  });
  // Soft rear lobe, one rounded triangle behind the spines.
  g.fillTriangle(4 * s, -16 * s, 14 * s, -12 * s, 8 * s, -24 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(4 * s, -16 * s, 14 * s, -12 * s, 8 * s, -24 * s);

  // Gill line, just behind the head.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, -10 * s);
  g.lineTo(-14 * s, 10 * s);
  g.strokePath();

  // The dark shoulder spot behind the gill cover - the real fish's own
  // field mark, not just decoration.
  g.fillStyle(spotColor, 0.85 * alpha);
  g.fillEllipse(-13 * s, -2 * s, 6 * s, 8 * s);

  // Eye, set high and forward under the steep forehead.
  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-19 * s, -6 * s, 2.6 * s);
  g.fillStyle(0x131a1c, alpha);
  g.fillCircle(-18.6 * s, -6 * s, 1.4 * s);

  g.restore();
}

// A tuna - a big, robust, streamlined fusiform body (heftier than the
// Australian Salmon's, not laterally compressed like the Bream's), a tall curved
// sickle-shaped first dorsal fin, a deeply forked crescent (lunate) tail -
// much deeper and narrower than any of the other fish's forks - a long
// swept-back pectoral fin, and the row of small finlets along the top and
// bottom of the tail stalk that's the real animal's own unmistakable field
// mark. Dark blue-black back over silvery sides.
export function drawTuna(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb7c5cb;
  const backColor = 0x1c3247;
  const bellyColor = 0xe9eef0;
  const finColor = 0x33506a;
  const darkColor = 0x121f29;

  // A robust, deep-chested fusiform body, narrowing to a slim, keeled
  // caudal peduncle before the tail.
  const body = [
    { x: -36, y: 0 },
    { x: -33, y: -4 },
    { x: -24, y: -8 },
    { x: -10, y: -11 },
    { x: 4, y: -11 },
    { x: 16, y: -9 },
    { x: 24, y: -6 },
    { x: 29, y: -3 },
    { x: 29, y: 3 },
    { x: 24, y: 6 },
    { x: 16, y: 9 },
    { x: 4, y: 11 },
    { x: -10, y: 11 },
    { x: -24, y: 8 },
    { x: -33, y: 4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Deeply forked, crescent-shaped (lunate) tail - tall, narrow, curved
  // scythe-like lobes, much more deeply forked than any of the other fish's
  // tails, built the same bowed-blade way as the seaweed's blades.
  [
    { angle: -0.62, bow: 12 },
    { angle: 0.62, bow: -12 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 27;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (29 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (5 - tt * 4.6) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  // Long, swept-back pectoral fin - noticeably bigger than the other fish's.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-16 * s, 3 * s, -22 * s, 20 * s, -9 * s, 6 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-16 * s, 3 * s, -22 * s, 20 * s, -9 * s, 6 * s);

  // Pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 10 * s, -8 * s, 18 * s, 3 * s, 11 * s);
  g.fillTriangle(10 * s, 10 * s, 8 * s, 17 * s, 17 * s, 10 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Dark blue-black back band, following the top of the body's own profile.
  const topProfile = [
    { x: -33, y: -4 },
    { x: -24, y: -8 },
    { x: -10, y: -11 },
    { x: 4, y: -11 },
    { x: 16, y: -9 },
    { x: 24, y: -6 },
    { x: 29, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 8 * s }))
  );
  g.fillStyle(backColor, 0.9 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip along the bottom edge.
  const bottomProfile = [
    { x: -24, y: 8 },
    { x: -10, y: 11 },
    { x: 4, y: 11 },
    { x: 16, y: 9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.45 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.4 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // Tall, curved, sickle-shaped first dorsal fin, swept back - a real bowed
  // blade, not a plain straight-edged triangle.
  {
    const angle = 0.32;
    const len = 23;
    const bow = 11;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 10;
    const left = [];
    const right = [];
    const baseX = -3;
    const baseY = -11;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (3.6 - tt * 3.3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  // Small second dorsal fin, well behind the first.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(14 * s, -9 * s, 19 * s, -8 * s, 16 * s, -14 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(14 * s, -9 * s, 19 * s, -8 * s, 16 * s, -14 * s);

  // The row of small finlets along the top and bottom of the tail stalk -
  // the real fish's own unmistakable field mark, and something none of the
  // other fish here have.
  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 6; i += 1) {
    const fx = 17 + i * 2;
    g.fillTriangle(fx * s, -7 * s, (fx + 1.5) * s, -7 * s, (fx + 0.75) * s, -11 * s);
    g.fillTriangle(fx * s, 7 * s, (fx + 1.5) * s, 7 * s, (fx + 0.75) * s, 11 * s);
  }

  // Gill line, just behind the head.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-25 * s, -7 * s);
  g.lineTo(-23 * s, 7 * s);
  g.strokePath();

  // Eye, forward on the head.
  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-29 * s, -2 * s, 2.8 * s);
  g.fillStyle(0x0c1519, alpha);
  g.fillCircle(-28.6 * s, -2 * s, 1.5 * s);

  g.restore();
}

// A great white shark - a long, lean, powerfully built torpedo body with a
// pointed conical snout (not a rounded/blunt fish head), the iconic tall
// triangular dorsal fin leaning back, an asymmetric heterocercal tail (a
// big swept upper lobe and a much smaller lower lobe - a real shark tail,
// not a bony fish's mirrored fork), a row of gill slits instead of a single
// gill line, stiff wing-like pectoral fins, a hint of teeth at the jaw, and
// a crisp, sharp-edged countershading line between the dark slate back and
// the white belly (a real shark's own two-tone, not a soft blended band
// like the other fish). The single rarest, toughest catch in the game.
export function drawGreatWhite(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x4a5560;
  const bellyColor = 0xf3f2ec;
  const finColor = 0x4a5560;
  const darkColor = 0x181d21;
  const toothColor = 0xf5f5f0;

  // A long, lean, powerful torpedo body with a pointed snout - noticeably
  // longer and leaner than the Tuna's stockier build.
  const body = [
    { x: -42, y: 0 },
    { x: -38, y: -5 },
    { x: -27, y: -9 },
    { x: -12, y: -12 },
    { x: 2, y: -12 },
    { x: 16, y: -10 },
    { x: 27, y: -7 },
    { x: 34, y: -3 },
    { x: 34, y: 3 },
    { x: 27, y: 7 },
    { x: 16, y: 10 },
    { x: 2, y: 12 },
    { x: -12, y: 12 },
    { x: -27, y: 9 },
    { x: -38, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Heterocercal tail - a real shark tail, not a mirrored fish fork: a big,
  // steeply swept upper lobe and a much smaller lower lobe, both built as
  // bowed blades for a proper curved, powerful sweep.
  [
    { angle: -0.86, bow: 15, len: 32, baseY: -3, w: 6.5 },
    { angle: 0.58, bow: -7, len: 14, baseY: 3, w: 5 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (34 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  // Large, stiff, wing-like pectoral fins - broader and more angular than
  // any bony fish's.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-14 * s, 6 * s, -22 * s, 24 * s, -3 * s, 10 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-14 * s, 6 * s, -22 * s, 24 * s, -3 * s, 10 * s);

  // Pelvic and small second dorsal/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(8 * s, 11 * s, 5 * s, 19 * s, 16 * s, 11 * s);
  g.fillTriangle(19 * s, -9 * s, 24 * s, -8 * s, 21 * s, -15 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(19 * s, -9 * s, 24 * s, -8 * s, 21 * s, -15 * s);

  // Body - filled solid white/pale first, so the dark back band below reads
  // as a crisp, fully-opaque shark countershading line rather than a soft
  // blended tint.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  // The dark back, filled at FULL opacity (not a translucent band like the
  // other fish) for that real, sharp-edged shark demarcation between the
  // grey dorsal surface and the white belly.
  const topProfile = [
    { x: -38, y: -5 },
    { x: -27, y: -9 },
    { x: -12, y: -12 },
    { x: 2, y: -12 },
    { x: 16, y: -10 },
    { x: 27, y: -7 },
    { x: 34, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (3 + Math.sin(i * 1.3) * 1.6) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.5 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The tall, iconic triangular dorsal fin, leaning back - the shark's own
  // unmistakable silhouette, broader and more upright than the Tuna's thin
  // curved sickle.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -12 * s, 8 * s, -10.5 * s, 2 * s, -34 * s);
  g.lineStyle(1.3 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(-8 * s, -12 * s, 8 * s, -10.5 * s, 2 * s, -34 * s);

  // Gill slits - a row of short curved marks behind the head, instead of
  // the single gill line the bony fish have.
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -31 + i * 2.4;
    g.beginPath();
    g.moveTo(gx * s, -8 * s);
    g.lineTo((gx - 1.4) * s, 7 * s);
    g.strokePath();
  }

  // A hint of teeth at the jaw line, just under the snout.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-41 * s, 1 * s);
  g.lineTo(-30 * s, 5 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const tx = -39 + i * 3;
    g.fillTriangle(tx * s, 1.5 * s, (tx + 1.6) * s, 2.2 * s, (tx + 0.6) * s, 4.6 * s);
  }

  // Small, dark, watchful eye.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-33 * s, -4 * s, 1.9 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-33 * s, -4 * s, 1 * s);

  g.restore();
}

// A tiger shark - bulkier and less streamlined than the Great White, with a
// short, wide, blunt snout (not a fine point), a heavier square-ish head,
// a lower and more rounded dorsal fin, and above all the bold dark tiger
// stripes banding the flank and tail that give the real animal its name -
// nothing else in the game has a striped pattern. Olive-brown-grey instead
// of the Great White's cold blue-grey, with the same heterocercal tail,
// gill slits and toothy jaw marking it as unmistakably a shark.
export function drawTigerShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x6b6a4a;
  const bellyColor = 0xefe9d2;
  const finColor = 0x6b6a4a;
  const darkColor = 0x1c1c14;
  const stripeColor = 0x2c2a1c;
  const toothColor = 0xf5f5f0;

  // Bulkier build than the Great White, with a short, wide, blunt snout
  // instead of a fine point.
  const body = [
    { x: -38, y: 0 },
    { x: -36, y: -6 },
    { x: -26, y: -11 },
    { x: -12, y: -14 },
    { x: 2, y: -14 },
    { x: 16, y: -11 },
    { x: 27, y: -8 },
    { x: 34, y: -4 },
    { x: 34, y: 4 },
    { x: 27, y: 8 },
    { x: 16, y: 11 },
    { x: 2, y: 14 },
    { x: -12, y: 14 },
    { x: -26, y: 11 },
    { x: -36, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Heterocercal tail - big swept upper lobe, smaller lower lobe, same
  // shark-tail construction as the Great White's.
  [
    { angle: -0.82, bow: 14, len: 30, baseY: -3, w: 6.2 },
    { angle: 0.56, bow: -7, len: 13, baseY: 3, w: 4.8 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (34 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  // Broad pectoral fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-12 * s, 8 * s, -20 * s, 25 * s, -1 * s, 12 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-12 * s, 8 * s, -20 * s, 25 * s, -1 * s, 12 * s);

  // Pelvic and small second dorsal/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(9 * s, 13 * s, 6 * s, 21 * s, 17 * s, 13 * s);
  g.fillTriangle(20 * s, -10 * s, 25 * s, -9 * s, 22 * s, -16 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(20 * s, -10 * s, 25 * s, -9 * s, 22 * s, -16 * s);

  // Body - solid pale base, then a crisp, fully-opaque olive-grey back
  // band, same sharp shark countershading technique as the Great White.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -36, y: -6 },
    { x: -26, y: -11 },
    { x: -12, y: -14 },
    { x: 2, y: -14 },
    { x: 16, y: -11 },
    { x: 27, y: -8 },
    { x: 34, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (4 + Math.sin(i * 1.1) * 1.8) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.5 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The bold dark tiger stripes banding the flank and onto the tail base -
  // the real animal's own namesake marking, and unique to this fish.
  g.lineStyle(2.6 * s, stripeColor, 0.75 * alpha);
  [-30, -22, -14, -6, 2, 10, 18, 25].forEach((sx, i) => {
    const lean = 4 + (i % 2) * 1.5;
    g.beginPath();
    g.moveTo((sx + lean) * s, -13 * s);
    g.lineTo(sx * s, 13 * s);
    g.strokePath();
  });

  // Low, broad, more rounded dorsal fin than the Great White's tall upright
  // triangle - a real tiger shark's own fin shape.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, -14 * s, 10 * s, -12 * s, -1 * s, -29 * s);
  g.lineStyle(1.3 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(-10 * s, -14 * s, 10 * s, -12 * s, -1 * s, -29 * s);

  // Gill slits.
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -29 + i * 2.4;
    g.beginPath();
    g.moveTo(gx * s, -10 * s);
    g.lineTo((gx - 1.4) * s, 9 * s);
    g.strokePath();
  }

  // A wide, insane-looking grin of teeth along the blunt jaw.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-37 * s, 2 * s);
  g.lineTo(-24 * s, 7 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 6; i += 1) {
    const tx = -36 + i * 2.4;
    g.fillTriangle(tx * s, 2.5 * s, (tx + 1.9) * s, 3.6 * s, (tx + 0.7) * s, 6.6 * s);
  }

  // Small, fierce, dark eye.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-30 * s, -6 * s, 2 * s);
  g.fillStyle(0x000000, 0.85 * alpha);
  g.fillCircle(-30 * s, -6 * s, 1.1 * s);

  g.restore();
}

// A megalodon - the single rarest catch in the game, only ever encountered
// as an ultra-rare "actually, that wasn't a normal shark" swap the instant
// one of the three real sharks bites (see OceanScene.MEGALODON_CHANCE), so
// this is built to justify that reveal: a far more massive, more robust
// apex predator than the Great White - a deeper, thicker body (between the
// Great White's lean torpedo and the Bull Shark's barrel build, but bigger
// than either), a shorter, blunter head as in real fossil-based
// reconstructions rather than the Great White's fine point, an enormous,
// towering dorsal fin - taller and broader-based than any other shark
// here - and a huge gaping jaw lined with much larger, more numerous
// serrated teeth. Weathered dark slate-grey over a bone-pale belly, aged
// rather than the Great White's crisp clean two-tone.
export function drawMegalodon(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x39424a;
  const bellyColor = 0xd8d6c8;
  const finColor = 0x39424a;
  const darkColor = 0x0d0f10;
  const toothColor = 0xf0ead8;

  // A massive, deep-bodied torpedo - bulkier than the Great White's lean
  // build, with a shorter, blunter snout matching real fossil-based
  // reconstructions instead of a fine point.
  const body = [
    { x: -40, y: 0 },
    { x: -36, y: -7 },
    { x: -25, y: -13 },
    { x: -10, y: -17 },
    { x: 4, y: -17 },
    { x: 18, y: -14 },
    { x: 29, y: -9 },
    { x: 36, y: -4 },
    { x: 36, y: 4 },
    { x: 29, y: 9 },
    { x: 18, y: 14 },
    { x: 4, y: 17 },
    { x: -10, y: 17 },
    { x: -25, y: 13 },
    { x: -36, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Heterocercal tail - same real-shark construction as the others, scaled
  // up to this much larger body.
  [
    { angle: -0.86, bow: 17, len: 36, baseY: -3, w: 7.5 },
    { angle: 0.58, bow: -8, len: 16, baseY: 3, w: 5.6 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (36 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  // Large, stiff, wing-like pectoral fins - broader than the Great White's.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-15 * s, 7 * s, -25 * s, 27 * s, -2 * s, 11 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-15 * s, 7 * s, -25 * s, 27 * s, -2 * s, 11 * s);

  // Pelvic and small second dorsal/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(9 * s, 12 * s, 5 * s, 21 * s, 18 * s, 12 * s);
  g.fillTriangle(21 * s, -10 * s, 27 * s, -9 * s, 23 * s, -17 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(21 * s, -10 * s, 27 * s, -9 * s, 23 * s, -17 * s);

  // Body - solid pale base, then the dark, weathered, fully-opaque back for
  // a crisp but aged demarcation, same technique as the Great White's.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -36, y: -7 },
    { x: -25, y: -13 },
    { x: -10, y: -17 },
    { x: 4, y: -17 },
    { x: 18, y: -14 },
    { x: 29, y: -9 },
    { x: 36, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (4 + Math.sin(i * 1.3) * 1.8) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.6 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The enormous, towering dorsal fin - taller and broader-based than any
  // other shark in the game, matching the real animal's own outsized
  // proportions.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, -17 * s, 11 * s, -15 * s, 2 * s, -46 * s);
  g.lineStyle(1.5 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(-11 * s, -17 * s, 11 * s, -15 * s, 2 * s, -46 * s);

  // Gill slits.
  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -29 + i * 2.6;
    g.beginPath();
    g.moveTo(gx * s, -10 * s);
    g.lineTo((gx - 1.6) * s, 9 * s);
    g.strokePath();
  }

  // The huge, gaping jaw lined with much larger, more numerous serrated
  // teeth than any other shark - the real animal's own namesake ("big
  // tooth") field mark.
  g.lineStyle(1.2 * s, darkColor, 0.75 * alpha);
  g.beginPath();
  g.moveTo(-39 * s, 1 * s);
  g.lineTo(-22 * s, 8 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 6; i += 1) {
    const tx = -37 + i * 3;
    g.fillTriangle(tx * s, 2 * s, (tx + 2.6) * s, 3.5 * s, (tx + 1) * s, 8.5 * s);
  }

  // Small, dark, ancient-looking eye - unsettlingly small against the
  // sheer size of the head.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-32 * s, -5 * s, 2.2 * s);
  g.fillStyle(0x000000, 0.85 * alpha);
  g.fillCircle(-32 * s, -5 * s, 1.2 * s);

  g.restore();
}

// A bull shark - built to read as its own distinct animal, not a resized
// Tiger Shark, but tuned back from the earlier "barrel" version toward the
// real animal's actual proportions: longer and noticeably flatter than
// that first pass, though still a bit stockier than the other two sharks
// (depth-to-length ~0.4 here vs the Tiger Shark's ~0.37 and Great White's
// ~0.35 - a real bull shark is robust, not literally round). The snout is
// short and evenly rounded (built from three close-set points forming a
// soft curve, not a single vertex or a flat chord). The first dorsal fin
// is broad-based, upright, and rounded at the tip - NOT a swept sickle
// like the Great White's or the Tiger Shark's - and sits unusually far
// forward, almost directly over the pectoral fins, which is exactly where
// a real bull shark carries it. Coloring is a plain warm grey-bronze
// (distinct from the Tiger Shark's olive-brown and the Great White's cool
// blue-grey), fading softly to a white belly with no stripes and none of
// the Great White's crisp two-tone edge.
export function drawBullShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x7d7568;
  const bellyColor = 0xf5f1e6;
  const finColor = 0x7d7568;
  const darkColor = 0x28241c;
  const toothColor = 0xf5f5f0;

  // A longer, flatter body than the original barrel version - depth is
  // roughly 40% of length here, still a bit stockier than the other two
  // sharks but far closer to a real bull shark's actual build. The nose is
  // three close-set points (top/tip/bottom) forming a soft rounded curve
  // instead of a flat chord or sharp vertex.
  const body = [
    { x: -33, y: -6 },
    { x: -25, y: -11 },
    { x: -11, y: -14 },
    { x: 4, y: -14 },
    { x: 17, y: -11 },
    { x: 27, y: -7 },
    { x: 34, y: -3 },
    { x: 34, y: 3 },
    { x: 27, y: 7 },
    { x: 17, y: 11 },
    { x: 4, y: 14 },
    { x: -11, y: 14 },
    { x: -25, y: 11 },
    { x: -33, y: 6 },
    { x: -36, y: 0 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Heterocercal tail - same real-shark construction as the other two,
  // scaled to this longer body.
  [
    { angle: -0.8, bow: 13, len: 28, baseY: -3, w: 6.2 },
    { angle: 0.56, bow: -7.5, len: 12.5, baseY: 3, w: 4.8 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (34 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  // Broad, stiff pectoral fins, set right under where the forward-placed
  // dorsal fin sits above.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-15 * s, 9 * s, -23 * s, 22 * s, -5 * s, 12 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-15 * s, 9 * s, -23 * s, 22 * s, -5 * s, 12 * s);

  // Pelvic and small second dorsal/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(9 * s, 13 * s, 6 * s, 19 * s, 17 * s, 13 * s);
  g.fillTriangle(20 * s, -9 * s, 25 * s, -8 * s, 22 * s, -15 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(20 * s, -9 * s, 25 * s, -8 * s, 22 * s, -15 * s);

  // Body - solid pale base, then a plain warm grey-bronze back band with no
  // stripes and a soft (not crisp) edge into the belly - unlike either
  // other shark's own marking.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -33, y: -6 },
    { x: -25, y: -11 },
    { x: -11, y: -14 },
    { x: 4, y: -14 },
    { x: 17, y: -11 },
    { x: 27, y: -7 },
    { x: 34, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (6 + Math.sin(i * 1.2) * 1.3) * s }))
  );
  g.fillStyle(backColor, 0.9 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.5 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The broad-based, upright, rounded-tip first dorsal fin, set unusually
  // far forward almost directly over the pectoral fins - a real bull
  // shark's own distinctive placement, quite unlike the swept sickle shape
  // and further-back position of either other shark's dorsal fin.
  g.fillStyle(finColor, alpha);
  g.beginPath();
  g.moveTo(-19 * s, -12 * s);
  g.lineTo(-3 * s, -13 * s);
  g.lineTo(-7 * s, -24 * s);
  g.lineTo(-15 * s, -22 * s);
  g.closePath();
  g.fillPath();
  g.lineStyle(1.3 * s, darkColor, 0.7 * alpha);
  g.strokePoints(
    [
      { x: -19 * s, y: -12 * s },
      { x: -3 * s, y: -13 * s },
      { x: -7 * s, y: -24 * s },
      { x: -15 * s, y: -22 * s }
    ],
    true
  );

  // Gill slits.
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -24 + i * 2.6;
    g.beginPath();
    g.moveTo(gx * s, -10 * s);
    g.lineTo((gx - 1.4) * s, 9 * s);
    g.strokePath();
  }

  // A short, wide jaw with a dense row of broad teeth - a real bull
  // shark's own powerful bite, blunter and wider than the Tiger Shark's.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-32 * s, 2 * s);
  g.lineTo(-16 * s, 8 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const tx = -31 + i * 2.9;
    g.fillTriangle(tx * s, 2.5 * s, (tx + 2.2) * s, 4 * s, (tx + 0.9) * s, 7.6 * s);
  }

  // Small, dark, watchful eyes - noticeably smaller than either the Great
  // White's or the Tiger Shark's own eye, a real hunter-in-murky-water
  // trait.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-22 * s, -8 * s, 1.5 * s);
  g.fillStyle(0x000000, 0.85 * alpha);
  g.fillCircle(-22 * s, -8 * s, 0.8 * s);

  g.restore();
}

// A tailor - a lean, moderately compressed predator fish (slimmer than the
// Bream, less stout than the Tuna), with a pointed jaw held slightly open
// to show a real row of sharp little teeth - the real fish's own
// identifying feature, and a proper predator's mouth unlike any of the
// other normal-pool fish's closed/hidden mouths. A single low, lean dorsal
// fin (spiny front blending into a soft rear lobe) and a cleanly forked
// tail. Silvery-blue-green back over bright silver sides.
export function drawTailor(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc7d3d2;
  const backColor = 0x3f6866;
  const bellyColor = 0xf0f4f0;
  const finColor = 0x517d7a;
  const darkColor = 0x1f3130;
  const toothColor = 0xf5f5f0;

  const body = [
    { x: -32, y: 0 },
    { x: -29, y: -4 },
    { x: -20, y: -8 },
    { x: -8, y: -10 },
    { x: 4, y: -10 },
    { x: 14, y: -8 },
    { x: 22, y: -5 },
    { x: 27, y: -2 },
    { x: 27, y: 2 },
    { x: 22, y: 5 },
    { x: 14, y: 8 },
    { x: 4, y: 10 },
    { x: -8, y: 10 },
    { x: -20, y: 8 },
    { x: -29, y: 4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Cleanly forked tail, moderate depth.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -2 * s, 40 * s, -9 * s, 33 * s, 0);
  g.fillTriangle(27 * s, 2 * s, 40 * s, 9 * s, 33 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(27 * s, -2 * s, 40 * s, -9 * s, 33 * s, 0);
  g.strokeTriangle(27 * s, 2 * s, 40 * s, 9 * s, 33 * s, 0);

  // Pectoral, pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-14 * s, 4 * s, -20 * s, 12 * s, -9 * s, 7 * s);
  g.fillTriangle(-2 * s, 9 * s, -5 * s, 16 * s, 5 * s, 10 * s);
  g.fillTriangle(13 * s, 7 * s, 16 * s, 13 * s, 20 * s, 7 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Blue-green back band.
  const topProfile = [
    { x: -29, y: -4 },
    { x: -20, y: -8 },
    { x: -8, y: -10 },
    { x: 4, y: -10 },
    { x: 14, y: -8 },
    { x: 22, y: -5 },
    { x: 27, y: -2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.7 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip.
  const bottomProfile = [
    { x: -20, y: 8 },
    { x: -8, y: 10 },
    { x: 4, y: 10 },
    { x: 14, y: 8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // One low, lean dorsal fin - a short spiny zigzag blending into a small
  // soft rear lobe, built the same way as the Bream's.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -6, y: -9 },
    { x: -2, y: -10.5 },
    { x: 2, y: -10 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(2 * s, -10 * s, 10 * s, -8 * s, 6 * s, -17 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(2 * s, -10 * s, 10 * s, -8 * s, 6 * s, -17 * s);

  // Gill line.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-18 * s, -6 * s);
  g.lineTo(-16 * s, 6 * s);
  g.strokePath();

  // A slightly open jaw with a real row of sharp little teeth - the
  // tailor's own predatory field mark.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-31 * s, 1 * s);
  g.lineTo(-21 * s, 5 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -29 + i * 3;
    g.fillTriangle(tx * s, 1.5 * s, (tx + 1.4) * s, 2.2 * s, (tx + 0.5) * s, 4.2 * s);
  }

  // Eye, forward on the head.
  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-23 * s, -3 * s, 2.4 * s);
  g.fillStyle(0x131a1c, alpha);
  g.fillCircle(-22.6 * s, -3 * s, 1.3 * s);

  g.restore();
}

// A trevally - the real fish's own unmistakable silhouette: a steep, almost
// vertical blunt forehead rising sharply right behind the mouth (much
// steeper than the Bream's gentler slope), a deep but elongated body, a
// long curved sickle-shaped (falcate) pectoral fin swept back - far bigger
// and more scythe-like than any other fish's pectoral here - a strongly
// forked tail, and the curved line of bony scutes running along the flank
// toward the caudal peduncle that real trevally/jacks are known for.
// Silvery with a faint golden-olive sheen.
export function drawTrevally(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd8d4a8;
  const backColor = 0x83815c;
  const bellyColor = 0xf3f1de;
  const finColor = 0x8a8760;
  const darkColor = 0x2e2e20;
  const scuteColor = 0x53512f;

  // Steep, almost vertical forehead right behind the mouth - the trevally's
  // own field mark, not a gradual slope like the Bream's.
  const body = [
    { x: -30, y: 2 },
    { x: -28, y: -8 },
    { x: -22, y: -16 },
    { x: -10, y: -19 },
    { x: 4, y: -19 },
    { x: 16, y: -16 },
    { x: 25, y: -11 },
    { x: 30, y: -5 },
    { x: 30, y: 5 },
    { x: 25, y: 11 },
    { x: 16, y: 16 },
    { x: 4, y: 19 },
    { x: -10, y: 19 },
    { x: -20, y: 14 },
    { x: -27, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Strongly, deeply forked tail.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(30 * s, -5 * s, 46 * s, -14 * s, 37 * s, 0);
  g.fillTriangle(30 * s, 5 * s, 46 * s, 14 * s, 37 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(30 * s, -5 * s, 46 * s, -14 * s, 37 * s, 0);
  g.strokeTriangle(30 * s, 5 * s, 46 * s, 14 * s, 37 * s, 0);

  // The long, curved, sickle-shaped (falcate) pectoral fin swept back - a
  // real bowed blade, noticeably bigger and more scythe-like than any of
  // the other fish's pectoral fins.
  {
    const angle = 1.55;
    const len = 24;
    const bow = 11;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    const baseX = -12;
    const baseY = 4;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (3.4 - tt * 3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  // Pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 17 * s, -9 * s, 25 * s, 4 * s, 18 * s);
  g.fillTriangle(12 * s, 15 * s, 10 * s, 22 * s, 20 * s, 13 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Olive-grey back band, following the steep forehead and back profile.
  const topProfile = [
    { x: -28, y: -8 },
    { x: -22, y: -16 },
    { x: -10, y: -19 },
    { x: 4, y: -19 },
    { x: 16, y: -16 },
    { x: 25, y: -11 },
    { x: 30, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 8 * s }))
  );
  g.fillStyle(backColor, 0.6 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip.
  const bottomProfile = [
    { x: -20, y: 14 },
    { x: -10, y: 19 },
    { x: 4, y: 19 },
    { x: 16, y: 16 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 5 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // One continuous dorsal fin - a short spiny zigzag blending into a longer
  // soft rear lobe running most of the back.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -8, y: -19 },
    { x: -3, y: -20.5 },
    { x: 2, y: -20 },
    { x: 6, y: -19 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(6 * s, -19 * s, 18 * s, -14 * s, 11 * s, -27 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(6 * s, -19 * s, 18 * s, -14 * s, 11 * s, -27 * s);

  // The curved line of bony scutes along the flank toward the caudal
  // peduncle - a real trevally/jack field mark, drawn as a gently curved
  // line with small raised tick marks along it.
  g.lineStyle(1 * s, scuteColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-4 * s, -1 * s);
  g.lineTo(14 * s, 2 * s);
  g.lineTo(29 * s, 0 * s);
  g.strokePath();
  for (let i = 0; i < 7; i += 1) {
    const tt = i / 6;
    const sx = (-4 + tt * 33) * s;
    const sy = (-1 + tt * 1) * s;
    g.lineStyle(1 * s, scuteColor, 0.7 * alpha);
    g.beginPath();
    g.moveTo(sx, sy - 2 * s);
    g.lineTo(sx, sy + 2 * s);
    g.strokePath();
  }

  // Gill line.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -12 * s);
  g.lineTo(-17 * s, 10 * s);
  g.strokePath();

  // Eye, high on the steep forehead.
  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-22 * s, -8 * s, 2.6 * s);
  g.fillStyle(0x131a1c, alpha);
  g.fillCircle(-21.6 * s, -8 * s, 1.4 * s);

  g.restore();
}

// A yellowtail kingfish - a big, powerful, elongated fusiform predator
// (leaner than the Tuna, less deep-bodied than the Trevally), with a
// pointed head and a strongly forked tail, plus the two field marks that
// make the real animal unmistakable: a dark diagonal band running from the
// top of the head down across the eye, and the bright yellow stripe running
// the length of the flank into a golden-yellow tail - the marking that
// gives the species its name. Olive-blue-green back over silvery sides.
export function drawKingfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc9d4c8;
  const backColor = 0x35544a;
  const bellyColor = 0xf2f4e8;
  const finColor = 0x8a9060;
  const tailColor = 0xe8b93a;
  const darkColor = 0x232d24;
  const stripeColor = 0xf0c93f;
  const eyeStripeColor = 0x1c231d;

  // A long, lean fusiform body - more elongated than the Trevally's deep
  // body, leaner than the Tuna's stockier build - tapering to a slender
  // caudal peduncle.
  const body = [
    { x: -37, y: 0 },
    { x: -34, y: -3 },
    { x: -25, y: -7 },
    { x: -12, y: -10 },
    { x: 1, y: -10.5 },
    { x: 13, y: -9 },
    { x: 22, y: -6 },
    { x: 28, y: -3 },
    { x: 28, y: 3 },
    { x: 22, y: 6 },
    { x: 13, y: 9 },
    { x: 1, y: 10.5 },
    { x: -12, y: 10 },
    { x: -25, y: 7 },
    { x: -34, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Strongly forked, golden-yellow tail - the real animal's namesake
  // marking, built as bowed scythe blades like the Trevally's fork.
  [
    { angle: -0.58, bow: 12 },
    { angle: 0.58, bow: -12 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 26;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (28 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (5 - tt * 4.5) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(tailColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  // Long, curved, sickle-shaped pectoral fin, swept back - a real pelagic
  // predator's fin, though not as oversized as the Trevally's.
  {
    const angle = 1.5;
    const len = 19;
    const bow = 8;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    const baseX = -10;
    const baseY = 3;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (3 - tt * 2.6) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  // Pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 9 * s, -8 * s, 17 * s, 4 * s, 10 * s);
  g.fillTriangle(10 * s, 9 * s, 8 * s, 16 * s, 18 * s, 8 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Dark olive-blue-green back band, following the top of the body's own
  // profile.
  const topProfile = [
    { x: -34, y: -3 },
    { x: -25, y: -7 },
    { x: -12, y: -10 },
    { x: 1, y: -10.5 },
    { x: 13, y: -9 },
    { x: 22, y: -6 },
    { x: 28, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 7 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip.
  const bottomProfile = [
    { x: -25, y: 7 },
    { x: -12, y: 10 },
    { x: 1, y: 10.5 },
    { x: 13, y: 9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.4 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The bright yellow stripe running the length of the flank from behind
  // the eye back into the tail - the real animal's own namesake field mark.
  g.lineStyle(2.4 * s, stripeColor, 0.85 * alpha);
  g.beginPath();
  g.moveTo(-24 * s, -1 * s);
  g.lineTo(-5 * s, -1.5 * s);
  g.lineTo(15 * s, -1 * s);
  g.lineTo(27 * s, 0 * s);
  g.strokePath();

  // One long dorsal fin - a short spiny front zigzag blending into a long,
  // low soft rear lobe running most of the back.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -9, y: -10 },
    { x: -5, y: -12 },
    { x: -1, y: -11.5 },
    { x: 3, y: -10.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(3 * s, -10.5 * s, 17 * s, -7 * s, 10 * s, -16 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(3 * s, -10.5 * s, 17 * s, -7 * s, 10 * s, -16 * s);

  // Gill line, just behind the head.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-21 * s, -6 * s);
  g.lineTo(-19 * s, 6 * s);
  g.strokePath();

  // The dark diagonal band running from the top of the head down across the
  // eye to the snout - the real animal's other unmistakable field mark,
  // shared with its amberjack relatives, and unique to this fish in the
  // game.
  g.lineStyle(2.6 * s, eyeStripeColor, 0.75 * alpha);
  g.beginPath();
  g.moveTo(-26 * s, -9 * s);
  g.lineTo(-35 * s, 1 * s);
  g.strokePath();

  // Eye, forward on the pointed head.
  g.fillStyle(0xeef3ec, alpha);
  g.fillCircle(-29 * s, -3 * s, 2.6 * s);
  g.fillStyle(0x14180f, alpha);
  g.fillCircle(-28.6 * s, -3 * s, 1.4 * s);

  g.restore();
}

// A spotted mackerel - a lean, elongated scombrid body (same family shape
// as the Tuna, but noticeably slimmer, not the Tuna's deep-chested build),
// with the same deeply forked crescent (lunate) tail and the row of small
// finlets along the top and bottom of the tail stalk that mark it as a
// scombrid, but a long, low, single dorsal fin instead of the Tuna's tall
// sickle. The real animal's own unmistakable field mark - loose rows of
// small bronze-brown spots scattered the length of the flank - is what
// gives the species its name, and is unique to this fish in the game.
// Blue-green back over silvery sides, with a sharp predator's jaw.
export function drawSpottedMackerel(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb9c9d1;
  const backColor = 0x2f5a72;
  const bellyColor = 0xeef3f2;
  const finColor = 0x4a7690;
  const darkColor = 0x1c2e38;
  const spotColor = 0x8a5a2a;
  const toothColor = 0xf5f5f0;

  // A lean, elongated fusiform body - the same general scombrid shape as
  // the Tuna, but noticeably slimmer through the middle.
  const body = [
    { x: -34, y: 0 },
    { x: -31, y: -3 },
    { x: -22, y: -6 },
    { x: -9, y: -8 },
    { x: 4, y: -8 },
    { x: 15, y: -6.5 },
    { x: 23, y: -3.5 },
    { x: 28, y: -1.5 },
    { x: 28, y: 1.5 },
    { x: 23, y: 3.5 },
    { x: 15, y: 6.5 },
    { x: 4, y: 8 },
    { x: -9, y: 8 },
    { x: -22, y: 6 },
    { x: -31, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Deeply forked, crescent-shaped (lunate) tail - same scombrid
  // construction as the Tuna's, scaled to this slimmer body.
  [
    { angle: -0.6, bow: 11 },
    { angle: 0.6, bow: -11 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 24;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (28 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (4.4 - tt * 4) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  // Pectoral fin, smaller and less swept than the Tuna's.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-13 * s, 3 * s, -18 * s, 15 * s, -7 * s, 6 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-13 * s, 3 * s, -18 * s, 15 * s, -7 * s, 6 * s);

  // Pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 8 * s, -7 * s, 15 * s, 3 * s, 9 * s);
  g.fillTriangle(9 * s, 8 * s, 7 * s, 14 * s, 15 * s, 7 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Blue-green back band, following the top of the body's own profile.
  const topProfile = [
    { x: -31, y: -3 },
    { x: -22, y: -6 },
    { x: -9, y: -8 },
    { x: 4, y: -8 },
    { x: 15, y: -6.5 },
    { x: 23, y: -3.5 },
    { x: 28, y: -1.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip.
  const bottomProfile = [
    { x: -22, y: 6 },
    { x: -9, y: 8 },
    { x: 4, y: 8 },
    { x: 15, y: 6.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 3 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The loose rows of small bronze-brown spots scattered the length of the
  // flank - the real animal's own namesake field mark, unlike the Tuna's
  // plain sides or the Australian Salmon's few scattered spots.
  g.fillStyle(spotColor, 0.75 * alpha);
  [
    [-24, -3, 1.3],
    [-16, -5, 1.4],
    [-16, 1, 1.2],
    [-8, -6, 1.3],
    [-8, 2, 1.4],
    [0, -4, 1.3],
    [0, 3, 1.2],
    [8, -5, 1.3],
    [8, 3, 1.3],
    [15, -3, 1.2],
    [15, 3.5, 1.2],
    [21, 0, 1.1]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  // One long, low, single dorsal fin - a short spiny front zigzag blending
  // into a longer, low soft rear lobe running most of the back, instead of
  // the Tuna's tall curved sickle.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -9, y: -8 },
    { x: -3, y: -9.5 },
    { x: 3, y: -9 },
    { x: 9, y: -8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 5 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(9 * s, -8 * s, 17 * s, -6.5 * s, 13 * s, -13 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(9 * s, -8 * s, 17 * s, -6.5 * s, 13 * s, -13 * s);

  // Small second dorsal fin, well behind the first.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(18 * s, -6 * s, 22 * s, -5.5 * s, 20 * s, -9.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(18 * s, -6 * s, 22 * s, -5.5 * s, 20 * s, -9.5 * s);

  // The row of small finlets along the top and bottom of the tail stalk -
  // the scombrid family's own field mark, same as the Tuna's.
  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = 17 + i * 1.9;
    g.fillTriangle(fx * s, -5 * s, (fx + 1.3) * s, -5 * s, (fx + 0.65) * s, -8 * s);
    g.fillTriangle(fx * s, 5 * s, (fx + 1.3) * s, 5 * s, (fx + 0.65) * s, 8 * s);
  }

  // Gill line, just behind the head.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-23 * s, -5 * s);
  g.lineTo(-21 * s, 5 * s);
  g.strokePath();

  // A slightly open jaw with a row of sharp little teeth - a real
  // predator's mouth, matching the Tailor's own field mark.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-33 * s, 1 * s);
  g.lineTo(-23 * s, 5 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -31 + i * 3;
    g.fillTriangle(tx * s, 1.5 * s, (tx + 1.4) * s, 2.2 * s, (tx + 0.5) * s, 4.2 * s);
  }

  // Eye, forward on the head.
  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-25 * s, -2 * s, 2.4 * s);
  g.fillStyle(0x131a1c, alpha);
  g.fillCircle(-24.6 * s, -2 * s, 1.3 * s);

  g.restore();
}

// A whiting - a slender, elongated, almost cylindrical body (notably
// slimmer than the Mullet's stouter build), a pointed snout with a small,
// underslung mouth (whiting are bottom feeders with tiny mouths, not a wide
// predator's jaw like the Tailor's), a shallow, only lightly forked tail,
// two low separate dorsal fins (a short spiny first and a longer, low soft
// second set well back, mirrored below by a low anal fin), and the pale
// gold-brown blotches strung along the flank that real whiting carry. Pale
// silvery-sandy overall - reads noticeably paler and slimmer than anything
// else in the game.
export function drawWhiting(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe9ddbf;
  const backColor = 0xcabf8e;
  const bellyColor = 0xf9f6ec;
  const finColor = 0xd0c49b;
  const darkColor = 0x5c5138;
  const spotColor = 0xb1813c;

  // A slim, elongated, almost cylindrical body - noticeably slimmer than
  // any of the other fish here, with a fine pointed snout.
  const body = [
    { x: -30, y: 0 },
    { x: -28, y: -2.5 },
    { x: -20, y: -4.5 },
    { x: -8, y: -6 },
    { x: 4, y: -6 },
    { x: 14, y: -4.5 },
    { x: 21, y: -2.5 },
    { x: 25, y: -1 },
    { x: 25, y: 1 },
    { x: 21, y: 2.5 },
    { x: 14, y: 4.5 },
    { x: 4, y: 6 },
    { x: -8, y: 6 },
    { x: -20, y: 4.5 },
    { x: -28, y: 2.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Shallow, only lightly forked tail - a small double cusp, not the deep
  // scythe fork of the faster-swimming fish.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -1 * s, 33 * s, -4 * s, 29 * s, 0);
  g.fillTriangle(25 * s, 1 * s, 33 * s, 4 * s, 29 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(25 * s, -1 * s, 33 * s, -4 * s, 29 * s, 0);
  g.strokeTriangle(25 * s, 1 * s, 33 * s, 4 * s, 29 * s, 0);

  // Small pectoral and pelvic fins, and the long, low anal fin mirroring
  // the second dorsal fin below.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-12 * s, 2.5 * s, -17 * s, 8 * s, -8 * s, 5 * s);
  g.fillTriangle(-2 * s, 5.5 * s, -5 * s, 10 * s, 3 * s, 6.5 * s);
  g.fillTriangle(8 * s, 5.5 * s, 6 * s, 11 * s, 16 * s, 5 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Faint pale olive-fawn back band - much softer/paler than the other
  // fish's own back bands, since whiting reads as an overall pale fish.
  const topProfile = [
    { x: -28, y: -2.5 },
    { x: -20, y: -4.5 },
    { x: -8, y: -6 },
    { x: 4, y: -6 },
    { x: 14, y: -4.5 },
    { x: 21, y: -2.5 },
    { x: 25, y: -1 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.5 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip.
  const bottomProfile = [
    { x: -20, y: 4.5 },
    { x: -8, y: 6 },
    { x: 4, y: 6 },
    { x: 14, y: 4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 2.5 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  // The row of pale gold-brown blotches strung along the flank - a real
  // whiting's own signature marking, unlike any other fish's pattern in the
  // game.
  g.fillStyle(spotColor, 0.7 * alpha);
  [
    [-16, -1, 2.2],
    [-8, 0.5, 2],
    [0, -1, 2.2],
    [8, 0.5, 2],
    [16, -0.5, 1.8]
  ].forEach(([sx, sy, sr]) => g.fillEllipse(sx * s, sy * s, sr * 2 * s, sr * 1.3 * s));

  // Two low, separate dorsal fins - a short spiny first dorsal and a
  // longer, low soft second dorsal set well back, with a clear gap between
  // them (like the Mullet's arrangement, but lower and slimmer).
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, -6 * s, -3 * s, -5.5 * s, -6 * s, -12 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-9 * s, -6 * s, -3 * s, -5.5 * s, -6 * s, -12 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, -6 * s, 15 * s, -4.5 * s, 9.5 * s, -9 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(4 * s, -6 * s, 15 * s, -4.5 * s, 9.5 * s, -9 * s);

  // Gill line.
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -4 * s);
  g.lineTo(-18 * s, 4 * s);
  g.strokePath();

  // The small, underslung mouth just below the pointed snout tip - a real
  // bottom-feeder's mouth, not a wide predator's jaw like the Tailor's.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-29 * s, 1 * s);
  g.lineTo(-24 * s, 3 * s);
  g.strokePath();

  // Eye, set just behind the pointed snout.
  g.fillStyle(0xf2ede0, alpha);
  g.fillCircle(-23 * s, -2 * s, 2 * s);
  g.fillStyle(0x201a10, alpha);
  g.fillCircle(-22.7 * s, -2 * s, 1.1 * s);

  g.restore();
}

// A coral trout - a robust, thick-set grouper body (bulkier through the
// middle than any of the elongated open-water fish here, closer to the
// Bull Shark's own heavyset build but with real fins), a big head with a
// blunt snout and thick lips housing a large mouth, a rounded, fanned tail
// instead of any kind of fork (real groupers don't have forked tails), and
// the field mark that makes the species unmistakable: a scatter of small,
// vivid blue spots covering the whole body, head, and fins over a bright
// red-orange base color.
export function drawCoralTrout(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd9502f;
  const backColor = 0xb23522;
  const bellyColor = 0xf0a888;
  const finColor = 0xd9502f;
  const darkColor = 0x531509;
  const spotColor = 0x3fd2e8;

  // A thick-set, robust grouper body - deeper through the middle relative
  // to its length than any of the elongated open-water fish, with a big,
  // blunt-snouted head.
  const body = [
    { x: -30, y: 0 },
    { x: -27, y: -6 },
    { x: -18, y: -11 },
    { x: -4, y: -13 },
    { x: 10, y: -12 },
    { x: 21, y: -8 },
    { x: 28, y: -4 },
    { x: 28, y: 4 },
    { x: 21, y: 8 },
    { x: 10, y: 12 },
    { x: -4, y: 13 },
    { x: -18, y: 11 },
    { x: -27, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A rounded, fanned tail rather than any kind of fork - a real grouper's
  // own tail shape, unlike every open-water fish here.
  g.fillStyle(finColor, alpha);
  g.fillEllipse(37 * s, 0, 20 * s, 18 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(37 * s, 0, 20 * s, 18 * s);

  // Broad, rounded pectoral fin and small pelvic/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 5 * s, -15 * s, 18 * s, 2 * s, 9 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 5 * s, -15 * s, 18 * s, 2 * s, 9 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 11 * s, 1 * s, 18 * s, 12 * s, 11 * s);
  g.fillTriangle(16 * s, -8 * s, 21 * s, -7 * s, 18 * s, -14 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(16 * s, -8 * s, 21 * s, -7 * s, 18 * s, -14 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Subtle darker-red back band, following the top of the body's own
  // profile - a soft countershading, not a crisp two-tone.
  const topProfile = [
    { x: -27, y: -6 },
    { x: -18, y: -11 },
    { x: -4, y: -13 },
    { x: 10, y: -12 },
    { x: 21, y: -8 },
    { x: 28, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  // Paler belly strip.
  const bottomProfile = [
    { x: -18, y: 11 },
    { x: -4, y: 13 },
    { x: 10, y: 12 },
    { x: 21, y: 8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.35 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.4 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // One long, low, continuous dorsal fin - a short spiny front zigzag
  // blending into a longer soft rear lobe, same construction as the
  // Bream's, sized to this bulkier body.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -12, y: -11 },
    { x: -7, y: -13.5 },
    { x: -2, y: -13 },
    { x: 3, y: -12.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(3 * s, -12.5 * s, 15 * s, -9 * s, 9 * s, -20 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(3 * s, -12.5 * s, 15 * s, -9 * s, 9 * s, -20 * s);

  // The scatter of small vivid blue spots covering the body, head, and
  // fins - the real animal's own unmistakable field mark, and unique to
  // this fish in the game.
  g.fillStyle(spotColor, 0.9 * alpha);
  [
    [-22, -3, 1.4],
    [-16, -7, 1.3],
    [-10, -2, 1.5],
    [-14, 3, 1.3],
    [-4, -7, 1.4],
    [-2, 2, 1.5],
    [4, -8, 1.3],
    [6, 1, 1.5],
    [12, -6, 1.4],
    [14, 4, 1.3],
    [20, -2, 1.3],
    [20, 5, 1.2],
    [-24, 2, 1.2],
    [0, -11, 1.1],
    [9, -3, 1.3],
    [-8, 8, 1.2]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  // Thick lips around the big mouth - a real grouper's own jaw, not the
  // thin line the leaner predator fish have.
  g.lineStyle(2.2 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-29 * s, 1 * s);
  g.lineTo(-19 * s, 6 * s);
  g.strokePath();

  // Large eye, set high and forward on the big head.
  g.fillStyle(0xf5ded2, alpha);
  g.fillCircle(-20 * s, -5 * s, 2.8 * s);
  g.fillStyle(0x201008, alpha);
  g.fillCircle(-19.6 * s, -5 * s, 1.6 * s);

  g.restore();
}

// An angler fish - a deep-sea ambush predator built almost entirely around
// its own enormous head: a big, lumpy, bulbous body dominated by a massive
// crescent mouth lined with long, needle-thin teeth, tapering back to a
// small, weak tail stalk (real anglerfish are poor swimmers - all ambush,
// no chase). Near-black skin, since there's no light this deep to reflect
// any color, a tiny near-useless eye, and the real animal's own
// unmistakable field mark: the thin flexible illicium arcing forward over
// the mouth, tipped with a glowing bioluminescent lure - the only spot of
// color on the whole fish.
export function drawAngler(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x0e0d12;
  const bellyColor = 0x1c1a22;
  const finColor = 0x151319;
  const darkColor = 0x000000;
  const toothColor = 0xe8e6e0;
  const lureColor = 0x9be8ff;

  // A big, lumpy, irregular globular body dominated by the head - not a
  // smooth streamlined shape like any of the open-water fish.
  const body = [
    { x: -10, y: -20 },
    { x: 6, y: -22 },
    { x: 19, y: -14 },
    { x: 25, y: -3 },
    { x: 24, y: 8 },
    { x: 14, y: 16 },
    { x: 0, y: 19 },
    { x: -14, y: 15 },
    { x: -25, y: 6 },
    { x: -27, y: -8 },
    { x: -19, y: -18 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A small, weak tail stalk - real anglerfish are poor swimmers, so this
  // reads as an afterthought next to the huge head/body, not a powerful
  // propulsion fin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -4 * s, 38 * s, -6 * s, 30 * s, 2 * s);
  g.fillTriangle(23 * s, 6 * s, 36 * s, 10 * s, 28 * s, 3 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -4 * s, 38 * s, -6 * s, 30 * s, 2 * s);
  g.strokeTriangle(23 * s, 6 * s, 36 * s, 10 * s, 28 * s, 3 * s);

  // Tiny pectoral fin, near the "chin".
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-14 * s, 8 * s, -20 * s, 16 * s, -8 * s, 12 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // A slightly paler underside, barely distinguishable in the dark - deep-
  // sea camouflage means almost no visible countershading, unlike any
  // other fish in the game.
  g.fillStyle(bellyColor, 0.35 * alpha);
  g.fillEllipse(-2 * s, 10 * s, 26 * s, 12 * s);

  g.lineStyle(1.2 * s, darkColor, 0.9 * alpha);
  g.strokePoints(body, true);

  // A few small skin spines - the lumpy, warty texture real deep-sea
  // anglerfish carry.
  g.fillStyle(finColor, 0.8 * alpha);
  [
    [-16, -14, 1.6],
    [4, -19, 1.4],
    [16, -6, 1.5],
    [-22, 0, 1.4],
    [8, 14, 1.4]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  // The massive crescent mouth, held open, lined with long, needle-thin
  // teeth - the real animal's own defining feature.
  g.fillStyle(darkColor, alpha);
  g.beginPath();
  g.moveTo(-25 * s, -2 * s);
  g.lineTo(20 * s, -2 * s);
  g.lineTo(14 * s, 10 * s);
  g.lineTo(-18 * s, 12 * s);
  g.closePath();
  g.fillPath();

  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 7; i += 1) {
    const tt = i / 6;
    const tx = -22 + tt * 38;
    g.fillTriangle(tx * s, -1 * s, (tx + 2.4) * s, -1 * s, (tx + 1.2) * s, 9 * s);
  }
  for (let i = 0; i < 6; i += 1) {
    const tt = i / 5;
    const tx = -18 + tt * 30;
    g.fillTriangle(tx * s, 11 * s, (tx + 2.4) * s, 11 * s, (tx + 1.2) * s, 2 * s);
  }

  // Tiny, near-useless eye, easily lost in the dark skin.
  g.fillStyle(0x2a2732, alpha);
  g.fillCircle(-10 * s, -12 * s, 1.6 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-10 * s, -12 * s, 0.9 * s);

  // The illicium - a thin flexible spine arcing up and forward over the
  // mouth - tipped with the glowing bioluminescent lure (esca): the real
  // animal's own unmistakable field mark, built as layered fading circles
  // for a soft glow rather than a single flat dot.
  g.lineStyle(1.4 * s, 0x2a2732, alpha);
  g.beginPath();
  g.moveTo(-8 * s, -20 * s);
  g.lineTo(-2 * s, -32 * s);
  g.lineTo(10 * s, -34 * s);
  g.strokePath();

  const lureX = 10 * s;
  const lureY = -34 * s;
  g.fillStyle(lureColor, 0.18 * alpha);
  g.fillCircle(lureX, lureY, 9 * s);
  g.fillStyle(lureColor, 0.35 * alpha);
  g.fillCircle(lureX, lureY, 6 * s);
  g.fillStyle(lureColor, 0.9 * alpha);
  g.fillCircle(lureX, lureY, 3 * s);
  g.fillStyle(0xffffff, alpha);
  g.fillCircle(lureX, lureY, 1.4 * s);

  g.restore();
}

// An albacore - rebuilt from a slim, rounded, near-cylindrical body (real
// Thunnus alalunga is noticeably leaner and less deep-bodied than the
// Tuna represented elsewhere here - width is barely a quarter of the
// length, not a third), a small, unremarkable dorsal fin (there is
// nothing tall or sickle-shaped about it - the tuna-family "sickle
// dorsal" look belongs to the other tuna, not this one), and the real
// animal's own actual defining feature given the visual weight it
// deserves: a huge, deeply drooping, hook-curved pectoral "wing" that
// hangs down and back from just behind the gills almost to the vent - the
// single feature real anglers use to call this species "longfin" on
// sight, built here as a broad curved blade rather than a thin extended
// fin. A shallow, barely-forked tail with a bold pale crescent band (not
// the Tuna's deep lunate fork), and cool steel-grey sides with a
// blue-violet back, distinct from the Tuna's navy-black.
export function drawAlbacore(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb8c0ce;
  const backColor = 0x3a3660;
  const bellyColor = 0xeef0f2;
  const finColor = 0x484468;
  const darkColor = 0x201d38;
  const whiteBand = 0xf0eef4;

  // A slim, rounded, near-cylindrical body - noticeably leaner than the
  // Tuna's deeper-chested build, with a fine pointed snout.
  const body = [
    { x: -32, y: 0 },
    { x: -29, y: -2.6 },
    { x: -21, y: -5 },
    { x: -10, y: -6.8 },
    { x: 2, y: -7 },
    { x: 13, y: -6 },
    { x: 21, y: -4 },
    { x: 26, y: -1.8 },
    { x: 26, y: 1.8 },
    { x: 21, y: 4 },
    { x: 13, y: 6 },
    { x: 2, y: 7 },
    { x: -10, y: 6.8 },
    { x: -21, y: 5 },
    { x: -29, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A shallow, barely-forked tail - a soft double curve rather than the
  // Tuna's deep scythe-bladed lunate fork - with a bold pale crescent band
  // along the trailing edge instead of a thin outline.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -1.8 * s, 36 * s, -7 * s, 30 * s, 0);
  g.fillTriangle(26 * s, 1.8 * s, 36 * s, 7 * s, 30 * s, 0);
  g.fillStyle(whiteBand, 0.75 * alpha);
  g.fillTriangle(30 * s, -3.4 * s, 36 * s, -7 * s, 33 * s, -1 * s);
  g.fillTriangle(30 * s, 3.4 * s, 36 * s, 7 * s, 33 * s, 1 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -1.8 * s, 36 * s, -7 * s, 30 * s, 0);
  g.strokeTriangle(26 * s, 1.8 * s, 36 * s, 7 * s, 30 * s, 0);

  // The huge, deeply drooping, hook-curved pectoral "wing" - hanging down
  // and back from just behind the gills almost to the vent, built as a
  // broad curved blade rather than a thin extended fin. This is the real
  // animal's own actual field mark, given the visual weight it deserves.
  {
    const steps = 14;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      // A hook: droops almost straight down first, then curls back and in.
      const ang = -0.15 + tt * 2.05;
      const reach = 27 * Math.sin(Math.min(tt * 1.35, 1) * Math.PI * 0.5);
      const cx = (-15 + Math.sin(ang) * reach) * s;
      const cy = (2 + (1 - Math.cos(ang)) * 17) * s;
      const w = (4.5 - tt * 4) * s;
      const nx = Math.cos(ang);
      const ny = Math.sin(ang);
      left.push({ x: cx + nx * w, y: cy + ny * w });
      right.push({ x: cx - nx * w, y: cy - ny * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  // Small pelvic and anal fins - modest, since the pectoral carries all
  // the visual weight here.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2 * s, 6.5 * s, -4 * s, 11 * s, 2 * s, 7.5 * s);
  g.fillTriangle(8 * s, 6.5 * s, 6 * s, 11 * s, 13 * s, 6 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -29, y: -2.6 },
    { x: -21, y: -5 },
    { x: -10, y: -6.8 },
    { x: 2, y: -7 },
    { x: 13, y: -6 },
    { x: 21, y: -4 },
    { x: 26, y: -1.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.85 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -21, y: 5 },
    { x: -10, y: 6.8 },
    { x: 2, y: 7 },
    { x: 13, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 2.6 * s }))
  );
  g.fillStyle(bellyColor, 0.55 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // A small, unremarkable, plainly triangular dorsal fin - deliberately
  // nothing like the tall sickle shape the other tuna-family fish carry,
  // since the pectoral is this animal's own real signature, not the
  // dorsal.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, -6.5 * s, 1 * s, -7 * s, -4 * s, -12 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, -6.5 * s, 1 * s, -7 * s, -4 * s, -12 * s);

  // Small second dorsal fin, and the row of finlets along the tail stalk -
  // the scombrid family's own field mark, sized down to this leaner body.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(12 * s, -6 * s, 15 * s, -5.2 * s, 13.5 * s, -8.5 * s);
  for (let i = 0; i < 4; i += 1) {
    const fx = 15 + i * 1.7;
    g.fillTriangle(fx * s, -4.5 * s, (fx + 1.1) * s, -4.5 * s, (fx + 0.55) * s, -6.8 * s);
    g.fillTriangle(fx * s, 4.5 * s, (fx + 1.1) * s, 4.5 * s, (fx + 0.55) * s, 6.8 * s);
  }

  // Gill line.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-20 * s, -3.6 * s);
  g.lineTo(-19 * s, 3.6 * s);
  g.strokePath();

  // Eye, forward on the fine pointed snout.
  g.fillStyle(0xeef0f4, alpha);
  g.fillCircle(-25 * s, -1.5 * s, 2.2 * s);
  g.fillStyle(0x0c0a18, alpha);
  g.fillCircle(-24.6 * s, -1.5 * s, 1.2 * s);

  g.restore();
}

// An amberjack - a big, deep-bodied jack relative of the Kingfish, but
// built and colored to read as its own animal, not a resized Yellowtail:
// a bulkier, rounder-shouldered body with a humped nape behind the head,
// plain amber-bronze-olive coloring with none of the Kingfish's vivid
// yellow lateral stripe or golden tail, and the same dark diagonal band
// across the eye that real Seriola jacks share as a family trait.
export function drawAmberjack(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc7bfa0;
  const backColor = 0x6e5a30;
  const bellyColor = 0xefe8d0;
  const finColor = 0x8a7040;
  const darkColor = 0x2e2414;
  const eyeStripeColor = 0x241c10;

  // A humped, deep-shouldered body - bulkier and rounder than the
  // Kingfish's leaner, more elongated build.
  const body = [
    { x: -32, y: 2 },
    { x: -29, y: -6 },
    { x: -20, y: -13 },
    { x: -7, y: -16 },
    { x: 6, y: -16 },
    { x: 17, y: -13 },
    { x: 25, y: -8 },
    { x: 30, y: -3 },
    { x: 30, y: 4 },
    { x: 25, y: 9 },
    { x: 17, y: 13 },
    { x: 6, y: 16 },
    { x: -7, y: 16 },
    { x: -19, y: 12 },
    { x: -27, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Moderately forked tail - plain bronze, none of the Kingfish's gold.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(30 * s, -3 * s, 44 * s, -11 * s, 36 * s, 0);
  g.fillTriangle(30 * s, 4 * s, 44 * s, 11 * s, 36 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(30 * s, -3 * s, 44 * s, -11 * s, 36 * s, 0);
  g.strokeTriangle(30 * s, 4 * s, 44 * s, 11 * s, 36 * s, 0);

  // Broad, rounded pectoral fin - shorter and blunter than the Kingfish's
  // long sickle pectoral.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 4 * s, -18 * s, 15 * s, -3 * s, 8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-11 * s, 4 * s, -18 * s, 15 * s, -3 * s, 8 * s);

  // Pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, 15 * s, -7 * s, 22 * s, 4 * s, 16 * s);
  g.fillTriangle(10 * s, 14 * s, 8 * s, 20 * s, 18 * s, 12 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -29, y: -6 },
    { x: -20, y: -13 },
    { x: -7, y: -16 },
    { x: 6, y: -16 },
    { x: 17, y: -13 },
    { x: 25, y: -8 },
    { x: 30, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 8 * s }))
  );
  g.fillStyle(backColor, 0.6 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -19, y: 12 },
    { x: -7, y: 16 },
    { x: 6, y: 16 },
    { x: 17, y: 13 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 5 * s }))
  );
  g.fillStyle(bellyColor, 0.45 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // One continuous dorsal fin - a short spiny zigzag blending into a long,
  // low soft rear lobe running most of the back.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -7, y: -16 },
    { x: -2, y: -17.5 },
    { x: 3, y: -17 },
    { x: 7, y: -16 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(7 * s, -16 * s, 19 * s, -12 * s, 12 * s, -23 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(7 * s, -16 * s, 19 * s, -12 * s, 12 * s, -23 * s);

  // Gill line.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -10 * s);
  g.lineTo(-17 * s, 10 * s);
  g.strokePath();

  // The dark diagonal band across the eye - a real Seriola family trait
  // shared with the Kingfish, but here on a bulkier, plainer amber fish
  // with no bright stripe or golden tail to go with it.
  g.lineStyle(2.4 * s, eyeStripeColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-27 * s, -8 * s);
  g.lineTo(-31 * s, 3 * s);
  g.strokePath();

  // Eye.
  g.fillStyle(0xf0ead0, alpha);
  g.fillCircle(-25 * s, -2 * s, 2.8 * s);
  g.fillStyle(0x1a1408, alpha);
  g.fillCircle(-24.6 * s, -2 * s, 1.5 * s);

  g.restore();
}

// An Australian salmon - despite the name, not a true salmonid at all (no
// adipose fin, unlike a real Atlantic/Pacific salmon), so it's built as
// its own animal: an elongated, moderately compressed body, olive-green
// back fading to bright silver sides scattered with irregular small dark
// spots (not the neat rows a true salmon carries), a single continuous
// dorsal fin, and a moderately forked tail.
export function drawAustralianSalmon(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc6d4c6;
  const backColor = 0x4a6b3f;
  const bellyColor = 0xf1f5ee;
  const finColor = 0x5c7a52;
  const darkColor = 0x28351f;
  const spotColor = 0x33421f;

  const body = [
    { x: -31, y: 0 },
    { x: -28, y: -3.5 },
    { x: -19, y: -7 },
    { x: -6, y: -9.5 },
    { x: 6, y: -9.5 },
    { x: 16, y: -7.5 },
    { x: 23, y: -4.5 },
    { x: 27, y: -2 },
    { x: 27, y: 2 },
    { x: 23, y: 4.5 },
    { x: 16, y: 7.5 },
    { x: 6, y: 9.5 },
    { x: -6, y: 9.5 },
    { x: -19, y: 7 },
    { x: -28, y: 3.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Moderately forked tail.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -2 * s, 40 * s, -9 * s, 33 * s, 0);
  g.fillTriangle(27 * s, 2 * s, 40 * s, 9 * s, 33 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(27 * s, -2 * s, 40 * s, -9 * s, 33 * s, 0);
  g.strokeTriangle(27 * s, 2 * s, 40 * s, 9 * s, 33 * s, 0);

  // Pectoral, pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-13 * s, 4 * s, -19 * s, 13 * s, -8 * s, 7 * s);
  g.fillTriangle(-1 * s, 9 * s, -4 * s, 16 * s, 6 * s, 10 * s);
  g.fillTriangle(13 * s, 7 * s, 16 * s, 13 * s, 20 * s, 7 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -28, y: -3.5 },
    { x: -19, y: -7 },
    { x: -6, y: -9.5 },
    { x: 6, y: -9.5 },
    { x: 16, y: -7.5 },
    { x: 23, y: -4.5 },
    { x: 27, y: -2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.7 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -19, y: 7 },
    { x: -6, y: 9.5 },
    { x: 6, y: 9.5 },
    { x: 16, y: 7.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Irregular scatter of small dark spots on the upper flank - not the
  // neat rows a true salmonid carries, since this isn't one.
  g.fillStyle(spotColor, 0.75 * alpha);
  [
    [-14, -4, 1.1],
    [-6, -6, 1.2],
    [2, -5, 1],
    [9, -6.5, 1.1],
    [-10, 1, 0.9],
    [16, -4, 1],
    [-2, -2, 0.9]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  // One continuous dorsal fin - no separate adipose fin behind it, unlike
  // a true salmonid.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -8, y: -9.5 },
    { x: -3, y: -11 },
    { x: 2, y: -10.5 },
    { x: 6, y: -9.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 5 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(6 * s, -9.5 * s, 15 * s, -7.5 * s, 10 * s, -15 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(6 * s, -9.5 * s, 15 * s, -7.5 * s, 10 * s, -15 * s);

  // Gill line.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-18 * s, -6 * s);
  g.lineTo(-16 * s, 6 * s);
  g.strokePath();

  // Eye.
  g.fillStyle(0xeef3ec, alpha);
  g.fillCircle(-22 * s, -2 * s, 2.4 * s);
  g.fillStyle(0x131a10, alpha);
  g.fillCircle(-21.6 * s, -2 * s, 1.3 * s);

  g.restore();
}

// An Australian herring - a much smaller relative of the Australian
// Salmon (same genus, Arripis, despite the misleading "herring" name), so
// it shares a family resemblance but is built noticeably slimmer and
// smaller, with its own field mark: fine, close-set dark streaks running
// along the scale rows the length of the flank, instead of the Australian
// Salmon's scattered spots. Blue-green iridescent back over silvery sides.
export function drawAustralianHerring(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc9dcd9;
  const backColor = 0x3f7a72;
  const bellyColor = 0xf3f7f3;
  const finColor = 0x5c948a;
  const darkColor = 0x22453f;

  // A slim, slender torpedo - noticeably slighter than the Australian
  // Salmon's build.
  const body = [
    { x: -24, y: 0 },
    { x: -22, y: -2.5 },
    { x: -15, y: -4.8 },
    { x: -5, y: -6.2 },
    { x: 5, y: -6.2 },
    { x: 12, y: -5 },
    { x: 18, y: -3 },
    { x: 21, y: -1.4 },
    { x: 21, y: 1.4 },
    { x: 18, y: 3 },
    { x: 12, y: 5 },
    { x: 5, y: 6.2 },
    { x: -5, y: 6.2 },
    { x: -15, y: 4.8 },
    { x: -22, y: 2.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Small forked tail.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(21 * s, -1.4 * s, 31 * s, -6 * s, 25 * s, 0);
  g.fillTriangle(21 * s, 1.4 * s, 31 * s, 6 * s, 25 * s, 0);
  g.lineStyle(0.8 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(21 * s, -1.4 * s, 31 * s, -6 * s, 25 * s, 0);
  g.strokeTriangle(21 * s, 1.4 * s, 31 * s, 6 * s, 25 * s, 0);

  // Small pectoral, pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 3 * s, -14 * s, 9 * s, -6 * s, 5 * s);
  g.fillTriangle(-1 * s, 6 * s, -3 * s, 11 * s, 4 * s, 7 * s);
  g.fillTriangle(9 * s, 5 * s, 11 * s, 9 * s, 15 * s, 4.5 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -22, y: -2.5 },
    { x: -15, y: -4.8 },
    { x: -5, y: -6.2 },
    { x: 5, y: -6.2 },
    { x: 12, y: -5 },
    { x: 18, y: -3 },
    { x: 21, y: -1.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.65 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // Fine, close-set dark streaks along the scale rows - the real animal's
  // own field mark, unlike the Australian Salmon's scattered spots or the
  // Mullet's fewer, broader stripes.
  g.lineStyle(0.7 * s, darkColor, 0.55 * alpha);
  [-3.5, -1.2, 1, 3.2].forEach((sy) => {
    g.beginPath();
    g.moveTo(-16 * s, sy * s);
    g.lineTo(17 * s, (sy - 0.6) * s);
    g.strokePath();
  });

  // One low, single dorsal fin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -6.2 * s, 4 * s, -5.8 * s, 0, -11 * s);
  g.lineStyle(0.8 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-4 * s, -6.2 * s, 4 * s, -5.8 * s, 0, -11 * s);

  // Gill line.
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-14 * s, -4 * s);
  g.lineTo(-13 * s, 4 * s);
  g.strokePath();

  // Eye.
  g.fillStyle(0xeef3f2, alpha);
  g.fillCircle(-17.5 * s, -1.5 * s, 1.8 * s);
  g.fillStyle(0x101f1c, alpha);
  g.fillCircle(-17.2 * s, -1.5 * s, 1 * s);

  g.restore();
}

// A barramundi - the real animal's own unmistakable silhouette: a
// concave, dished forehead profile dropping steeply from a humped nape
// down to a large, slightly upturned mouth (a shape none of the other
// fish here share), a broad rounded tail rather than a fork, and a large
// eye. Silvery flanks with a warm bronze-gold sheen, especially toward
// the belly - a real estuarine barra's own coloring.
export function drawBarramundi(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd8cd9e;
  const backColor = 0x5a6a5a;
  const bellyColor = 0xf3e9bd;
  const finColor = 0x7a8060;
  const darkColor = 0x2a3024;

  // The concave/dished forehead - a distinct notch down from the humped
  // nape to the large upturned mouth, unlike any other fish's head here.
  const body = [
    { x: -32, y: 4 },
    { x: -28, y: -2 },
    { x: -24, y: -10 },
    { x: -16, y: -15 },
    { x: -4, y: -16 },
    { x: 9, y: -14 },
    { x: 20, y: -10 },
    { x: 27, y: -5 },
    { x: 30, y: 0 },
    { x: 27, y: 6 },
    { x: 20, y: 11 },
    { x: 9, y: 15 },
    { x: -4, y: 16 },
    { x: -16, y: 13 },
    { x: -26, y: 9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A broad, rounded fan tail - not forked, a real barra's own tail shape.
  g.fillStyle(finColor, alpha);
  g.fillEllipse(38 * s, 0, 20 * s, 19 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(38 * s, 0, 20 * s, 19 * s);

  // Broad pectoral fin and pelvic/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6 * s, -15 * s, 18 * s, 1 * s, 10 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 6 * s, -15 * s, 18 * s, 1 * s, 10 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 14 * s, 1 * s, 21 * s, 12 * s, 15 * s);
  g.fillTriangle(16 * s, -9 * s, 22 * s, -7 * s, 18 * s, -15 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(16 * s, -9 * s, 22 * s, -7 * s, 18 * s, -15 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -28, y: -2 },
    { x: -24, y: -10 },
    { x: -16, y: -15 },
    { x: -4, y: -16 },
    { x: 9, y: -14 },
    { x: 20, y: -10 },
    { x: 27, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 9 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -16, y: 13 },
    { x: -4, y: 16 },
    { x: 9, y: 15 },
    { x: 20, y: 11 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 5 * s }))
  );
  g.fillStyle(bellyColor, 0.55 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.4 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // One long dorsal fin with a distinct notch between the spiny front and
  // soft rear sections - a real barra field mark.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -13, y: -15 },
    { x: -7, y: -17.5 },
    { x: -1, y: -17 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 7 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(3 * s, -16 * s, 14 * s, -12 * s, 8 * s, -22 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(3 * s, -16 * s, 14 * s, -12 * s, 8 * s, -22 * s);

  // Gill line.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -10 * s);
  g.lineTo(-17 * s, 10 * s);
  g.strokePath();

  // The large eye, often catching a reddish highlight in real barra -
  // shown here as a warm amber glint instead of the usual pale iris.
  g.fillStyle(0xf0dca0, alpha);
  g.fillCircle(-21 * s, -3 * s, 3.4 * s);
  g.fillStyle(0xa8501c, 0.6 * alpha);
  g.fillCircle(-21 * s, -3 * s, 2.6 * s);
  g.fillStyle(0x1c0e06, alpha);
  g.fillCircle(-20.6 * s, -3 * s, 1.6 * s);

  g.restore();
}

// A black bream - a deep, laterally-compressed oval body like other
// bream, but built on its own distinct proportions (a steeper, more
// upright forehead than the Yellowfin or Tarwhine) and, above all, its
// own dusky charcoal-black-bronze coloring overall - the real field mark
// that gives the species its name, with none of the Yellowfin's bright
// fins or the Tarwhine's gold pinstripes.
export function drawBlackBream(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x555349;
  const backColor = 0x2a2822;
  const bellyColor = 0x7a7768;
  const finColor = 0x403e35;
  const darkColor = 0x181712;

  const body = [
    { x: -24, y: 0 },
    { x: -21, y: -6 },
    { x: -13, y: -12 },
    { x: -1, y: -16 },
    { x: 10, y: -15 },
    { x: 18, y: -11 },
    { x: 23, y: -6 },
    { x: 25, y: -2 },
    { x: 25, y: 2 },
    { x: 23, y: 6 },
    { x: 18, y: 11 },
    { x: 10, y: 15 },
    { x: -1, y: 16 },
    { x: -13, y: 12 },
    { x: -21, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -2 * s, 36 * s, -8 * s, 30 * s, 0);
  g.fillTriangle(25 * s, 2 * s, 36 * s, 8 * s, 30 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(25 * s, -2 * s, 36 * s, -8 * s, 30 * s, 0);
  g.strokeTriangle(25 * s, 2 * s, 36 * s, 8 * s, 30 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-13 * s, 8 * s, -18 * s, 15 * s, -7 * s, 11 * s);
  g.fillTriangle(1 * s, 14 * s, -2 * s, 20 * s, 7 * s, 15 * s);
  g.fillTriangle(-16 * s, -2 * s, -22 * s, 4 * s, -12 * s, 3 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -21, y: -6 },
    { x: -13, y: -12 },
    { x: -1, y: -16 },
    { x: 10, y: -15 },
    { x: 18, y: -11 },
    { x: 23, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.6 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -13, y: 12 },
    { x: -1, y: 16 },
    { x: 10, y: 15 },
    { x: 18, y: 11 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.4 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // One long dorsal fin - a zigzag spiny front blending into a rounded
  // soft rear lobe, same bream-family construction, own proportions.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -9, y: -13 },
    { x: -5, y: -15.5 },
    { x: -1, y: -15 },
    { x: 3, y: -14.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(3 * s, -14.5 * s, 13 * s, -11 * s, 8 * s, -21 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(3 * s, -14.5 * s, 13 * s, -11 * s, 8 * s, -21 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-14 * s, -9 * s);
  g.lineTo(-12 * s, 9 * s);
  g.strokePath();

  g.fillStyle(0xd8d4c0, alpha);
  g.fillCircle(-17 * s, -5 * s, 2.4 * s);
  g.fillStyle(0x0c0b08, alpha);
  g.fillCircle(-16.6 * s, -5 * s, 1.3 * s);

  g.restore();
}

// A yellowfin bream - the same deep, oval bream silhouette, built on its
// own distinct proportions again (a gentler forehead slope than the Black
// Bream's steep one), silvery-bronze overall, and its own genuine field
// mark: a warm yellow wash across the pelvic, anal and lower tail fins -
// the real detail the species is named for.
export function drawYellowfinBream(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd6cfae;
  const backColor = 0x8f8560;
  const bellyColor = 0xf3ecd0;
  const finColor = 0x8f8560;
  const yellowFin = 0xe0b840;
  const darkColor = 0x332e1e;

  const body = [
    { x: -25, y: 0 },
    { x: -22, y: -5 },
    { x: -14, y: -11 },
    { x: -2, y: -15 },
    { x: 10, y: -14 },
    { x: 19, y: -10 },
    { x: 24, y: -5 },
    { x: 26, y: -1.5 },
    { x: 26, y: 1.5 },
    { x: 24, y: 5 },
    { x: 19, y: 10 },
    { x: 10, y: 14 },
    { x: -2, y: 15 },
    { x: -14, y: 11 },
    { x: -22, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Forked tail with a soft yellow wash on the lower lobe.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -1.5 * s, 37 * s, -8 * s, 31 * s, 0);
  g.fillStyle(yellowFin, 0.8 * alpha);
  g.fillTriangle(26 * s, 1.5 * s, 37 * s, 8 * s, 31 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(26 * s, -1.5 * s, 37 * s, -8 * s, 31 * s, 0);
  g.strokeTriangle(26 * s, 1.5 * s, 37 * s, 8 * s, 31 * s, 0);

  // Pelvic and anal fins, both washed yellow.
  g.fillStyle(yellowFin, 0.85 * alpha);
  g.fillTriangle(-1 * s, 14 * s, -4 * s, 21 * s, 6 * s, 15 * s);
  g.fillTriangle(-14 * s, 3 * s, -20 * s, 10 * s, -9 * s, 6 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-1 * s, 14 * s, -4 * s, 21 * s, 6 * s, 15 * s);
  g.strokeTriangle(-14 * s, 3 * s, -20 * s, 10 * s, -9 * s, 6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -22, y: -5 },
    { x: -14, y: -11 },
    { x: -2, y: -15 },
    { x: 10, y: -14 },
    { x: 19, y: -10 },
    { x: 24, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.5 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -14, y: 11 },
    { x: -2, y: 15 },
    { x: 10, y: 14 },
    { x: 19, y: 10 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -10, y: -12 },
    { x: -6, y: -14.5 },
    { x: -2, y: -14 },
    { x: 2, y: -13.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(2 * s, -13.5 * s, 12 * s, -10 * s, 7 * s, -20 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(2 * s, -13.5 * s, 12 * s, -10 * s, 7 * s, -20 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-15 * s, -8 * s);
  g.lineTo(-13 * s, 8 * s);
  g.strokePath();

  g.fillStyle(0xeef3e8, alpha);
  g.fillCircle(-18 * s, -4 * s, 2.4 * s);
  g.fillStyle(0x14180c, alpha);
  g.fillCircle(-17.6 * s, -4 * s, 1.3 * s);

  g.restore();
}

// A tarwhine - another bream relative, but slimmer and less deep-bodied
// than the Black or Yellowfin Bream, with its own genuine field mark:
// thin, closely-spaced horizontal gold-bronze pinstripes running the
// length of the silvery flank - unlike either other bream's plain sides.
export function drawTarwhine(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd8dcd4;
  const backColor = 0x8a8f78;
  const bellyColor = 0xf3f5ef;
  const finColor = 0x9a9878;
  const stripeColor = 0xa8823a;
  const darkColor = 0x38361f;

  const body = [
    { x: -26, y: 0 },
    { x: -23, y: -4.5 },
    { x: -15, y: -9.5 },
    { x: -3, y: -13 },
    { x: 9, y: -12 },
    { x: 18, y: -8.5 },
    { x: 23, y: -4.5 },
    { x: 25, y: -1.5 },
    { x: 25, y: 1.5 },
    { x: 23, y: 4.5 },
    { x: 18, y: 8.5 },
    { x: 9, y: 12 },
    { x: -3, y: 13 },
    { x: -15, y: 9.5 },
    { x: -23, y: 4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -1.5 * s, 36 * s, -7 * s, 30 * s, 0);
  g.fillTriangle(25 * s, 1.5 * s, 36 * s, 7 * s, 30 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(25 * s, -1.5 * s, 36 * s, -7 * s, 30 * s, 0);
  g.strokeTriangle(25 * s, 1.5 * s, 36 * s, 7 * s, 30 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-13 * s, 3 * s, -18 * s, 10 * s, -7 * s, 6 * s);
  g.fillTriangle(0, 11 * s, -3 * s, 17 * s, 6 * s, 12 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -23, y: -4.5 },
    { x: -15, y: -9.5 },
    { x: -3, y: -13 },
    { x: 9, y: -12 },
    { x: 18, y: -8.5 },
    { x: 23, y: -4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // The thin, closely-spaced gold-bronze pinstripes - the real animal's
  // own field mark, unlike the plainer sides of either other bream.
  g.lineStyle(0.8 * s, stripeColor, 0.65 * alpha);
  [-8, -4.5, -1, 2.5, 6].forEach((sy) => {
    g.beginPath();
    g.moveTo(-19 * s, sy * s);
    g.lineTo(21 * s, (sy - 1.5) * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -9, y: -10 },
    { x: -5, y: -12 },
    { x: -1, y: -11.5 },
    { x: 3, y: -11 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 5 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(3 * s, -11 * s, 11 * s, -8 * s, 6 * s, -17 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(3 * s, -11 * s, 11 * s, -8 * s, 6 * s, -17 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, -6 * s);
  g.lineTo(-14 * s, 6 * s);
  g.strokePath();

  g.fillStyle(0xf0f2ea, alpha);
  g.fillCircle(-19 * s, -3 * s, 2.2 * s);
  g.fillStyle(0x1a1a10, alpha);
  g.fillCircle(-18.6 * s, -3 * s, 1.2 * s);

  g.restore();
}

// A black jewfish - a big, robust croaker, built as a large, elongated-
// oval, blunt-headed fish with a low, slightly inferior mouth (a real
// bottom-oriented croaker's jaw, not a forward-pointing predator's like
// the Tailor's), a long dorsal fin with a visible notch, and a prominent
// lateral line running its length. Dark charcoal-bronze-purple overall -
// the real animal's own namesake coloring, and by far the darkest,
// heaviest-built of the "normal" fish here.
export function drawBlackJewfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x4a4550;
  const backColor = 0x241f28;
  const bellyColor = 0x6a6470;
  const finColor = 0x353040;
  const darkColor = 0x120f16;

  const body = [
    { x: -33, y: 1 },
    { x: -30, y: -6 },
    { x: -21, y: -12 },
    { x: -7, y: -15 },
    { x: 7, y: -14.5 },
    { x: 18, y: -11 },
    { x: 26, y: -6 },
    { x: 31, y: -1.5 },
    { x: 31, y: 3 },
    { x: 26, y: 8 },
    { x: 18, y: 12 },
    { x: 7, y: 15 },
    { x: -7, y: 15 },
    { x: -20, y: 11 },
    { x: -29, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(31 * s, -1.5 * s, 43 * s, -8 * s, 36 * s, 0);
  g.fillTriangle(31 * s, 3 * s, 43 * s, 9 * s, 36 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(31 * s, -1.5 * s, 43 * s, -8 * s, 36 * s, 0);
  g.strokeTriangle(31 * s, 3 * s, 43 * s, 9 * s, 36 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 6 * s, -18 * s, 17 * s, -3 * s, 10 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-11 * s, 6 * s, -18 * s, 17 * s, -3 * s, 10 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(2 * s, 13 * s, -1 * s, 20 * s, 9 * s, 14 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -30, y: -6 },
    { x: -21, y: -12 },
    { x: -7, y: -15 },
    { x: 7, y: -14.5 },
    { x: 18, y: -11 },
    { x: 26, y: -6 },
    { x: 31, y: -1.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 7 * s }))
  );
  g.fillStyle(backColor, 0.7 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -20, y: 11 },
    { x: -7, y: 15 },
    { x: 7, y: 15 },
    { x: 18, y: 12 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4.5 * s }))
  );
  g.fillStyle(bellyColor, 0.35 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.4 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The prominent lateral line - a real croaker/jewfish field mark, drawn
  // as a slightly raised, visible line down the flank.
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -4 * s);
  g.lineTo(5 * s, -3 * s);
  g.lineTo(27 * s, -2 * s);
  g.strokePath();

  // One long dorsal fin with a visible notch between the spiny front and
  // soft rear sections.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -12, y: -12 },
    { x: -6, y: -15 },
    { x: 0, y: -14.5 },
    { x: 5, y: -14 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(9 * s, -13 * s, 20 * s, -9.5 * s, 14 * s, -20 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(9 * s, -13 * s, 20 * s, -9.5 * s, 14 * s, -20 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-22 * s, -8 * s);
  g.lineTo(-20 * s, 8 * s);
  g.strokePath();

  // The low, slightly inferior mouth of a real bottom-oriented croaker.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-32 * s, 3 * s);
  g.lineTo(-20 * s, 7 * s);
  g.strokePath();

  g.fillStyle(0x6a6470, alpha);
  g.fillCircle(-24 * s, -3 * s, 2.6 * s);
  g.fillStyle(0x0a0810, alpha);
  g.fillCircle(-23.6 * s, -3 * s, 1.4 * s);

  g.restore();
}

// A blue-eye trevalla - not actually related to the Trevally despite the
// common name (a different family entirely), so it's built as its own
// animal: a deep-bodied, blunt, evenly rounded head (not the Trevally's
// steep vertical forehead, and not the Barramundi's dished concave one
// either), a moderately forked tail, and the real animal's own
// unmistakable field mark - a large, vivid blue eye. Dark blue-grey to
// purplish-black overall, a genuine deep-water color.
export function drawBlueEyeTrevalla(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x3c4658;
  const backColor = 0x1c2230;
  const bellyColor = 0x5a6478;
  const finColor = 0x2c3444;
  const darkColor = 0x0e1118;
  const eyeGlow = 0x3fb0e8;

  // A deep-bodied fish with a blunt, evenly rounded head - distinct from
  // both the Trevally's steep forehead and the Barramundi's dished one.
  const body = [
    { x: -28, y: 3 },
    { x: -26, y: -6 },
    { x: -18, y: -13 },
    { x: -5, y: -17 },
    { x: 8, y: -16 },
    { x: 18, y: -12 },
    { x: 25, y: -6 },
    { x: 28, y: -1.5 },
    { x: 28, y: 3 },
    { x: 25, y: 8 },
    { x: 18, y: 13 },
    { x: 8, y: 17 },
    { x: -5, y: 17 },
    { x: -17, y: 13 },
    { x: -25, y: 8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A moderately forked tail.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(28 * s, -1.5 * s, 40 * s, -8 * s, 33 * s, 0);
  g.fillTriangle(28 * s, 3 * s, 40 * s, 10 * s, 33 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(28 * s, -1.5 * s, 40 * s, -8 * s, 33 * s, 0);
  g.strokeTriangle(28 * s, 3 * s, 40 * s, 10 * s, 33 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 6 * s, -17 * s, 17 * s, -2 * s, 10 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-10 * s, 6 * s, -17 * s, 17 * s, -2 * s, 10 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 15 * s, 1 * s, 22 * s, 11 * s, 16 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -26, y: -6 },
    { x: -18, y: -13 },
    { x: -5, y: -17 },
    { x: 8, y: -16 },
    { x: 18, y: -12 },
    { x: 25, y: -6 },
    { x: 28, y: -1.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -17, y: 13 },
    { x: -5, y: 17 },
    { x: 8, y: 17 },
    { x: 18, y: 13 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.4 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // One long, low dorsal fin.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -10, y: -13 },
    { x: -5, y: -16 },
    { x: 0, y: -15.5 },
    { x: 5, y: -15 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 5 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(5 * s, -15 * s, 15 * s, -11 * s, 10 * s, -19 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(5 * s, -15 * s, 15 * s, -11 * s, 10 * s, -19 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-18 * s, -9 * s);
  g.lineTo(-16 * s, 9 * s);
  g.strokePath();

  // The large, vivid blue eye - the real animal's own unmistakable field
  // mark and namesake, built with a soft glow like the Angler Fish's lure.
  g.fillStyle(eyeGlow, 0.25 * alpha);
  g.fillCircle(-21 * s, -4 * s, 5.5 * s);
  g.fillStyle(eyeGlow, 0.9 * alpha);
  g.fillCircle(-21 * s, -4 * s, 3.6 * s);
  g.fillStyle(0x0a0e14, alpha);
  g.fillCircle(-20.6 * s, -4 * s, 1.6 * s);

  g.restore();
}

// A blue groper - a big, robust wrasse with a deep, rounded body, a
// pronounced forehead hump rising sharply behind the snout, thick fleshy
// lips, and a single long, low, continuous dorsal fin running most of the
// back (a real wrasse's own fin arrangement, not a bream-style zigzag), a
// rounded tail rather than any kind of fork. Vivid, solid electric-blue
// coloring - the real animal's own unmistakable field mark and the only
// solid-blue fish in the game.
export function drawBlueGroper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x2f6fc0;
  const backColor = 0x143a68;
  const bellyColor = 0x6ba4dc;
  const finColor = 0x1f5490;
  const darkColor = 0x0c1f38;
  const lipColor = 0x7a4a5a;

  // A deep, rounded body with a pronounced forehead hump rising sharply
  // behind the snout - a real groper's own silhouette.
  const body = [
    { x: -26, y: 3 },
    { x: -23, y: -6 },
    { x: -14, y: -13 },
    { x: -1, y: -17 },
    { x: 12, y: -15 },
    { x: 20, y: -10 },
    { x: 25, y: -5 },
    { x: 27, y: 0 },
    { x: 25, y: 5 },
    { x: 20, y: 10 },
    { x: 12, y: 15 },
    { x: -1, y: 17 },
    { x: -14, y: 13 },
    { x: -22, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A rounded tail, not forked - a real wrasse's own tail shape.
  g.fillStyle(finColor, alpha);
  g.fillEllipse(34 * s, 0, 15 * s, 15 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(34 * s, 0, 15 * s, 15 * s);

  // Broad pectoral fin and pelvic/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6 * s, -14 * s, 16 * s, -1 * s, 9 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 6 * s, -14 * s, 16 * s, -1 * s, 9 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(3 * s, 15 * s, 0, 21 * s, 9 * s, 15 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -23, y: -6 },
    { x: -14, y: -13 },
    { x: -1, y: -17 },
    { x: 12, y: -15 },
    { x: 20, y: -10 },
    { x: 25, y: -5 },
    { x: 27, y: 0 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 8 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -14, y: 13 },
    { x: -1, y: 17 },
    { x: 12, y: 15 },
    { x: 20, y: 10 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.35 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.4 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // A few arc lines suggesting the large, coarse scales real groper carry.
  g.lineStyle(0.7 * s, darkColor, 0.3 * alpha);
  [
    [-8, -4, 6],
    [2, -6, 7],
    [10, -4, 6],
    [-6, 4, 6],
    [4, 6, 6.5]
  ].forEach(([cx, cy, r]) => {
    g.beginPath();
    g.arc(cx * s, cy * s, r * s, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340));
    g.strokePath();
  });

  // One long, low, continuous dorsal fin - a real wrasse's own fin
  // arrangement, not the zigzag-spine construction the bream family use.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -13 * s, y: -13 * s },
      { x: 11 * s, y: -15 * s },
      { x: 11 * s, y: -21 * s },
      { x: -10 * s, y: -19 * s }
    ],
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -13 * s, y: -13 * s },
      { x: 11 * s, y: -15 * s },
      { x: 11 * s, y: -21 * s },
      { x: -10 * s, y: -19 * s }
    ],
    true
  );

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-17 * s, -8 * s);
  g.lineTo(-15 * s, 8 * s);
  g.strokePath();

  // Thick, fleshy lips around the mouth - a real groper's own field mark.
  g.fillStyle(lipColor, 0.85 * alpha);
  g.fillEllipse(-24 * s, 2 * s, 6 * s, 3.4 * s);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-24 * s, 2 * s, 6 * s, 3.4 * s);

  g.fillStyle(0xd8e6f2, alpha);
  g.fillCircle(-16 * s, -6 * s, 2.6 * s);
  g.fillStyle(0x0a1420, alpha);
  g.fillCircle(-15.6 * s, -6 * s, 1.4 * s);

  g.restore();
}

// A bonito - rebuilt stocky and short-coupled rather than lean and
// elongated: a real Sarda is a noticeably more robust, muscular fish for
// its length than the Spotted Mackerel (depth is roughly 40% of length
// here, well beyond the Mackerel's ~26%, closer to the Amberjack's own
// bulk but on a much smaller frame), with one long, low, continuously-
// bowed dorsal fin built as a single blade rather than the Mackerel's
// separate spiny-zigzag-into-lobe construction. The real animal's own
// diagnostic field mark - bold, dark, OBLIQUE stripes running diagonally
// across the back (not vertical bars, spot rows, or horizontal
// pinstripes) - is kept, since that genuinely is what identifies a Bonito.
export function drawBonito(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb8ccd0;
  const backColor = 0x22505c;
  const bellyColor = 0xeef4f2;
  const finColor = 0x336068;
  const darkColor = 0x102428;
  const stripeColor = 0x143238;

  // A short-coupled, stocky body - real bonito are far more robust for
  // their length than the leaner scombrids elsewhere here.
  const body = [
    { x: -27, y: 0 },
    { x: -24, y: -4.5 },
    { x: -15, y: -8 },
    { x: -3, y: -10.5 },
    { x: 9, y: -10 },
    { x: 18, y: -7.5 },
    { x: 23, y: -4.5 },
    { x: 26, y: -2 },
    { x: 26, y: 2 },
    { x: 23, y: 4.5 },
    { x: 18, y: 7.5 },
    { x: 9, y: 10 },
    { x: -3, y: 10.5 },
    { x: -15, y: 8 },
    { x: -24, y: 4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A moderately forked tail, shallower than the Tuna's deep lunate scythe.
  [
    { angle: -0.5, bow: 7 },
    { angle: 0.5, bow: -7 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 18;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (26 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (4 - tt * 3.6) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  // Pectoral, pelvic and anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 4 * s, -15 * s, 13 * s, -4 * s, 7 * s);
  g.fillTriangle(0, 10 * s, -3 * s, 16 * s, 5 * s, 11 * s);
  g.fillTriangle(11 * s, 8 * s, 14 * s, 13 * s, 18 * s, 7 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -24, y: -4.5 },
    { x: -15, y: -8 },
    { x: -3, y: -10.5 },
    { x: 9, y: -10 },
    { x: 18, y: -7.5 },
    { x: 23, y: -4.5 },
    { x: 26, y: -2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 7 * s }))
  );
  g.fillStyle(backColor, 0.85 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -15, y: 8 },
    { x: -3, y: 10.5 },
    { x: 9, y: 10 },
    { x: 18, y: 7.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 3.5 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The bold, dark, OBLIQUE stripes running diagonally across the back -
  // the real, diagnostic Bonito field mark.
  g.lineStyle(1.4 * s, stripeColor, 0.75 * alpha);
  [-18, -11, -4, 3, 10, 17].forEach((sx) => {
    g.beginPath();
    g.moveTo(sx * s, -9.5 * s);
    g.lineTo((sx + 8) * s, 0);
    g.strokePath();
  });

  // One long, low, continuously-bowed dorsal fin, built as a single blade
  // (not the Mackerel's separate spiny-zigzag-plus-lobe assembly) - a real
  // bonito's dorsal is long-based and can lie flat in a groove, not a
  // tall sickle or a segmented spiny fin.
  {
    const angle = 0.12;
    const len = 24;
    const bow = 5.5;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 10;
    const left = [];
    const right = [];
    const baseX = -10;
    const baseY = -10.3;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (3.4 - tt * 3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  // The row of finlets along the tail stalk - the scombrid family's own
  // field mark.
  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const fx = 16 + i * 2;
    g.fillTriangle(fx * s, -6 * s, (fx + 1.4) * s, -6 * s, (fx + 0.7) * s, -9 * s);
    g.fillTriangle(fx * s, 6 * s, (fx + 1.4) * s, 6 * s, (fx + 0.7) * s, 9 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-17 * s, -6 * s);
  g.lineTo(-15 * s, 6 * s);
  g.strokePath();

  g.fillStyle(0xeef3f2, alpha);
  g.fillCircle(-20.5 * s, -2.5 * s, 2.5 * s);
  g.fillStyle(0x0a1618, alpha);
  g.fillCircle(-20.1 * s, -2.5 * s, 1.3 * s);

  g.restore();
}

// A cobia - built as its own unmistakable animal, often mistaken for a
// shark at a glance for exactly this reason: a long, cylindrical, almost
// uniform-depth body (not tapering smoothly like a true torpedo-shaped
// fish), a broad, flattened head, a bold dark lateral stripe the length of
// the body, a broadly forked tail, and the real animal's own genuinely
// unique field mark - a row of short, separate, free-standing spines
// ahead of the soft dorsal fin, not a single connected fin membrane like
// every other fish here.
export function drawCobia(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x8a8a80;
  const backColor = 0x4a4a3e;
  const bellyColor = 0xd8d6c4;
  const finColor = 0x38382e;
  const darkColor = 0x1a1a12;
  const stripeColor = 0x201f16;

  // A long, cylindrical, almost uniform-depth body with a broad, flattened
  // head - a real cobia's own silhouette, unlike any tapered torpedo fish.
  const body = [
    { x: -33, y: -3 },
    { x: -30, y: -7 },
    { x: -22, y: -9.5 },
    { x: -8, y: -10 },
    { x: 8, y: -10 },
    { x: 18, y: -9 },
    { x: 25, y: -6.5 },
    { x: 29, y: -3 },
    { x: 29, y: 3 },
    { x: 25, y: 6.5 },
    { x: 18, y: 9 },
    { x: 8, y: 10 },
    { x: -8, y: 10 },
    { x: -22, y: 9.5 },
    { x: -30, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A broadly forked tail.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(29 * s, -3 * s, 42 * s, -10 * s, 34 * s, 0);
  g.fillTriangle(29 * s, 3 * s, 42 * s, 10 * s, 34 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(29 * s, -3 * s, 42 * s, -10 * s, 34 * s, 0);
  g.strokeTriangle(29 * s, 3 * s, 42 * s, 10 * s, 34 * s, 0);

  // Broad pectoral fin and pelvic/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 5 * s, -15 * s, 15 * s, -1 * s, 8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 5 * s, -15 * s, 15 * s, -1 * s, 8 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(6 * s, 9 * s, 3 * s, 15 * s, 13 * s, 9.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -30, y: -7 },
    { x: -22, y: -9.5 },
    { x: -8, y: -10 },
    { x: 8, y: -10 },
    { x: 18, y: -9 },
    { x: 25, y: -6.5 },
    { x: 29, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.5 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -22, y: 9.5 },
    { x: -8, y: 10 },
    { x: 8, y: 10 },
    { x: 18, y: 9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 3 * s }))
  );
  g.fillStyle(bellyColor, 0.4 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The bold, dark lateral stripe the length of the body - a real cobia's
  // own field mark, flanked by a paler band just above it.
  g.lineStyle(2.6 * s, stripeColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-27 * s, 0);
  g.lineTo(27 * s, 0);
  g.strokePath();
  g.lineStyle(1.4 * s, bellyColor, 0.35 * alpha);
  g.beginPath();
  g.moveTo(-27 * s, -3 * s);
  g.lineTo(27 * s, -3 * s);
  g.strokePath();

  // The row of short, separate, free-standing spines ahead of the soft
  // dorsal - the real animal's own genuinely unique field mark, drawn as
  // isolated stiff blades rather than one connected fin membrane.
  g.lineStyle(1.6 * s, darkColor, 0.85 * alpha);
  for (let i = 0; i < 7; i += 1) {
    const spx = -14 + i * 3.4;
    g.beginPath();
    g.moveTo(spx * s, -10 * s);
    g.lineTo(spx * s, -15 * s);
    g.strokePath();
  }

  // The soft rear dorsal lobe, a proper connected fin, set behind the
  // free spines.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, -10 * s, 20 * s, -8 * s, 15 * s, -15 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(11 * s, -10 * s, 20 * s, -8 * s, 15 * s, -15 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-20 * s, -7 * s);
  g.lineTo(-18 * s, 7 * s);
  g.strokePath();

  g.fillStyle(0xd0cfc0, alpha);
  g.fillCircle(-25 * s, -2.5 * s, 2.4 * s);
  g.fillStyle(0x0c0c08, alpha);
  g.fillCircle(-24.6 * s, -2.5 * s, 1.3 * s);

  g.restore();
}

// A dusky flathead - the biggest and most familiar of the game's flathead
// species, sharing the family's own distinctive flat, low-profile,
// froglike head with high-set eyes, but marked with mottled brown-olive
// camouflage AND the real animal's own famous, genuinely diagnostic field
// mark: a dark blotch ringed with small pale blue spots right at the base
// of the tail fin, unlike any other flathead here.
export function drawDuskyFlathead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const baseColor = 0xa8894f;
  const darkColor = 0x6f5430;
  const finColor = 0x8a6f45;
  const tailSpotColor = 0x241b10;
  const tailBlueColor = 0x4fa8d8;

  const body = [
    { x: -33, y: -2 },
    { x: -23, y: -5 },
    { x: -12, y: -11 },
    { x: 0, y: -13 },
    { x: 12, y: -10 },
    { x: 21, y: -6 },
    { x: 28, y: -3 },
    { x: 28, y: 3 },
    { x: 21, y: 6 },
    { x: 11, y: 8 },
    { x: -2, y: 8 },
    { x: -16, y: 6 },
    { x: -29, y: 2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Tail fin, marked with the real animal's own diagnostic dark-blotch-
  // and-blue-spots field mark.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(28 * s, -3 * s, 28 * s, 3 * s, 41 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(28 * s, -3 * s, 28 * s, 3 * s, 41 * s, 0);
  g.fillStyle(tailSpotColor, 0.85 * alpha);
  g.fillEllipse(33 * s, 0, 6 * s, 4.5 * s);
  g.fillStyle(tailBlueColor, 0.9 * alpha);
  [
    [30, -2, 0.7],
    [33, -2.5, 0.7],
    [36, -1.5, 0.6],
    [30, 2, 0.7],
    [33, 2.5, 0.7],
    [36, 1.5, 0.6]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 4 * s, -14 * s, 14 * s, -2 * s, 8 * s);

  g.fillStyle(baseColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.4 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(darkColor, 0.55 * alpha);
  [
    [-14, -4, 4],
    [-2, -6, 3.5],
    [8, -3, 3],
    [-8, 3, 3],
    [4, 4, 2.6]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 2 * s, br * 1.3 * s));

  g.fillStyle(0xf2e6c8, alpha);
  g.fillCircle(-21 * s, -6 * s, 2.6 * s);
  g.fillStyle(0x201510, alpha);
  g.fillCircle(-20.5 * s, -6 * s, 1.4 * s);

  g.restore();
}

// A tiger flathead - the same froglike, flat-headed flathead silhouette,
// built on its own proportions, but in warm reddish-orange-pink coloring
// (an offshore species, unlike the estuary-dwelling Dusky) banded with
// darker "tiger" mottled bars across the back rather than blotchy camo
// patches.
export function drawTigerFlathead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const baseColor = 0xc47c5a;
  const darkColor = 0x7a3f28;
  const finColor = 0xb06a48;
  const barColor = 0x8a4529;

  const body = [
    { x: -30, y: -2 },
    { x: -21, y: -5 },
    { x: -11, y: -10 },
    { x: 0, y: -12 },
    { x: 11, y: -9 },
    { x: 19, y: -5.5 },
    { x: 25, y: -2.5 },
    { x: 25, y: 2.5 },
    { x: 19, y: 5.5 },
    { x: 10, y: 7 },
    { x: -2, y: 7 },
    { x: -14, y: 5.5 },
    { x: -26, y: 2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -2.5 * s, 25 * s, 2.5 * s, 37 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(25 * s, -2.5 * s, 25 * s, 2.5 * s, 37 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 3.5 * s, -12 * s, 12 * s, -1 * s, 7 * s);

  g.fillStyle(baseColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Darker "tiger" mottled bars angled across the back - the real animal's
  // own pattern, unlike the Dusky's blotchy camo.
  g.lineStyle(2.2 * s, barColor, 0.6 * alpha);
  [-16, -8, 0, 8, 16].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -9 * s);
    g.lineTo((bx + 4) * s, 6 * s);
    g.strokePath();
  });

  g.fillStyle(0xf2ded0, alpha);
  g.fillCircle(-19 * s, -5 * s, 2.4 * s);
  g.fillStyle(0x1c0e08, alpha);
  g.fillCircle(-18.5 * s, -5 * s, 1.3 * s);

  g.restore();
}

// A bluespotted flathead - the same froglike flathead silhouette, but
// olive-brown and covered in a dense scatter of small, vivid blue spots -
// the real animal's own signature field mark, and the flathead family's
// answer to the Coral Trout's spotting, just on a much flatter body.
export function drawBluespottedFlathead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const baseColor = 0x8f8555;
  const darkColor = 0x564a28;
  const finColor = 0x7a7048;
  const spotColor = 0x3fa8e0;

  const body = [
    { x: -27, y: -2 },
    { x: -19, y: -4.5 },
    { x: -10, y: -9 },
    { x: 0, y: -10.5 },
    { x: 10, y: -8 },
    { x: 17, y: -5 },
    { x: 22, y: -2.5 },
    { x: 22, y: 2.5 },
    { x: 17, y: 5 },
    { x: 9, y: 6.5 },
    { x: -2, y: 6.5 },
    { x: -13, y: 5 },
    { x: -23, y: 2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(22 * s, -2.5 * s, 22 * s, 2.5 * s, 33 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(22 * s, -2.5 * s, 22 * s, 2.5 * s, 33 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 3 * s, -10 * s, 10 * s, 0, 6 * s);

  g.fillStyle(baseColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The dense scatter of small vivid blue spots - the real animal's own
  // signature field mark.
  g.fillStyle(spotColor, 0.85 * alpha);
  [
    [-16, -3, 1],
    [-9, -5, 1.1],
    [-2, -6, 1],
    [5, -5, 1],
    [12, -3, 0.9],
    [-13, 2, 0.9],
    [-5, 3, 1],
    [3, 3, 1],
    [10, 2, 0.9],
    [16, -1, 0.8],
    [-20, 0, 0.8]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(0xeee8c8, alpha);
  g.fillCircle(-17 * s, -4.5 * s, 2.2 * s);
  g.fillStyle(0x181408, alpha);
  g.fillCircle(-16.6 * s, -4.5 * s, 1.2 * s);

  g.restore();
}

// A sand flathead - the smallest, plainest of the game's flathead, pale
// sandy-tan to match the shallow bay sand it lives over, with only faint,
// soft mottling instead of any bold pattern - the real animal's own
// understated, camouflage-first coloring.
export function drawSandFlathead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const baseColor = 0xd6c896;
  const darkColor = 0x8a7a4a;
  const finColor = 0xc4b482;

  const body = [
    { x: -24, y: -1.5 },
    { x: -17, y: -4 },
    { x: -9, y: -7.5 },
    { x: 0, y: -9 },
    { x: 9, y: -7 },
    { x: 15, y: -4.5 },
    { x: 19, y: -2 },
    { x: 19, y: 2 },
    { x: 15, y: 4.5 },
    { x: 8, y: 6 },
    { x: -2, y: 6 },
    { x: -12, y: 4.5 },
    { x: -21, y: 1.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(19 * s, -2 * s, 19 * s, 2 * s, 28 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(19 * s, -2 * s, 19 * s, 2 * s, 28 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, 2.5 * s, -8 * s, 8.5 * s, 1 * s, 5.5 * s);

  g.fillStyle(baseColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  // Faint, soft mottling only - much subtler than the Dusky/Tiger/
  // Bluespotted flathead's own bolder patterns.
  g.fillStyle(darkColor, 0.3 * alpha);
  [
    [-10, -3, 2.6],
    [0, -4, 2.4],
    [7, -2, 2.2],
    [-4, 2.5, 2.2]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 2 * s, br * 1.2 * s));

  g.fillStyle(0xf2ecd4, alpha);
  g.fillCircle(-15 * s, -3.5 * s, 2 * s);
  g.fillStyle(0x1c1608, alpha);
  g.fillCircle(-14.6 * s, -3.5 * s, 1.1 * s);

  g.restore();
}

// A rock flathead - the same froglike flathead silhouette, but in darker
// olive-green-brown to match the rocky, weedy reef structure it lives
// among (unlike the sand-matching Sand Flathead or the estuary-mud Dusky),
// with a smoother, plainer flank than the more heavily patterned species.
export function drawRockFlathead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const baseColor = 0x5c6b48;
  const darkColor = 0x333d24;
  const finColor = 0x4e5c3c;

  const body = [
    { x: -28, y: -2 },
    { x: -19, y: -4.5 },
    { x: -10, y: -9.5 },
    { x: 0, y: -11 },
    { x: 10, y: -8.5 },
    { x: 18, y: -5 },
    { x: 24, y: -2.5 },
    { x: 24, y: 2.5 },
    { x: 18, y: 5 },
    { x: 9, y: 6.5 },
    { x: -2, y: 6.5 },
    { x: -14, y: 5 },
    { x: -24, y: 2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -2.5 * s, 24 * s, 2.5 * s, 35 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(24 * s, -2.5 * s, 24 * s, 2.5 * s, 35 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 3.5 * s, -12 * s, 11 * s, -1 * s, 7 * s);

  g.fillStyle(baseColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // A smoother, plainer flank than the other flathead - just a few soft
  // dark patches, matching a real rocky-reef camouflage rather than a
  // bold pattern.
  g.fillStyle(darkColor, 0.4 * alpha);
  [
    [-12, -5, 3],
    [-1, -7, 3],
    [9, -4, 2.6],
    [-6, 2, 2.6]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 2 * s, br * 1.3 * s));

  g.fillStyle(0xe8ecd4, alpha);
  g.fillCircle(-17 * s, -4.5 * s, 2.3 * s);
  g.fillStyle(0x14180a, alpha);
  g.fillCircle(-16.6 * s, -4.5 * s, 1.2 * s);

  g.restore();
}

// A flounder - built with a genuinely different construction from every
// other fish here, since a real flatfish IS built differently: a flat,
// rounded oval/diamond body instead of an elongated torpedo, both eyes on
// the one visible side (the real animal's own defining anatomical trait),
// and a continuous, low, frilled fin membrane running almost the entire
// perimeter of the body rather than a handful of separate fins. Sandy-
// brown, mottled with irregular dark blotches for camouflage against the
// sea floor it spends most of its life lying on.
export function drawFlounder(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc7b482;
  const darkColor = 0x4a3d24;
  const finColor = 0xb4a173;
  const blotchColor = 0x6b5a34;

  // A flat, rounded oval/diamond body - the real flatfish silhouette, not
  // an elongated torpedo like every other fish here.
  const body = [
    { x: -27, y: 0 },
    { x: -24, y: -8 },
    { x: -14, y: -16 },
    { x: 0, y: -19 },
    { x: 14, y: -17 },
    { x: 22, y: -10 },
    { x: 26, y: 0 },
    { x: 22, y: 10 },
    { x: 14, y: 17 },
    { x: 0, y: 19 },
    { x: -14, y: 16 },
    { x: -24, y: 8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The continuous, low, frilled fin membrane wrapping almost the whole
  // perimeter - a slightly larger, translucent outline just outside the
  // body's own edge, the real flatfish's own fin arrangement instead of a
  // handful of separate fins.
  const finOutline = body.map((p) => ({ x: p.x * 1.16, y: p.y * 1.16 }));
  g.fillStyle(finColor, 0.55 * alpha);
  g.fillPoints(finOutline, true);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokePoints(finOutline, true);

  // Small tail fin at the narrow end.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -8 * s, 26 * s, 8 * s, 35 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -8 * s, 26 * s, 8 * s, 35 * s, 0);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Irregular dark blotches scattered across the body - a real flatfish's
  // own excellent sea-floor camouflage.
  g.fillStyle(blotchColor, 0.55 * alpha);
  [
    [-10, -6, 3.6],
    [4, -9, 3.2],
    [14, -2, 2.8],
    [-4, 4, 3.4],
    [8, 8, 2.8],
    [-14, 6, 2.6]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 2 * s, br * 1.4 * s));

  // A small mouth at the head end.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-26 * s, -2 * s);
  g.lineTo(-20 * s, 1 * s);
  g.strokePath();

  // Both eyes on the one visible side, close together - the real animal's
  // own defining anatomical trait, and the whole reason a flatfish looks
  // the way it does.
  g.fillStyle(0xe8dcb8, alpha);
  g.fillCircle(-14 * s, -11 * s, 2.6 * s);
  g.fillCircle(-8 * s, -13 * s, 2.6 * s);
  g.fillStyle(0x1c1608, alpha);
  g.fillCircle(-13.6 * s, -11 * s, 1.4 * s);
  g.fillCircle(-7.6 * s, -13 * s, 1.4 * s);

  g.restore();
}

// A southern flounder - the same real flatfish anatomy as the plain
// Flounder (both eyes on one visible side, a continuous frilled fin
// membrane wrapping the perimeter), but built on a distinctly more
// elongated, less rounded oval (real Paralichthys lethostigma reads
// longer and leaner than a round "silver dollar" flatfish), with a
// notably large mouth and visible teeth - a genuine Southern Flounder
// field mark, unlike the small closed mouth of the plain Flounder or the
// ocellated Summer Flounder - and diffuse, muddy brown-grey mottling with
// no distinct eye-spots.
export function drawSouthernFlounder(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x8f8577;
  const darkColor = 0x342c22;
  const finColor = 0x76695a;
  const blotchColor = 0x4a4030;
  const toothColor = 0xf0ece0;

  // A more elongated, less rounded oval than the plain Flounder's own
  // silhouette.
  const body = [
    { x: -32, y: 0 },
    { x: -28, y: -6 },
    { x: -18, y: -13 },
    { x: -4, y: -16 },
    { x: 10, y: -15 },
    { x: 20, y: -9 },
    { x: 25, y: 0 },
    { x: 20, y: 9 },
    { x: 10, y: 15 },
    { x: -4, y: 16 },
    { x: -18, y: 13 },
    { x: -28, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const finOutline = body.map((p) => ({ x: p.x * 1.15, y: p.y * 1.15 }));
  g.fillStyle(finColor, 0.5 * alpha);
  g.fillPoints(finOutline, true);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokePoints(finOutline, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -8 * s, 25 * s, 8 * s, 33 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(25 * s, -8 * s, 25 * s, 8 * s, 33 * s, 0);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Diffuse, muddy mottling - big irregular blotches, not distinct spots.
  g.fillStyle(blotchColor, 0.6 * alpha);
  [
    [-12, -6, 4.4],
    [2, -10, 4],
    [16, -4, 3.6],
    [-6, 5, 4],
    [10, 9, 3.4],
    [-18, 3, 3]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 2.2 * s, br * 1.5 * s));

  // A notably large mouth with visible teeth - the real Southern
  // Flounder's own field mark, a genuinely bigger predator's jaw than
  // most other flatfish carry.
  g.fillStyle(darkColor, alpha);
  g.fillEllipse(-27 * s, 1 * s, 9 * s, 5 * s);
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const tx = -31 + i * 2.6;
    g.fillTriangle(tx * s, -1 * s, (tx + 1.6) * s, -0.4 * s, (tx + 0.8) * s, 2 * s);
  }

  g.fillStyle(0xe8dcc4, alpha);
  g.fillCircle(-16 * s, -11 * s, 2.6 * s);
  g.fillCircle(-9 * s, -13.5 * s, 2.6 * s);
  g.fillStyle(0x1c1608, alpha);
  g.fillCircle(-15.6 * s, -11 * s, 1.4 * s);
  g.fillCircle(-8.6 * s, -13.5 * s, 1.4 * s);

  g.restore();
}

// A summer flounder (fluke) - the same real flatfish anatomy, but built
// on a distinctly rounder, more "silver dollar" oval than the elongated
// Southern Flounder, and marked with the real animal's own famous,
// genuinely diagnostic field mark: a scattered constellation of dark,
// pale-ringed ocellated eye-spots (not diffuse blotches) across a sandy
// tan body - the actual detail anglers use to identify a fluke on sight.
export function drawSummerFlounder(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xcbb684;
  const darkColor = 0x453a24;
  const finColor = 0xb8a276;
  const ocelliDark = 0x342a18;
  const ocelliRing = 0xe6d4a4;

  // A rounder, more "silver dollar" oval than the Southern Flounder's
  // elongated build.
  const body = [
    { x: -24, y: 0 },
    { x: -20, y: -9 },
    { x: -9, y: -17 },
    { x: 5, y: -20 },
    { x: 18, y: -16 },
    { x: 25, y: -8 },
    { x: 28, y: 0 },
    { x: 25, y: 8 },
    { x: 18, y: 16 },
    { x: 5, y: 20 },
    { x: -9, y: 17 },
    { x: -20, y: 9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const finOutline = body.map((p) => ({ x: p.x * 1.15, y: p.y * 1.15 }));
  g.fillStyle(finColor, 0.5 * alpha);
  g.fillPoints(finOutline, true);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokePoints(finOutline, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(28 * s, -8 * s, 28 * s, 8 * s, 36 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(28 * s, -8 * s, 28 * s, 8 * s, 36 * s, 0);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The scattered constellation of pale-ringed ocellated eye-spots - the
  // real, famous "5-spot fluke" field mark, built as a dark center inside
  // a paler ring so each one genuinely reads as an eye-spot rather than a
  // plain dot.
  [
    [-6, -9],
    [8, -8],
    [1, 1],
    [-6, 9],
    [10, 8]
  ].forEach(([ox, oy]) => {
    g.fillStyle(ocelliRing, 0.8 * alpha);
    g.fillCircle(ox * s, oy * s, 3.2 * s);
    g.fillStyle(ocelliDark, 0.85 * alpha);
    g.fillCircle(ox * s, oy * s, 1.7 * s);
  });

  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-23 * s, -2 * s);
  g.lineTo(-18 * s, 1 * s);
  g.strokePath();

  g.fillStyle(0xe8dcc4, alpha);
  g.fillCircle(-13 * s, -11 * s, 2.4 * s);
  g.fillCircle(-6 * s, -15 * s, 2.4 * s);
  g.fillStyle(0x1c1608, alpha);
  g.fillCircle(-12.6 * s, -11 * s, 1.3 * s);
  g.fillCircle(-5.6 * s, -15 * s, 1.3 * s);

  g.restore();
}

// A garfish - built with a genuinely novel construction nothing else in
// the game shares: a real halfbeak's own anatomy, a slender cylindrical
// body with a short, small, triangular upper jaw and a dramatically
// elongated, needle-thin lower jaw beak projecting far out in front of
// it, plus small dorsal and anal fins set unusually far back near the
// tail (the real family's own fin arrangement). Olive-green back over
// silvery sides, with a plain beak.
export function drawGarfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc7d0b4;
  const backColor = 0x5c6f3e;
  const bellyColor = 0xf2f4ea;
  const finColor = 0x8a9868;
  const darkColor = 0x2c3320;
  const beakColor = 0x8a9868;

  // A slender, near-cylindrical body - most of the length is body, not
  // head, unlike the beak which does all the work of extending forward.
  const body = [
    { x: -9, y: -3 },
    { x: 1, y: -4 },
    { x: 13, y: -4 },
    { x: 23, y: -3 },
    { x: 27, y: -1.4 },
    { x: 27, y: 1.4 },
    { x: 23, y: 3 },
    { x: 13, y: 4 },
    { x: 1, y: 4 },
    { x: -9, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The dramatically elongated, needle-thin lower jaw beak - the real
  // halfbeak's own defining anatomical trait, projecting far out ahead of
  // the short upper jaw.
  g.fillStyle(beakColor, alpha);
  g.fillTriangle(-9 * s, -1.6 * s, -9 * s, 1.6 * s, -33 * s, 0.2 * s);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-9 * s, -1.6 * s, -9 * s, 1.6 * s, -33 * s, 0.2 * s);

  // The short, small, triangular upper jaw - dwarfed by the beak below it.
  g.fillStyle(bodyColor, alpha);
  g.fillTriangle(-9 * s, -3 * s, -9 * s, -0.5 * s, -15 * s, -2 * s);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-9 * s, -3 * s, -9 * s, -0.5 * s, -15 * s, -2 * s);

  // Small forked tail.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -1.4 * s, 34 * s, -5 * s, 30 * s, 0);
  g.fillTriangle(27 * s, 1.4 * s, 34 * s, 5 * s, 30 * s, 0);
  g.lineStyle(0.8 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -1.4 * s, 34 * s, -5 * s, 30 * s, 0);
  g.strokeTriangle(27 * s, 1.4 * s, 34 * s, 5 * s, 30 * s, 0);

  // Small dorsal and anal fins, set unusually far back near the tail - a
  // real halfbeak's own fin arrangement.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(18 * s, -3.4 * s, 24 * s, -3 * s, 21 * s, -7.5 * s);
  g.fillTriangle(18 * s, 3.4 * s, 24 * s, 3 * s, 21 * s, 7.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -9, y: -3 },
    { x: 1, y: -4 },
    { x: 13, y: -4 },
    { x: 23, y: -3 },
    { x: 27, y: -1.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 2.4 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(0.9 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(0xeef1e2, alpha);
  g.fillCircle(-6 * s, -1.6 * s, 1.6 * s);
  g.fillStyle(0x14180c, alpha);
  g.fillCircle(-5.7 * s, -1.6 * s, 0.9 * s);

  g.restore();
}

// A southern garfish - the same real halfbeak anatomy as the Garfish, but
// with the two field marks that actually separate this species: a bold,
// black-edged silvery stripe running the length of the flank (unlike the
// plain Garfish's unmarked sides), and a genuine reddish-orange tip on
// the elongated beak. Cooler silvery-blue back rather than olive-green.
export function drawSouthernGarfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xccd6da;
  const backColor = 0x3f5c74;
  const bellyColor = 0xf2f6f6;
  const finColor = 0x74889a;
  const darkColor = 0x24313c;
  const beakColor = 0x8a97a0;
  const beakTipColor = 0xd8602c;
  const stripeColor = 0xeef4f4;

  const body = [
    { x: -9, y: -3 },
    { x: 1, y: -4 },
    { x: 13, y: -4 },
    { x: 23, y: -3 },
    { x: 27, y: -1.4 },
    { x: 27, y: 1.4 },
    { x: 23, y: 3 },
    { x: 13, y: 4 },
    { x: 1, y: 4 },
    { x: -9, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The elongated beak, with the genuine reddish-orange tip that gives
  // this species its own real field mark.
  g.fillStyle(beakColor, alpha);
  g.fillTriangle(-9 * s, -1.6 * s, -9 * s, 1.6 * s, -33 * s, 0.2 * s);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-9 * s, -1.6 * s, -9 * s, 1.6 * s, -33 * s, 0.2 * s);
  g.fillStyle(beakTipColor, 0.9 * alpha);
  g.fillTriangle(-25 * s, -0.9 * s, -25 * s, 1.2 * s, -33 * s, 0.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillTriangle(-9 * s, -3 * s, -9 * s, -0.5 * s, -15 * s, -2 * s);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-9 * s, -3 * s, -9 * s, -0.5 * s, -15 * s, -2 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -1.4 * s, 34 * s, -5 * s, 30 * s, 0);
  g.fillTriangle(27 * s, 1.4 * s, 34 * s, 5 * s, 30 * s, 0);
  g.lineStyle(0.8 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -1.4 * s, 34 * s, -5 * s, 30 * s, 0);
  g.strokeTriangle(27 * s, 1.4 * s, 34 * s, 5 * s, 30 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(18 * s, -3.4 * s, 24 * s, -3 * s, 21 * s, -7.5 * s);
  g.fillTriangle(18 * s, 3.4 * s, 24 * s, 3 * s, 21 * s, 7.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -9, y: -3 },
    { x: 1, y: -4 },
    { x: 13, y: -4 },
    { x: 23, y: -3 },
    { x: 27, y: -1.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 2.4 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  // The bold, black-edged silvery stripe running the flank - the real
  // Southern Garfish's own second field mark.
  g.lineStyle(1.4 * s, stripeColor, 0.9 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, 0.2 * s);
  g.lineTo(24 * s, 0.2 * s);
  g.strokePath();
  g.lineStyle(0.5 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, -1 * s);
  g.lineTo(24 * s, -1 * s);
  g.strokePath();

  g.lineStyle(0.9 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(0xeef4f4, alpha);
  g.fillCircle(-6 * s, -1.6 * s, 1.6 * s);
  g.fillStyle(0x0c1418, alpha);
  g.fillCircle(-5.7 * s, -1.6 * s, 0.9 * s);

  g.restore();
}

// A gemfish - a slender, near snake-like predator (depth barely a fifth
// of length here, the leanest fish in the game by far), silvery with a
// deep purple-indigo sheen along the back, a mouth held open to show a
// real row of long, sharp, needle-like teeth, one long, low, continuously
// bowed dorsal fin running almost the entire length of the back, tiny
// vestigial pelvic fins (a real gempylid family trait - some snake
// mackerels carry almost no pelvic fin at all), and a deeply forked tail.
export function drawGemfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb0aec4;
  const backColor = 0x2e2050;
  const bellyColor = 0xeeecf2;
  const finColor = 0x3c3260;
  const darkColor = 0x160f2c;
  const toothColor = 0xf2f0f4;

  // A slender, near snake-like body.
  const body = [
    { x: -31, y: 0 },
    { x: -28, y: -2.4 },
    { x: -19, y: -4.2 },
    { x: -6, y: -5.4 },
    { x: 7, y: -5.4 },
    { x: 17, y: -4.4 },
    { x: 24, y: -2.8 },
    { x: 28, y: -1.2 },
    { x: 28, y: 1.2 },
    { x: 24, y: 2.8 },
    { x: 17, y: 4.4 },
    { x: 7, y: 5.4 },
    { x: -6, y: 5.4 },
    { x: -19, y: 4.2 },
    { x: -28, y: 2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A deeply forked tail.
  [
    { angle: -0.62, bow: 8 },
    { angle: 0.62, bow: -8 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 18;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (28 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3 - tt * 2.7) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  // A modest pectoral fin and tiny, near-vestigial pelvic fins - a real
  // gempylid family trait, unlike the full pelvic fins every other fish
  // here carries.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-14 * s, 3 * s, -18 * s, 9 * s, -9 * s, 5 * s);
  g.fillTriangle(-2 * s, 5 * s, -3 * s, 7.5 * s, 1 * s, 5.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -28, y: -2.4 },
    { x: -19, y: -4.2 },
    { x: -6, y: -5.4 },
    { x: 7, y: -5.4 },
    { x: 17, y: -4.4 },
    { x: 24, y: -2.8 },
    { x: 28, y: -1.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.6 * s }))
  );
  g.fillStyle(backColor, 0.85 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // One long, low, continuously bowed dorsal fin running almost the
  // entire length of the back.
  {
    const angle = 0.08;
    const len = 30;
    const bow = 4;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 12;
    const left = [];
    const right = [];
    const baseX = -17;
    const baseY = -4.6;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (2.4 - tt * 2) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-20 * s, -3.4 * s);
  g.lineTo(-19 * s, 3.4 * s);
  g.strokePath();

  // The mouth held open to show a real row of long, sharp, needle-like
  // teeth - the real animal's own predatory field mark.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-30 * s, 1 * s);
  g.lineTo(-21 * s, 3.6 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const tx = -29 + i * 2.4;
    g.fillTriangle(tx * s, 1.4 * s, (tx + 1) * s, 1.9 * s, (tx + 0.5) * s, 4.2 * s);
  }

  g.fillStyle(0xeeecf4, alpha);
  g.fillCircle(-24 * s, -1.4 * s, 2.2 * s);
  g.fillStyle(0x0c0a18, alpha);
  g.fillCircle(-23.6 * s, -1.4 * s, 1.2 * s);

  g.restore();
}

// A giant trevally - the biggest, bulkiest, most powerful jack in the
// game, built on the same steep-forehead Carangid silhouette as the
// Trevally, but exaggerated much further: a taller, blunter, almost
// vertical "bulldog" face, and a far deeper, heavier-set body overall.
// Dark, dusky charcoal-silver coloring rather than the Trevally's
// silvery-olive - the real "black GT" look big, dominant individuals of
// this species are famous for.
export function drawGiantTrevally(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x5a6068;
  const backColor = 0x1c1f24;
  const bellyColor = 0x9aa0a8;
  const finColor = 0x363c42;
  const darkColor = 0x0e1013;
  const scuteColor = 0x14161a;

  // An even steeper, blunter, more vertical forehead than the Trevally's
  // own, and a much deeper, heavier body overall.
  const body = [
    { x: -34, y: 3 },
    { x: -32, y: -9 },
    { x: -24, y: -18 },
    { x: -11, y: -22 },
    { x: 4, y: -22 },
    { x: 18, y: -18 },
    { x: 28, y: -12 },
    { x: 34, y: -6 },
    { x: 36, y: 0 },
    { x: 34, y: 6 },
    { x: 28, y: 12 },
    { x: 18, y: 18 },
    { x: 4, y: 22 },
    { x: -11, y: 22 },
    { x: -22, y: 16 },
    { x: -30, y: 8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A powerful, deeply forked tail.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(36 * s, -6 * s, 52 * s, -16 * s, 42 * s, 0);
  g.fillTriangle(36 * s, 6 * s, 52 * s, 16 * s, 42 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(36 * s, -6 * s, 52 * s, -16 * s, 42 * s, 0);
  g.strokeTriangle(36 * s, 6 * s, 52 * s, 16 * s, 42 * s, 0);

  // A big, broad, curved sickle pectoral fin - even bigger than the
  // Trevally's own.
  {
    const angle = 1.55;
    const len = 27;
    const bow = 12;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    const baseX = -13;
    const baseY = 5;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (3.8 - tt * 3.4) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 20 * s, -10 * s, 29 * s, 5 * s, 21 * s);
  g.fillTriangle(14 * s, 17 * s, 12 * s, 25 * s, 23 * s, 15 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -32, y: -9 },
    { x: -24, y: -18 },
    { x: -11, y: -22 },
    { x: 4, y: -22 },
    { x: 18, y: -18 },
    { x: 28, y: -12 },
    { x: 34, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 10 * s }))
  );
  g.fillStyle(backColor, 0.7 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.5 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // One continuous dorsal fin - a short spiny zigzag blending into a
  // long, low soft rear lobe running most of the back.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -9, y: -21 },
    { x: -3, y: -23 },
    { x: 3, y: -22.5 },
    { x: 7, y: -21.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 7 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(7 * s, -21.5 * s, 20 * s, -16 * s, 12 * s, -31 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(7 * s, -21.5 * s, 20 * s, -16 * s, 12 * s, -31 * s);

  // The curved line of bony scutes toward the caudal peduncle - a real
  // jack/trevally family field mark.
  g.lineStyle(1.1 * s, scuteColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(0, -1 * s);
  g.lineTo(18 * s, 1 * s);
  g.lineTo(33 * s, 0);
  g.strokePath();
  for (let i = 0; i < 7; i += 1) {
    const tt = i / 6;
    const sx = (0 + tt * 33) * s;
    const sy = (-1 + tt * 1) * s;
    g.beginPath();
    g.moveTo(sx, sy - 2.4 * s);
    g.lineTo(sx, sy + 2.4 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-21 * s, -14 * s);
  g.lineTo(-19 * s, 12 * s);
  g.strokePath();

  // A small, dark, watchful eye, unmistakably a predator's.
  g.fillStyle(0x7a8088, alpha);
  g.fillCircle(-24 * s, -8 * s, 2.8 * s);
  g.fillStyle(0x08090b, alpha);
  g.fillCircle(-23.6 * s, -8 * s, 1.6 * s);

  g.restore();
}

// A golden trevally - a blunter, more gently rounded head than either
// other trevally in the game (a real sand-rooting feeder's head, not a
// steep predator's bulldog face), and the real animal's own spectacular,
// completely unmistakable field mark: vivid gold-yellow all over, banded
// with bold black vertical bars - the real juvenile "bumblebee" coloring,
// unlike anything else in the game.
export function drawGoldenTrevally(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe8b830;
  const backColor = 0xc89418;
  const bellyColor = 0xf5d878;
  const finColor = 0xd8a628;
  const darkColor = 0x2c2008;
  const barColor = 0x141008;

  // A blunter, more gently rounded head than either other trevally - a
  // real sand-feeder's profile, not a steep predator's face.
  const body = [
    { x: -27, y: 3 },
    { x: -25, y: -6 },
    { x: -17, y: -12 },
    { x: -5, y: -15 },
    { x: 8, y: -14 },
    { x: 18, y: -10 },
    { x: 24, y: -5 },
    { x: 27, y: 0 },
    { x: 24, y: 5 },
    { x: 18, y: 10 },
    { x: 8, y: 14 },
    { x: -5, y: 15 },
    { x: -16, y: 11 },
    { x: -23, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -5 * s, 39 * s, -13 * s, 32 * s, 0);
  g.fillTriangle(27 * s, 5 * s, 39 * s, 13 * s, 32 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -5 * s, 39 * s, -13 * s, 32 * s, 0);
  g.strokeTriangle(27 * s, 5 * s, 39 * s, 13 * s, 32 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 5 * s, -16 * s, 15 * s, -3 * s, 8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-10 * s, 5 * s, -16 * s, 15 * s, -3 * s, 8 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(2 * s, 14 * s, -2 * s, 21 * s, 8 * s, 15 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -25, y: -6 },
    { x: -17, y: -12 },
    { x: -5, y: -15 },
    { x: 8, y: -14 },
    { x: 18, y: -10 },
    { x: 24, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The bold black vertical bars over the gold body - the real animal's
  // own spectacular, completely unmistakable field mark.
  g.lineStyle(3.2 * s, barColor, 0.75 * alpha);
  [-19, -11, -3, 5, 13, 20].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -13 * s);
    g.lineTo((bx - 2) * s, 13 * s);
    g.strokePath();
  });

  // A short, low dorsal fin - not the tall spiny sail of the other jacks,
  // since a real Golden Trevally's dorsal is comparatively modest.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -14.5 * s, 7 * s, -13.5 * s, 1 * s, -22 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-4 * s, -14.5 * s, 7 * s, -13.5 * s, 1 * s, -22 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, -9 * s);
  g.lineTo(-14 * s, 9 * s);
  g.strokePath();

  // Small mouth, no big predatory teeth - a real Golden Trevally roots
  // for prey in the sand rather than chasing it down.
  g.fillStyle(0xf5e8b0, alpha);
  g.fillCircle(-19 * s, -4 * s, 2.6 * s);
  g.fillStyle(0x1c1608, alpha);
  g.fillCircle(-18.6 * s, -4 * s, 1.4 * s);

  g.restore();
}

// A silver trevally - a gentler, more moderate forehead slope than either
// other trevally (real Pseudocaranx are far less steep-faced than a
// Caranx like the Giant Trevally), a more elongated body, and its own
// real field mark: a small, dark opercular spot on the gill cover, plus a
// short, prominent row of bony scutes right at the tail base. Plain
// bright silver overall, with none of the other trevally's bold coloring.
export function drawSilverTrevally(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd4dce2;
  const backColor = 0x8a98a2;
  const bellyColor = 0xf4f6f8;
  const finColor = 0x9aa6ae;
  const darkColor = 0x2c343a;
  const scuteColor = 0x3a4248;
  const spotColor = 0x24282c;

  // A gentler forehead slope and a more elongated body than either other
  // trevally in the game.
  const body = [
    { x: -28, y: 1 },
    { x: -25, y: -6 },
    { x: -17, y: -11 },
    { x: -5, y: -14 },
    { x: 9, y: -13 },
    { x: 19, y: -9 },
    { x: 25, y: -5 },
    { x: 28, y: -1.5 },
    { x: 28, y: 2 },
    { x: 25, y: 6 },
    { x: 19, y: 10 },
    { x: 9, y: 13 },
    { x: -5, y: 14 },
    { x: -16, y: 11 },
    { x: -24, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(28 * s, -1.5 * s, 41 * s, -9 * s, 33 * s, 0);
  g.fillTriangle(28 * s, 2 * s, 41 * s, 9 * s, 33 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(28 * s, -1.5 * s, 41 * s, -9 * s, 33 * s, 0);
  g.strokeTriangle(28 * s, 2 * s, 41 * s, 9 * s, 33 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 4 * s, -17 * s, 13 * s, -4 * s, 7 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-11 * s, 4 * s, -17 * s, 13 * s, -4 * s, 7 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(1 * s, 13 * s, -2 * s, 20 * s, 7 * s, 14 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -25, y: -6 },
    { x: -17, y: -11 },
    { x: -5, y: -14 },
    { x: 9, y: -13 },
    { x: 19, y: -9 },
    { x: 25, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // One continuous dorsal fin.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -7, y: -13.5 },
    { x: -2, y: -15 },
    { x: 3, y: -14.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 5.5 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(3 * s, -14.5 * s, 14 * s, -10.5 * s, 8 * s, -21 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(3 * s, -14.5 * s, 14 * s, -10.5 * s, 8 * s, -21 * s);

  // The short, prominent row of scutes right at the tail base - a real
  // Silver Trevally's own field mark, much more localized than the Giant
  // Trevally's own long scute line.
  g.lineStyle(1.2 * s, scuteColor, 0.75 * alpha);
  g.beginPath();
  g.moveTo(16 * s, -1 * s);
  g.lineTo(27 * s, 0.5 * s);
  g.strokePath();
  for (let i = 0; i < 4; i += 1) {
    const tt = i / 3;
    const sx = (16 + tt * 11) * s;
    const sy = (-1 + tt * 1.5) * s;
    g.beginPath();
    g.moveTo(sx, sy - 2 * s);
    g.lineTo(sx, sy + 2 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, -8 * s);
  g.lineTo(-14 * s, 8 * s);
  g.strokePath();

  // The small, dark opercular spot on the gill cover - the real Silver
  // Trevally's own field mark.
  g.fillStyle(spotColor, 0.75 * alpha);
  g.fillEllipse(-14 * s, -3 * s, 3 * s, 3.6 * s);

  g.fillStyle(0xeef2f4, alpha);
  g.fillCircle(-19 * s, -6 * s, 2.6 * s);
  g.fillStyle(0x14181c, alpha);
  g.fillCircle(-18.6 * s, -6 * s, 1.4 * s);

  g.restore();
}

// A grey morwong - a deep-bodied reef fish with a blunt head and thick
// fleshy lips (a real bottom-grazing feeder's mouth), plain silvery-grey
// coloring, and the real morwong family's own genuine, unmistakable field
// mark: a single long, thin, filamentous ray trailing free from the
// pectoral fin well past the fin's own outline - drawn as an isolated
// curved thread rather than filled fin membrane, unlike every other fin
// in the game.
export function drawGreyMorwong(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x9098a0;
  const backColor = 0x4c545c;
  const bellyColor = 0xd0d4d8;
  const finColor = 0x707880;
  const darkColor = 0x24282c;
  const lipColor = 0x8a6f68;

  const body = [
    { x: -26, y: 0 },
    { x: -22, y: -6 },
    { x: -13, y: -11 },
    { x: -1, y: -13 },
    { x: 11, y: -12 },
    { x: 19, y: -8 },
    { x: 24, y: -4 },
    { x: 26, y: 0 },
    { x: 24, y: 4 },
    { x: 19, y: 8 },
    { x: 11, y: 12 },
    { x: -1, y: 13 },
    { x: -13, y: 11 },
    { x: -22, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -5 * s, 26 * s, 5 * s, 36 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -5 * s, 26 * s, 5 * s, 36 * s, 0);

  // The pectoral fin proper - a modest triangle.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 4 * s, -13 * s, 12 * s, -2 * s, 7 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 4 * s, -13 * s, 12 * s, -2 * s, 7 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(1 * s, 12 * s, -2 * s, 18 * s, 6 * s, 12.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -22, y: -6 },
    { x: -13, y: -11 },
    { x: -1, y: -13 },
    { x: 11, y: -12 },
    { x: 19, y: -8 },
    { x: 24, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // One long, low dorsal fin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -11.5 * s, 12 * s, -10 * s, 2 * s, -19 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, -11.5 * s, 12 * s, -10 * s, 2 * s, -19 * s);

  // The single long, thin, filamentous ray trailing free from the
  // pectoral fin - the real morwong family's own genuine field mark,
  // drawn as an isolated curved thread rather than a filled fin.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, 5 * s);
  quadCurveTo(g, -8 * s, 5 * s, -4 * s, 20 * s, 6 * s, 24 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-15 * s, -7 * s);
  g.lineTo(-13 * s, 7 * s);
  g.strokePath();

  // Thick, fleshy lips - a real bottom-grazing morwong's own mouth.
  g.fillStyle(lipColor, 0.85 * alpha);
  g.fillEllipse(-23 * s, 1 * s, 4.6 * s, 2.8 * s);
  g.lineStyle(0.7 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-23 * s, 1 * s, 4.6 * s, 2.8 * s);

  g.fillStyle(0xd8dce0, alpha);
  g.fillCircle(-16 * s, -5 * s, 2.4 * s);
  g.fillStyle(0x14161a, alpha);
  g.fillCircle(-15.6 * s, -5 * s, 1.3 * s);

  g.restore();
}

// A jackass morwong - the same real morwong anatomy (blunt head, thick
// lips, the family's own filamentous trailing pectoral ray), but built a
// touch deeper-bodied than the Grey Morwong, in a much paler grey-white
// base, and marked with the real animal's own genuinely diagnostic field
// mark: a bold, dark saddle blotch draped over the back just behind the
// head, unlike the Grey Morwong's own plain, unmarked flank.
export function drawJackassMorwong(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4c8ca;
  const backColor = 0x7a8082;
  const bellyColor = 0xe8eaea;
  const finColor = 0x8e9496;
  const darkColor = 0x24282a;
  const lipColor = 0x9a7a70;
  const saddleColor = 0x2e3234;

  const body = [
    { x: -25, y: 0 },
    { x: -21, y: -7 },
    { x: -12, y: -13 },
    { x: 0, y: -15 },
    { x: 12, y: -13 },
    { x: 20, y: -9 },
    { x: 25, y: -4 },
    { x: 27, y: 0 },
    { x: 25, y: 4 },
    { x: 20, y: 9 },
    { x: 12, y: 13 },
    { x: 0, y: 15 },
    { x: -12, y: 13 },
    { x: -21, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -5.5 * s, 27 * s, 5.5 * s, 37 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -5.5 * s, 27 * s, 5.5 * s, 37 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 5 * s, -12 * s, 13 * s, -1 * s, 8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-7 * s, 5 * s, -12 * s, 13 * s, -1 * s, 8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(2 * s, 13 * s, -1 * s, 19 * s, 7 * s, 13.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -21, y: -7 },
    { x: -12, y: -13 },
    { x: 0, y: -15 },
    { x: 12, y: -13 },
    { x: 20, y: -9 },
    { x: 25, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.3 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The bold, dark saddle blotch draped over the back just behind the
  // head - the real Jackass Morwong's own diagnostic field mark.
  g.fillStyle(saddleColor, 0.7 * alpha);
  g.fillEllipse(-9 * s, -6 * s, 9 * s, 8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -13 * s, 13 * s, -11.5 * s, 3 * s, -21 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-6 * s, -13 * s, 13 * s, -11.5 * s, 3 * s, -21 * s);

  // The filamentous trailing pectoral ray - the morwong family's own
  // field mark, shared with the Grey Morwong.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-7 * s, 6 * s);
  quadCurveTo(g, -7 * s, 6 * s, -3 * s, 21 * s, 7 * s, 25 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-14 * s, -8 * s);
  g.lineTo(-12 * s, 8 * s);
  g.strokePath();

  g.fillStyle(lipColor, 0.85 * alpha);
  g.fillEllipse(-22 * s, 1 * s, 4.8 * s, 2.9 * s);
  g.lineStyle(0.7 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-22 * s, 1 * s, 4.8 * s, 2.9 * s);

  g.fillStyle(0xe8eaea, alpha);
  g.fillCircle(-16 * s, -8 * s, 2.5 * s);
  g.fillStyle(0x121416, alpha);
  g.fillCircle(-15.6 * s, -8 * s, 1.4 * s);

  g.restore();
}

// A red morwong - the same real morwong family anatomy (blunt head, thick
// fleshy lips, the family's own filamentous trailing pectoral ray) as the
// Grey and Jackass Morwong, but on a more elongated body, and marked with
// the real animal's own field mark: a coppery-red base color banded with
// several thin, pale cream horizontal stripes running the length of the
// flank - unlike the Grey's plain sides or the Jackass's dark saddle.
export function drawRedMorwong(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa8503a;
  const backColor = 0x6e3020;
  const bellyColor = 0xd88a68;
  const finColor = 0x8a4230;
  const darkColor = 0x381810;
  const lipColor = 0xb87860;
  const stripeColor = 0xf0dcb0;

  const body = [
    { x: -27, y: 0 },
    { x: -23, y: -5 },
    { x: -14, y: -9 },
    { x: -2, y: -11 },
    { x: 10, y: -10 },
    { x: 18, y: -7 },
    { x: 23, y: -3.5 },
    { x: 25, y: 0 },
    { x: 23, y: 3.5 },
    { x: 18, y: 7 },
    { x: 10, y: 10 },
    { x: -2, y: 11 },
    { x: -14, y: 9 },
    { x: -23, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -4 * s, 25 * s, 4 * s, 34 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(25 * s, -4 * s, 25 * s, 4 * s, 34 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 3 * s, -12 * s, 10 * s, -2 * s, 5.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-7 * s, 3 * s, -12 * s, 10 * s, -2 * s, 5.5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(1 * s, 10 * s, -2 * s, 15 * s, 5 * s, 10.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -23, y: -5 },
    { x: -14, y: -9 },
    { x: -2, y: -11 },
    { x: 10, y: -10 },
    { x: 18, y: -7 },
    { x: 23, y: -3.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.5 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The several thin, pale cream horizontal stripes - the real Red
  // Morwong's own field mark.
  g.lineStyle(1 * s, stripeColor, 0.6 * alpha);
  [-6, -2.5, 1.5, 5.5].forEach((sy) => {
    g.beginPath();
    g.moveTo(-18 * s, sy * s);
    g.lineTo(20 * s, (sy - 0.8) * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -10 * s, 11 * s, -8.5 * s, 2 * s, -16 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-6 * s, -10 * s, 11 * s, -8.5 * s, 2 * s, -16 * s);

  // The filamentous trailing pectoral ray - the morwong family's own
  // field mark.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-7 * s, 4 * s);
  quadCurveTo(g, -7 * s, 4 * s, -3 * s, 17 * s, 6 * s, 20 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-15 * s, -6 * s);
  g.lineTo(-13 * s, 6 * s);
  g.strokePath();

  g.fillStyle(lipColor, 0.85 * alpha);
  g.fillEllipse(-22 * s, 1 * s, 4.2 * s, 2.6 * s);
  g.lineStyle(0.7 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-22 * s, 1 * s, 4.2 * s, 2.6 * s);

  g.fillStyle(0xecd0b0, alpha);
  g.fillCircle(-16 * s, -4.5 * s, 2.3 * s);
  g.fillStyle(0x1c0e08, alpha);
  g.fillCircle(-15.6 * s, -4.5 * s, 1.2 * s);

  g.restore();
}

// A banded morwong - the same real morwong family anatomy, but built a
// touch stockier/deeper-bodied than the Red Morwong, and marked with the
// real animal's own genuinely bold field mark: dark brown-black vertical
// bands crossing a yellowish-brown body - unlike any other morwong's own
// horizontal, plain, or saddle-marked pattern.
export function drawBandedMorwong(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc0985a;
  const backColor = 0x8a6a34;
  const bellyColor = 0xe8d4a0;
  const finColor = 0xa88448;
  const darkColor = 0x2c2210;
  const lipColor = 0xa87a5c;
  const barColor = 0x241a0c;

  const body = [
    { x: -24, y: 0 },
    { x: -20, y: -7 },
    { x: -11, y: -13 },
    { x: 1, y: -15 },
    { x: 13, y: -13 },
    { x: 20, y: -9 },
    { x: 25, y: -4.5 },
    { x: 27, y: 0 },
    { x: 25, y: 4.5 },
    { x: 20, y: 9 },
    { x: 13, y: 13 },
    { x: 1, y: 15 },
    { x: -11, y: 13 },
    { x: -20, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -5 * s, 27 * s, 5 * s, 37 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -5 * s, 27 * s, 5 * s, 37 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 4 * s, -13 * s, 12 * s, -2 * s, 7 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 4 * s, -13 * s, 12 * s, -2 * s, 7 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(2 * s, 13 * s, -1 * s, 19 * s, 7 * s, 13.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -20, y: -7 },
    { x: -11, y: -13 },
    { x: 1, y: -15 },
    { x: 13, y: -13 },
    { x: 20, y: -9 },
    { x: 25, y: -4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The bold dark vertical bands crossing the body - the real Banded
  // Morwong's own field mark, broader and blockier than any striping
  // elsewhere in the game.
  g.lineStyle(3.6 * s, barColor, 0.65 * alpha);
  [-14, -6, 2, 10, 18].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -13 * s);
    g.lineTo((bx - 1.5) * s, 13 * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -13 * s, 13 * s, -11 * s, 4 * s, -20 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-5 * s, -13 * s, 13 * s, -11 * s, 4 * s, -20 * s);

  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, 5 * s);
  quadCurveTo(g, -8 * s, 5 * s, -4 * s, 19 * s, 6 * s, 23 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-14 * s, -8 * s);
  g.lineTo(-12 * s, 8 * s);
  g.strokePath();

  g.fillStyle(lipColor, 0.85 * alpha);
  g.fillEllipse(-20 * s, 1 * s, 4.6 * s, 2.8 * s);
  g.lineStyle(0.7 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-20 * s, 1 * s, 4.6 * s, 2.8 * s);

  g.fillStyle(0xe8d8b0, alpha);
  g.fillCircle(-14 * s, -6 * s, 2.4 * s);
  g.fillStyle(0x1a1408, alpha);
  g.fillCircle(-13.6 * s, -6 * s, 1.3 * s);

  g.restore();
}

// A blue morwong - the same real morwong family anatomy, but a notably
// more elongated, streamlined body than any other morwong here, and the
// real animal's own field mark: a plain blue-grey to blue-purple
// coloring, unlike any of the reds, bands, or greys the rest of the
// family carry.
export function drawBlueMorwong(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x5a6890;
  const backColor = 0x323a5c;
  const bellyColor = 0x9aa4c4;
  const finColor = 0x444e70;
  const darkColor = 0x1c2038;
  const lipColor = 0x707a9a;

  // A notably more elongated, streamlined body than any other morwong.
  const body = [
    { x: -29, y: 0 },
    { x: -25, y: -4.5 },
    { x: -16, y: -8 },
    { x: -4, y: -10 },
    { x: 8, y: -9.5 },
    { x: 17, y: -6.5 },
    { x: 23, y: -3.5 },
    { x: 26, y: 0 },
    { x: 23, y: 3.5 },
    { x: 17, y: 6.5 },
    { x: 8, y: 9.5 },
    { x: -4, y: 10 },
    { x: -16, y: 8 },
    { x: -25, y: 4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -4 * s, 26 * s, 4 * s, 35 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -4 * s, 26 * s, 4 * s, 35 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 3 * s, -11 * s, 9 * s, -1 * s, 5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-6 * s, 3 * s, -11 * s, 9 * s, -1 * s, 5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(0, 9 * s, -3 * s, 14 * s, 4 * s, 9.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -25, y: -4.5 },
    { x: -16, y: -8 },
    { x: -4, y: -10 },
    { x: 8, y: -9.5 },
    { x: 17, y: -6.5 },
    { x: 23, y: -3.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.6 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -9.5 * s, 9 * s, -8 * s, 1 * s, -15 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-5 * s, -9.5 * s, 9 * s, -8 * s, 1 * s, -15 * s);

  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-6 * s, 4 * s);
  quadCurveTo(g, -6 * s, 4 * s, -2 * s, 16 * s, 6 * s, 19 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-13 * s, -5.5 * s);
  g.lineTo(-11 * s, 5.5 * s);
  g.strokePath();

  g.fillStyle(lipColor, 0.85 * alpha);
  g.fillEllipse(-24 * s, 0.5 * s, 4 * s, 2.4 * s);
  g.lineStyle(0.7 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-24 * s, 0.5 * s, 4 * s, 2.4 * s);

  g.fillStyle(0xc8ccdc, alpha);
  g.fillCircle(-18 * s, -3.5 * s, 2.2 * s);
  g.fillStyle(0x0e1020, alpha);
  g.fillCircle(-17.6 * s, -3.5 * s, 1.2 * s);

  g.restore();
}

// A hairtail - built with a construction nothing else in the game shares:
// a real cutlassfish's own anatomy, an extremely elongated, ribbon-flat
// body that tapers smoothly the whole way down to a fine whip-like point
// with NO tail fin at all (every other fish here ends in some kind of
// fin), one long, low, continuous dorsal fin running almost the entire
// body length, no pelvic fins, and a fierce, permanently gaping jaw lined
// with long fang-like teeth and a protruding underbite. Mirror-bright
// silver all over, with barely any countershading and a real chrome
// highlight streak down the flank - a real hairtail is close to chrome.
export function drawHairtail(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd8dee2;
  const backColor = 0xb0bac2;
  const finColor = 0xc4ccd2;
  const darkColor = 0x484e54;
  const toothColor = 0xf2f0ee;
  const highlightColor = 0xffffff;

  // A spine that tapers to an actual POINT at the snout (a real hairtail
  // has a pointed conical head, not a blunt front edge), widens sharply
  // to its deepest point close behind the head, then tapers extremely
  // gradually the rest of the way down a very long body to a fine
  // whip-like tip - no tail fin at all, the real animal's own defining
  // silhouette. The old version's widest point sat past the body's own
  // midpoint, reading more like a generic tapered body than a real
  // hairtail's own distinctly front-loaded, blade-like profile.
  const spineX = [-34, -30, -24, -14, -2, 10, 22, 34, 44, 52, 60];
  const widths = [0, 2.6, 5.8, 5.4, 4.6, 3.8, 3, 2.2, 1.4, 0.7, 0];
  const top = spineX.map((sx, i) => ({ x: sx, y: -widths[i] }));
  const bottom = spineX.map((sx, i) => ({ x: sx, y: widths[i] })).reverse();
  const body = top.concat(bottom).map((p) => ({ x: p.x * s, y: p.y * s }));

  // A small pectoral fin, right at the shoulder just behind the head -
  // the only fin besides the long dorsal ribbon this fish carries; no
  // pelvic fins at all.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-26 * s, 2.6 * s, -30 * s, 8.5 * s, -21 * s, 4.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(
    top.map((p) => ({ x: p.x * s, y: p.y * s })).concat(top.slice().reverse().map((p) => ({ x: p.x * s, y: (p.y + 2.2) * s }))),
    true
  );

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(body, true);

  // The bright chrome highlight streak down the upper flank - the real
  // detail that sells a genuinely reflective, mirror-bright hairtail
  // rather than just a flat pale grey fish.
  g.lineStyle(1 * s, highlightColor, 0.3 * alpha);
  g.beginPath();
  g.moveTo(-22 * s, -3.4 * s);
  g.lineTo(24 * s, -1.6 * s);
  g.strokePath();

  // The one long, low, continuous dorsal fin ribbon, starting just behind
  // the head (not from the snout itself) and running almost the entire
  // rest of the body - the real animal's own fin arrangement. Its height
  // tapers down together with the body's own taper (capped at 2.2)
  // rather than staying a constant height all the way to the tip, so it
  // never outlives the body's own visible width and float detached above
  // the vanished tail.
  const finStart = 2;
  const finSpineX = spineX.slice(finStart);
  const finWidths = widths.slice(finStart);
  const finHeights = finWidths.map((w) => Math.min(2.2, w));
  g.fillStyle(finColor, 0.85 * alpha);
  g.fillPoints(
    finSpineX
      .map((sx, i) => ({ x: sx, y: -finWidths[i] }))
      .concat(
        finSpineX
          .slice()
          .reverse()
          .map((sx, i) => ({ x: sx, y: -finWidths[finSpineX.length - 1 - i] - finHeights[finSpineX.length - 1 - i] }))
      ),
    true
  );

  // The fierce, permanently gaping jaw - a protruding lower jaw jutting
  // out past the pointed upper snout (a real hairtail underbite), lined
  // with long dagger-like fangs plus a row of smaller teeth behind them.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-34 * s, -0.6 * s);
  g.lineTo(-24 * s, 3.4 * s);
  g.strokePath();

  // The lower jaw, extended slightly past the upper snout tip - the real
  // underbite.
  g.fillStyle(bodyColor, alpha);
  g.fillTriangle(-34 * s, -0.6 * s, -24 * s, 3.4 * s, -35.5 * s, 1.6 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-34 * s, -0.6 * s, -24 * s, 3.4 * s, -35.5 * s, 1.6 * s);

  // Two long, prominent dagger fangs - the single most famous real
  // hairtail field mark - flanked by a row of smaller teeth on each jaw.
  g.fillStyle(toothColor, alpha);
  g.fillTriangle(-32.5 * s, -0.4 * s, -30.5 * s, 0.1 * s, -31.8 * s, 3.6 * s);
  g.fillTriangle(-30 * s, 2.4 * s, -28 * s, 2.9 * s, -29 * s, -1.2 * s);
  for (let i = 0; i < 3; i += 1) {
    const tx = -28.5 + i * 2.3;
    g.fillTriangle(tx * s, -0.2 * s, (tx + 1) * s, 0.1 * s, (tx + 0.35) * s, 1.5 * s);
  }
  for (let i = 0; i < 2; i += 1) {
    const tx = -26.5 + i * 2.6;
    g.fillTriangle(tx * s, 2.7 * s, (tx + 1) * s, 3 * s, (tx + 0.35) * s, 1.5 * s);
  }

  g.fillStyle(0xf0f2f2, alpha);
  g.fillCircle(-29 * s, -1.6 * s, 1.9 * s);
  g.fillStyle(0x0a0c0e, alpha);
  g.fillCircle(-28.7 * s, -1.6 * s, 1 * s);

  g.restore();
}

// A hapuku - a large, robust, deep-bodied wreckfish, built on a
// grouper-genre body like the Coral Trout's but bigger, blunter, and
// plain blue-grey rather than red-and-spotted, and marked with the real
// animal's own genuine field mark: a distinct bony ridge/knob on top of
// the head between the eyes, unlike any other fish's smooth forehead
// here.
export function drawHapuku(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x5c6878;
  const backColor = 0x333c4a;
  const bellyColor = 0x9aa4b0;
  const finColor = 0x444e5c;
  const darkColor = 0x1c2129;
  const ridgeColor = 0x262c36;

  const body = [
    { x: -30, y: 3 },
    { x: -27, y: -7 },
    { x: -18, y: -15 },
    { x: -4, y: -19 },
    { x: 10, y: -18 },
    { x: 21, y: -13 },
    { x: 28, y: -7 },
    { x: 32, y: -1 },
    { x: 32, y: 4 },
    { x: 28, y: 10 },
    { x: 21, y: 15 },
    { x: 10, y: 19 },
    { x: -4, y: 20 },
    { x: -17, y: 16 },
    { x: -26, y: 9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A rounded, fanned tail rather than a fork - a real grouper's tail
  // shape.
  g.fillStyle(finColor, alpha);
  g.fillEllipse(40 * s, 0, 21 * s, 19 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(40 * s, 0, 21 * s, 19 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6 * s, -16 * s, 20 * s, 1 * s, 10 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 6 * s, -16 * s, 20 * s, 1 * s, 10 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 16 * s, 0, 24 * s, 12 * s, 17 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -27, y: -7 },
    { x: -18, y: -15 },
    { x: -4, y: -19 },
    { x: 10, y: -18 },
    { x: 21, y: -13 },
    { x: 28, y: -7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 8 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.5 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -14, y: -15 },
    { x: -8, y: -18 },
    { x: -1, y: -18.5 },
    { x: 6, y: -17.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 7 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(6 * s, -17.5 * s, 18 * s, -13 * s, 11 * s, -24 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(6 * s, -17.5 * s, 18 * s, -13 * s, 11 * s, -24 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-20 * s, -11 * s);
  g.lineTo(-18 * s, 11 * s);
  g.strokePath();

  // The distinct bony ridge/knob on top of the head, between the eyes -
  // the real Hapuku's own genuine field mark.
  g.fillStyle(ridgeColor, 0.75 * alpha);
  g.fillEllipse(-19 * s, -12 * s, 6 * s, 3.6 * s);
  g.lineStyle(0.7 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-19 * s, -12 * s, 6 * s, 3.6 * s);

  g.fillStyle(0xb8c0c8, alpha);
  g.fillCircle(-21 * s, -6 * s, 3 * s);
  g.fillStyle(0x0e1116, alpha);
  g.fillCircle(-20.5 * s, -6 * s, 1.6 * s);

  g.restore();
}

// A leatherjacket - built with a construction nothing else in the game
// shares: a real filefish's own anatomy, a small, laterally compressed,
// diamond-shaped body with rough, leathery skin (stippled rather than
// smooth, the real texture that gives the family its name), a tiny
// terminal mouth, and above all the family's own single rigid dorsal
// spine standing alone on top of the head like a small horn - not a
// fanned fin membrane at all, unlike every other dorsal fin in the game.
export function drawLeatherjacket(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x7a8a4a;
  const backColor = 0x4e5c2c;
  const bellyColor = 0xb8c082;
  const finColor = 0x5c6838;
  const darkColor = 0x242c14;
  const stippleColor = 0x38401e;

  // A small, laterally compressed, diamond-ish body with a pointed snout.
  const body = [
    { x: -19, y: 0 },
    { x: -16, y: -6 },
    { x: -8, y: -10 },
    { x: 2, y: -11 },
    { x: 11, y: -8 },
    { x: 16, y: -3 },
    { x: 17, y: 3 },
    { x: 11, y: 8 },
    { x: 2, y: 11 },
    { x: -8, y: 10 },
    { x: -16, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(17 * s, -3 * s, 17 * s, 3 * s, 25 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(17 * s, -3 * s, 17 * s, 3 * s, 25 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 2 * s, -10 * s, 7 * s, -2 * s, 4 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -16, y: -6 },
    { x: -8, y: -10 },
    { x: 2, y: -11 },
    { x: 11, y: -8 },
    { x: 16, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Rough, leathery skin - a fine stipple texture instead of smooth
  // shading, the real detail the family is named for.
  g.fillStyle(stippleColor, 0.4 * alpha);
  for (let i = 0; i < 22; i += 1) {
    const px = -14 + (i % 6) * 5 + (Math.floor(i / 6) % 2) * 2;
    const py = -7 + Math.floor(i / 6) * 3.5;
    g.fillCircle(px * s, py * s, 0.6 * s);
  }

  // A tiny second soft dorsal fin, well behind the spine - dwarfed by it.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(3 * s, -10.5 * s, 8 * s, -9 * s, 5.5 * s, -13.5 * s);

  // The single rigid dorsal spine, standing alone like a small horn - the
  // real leatherjacket/filefish family's own unmistakable field mark,
  // drawn as a stiff tapering blade, not a fanned fin.
  g.fillStyle(darkColor, alpha);
  g.fillTriangle(-3 * s, -10 * s, 0, -10.5 * s, -1.5 * s, -22 * s);
  g.lineStyle(0.8 * s, 0x000000, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -10 * s, 0, -10.5 * s, -1.5 * s, -22 * s);

  // A tiny terminal mouth with fused, chisel-like teeth.
  g.lineStyle(0.8 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, 0);
  g.lineTo(-14 * s, 1.5 * s);
  g.strokePath();

  g.fillStyle(0xd8dcae, alpha);
  g.fillCircle(-11 * s, -4.5 * s, 2 * s);
  g.fillStyle(0x14180a, alpha);
  g.fillCircle(-10.6 * s, -4.5 * s, 1.1 * s);

  g.restore();
}

// A longtail tuna - a slender, elongated true tuna (leaner than the
// robust generic Tuna, but not as extremely cylindrical as the Albacore),
// with a modest, unremarkable pectoral fin - not the Albacore's giant
// drooping wing - and the real animal's own field mark: a cluster of
// small dark spots on the lower flank just behind the pectoral fin base,
// unlike any other tuna's own pattern here.
export function drawLongtailTuna(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb8c4ca;
  const backColor = 0x1e3646;
  const bellyColor = 0xeef2f2;
  const finColor = 0x304c5c;
  const darkColor = 0x142430;
  const spotColor = 0x16262e;

  const body = [
    { x: -32, y: 0 },
    { x: -29, y: -3.2 },
    { x: -20, y: -6.5 },
    { x: -7, y: -9 },
    { x: 6, y: -9 },
    { x: 16, y: -7 },
    { x: 23, y: -4.5 },
    { x: 28, y: -2 },
    { x: 28, y: 2 },
    { x: 23, y: 4.5 },
    { x: 16, y: 7 },
    { x: 6, y: 9 },
    { x: -7, y: 9 },
    { x: -20, y: 6.5 },
    { x: -29, y: 3.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.58, bow: 9 },
    { angle: 0.58, bow: -9 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 21;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (28 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.6 - tt * 3.2) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  // A modest, unremarkable pectoral fin - deliberately plain, unlike the
  // Albacore's own huge drooping wing.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-13 * s, 3 * s, -18 * s, 11 * s, -7 * s, 5.5 * s);
  g.fillTriangle(-1 * s, 8 * s, -4 * s, 13 * s, 4 * s, 9 * s);
  g.fillTriangle(9 * s, 6.5 * s, 12 * s, 11 * s, 15 * s, 6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -29, y: -3.2 },
    { x: -20, y: -6.5 },
    { x: -7, y: -9 },
    { x: 6, y: -9 },
    { x: 16, y: -7 },
    { x: 23, y: -4.5 },
    { x: 28, y: -2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6.5 * s }))
  );
  g.fillStyle(backColor, 0.88 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -20, y: 6.5 },
    { x: -7, y: 9 },
    { x: 6, y: 9 },
    { x: 16, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 3 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The cluster of small dark spots on the lower flank, just behind the
  // pectoral fin base - the real Longtail Tuna's own field mark.
  g.fillStyle(spotColor, 0.8 * alpha);
  [
    [-4, 6, 1.1],
    [0, 7.5, 1],
    [4, 6.5, 1],
    [-2, 4.5, 0.9],
    [3, 4.8, 0.9]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  {
    const angle = 0.28;
    const len = 16;
    const bow = 6;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 8;
    const left = [];
    const right = [];
    const baseX = -4;
    const baseY = -9;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (2.8 - tt * 2.5) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = 16 + i * 1.9;
    g.fillTriangle(fx * s, -6.5 * s, (fx + 1.3) * s, -6.5 * s, (fx + 0.65) * s, -9.5 * s);
    g.fillTriangle(fx * s, 6.5 * s, (fx + 1.3) * s, 6.5 * s, (fx + 0.65) * s, 9.5 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-21 * s, -4.5 * s);
  g.lineTo(-19 * s, 4.5 * s);
  g.strokePath();

  g.fillStyle(0xeef2f2, alpha);
  g.fillCircle(-25 * s, -1.5 * s, 2.4 * s);
  g.fillStyle(0x0c1418, alpha);
  g.fillCircle(-24.6 * s, -1.5 * s, 1.3 * s);

  g.restore();
}

// A yellowfin tuna - rebuilt for a cleaner, unmistakably tuna-shaped
// silhouette: a classic torpedo tuna body, and the real animal's own two
// genuine field marks given full visual weight - a bright YELLOW lateral
// stripe running down the flank toward the tail (present on the actual
// fish, and missing from every other tuna here), plus a curved, vivid
// yellow second dorsal fin and matching yellow anal fin sweeping back in
// short scimitar shapes, and bright yellow finlets. The dorsal/anal
// sickles and finlets are all drawn AFTER the body's own outline stroke
// so their bases sit cleanly on top of it instead of getting bisected by
// it. Deep blue-black back over silver sides.
export function drawYellowfinTuna(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb0bec8;
  const backColor = 0x152838;
  const bellyColor = 0xeef2f2;
  const finColor = 0x1e3444;
  const darkColor = 0x0e1c28;
  const yellowFin = 0xf0c22a;
  const yellowDark = 0xa87e10;
  const stripeColor = 0xf4d24a;

  const body = [
    { x: -32, y: 0 },
    { x: -29, y: -3.4 },
    { x: -21, y: -6.8 },
    { x: -9, y: -9 },
    { x: 4, y: -9 },
    { x: 14, y: -7.6 },
    { x: 22, y: -4.8 },
    { x: 27, y: -2.1 },
    { x: 27, y: 2.1 },
    { x: 22, y: 4.8 },
    { x: 14, y: 7.6 },
    { x: 4, y: 9 },
    { x: -9, y: 9 },
    { x: -21, y: 6.8 },
    { x: -29, y: 3.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The tail sickle - a standard tuna fork.
  [
    { angle: -0.6, bow: 9.5 },
    { angle: 0.6, bow: -9.5 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 21;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (27 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.8 - tt * 3.4) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  // A plain, ordinary pectoral fin, tucked against the flank.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-13 * s, 3 * s, -17 * s, 12 * s, -7 * s, 5.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-13 * s, 3 * s, -17 * s, 12 * s, -7 * s, 5.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -29, y: -3.4 },
    { x: -21, y: -6.8 },
    { x: -9, y: -9 },
    { x: 4, y: -9 },
    { x: 14, y: -7.6 },
    { x: 22, y: -4.8 },
    { x: 27, y: -2.1 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6.5 * s }))
  );
  g.fillStyle(backColor, 0.9 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -21, y: 6.8 },
    { x: -9, y: 9 },
    { x: 4, y: 9 },
    { x: 14, y: 7.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 3 * s }))
  );
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The bright yellow lateral stripe running down the flank toward the
  // tail - a real Yellowfin field mark on its own, drawn after the body
  // outline so it reads cleanly on top of the flank.
  g.lineStyle(1.6 * s, stripeColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, 1.5 * s);
  quadCurveTo(g, -8 * s, 1.5 * s, 8 * s, 0.5 * s, 24 * s, -1.8 * s);
  g.strokePath();

  // A modest first dorsal - plain blue-grey, deliberately unremarkable
  // next to the dramatic yellow second dorsal behind it. Drawn after the
  // body outline so its base sits cleanly on top of it.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -9 * s, 4 * s, -8.5 * s, -1 * s, -16.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-6 * s, -9 * s, 4 * s, -8.5 * s, -1 * s, -16.5 * s);

  // The curved, vivid yellow SECOND DORSAL fin, sweeping back in a
  // scimitar shape - one half of the real animal's own defining field
  // mark and namesake. Drawn after the body outline so its base sits
  // cleanly on top of it instead of getting sliced by that stroke.
  {
    const angle = 0.24;
    const len = 19;
    const bow = 7.5;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 10;
    const left = [];
    const right = [];
    const baseX = 4;
    const baseY = -9;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (2.6 - tt * 2.3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(yellowFin, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, yellowDark, 0.7 * alpha);
    g.strokePoints(shape, true);
  }

  // The matching yellow ANAL fin, the other half of the field mark - also
  // drawn after the body outline for the same clean-base reason.
  {
    const angle = -0.24;
    const len = 19;
    const bow = 7.5;
    const dx = Math.sin(angle);
    const dy = Math.cos(angle);
    const px = Math.cos(angle);
    const py = -Math.sin(angle);
    const steps = 10;
    const left = [];
    const right = [];
    const baseX = 2;
    const baseY = 9;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (2.6 - tt * 2.3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(yellowFin, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, yellowDark, 0.7 * alpha);
    g.strokePoints(shape, true);
  }

  // Bright yellow finlets, unlike any other tuna's own darker finlets.
  g.fillStyle(yellowFin, alpha);
  for (let i = 0; i < 6; i += 1) {
    const fx = 16 + i * 1.7;
    g.fillTriangle(fx * s, -6.4 * s, (fx + 1.2) * s, -6.4 * s, (fx + 0.6) * s, -9 * s);
    g.fillTriangle(fx * s, 6.4 * s, (fx + 1.2) * s, 6.4 * s, (fx + 0.6) * s, 9 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-21 * s, -5 * s);
  g.lineTo(-19 * s, 5 * s);
  g.strokePath();

  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-25 * s, -1.8 * s, 2.5 * s);
  g.fillStyle(0x0a1015, alpha);
  g.fillCircle(-24.6 * s, -1.8 * s, 1.4 * s);

  g.restore();
}

// A southern bluefin tuna - rebuilt for a cleaner, unmistakably tuna-
// shaped silhouette: the deepest, most robust body of any tuna here
// (depth roughly 44% of length, well beyond the generic Tuna's ~32% or
// the Longtail's ~30%), a notably SHORT, stubby pectoral fin (the real
// animal's own field mark, and the opposite extreme from the Albacore's
// giant wing), and - the real contrast with the Yellowfin's own dramatic
// scimitar fins right next to it in the game - short, plain, unremarkable
// second dorsal and anal fins, built as simple triangles rather than any
// kind of sweeping blade. Very dark, near-black back, and finlets in real
// bluefin's own two-tone yellow-edged-black. All fins with a base on the
// back or belly are drawn after the body's own outline stroke, so they
// sit cleanly on top of it instead of being sliced by that line.
export function drawSouthernBluefinTuna(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa8b6c0;
  const backColor = 0x0e1c2a;
  const bellyColor = 0xe8eef0;
  const finColor = 0x182c3a;
  const darkColor = 0x0a1218;
  const yellowFin = 0xd8b024;

  // The deepest, most robust body of any tuna here.
  const body = [
    { x: -28, y: 0 },
    { x: -25, y: -4.6 },
    { x: -17, y: -9.2 },
    { x: -5, y: -12 },
    { x: 7, y: -12 },
    { x: 16, y: -9.2 },
    { x: 23, y: -5.6 },
    { x: 27, y: -2.4 },
    { x: 27, y: 2.4 },
    { x: 23, y: 5.6 },
    { x: 16, y: 9.2 },
    { x: 7, y: 12 },
    { x: -5, y: 12 },
    { x: -17, y: 9.2 },
    { x: -25, y: 4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The tail sickle - a standard tuna fork.
  [
    { angle: -0.65, bow: 10.5 },
    { angle: 0.65, bow: -10.5 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 21;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (27 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (4.2 - tt * 3.8) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  // The notably short, stubby pectoral fin - the real animal's own field
  // mark, the exact opposite extreme from the Albacore's giant wing.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 3.5 * s, -13 * s, 8 * s, -5.5 * s, 5.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-10 * s, 3.5 * s, -13 * s, 8 * s, -5.5 * s, 5.5 * s);

  // Small keel bumps at the caudal peduncle - the powerful, thick
  // tail-stalk keel a real bluefin carries.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.6 * s, 27 * s, -4.6 * s, 25 * s, -1.4 * s);
  g.fillTriangle(23 * s, 3.6 * s, 27 * s, 4.6 * s, 25 * s, 1.4 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -25, y: -4.6 },
    { x: -17, y: -9.2 },
    { x: -5, y: -12 },
    { x: 7, y: -12 },
    { x: 16, y: -9.2 },
    { x: 23, y: -5.6 },
    { x: 27, y: -2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 7.5 * s }))
  );
  g.fillStyle(backColor, 0.95 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.4 * s, darkColor, 0.9 * alpha);
  g.strokePoints(body, true);

  // A short, plain first dorsal - a simple triangle, not a sweeping
  // blade, drawn after the body outline so its base sits cleanly on top.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -12 * s, 4 * s, -11.5 * s, -0.5 * s, -19 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-5 * s, -12 * s, 4 * s, -11.5 * s, -0.5 * s, -19 * s);

  // A short, plain second dorsal - the real contrast with the Yellowfin's
  // own long, curved, dramatic version of this same fin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(13 * s, -8.6 * s, 19 * s, -7.6 * s, 16 * s, -13.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(13 * s, -8.6 * s, 19 * s, -7.6 * s, 16 * s, -13.5 * s);

  // A short, plain anal fin - matching the second dorsal, not the
  // Yellowfin's own sweeping scimitar.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, 9.2 * s, 17 * s, 8.2 * s, 14 * s, 14.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(11 * s, 9.2 * s, 17 * s, 8.2 * s, 14 * s, 14.5 * s);

  // Finlets in real bluefin's own two-tone yellow-edged-black.
  for (let i = 0; i < 5; i += 1) {
    const fx = 16 + i * 1.9;
    g.fillStyle(finColor, alpha);
    g.fillTriangle(fx * s, -6 * s, (fx + 1.3) * s, -6 * s, (fx + 0.65) * s, -8.8 * s);
    g.fillTriangle(fx * s, 6 * s, (fx + 1.3) * s, 6 * s, (fx + 0.65) * s, 8.8 * s);
    g.lineStyle(0.6 * s, yellowFin, 0.7 * alpha);
    g.strokeTriangle(fx * s, -6 * s, (fx + 1.3) * s, -6 * s, (fx + 0.65) * s, -8.8 * s);
    g.strokeTriangle(fx * s, 6 * s, (fx + 1.3) * s, 6 * s, (fx + 0.65) * s, 8.8 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-17 * s, -6.5 * s);
  g.lineTo(-15 * s, 6.5 * s);
  g.strokePath();

  g.fillStyle(0xdce4e8, alpha);
  g.fillCircle(-21 * s, -2.8 * s, 2.5 * s);
  g.fillStyle(0x08101a, alpha);
  g.fillCircle(-20.6 * s, -2.8 * s, 1.35 * s);

  g.restore();
}

// A bigeye tuna - a true tuna built on deliberately plain, unremarkable
// proportions and fins (a moderate pectoral, a moderate sickle first
// dorsal, yellow finlets edged in black like several other tunas here),
// so that all the visual weight lands on the real animal's own actual,
// genuinely diagnostic field mark given full size: a dramatically large,
// dark eye - visibly bigger than any other fish's eye in the game, the
// real detail the species is named for.
export function drawBigeyeTuna(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xaebcc6;
  const backColor = 0x18293c;
  const bellyColor = 0xeef2f2;
  const finColor = 0x28425a;
  const darkColor = 0x101c28;
  const yellowFin = 0xd8b428;

  const body = [
    { x: -33, y: 0 },
    { x: -30, y: -3.5 },
    { x: -21, y: -7 },
    { x: -8, y: -9.5 },
    { x: 5, y: -9.5 },
    { x: 16, y: -7.5 },
    { x: 24, y: -4.5 },
    { x: 29, y: -2 },
    { x: 29, y: 2 },
    { x: 24, y: 4.5 },
    { x: 16, y: 7.5 },
    { x: 5, y: 9.5 },
    { x: -8, y: 9.5 },
    { x: -21, y: 7 },
    { x: -30, y: 3.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.6, bow: 10 },
    { angle: 0.6, bow: -10 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 22;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (29 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (4 - tt * 3.6) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-13 * s, 3 * s, -18 * s, 13 * s, -6 * s, 6 * s);
  g.fillTriangle(-1 * s, 8 * s, -4 * s, 13 * s, 4 * s, 9 * s);
  g.fillTriangle(9 * s, 6.5 * s, 12 * s, 11 * s, 15 * s, 6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -30, y: -3.5 },
    { x: -21, y: -7 },
    { x: -8, y: -9.5 },
    { x: 5, y: -9.5 },
    { x: 16, y: -7.5 },
    { x: 24, y: -4.5 },
    { x: 29, y: -2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6.5 * s }))
  );
  g.fillStyle(backColor, 0.88 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  {
    const angle = 0.26;
    const len = 17;
    const bow = 6.5;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 8;
    const left = [];
    const right = [];
    const baseX = -4;
    const baseY = -9.5;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (2.9 - tt * 2.5) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  g.fillStyle(yellowFin, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = 17 + i * 1.9;
    g.fillTriangle(fx * s, -6.5 * s, (fx + 1.3) * s, -6.5 * s, (fx + 0.65) * s, -9.5 * s);
    g.fillTriangle(fx * s, 6.5 * s, (fx + 1.3) * s, 6.5 * s, (fx + 0.65) * s, 9.5 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-22 * s, -4.5 * s);
  g.lineTo(-20 * s, 4.5 * s);
  g.strokePath();

  // The dramatically large, dark eye - visibly bigger than any other
  // fish's eye in the game, the real animal's own field mark and
  // namesake.
  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-26 * s, -2 * s, 4.2 * s);
  g.fillStyle(0x0a1015, alpha);
  g.fillCircle(-25.6 * s, -2 * s, 2.6 * s);
  g.fillStyle(0xffffff, 0.5 * alpha);
  g.fillCircle(-26.6 * s, -2.8 * s, 0.8 * s);

  g.restore();
}

// A skipjack tuna - a small, compact true tuna, plain and unremarkable in
// its fins, since the real animal's own genuine field mark is a set of
// bold, dark, HORIZONTAL stripes running along the lower flank and belly
// - unlike the Bonito's oblique back stripes, the Longtail's spot
// cluster, or the Tarwhine's own thin gold pinstripes higher up the body.
export function drawSkipjackTuna(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb6c4c8;
  const backColor = 0x1c3848;
  const bellyColor = 0xf0f4f2;
  const finColor = 0x2c4a58;
  const darkColor = 0x122028;
  const stripeColor = 0x18282e;

  const body = [
    { x: -24, y: 0 },
    { x: -21, y: -2.8 },
    { x: -14, y: -5.5 },
    { x: -4, y: -7.2 },
    { x: 5, y: -7.2 },
    { x: 13, y: -5.8 },
    { x: 19, y: -3.6 },
    { x: 23, y: -1.6 },
    { x: 23, y: 1.6 },
    { x: 19, y: 3.6 },
    { x: 13, y: 5.8 },
    { x: 5, y: 7.2 },
    { x: -4, y: 7.2 },
    { x: -14, y: 5.5 },
    { x: -21, y: 2.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.55, bow: 7 },
    { angle: 0.55, bow: -7 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 15;
    const steps = 9;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (23 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.2 - tt * 2.9) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 2.5 * s, -14 * s, 9 * s, -5 * s, 4.5 * s);
  g.fillTriangle(0, 6.5 * s, -2.5 * s, 10.5 * s, 4 * s, 7 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -21, y: -2.8 },
    { x: -14, y: -5.5 },
    { x: -4, y: -7.2 },
    { x: 5, y: -7.2 },
    { x: 13, y: -5.8 },
    { x: 19, y: -3.6 },
    { x: 23, y: -1.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.85 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The bold, dark, horizontal stripes along the lower flank and belly -
  // the real Skipjack's own genuine field mark.
  g.lineStyle(1.2 * s, stripeColor, 0.7 * alpha);
  [3.5, 5, 6.3].forEach((sy) => {
    g.beginPath();
    g.moveTo(-19 * s, sy * s);
    g.lineTo(18 * s, (sy - 0.5) * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -7.2 * s, 3 * s, -6.8 * s, -1 * s, -12.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-4 * s, -7.2 * s, 3 * s, -6.8 * s, -1 * s, -12.5 * s);

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const fx = 14 + i * 1.6;
    g.fillTriangle(fx * s, -5 * s, (fx + 1.1) * s, -5 * s, (fx + 0.55) * s, -7.4 * s);
    g.fillTriangle(fx * s, 5 * s, (fx + 1.1) * s, 5 * s, (fx + 0.55) * s, 7.4 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, -4 * s);
  g.lineTo(-15 * s, 4 * s);
  g.strokePath();

  g.fillStyle(0xeef3f2, alpha);
  g.fillCircle(-19 * s, -1.2 * s, 2 * s);
  g.fillStyle(0x0e1618, alpha);
  g.fillCircle(-18.6 * s, -1.2 * s, 1.1 * s);

  g.restore();
}

// A blackfin tuna - a small, deep-bodied true tuna, with the real
// animal's own genuine field mark given full contrast: dark, near-black
// finlets - unlike every other tuna here, which all carry yellow (or
// yellow-and-black) finlets. Edged with a thin pale outline so they still
// read clearly against the equally dark back.
export function drawBlackfinTuna(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xaebcc4;
  const backColor = 0x1a2e40;
  const bellyColor = 0xeef2f0;
  const finColor = 0x24404e;
  const darkColor = 0x0e1c26;
  const finletColor = 0x0a1216;
  const finletEdge = 0xc8d0d2;

  const body = [
    { x: -25, y: 0 },
    { x: -22, y: -3 },
    { x: -15, y: -6 },
    { x: -4, y: -8 },
    { x: 6, y: -8 },
    { x: 14, y: -6.5 },
    { x: 20, y: -4 },
    { x: 24, y: -1.8 },
    { x: 24, y: 1.8 },
    { x: 20, y: 4 },
    { x: 14, y: 6.5 },
    { x: 6, y: 8 },
    { x: -4, y: 8 },
    { x: -15, y: 6 },
    { x: -22, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.58, bow: 8 },
    { angle: 0.58, bow: -8 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 17;
    const steps = 9;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (24 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.4 - tt * 3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 3 * s, -14 * s, 9 * s, -6 * s, 5.5 * s);
  g.fillTriangle(-1 * s, 7 * s, -3.5 * s, 11.5 * s, 4 * s, 7.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -22, y: -3 },
    { x: -15, y: -6 },
    { x: -4, y: -8 },
    { x: 6, y: -8 },
    { x: 14, y: -6.5 },
    { x: 20, y: -4 },
    { x: 24, y: -1.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.5 * s }))
  );
  g.fillStyle(backColor, 0.9 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -8 * s, 4 * s, -7.5 * s, -1 * s, -14 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-4 * s, -8 * s, 4 * s, -7.5 * s, -1 * s, -14 * s);

  // The dark, near-black finlets, edged with a thin pale outline so they
  // still read clearly - the real Blackfin's own defining field mark.
  for (let i = 0; i < 5; i += 1) {
    const fx = 15 + i * 1.7;
    g.fillStyle(finletColor, alpha);
    g.fillTriangle(fx * s, -5.5 * s, (fx + 1.2) * s, -5.5 * s, (fx + 0.6) * s, -8.2 * s);
    g.fillTriangle(fx * s, 5.5 * s, (fx + 1.2) * s, 5.5 * s, (fx + 0.6) * s, 8.2 * s);
    g.lineStyle(0.5 * s, finletEdge, 0.6 * alpha);
    g.strokeTriangle(fx * s, -5.5 * s, (fx + 1.2) * s, -5.5 * s, (fx + 0.6) * s, -8.2 * s);
    g.strokeTriangle(fx * s, 5.5 * s, (fx + 1.2) * s, 5.5 * s, (fx + 0.6) * s, 8.2 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-17 * s, -4.4 * s);
  g.lineTo(-16 * s, 4.4 * s);
  g.strokePath();

  g.fillStyle(0xeef3f2, alpha);
  g.fillCircle(-20 * s, -1.6 * s, 2.2 * s);
  g.fillStyle(0x0a1014, alpha);
  g.fillCircle(-19.6 * s, -1.6 * s, 1.2 * s);

  g.restore();
}

// A dogtooth tuna - not a true Thunnus tuna at all, and built to look the
// part: a robust, deep-bodied reef predator (stockier than any of the
// open-ocean tuna here) with plain, unpatterned dark blue-green over
// silver - no stripes or spots - and the real animal's own genuinely
// unique field mark for a "tuna": a jaw held open to show large,
// prominent, conical dog-like teeth, unlike the small or absent teeth
// every other tuna-family fish here carries.
export function drawDogtoothTuna(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa8bcbc;
  const backColor = 0x143a3c;
  const bellyColor = 0xeef4f2;
  const finColor = 0x1e4c4e;
  const darkColor = 0x0c2222;
  const toothColor = 0xf2f0e8;

  const body = [
    { x: -28, y: 0 },
    { x: -25, y: -4.5 },
    { x: -16, y: -8.5 },
    { x: -4, y: -11 },
    { x: 8, y: -10.5 },
    { x: 17, y: -7.5 },
    { x: 23, y: -4.5 },
    { x: 27, y: -2 },
    { x: 27, y: 2 },
    { x: 23, y: 4.5 },
    { x: 17, y: 7.5 },
    { x: 8, y: 10.5 },
    { x: -4, y: 11 },
    { x: -16, y: 8.5 },
    { x: -25, y: 4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.55, bow: 8 },
    { angle: 0.55, bow: -8 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 18;
    const steps = 9;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (27 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.8 - tt * 3.4) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 4 * s, -16 * s, 12 * s, -4 * s, 7 * s);
  g.fillTriangle(1 * s, 9.5 * s, -2 * s, 15 * s, 6 * s, 10 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -25, y: -4.5 },
    { x: -16, y: -8.5 },
    { x: -4, y: -11 },
    { x: 8, y: -10.5 },
    { x: 17, y: -7.5 },
    { x: 23, y: -4.5 },
    { x: 27, y: -2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6.5 * s }))
  );
  g.fillStyle(backColor, 0.85 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -10.8 * s, 6 * s, -10 * s, 0, -18 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-5 * s, -10.8 * s, 6 * s, -10 * s, 0, -18 * s);

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const fx = 17 + i * 2;
    g.fillTriangle(fx * s, -6.5 * s, (fx + 1.4) * s, -6.5 * s, (fx + 0.7) * s, -9.5 * s);
    g.fillTriangle(fx * s, 6.5 * s, (fx + 1.4) * s, 6.5 * s, (fx + 0.7) * s, 9.5 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -6 * s);
  g.lineTo(-17 * s, 6 * s);
  g.strokePath();

  // The jaw held open to show large, prominent, conical dog-like teeth -
  // the real animal's own genuinely unique field mark for a "tuna", and
  // its actual namesake.
  g.lineStyle(1.1 * s, darkColor, 0.75 * alpha);
  g.beginPath();
  g.moveTo(-27 * s, 1 * s);
  g.lineTo(-16 * s, 6.5 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const tx = -26 + i * 3;
    g.fillTriangle(tx * s, 1.5 * s, (tx + 2) * s, 3 * s, (tx + 0.8) * s, 6.4 * s);
  }
  for (let i = 0; i < 3; i += 1) {
    const tx = -24 + i * 3.4;
    g.fillTriangle(tx * s, -1 * s, (tx + 1.8) * s, -0.6 * s, (tx + 0.6) * s, -4.4 * s);
  }

  g.fillStyle(0xd8e0dc, alpha);
  g.fillCircle(-22 * s, -3 * s, 2.6 * s);
  g.fillStyle(0x0a1210, alpha);
  g.fillCircle(-21.6 * s, -3 * s, 1.4 * s);

  g.restore();
}

// A luderick - a deep, laterally-compressed grazer (not a predator like
// most fish here), with a tiny, blunt, nibbling mouth built for scraping
// algae rather than seizing prey, dark blackish-olive coloring, and a set
// of faint, low-contrast vertical bars - much subtler than the Banded
// Morwong's own bold bands, since a real luderick's barring is a soft
// suggestion, not a bold pattern.
export function drawLuderick(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x3c3f34;
  const backColor = 0x22241c;
  const bellyColor = 0x5c6050;
  const finColor = 0x2e3126;
  const darkColor = 0x14150f;
  const barColor = 0x181a12;

  const body = [
    { x: -23, y: 0 },
    { x: -20, y: -6 },
    { x: -11, y: -11 },
    { x: 1, y: -13 },
    { x: 12, y: -12 },
    { x: 19, y: -8 },
    { x: 24, y: -4 },
    { x: 26, y: 0 },
    { x: 24, y: 4 },
    { x: 19, y: 8 },
    { x: 12, y: 12 },
    { x: 1, y: 13 },
    { x: -11, y: 11 },
    { x: -20, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -5 * s, 26 * s, 5 * s, 35 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -5 * s, 26 * s, 5 * s, 35 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 4 * s, -13 * s, 12 * s, -2 * s, 7 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 4 * s, -13 * s, 12 * s, -2 * s, 7 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(2 * s, 13 * s, -1 * s, 19 * s, 7 * s, 13.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -20, y: -6 },
    { x: -11, y: -11 },
    { x: 1, y: -13 },
    { x: 12, y: -12 },
    { x: 19, y: -8 },
    { x: 24, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The faint, low-contrast vertical bars - a soft suggestion, unlike the
  // Banded Morwong's own bold, high-contrast bands.
  g.lineStyle(2.4 * s, barColor, 0.25 * alpha);
  [-13, -5, 3, 11, 18].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -11 * s);
    g.lineTo((bx - 1) * s, 11 * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -12.5 * s, 13 * s, -10.5 * s, 4 * s, -19 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-5 * s, -12.5 * s, 13 * s, -10.5 * s, 4 * s, -19 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-14 * s, -7.5 * s);
  g.lineTo(-12 * s, 7.5 * s);
  g.strokePath();

  // A tiny, blunt, nibbling mouth - a real grazer's mouth, built for
  // scraping algae, not a predator's jaw.
  g.fillStyle(darkColor, 0.7 * alpha);
  g.fillEllipse(-21 * s, 1 * s, 2.6 * s, 1.8 * s);

  g.fillStyle(0x8a9078, alpha);
  g.fillCircle(-15 * s, -5.5 * s, 2.3 * s);
  g.fillStyle(0x0a0c08, alpha);
  g.fillCircle(-14.6 * s, -5.5 * s, 1.3 * s);

  g.restore();
}

// A spanish mackerel - the leanest, most slender of the mackerel here (a
// real Spanish Mackerel is notably elongated and lean), marked with the
// real animal's own field mark: irregular, WAVY vertical bronze-grey bars
// - built from actual curved strokes, not the straight oblique lines of
// the Bonito or the round spots of the Spotted Mackerel - and a first
// dorsal fin colored a deliberately darker, almost black tone, a real
// Spanish Mackerel ID trait.
export function drawSpanishMackerel(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc2ccd0;
  const backColor = 0x2c4450;
  const bellyColor = 0xf0f4f2;
  const finColor = 0x3c5c68;
  const darkColor = 0x18262c;
  const barColor = 0x4a6874;
  const blackFin = 0x1c1e20;

  const body = [
    { x: -37, y: 0 },
    { x: -34, y: -2.6 },
    { x: -24, y: -5 },
    { x: -10, y: -7 },
    { x: 4, y: -7 },
    { x: 16, y: -5.5 },
    { x: 25, y: -3 },
    { x: 30, y: -1.2 },
    { x: 30, y: 1.2 },
    { x: 25, y: 3 },
    { x: 16, y: 5.5 },
    { x: 4, y: 7 },
    { x: -10, y: 7 },
    { x: -24, y: 5 },
    { x: -34, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.58, bow: 9 },
    { angle: 0.58, bow: -9 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 20;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (30 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.4 - tt * 3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-15 * s, 2.5 * s, -20 * s, 11 * s, -8 * s, 5 * s);
  g.fillTriangle(-1 * s, 6.5 * s, -4 * s, 12 * s, 4 * s, 7.5 * s);
  g.fillTriangle(10 * s, 5.5 * s, 13 * s, 10 * s, 17 * s, 5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -34, y: -2.6 },
    { x: -24, y: -5 },
    { x: -10, y: -7 },
    { x: 4, y: -7 },
    { x: 16, y: -5.5 },
    { x: 25, y: -3 },
    { x: 30, y: -1.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.8 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The irregular, wavy vertical bronze-grey bars - built as real curved
  // strokes, the real Spanish Mackerel's own field mark.
  g.lineStyle(1.6 * s, barColor, 0.65 * alpha);
  [-24, -15, -6, 3, 12, 20].forEach((bx, i) => {
    g.beginPath();
    g.moveTo(bx * s, -6 * s);
    quadCurveTo(g, bx * s, -6 * s, (bx + (i % 2 === 0 ? 5 : -5)) * s, 0, bx * s, 6 * s);
    g.strokePath();
  });

  // The first dorsal fin, colored a deliberately darker, almost black
  // tone - a real Spanish Mackerel ID trait.
  g.fillStyle(blackFin, 0.85 * alpha);
  g.fillTriangle(-9 * s, -6.5 * s, 3 * s, -6 * s, -3 * s, -14 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, -6.5 * s, 3 * s, -6 * s, -3 * s, -14 * s);

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = 17 + i * 2;
    g.fillTriangle(fx * s, -4.5 * s, (fx + 1.4) * s, -4.5 * s, (fx + 0.7) * s, -7 * s);
    g.fillTriangle(fx * s, 4.5 * s, (fx + 1.4) * s, 4.5 * s, (fx + 0.7) * s, 7 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-24 * s, -3.5 * s);
  g.lineTo(-22 * s, 3.5 * s);
  g.strokePath();

  // A slightly open jaw with a real row of sharp teeth.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-36 * s, 0.5 * s);
  g.lineTo(-26 * s, 3.5 * s);
  g.strokePath();
  g.fillStyle(0xf5f5f0, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -34 + i * 3;
    g.fillTriangle(tx * s, 1 * s, (tx + 1.4) * s, 1.6 * s, (tx + 0.5) * s, 3.4 * s);
  }

  g.fillStyle(0xeef2f2, alpha);
  g.fillCircle(-28 * s, -1.4 * s, 2.4 * s);
  g.fillStyle(0x0c1418, alpha);
  g.fillCircle(-27.6 * s, -1.4 * s, 1.3 * s);

  g.restore();
}

// A school mackerel - a shorter, smaller-bodied mackerel than the Spanish
// (a real School Mackerel is notably more compact), marked with its own
// real field mark: large, diffuse, irregular bronze-brown blotches
// smudged along the flank - looser and blurrier than the Spotted
// Mackerel's own neat rows of small spots.
export function drawSchoolMackerel(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc6ccc4;
  const backColor = 0x3c4838;
  const bellyColor = 0xf0f2ea;
  const finColor = 0x50604a;
  const darkColor = 0x20281c;
  const blotchColor = 0x6a5030;

  const body = [
    { x: -27, y: 0 },
    { x: -24, y: -2.6 },
    { x: -17, y: -5 },
    { x: -7, y: -6.8 },
    { x: 3, y: -6.8 },
    { x: 11, y: -5.5 },
    { x: 18, y: -3.5 },
    { x: 22, y: -1.6 },
    { x: 22, y: 1.6 },
    { x: 18, y: 3.5 },
    { x: 11, y: 5.5 },
    { x: 3, y: 6.8 },
    { x: -7, y: 6.8 },
    { x: -17, y: 5 },
    { x: -24, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.56, bow: 7.5 },
    { angle: 0.56, bow: -7.5 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 16;
    const steps = 9;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (22 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3 - tt * 2.7) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 2.5 * s, -15 * s, 9 * s, -6 * s, 4.5 * s);
  g.fillTriangle(-1 * s, 6 * s, -3.5 * s, 10.5 * s, 3 * s, 6.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -24, y: -2.6 },
    { x: -17, y: -5 },
    { x: -7, y: -6.8 },
    { x: 3, y: -6.8 },
    { x: 11, y: -5.5 },
    { x: 18, y: -3.5 },
    { x: 22, y: -1.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.6 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The large, diffuse, irregular blotches - looser and blurrier than the
  // Spotted Mackerel's own neat rows of small spots.
  g.fillStyle(blotchColor, 0.45 * alpha);
  [
    [-16, -2, 3.4],
    [-6, -4, 3],
    [3, -1, 3.6],
    [11, -2.5, 2.8],
    [-9, 3, 2.8],
    [1, 3.5, 3],
    [9, 2, 2.4]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 2 * s, br * 1.3 * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -6.8 * s, 2 * s, -6.3 * s, -2 * s, -12 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-6 * s, -6.8 * s, 2 * s, -6.3 * s, -2 * s, -12 * s);

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const fx = 13 + i * 1.8;
    g.fillTriangle(fx * s, -3.8 * s, (fx + 1.2) * s, -3.8 * s, (fx + 0.6) * s, -6 * s);
    g.fillTriangle(fx * s, 3.8 * s, (fx + 1.2) * s, 3.8 * s, (fx + 0.6) * s, 6 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-18 * s, -3 * s);
  g.lineTo(-16 * s, 3 * s);
  g.strokePath();

  g.fillStyle(0xeef2ea, alpha);
  g.fillCircle(-21 * s, -1 * s, 2.1 * s);
  g.fillStyle(0x10140c, alpha);
  g.fillCircle(-20.6 * s, -1 * s, 1.1 * s);

  g.restore();
}

// A king mackerel - built with the real animal's own field mark being its
// deliberate absence: a plain, entirely unmarked silvery body with no
// spots, bars, or blotches at all - unlike every other mackerel here -
// paired with the one real King Mackerel detail that IS there: a crisp
// black margin along the front edge of the first dorsal fin.
export function drawKingMackerel(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc8d0d4;
  const backColor = 0x3a4650;
  const bellyColor = 0xf2f4f4;
  const finColor = 0x4a5a64;
  const darkColor = 0x1c242a;
  const blackTip = 0x141618;

  const body = [
    { x: -35, y: 0 },
    { x: -32, y: -2.6 },
    { x: -22, y: -5 },
    { x: -9, y: -6.8 },
    { x: 4, y: -6.8 },
    { x: 15, y: -5.4 },
    { x: 23, y: -3 },
    { x: 28, y: -1.3 },
    { x: 28, y: 1.3 },
    { x: 23, y: 3 },
    { x: 15, y: 5.4 },
    { x: 4, y: 6.8 },
    { x: -9, y: 6.8 },
    { x: -22, y: 5 },
    { x: -32, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.58, bow: 8.5 },
    { angle: 0.58, bow: -8.5 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 19;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (28 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.2 - tt * 2.9) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-14 * s, 2.4 * s, -19 * s, 10 * s, -7 * s, 4.8 * s);
  g.fillTriangle(-1 * s, 6.2 * s, -4 * s, 11.5 * s, 4 * s, 7.2 * s);
  g.fillTriangle(9 * s, 5.2 * s, 12 * s, 9.5 * s, 16 * s, 4.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -32, y: -2.6 },
    { x: -22, y: -5 },
    { x: -9, y: -6.8 },
    { x: 4, y: -6.8 },
    { x: 15, y: -5.4 },
    { x: 23, y: -3 },
    { x: 28, y: -1.3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.5 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // No pattern at all here - the plain, unmarked flank is deliberate,
  // the real King Mackerel's own field mark by its very absence.

  // The crisp black margin along the front edge of the first dorsal - the
  // one real King Mackerel detail that IS there.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -6.3 * s, 3 * s, -5.8 * s, -3 * s, -13.5 * s);
  g.lineStyle(1.6 * s, blackTip, 0.85 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, -6.3 * s);
  g.lineTo(-3 * s, -13.5 * s);
  g.strokePath();
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-8 * s, -6.3 * s, 3 * s, -5.8 * s, -3 * s, -13.5 * s);

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = 16 + i * 1.9;
    g.fillTriangle(fx * s, -4.3 * s, (fx + 1.3) * s, -4.3 * s, (fx + 0.65) * s, -6.6 * s);
    g.fillTriangle(fx * s, 4.3 * s, (fx + 1.3) * s, 4.3 * s, (fx + 0.65) * s, 6.6 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-23 * s, -3.4 * s);
  g.lineTo(-21 * s, 3.4 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-34 * s, 0.4 * s);
  g.lineTo(-25 * s, 3 * s);
  g.strokePath();
  g.fillStyle(0xf5f5f0, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -32 + i * 2.8;
    g.fillTriangle(tx * s, 1 * s, (tx + 1.3) * s, 1.5 * s, (tx + 0.5) * s, 3.2 * s);
  }

  g.fillStyle(0xeef2f4, alpha);
  g.fillCircle(-27 * s, -1.3 * s, 2.3 * s);
  g.fillStyle(0x0c1216, alpha);
  g.fillCircle(-26.6 * s, -1.3 * s, 1.2 * s);

  g.restore();
}

// A mahi mahi - built with a construction nothing else in the game
// shares: a real dolphinfish's own unmistakable silhouette, a dramatic,
// almost vertical blunt forehead (a flat-fronted "wall" rather than any
// kind of tapered snout), and one huge, continuous dorsal fin running
// nearly the entire length of the back, towering tallest right behind the
// head and lowering toward the tail. Brilliant iridescent coloring -
// electric blue-green back, gold-yellow flanks scattered with small
// blue-green spots - unlike the muted, realistic tones of every other
// fish here.
export function drawMahiMahi(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe8c840;
  const backColor = 0x156068;
  const bellyColor = 0xf5e8a0;
  const finColor = 0x1c7078;
  const darkColor = 0x0c2c30;
  const spotColor = 0x2a8a80;

  // The dramatic, almost vertical blunt forehead - a flat-fronted "wall"
  // rather than any kind of tapered snout, the real animal's own
  // unmistakable field mark.
  const body = [
    { x: -22, y: -18 },
    { x: -27, y: -6 },
    { x: -27, y: 6 },
    { x: -20, y: 15 },
    { x: -6, y: 19 },
    { x: 10, y: 17 },
    { x: 22, y: 11 },
    { x: 29, y: 4 },
    { x: 29, y: -4 },
    { x: 22, y: -11 },
    { x: 10, y: -17 },
    { x: -6, y: -19 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A deeply forked tail, matching the body's own vivid color.
  g.fillStyle(bodyColor, alpha);
  g.fillTriangle(29 * s, -4 * s, 41 * s, -13 * s, 33 * s, 0);
  g.fillTriangle(29 * s, 4 * s, 41 * s, 13 * s, 33 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(29 * s, -4 * s, 41 * s, -13 * s, 33 * s, 0);
  g.strokeTriangle(29 * s, 4 * s, 41 * s, 13 * s, 33 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-15 * s, 6 * s, -20 * s, 16 * s, -8 * s, 9 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-15 * s, 6 * s, -20 * s, 16 * s, -8 * s, 9 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2 * s, 15 * s, -5 * s, 22 * s, 4 * s, 16 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -22, y: -18 },
    { x: 10, y: -17 },
    { x: 22, y: -11 },
    { x: 29, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Small blue-green spots scattered on the golden flank.
  g.fillStyle(spotColor, 0.7 * alpha);
  [
    [-8, -5, 1.3],
    [0, -8, 1.2],
    [8, -6, 1.2],
    [-4, 3, 1.2],
    [5, 5, 1.3],
    [13, -2, 1.1],
    [-12, 5, 1.1]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  // The one huge, continuous dorsal fin running nearly the entire body
  // length, towering tallest right behind the head - the real dolphinfish
  // silhouette's own defining feature.
  g.fillStyle(finColor, 0.92 * alpha);
  g.fillPoints(
    [
      { x: -20, y: -16 },
      { x: -18, y: -34 },
      { x: -8, y: -34 },
      { x: 4, y: -30 },
      { x: 16, y: -24 },
      { x: 24, y: -16 },
      { x: 22, y: -11 },
      { x: 10, y: -17 },
      { x: -6, y: -19 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -20, y: -16 },
      { x: -18, y: -34 },
      { x: -8, y: -34 },
      { x: 4, y: -30 },
      { x: 16, y: -24 },
      { x: 24, y: -16 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    false
  );

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-24 * s, -8 * s);
  g.lineTo(-23 * s, 8 * s);
  g.strokePath();

  g.fillStyle(0xf5f0d0, alpha);
  g.fillCircle(-23 * s, -6 * s, 2.6 * s);
  g.fillStyle(0x0e1c1c, alpha);
  g.fillCircle(-22.6 * s, -6 * s, 1.4 * s);

  g.restore();
}

// A mangrove jack - a robust, moderately steep-headed snapper (steeper
// than the Bream's gentle slope, gentler than the Trevally's near-
// vertical wall), deep reddish-orange coloring - the real animal's own
// field mark - and a jaw showing the real animal's own genuine feature: a
// pair of prominent, forward-pointing canine teeth at the front, unlike
// the fine even tooth rows the Tailor or Spanish Mackerel carry.
export function drawMangroveJack(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb8482e;
  const backColor = 0x7a2818;
  const bellyColor = 0xe08a68;
  const finColor = 0x9a3c22;
  const darkColor = 0x3c1408;
  const toothColor = 0xf5f0e4;

  const body = [
    { x: -27, y: 2 },
    { x: -24, y: -6 },
    { x: -15, y: -12 },
    { x: -2, y: -15 },
    { x: 11, y: -14 },
    { x: 20, y: -9 },
    { x: 26, y: -4 },
    { x: 28, y: 0 },
    { x: 26, y: 4 },
    { x: 20, y: 9 },
    { x: 11, y: 14 },
    { x: -2, y: 15 },
    { x: -15, y: 12 },
    { x: -23, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(28 * s, -4 * s, 39 * s, -10 * s, 33 * s, 0);
  g.fillTriangle(28 * s, 4 * s, 39 * s, 10 * s, 33 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(28 * s, -4 * s, 39 * s, -10 * s, 33 * s, 0);
  g.strokeTriangle(28 * s, 4 * s, 39 * s, 10 * s, 33 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 5 * s, -16 * s, 15 * s, -3 * s, 8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-10 * s, 5 * s, -16 * s, 15 * s, -3 * s, 8 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(2 * s, 14 * s, -2 * s, 21 * s, 8 * s, 15 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -24, y: -6 },
    { x: -15, y: -12 },
    { x: -2, y: -15 },
    { x: 11, y: -14 },
    { x: 20, y: -9 },
    { x: 26, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  const bottomProfile = [
    { x: -15, y: 12 },
    { x: -2, y: 15 },
    { x: 11, y: 14 },
    { x: 20, y: 9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bottomProfile.concat(
    bottomProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.35 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -9, y: -12 },
    { x: -4, y: -14.5 },
    { x: 1, y: -14 },
    { x: 5, y: -13.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(5 * s, -13.5 * s, 15 * s, -10 * s, 9 * s, -20 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(5 * s, -13.5 * s, 15 * s, -10 * s, 9 * s, -20 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, -8 * s);
  g.lineTo(-14 * s, 8 * s);
  g.strokePath();

  // The pair of prominent, forward-pointing canine teeth at the front of
  // the jaw - the real animal's own genuine field mark, unlike the fine
  // even tooth rows other predators here carry.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-26 * s, 3 * s);
  g.lineTo(-17 * s, 8 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  g.fillTriangle(-24 * s, 4 * s, -21 * s, 5 * s, -22.5 * s, 9.5 * s);
  g.fillTriangle(-20 * s, 5.5 * s, -17.5 * s, 6.5 * s, -19 * s, 10.5 * s);

  g.fillStyle(0xf0d0b8, alpha);
  g.fillCircle(-19 * s, -3 * s, 2.6 * s);
  g.fillStyle(0x1c0e06, alpha);
  g.fillCircle(-18.6 * s, -3 * s, 1.4 * s);

  g.restore();
}

// A black marlin - the stockiest-bodied of the marlins here, and built
// around the real animal's own single most unusual anatomical trait: its
// pectoral fins are rigid and cannot be folded flat against the body like
// every other marlin's can, so they're drawn here as stiff, straight-
// edged blades held out from the flank rather than the swept, curved
// sickle shapes used on the other marlins. A comparatively short, stout
// bill and a low, unremarkable first dorsal (no tall sail here - that's
// the Striped Marlin's own field mark) keep the silhouette reading as
// its own animal at a glance.
export function drawBlackMarlin(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x3a4658;
  const backColor = 0x1c2632;
  const bellyColor = 0xd8dcdc;
  const finColor = 0x242e3a;
  const darkColor = 0x0e141c;

  const bill = [
    { x: -30, y: -1.6 },
    { x: -30, y: 1.6 },
    { x: -18, y: 0.6 },
    { x: -18, y: -0.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const body = [
    { x: -18, y: -4 },
    { x: -10, y: -8 },
    { x: 2, y: -10 },
    { x: 14, y: -9 },
    { x: 24, y: -6 },
    { x: 30, y: -2.6 },
    { x: 30, y: 2.6 },
    { x: 24, y: 6 },
    { x: 14, y: 9 },
    { x: 2, y: 10 },
    { x: -10, y: 8 },
    { x: -18, y: 4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(30 * s, -3 * s, 42 * s, -13 * s, 34 * s, 0);
  g.fillTriangle(30 * s, 3 * s, 42 * s, 13 * s, 34 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(30 * s, -3 * s, 42 * s, -13 * s, 34 * s, 0);
  g.strokeTriangle(30 * s, 3 * s, 42 * s, 13 * s, 34 * s, 0);

  // The rigid, straight-edged pectoral blade - held stiffly out from the
  // flank, unable to fold flat, unlike every other marlin here.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -6, y: 3 },
      { x: -13, y: 15 },
      { x: -10, y: 16 },
      { x: -1, y: 5 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -6, y: 3 },
      { x: -13, y: 15 },
      { x: -10, y: 16 },
      { x: -1, y: 5 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 9.5 * s, 1 * s, 15.5 * s, 9 * s, 10.5 * s);

  g.fillStyle(bill.length ? bodyColor : bodyColor, alpha);
  g.fillStyle(darkColor, 0.9 * alpha);
  g.fillPoints(bill, true);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -10, y: -8 },
    { x: 2, y: -10 },
    { x: 14, y: -9 },
    { x: 24, y: -6 },
    { x: 30, y: -2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Low, unremarkable first dorsal - deliberately far shorter than the
  // Striped Marlin's own dramatic sail.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -6, y: -8.5 },
      { x: -2, y: -16 },
      { x: 6, y: -15 },
      { x: 12, y: -9.5 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -6, y: -8.5 },
      { x: -2, y: -16 },
      { x: 6, y: -15 },
      { x: 12, y: -9.5 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-1 * s, -6 * s);
  g.lineTo(1 * s, 6 * s);
  g.strokePath();

  g.fillStyle(0xd0d4d0, alpha);
  g.fillCircle(-14 * s, -2 * s, 2 * s);
  g.fillStyle(0x080c10, alpha);
  g.fillCircle(-13.6 * s, -2 * s, 1.1 * s);

  g.restore();
}

// A blue marlin - the largest and most streamlined marlin here, cobalt
// blue over a silvery-white belly with only faint, subtle pale-blue
// vertical bars (much less pronounced than the Striped Marlin's own bold
// stripes), a pointed, moderately tall first dorsal, and long, swept-
// back sickle pectoral fins built to fold flat against the flank -
// genuinely different fin construction from the Black Marlin's rigid,
// straight-edged blade.
export function drawBlueMarlin(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x2c5c8a;
  const backColor = 0x143454;
  const bellyColor = 0xe8ecec;
  const finColor = 0x1c3c5a;
  const darkColor = 0x0a1c2c;
  const stripeColor = 0x6a9cc0;

  const bill = [
    { x: -38, y: -1.4 },
    { x: -38, y: 1.4 },
    { x: -20, y: 0.5 },
    { x: -20, y: -0.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const body = [
    { x: -20, y: -3.6 },
    { x: -11, y: -7.5 },
    { x: 2, y: -9.5 },
    { x: 15, y: -8.5 },
    { x: 27, y: -5.5 },
    { x: 33, y: -2.4 },
    { x: 33, y: 2.4 },
    { x: 27, y: 5.5 },
    { x: 15, y: 8.5 },
    { x: 2, y: 9.5 },
    { x: -11, y: 7.5 },
    { x: -20, y: 3.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(33 * s, -3 * s, 46 * s, -14 * s, 37 * s, 0);
  g.fillTriangle(33 * s, 3 * s, 46 * s, 14 * s, 37 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(33 * s, -3 * s, 46 * s, -14 * s, 37 * s, 0);
  g.strokeTriangle(33 * s, 3 * s, 46 * s, 14 * s, 37 * s, 0);

  // The long, swept-back sickle pectoral, built to fold nearly flat
  // against the flank - a real Blue Marlin trait, and a genuinely
  // different construction from the Black Marlin's rigid blade.
  {
    const angle = 1.15;
    const len = 20;
    const bow = 6;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 9;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (-4 + dx * len * tt + px * curve) * s;
      const cy = (4 + dy * len * tt + py * curve) * s;
      const w = (3.2 - tt * 2.9) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(5 * s, 9 * s, 2 * s, 15 * s, 10 * s, 10 * s);

  g.fillStyle(darkColor, 0.9 * alpha);
  g.fillPoints(bill, true);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -11, y: -7.5 },
    { x: 2, y: -9.5 },
    { x: 15, y: -8.5 },
    { x: 27, y: -5.5 },
    { x: 33, y: -2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.5 * s }))
  );
  g.fillStyle(backColor, 0.75 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Faint, subtle pale-blue vertical bars - deliberately low-contrast,
  // unlike the Striped Marlin's own bold, high-contrast stripes.
  g.lineStyle(1.6 * s, stripeColor, 0.3 * alpha);
  [-14, -6, 2, 10, 18, 25].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -7 * s);
    g.lineTo((bx - 1) * s, 7 * s);
    g.strokePath();
  });

  // Pointed, moderately tall first dorsal.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -8, y: -8 },
      { x: -3, y: -19 },
      { x: 8, y: -15 },
      { x: 14, y: -8.5 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -8, y: -8 },
      { x: -3, y: -19 },
      { x: 8, y: -15 },
      { x: 14, y: -8.5 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-2 * s, -5.5 * s);
  g.lineTo(0, 5.5 * s);
  g.strokePath();

  g.fillStyle(0xd8e4e8, alpha);
  g.fillCircle(-16 * s, -1.8 * s, 2.1 * s);
  g.fillStyle(0x081014, alpha);
  g.fillCircle(-15.6 * s, -1.8 * s, 1.2 * s);

  g.restore();
}

// A striped marlin - the slenderest marlin here, and the one built
// around a real, unmistakable double field mark: bold, vivid, high-
// contrast light-blue vertical stripes down the whole flank (much
// stronger than the Blue Marlin's own faint bars), and a dramatically
// tall, sail-like first dorsal fin - proportionally the tallest of any
// marlin here, rising well above the body itself.
export function drawStripedMarlin(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x2c6888;
  const backColor = 0x14405a;
  const bellyColor = 0xe8ecec;
  const finColor = 0x1c3850;
  const darkColor = 0x0a1c28;
  const stripeColor = 0x8ad0e8;

  const bill = [
    { x: -34, y: -1.3 },
    { x: -34, y: 1.3 },
    { x: -17, y: 0.5 },
    { x: -17, y: -0.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const body = [
    { x: -17, y: -3 },
    { x: -9, y: -6.2 },
    { x: 1, y: -7.8 },
    { x: 12, y: -7 },
    { x: 21, y: -4.6 },
    { x: 27, y: -2 },
    { x: 27, y: 2 },
    { x: 21, y: 4.6 },
    { x: 12, y: 7 },
    { x: 1, y: 7.8 },
    { x: -9, y: 6.2 },
    { x: -17, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -2.6 * s, 38 * s, -11.5 * s, 31 * s, 0);
  g.fillTriangle(27 * s, 2.6 * s, 38 * s, 11.5 * s, 31 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -2.6 * s, 38 * s, -11.5 * s, 31 * s, 0);
  g.strokeTriangle(27 * s, 2.6 * s, 38 * s, 11.5 * s, 31 * s, 0);

  // A shorter, moderate sickle pectoral - a different sweep/proportion
  // from the Blue Marlin's own longer, flatter-folding pectoral.
  {
    const angle = 1.3;
    const len = 13;
    const bow = 3.4;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 8;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (-3 + dx * len * tt + px * curve) * s;
      const cy = (3 + dy * len * tt + py * curve) * s;
      const w = (2.6 - tt * 2.3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 7.3 * s, 1.5 * s, 12.5 * s, 8 * s, 8 * s);

  g.fillStyle(darkColor, 0.9 * alpha);
  g.fillPoints(bill, true);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -9, y: -6.2 },
    { x: 1, y: -7.8 },
    { x: 12, y: -7 },
    { x: 21, y: -4.6 },
    { x: 27, y: -2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.6 * s }))
  );
  g.fillStyle(backColor, 0.7 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The bold, vivid, high-contrast vertical stripes - the real Striped
  // Marlin's own defining field mark, deliberately much stronger than
  // the Blue Marlin's faint bars.
  g.lineStyle(2.1 * s, stripeColor, 0.75 * alpha);
  [-12, -6, 0, 6, 12, 18, 23].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -6 * s);
    g.lineTo((bx - 1.5) * s, 6 * s);
    g.strokePath();
  });

  // The dramatically tall, sail-like first dorsal - proportionally the
  // tallest of any marlin here.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -6, y: -6.5 },
      { x: -3, y: -23 },
      { x: 3, y: -25 },
      { x: 9, y: -21 },
      { x: 12, y: -7.2 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -6, y: -6.5 },
      { x: -3, y: -23 },
      { x: 3, y: -25 },
      { x: 9, y: -21 },
      { x: 12, y: -7.2 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  // Stripe echoes carried up onto the sail itself.
  g.lineStyle(1.4 * s, stripeColor, 0.5 * alpha);
  [-3, 1, 5].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -8 * s);
    g.lineTo((bx + 1) * s, -20 * s);
    g.strokePath();
  });

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-1.5 * s, -4.6 * s);
  g.lineTo(0, 4.6 * s);
  g.strokePath();

  g.fillStyle(0xd8ecf0, alpha);
  g.fillCircle(-13 * s, -1.5 * s, 1.9 * s);
  g.fillStyle(0x081418, alpha);
  g.fillCircle(-12.6 * s, -1.5 * s, 1.05 * s);

  g.restore();
}

// A white marlin - the smallest marlin here, and built around the real
// animal's own single definitive ID feature: ROUNDED tips on the dorsal,
// anal, AND pectoral fins - every other marlin here has sharply pointed
// fin tips, so this is the one genuine, unambiguous way to tell a white
// marlin apart at a glance. A shorter, comparatively stout bill and
// faint pale stripes round it out.
export function drawWhiteMarlin(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x3c7868;
  const backColor = 0x1c4438;
  const bellyColor = 0xecefe8;
  const finColor = 0x265848;
  const darkColor = 0x0e241c;
  const stripeColor = 0x78c0a8;

  const bill = [
    { x: -24, y: -1.3 },
    { x: -24, y: 1.3 },
    { x: -13, y: 0.5 },
    { x: -13, y: -0.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const body = [
    { x: -13, y: -2.6 },
    { x: -6, y: -5.4 },
    { x: 2, y: -6.8 },
    { x: 10, y: -6 },
    { x: 17, y: -4 },
    { x: 21, y: -1.8 },
    { x: 21, y: 1.8 },
    { x: 17, y: 4 },
    { x: 10, y: 6 },
    { x: 2, y: 6.8 },
    { x: -6, y: 5.4 },
    { x: -13, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(21 * s, -2.2 * s, 30 * s, -9.5 * s, 24.5 * s, 0);
  g.fillTriangle(21 * s, 2.2 * s, 30 * s, 9.5 * s, 24.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(21 * s, -2.2 * s, 30 * s, -9.5 * s, 24.5 * s, 0);
  g.strokeTriangle(21 * s, 2.2 * s, 30 * s, 9.5 * s, 24.5 * s, 0);

  // The rounded-tip pectoral - built from an ellipse rather than any
  // pointed sickle or blade, the real animal's own key ID trait.
  g.fillStyle(finColor, alpha);
  g.save();
  g.translateCanvas(-1 * s, 4 * s);
  g.rotateCanvas(1.25);
  g.fillEllipse(0, 0, 5 * s, 13 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(0, 0, 5 * s, 13 * s);
  g.restore();

  // A rounded-tip anal fin to match.
  g.fillStyle(finColor, alpha);
  g.save();
  g.translateCanvas(3 * s, 8 * s);
  g.rotateCanvas(0.3);
  g.fillEllipse(0, 0, 3.6 * s, 6.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(0, 0, 3.6 * s, 6.5 * s);
  g.restore();

  g.fillStyle(darkColor, 0.9 * alpha);
  g.fillPoints(bill, true);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -6, y: -5.4 },
    { x: 2, y: -6.8 },
    { x: 10, y: -6 },
    { x: 17, y: -4 },
    { x: 21, y: -1.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.8 * s }))
  );
  g.fillStyle(backColor, 0.65 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.lineStyle(1.4 * s, stripeColor, 0.35 * alpha);
  [-9, -3, 3, 9, 15].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -5 * s);
    g.lineTo((bx - 1) * s, 5 * s);
    g.strokePath();
  });

  // The rounded-tip first dorsal - built from an ellipse, the same
  // definitive rounded-fin treatment as the pectoral and anal fins.
  g.fillStyle(finColor, alpha);
  g.save();
  g.translateCanvas(0, -12 * s);
  g.fillEllipse(0, 0, 6.5 * s, 8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(0, 0, 6.5 * s, 8 * s);
  g.restore();
  g.fillStyle(bodyColor, alpha);
  g.fillRect(-6.5 * s, -6.2 * s, 13 * s, 0.6 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-1 * s, -3.5 * s);
  g.lineTo(0.5 * s, 3.5 * s);
  g.strokePath();

  g.fillStyle(0xe0ecec, alpha);
  g.fillCircle(-10 * s, -1.2 * s, 1.6 * s);
  g.fillStyle(0x081410, alpha);
  g.fillCircle(-9.7 * s, -1.2 * s, 0.9 * s);

  g.restore();
}

// A moses perch - a small, plain reddish-pink snapper-relative, marked
// with the real animal's own single genuine field mark: a bold, dark
// saddle blotch sitting right at the base of the tail, on the upper
// caudal peduncle - unlike anything else drawn on any other snapper here.
export function drawMosesPerch(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd87868;
  const backColor = 0xb85040;
  const bellyColor = 0xf4d8c8;
  const finColor = 0xc86050;
  const darkColor = 0x682820;
  const saddleColor = 0x3c1410;

  const body = [
    { x: -17, y: 1 },
    { x: -15, y: -5 },
    { x: -7, y: -9.5 },
    { x: 3, y: -10.5 },
    { x: 12, y: -8 },
    { x: 18, y: -4 },
    { x: 21, y: 0 },
    { x: 18, y: 4 },
    { x: 12, y: 8 },
    { x: 3, y: 10.5 },
    { x: -7, y: 9.5 },
    { x: -15, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(21 * s, -3.4 * s, 29 * s, -8 * s, 24 * s, 0);
  g.fillTriangle(21 * s, 3.4 * s, 29 * s, 8 * s, 24 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(21 * s, -3.4 * s, 29 * s, -8 * s, 24 * s, 0);
  g.strokeTriangle(21 * s, 3.4 * s, 29 * s, 8 * s, 24 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 5 * s, -11 * s, 12 * s, -2 * s, 7 * s);
  g.fillTriangle(1 * s, 9.5 * s, -2 * s, 14.5 * s, 5 * s, 10 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -15, y: -5 },
    { x: -7, y: -9.5 },
    { x: 3, y: -10.5 },
    { x: 12, y: -8 },
    { x: 18, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -10 * s, 10 * s, -8 * s, 2 * s, -16 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-6 * s, -10 * s, 10 * s, -8 * s, 2 * s, -16 * s);

  // The bold, dark saddle blotch at the base of the tail - the real
  // Moses Perch's own single genuine field mark.
  g.fillStyle(saddleColor, 0.85 * alpha);
  g.fillEllipse(15 * s, -3.5 * s, 4.2 * s, 4.6 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -6.5 * s);
  g.lineTo(-8 * s, 6.5 * s);
  g.strokePath();

  g.fillStyle(0xf4e4d8, alpha);
  g.fillCircle(-12 * s, -1.5 * s, 2 * s);
  g.fillStyle(0x1c0c08, alpha);
  g.fillCircle(-11.6 * s, -1.5 * s, 1.1 * s);

  g.restore();
}

// A mulloway - a big, elongated drum-family fish with a light, silvery-
// bronze sheen (unlike the dark, near-black Black Jewfish elsewhere in
// the game), and the real animal's own field mark: a long, low soft
// dorsal fin visibly divided into two sections - a shorter spiny front
// half and a longer soft rear half, joined but not continuous - a
// genuinely different dorsal-fin construction from the single unbroken
// blade used on every other fish here.
export function drawMulloway(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa8b0ac;
  const backColor = 0x545c58;
  const bellyColor = 0xe4e8e0;
  const finColor = 0x60625a;
  const darkColor = 0x282a24;
  const sheenColor = 0xc8b880;

  const body = [
    { x: -26, y: 1 },
    { x: -23, y: -5 },
    { x: -14, y: -9.5 },
    { x: -1, y: -11.5 },
    { x: 13, y: -10 },
    { x: 23, y: -6 },
    { x: 29, y: -2.4 },
    { x: 29, y: 2.4 },
    { x: 23, y: 6 },
    { x: 13, y: 10 },
    { x: -1, y: 11.5 },
    { x: -14, y: 9.5 },
    { x: -22, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(29 * s, -3.6 * s, 38 * s, -8.5 * s, 32 * s, 0);
  g.fillTriangle(29 * s, 3.6 * s, 38 * s, 8.5 * s, 32 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(29 * s, -3.6 * s, 38 * s, -8.5 * s, 32 * s, 0);
  g.strokeTriangle(29 * s, 3.6 * s, 38 * s, 8.5 * s, 32 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 6 * s, -15 * s, 15 * s, -4 * s, 9 * s);
  g.fillTriangle(4 * s, 10.5 * s, 0.5 * s, 17 * s, 9 * s, 11.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -23, y: -5 },
    { x: -14, y: -9.5 },
    { x: -1, y: -11.5 },
    { x: 13, y: -10 },
    { x: 23, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.5 * s }))
  );
  g.fillStyle(backColor, 0.5 * alpha);
  g.fillPoints(backBand, true);

  // The light, silvery-bronze sheen along the upper flank - the real
  // Mulloway's own coloring, clearly lighter than the dark Black
  // Jewfish.
  g.fillStyle(sheenColor, 0.22 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  // The dorsal fin visibly divided into a shorter spiny front section
  // and a longer soft rear section - a genuinely different construction
  // from the single continuous blade every other fish here uses.
  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = -12 + i * 3.4;
    g.fillTriangle(fx * s, -10.5 * s, (fx + 2.2) * s, -10.5 * s, (fx + 1.1) * s, -17 * s);
  }
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-12 * s, -10.5 * s);
  g.lineTo(5 * s, -10.5 * s);
  g.strokePath();
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: 6, y: -10.5 },
      { x: 8, y: -15 },
      { x: 14, y: -13.5 },
      { x: 18, y: -8.5 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: 6, y: -10.5 },
      { x: 8, y: -15 },
      { x: 14, y: -13.5 },
      { x: 18, y: -8.5 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, -7.5 * s);
  g.lineTo(-15 * s, 7.5 * s);
  g.strokePath();

  g.fillStyle(0xe4e8e4, alpha);
  g.fillCircle(-19 * s, -1.8 * s, 2.4 * s);
  g.fillStyle(0x141614, alpha);
  g.fillCircle(-18.6 * s, -1.8 * s, 1.3 * s);

  g.restore();
}

// A pearl perch - a deep-bodied perch (not a torpedo-shaped tuna) with
// the real animal's own field mark: an oversized, dark eye against a
// pearly, iridescent silver-pink sheen across the whole flank - built
// with a soft radial gradient of fill passes rather than a flat body
// color, unlike any other fish here.
export function drawPearlPerch(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc0c4d0;
  const backColor = 0x8890a4;
  const bellyColor = 0xf0eef0;
  const finColor = 0x9098a8;
  const darkColor = 0x383c48;
  const pearlColor = 0xe0b8c8;

  const body = [
    { x: -15, y: 1 },
    { x: -13, y: -6.5 },
    { x: -4, y: -12 },
    { x: 8, y: -13 },
    { x: 17, y: -9.5 },
    { x: 22, y: -4.5 },
    { x: 22, y: 4.5 },
    { x: 17, y: 9.5 },
    { x: 8, y: 13 },
    { x: -4, y: 12 },
    { x: -13, y: 6.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(22 * s, -4 * s, 30 * s, -9.5 * s, 25 * s, 0);
  g.fillTriangle(22 * s, 4 * s, 30 * s, 9.5 * s, 25 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(22 * s, -4 * s, 30 * s, -9.5 * s, 25 * s, 0);
  g.strokeTriangle(22 * s, 4 * s, 30 * s, 9.5 * s, 25 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 6.5 * s, -11 * s, 15 * s, -1 * s, 9.5 * s);
  g.fillTriangle(4 * s, 11.5 * s, 0.5 * s, 18 * s, 10 * s, 12.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // The pearly, iridescent sheen - built from soft overlapping tinted
  // fill passes rather than a flat color, a genuinely different
  // technique from any other fish here.
  g.fillStyle(pearlColor, 0.22 * alpha);
  g.fillEllipse(2 * s, -1 * s, 16 * s, 9 * s);
  g.fillStyle(0xb8d8e0, 0.16 * alpha);
  g.fillEllipse(-2 * s, 2 * s, 12 * s, 7 * s);

  const topProfile = [
    { x: -13, y: -6.5 },
    { x: -4, y: -12 },
    { x: 8, y: -13 },
    { x: 17, y: -9.5 },
    { x: 22, y: -4.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -11.8 * s, 9 * s, -10.5 * s, 2.5 * s, -18.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-4 * s, -11.8 * s, 9 * s, -10.5 * s, 2.5 * s, -18.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, -8.5 * s);
  g.lineTo(-7 * s, 8.5 * s);
  g.strokePath();

  // The oversized, dark eye - the real Pearl Perch's own defining field
  // mark, given a genuinely different (deep, round-bodied) frame than
  // the Bigeye Tuna's own large-eye treatment.
  g.fillStyle(0xf0f0f4, alpha);
  g.fillCircle(-10 * s, -2.5 * s, 3.6 * s);
  g.fillStyle(0x0c0e14, alpha);
  g.fillCircle(-9.6 * s, -2.5 * s, 2.2 * s);
  g.fillStyle(0xffffff, 0.5 * alpha);
  g.fillCircle(-10.4 * s, -3.3 * s, 0.7 * s);

  g.restore();
}

// A pink snapper - a real Australasian snapper, with the two genuine
// field marks that ID it: scattered small electric-blue spots across the
// back and upper flank, and a pronounced bony hump rising above the eye
// on the forehead - built right into the body's own outline as a real
// cranial bump, not a fin or a marking, and unique among every fish
// drawn here.
export function drawPinkSnapper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe4a8a8;
  const backColor = 0xc06868;
  const bellyColor = 0xf4dcd8;
  const finColor = 0xcc7c7c;
  const darkColor = 0x5c2020;
  const spotColor = 0x3888c8;

  // The pronounced cranial hump above the eye - a genuine bony bump
  // built into the head's own outline, unique among the snappers here.
  const body = [
    { x: -19, y: -1.5 },
    { x: -17, y: -6.5 },
    { x: -12, y: -10.5 },
    { x: -13, y: -6 },
    { x: -4, y: -11.5 },
    { x: 8, y: -11.5 },
    { x: 18, y: -7.5 },
    { x: 24, y: -3.4 },
    { x: 24, y: 3.4 },
    { x: 18, y: 7.5 },
    { x: 8, y: 11.5 },
    { x: -4, y: 11.5 },
    { x: -14, y: 8 },
    { x: -19, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -4 * s, 33 * s, -9.5 * s, 27 * s, 0);
  g.fillTriangle(24 * s, 4 * s, 33 * s, 9.5 * s, 27 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(24 * s, -4 * s, 33 * s, -9.5 * s, 27 * s, 0);
  g.strokeTriangle(24 * s, 4 * s, 33 * s, 9.5 * s, 27 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6 * s, -13 * s, 14 * s, -2 * s, 9 * s);
  g.fillTriangle(2 * s, 10.5 * s, -1.5 * s, 17 * s, 7 * s, 11.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -12, y: -10.5 },
    { x: -4, y: -11.5 },
    { x: 8, y: -11.5 },
    { x: 18, y: -7.5 },
    { x: 24, y: -3.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.6 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // Scattered small electric-blue spots - the real Pink Snapper's own
  // second field mark.
  g.fillStyle(spotColor, 0.85 * alpha);
  [
    [-8, -7, 1],
    [-1, -8.5, 0.9],
    [6, -8, 1],
    [12, -6, 0.9],
    [-4, -3, 0.85],
    [3, -2, 0.9],
    [10, -1, 0.85],
    [16, -3.5, 0.8]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -11.3 * s, 9 * s, -10.5 * s, 3 * s, -18 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-3 * s, -11.3 * s, 9 * s, -10.5 * s, 3 * s, -18 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -7.5 * s);
  g.lineTo(-8 * s, 7.5 * s);
  g.strokePath();

  g.fillStyle(0xf4e4dc, alpha);
  g.fillCircle(-12 * s, -3 * s, 2.3 * s);
  g.fillStyle(0x1c0c08, alpha);
  g.fillCircle(-11.6 * s, -3 * s, 1.3 * s);

  g.restore();
}

// A red snapper - built around plain, vivid, deep-red coloring as its
// own real hero field mark (no spots, no bars, no hump - just solid red
// fading to a pale belly), paired with a genuinely oversized red eye and
// a steep, sloped, triangular head profile.
export function drawRedSnapper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc02c28;
  const backColor = 0x881c18;
  const bellyColor = 0xf0d0c8;
  const finColor = 0xa42420;
  const darkColor = 0x481008;

  const body = [
    { x: -20, y: 1 },
    { x: -18, y: -6 },
    { x: -10, y: -11.5 },
    { x: 1, y: -12.5 },
    { x: 12, y: -9.5 },
    { x: 19, y: -5 },
    { x: 23, y: -1.4 },
    { x: 23, y: 1.4 },
    { x: 19, y: 5 },
    { x: 12, y: 9.5 },
    { x: 1, y: 12.5 },
    { x: -10, y: 11.5 },
    { x: -17, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.6 * s, 32 * s, -9 * s, 26.5 * s, 0);
  g.fillTriangle(23 * s, 3.6 * s, 32 * s, 9 * s, 26.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -3.6 * s, 32 * s, -9 * s, 26.5 * s, 0);
  g.strokeTriangle(23 * s, 3.6 * s, 32 * s, 9 * s, 26.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6.5 * s, -13 * s, 15 * s, -2 * s, 9.5 * s);
  g.fillTriangle(2 * s, 11.5 * s, -1.5 * s, 18 * s, 7 * s, 12.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -18, y: -6 },
    { x: -10, y: -11.5 },
    { x: 1, y: -12.5 },
    { x: 12, y: -9.5 },
    { x: 19, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.5 * alpha);
  g.fillPoints(backBand, true);

  const bellyProfile = [
    { x: -10, y: 11.5 },
    { x: 1, y: 12.5 },
    { x: 12, y: 9.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const bellyBand = bellyProfile.concat(
    bellyProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y - 4 * s }))
  );
  g.fillStyle(bellyColor, 0.35 * alpha);
  g.fillPoints(bellyBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -11.8 * s, 10 * s, -10 * s, 2 * s, -19 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-8 * s, -11.8 * s, 10 * s, -10 * s, 2 * s, -19 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -8 * s);
  g.lineTo(-9 * s, 8 * s);
  g.strokePath();

  // The genuinely oversized red eye - a real Red Snapper trait.
  g.fillStyle(0xe89890, alpha);
  g.fillCircle(-13 * s, -3.4 * s, 3.4 * s);
  g.fillStyle(0x300804, alpha);
  g.fillCircle(-12.6 * s, -3.4 * s, 2 * s);

  g.restore();
}

// A mangrove snapper - a real, distinct species from the Mangrove Jack
// drawn elsewhere in the game (they only share a common name), built
// with genuinely different coloring - muted grey-olive to reddish-brown,
// not the Jack's vivid reddish-orange - and its own real field mark: a
// dark diagonal stripe running straight through the eye, plus a visible
// canine tooth at the front of a slightly parted jaw.
export function drawMangroveSnapper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x8c8064;
  const backColor = 0x544c38;
  const bellyColor = 0xd4c8a8;
  const finColor = 0x685e46;
  const darkColor = 0x2c2618;
  const stripeColor = 0x1c1810;
  const toothColor = 0xf0ece0;

  const body = [
    { x: -20, y: 1.4 },
    { x: -18, y: -5.5 },
    { x: -10, y: -10.5 },
    { x: 1, y: -12 },
    { x: 12, y: -9 },
    { x: 19, y: -4.6 },
    { x: 23, y: -1.4 },
    { x: 23, y: 1.4 },
    { x: 19, y: 4.6 },
    { x: 12, y: 9 },
    { x: 1, y: 12 },
    { x: -10, y: 10.5 },
    { x: -17, y: 5.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.6 * s, 32 * s, -9 * s, 26.5 * s, 0);
  g.fillTriangle(23 * s, 3.6 * s, 32 * s, 9 * s, 26.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -3.6 * s, 32 * s, -9 * s, 26.5 * s, 0);
  g.strokeTriangle(23 * s, 3.6 * s, 32 * s, 9 * s, 26.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6 * s, -13 * s, 14.5 * s, -2 * s, 9 * s);
  g.fillTriangle(2 * s, 11 * s, -1.5 * s, 17.5 * s, 7 * s, 12 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -18, y: -5.5 },
    { x: -10, y: -10.5 },
    { x: 1, y: -12 },
    { x: 12, y: -9 },
    { x: 19, y: -4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -11.3 * s, 10 * s, -9.5 * s, 2 * s, -18 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-8 * s, -11.3 * s, 10 * s, -9.5 * s, 2 * s, -18 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -7.5 * s);
  g.lineTo(-9 * s, 7.5 * s);
  g.strokePath();

  // The dark diagonal stripe running straight through the eye - the
  // real Mangrove Snapper's own field mark, absent on the Mangrove Jack.
  g.lineStyle(2.4 * s, stripeColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-18 * s, -6 * s);
  g.lineTo(-10 * s, 3 * s);
  g.strokePath();

  // A visible canine tooth at the front of a slightly parted jaw.
  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-19.5 * s, 2 * s);
  g.lineTo(-13 * s, 6 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  g.fillTriangle(-18 * s, 2.6 * s, -16 * s, 3.6 * s, -17 * s, 6.8 * s);

  g.fillStyle(0xe4d8bc, alpha);
  g.fillCircle(-13 * s, -3 * s, 2.3 * s);
  g.fillStyle(0x1c1408, alpha);
  g.fillCircle(-12.6 * s, -3 * s, 1.3 * s);

  g.restore();
}

// A vermilion snapper - a slender, bright red-orange reef snapper with a
// real, genuinely unusual field mark for the family: weak, barely-there
// canine teeth (most snappers here show prominent fangs), so its small
// mouth is drawn plain and closed. Its own real diagnostic pattern is a
// set of faint yellow diagonal streaks/mottling below the lateral line -
// a different placement and orientation from any other snapper's
// markings here - plus a vivid red eye.
export function drawVermilionSnapper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe8583c;
  const backColor = 0xb82c1c;
  const bellyColor = 0xf4a888;
  const finColor = 0xd8482c;
  const darkColor = 0x681c0c;
  const streakColor = 0xf0c848;

  const body = [
    { x: -18, y: 1 },
    { x: -16, y: -5 },
    { x: -8, y: -9.5 },
    { x: 2, y: -10.5 },
    { x: 12, y: -8 },
    { x: 19, y: -4 },
    { x: 23, y: 0 },
    { x: 19, y: 4 },
    { x: 12, y: 8 },
    { x: 2, y: 10.5 },
    { x: -8, y: 9.5 },
    { x: -15, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.4 * s, 31 * s, -8 * s, 26 * s, 0);
  g.fillTriangle(23 * s, 3.4 * s, 31 * s, 8 * s, 26 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -3.4 * s, 31 * s, -8 * s, 26 * s, 0);
  g.strokeTriangle(23 * s, 3.4 * s, 31 * s, 8 * s, 26 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 5 * s, -11.5 * s, 12.5 * s, -1.5 * s, 7.5 * s);
  g.fillTriangle(1.5 * s, 9.5 * s, -1.5 * s, 14.5 * s, 5.5 * s, 10.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -16, y: -5 },
    { x: -8, y: -9.5 },
    { x: 2, y: -10.5 },
    { x: 12, y: -8 },
    { x: 19, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  // Faint yellow diagonal streaks/mottling below the lateral line - the
  // real Vermilion Snapper's own diagnostic pattern.
  g.lineStyle(1.3 * s, streakColor, 0.55 * alpha);
  [
    [-9, 2, -3, 6],
    [-2, 3, 4, 7],
    [5, 2, 11, 5.5],
    [12, 1, 17, 3.5]
  ].forEach(([x1, y1, x2, y2]) => {
    g.beginPath();
    g.moveTo(x1 * s, y1 * s);
    g.lineTo(x2 * s, y2 * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -10.3 * s, 9 * s, -8.8 * s, 3 * s, -16.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-3 * s, -10.3 * s, 9 * s, -8.8 * s, 3 * s, -16.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, -6.8 * s);
  g.lineTo(-7 * s, 6.8 * s);
  g.strokePath();

  // A small, plain, closed mouth - weak canines, unlike the prominent
  // fangs most other snappers here carry.
  g.fillStyle(0xf0a08c, alpha);
  g.fillCircle(-11 * s, -2.8 * s, 2.1 * s);
  g.fillStyle(0x300804, alpha);
  g.fillCircle(-10.6 * s, -2.8 * s, 1.2 * s);

  g.restore();
}

// A silk snapper - a pinkish-red reef snapper, told apart by two real
// field marks: a bright YELLOW eye (unlike the red-eyed Red Snapper or
// dark-eyed Mangrove Snapper elsewhere in the game), and yellow-tinged
// fin edges, all laid over a soft, silvery-pink gradient body giving it
// the smooth "silk" sheen it's named for.
export function drawSilkSnapper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe89ca0;
  const backColor = 0xb8586c;
  const bellyColor = 0xf4d4d0;
  const finColor = 0xd4808c;
  const darkColor = 0x64222c;
  const sheenColor = 0xd8e0ec;
  const yellowColor = 0xe8c848;

  const body = [
    { x: -19, y: 1 },
    { x: -17, y: -5.5 },
    { x: -9, y: -10 },
    { x: 2, y: -11 },
    { x: 13, y: -8.5 },
    { x: 20, y: -4.4 },
    { x: 24, y: 0 },
    { x: 20, y: 4.4 },
    { x: 13, y: 8.5 },
    { x: 2, y: 11 },
    { x: -9, y: 10 },
    { x: -16, y: 5.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -3.6 * s, 32.5 * s, -8.5 * s, 27 * s, 0);
  g.fillTriangle(24 * s, 3.6 * s, 32.5 * s, 8.5 * s, 27 * s, 0);
  // Yellow-tinged fin edges - a real Silk Snapper field mark.
  g.lineStyle(1.2 * s, yellowColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(24 * s, -3.6 * s);
  g.lineTo(32.5 * s, -8.5 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(24 * s, 3.6 * s);
  g.lineTo(32.5 * s, 8.5 * s);
  g.strokePath();
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(24 * s, -3.6 * s, 32.5 * s, -8.5 * s, 27 * s, 0);
  g.strokeTriangle(24 * s, 3.6 * s, 32.5 * s, 8.5 * s, 27 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 5.5 * s, -12.5 * s, 13 * s, -2 * s, 8 * s);
  g.fillTriangle(1.5 * s, 10 * s, -1.5 * s, 15.5 * s, 6 * s, 11 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // The soft, silvery-pink "silk" sheen laid over the body.
  g.fillStyle(sheenColor, 0.22 * alpha);
  g.fillEllipse(2 * s, -1 * s, 17 * s, 9 * s);

  const topProfile = [
    { x: -17, y: -5.5 },
    { x: -9, y: -10 },
    { x: 2, y: -11 },
    { x: 13, y: -8.5 },
    { x: 20, y: -4.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -10.8 * s, 9 * s, -9.3 * s, 3 * s, -17.5 * s);
  g.lineStyle(1.2 * s, yellowColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(9 * s, -9.3 * s);
  g.lineTo(3 * s, -17.5 * s);
  g.strokePath();
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-4 * s, -10.8 * s, 9 * s, -9.3 * s, 3 * s, -17.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -7.3 * s);
  g.lineTo(-8 * s, 7.3 * s);
  g.strokePath();

  // The bright yellow eye - the real Silk Snapper's own key field mark.
  g.fillStyle(yellowColor, alpha);
  g.fillCircle(-12 * s, -3 * s, 2.3 * s);
  g.fillStyle(0x1c1404, alpha);
  g.fillCircle(-11.6 * s, -3 * s, 1.3 * s);

  g.restore();
}

// A queenfish - a slender, laterally-compressed silver predator, built
// with two real, genuinely different-from-anything-else-here features: a
// row of bold black spots strung along the lateral line, and small
// detached finlets trailing behind both the dorsal and anal fins - tiny
// separate triangular sails, not part of the main fin blades, unique to
// this species among everything drawn so far. A deeply forked tail and
// an underslung lower jaw complete a real Queenfish's profile.
export function drawQueenfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4ccd0;
  const backColor = 0x4c6068;
  const bellyColor = 0xf0f4f2;
  const finColor = 0x586c74;
  const darkColor = 0x202c30;
  const spotColor = 0x141c1e;

  const body = [
    { x: -26, y: 0.5 },
    { x: -23, y: -4.5 },
    { x: -13, y: -8 },
    { x: 0, y: -8.8 },
    { x: 13, y: -6.8 },
    { x: 22, y: -3.6 },
    { x: 27, y: -1.4 },
    { x: 27, y: 1.4 },
    { x: 22, y: 3.6 },
    { x: 13, y: 6.8 },
    { x: 0, y: 8.8 },
    { x: -13, y: 8 },
    { x: -22, y: 4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Deeply forked tail.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -2.6 * s, 38 * s, -12 * s, 31 * s, 0);
  g.fillTriangle(27 * s, 2.6 * s, 38 * s, 12 * s, 31 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -2.6 * s, 38 * s, -12 * s, 31 * s, 0);
  g.strokeTriangle(27 * s, 2.6 * s, 38 * s, 12 * s, 31 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 4 * s, -14 * s, 12.5 * s, -3 * s, 6.5 * s);
  g.fillTriangle(2 * s, 8.5 * s, -1 * s, 14.5 * s, 7 * s, 9.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -23, y: -4.5 },
    { x: -13, y: -8 },
    { x: 0, y: -8.8 },
    { x: 13, y: -6.8 },
    { x: 22, y: -3.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.4 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // The row of bold black spots strung along the lateral line - a real
  // Queenfish field mark, unlike anything else drawn so far.
  g.fillStyle(spotColor, 0.75 * alpha);
  [-16, -8, 0, 8, 16].forEach((sx) => g.fillCircle(sx * s, 1.5 * s, 1.6 * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -8.7 * s, 7 * s, -7.5 * s, 1 * s, -14.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-5 * s, -8.7 * s, 7 * s, -7.5 * s, 1 * s, -14.5 * s);

  // The small, detached finlets trailing behind the main dorsal and anal
  // fins - separate triangular sails, unique to this species here.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(9 * s, -7 * s, 12 * s, -6.4 * s, 10.3 * s, -10.5 * s);
  g.fillTriangle(14 * s, -5.6 * s, 17 * s, -5 * s, 15.3 * s, -8.8 * s);
  g.fillTriangle(9 * s, 7 * s, 12 * s, 6.4 * s, 10.3 * s, 10.5 * s);
  g.fillTriangle(14 * s, 5.6 * s, 17 * s, 5 * s, 15.3 * s, 8.8 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-12 * s, -6 * s);
  g.lineTo(-11 * s, 6 * s);
  g.strokePath();

  // The underslung lower jaw - a real Queenfish profile trait.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-25.5 * s, 1.5 * s);
  g.lineTo(-18 * s, 4.5 * s);
  g.strokePath();

  g.fillStyle(0xf0f2f0, alpha);
  g.fillCircle(-18 * s, -2 * s, 2.2 * s);
  g.fillStyle(0x0c1010, alpha);
  g.fillCircle(-17.6 * s, -2 * s, 1.2 * s);

  g.restore();
}

// A red emperor - a big, robust reef snapper, told apart from every
// other reddish fish here by a real, bold, unmistakable field mark: dark
// reddish-brown diagonal bands crossing a pink-red body - one through
// the eye, one behind the head, one along the mid-flank - the single
// boldest, most patterned reddish fish in the game, unlike the plain or
// spotted reds elsewhere.
export function drawRedEmperor(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xec8c78;
  const backColor = 0xd05840;
  const bellyColor = 0xf8d0c0;
  const finColor = 0xd86c50;
  const darkColor = 0x682414;
  const bandColor = 0x9c3820;

  const body = [
    { x: -21, y: 1.4 },
    { x: -19, y: -6 },
    { x: -10, y: -11.5 },
    { x: 2, y: -13 },
    { x: 14, y: -10 },
    { x: 21, y: -5 },
    { x: 25, y: -1.6 },
    { x: 25, y: 1.6 },
    { x: 21, y: 5 },
    { x: 14, y: 10 },
    { x: 2, y: 13 },
    { x: -10, y: 11.5 },
    { x: -18, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -4 * s, 34 * s, -9.5 * s, 28 * s, 0);
  g.fillTriangle(25 * s, 4 * s, 34 * s, 9.5 * s, 28 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(25 * s, -4 * s, 34 * s, -9.5 * s, 28 * s, 0);
  g.strokeTriangle(25 * s, 4 * s, 34 * s, 9.5 * s, 28 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 6.5 * s, -14 * s, 15 * s, -3 * s, 10 * s);
  g.fillTriangle(2 * s, 11.5 * s, -1.5 * s, 18.5 * s, 7 * s, 12.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -19, y: -6 },
    { x: -10, y: -11.5 },
    { x: 2, y: -13 },
    { x: 14, y: -10 },
    { x: 21, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // The bold, dark reddish-brown diagonal bands - one through the eye,
  // one behind the head, one at mid-flank - the real Red Emperor's own
  // unmistakable field mark.
  g.lineStyle(3.2 * s, bandColor, 0.55 * alpha);
  [
    [-18, -8, -12, 8],
    [-10, -11, -4, 11],
    [2, -12, 8, 12]
  ].forEach(([x1, y1, x2, y2]) => {
    g.beginPath();
    g.moveTo(x1 * s, y1 * s);
    g.lineTo(x2 * s, y2 * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, -12.8 * s, 11 * s, -10.8 * s, 2 * s, -20.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-9 * s, -12.8 * s, 11 * s, -10.8 * s, 2 * s, -20.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-11 * s, -8.5 * s);
  g.lineTo(-10 * s, 8.5 * s);
  g.strokePath();

  g.fillStyle(0xf8e0d4, alpha);
  g.fillCircle(-14 * s, -3.4 * s, 2.6 * s);
  g.fillStyle(0x200c04, alpha);
  g.fillCircle(-13.6 * s, -3.4 * s, 1.5 * s);

  g.restore();
}

// A crimson snapper - a deep, saturated crimson-red reef fish with
// vividly matching crimson fins throughout (unlike the darker, more
// muted fins of the Red Snapper elsewhere in the game), and its own real
// field mark: a dark reddish-brown saddle blotch on the back beneath the
// soft dorsal fin - positioned differently from the Moses Perch's tail-
// base blotch or the Fingermark's mid-flank "thumbprint".
export function drawCrimsonSnapper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd41c28;
  const backColor = 0x981018;
  const bellyColor = 0xf0b8b8;
  const finColor = 0xc81420;
  const darkColor = 0x4c0408;
  const saddleColor = 0x5c1410;

  const body = [
    { x: -19, y: 1.2 },
    { x: -17, y: -5.5 },
    { x: -9, y: -10.5 },
    { x: 1, y: -11.8 },
    { x: 12, y: -9 },
    { x: 19, y: -4.6 },
    { x: 23, y: -1.4 },
    { x: 23, y: 1.4 },
    { x: 19, y: 4.6 },
    { x: 12, y: 9 },
    { x: 1, y: 11.8 },
    { x: -9, y: 10.5 },
    { x: -16, y: 5.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.6 * s, 31.5 * s, -8.5 * s, 26 * s, 0);
  g.fillTriangle(23 * s, 3.6 * s, 31.5 * s, 8.5 * s, 26 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -3.6 * s, 31.5 * s, -8.5 * s, 26 * s, 0);
  g.strokeTriangle(23 * s, 3.6 * s, 31.5 * s, 8.5 * s, 26 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6 * s, -13 * s, 14 * s, -2 * s, 9 * s);
  g.fillTriangle(2 * s, 11 * s, -1.5 * s, 17.5 * s, 7 * s, 12 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -17, y: -5.5 },
    { x: -9, y: -10.5 },
    { x: 1, y: -11.8 },
    { x: 12, y: -9 },
    { x: 19, y: -4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // The dark saddle blotch on the back beneath the soft dorsal - the
  // real Crimson Snapper's own field mark.
  g.fillStyle(saddleColor, 0.6 * alpha);
  g.fillEllipse(8 * s, -7 * s, 5 * s, 3.6 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, -11.1 * s, 10 * s, -9.4 * s, 2 * s, -18 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-7 * s, -11.1 * s, 10 * s, -9.4 * s, 2 * s, -18 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -7.5 * s);
  g.lineTo(-8 * s, 7.5 * s);
  g.strokePath();

  g.fillStyle(0xf0a8a8, alpha);
  g.fillCircle(-12 * s, -3 * s, 2.3 * s);
  g.fillStyle(0x280404, alpha);
  g.fillCircle(-11.6 * s, -3 * s, 1.3 * s);

  g.restore();
}

// A fingermark - a golden-bronze reef snapper, named for its own real
// field mark: a distinctive round black "thumbprint" blotch sitting
// mid-flank, just above the lateral line - a different shape and
// location from the Moses Perch's tail-base saddle or the Crimson
// Snapper's back saddle - paired with faint rows of small gold spots
// along the upper body.
export function drawFingermark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc89858;
  const backColor = 0x8c6428;
  const bellyColor = 0xecd8ac;
  const finColor = 0xac7c3c;
  const darkColor = 0x442c10;
  const spotColor = 0xf0c868;
  const markColor = 0x201408;

  const body = [
    { x: -20, y: 1.2 },
    { x: -18, y: -6 },
    { x: -9, y: -11 },
    { x: 2, y: -12.5 },
    { x: 13, y: -9.5 },
    { x: 20, y: -5 },
    { x: 24, y: -1.6 },
    { x: 24, y: 1.6 },
    { x: 20, y: 5 },
    { x: 13, y: 9.5 },
    { x: 2, y: 12.5 },
    { x: -9, y: 11 },
    { x: -17, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -3.8 * s, 33 * s, -9 * s, 27 * s, 0);
  g.fillTriangle(24 * s, 3.8 * s, 33 * s, 9 * s, 27 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(24 * s, -3.8 * s, 33 * s, -9 * s, 27 * s, 0);
  g.strokeTriangle(24 * s, 3.8 * s, 33 * s, 9 * s, 27 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6.2 * s, -13 * s, 14.5 * s, -2 * s, 9.5 * s);
  g.fillTriangle(2 * s, 11 * s, -1.5 * s, 18 * s, 7 * s, 12 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -18, y: -6 },
    { x: -9, y: -11 },
    { x: 2, y: -12.5 },
    { x: 13, y: -9.5 },
    { x: 20, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // Faint rows of small gold spots along the upper body.
  g.fillStyle(spotColor, 0.5 * alpha);
  [
    [-11, -5, 0.9],
    [-3, -6.5, 0.9],
    [5, -5.5, 0.9],
    [12, -3.5, 0.85],
    [-6, 0, 0.8],
    [2, 1, 0.85],
    [9, 1.5, 0.8]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  // The distinctive round black "thumbprint" blotch mid-flank, just
  // above the lateral line - the real Fingermark's own namesake field
  // mark.
  g.fillStyle(markColor, 0.85 * alpha);
  g.fillCircle(9 * s, -1.5 * s, 3.4 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, -11.8 * s, 11 * s, -10 * s, 2 * s, -19.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-7 * s, -11.8 * s, 11 * s, -10 * s, 2 * s, -19.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -8 * s);
  g.lineTo(-9 * s, 8 * s);
  g.strokePath();

  g.fillStyle(0xecd8b0, alpha);
  g.fillCircle(-13 * s, -3.2 * s, 2.4 * s);
  g.fillStyle(0x180c04, alpha);
  g.fillCircle(-12.6 * s, -3.2 * s, 1.35 * s);

  g.restore();
}

// A nannygai - not a snapper at all, a deepwater berycid relative built
// on a genuinely different body plan from anything else here: short,
// deep, and rounded (no elongated snapper taper), bright red-pink with a
// silvery-blue sheen, a real spiny first dorsal, and the family's own
// hallmark feature given full emphasis - enormous round eyes that
// dominate the head, adapted for hunting in dim deep water.
export function drawNannygai(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe86870;
  const backColor = 0xc03848;
  const bellyColor = 0xf4c0c0;
  const finColor = 0xd8505c;
  const darkColor = 0x581018;
  const sheenColor = 0x9cc8e0;

  const body = [
    { x: -13, y: 1.5 },
    { x: -11, y: -6.5 },
    { x: -2, y: -12 },
    { x: 9, y: -12.5 },
    { x: 17, y: -8.5 },
    { x: 21, y: -3.8 },
    { x: 21, y: 3.8 },
    { x: 17, y: 8.5 },
    { x: 9, y: 12.5 },
    { x: -2, y: 12 },
    { x: -11, y: 6.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(21 * s, -3.8 * s, 29 * s, -9 * s, 24.5 * s, 0);
  g.fillTriangle(21 * s, 3.8 * s, 29 * s, 9 * s, 24.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(21 * s, -3.8 * s, 29 * s, -9 * s, 24.5 * s, 0);
  g.strokeTriangle(21 * s, 3.8 * s, 29 * s, 9 * s, 24.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 7 * s, -10 * s, 15.5 * s, 0.5 * s, 10.5 * s);
  g.fillTriangle(4 * s, 12 * s, 0.5 * s, 19 * s, 9 * s, 13 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Silvery-blue sheen across the flank.
  g.fillStyle(sheenColor, 0.2 * alpha);
  g.fillEllipse(0, -1 * s, 13 * s, 8 * s);

  const topProfile = [
    { x: -11, y: -6.5 },
    { x: -2, y: -12 },
    { x: 9, y: -12.5 },
    { x: 17, y: -8.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // The real, spiny first dorsal fin.
  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 6; i += 1) {
    const fx = -5 + i * 2.6;
    g.fillTriangle(fx * s, -11.8 * s, (fx + 1.7) * s, -11.8 * s, (fx + 0.85) * s, -18.5 * s);
  }
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-5 * s, -11.8 * s);
  g.lineTo(11 * s, -11.8 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-6 * s, -9 * s);
  g.lineTo(-5 * s, 9 * s);
  g.strokePath();

  // The family's hallmark feature - enormous round eyes dominating the
  // head, a real deepwater adaptation.
  g.fillStyle(0xf8f0ec, alpha);
  g.fillCircle(-6 * s, -4 * s, 4.4 * s);
  g.fillStyle(0x180408, alpha);
  g.fillCircle(-5.5 * s, -4 * s, 2.8 * s);
  g.fillStyle(0xffffff, 0.55 * alpha);
  g.fillCircle(-6.4 * s, -5 * s, 0.9 * s);

  g.restore();
}

// A sailfish - the fastest fish in the ocean, and the flagship model of
// this batch: the leanest, most needle-slender body of any billfish
// here, a whisper-thin rapier bill, a deeply raked, high-aspect forked
// tail built for speed, and - its single most spectacular real feature -
// an enormous sail-like first dorsal fin that runs almost the entire
// length of the back and stands genuinely TALLER than the body itself,
// well beyond even the Striped Marlin's own tall sail. Electric cobalt-
// blue over silver, with rows of pale blue polka-dot spots (not stripes
// - a deliberately different pattern from every marlin here) marching
// down the sail and flank, plus a scatter of short motion-streak lines
// trailing the tail to sell the sheer speed.
export function drawSailfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x1c78b8;
  const backColor = 0x0e4470;
  const bellyColor = 0xe4eef4;
  const finColor = 0x0e3c60;
  const darkColor = 0x061c30;
  const spotColor = 0x8cd4ec;
  const sailColor = 0x123c5c;

  const bill = [
    { x: -33, y: -1.1 },
    { x: -33, y: 1.1 },
    { x: -15, y: 0.4 },
    { x: -15, y: -0.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const body = [
    { x: -15, y: -2.2 },
    { x: -7, y: -4.6 },
    { x: 3, y: -5.8 },
    { x: 13, y: -5.2 },
    { x: 21, y: -3.4 },
    { x: 26, y: -1.5 },
    { x: 26, y: 1.5 },
    { x: 21, y: 3.4 },
    { x: 13, y: 5.2 },
    { x: 3, y: 5.8 },
    { x: -7, y: 4.6 },
    { x: -15, y: 2.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The deeply raked, high-aspect forked tail - built for speed, the
  // sharpest, most swept-back fork of any fish here.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -1.8 * s, 40 * s, -13 * s, 30 * s, -0.5 * s);
  g.fillTriangle(26 * s, 1.8 * s, 40 * s, 13 * s, 30 * s, 0.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -1.8 * s, 40 * s, -13 * s, 30 * s, -0.5 * s);
  g.strokeTriangle(26 * s, 1.8 * s, 40 * s, 13 * s, 30 * s, 0.5 * s);

  // Short motion-streak lines trailing off the tail to sell real speed.
  g.lineStyle(1 * s, 0xbcdcec, 0.4 * alpha);
  [-6, -2, 2, 6].forEach((oy) => {
    g.beginPath();
    g.moveTo(41 * s, oy * s);
    g.lineTo(48 * s, oy * 1.3 * s);
    g.strokePath();
  });

  // A long, swept sickle pectoral, folded close to the body.
  {
    const angle = 1.2;
    const len = 12;
    const bow = 3;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 8;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (-2 + dx * len * tt + px * curve) * s;
      const cy = (2.5 + dy * len * tt + py * curve) * s;
      const w = (2.2 - tt * 2) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(3 * s, 5.5 * s, 1 * s, 10 * s, 7 * s, 6.2 * s);

  g.fillStyle(darkColor, 0.9 * alpha);
  g.fillPoints(bill, true);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -7, y: -4.6 },
    { x: 3, y: -5.8 },
    { x: 13, y: -5.2 },
    { x: 21, y: -3.4 },
    { x: 26, y: -1.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // Rows of pale-blue polka-dot spots down the flank - deliberately a
  // dot pattern, not stripes, to read as visually distinct from every
  // striped or barred marlin here.
  g.fillStyle(spotColor, 0.6 * alpha);
  [
    [-9, -2, 0.7],
    [-3, -3, 0.7],
    [3, -3.2, 0.7],
    [9, -2.6, 0.65],
    [15, -1.8, 0.6],
    [-9, 1.5, 0.65],
    [-3, 2, 0.65],
    [3, 2.2, 0.65],
    [9, 1.6, 0.6]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  // The single most spectacular real feature: an enormous sail-like
  // first dorsal running almost the entire length of the back, standing
  // genuinely taller than the body itself - even more dramatic than the
  // Striped Marlin's own tall sail.
  g.fillStyle(sailColor, 0.94 * alpha);
  g.fillPoints(
    [
      { x: -9, y: -4 },
      { x: -7, y: -30 },
      { x: -1, y: -34 },
      { x: 7, y: -32 },
      { x: 14, y: -26 },
      { x: 20, y: -18 },
      { x: 23, y: -8 },
      { x: 21, y: -3.4 },
      { x: 13, y: -5.2 },
      { x: 3, y: -5.8 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1.1 * s, darkColor, 0.7 * alpha);
  g.strokePoints(
    [
      { x: -9, y: -4 },
      { x: -7, y: -30 },
      { x: -1, y: -34 },
      { x: 7, y: -32 },
      { x: 14, y: -26 },
      { x: 20, y: -18 },
      { x: 23, y: -8 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    false
  );
  // Polka-dot spots marching down the sail itself.
  g.fillStyle(spotColor, 0.55 * alpha);
  [
    [-4, -9, 0.9],
    [0, -14, 0.9],
    [4, -19, 0.85],
    [9, -22, 0.8],
    [14, -21, 0.75],
    [17, -16, 0.7]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-1 * s, -3.3 * s);
  g.lineTo(0.5 * s, 3.3 * s);
  g.strokePath();

  g.fillStyle(0xe0eef0, alpha);
  g.fillCircle(-11 * s, -0.8 * s, 1.5 * s);
  g.fillStyle(0x060c10, alpha);
  g.fillCircle(-10.7 * s, -0.8 * s, 0.85 * s);

  g.restore();
}

// A samsonfish - a real Seriola relative of the Kingfish and Amberjack
// here, but built genuinely bulkier and blunter than either: a deeper,
// stockier body, a rounded, blunt snout rather than any kind of sharp
// point, dull bronze-olive coloring (neither the Kingfish's silver-blue
// nor the Amberjack's golden tones), and the real animal's own field
// mark - a scatter of faint dark blotches across the upper flank, unlike
// the plain sides of either relative.
export function drawSamsonfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x8c8258;
  const backColor = 0x504a30;
  const bellyColor = 0xc4bc94;
  const finColor = 0x686038;
  const darkColor = 0x2c2814;
  const blotchColor = 0x3c3620;

  const body = [
    { x: -23, y: 1.4 },
    { x: -20, y: -6.5 },
    { x: -10, y: -12 },
    { x: 2, y: -13.5 },
    { x: 14, y: -10.5 },
    { x: 22, y: -5.5 },
    { x: 27, y: -1.6 },
    { x: 27, y: 1.6 },
    { x: 22, y: 5.5 },
    { x: 14, y: 10.5 },
    { x: 2, y: 13.5 },
    { x: -10, y: 12 },
    { x: -19, y: 6.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -4 * s, 36 * s, -9.5 * s, 30.5 * s, 0);
  g.fillTriangle(27 * s, 4 * s, 36 * s, 9.5 * s, 30.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -4 * s, 36 * s, -9.5 * s, 30.5 * s, 0);
  g.strokeTriangle(27 * s, 4 * s, 36 * s, 9.5 * s, 30.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 7 * s, -14 * s, 16 * s, -3 * s, 10.5 * s);
  g.fillTriangle(3 * s, 12 * s, -0.5 * s, 19.5 * s, 8 * s, 13 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -20, y: -6.5 },
    { x: -10, y: -12 },
    { x: 2, y: -13.5 },
    { x: 14, y: -10.5 },
    { x: 22, y: -5.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  // The scatter of faint dark blotches across the upper flank - the real
  // Samsonfish's own field mark, unlike the plain sides of the Kingfish
  // or Amberjack.
  g.fillStyle(blotchColor, 0.4 * alpha);
  [
    [-9, -6, 2.6],
    [0, -8, 2.4],
    [9, -6.5, 2.4],
    [16, -4, 2.1]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.8 * s, br * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -12.6 * s, 12 * s, -10.5 * s, 3 * s, -20.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, -12.6 * s, 12 * s, -10.5 * s, 3 * s, -20.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-11 * s, -8.5 * s);
  g.lineTo(-10 * s, 8.5 * s);
  g.strokePath();

  // A blunt, rounded snout - notably more rounded than the Kingfish's
  // sharper point.
  g.fillStyle(0xd0c8a0, alpha);
  g.fillCircle(-14 * s, -3.6 * s, 2.6 * s);
  g.fillStyle(0x14120a, alpha);
  g.fillCircle(-13.6 * s, -3.6 * s, 1.4 * s);

  g.restore();
}

// A sand whiting - a slender, elongated whiting with pale sandy-olive
// countershading over a silvery belly (real camouflage for a sand-
// dwelling fish), a distinctly pointed conical snout, and the real
// animal's own field mark: a small blackish blotch at the front of the
// first dorsal fin, unlike any other whiting drawn here.
export function drawSandWhiting(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd4c496;
  const backColor = 0xa89460;
  const bellyColor = 0xf0ead8;
  const finColor = 0xc0ae7c;
  const darkColor = 0x54462a;
  const blotchColor = 0x282010;

  const body = [
    { x: -20, y: 0.6 },
    { x: -18, y: -3.6 },
    { x: -10, y: -6.2 },
    { x: 1, y: -6.8 },
    { x: 12, y: -5.2 },
    { x: 19, y: -2.6 },
    { x: 22, y: 0 },
    { x: 19, y: 2.6 },
    { x: 12, y: 5.2 },
    { x: 1, y: 6.8 },
    { x: -10, y: 6.2 },
    { x: -17, y: 3.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(22 * s, -2.6 * s, 30 * s, -6.4 * s, 25 * s, 0);
  g.fillTriangle(22 * s, 2.6 * s, 30 * s, 6.4 * s, 25 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(22 * s, -2.6 * s, 30 * s, -6.4 * s, 25 * s, 0);
  g.strokeTriangle(22 * s, 2.6 * s, 30 * s, 6.4 * s, 25 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 3.4 * s, -12 * s, 8.5 * s, -3 * s, 5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -18, y: -3.6 },
    { x: -10, y: -6.2 },
    { x: 1, y: -6.8 },
    { x: 12, y: -5.2 },
    { x: 19, y: -2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 2.8 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -6.6 * s, 6 * s, -6.2 * s, 0, -12 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -6.6 * s, 6 * s, -6.2 * s, 0, -12 * s);

  // The small blackish blotch at the front of the first dorsal fin - the
  // real Sand Whiting's own field mark.
  g.fillStyle(blotchColor, 0.75 * alpha);
  g.fillEllipse(-1.5 * s, -8 * s, 1.6 * s, 2.4 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -4.5 * s);
  g.lineTo(-8 * s, 4.5 * s);
  g.strokePath();

  g.fillStyle(0xf0e8d0, alpha);
  g.fillCircle(-12 * s, -1.6 * s, 1.5 * s);
  g.fillStyle(0x1c1608, alpha);
  g.fillCircle(-11.7 * s, -1.6 * s, 0.85 * s);

  g.restore();
}

// A school whiting - a small, plain, uniformly silvery whiting - real
// school whiting lack the Sand Whiting's dorsal blotch entirely, so this
// one is deliberately left unmarked apart from a faint yellowish wash
// along the back, letting the plain silhouette itself be the ID trait -
// this is the plainest of the whitings here.
export function drawSchoolWhiting(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe4e0cc;
  const backColor = 0xc8bc80;
  const bellyColor = 0xf6f4ea;
  const finColor = 0xd6d0ac;
  const darkColor = 0x4c4832;

  const body = [
    { x: -17, y: 0.4 },
    { x: -15, y: -2.9 },
    { x: -8, y: -5 },
    { x: 1, y: -5.5 },
    { x: 10, y: -4.2 },
    { x: 16, y: -2.2 },
    { x: 18.5, y: 0 },
    { x: 16, y: 2.2 },
    { x: 10, y: 4.2 },
    { x: 1, y: 5.5 },
    { x: -8, y: 5 },
    { x: -14, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(18.5 * s, -2.1 * s, 25 * s, -5.2 * s, 21 * s, 0);
  g.fillTriangle(18.5 * s, 2.1 * s, 25 * s, 5.2 * s, 21 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(18.5 * s, -2.1 * s, 25 * s, -5.2 * s, 21 * s, 0);
  g.strokeTriangle(18.5 * s, 2.1 * s, 25 * s, 5.2 * s, 21 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6.5 * s, 2.8 * s, -10 * s, 7 * s, -2.5 * s, 4 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -15, y: -2.9 },
    { x: -8, y: -5 },
    { x: 1, y: -5.5 },
    { x: 10, y: -4.2 },
    { x: 16, y: -2.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 2 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2 * s, -5.3 * s, 5 * s, -5 * s, 0.5 * s, -9.8 * s);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokeTriangle(-2 * s, -5.3 * s, 5 * s, -5 * s, 0.5 * s, -9.8 * s);

  g.lineStyle(1 * s, darkColor, 0.35 * alpha);
  g.beginPath();
  g.moveTo(-7.5 * s, -3.6 * s);
  g.lineTo(-6.7 * s, 3.6 * s);
  g.strokePath();

  g.fillStyle(0xf4f0e0, alpha);
  g.fillCircle(-10 * s, -1.3 * s, 1.3 * s);
  g.fillStyle(0x181408, alpha);
  g.fillCircle(-9.75 * s, -1.3 * s, 0.72 * s);

  g.restore();
}

// A king george whiting - the largest, most prized whiting here, and
// built around the real animal's own namesake field mark ("punctatus"
// literally means spotted): rows of small dark blotches running along
// the back and upper flank, over a bronze-olive body - a different
// pattern and placement from the Sand Whiting's single dorsal blotch or
// the Trumpeter Whiting's lateral-line row.
export function drawKingGeorgeWhiting(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4b478;
  const backColor = 0x8c7c44;
  const bellyColor = 0xecE4c8;
  const finColor = 0xb0a066;
  const darkColor = 0x443a1c;
  const spotColor = 0x342c14;

  const body = [
    { x: -24, y: 0.7 },
    { x: -21, y: -4.4 },
    { x: -11, y: -7.6 },
    { x: 1.5, y: -8.4 },
    { x: 14, y: -6.4 },
    { x: 22, y: -3.2 },
    { x: 26, y: 0 },
    { x: 22, y: 3.2 },
    { x: 14, y: 6.4 },
    { x: 1.5, y: 8.4 },
    { x: -11, y: 7.6 },
    { x: -20, y: 3.9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -3.2 * s, 35 * s, -7.8 * s, 29.5 * s, 0);
  g.fillTriangle(26 * s, 3.2 * s, 35 * s, 7.8 * s, 29.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(26 * s, -3.2 * s, 35 * s, -7.8 * s, 29.5 * s, 0);
  g.strokeTriangle(26 * s, 3.2 * s, 35 * s, 7.8 * s, 29.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 4.2 * s, -14 * s, 10.5 * s, -3.5 * s, 6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -21, y: -4.4 },
    { x: -11, y: -7.6 },
    { x: 1.5, y: -8.4 },
    { x: 14, y: -6.4 },
    { x: 22, y: -3.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // Rows of small dark blotches along the back and upper flank - the
  // real King George Whiting's own namesake field mark.
  g.fillStyle(spotColor, 0.6 * alpha);
  [
    [-15, -4.5, 1.1],
    [-8, -6, 1.1],
    [-1, -6.5, 1.1],
    [6, -5.8, 1],
    [13, -4.4, 1],
    [-12, -0.5, 0.9],
    [-4, -1.5, 0.9],
    [4, -1.5, 0.9],
    [11, -0.5, 0.85]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2.5 * s, -8.2 * s, 7 * s, -7.4 * s, 1.5 * s, -14.5 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-2.5 * s, -8.2 * s, 7 * s, -7.4 * s, 1.5 * s, -14.5 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-10.5 * s, -5.4 * s);
  g.lineTo(-9.5 * s, 5.4 * s);
  g.strokePath();

  g.fillStyle(0xf0e8cc, alpha);
  g.fillCircle(-14 * s, -1.9 * s, 1.9 * s);
  g.fillStyle(0x181408, alpha);
  g.fillCircle(-13.6 * s, -1.9 * s, 1.05 * s);

  g.restore();
}

// A yellowfin whiting - a pale, mostly plain-bodied whiting told apart by
// the real animal's own field mark given in its name: distinctly yellow-
// tinged pectoral and pelvic fins, unlike the pale or dark fins of every
// other whiting here.
export function drawYellowfinWhiting(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xdcd4b8;
  const backColor = 0xb0a476;
  const bellyColor = 0xf2eede;
  const finColor = 0xe8c848;
  const finDark = 0xa88418;
  const darkColor = 0x484224;

  const body = [
    { x: -18, y: 0.5 },
    { x: -16, y: -3.2 },
    { x: -8.5, y: -5.6 },
    { x: 1, y: -6.2 },
    { x: 11, y: -4.6 },
    { x: 17, y: -2.4 },
    { x: 20, y: 0 },
    { x: 17, y: 2.4 },
    { x: 11, y: 4.6 },
    { x: 1, y: 6.2 },
    { x: -8.5, y: 5.6 },
    { x: -15, y: 2.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(20 * s, -2.3 * s, 27 * s, -5.8 * s, 23 * s, 0);
  g.fillTriangle(20 * s, 2.3 * s, 27 * s, 5.8 * s, 23 * s, 0);
  g.lineStyle(1 * s, finDark, 0.6 * alpha);
  g.strokeTriangle(20 * s, -2.3 * s, 27 * s, -5.8 * s, 23 * s, 0);
  g.strokeTriangle(20 * s, 2.3 * s, 27 * s, 5.8 * s, 23 * s, 0);

  // The yellow-tinged pectoral fin - the real Yellowfin Whiting's own
  // namesake field mark.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 3.1 * s, -11 * s, 7.8 * s, -2.7 * s, 4.5 * s);
  g.lineStyle(1 * s, finDark, 0.6 * alpha);
  g.strokeTriangle(-7 * s, 3.1 * s, -11 * s, 7.8 * s, -2.7 * s, 4.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -16, y: -3.2 },
    { x: -8.5, y: -5.6 },
    { x: 1, y: -6.2 },
    { x: 11, y: -4.6 },
    { x: 17, y: -2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 2.4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokePoints(body, true);

  // The yellow-tinged first dorsal, matching the pectoral/pelvic fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2 * s, -6 * s, 5.5 * s, -5.6 * s, 1 * s, -11 * s);
  g.lineStyle(1 * s, finDark, 0.55 * alpha);
  g.strokeTriangle(-2 * s, -6 * s, 5.5 * s, -5.6 * s, 1 * s, -11 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-8.5 * s, -4 * s);
  g.lineTo(-7.7 * s, 4 * s);
  g.strokePath();

  g.fillStyle(0xf4eedc, alpha);
  g.fillCircle(-11 * s, -1.5 * s, 1.4 * s);
  g.fillStyle(0x181408, alpha);
  g.fillCircle(-10.7 * s, -1.5 * s, 0.78 * s);

  g.restore();
}

// A trumpeter whiting - told apart by two real field marks: a distinctly
// elongated, tapered, tubular snout (the real detail the "trumpeter" name
// refers to, more pronounced than any other whiting's own more conical
// snout here), and a row of faint brownish blotches running specifically
// along the lateral line - a different placement from the King George
// Whiting's own back-and-flank spot pattern.
export function drawTrumpeterWhiting(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd8caa0;
  const backColor = 0xac9a60;
  const bellyColor = 0xf0eadc;
  const finColor = 0xc4b482;
  const darkColor = 0x4c4024;
  const blotchColor = 0x6c5830;

  const body = [
    { x: -15, y: 0.5 },
    { x: -22, y: 0 },
    { x: -13, y: -3.4 },
    { x: -6, y: -5.6 },
    { x: 3, y: -6.2 },
    { x: 12, y: -4.6 },
    { x: 18, y: -2.4 },
    { x: 21, y: 0 },
    { x: 18, y: 2.4 },
    { x: 12, y: 4.6 },
    { x: 3, y: 6.2 },
    { x: -6, y: 5.6 },
    { x: -13, y: 3.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(21 * s, -2.3 * s, 28 * s, -5.8 * s, 24 * s, 0);
  g.fillTriangle(21 * s, 2.3 * s, 28 * s, 5.8 * s, 24 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(21 * s, -2.3 * s, 28 * s, -5.8 * s, 24 * s, 0);
  g.strokeTriangle(21 * s, 2.3 * s, 28 * s, 5.8 * s, 24 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 3.4 * s, -8 * s, 8.4 * s, 0.2 * s, 5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -13, y: -3.4 },
    { x: -6, y: -5.6 },
    { x: 3, y: -6.2 },
    { x: 12, y: -4.6 },
    { x: 18, y: -2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 2.4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(body, true);

  // The row of faint brownish blotches specifically along the lateral
  // line - a different placement from the King George Whiting's own
  // back-and-flank spots.
  g.fillStyle(blotchColor, 0.5 * alpha);
  [-9, -3, 3, 9, 15].forEach((bx) => g.fillEllipse(bx * s, 0.5 * s, 1.6 * s, 1 * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(0.5 * s, -6.3 * s, 7.5 * s, -5.7 * s, 2.5 * s, -11.5 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(0.5 * s, -6.3 * s, 7.5 * s, -5.7 * s, 2.5 * s, -11.5 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-5.5 * s, -4.2 * s);
  g.lineTo(-4.7 * s, 4.2 * s);
  g.strokePath();

  // The distinctly elongated, tapered, tubular snout - the real
  // "trumpeter" field mark, more pronounced than any other whiting's own
  // more conical snout.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-19 * s, 0.2 * s, 4.5 * s, 1.6 * s);

  g.fillStyle(0xf2ecd8, alpha);
  g.fillCircle(-11.5 * s, -1.8 * s, 1.5 * s);
  g.fillStyle(0x181408, alpha);
  g.fillCircle(-11.2 * s, -1.8 * s, 0.82 * s);

  g.restore();
}

// A snook - a real, distinct species from the Barramundi drawn elsewhere
// in the game (both belong to the same broad predatory-jaw genre, but
// they are genuinely different fish), told apart by the real animal's
// own single unmistakable field mark: a bold BLACK stripe running the
// entire length of the lateral line - completely absent on the plain-
// flanked Barramundi. A protruding lower jaw and concave head profile.
export function drawSnook(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc8ccc4;
  const backColor = 0x7c8474;
  const bellyColor = 0xf0f2ec;
  const finColor = 0xacb4a4;
  const darkColor = 0x383c30;
  const stripeColor = 0x14140e;

  const body = [
    { x: -25, y: 1 },
    { x: -23, y: -5 },
    { x: -14, y: -9.5 },
    { x: -2, y: -11 },
    { x: 10, y: -9 },
    { x: 18, y: -5.4 },
    { x: 23, y: -2 },
    { x: 23, y: 2 },
    { x: 18, y: 5.4 },
    { x: 10, y: 9 },
    { x: -2, y: 11 },
    { x: -14, y: 9.5 },
    { x: -22, y: 5.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.6 * s, 32 * s, -8.5 * s, 26.5 * s, 0);
  g.fillTriangle(23 * s, 3.6 * s, 32 * s, 8.5 * s, 26.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -3.6 * s, 32 * s, -8.5 * s, 26.5 * s, 0);
  g.strokeTriangle(23 * s, 3.6 * s, 32 * s, 8.5 * s, 26.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 5.5 * s, -14 * s, 13 * s, -3 * s, 8 * s);
  g.fillTriangle(2 * s, 10 * s, -1.5 * s, 16 * s, 6.5 * s, 11 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -23, y: -5 },
    { x: -14, y: -9.5 },
    { x: -2, y: -11 },
    { x: 10, y: -9 },
    { x: 18, y: -5.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // The bold black stripe running the entire lateral line - the real
  // Snook's own unmistakable field mark, absent on the Barramundi.
  g.lineStyle(1.8 * s, stripeColor, 0.75 * alpha);
  g.beginPath();
  g.moveTo(-21 * s, 0.4 * s);
  quadCurveTo(g, -21 * s, 0.4 * s, 0, 1 * s, 22.5 * s, -0.4 * s);
  g.strokePath();

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -10.7 * s, 8 * s, -9 * s, 1 * s, -17.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-5 * s, -10.7 * s, 8 * s, -9 * s, 1 * s, -17.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-11 * s, -7.5 * s);
  g.lineTo(-10 * s, 7.5 * s);
  g.strokePath();

  // A protruding lower jaw and concave head profile.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-25 * s, 0.5 * s);
  quadCurveTo(g, -25 * s, 0.5 * s, -27 * s, 2 * s, -20 * s, 4.5 * s);
  g.strokePath();

  g.fillStyle(0xecf0ea, alpha);
  g.fillCircle(-16 * s, -3 * s, 2.3 * s);
  g.fillStyle(0x0c0e08, alpha);
  g.fillCircle(-15.6 * s, -3 * s, 1.3 * s);

  g.restore();
}

// A teraglin - a real, slender jewfish/croaker relative distinct from
// both the Mulloway and Black Jewfish elsewhere in the game: a leaner
// body than either, a coppery-bronze sheen, a genuinely forked tail
// (unlike the rounded tails of its two heavier relatives), and the real
// animal's own field mark - black-edged fins, unlike the plainer fins on
// the Mulloway or Black Jewfish.
export function drawTeraglin(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa89478;
  const backColor = 0x6c5c3c;
  const bellyColor = 0xe0d4b8;
  const finColor = 0x8c7a56;
  const darkColor = 0x2c2210;
  const copperColor = 0xc09858;
  const edgeColor = 0x181208;

  const body = [
    { x: -24, y: 0.8 },
    { x: -21, y: -5 },
    { x: -12, y: -9 },
    { x: -1, y: -10.5 },
    { x: 11, y: -8.5 },
    { x: 19, y: -5 },
    { x: 24, y: -2 },
    { x: 24, y: 2 },
    { x: 19, y: 5 },
    { x: 11, y: 8.5 },
    { x: -1, y: 10.5 },
    { x: -12, y: 9 },
    { x: -20, y: 5.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A genuinely forked tail - unlike the Mulloway's or Black Jewfish's
  // own rounded tails.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -2.6 * s, 34 * s, -9.5 * s, 28 * s, -0.4 * s);
  g.fillTriangle(24 * s, 2.6 * s, 34 * s, 9.5 * s, 28 * s, 0.4 * s);
  g.lineStyle(1.2 * s, edgeColor, 0.6 * alpha);
  g.strokeTriangle(24 * s, -2.6 * s, 34 * s, -9.5 * s, 28 * s, -0.4 * s);
  g.strokeTriangle(24 * s, 2.6 * s, 34 * s, 9.5 * s, 28 * s, 0.4 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 5 * s, -14 * s, 12.5 * s, -3 * s, 7.5 * s);
  g.fillTriangle(2 * s, 9.5 * s, -1.5 * s, 15.5 * s, 6.5 * s, 10.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // The coppery-bronze sheen - the real Teraglin's own coloring.
  g.fillStyle(copperColor, 0.22 * alpha);
  g.fillEllipse(0, -1 * s, 20 * s, 8 * s);

  const topProfile = [
    { x: -21, y: -5 },
    { x: -12, y: -9 },
    { x: -1, y: -10.5 },
    { x: 11, y: -8.5 },
    { x: 19, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -10.2 * s, 8 * s, -8.5 * s, 1.5 * s, -16 * s);
  g.lineStyle(1.2 * s, edgeColor, 0.55 * alpha);
  g.strokeTriangle(-4 * s, -10.2 * s, 8 * s, -8.5 * s, 1.5 * s, -16 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-13 * s, -6.8 * s);
  g.lineTo(-12 * s, 6.8 * s);
  g.strokePath();

  g.fillStyle(0xece4d0, alpha);
  g.fillCircle(-16 * s, -3 * s, 2.2 * s);
  g.fillStyle(0x100c06, alpha);
  g.fillCircle(-15.6 * s, -3 * s, 1.2 * s);

  g.restore();
}

// A wahoo - built with a construction nothing else in the game shares:
// the leanest, most needle-elongated mackerel-family body here (even
// slimmer than the Spanish Mackerel), a long, sharply pointed beak-like
// snout, small detached finlets trailing the dorsal and anal fins (a
// real Scombrid trait, distinct in placement from the Queenfish's own
// finlets), a deeply forked, high-aspect tail built for speed, and the
// real animal's own unmistakable field mark: roughly two dozen thin,
// slightly wavy, vertical blue-green bars running the entire body length.
export function drawWahoo(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x9cb8c0;
  const backColor = 0x1c4858;
  const bellyColor = 0xe4eef0;
  const finColor = 0x18384a;
  const darkColor = 0x0a1c26;
  const barColor = 0x2a6c78;
  const toothColor = 0xf0eee8;

  const body = [
    { x: -36, y: 0 },
    { x: -33, y: -2.4 },
    { x: -23, y: -4.6 },
    { x: -9, y: -6.2 },
    { x: 5, y: -6.2 },
    { x: 17, y: -4.8 },
    { x: 26, y: -3 },
    { x: 31, y: -1.4 },
    { x: 31, y: 1.4 },
    { x: 26, y: 3 },
    { x: 17, y: 4.8 },
    { x: 5, y: 6.2 },
    { x: -9, y: 6.2 },
    { x: -23, y: 4.6 },
    { x: -33, y: 2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The deeply forked, high-aspect tail built for speed.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(31 * s, -1.8 * s, 44 * s, -11.5 * s, 35 * s, -0.3 * s);
  g.fillTriangle(31 * s, 1.8 * s, 44 * s, 11.5 * s, 35 * s, 0.3 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(31 * s, -1.8 * s, 44 * s, -11.5 * s, 35 * s, -0.3 * s);
  g.strokeTriangle(31 * s, 1.8 * s, 44 * s, 11.5 * s, 35 * s, 0.3 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-13 * s, 2.6 * s, -18 * s, 9.5 * s, -6 * s, 4.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -33, y: -2.4 },
    { x: -23, y: -4.6 },
    { x: -9, y: -6.2 },
    { x: 5, y: -6.2 },
    { x: 17, y: -4.8 },
    { x: 26, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.8 * s }))
  );
  g.fillStyle(backColor, 0.6 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // Roughly two dozen thin, slightly wavy, vertical blue-green bars
  // running the entire body length - the real Wahoo's own unmistakable
  // field mark.
  g.lineStyle(1 * s, barColor, 0.55 * alpha);
  for (let i = 0; i < 22; i += 1) {
    const bx = -30 + i * 2.6;
    const wob = Math.sin(i * 1.3) * 1.1;
    g.beginPath();
    g.moveTo((bx + wob) * s, -5.5 * s);
    quadCurveTo(g, (bx + wob) * s, -5.5 * s, bx * s, 0, (bx - wob) * s, 5.5 * s);
    g.strokePath();
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, -6.4 * s, 1 * s, -6 * s, -4 * s, -12 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-9 * s, -6.4 * s, 1 * s, -6 * s, -4 * s, -12 * s);

  // Small detached finlets trailing the dorsal and anal fins.
  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 6; i += 1) {
    const fx = 6 + i * 3.2;
    g.fillTriangle(fx * s, -4.6 * s, (fx + 1.4) * s, -4.3 * s, (fx + 0.7) * s, -6.6 * s);
    g.fillTriangle(fx * s, 4.6 * s, (fx + 1.4) * s, 4.3 * s, (fx + 0.7) * s, 6.6 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-25 * s, -3 * s);
  g.lineTo(-24 * s, 3 * s);
  g.strokePath();

  // The long, sharply pointed beak-like snout with visible fangs.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-36 * s, 0.4 * s);
  g.lineTo(-27 * s, 2.4 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -34 + i * 2.8;
    g.fillTriangle(tx * s, 0.8 * s, (tx + 1.3) * s, 1.3 * s, (tx + 0.5) * s, 3.4 * s);
  }

  g.fillStyle(0xe8f0f0, alpha);
  g.fillCircle(-29 * s, -1.6 * s, 2 * s);
  g.fillStyle(0x0a1216, alpha);
  g.fillCircle(-28.6 * s, -1.6 * s, 1.1 * s);

  g.restore();
}

// A dhufish - a real, iconic West Australian reef fish, built around its
// single most famous, genuinely unique field mark: long, whip-like
// filaments trailing off the tips of the first two dorsal spines, far
// past the rest of the fin - a construction nothing else in the game
// uses. Robust blue-grey body with a humped forehead, distinct from the
// Pearl Perch's own pearly-sheen, huge-eyed look despite being a close
// real relative in the same family.
export function drawDhufish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x5c6c78;
  const backColor = 0x2c3844;
  const bellyColor = 0x9aa8b0;
  const finColor = 0x445260;
  const darkColor = 0x1a222a;

  const body = [
    { x: -19, y: 1.6 },
    { x: -17, y: -6 },
    { x: -8, y: -12 },
    { x: 3, y: -14 },
    { x: 15, y: -11 },
    { x: 23, y: -6 },
    { x: 27, y: -2 },
    { x: 27, y: 2 },
    { x: 23, y: 6 },
    { x: 15, y: 11 },
    { x: 3, y: 14 },
    { x: -8, y: 12 },
    { x: -16, y: 6.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(27 * s, -4 * s, 36 * s, -9.5 * s, 30.5 * s, 0);
  g.fillTriangle(27 * s, 4 * s, 36 * s, 9.5 * s, 30.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(27 * s, -4 * s, 36 * s, -9.5 * s, 30.5 * s, 0);
  g.strokeTriangle(27 * s, 4 * s, 36 * s, 9.5 * s, 30.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 6.5 * s, -11 * s, 16 * s, 0.5 * s, 9.5 * s);
  g.fillTriangle(5 * s, 12 * s, 1 * s, 20 * s, 10 * s, 13 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -17, y: -6 },
    { x: -8, y: -12 },
    { x: 3, y: -14 },
    { x: 15, y: -11 },
    { x: 23, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  // The dorsal fin - its first two spines drawn deliberately taller,
  // then trailing off into long, thin whip-like filaments far past the
  // rest of the fin's edge, the real Dhufish's own single most famous
  // field mark.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -6, y: -12 },
    { x: -1, y: -14 },
    { x: 4, y: -13.6 },
    { x: 9, y: -12.6 },
    { x: 14, y: -11 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - (i < 2 ? 8 : 5) * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(14 * s, -11 * s, 21 * s, -8 * s, 17 * s, -16 * s);

  // The whip-like filaments themselves, trailing off the tips of the
  // first two spines.
  g.lineStyle(1.1 * s, finColor, 0.85 * alpha);
  g.beginPath();
  g.moveTo(-3.5 * s, -20 * s);
  quadCurveTo(g, -3.5 * s, -20 * s, -5 * s, -27 * s, -2 * s, -32 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(1.5 * s, -19.5 * s);
  quadCurveTo(g, 1.5 * s, -19.5 * s, 1 * s, -26 * s, 4 * s, -31 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -8.5 * s);
  g.lineTo(-9 * s, 8.5 * s);
  g.strokePath();

  g.fillStyle(0xc4ccd0, alpha);
  g.fillCircle(-13 * s, -3.4 * s, 2.7 * s);
  g.fillStyle(0x0c1216, alpha);
  g.fillCircle(-12.6 * s, -3.4 * s, 1.5 * s);

  g.restore();
}

// A baldchin groper - a real, large wrasse (not a true grouper, despite
// the name) closely related to the tuskfish drawn elsewhere here, built
// around the real animal's own single unmistakable field mark: a pale
// cream-white patch across the chin and lower jaw - the "bald chin" the
// species is named for - on an otherwise pinkish reddish-brown body.
export function drawBaldchinGroper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc06858;
  const backColor = 0x883c30;
  const bellyColor = 0xe8b0a0;
  const finColor = 0xa8503f;
  const darkColor = 0x4c1c14;
  const chinColor = 0xf0e4d0;

  const body = [
    { x: -18, y: 1.4 },
    { x: -16, y: -5.6 },
    { x: -7, y: -10.5 },
    { x: 3, y: -12 },
    { x: 14, y: -9 },
    { x: 21, y: -5 },
    { x: 25, y: -1.8 },
    { x: 25, y: 1.8 },
    { x: 21, y: 5 },
    { x: 14, y: 9 },
    { x: 3, y: 12 },
    { x: -7, y: 10.5 },
    { x: -15, y: 5.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -3.6 * s, 33 * s, -8.5 * s, 28 * s, 0);
  g.fillTriangle(25 * s, 3.6 * s, 33 * s, 8.5 * s, 28 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(25 * s, -3.6 * s, 33 * s, -8.5 * s, 28 * s, 0);
  g.strokeTriangle(25 * s, 3.6 * s, 33 * s, 8.5 * s, 28 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 5.8 * s, -11 * s, 14 * s, 0.5 * s, 8.5 * s);
  g.fillTriangle(4 * s, 10.5 * s, 0.5 * s, 17.5 * s, 9 * s, 11.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -16, y: -5.6 },
    { x: -7, y: -10.5 },
    { x: 3, y: -12 },
    { x: 14, y: -9 },
    { x: 21, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.6 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -10.8 * s, 12 * s, -9 * s, 3 * s, -17.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-6 * s, -10.8 * s, 12 * s, -9 * s, 3 * s, -17.5 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9.5 * s, -7.5 * s);
  g.lineTo(-8.5 * s, 7.5 * s);
  g.strokePath();

  // The pale cream-white "bald chin" patch - the real animal's own
  // single unmistakable field mark and namesake.
  g.fillStyle(chinColor, 0.85 * alpha);
  g.fillEllipse(-13.5 * s, 3.4 * s, 4 * s, 2.4 * s);
  g.lineStyle(0.6 * s, darkColor, 0.35 * alpha);
  g.strokeEllipse(-13.5 * s, 3.4 * s, 4 * s, 2.4 * s);

  g.fillStyle(0xecd4c4, alpha);
  g.fillCircle(-11.5 * s, -2.4 * s, 2.2 * s);
  g.fillStyle(0x180c06, alpha);
  g.fillCircle(-11.1 * s, -2.4 * s, 1.2 * s);

  g.restore();
}

// A tuskfish - the generic baseline of a real Choerodon wrasse genus,
// plain pinkish-orange, told apart from every other fish here by the
// family's own unmistakable field mark given full prominence: a pair of
// long, protruding, forward-jutting tusk-like canine teeth at the front
// of the jaw, permanently visible even with the mouth closed - the real
// detail the whole genus is named for.
export function drawTuskfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe08858;
  const backColor = 0xb85c34;
  const bellyColor = 0xf4c8a8;
  const finColor = 0xcc7040;
  const darkColor = 0x5c2810;
  const tuskColor = 0xf4f0e4;

  const body = [
    { x: -17, y: 1.2 },
    { x: -15, y: -5 },
    { x: -6, y: -9.5 },
    { x: 4, y: -10.8 },
    { x: 14, y: -8 },
    { x: 20, y: -4.4 },
    { x: 23, y: -1.6 },
    { x: 23, y: 1.6 },
    { x: 20, y: 4.4 },
    { x: 14, y: 8 },
    { x: 4, y: 10.8 },
    { x: -6, y: 9.5 },
    { x: -14, y: 5.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.2 * s, 30.5 * s, -7.6 * s, 26 * s, 0);
  g.fillTriangle(23 * s, 3.2 * s, 30.5 * s, 7.6 * s, 26 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -3.2 * s, 30.5 * s, -7.6 * s, 26 * s, 0);
  g.strokeTriangle(23 * s, 3.2 * s, 30.5 * s, 7.6 * s, 26 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 5.2 * s, -9.5 * s, 12.5 * s, 1 * s, 7.5 * s);
  g.fillTriangle(4 * s, 9.5 * s, 0.5 * s, 15.8 * s, 8.5 * s, 10.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -15, y: -5 },
    { x: -6, y: -9.5 },
    { x: 4, y: -10.8 },
    { x: 14, y: -8 },
    { x: 20, y: -4.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -9.8 * s, 11 * s, -8.2 * s, 2.5 * s, -15.8 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-5 * s, -9.8 * s, 11 * s, -8.2 * s, 2.5 * s, -15.8 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-8.5 * s, -6.8 * s);
  g.lineTo(-7.5 * s, 6.8 * s);
  g.strokePath();

  // The pair of long, protruding, forward-jutting tusk-like canine teeth
  // - permanently visible, the real detail the whole genus is named for.
  g.fillStyle(tuskColor, alpha);
  g.fillTriangle(-17 * s, 0.5 * s, -20.5 * s, -0.6 * s, -19 * s, 2.4 * s);
  g.fillTriangle(-16.5 * s, 2.2 * s, -19.5 * s, 2.8 * s, -18 * s, 4.6 * s);

  g.fillStyle(0xf0e0c8, alpha);
  g.fillCircle(-10.5 * s, -2 * s, 2 * s);
  g.fillStyle(0x180c04, alpha);
  g.fillCircle(-10.1 * s, -2 * s, 1.1 * s);

  g.restore();
}

// A blackspot tuskfish - the same real tusk-toothed jaw as every other
// tuskfish here, on a greenish-olive body, told apart by the real
// animal's own field mark: a bold black blotch sitting at the base of
// the tail, on the caudal peduncle - a different placement and shape
// from the Moses Perch's own similar-sounding but smaller tail marking.
export function drawBlackspotTuskfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x7c9058;
  const backColor = 0x4c5c30;
  const bellyColor = 0xb8c898;
  const finColor = 0x647a3e;
  const darkColor = 0x242c14;
  const tuskColor = 0xf4f0e4;
  const blotchColor = 0x14180a;

  const body = [
    { x: -18, y: 1.3 },
    { x: -16, y: -5.4 },
    { x: -7, y: -10 },
    { x: 4, y: -11.4 },
    { x: 15, y: -8.4 },
    { x: 21, y: -4.6 },
    { x: 24, y: -1.7 },
    { x: 24, y: 1.7 },
    { x: 21, y: 4.6 },
    { x: 15, y: 8.4 },
    { x: 4, y: 11.4 },
    { x: -7, y: 10 },
    { x: -15, y: 5.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -3.4 * s, 31.5 * s, -8 * s, 27 * s, 0);
  g.fillTriangle(24 * s, 3.4 * s, 31.5 * s, 8 * s, 27 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(24 * s, -3.4 * s, 31.5 * s, -8 * s, 27 * s, 0);
  g.strokeTriangle(24 * s, 3.4 * s, 31.5 * s, 8 * s, 27 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5.5 * s, 5.6 * s, -10 * s, 13 * s, 0.5 * s, 8 * s);
  g.fillTriangle(4 * s, 10 * s, 0.5 * s, 16.5 * s, 8.5 * s, 10.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -16, y: -5.4 },
    { x: -7, y: -10 },
    { x: 4, y: -11.4 },
    { x: 15, y: -8.4 },
    { x: 21, y: -4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.2 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -10.3 * s, 11.5 * s, -8.7 * s, 3 * s, -16.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-5 * s, -10.3 * s, 11.5 * s, -8.7 * s, 3 * s, -16.5 * s);

  // The bold black blotch at the base of the tail - the real Blackspot
  // Tuskfish's own field mark.
  g.fillStyle(blotchColor, 0.8 * alpha);
  g.fillEllipse(18 * s, -1 * s, 3.6 * s, 4.4 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -7 * s);
  g.lineTo(-8 * s, 7 * s);
  g.strokePath();

  g.fillStyle(tuskColor, alpha);
  g.fillTriangle(-17.5 * s, 0.5 * s, -21 * s, -0.6 * s, -19.5 * s, 2.4 * s);
  g.fillTriangle(-17 * s, 2.2 * s, -20 * s, 2.8 * s, -18.5 * s, 4.6 * s);

  g.fillStyle(0xe0ecc8, alpha);
  g.fillCircle(-11 * s, -2.1 * s, 2.1 * s);
  g.fillStyle(0x0e1408, alpha);
  g.fillCircle(-10.6 * s, -2.1 * s, 1.15 * s);

  g.restore();
}

// A blue tuskfish - the same real tusk-toothed jaw as its genus-mates,
// but the single most vividly colored fish in this cluster: a deep,
// saturated blue-green body all over, unlike the pinkish or olive tones
// of the other tuskfish here, with a paler blue-white belly.
export function drawBlueTuskfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x1c6c78;
  const backColor = 0x0e4048;
  const bellyColor = 0x8cccc8;
  const finColor = 0x145458;
  const darkColor = 0x082024;
  const tuskColor = 0xf4f0e4;
  const highlightColor = 0x4cc8c0;

  const body = [
    { x: -17, y: 1.2 },
    { x: -15, y: -5 },
    { x: -6, y: -9.5 },
    { x: 4, y: -10.8 },
    { x: 14, y: -8 },
    { x: 20, y: -4.4 },
    { x: 23, y: -1.6 },
    { x: 23, y: 1.6 },
    { x: 20, y: 4.4 },
    { x: 14, y: 8 },
    { x: 4, y: 10.8 },
    { x: -6, y: 9.5 },
    { x: -14, y: 5.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.2 * s, 30.5 * s, -7.6 * s, 26 * s, 0);
  g.fillTriangle(23 * s, 3.2 * s, 30.5 * s, 7.6 * s, 26 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -3.2 * s, 30.5 * s, -7.6 * s, 26 * s, 0);
  g.strokeTriangle(23 * s, 3.2 * s, 30.5 * s, 7.6 * s, 26 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 5.2 * s, -9.5 * s, 12.5 * s, 1 * s, 7.5 * s);
  g.fillTriangle(4 * s, 9.5 * s, 0.5 * s, 15.8 * s, 8.5 * s, 10.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // A soft blue-green highlight sheen down the flank.
  g.fillStyle(highlightColor, 0.2 * alpha);
  g.fillEllipse(2 * s, -1 * s, 17 * s, 6 * s);

  const topProfile = [
    { x: -15, y: -5 },
    { x: -6, y: -9.5 },
    { x: 4, y: -10.8 },
    { x: 14, y: -8 },
    { x: 20, y: -4.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -9.8 * s, 11 * s, -8.2 * s, 2.5 * s, -15.8 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-5 * s, -9.8 * s, 11 * s, -8.2 * s, 2.5 * s, -15.8 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-8.5 * s, -6.8 * s);
  g.lineTo(-7.5 * s, 6.8 * s);
  g.strokePath();

  g.fillStyle(tuskColor, alpha);
  g.fillTriangle(-17 * s, 0.5 * s, -20.5 * s, -0.6 * s, -19 * s, 2.4 * s);
  g.fillTriangle(-16.5 * s, 2.2 * s, -19.5 * s, 2.8 * s, -18 * s, 4.6 * s);

  g.fillStyle(0xa0e8e0, alpha);
  g.fillCircle(-10.5 * s, -2 * s, 2 * s);
  g.fillStyle(0x041012, alpha);
  g.fillCircle(-10.1 * s, -2 * s, 1.1 * s);

  g.restore();
}

// A black sea bass - a real Atlantic grouper relative, dark blue-black
// over grey with faint darker mottled bars, a slight bony hump behind
// the head (more pronounced in real large males), and the real animal's
// own field mark: pale, whitish tips on every spine of the dorsal fin -
// a genuinely different fin-marking technique from anything else here.
export function drawBlackSeaBass(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x383e44;
  const backColor = 0x181c20;
  const bellyColor = 0x6c747c;
  const finColor = 0x282e34;
  const darkColor = 0x0c0e10;
  const barColor = 0x50585e;
  const tipColor = 0xdcdcd4;

  const body = [
    { x: -19, y: 1.6 },
    { x: -17, y: -6 },
    { x: -8, y: -11.5 },
    { x: 3, y: -13.5 },
    { x: 14, y: -10.5 },
    { x: 22, y: -6 },
    { x: 26, y: -2 },
    { x: 26, y: 2 },
    { x: 22, y: 6 },
    { x: 14, y: 10.5 },
    { x: 3, y: 13.5 },
    { x: -8, y: 11.5 },
    { x: -16, y: 6.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -3.8 * s, 35 * s, -9 * s, 29.5 * s, 0);
  g.fillTriangle(26 * s, 3.8 * s, 35 * s, 9 * s, 29.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -3.8 * s, 35 * s, -9 * s, 29.5 * s, 0);
  g.strokeTriangle(26 * s, 3.8 * s, 35 * s, 9 * s, 29.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 6.5 * s, -11 * s, 16 * s, 0.5 * s, 9.5 * s);
  g.fillTriangle(5 * s, 12 * s, 1 * s, 19.5 * s, 9.5 * s, 12.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Faint darker mottled bars.
  g.fillStyle(barColor, 0.3 * alpha);
  [-10, -3, 5, 13].forEach((bx) => g.fillEllipse(bx * s, 0, 3 * s, 9 * s));

  const topProfile = [
    { x: -17, y: -6 },
    { x: -8, y: -11.5 },
    { x: 3, y: -13.5 },
    { x: 14, y: -10.5 },
    { x: 22, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.6 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // The dorsal fin, its spines given pale whitish tips - the real Black
  // Sea Bass's own field mark, a different fin-marking technique from
  // anything else here.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -6, y: -11.6 },
    { x: -1, y: -13.6 },
    { x: 4, y: -13.2 },
    { x: 9, y: -12.2 },
    { x: 14, y: -10.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - 6.5 * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
    g.fillStyle(tipColor, 0.85 * alpha);
    g.fillCircle(tipX, tipY, 0.9 * s);
    g.fillStyle(finColor, alpha);
  }
  g.fillTriangle(14 * s, -10.6 * s, 21 * s, -8 * s, 17 * s, -15.5 * s);
  g.fillStyle(tipColor, 0.85 * alpha);
  g.fillCircle(17 * s, -15.5 * s, 0.9 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -8 * s);
  g.lineTo(-9 * s, 8 * s);
  g.strokePath();

  g.fillStyle(0xb0b8bc, alpha);
  g.fillCircle(-13 * s, -3.4 * s, 2.6 * s);
  g.fillStyle(0x08090a, alpha);
  g.fillCircle(-12.6 * s, -3.4 * s, 1.4 * s);

  g.restore();
}

// A gag grouper - a real elongated grouper (leaner than the Hapuku's own
// robust bulk), brownish-grey with the real animal's own field mark: a
// dense scrawl of pale, worm-like wavy vermiculations across the flank -
// drawn as genuine wandering curved strokes, a different technique from
// any spot, bar, or blotch pattern used elsewhere - and a distinctly
// concave, slightly forked tail margin, unlike the round-tailed Red
// Grouper right next to it in the game.
export function drawGagGrouper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x685c48;
  const backColor = 0x3c3426;
  const bellyColor = 0x9c8e70;
  const finColor = 0x4c4232;
  const darkColor = 0x201c12;
  const vermColor = 0xb0a484;

  const body = [
    { x: -24, y: 1.6 },
    { x: -21, y: -6 },
    { x: -11, y: -11 },
    { x: 1, y: -12.5 },
    { x: 13, y: -9.5 },
    { x: 21, y: -5.4 },
    { x: 26, y: -2 },
    { x: 26, y: 2 },
    { x: 21, y: 5.4 },
    { x: 13, y: 9.5 },
    { x: 1, y: 12.5 },
    { x: -11, y: 11 },
    { x: -20, y: 6.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The distinctly concave, slightly forked tail margin - unlike the
  // round-tailed Red Grouper.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -3.6 * s, 35 * s, -8.5 * s, 30 * s, -0.6 * s);
  g.fillTriangle(26 * s, 3.6 * s, 35 * s, 8.5 * s, 30 * s, 0.6 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -3.6 * s, 35 * s, -8.5 * s, 30 * s, -0.6 * s);
  g.strokeTriangle(26 * s, 3.6 * s, 35 * s, 8.5 * s, 30 * s, 0.6 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6.4 * s, -13 * s, 15 * s, 0, 9.5 * s);
  g.fillTriangle(4 * s, 11.5 * s, 0, 19 * s, 9 * s, 12.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -21, y: -6 },
    { x: -11, y: -11 },
    { x: 1, y: -12.5 },
    { x: 13, y: -9.5 },
    { x: 21, y: -5.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // The dense scrawl of pale, worm-like wavy vermiculations - the real
  // Gag Grouper's own field mark, drawn as genuine wandering curves.
  g.lineStyle(1 * s, vermColor, 0.45 * alpha);
  for (let i = 0; i < 8; i += 1) {
    const vy = -8 + i * 2.1;
    g.beginPath();
    g.moveTo(-15 * s, vy * s);
    quadCurveTo(g, -15 * s, vy * s, (-8 + (i % 2) * 3) * s, (vy - 1.5) * s, (0 + (i % 2) * -2) * s, (vy + 1) * s);
    quadCurveTo(g, (0 + (i % 2) * -2) * s, (vy + 1) * s, (8 - (i % 2) * 3) * s, (vy - 1) * s, 17 * s, (vy + 1.2) * s);
    g.strokePath();
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -12 * s, 12 * s, -10 * s, 2 * s, -19.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-8 * s, -12 * s, 12 * s, -10 * s, 2 * s, -19.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-13 * s, -8.5 * s);
  g.lineTo(-12 * s, 8.5 * s);
  g.strokePath();

  g.fillStyle(0xcac0a4, alpha);
  g.fillCircle(-16 * s, -3.6 * s, 2.6 * s);
  g.fillStyle(0x100e08, alpha);
  g.fillCircle(-15.6 * s, -3.6 * s, 1.4 * s);

  g.restore();
}

// A red grouper - a real reddish-brown mottled grouper, told apart by
// two genuine field marks: a distinctly ROUND, fully rounded tail margin
// (unlike the Gag Grouper's own concave, slightly forked tail), and a
// bold black margin running along the edge of the pectoral fin, plus
// thick fleshy lips.
export function drawRedGrouper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa4664c;
  const backColor = 0x6c3c28;
  const bellyColor = 0xd4a488;
  const finColor = 0x8c5038;
  const darkColor = 0x381c10;
  const mottleColor = 0x7c4630;
  const blackEdge = 0x140a06;

  const body = [
    { x: -23, y: 1.6 },
    { x: -20, y: -5.6 },
    { x: -10, y: -10.5 },
    { x: 1, y: -12 },
    { x: 13, y: -9 },
    { x: 20, y: -5 },
    { x: 25, y: -1.8 },
    { x: 25, y: 1.8 },
    { x: 20, y: 5 },
    { x: 13, y: 9 },
    { x: 1, y: 12 },
    { x: -10, y: 10.5 },
    { x: -19, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The distinctly round, fully rounded tail margin - unlike the Gag
  // Grouper's own concave, slightly forked tail.
  g.fillStyle(finColor, alpha);
  g.fillEllipse(32 * s, 0, 10 * s, 8.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(32 * s, 0, 10 * s, 8.5 * s);

  // The pectoral fin with a bold black margin along its edge - a real
  // Red Grouper field mark.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 6 * s, -12 * s, 14.5 * s, 0.5 * s, 9 * s);
  g.lineStyle(1.4 * s, blackEdge, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-12 * s, 14.5 * s);
  g.lineTo(0.5 * s, 9 * s);
  g.strokePath();
  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 11 * s, 0, 18.5 * s, 9 * s, 12 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -20, y: -5.6 },
    { x: -10, y: -10.5 },
    { x: 1, y: -12 },
    { x: 13, y: -9 },
    { x: 20, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.6 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  // Mottled reddish-brown blotching.
  g.fillStyle(mottleColor, 0.35 * alpha);
  [
    [-11, -2, 3.4],
    [-2, -5, 3],
    [7, -2, 3.2],
    [-6, 5, 2.8],
    [4, 6, 3]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.6 * s, br * s));

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, -11.6 * s, 11 * s, -9.6 * s, 2 * s, -18.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-7 * s, -11.6 * s, 11 * s, -9.6 * s, 2 * s, -18.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-12 * s, -8 * s);
  g.lineTo(-11 * s, 8 * s);
  g.strokePath();

  // Thick, fleshy lips.
  g.fillStyle(0xc08868, 0.8 * alpha);
  g.fillEllipse(-19.5 * s, 1.6 * s, 3.2 * s, 2 * s);

  g.fillStyle(0xe4c0a8, alpha);
  g.fillCircle(-15 * s, -2.8 * s, 2.5 * s);
  g.fillStyle(0x180c06, alpha);
  g.fillCircle(-14.6 * s, -2.8 * s, 1.35 * s);

  g.restore();
}

// A black grouper - a real, close Mycteroperca relative of the Gag
// Grouper here, but told genuinely apart by the real animal's own darker
// coloring and different pattern: a dark blackish-grey body (much darker
// overall than Gag's brownish-grey) with pale, chain-like rectangular
// blotches clustered mainly on the head and upper flank, and black
// margins along the pectoral and tail fins - a different pattern
// technique from Gag's wandering worm-like vermiculations or Scamp's
// dense small spotting.
export function drawBlackGrouper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x3c4038;
  const backColor = 0x1c2018;
  const bellyColor = 0x60685c;
  const finColor = 0x282c22;
  const darkColor = 0x0e100c;
  const blotchColor = 0x646c58;

  const body = [
    { x: -24, y: 1.6 },
    { x: -21, y: -6 },
    { x: -11, y: -11 },
    { x: 1, y: -12.5 },
    { x: 13, y: -9.5 },
    { x: 21, y: -5.4 },
    { x: 26, y: -2 },
    { x: 26, y: 2 },
    { x: 21, y: 5.4 },
    { x: 13, y: 9.5 },
    { x: 1, y: 12.5 },
    { x: -11, y: 11 },
    { x: -20, y: 6.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -3.6 * s, 34 * s, -8.4 * s, 29.5 * s, 0);
  g.fillTriangle(26 * s, 3.6 * s, 34 * s, 8.4 * s, 29.5 * s, 0);
  g.lineStyle(1.4 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(26 * s, -3.6 * s, 34 * s, -8.4 * s, 29.5 * s, 0);
  g.strokeTriangle(26 * s, 3.6 * s, 34 * s, 8.4 * s, 29.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6.4 * s, -13 * s, 15 * s, 0, 9.5 * s);
  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-8 * s, 6.4 * s, -13 * s, 15 * s, 0, 9.5 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 11.5 * s, 0, 19 * s, 9 * s, 12.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -21, y: -6 },
    { x: -11, y: -11 },
    { x: 1, y: -12.5 },
    { x: 13, y: -9.5 },
    { x: 21, y: -5.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // Pale, chain-like rectangular blotches clustered on the head and
  // upper flank - the real Black Grouper's own pattern.
  g.fillStyle(blotchColor, 0.4 * alpha);
  [
    [-13, -6, 3, 1.6],
    [-6, -7.5, 3.2, 1.6],
    [1, -8, 3, 1.6],
    [-15, -1, 2.6, 1.4],
    [-8, -2, 2.8, 1.4]
  ].forEach(([bx, by, bw, bh]) => g.fillEllipse(bx * s, by * s, bw * s, bh * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -12 * s, 12 * s, -10 * s, 2 * s, -19.5 * s);
  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-8 * s, -12 * s, 12 * s, -10 * s, 2 * s, -19.5 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-13 * s, -8.5 * s);
  g.lineTo(-12 * s, 8.5 * s);
  g.strokePath();

  g.fillStyle(0x9ca090, alpha);
  g.fillCircle(-16 * s, -3.6 * s, 2.6 * s);
  g.fillStyle(0x0a0c08, alpha);
  g.fillCircle(-15.6 * s, -3.6 * s, 1.4 * s);

  g.restore();
}

// A scamp - another real close Mycteroperca relative in this same
// grouper cluster, told apart by two genuine field marks: dense, small,
// dark spots scattered evenly over the entire body (finer and far more
// numerous than the sparse blotches on the Black Grouper, and unlike the
// Gag Grouper's wandering vermiculations), and - the real animal's own
// famous adult trait - long, trailing filament streamers extending off
// the tips of the tail fin, a construction unique to this fish's tail.
export function drawScamp(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xac9868;
  const backColor = 0x746038;
  const bellyColor = 0xd8c8a0;
  const finColor = 0x8c7848;
  const darkColor = 0x342a14;
  const spotColor = 0x3c3018;

  const body = [
    { x: -22, y: 1.5 },
    { x: -19, y: -5.6 },
    { x: -10, y: -10.2 },
    { x: 1, y: -11.6 },
    { x: 12, y: -8.8 },
    { x: 19, y: -5 },
    { x: 24, y: -1.9 },
    { x: 24, y: 1.9 },
    { x: 19, y: 5 },
    { x: 12, y: 8.8 },
    { x: 1, y: 11.6 },
    { x: -10, y: 10.2 },
    { x: -18, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The tail, with long trailing filament streamers off both tips - the
  // real Scamp's own famous adult field mark.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -3.4 * s, 31 * s, -7.8 * s, 27.5 * s, -0.6 * s);
  g.fillTriangle(24 * s, 3.4 * s, 31 * s, 7.8 * s, 27.5 * s, 0.6 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(24 * s, -3.4 * s, 31 * s, -7.8 * s, 27.5 * s, -0.6 * s);
  g.strokeTriangle(24 * s, 3.4 * s, 31 * s, 7.8 * s, 27.5 * s, 0.6 * s);
  g.lineStyle(1.1 * s, finColor, 0.85 * alpha);
  g.beginPath();
  g.moveTo(31 * s, -7.8 * s);
  quadCurveTo(g, 31 * s, -7.8 * s, 36 * s, -10 * s, 40 * s, -8 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(31 * s, 7.8 * s);
  quadCurveTo(g, 31 * s, 7.8 * s, 36 * s, 10 * s, 40 * s, 8 * s);
  g.strokePath();

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 6 * s, -12 * s, 14 * s, 0.5 * s, 9 * s);
  g.fillTriangle(4 * s, 10.8 * s, 0.5 * s, 18 * s, 9 * s, 11.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -19, y: -5.6 },
    { x: -10, y: -10.2 },
    { x: 1, y: -11.6 },
    { x: 12, y: -8.8 },
    { x: 19, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.6 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // Dense, small, dark spots scattered evenly over the entire body - the
  // real Scamp's own field mark.
  g.fillStyle(spotColor, 0.5 * alpha);
  for (let i = 0; i < 26; i += 1) {
    const px = -17 + (i % 7) * 5.6 + (Math.floor(i / 7) % 2) * 2.2;
    const py = -8 + Math.floor(i / 7) * 4;
    g.fillCircle(px * s, py * s, 0.8 * s);
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, -11 * s, 11 * s, -9.2 * s, 2 * s, -17.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-7 * s, -11 * s, 11 * s, -9.2 * s, 2 * s, -17.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-11.5 * s, -7.5 * s);
  g.lineTo(-10.5 * s, 7.5 * s);
  g.strokePath();

  g.fillStyle(0xe0d0a8, alpha);
  g.fillCircle(-14.5 * s, -3.2 * s, 2.4 * s);
  g.fillStyle(0x140e06, alpha);
  g.fillCircle(-14.1 * s, -3.2 * s, 1.3 * s);

  g.restore();
}

// A warsaw grouper - one of the largest groupers there is, a real deep-
// water giant, built massively robust and dark reddish-brown to near-
// black, with the real animal's own genuine field mark: a visibly
// elongated second dorsal spine, standing noticeably taller than every
// spine around it - a subtle but real diagnostic trait, not a dramatic
// sail. Only ever found deep.
export function drawWarsawGrouper(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x5c3830;
  const backColor = 0x2c1a16;
  const bellyColor = 0x8a5c50;
  const finColor = 0x3c2420;
  const darkColor = 0x140c0a;

  const body = [
    { x: -27, y: 2 },
    { x: -24, y: -7 },
    { x: -13, y: -13.5 },
    { x: 1, y: -15.5 },
    { x: 15, y: -12 },
    { x: 24, y: -6.6 },
    { x: 29.5, y: -2.4 },
    { x: 29.5, y: 2.4 },
    { x: 24, y: 6.6 },
    { x: 15, y: 12 },
    { x: 1, y: 15.5 },
    { x: -13, y: 13.5 },
    { x: -23, y: 8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillEllipse(38 * s, 0, 12 * s, 10.5 * s);
  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokeEllipse(38 * s, 0, 12 * s, 10.5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 7.4 * s, -15 * s, 17.5 * s, 0.5 * s, 11 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 7.4 * s, -15 * s, 17.5 * s, 0.5 * s, 11 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(5 * s, 13.5 * s, 1 * s, 22 * s, 10.5 * s, 14.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -24, y: -7 },
    { x: -13, y: -13.5 },
    { x: 1, y: -15.5 },
    { x: 15, y: -12 },
    { x: 24, y: -6.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 7 * s }))
  );
  g.fillStyle(backColor, 0.5 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.4 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The dorsal fin, its second spine drawn visibly taller than the ones
  // around it - the real Warsaw Grouper's own genuine, if subtle, field
  // mark.
  g.fillStyle(finColor, alpha);
  const spineBase = [
    { x: -9, y: -13.6 },
    { x: -3, y: -15.4 },
    { x: 3, y: -15.7 },
    { x: 9, y: -14.8 },
    { x: 15, y: -12.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const spineTallness = [7, 12, 6.5, 6, 5.5];
  for (let i = 0; i < spineBase.length - 1; i += 1) {
    const b0 = spineBase[i];
    const b1 = spineBase[i + 1];
    const tipX = (b0.x + b1.x) / 2;
    const tipY = Math.min(b0.y, b1.y) - spineTallness[i] * s;
    g.fillTriangle(b0.x, b0.y, b1.x, b1.y, tipX, tipY);
  }
  g.fillTriangle(15 * s, -12.6 * s, 22 * s, -9 * s, 18 * s, -18.5 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-15 * s, -9.5 * s);
  g.lineTo(-14 * s, 9.5 * s);
  g.strokePath();

  g.fillStyle(0x907068, alpha);
  g.fillCircle(-18.5 * s, -4.4 * s, 3 * s);
  g.fillStyle(0x0a0604, alpha);
  g.fillCircle(-18 * s, -4.4 * s, 1.6 * s);

  g.restore();
}

// A red drum - a real, copper-bronze croaker relative, built plain apart
// from the real animal's own single unmistakable field mark: a bold,
// dark eyespot at the base of the tail, ringed with a paler halo -
// drawn as genuine concentric circles rather than a solid blotch, a
// different construction from any other tail marking in the game.
export function drawRedDrum(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc07850;
  const backColor = 0x944e2c;
  const bellyColor = 0xe8c0a0;
  const finColor = 0xa8623c;
  const darkColor = 0x481c0c;
  const spotColor = 0x1c0e06;
  const haloColor = 0xf0dcc4;

  const body = [
    { x: -23, y: 1.4 },
    { x: -20, y: -6.4 },
    { x: -10, y: -11.5 },
    { x: 2, y: -13 },
    { x: 14, y: -10 },
    { x: 21, y: -5.6 },
    { x: 25, y: -2 },
    { x: 25, y: 2 },
    { x: 21, y: 5.6 },
    { x: 14, y: 10 },
    { x: 2, y: 13 },
    { x: -10, y: 11.5 },
    { x: -19, y: 6.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -3.8 * s, 33.5 * s, -9.2 * s, 28.5 * s, 0);
  g.fillTriangle(25 * s, 3.8 * s, 33.5 * s, 9.2 * s, 28.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(25 * s, -3.8 * s, 33.5 * s, -9.2 * s, 28.5 * s, 0);
  g.strokeTriangle(25 * s, 3.8 * s, 33.5 * s, 9.2 * s, 28.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6.6 * s, -13 * s, 15.5 * s, 0, 9.5 * s);
  g.fillTriangle(4 * s, 11.8 * s, 0, 19.5 * s, 9 * s, 12.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -20, y: -6.4 },
    { x: -10, y: -11.5 },
    { x: 2, y: -13 },
    { x: 14, y: -10 },
    { x: 21, y: -5.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // The bold, dark eyespot at the base of the tail, ringed with a paler
  // halo - genuine concentric circles, the real Red Drum's own single
  // unmistakable field mark.
  g.fillStyle(haloColor, 0.6 * alpha);
  g.fillCircle(18 * s, -1 * s, 4.6 * s);
  g.fillStyle(spotColor, 0.85 * alpha);
  g.fillCircle(18 * s, -1 * s, 3 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, -12.4 * s, 12 * s, -10.3 * s, 2.5 * s, -19.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-7 * s, -12.4 * s, 12 * s, -10.3 * s, 2.5 * s, -19.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-12.5 * s, -8.5 * s);
  g.lineTo(-11.5 * s, 8.5 * s);
  g.strokePath();

  g.fillStyle(0xecd0b8, alpha);
  g.fillCircle(-15.5 * s, -3.6 * s, 2.5 * s);
  g.fillStyle(0x180c04, alpha);
  g.fillCircle(-15.1 * s, -3.6 * s, 1.35 * s);

  g.restore();
}

// A black drum - a real, deep-bodied croaker relative, told apart by the
// real animal's own single unmistakable field mark: a row of fleshy
// whisker-like barbels hanging beneath the chin - a construction unique
// to this fish in the game, used to feel for shellfish and crustaceans
// in the mud. Dark grey-black body with faint vertical bars.
export function drawBlackDrum(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x60646c;
  const backColor = 0x2c2e34;
  const bellyColor = 0x9298a0;
  const finColor = 0x40444a;
  const darkColor = 0x181a1e;
  const barColor = 0x34363c;
  const barbelColor = 0x50545a;

  const body = [
    { x: -20, y: 1.6 },
    { x: -17, y: -7 },
    { x: -7, y: -13 },
    { x: 5, y: -14.8 },
    { x: 17, y: -11 },
    { x: 24, y: -6 },
    { x: 28, y: -2.2 },
    { x: 28, y: 2.2 },
    { x: 24, y: 6 },
    { x: 17, y: 11 },
    { x: 5, y: 14.8 },
    { x: -7, y: 13 },
    { x: -16, y: 7.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(28 * s, -4 * s, 37 * s, -9.5 * s, 31.5 * s, 0);
  g.fillTriangle(28 * s, 4 * s, 37 * s, 9.5 * s, 31.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(28 * s, -4 * s, 37 * s, -9.5 * s, 31.5 * s, 0);
  g.strokeTriangle(28 * s, 4 * s, 37 * s, 9.5 * s, 31.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 8 * s, -10 * s, 18 * s, 2 * s, 11.5 * s);
  g.fillTriangle(7 * s, 13.5 * s, 3 * s, 22 * s, 12.5 * s, 15 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Faint vertical bars.
  g.fillStyle(barColor, 0.3 * alpha);
  [-8, -1, 8, 15].forEach((bx) => g.fillEllipse(bx * s, 0, 2.6 * s, 11 * s));

  const topProfile = [
    { x: -17, y: -7 },
    { x: -7, y: -13 },
    { x: 5, y: -14.8 },
    { x: 17, y: -11 },
    { x: 24, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 6 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -13.5 * s, 12 * s, -11 * s, 3 * s, -21.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-6 * s, -13.5 * s, 12 * s, -11 * s, 3 * s, -21.5 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-11 * s, -9.5 * s);
  g.lineTo(-10 * s, 9.5 * s);
  g.strokePath();

  // The row of fleshy whisker-like barbels hanging beneath the chin -
  // the real Black Drum's own single unmistakable field mark, and a
  // construction unique to this fish.
  g.lineStyle(0.9 * s, barbelColor, 0.8 * alpha);
  for (let i = 0; i < 4; i += 1) {
    const bx = -16 + i * 1.6;
    g.beginPath();
    g.moveTo(bx * s, 5.5 * s);
    g.lineTo((bx + 0.3) * s, (9 + (i % 2)) * s);
    g.strokePath();
  }

  g.fillStyle(0x8c9098, alpha);
  g.fillCircle(-13 * s, -3.8 * s, 2.7 * s);
  g.fillStyle(0x0a0c0e, alpha);
  g.fillCircle(-12.6 * s, -3.8 * s, 1.45 * s);

  g.restore();
}

// A spotted seatrout - a real Cynoscion "trout" (a drum relative, not a
// true trout), silvery-lavender over a paler belly, with the real
// animal's own field mark given full prominence: distinct round black
// spots scattered not just across the back, but continuing onto the
// dorsal and tail fins themselves - a real trait most other spotted fish
// here don't share, since their spots stop at the body's own edge.
// Prominent canine teeth, a real family trait.
export function drawSpottedSeatrout(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa8b0c0;
  const backColor = 0x6c7890;
  const bellyColor = 0xe8ecf0;
  const finColor = 0x8c96a8;
  const darkColor = 0x30363e;
  const spotColor = 0x1c1e20;
  const toothColor = 0xf2f0ea;

  const body = [
    { x: -21, y: 1.2 },
    { x: -19, y: -5.6 },
    { x: -10, y: -10 },
    { x: 1, y: -11.4 },
    { x: 13, y: -8.8 },
    { x: 20, y: -5 },
    { x: 24, y: -1.8 },
    { x: 24, y: 1.8 },
    { x: 20, y: 5 },
    { x: 13, y: 8.8 },
    { x: 1, y: 11.4 },
    { x: -10, y: 10 },
    { x: -18, y: 5.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -3.4 * s, 32 * s, -8 * s, 27.5 * s, 0);
  g.fillTriangle(24 * s, 3.4 * s, 32 * s, 8 * s, 27.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(24 * s, -3.4 * s, 32 * s, -8 * s, 27.5 * s, 0);
  g.strokeTriangle(24 * s, 3.4 * s, 32 * s, 8 * s, 27.5 * s, 0);
  // Spots continuing onto the tail fin.
  g.fillStyle(spotColor, 0.65 * alpha);
  g.fillCircle(27 * s, -5 * s, 1 * s);
  g.fillCircle(29 * s, 3 * s, 0.9 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 5.8 * s, -12 * s, 13.5 * s, 0, 8.5 * s);
  g.fillTriangle(4 * s, 10.2 * s, 0.5 * s, 17 * s, 8.5 * s, 11.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -19, y: -5.6 },
    { x: -10, y: -10 },
    { x: 1, y: -11.4 },
    { x: 13, y: -8.8 },
    { x: 20, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.4 * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // Distinct round black spots scattered across the back.
  g.fillStyle(spotColor, 0.75 * alpha);
  [
    [-6, -6.5, 1.1],
    [1, -8, 1.1],
    [8, -6.5, 1],
    [14, -4.5, 0.9],
    [-2, -3, 1],
    [5, -1.5, 1],
    [11, -0.5, 0.9]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -10.9 * s, 10 * s, -9.2 * s, 2 * s, -17 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-5 * s, -10.9 * s, 10 * s, -9.2 * s, 2 * s, -17 * s);
  // Spots continuing onto the dorsal fin.
  g.fillStyle(spotColor, 0.6 * alpha);
  g.fillCircle(0, -12.5 * s, 0.8 * s);
  g.fillCircle(4 * s, -12 * s, 0.8 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-11 * s, -7.4 * s);
  g.lineTo(-10 * s, 7.4 * s);
  g.strokePath();

  // Prominent canine teeth, a real family trait.
  g.fillStyle(toothColor, alpha);
  g.fillTriangle(-20.5 * s, 1.2 * s, -18.5 * s, 2.4 * s, -19.5 * s, 4.4 * s);

  g.fillStyle(0xe4e8ec, alpha);
  g.fillCircle(-14.5 * s, -2.8 * s, 2.3 * s);
  g.fillStyle(0x0e1012, alpha);
  g.fillCircle(-14.1 * s, -2.8 * s, 1.25 * s);

  g.restore();
}

// A weakfish - a close real Cynoscion relative of the Spotted Seatrout
// here, but told genuinely apart: an iridescent green-purple sheen
// across the back (unlike the Seatrout's plain silvery-lavender), diffuse
// dark blotches arranged in wandering diagonal rows (not the Seatrout's
// clean round spots), and - the clearest contrast - no spotting on the
// fins at all, unlike the Seatrout's own spot-flecked dorsal and tail.
export function drawWeakfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa0acac;
  const backColor = 0x5c7268;
  const bellyColor = 0xe4e8e4;
  const finColor = 0x849086;
  const darkColor = 0x282e2a;
  const blotchColor = 0x445048;
  const sheenColor = 0x9068a0;
  const toothColor = 0xf0eee8;

  const body = [
    { x: -20, y: 1.2 },
    { x: -18, y: -5.4 },
    { x: -9, y: -9.6 },
    { x: 1.5, y: -11 },
    { x: 13, y: -8.4 },
    { x: 19, y: -4.8 },
    { x: 23, y: -1.7 },
    { x: 23, y: 1.7 },
    { x: 19, y: 4.8 },
    { x: 13, y: 8.4 },
    { x: 1.5, y: 11 },
    { x: -9, y: 9.6 },
    { x: -17, y: 5.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.3 * s, 30.5 * s, -7.7 * s, 26.5 * s, 0);
  g.fillTriangle(23 * s, 3.3 * s, 30.5 * s, 7.7 * s, 26.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(23 * s, -3.3 * s, 30.5 * s, -7.7 * s, 26.5 * s, 0);
  g.strokeTriangle(23 * s, 3.3 * s, 30.5 * s, 7.7 * s, 26.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6.5 * s, 5.6 * s, -11.5 * s, 13 * s, 0, 8.2 * s);
  g.fillTriangle(4 * s, 9.8 * s, 0.5 * s, 16.5 * s, 8 * s, 10.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // The iridescent green-purple sheen - the real Weakfish's own field
  // mark, unlike the Seatrout's plain silvery tone.
  g.fillStyle(sheenColor, 0.18 * alpha);
  g.fillEllipse(0, -2 * s, 18 * s, 6 * s);

  const topProfile = [
    { x: -18, y: -5.4 },
    { x: -9, y: -9.6 },
    { x: 1.5, y: -11 },
    { x: 13, y: -8.4 },
    { x: 19, y: -4.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.2 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // Diffuse dark blotches in wandering diagonal rows - not the
  // Seatrout's own clean round spots.
  g.lineStyle(1.4 * s, blotchColor, 0.4 * alpha);
  for (let i = 0; i < 4; i += 1) {
    const bx = -12 + i * 8;
    g.beginPath();
    g.moveTo(bx * s, -8 * s);
    quadCurveTo(g, bx * s, -8 * s, (bx + 3) * s, -3 * s, (bx + 5) * s, 2 * s);
    g.strokePath();
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4.5 * s, -10.5 * s, 9.5 * s, -8.8 * s, 2 * s, -16 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-4.5 * s, -10.5 * s, 9.5 * s, -8.8 * s, 2 * s, -16 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -7 * s);
  g.lineTo(-9 * s, 7 * s);
  g.strokePath();

  g.fillStyle(toothColor, alpha);
  g.fillTriangle(-19.5 * s, 1.1 * s, -17.7 * s, 2.2 * s, -18.6 * s, 4 * s);

  g.fillStyle(0xe0e4e0, alpha);
  g.fillCircle(-13.5 * s, -2.6 * s, 2.1 * s);
  g.fillStyle(0x0c0e0c, alpha);
  g.fillCircle(-13.1 * s, -2.6 * s, 1.15 * s);

  g.restore();
}

// A tarpon - an iconic silver gamefish, built with a construction
// nothing else in the game shares: huge, mirror-bright coin-sized
// scales (stippled as individual overlapping arcs, not a smooth fill),
// a dramatically upturned, bucket-like mouth with the lower jaw jutting
// up past the upper, a large eye, and the real animal's own single most
// famous field mark - one long, whip-like filament trailing off the very
// last ray of the dorsal fin, well past the rest of the fin's edge.
export function drawTarpon(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd4d8d4;
  const backColor = 0x848c88;
  const bellyColor = 0xf2f4f0;
  const finColor = 0xb8bcb4;
  const darkColor = 0x40443e;
  const scaleColor = 0xc0c4be;

  const body = [
    { x: -24, y: 1 },
    { x: -21, y: -6.4 },
    { x: -11, y: -11.5 },
    { x: 2, y: -13 },
    { x: 15, y: -10 },
    { x: 23, y: -5.6 },
    { x: 28, y: -2 },
    { x: 28, y: 2 },
    { x: 23, y: 5.6 },
    { x: 15, y: 10 },
    { x: 2, y: 13 },
    { x: -11, y: 11.5 },
    { x: -20, y: 7.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(28 * s, -4 * s, 38 * s, -10.5 * s, 32 * s, -0.4 * s);
  g.fillTriangle(28 * s, 4 * s, 38 * s, 10.5 * s, 32 * s, 0.4 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(28 * s, -4 * s, 38 * s, -10.5 * s, 32 * s, -0.4 * s);
  g.strokeTriangle(28 * s, 4 * s, 38 * s, 10.5 * s, 32 * s, 0.4 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 7.2 * s, -14 * s, 16.5 * s, 0.5 * s, 10.5 * s);
  g.fillTriangle(4 * s, 12.5 * s, 0.5 * s, 20.5 * s, 9.5 * s, 13.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Huge, mirror-bright coin-sized scales, stippled as overlapping arcs
  // - a construction nothing else in the game shares.
  g.lineStyle(0.8 * s, scaleColor, 0.4 * alpha);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const sx = -16 + col * 6.5 + (row % 2) * 3.2;
      const sy = -8 + row * 5.2;
      g.beginPath();
      g.arc(sx * s, sy * s, 3 * s, Math.PI * 0.15, Math.PI * 0.85);
      g.strokePath();
    }
  }

  const topProfile = [
    { x: -21, y: -6.4 },
    { x: -11, y: -11.5 },
    { x: 2, y: -13 },
    { x: 15, y: -10 },
    { x: 23, y: -5.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.4 * s }))
  );
  g.fillStyle(backColor, 0.3 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.55 * alpha);
  g.strokePoints(body, true);

  // The dorsal fin, with one long whip-like filament trailing off the
  // very last ray - the real Tarpon's own single most famous field mark.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -12.2 * s, 8 * s, -10.2 * s, 1 * s, -19.5 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-6 * s, -12.2 * s, 8 * s, -10.2 * s, 1 * s, -19.5 * s);
  g.lineStyle(1.2 * s, finColor, 0.9 * alpha);
  g.beginPath();
  g.moveTo(7 * s, -18.5 * s);
  quadCurveTo(g, 7 * s, -18.5 * s, 11 * s, -24 * s, 9 * s, -31 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-13 * s, -8.6 * s);
  g.lineTo(-12 * s, 8.6 * s);
  g.strokePath();

  // The dramatically upturned, bucket-like mouth, lower jaw jutting up
  // past the upper.
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-24 * s, 0.5 * s);
  quadCurveTo(g, -24 * s, 0.5 * s, -27 * s, -2.5 * s, -21 * s, -4.5 * s);
  g.strokePath();

  g.fillStyle(0xf0f2f0, alpha);
  g.fillCircle(-16 * s, -4.4 * s, 3 * s);
  g.fillStyle(0x0e100e, alpha);
  g.fillCircle(-15.5 * s, -4.4 * s, 1.6 * s);

  g.restore();
}

// A bonefish - a real, iconic flats gamefish, built around the real
// animal's own single defining feature: a pointed, conical, overhanging
// snout with the mouth set underneath it entirely (a real subterminal
// mouth, built for grubbing crustaceans out of sand) - a completely
// different head construction from any other fish here. Plain silver,
// no pattern at all, deeply forked tail.
export function drawBonefish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd0d4d4;
  const backColor = 0x98a0a0;
  const bellyColor = 0xf2f4f2;
  const finColor = 0xb8bcbc;
  const darkColor = 0x3c403e;

  // The pointed, conical, overhanging snout, with the mouth set entirely
  // beneath it - a completely different head construction from any
  // other fish here.
  const body = [
    { x: -24, y: -1.4 },
    { x: -26, y: 0.8 },
    { x: -22, y: 2.6 },
    { x: -18, y: 4.6 },
    { x: -8, y: 7 },
    { x: 3, y: 7.6 },
    { x: 14, y: 6 },
    { x: 20, y: 3 },
    { x: 20, y: -3 },
    { x: 14, y: -6 },
    { x: 3, y: -7.6 },
    { x: -8, y: -7 },
    { x: -18, y: -4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(20 * s, -2.6 * s, 30 * s, -8.5 * s, 24 * s, 0);
  g.fillTriangle(20 * s, 2.6 * s, 30 * s, 8.5 * s, 24 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(20 * s, -2.6 * s, 30 * s, -8.5 * s, 24 * s, 0);
  g.strokeTriangle(20 * s, 2.6 * s, 30 * s, 8.5 * s, 24 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 6.8 * s, -8 * s, 14.5 * s, 3 * s, 9 * s);
  g.fillTriangle(6 * s, 10.5 * s, 3 * s, 17 * s, 10.5 * s, 11.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -18, y: -4.6 },
    { x: -8, y: -7 },
    { x: 3, y: -7.6 },
    { x: 14, y: -6 },
    { x: 20, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3 * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -7.7 * s, 6 * s, -6.6 * s, 1 * s, -13 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -7.7 * s, 6 * s, -6.6 * s, 1 * s, -13 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -5 * s);
  g.lineTo(-8 * s, 5 * s);
  g.strokePath();

  // The subterminal mouth, set entirely beneath the overhanging snout.
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-25.5 * s, 0.6 * s);
  g.lineTo(-20 * s, 3.6 * s);
  g.strokePath();

  g.fillStyle(0xecefef, alpha);
  g.fillCircle(-15 * s, -1.2 * s, 2.1 * s);
  g.fillStyle(0x0c0e0e, alpha);
  g.fillCircle(-14.6 * s, -1.2 * s, 1.15 * s);

  g.restore();
}

// A permit - built with a construction nothing else in the game shares:
// an extremely deep, laterally compressed, almost disc-shaped body -
// the deepest body-to-length ratio of any fish here, roughly circular
// rather than any kind of torpedo or elongated shape - with long,
// trailing, sickle-shaped dorsal AND anal fins both sweeping well past
// the body's own trailing edge. Silvery, with a real warm yellow-orange
// tinge low on the belly and pelvic fin.
export function drawPermit(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd8dcdc;
  const backColor = 0x9098a0;
  const bellyColor = 0xf4d888;
  const finColor = 0xb4bcbc;
  const darkColor = 0x3c4044;

  // The extremely deep, almost disc-shaped body - the deepest ratio of
  // any fish here.
  const body = [
    { x: -16, y: 0 },
    { x: -13, y: -10 },
    { x: -3, y: -17.5 },
    { x: 9, y: -18.5 },
    { x: 18, y: -12.5 },
    { x: 22, y: -4 },
    { x: 22, y: 4 },
    { x: 18, y: 12.5 },
    { x: 9, y: 18.5 },
    { x: -3, y: 17.5 },
    { x: -13, y: 10 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(22 * s, -3.4 * s, 32 * s, -8.5 * s, 26 * s, 0);
  g.fillTriangle(22 * s, 3.4 * s, 32 * s, 8.5 * s, 26 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(22 * s, -3.4 * s, 32 * s, -8.5 * s, 26 * s, 0);
  g.strokeTriangle(22 * s, 3.4 * s, 32 * s, 8.5 * s, 26 * s, 0);

  // The yellow-orange tinged pelvic fin.
  g.fillStyle(bellyColor, alpha);
  g.fillTriangle(-3 * s, 12 * s, -7 * s, 21 * s, 4 * s, 14.5 * s);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokeTriangle(-3 * s, 12 * s, -7 * s, 21 * s, 4 * s, 14.5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 8 * s, -14 * s, 16.5 * s, -2 * s, 10.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -13, y: -10 },
    { x: -3, y: -17.5 },
    { x: 9, y: -18.5 },
    { x: 18, y: -12.5 },
    { x: 22, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.3 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // The long, trailing, sickle-shaped second dorsal fin, sweeping well
  // past the body's own trailing edge.
  {
    const angle = 0.42;
    const len = 22;
    const bow = 9;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 9;
    const left = [];
    const right = [];
    const baseX = 2;
    const baseY = -17.5;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (2.6 - tt * 2.3) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.55 * alpha);
    g.strokePoints(shape, true);
  }

  // The matching long, trailing, sickle-shaped anal fin.
  {
    const angle = -0.42;
    const len = 20;
    const bow = 8;
    const dx = Math.sin(angle);
    const dy = Math.cos(angle);
    const px = Math.cos(angle);
    const py = -Math.sin(angle);
    const steps = 9;
    const left = [];
    const right = [];
    const baseX = 1;
    const baseY = 17.5;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (2.4 - tt * 2.1) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.55 * alpha);
    g.strokePoints(shape, true);
  }

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-6 * s, -13 * s);
  g.lineTo(-4 * s, 13 * s);
  g.strokePath();

  g.fillStyle(0xecefef, alpha);
  g.fillCircle(-9 * s, -6 * s, 2.4 * s);
  g.fillStyle(0x0c0e0e, alpha);
  g.fillCircle(-8.6 * s, -6 * s, 1.3 * s);

  g.restore();
}

// A striped bass - a real Morone bass, silvery, with the animal's own
// unmistakable field mark: 7-8 bold dark horizontal stripes running the
// entire body length - a completely different orientation from the
// vertical bars used on other fish here. Two clearly separate dorsal
// fins, a real Morone trait.
export function drawStripedBass(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4ccd0;
  const backColor = 0x6c7880;
  const bellyColor = 0xf0f2f0;
  const finColor = 0x8c96a0;
  const darkColor = 0x2c343a;
  const stripeColor = 0x282e34;

  const body = [
    { x: -22, y: 1.4 },
    { x: -20, y: -6 },
    { x: -10, y: -10.8 },
    { x: 1.5, y: -12.2 },
    { x: 13, y: -9.4 },
    { x: 20, y: -5.2 },
    { x: 24, y: -1.9 },
    { x: 24, y: 1.9 },
    { x: 20, y: 5.2 },
    { x: 13, y: 9.4 },
    { x: 1.5, y: 12.2 },
    { x: -10, y: 10.8 },
    { x: -19, y: 6.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -3.6 * s, 32 * s, -8.5 * s, 27.5 * s, 0);
  g.fillTriangle(24 * s, 3.6 * s, 32 * s, 8.5 * s, 27.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(24 * s, -3.6 * s, 32 * s, -8.5 * s, 27.5 * s, 0);
  g.strokeTriangle(24 * s, 3.6 * s, 32 * s, 8.5 * s, 27.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 6.2 * s, -12 * s, 14.5 * s, 0, 9 * s);
  g.fillTriangle(4 * s, 11 * s, 0.5 * s, 18 * s, 9 * s, 12 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -20, y: -6 },
    { x: -10, y: -10.8 },
    { x: 1.5, y: -12.2 },
    { x: 13, y: -9.4 },
    { x: 20, y: -5.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.6 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // 7-8 bold dark horizontal stripes running the entire body length -
  // the real Striped Bass's own unmistakable field mark.
  g.lineStyle(1.2 * s, stripeColor, 0.6 * alpha);
  [-8, -5.4, -2.8, 0, 2.8, 5.4, 8].forEach((sy) => {
    g.beginPath();
    g.moveTo(-19 * s, sy * 0.65 * s);
    g.lineTo(22 * s, sy * s);
    g.strokePath();
  });

  // A clearly separate first dorsal - a real Morone trait, spaced apart
  // from a second, softer dorsal.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -11.6 * s, 5 * s, -10.6 * s, -0.5 * s, -19 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-6 * s, -11.6 * s, 5 * s, -10.6 * s, -0.5 * s, -19 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(8 * s, -9.4 * s, 15 * s, -7.4 * s, 11.5 * s, -14 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(8 * s, -9.4 * s, 15 * s, -7.4 * s, 11.5 * s, -14 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-11.5 * s, -8 * s);
  g.lineTo(-10.5 * s, 8 * s);
  g.strokePath();

  g.fillStyle(0xe8ecec, alpha);
  g.fillCircle(-15 * s, -3.2 * s, 2.4 * s);
  g.fillStyle(0x101416, alpha);
  g.fillCircle(-14.6 * s, -3.2 * s, 1.3 * s);

  g.restore();
}

// A sheepshead - a real, unmistakably marked reef and structure fish:
// bold black vertical bars over a silvery body (unlike any striped fish
// here), and the real animal's own single most famous field mark -
// distinctly flat, blunt, human-like teeth visible in the mouth, a
// genuinely different dental construction from any tusk or canine used
// elsewhere in the game.
export function drawSheepshead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd0d4d0;
  const backColor = 0x848c88;
  const bellyColor = 0xf0f2ee;
  const finColor = 0x8c9088;
  const darkColor = 0x30362c;
  const barColor = 0x202822;
  const toothColor = 0xf4f0e8;

  const body = [
    { x: -18, y: 1.4 },
    { x: -16, y: -6.6 },
    { x: -6, y: -11 },
    { x: 5, y: -12 },
    { x: 15, y: -8.8 },
    { x: 21, y: -4.8 },
    { x: 24, y: -1.8 },
    { x: 24, y: 1.8 },
    { x: 21, y: 4.8 },
    { x: 15, y: 8.8 },
    { x: 5, y: 12 },
    { x: -6, y: 11 },
    { x: -15, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(0x8c9088, alpha);
  g.fillTriangle(24 * s, -3.6 * s, 32 * s, -8.5 * s, 27.5 * s, 0);
  g.fillTriangle(24 * s, 3.6 * s, 32 * s, 8.5 * s, 27.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(24 * s, -3.6 * s, 32 * s, -8.5 * s, 27.5 * s, 0);
  g.strokeTriangle(24 * s, 3.6 * s, 32 * s, 8.5 * s, 27.5 * s, 0);

  g.fillStyle(0x8c9088, alpha);
  g.fillTriangle(-5 * s, 7 * s, -10 * s, 15.5 * s, 1.5 * s, 9.5 * s);
  g.fillTriangle(6 * s, 11 * s, 2 * s, 18.5 * s, 10.5 * s, 12 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Bold black vertical bars - the real Sheepshead's own body pattern.
  g.fillStyle(barColor, 0.55 * alpha);
  [-9, -2, 5, 12].forEach((bx) => g.fillEllipse(bx * s, 0, 2.4 * s, 10 * s));

  const topProfile = [
    { x: -16, y: -6.6 },
    { x: -6, y: -11 },
    { x: 5, y: -12 },
    { x: 15, y: -8.8 },
    { x: 21, y: -4.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.3 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(0x8c9088, alpha);
  g.fillTriangle(-4 * s, -11.4 * s, 13 * s, -9.4 * s, 4.5 * s, -18.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-4 * s, -11.4 * s, 13 * s, -9.4 * s, 4.5 * s, -18.5 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -8.5 * s);
  g.lineTo(-9 * s, 8.5 * s);
  g.strokePath();

  // The distinctly flat, blunt, human-like teeth - the real Sheepshead's
  // own single most famous field mark.
  g.fillStyle(darkColor, 0.6 * alpha);
  g.fillEllipse(-17.5 * s, 1.6 * s, 2.4 * s, 1.8 * s);
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const tx = -18.6 + i * 0.9;
    g.fillRect(tx * s, 0.7 * s, 0.7 * s, 1.1 * s);
  }

  g.fillStyle(0xecf0ec, alpha);
  g.fillCircle(-11.5 * s, -3.6 * s, 2.4 * s);
  g.fillStyle(0x0c0e0c, alpha);
  g.fillCircle(-11.1 * s, -3.6 * s, 1.3 * s);

  g.restore();
}

// A hogfish - a real, large wrasse built around its own genuine field
// mark: a long, pointed, downward-angled pig-like snout (the real detail
// the species is named for, used to root crustaceans out of rubble), a
// raised, sail-like leading edge on the first dorsal formed by its own
// three elongated front spines - a shorter, broader shape than the
// Dhufish's own thin trailing whip filaments, a genuinely different
// technique - and salmon-pink coloring with a dark saddle blotch near
// the tail.
export function drawHogfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe8a898;
  const backColor = 0xc06858;
  const bellyColor = 0xf6dcd0;
  const finColor = 0xd88c78;
  const darkColor = 0x581c10;
  const saddleColor = 0x30100a;

  // The long, pointed, downward-angled pig-like snout.
  const body = [
    { x: -25, y: 2.4 },
    { x: -21, y: -4.6 },
    { x: -10, y: -10 },
    { x: 2, y: -12 },
    { x: 14, y: -9 },
    { x: 21, y: -5 },
    { x: 25, y: -1.8 },
    { x: 25, y: 1.8 },
    { x: 21, y: 5 },
    { x: 14, y: 9 },
    { x: 2, y: 12 },
    { x: -10, y: 10 },
    { x: -18, y: 5.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -3.6 * s, 33 * s, -8.5 * s, 28 * s, 0);
  g.fillTriangle(25 * s, 3.6 * s, 33 * s, 8.5 * s, 28 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(25 * s, -3.6 * s, 33 * s, -8.5 * s, 28 * s, 0);
  g.strokeTriangle(25 * s, 3.6 * s, 33 * s, 8.5 * s, 28 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 5.6 * s, -11 * s, 13.5 * s, 1 * s, 8.5 * s);
  g.fillTriangle(4 * s, 10.2 * s, 0.5 * s, 17 * s, 9 * s, 11.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -21, y: -4.6 },
    { x: -10, y: -10 },
    { x: 2, y: -12 },
    { x: 14, y: -9 },
    { x: 21, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.4 * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // The dark saddle blotch near the tail.
  g.fillStyle(saddleColor, 0.45 * alpha);
  g.fillEllipse(16 * s, -2 * s, 4 * s, 5.5 * s);

  // The raised, sail-like leading edge formed by three elongated front
  // dorsal spines - broader and shorter than the Dhufish's own thin
  // trailing whip filaments, a genuinely different technique.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -5, y: -11.4 },
      { x: -3, y: -21 },
      { x: 1, y: -23.5 },
      { x: 5, y: -21.5 },
      { x: 7, y: -18 },
      { x: 12, y: -9.2 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(
    [
      { x: -5, y: -11.4 },
      { x: -3, y: -21 },
      { x: 1, y: -23.5 },
      { x: 5, y: -21.5 },
      { x: 7, y: -18 },
      { x: 12, y: -9.2 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    false
  );

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-14 * s, -6.8 * s);
  g.lineTo(-13 * s, 6.8 * s);
  g.strokePath();

  g.fillStyle(0xf4d8c4, alpha);
  g.fillCircle(-17 * s, -2.4 * s, 2.4 * s);
  g.fillStyle(0x180c04, alpha);
  g.fillCircle(-16.6 * s, -2.4 * s, 1.3 * s);

  g.restore();
}

// A florida pompano - a real, close relative of the Permit here, but a
// distinctly smaller, more elongated body (nowhere near the Permit's own
// extreme disc-shaped depth), a more saturated golden-yellow throat and
// belly, and shorter, less dramatic sickle fins.
export function drawFloridaPompano(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd4d8d4;
  const backColor = 0x8890a0;
  const bellyColor = 0xf0d868;
  const finColor = 0xb4bcbc;
  const darkColor = 0x3c4044;

  const body = [
    { x: -19, y: 0.6 },
    { x: -17, y: -6.4 },
    { x: -8, y: -11 },
    { x: 3, y: -12.4 },
    { x: 13, y: -9.2 },
    { x: 20, y: -5 },
    { x: 23, y: -1.8 },
    { x: 23, y: 1.8 },
    { x: 20, y: 5 },
    { x: 13, y: 9.2 },
    { x: 3, y: 12.4 },
    { x: -8, y: 11 },
    { x: -16, y: 5.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.4 * s, 31 * s, -8 * s, 26.5 * s, 0);
  g.fillTriangle(23 * s, 3.4 * s, 31 * s, 8 * s, 26.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(23 * s, -3.4 * s, 31 * s, -8 * s, 26.5 * s, 0);
  g.strokeTriangle(23 * s, 3.4 * s, 31 * s, 8 * s, 26.5 * s, 0);

  // The golden-yellow throat and belly - more saturated than the
  // Permit's own subtler tinge.
  g.fillStyle(bellyColor, alpha);
  g.fillTriangle(-3 * s, 8.5 * s, -6 * s, 15.5 * s, 3.5 * s, 10.5 * s);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokeTriangle(-3 * s, 8.5 * s, -6 * s, 15.5 * s, 3.5 * s, 10.5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 5.6 * s, -11 * s, 12 * s, -1.5 * s, 7.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -17, y: -6.4 },
    { x: -8, y: -11 },
    { x: 3, y: -12.4 },
    { x: 13, y: -9.2 },
    { x: 20, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.3 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // Short, less dramatic sickle second dorsal - a scaled-down version of
  // the Permit's own extended trailing fin.
  {
    const angle = 0.34;
    const len = 13;
    const bow = 5;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 8;
    const left = [];
    const right = [];
    const baseX = 2;
    const baseY = -12.4;
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (baseX + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const w = (2.2 - tt * 1.9) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.5 * alpha);
    g.strokePoints(shape, true);
  }

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9.5 * s, -7.6 * s);
  g.lineTo(-8.5 * s, 7.6 * s);
  g.strokePath();

  g.fillStyle(0xecefef, alpha);
  g.fillCircle(-13 * s, -3.4 * s, 2.2 * s);
  g.fillStyle(0x0c0e0e, alpha);
  g.fillCircle(-12.6 * s, -3.4 * s, 1.2 * s);

  g.restore();
}

// A crevalle jack - a real, deep-bodied jack, told apart by two genuine
// field marks: a bold black spot on the gill cover (the operculum), and
// a second black spot at the base of the pectoral fin - a real Crevalle
// Jack diagnostic pair no other trevally or jack here carries both of.
export function drawCrevalleJack(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4ccc0;
  const backColor = 0x5c6c54;
  const bellyColor = 0xf0e8a8;
  const finColor = 0xacb4a0;
  const darkColor = 0x2c342a;
  const spotColor = 0x14180e;

  const body = [
    { x: -21, y: 1.6 },
    { x: -18, y: -6.8 },
    { x: -8, y: -12.5 },
    { x: 4, y: -14 },
    { x: 15, y: -10.5 },
    { x: 22, y: -6 },
    { x: 26, y: -2.2 },
    { x: 26, y: 2.2 },
    { x: 22, y: 6 },
    { x: 15, y: 10.5 },
    { x: 4, y: 14 },
    { x: -8, y: 12.5 },
    { x: -17, y: 7.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -4 * s, 35 * s, -9.5 * s, 29.5 * s, 0);
  g.fillTriangle(26 * s, 4 * s, 35 * s, 9.5 * s, 29.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(26 * s, -4 * s, 35 * s, -9.5 * s, 29.5 * s, 0);
  g.strokeTriangle(26 * s, 4 * s, 35 * s, 9.5 * s, 29.5 * s, 0);

  // The pectoral fin, with its own black spot at the base.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 6.4 * s, -12 * s, 16 * s, 1 * s, 9.5 * s);
  g.fillStyle(spotColor, 0.7 * alpha);
  g.fillCircle(-6.5 * s, 7.5 * s, 1.9 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(5 * s, 12.2 * s, 1 * s, 20 * s, 10.5 * s, 13.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -18, y: -6.8 },
    { x: -8, y: -12.5 },
    { x: 4, y: -14 },
    { x: 15, y: -10.5 },
    { x: 22, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.2 * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -12.9 * s, 13 * s, -10.6 * s, 3.5 * s, -20.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-6 * s, -12.9 * s, 13 * s, -10.6 * s, 3.5 * s, -20.5 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -9 * s);
  g.lineTo(-9 * s, 9 * s);
  g.strokePath();

  // The bold black spot on the gill cover - the real Crevalle Jack's own
  // first diagnostic mark.
  g.fillStyle(spotColor, 0.75 * alpha);
  g.fillCircle(-13.5 * s, -1 * s, 2.6 * s);

  g.fillStyle(0xe8ecdc, alpha);
  g.fillCircle(-15.5 * s, -4.6 * s, 2.5 * s);
  g.fillStyle(0x0e100a, alpha);
  g.fillCircle(-15.1 * s, -4.6 * s, 1.35 * s);

  g.restore();
}

// A ladyfish - a real, smaller, more slender relative of the Tarpon
// here (both from the same real order), built plain and simple by
// contrast: no oversized stippled scales, no trailing dorsal filament, a
// pointed head rather than a bucket mouth - just a slim, plain silver
// baitfish-shaped body and a deeply forked tail.
export function drawLadyfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xd8dcdc;
  const backColor = 0xa0a8ac;
  const bellyColor = 0xf4f4f2;
  const finColor = 0xbcc0c0;
  const darkColor = 0x484c4c;

  const body = [
    { x: -25, y: 0 },
    { x: -22, y: -3.2 },
    { x: -13, y: -5.8 },
    { x: -1, y: -6.8 },
    { x: 11, y: -6 },
    { x: 19, y: -3.8 },
    { x: 24, y: -1.6 },
    { x: 24, y: 1.6 },
    { x: 19, y: 3.8 },
    { x: 11, y: 6 },
    { x: -1, y: 6.8 },
    { x: -13, y: 5.8 },
    { x: -22, y: 3.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -2.4 * s, 33 * s, -9 * s, 27.5 * s, -0.3 * s);
  g.fillTriangle(24 * s, 2.4 * s, 33 * s, 9 * s, 27.5 * s, 0.3 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(24 * s, -2.4 * s, 33 * s, -9 * s, 27.5 * s, -0.3 * s);
  g.strokeTriangle(24 * s, 2.4 * s, 33 * s, 9 * s, 27.5 * s, 0.3 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 2.4 * s, -15 * s, 8.5 * s, -4 * s, 4.4 * s);
  g.fillTriangle(0, 6.4 * s, -3 * s, 11.5 * s, 5.5 * s, 7.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -22, y: -3.2 },
    { x: -13, y: -5.8 },
    { x: -1, y: -6.8 },
    { x: 11, y: -6 },
    { x: 19, y: -3.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 2.2 * s }))
  );
  g.fillStyle(backColor, 0.3 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-1.5 * s, -6.9 * s, 5 * s, -6.2 * s, 1.5 * s, -11.5 * s);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokeTriangle(-1.5 * s, -6.9 * s, 5 * s, -6.2 * s, 1.5 * s, -11.5 * s);

  g.lineStyle(1 * s, darkColor, 0.35 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, -3.8 * s);
  g.lineTo(-15 * s, 3.8 * s);
  g.strokePath();

  // A pointed head, rather than the Tarpon's own upturned bucket mouth.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-25 * s, -0.4 * s);
  g.lineTo(-22 * s, 1.4 * s);
  g.strokePath();

  g.fillStyle(0xeef0f0, alpha);
  g.fillCircle(-19 * s, -1.4 * s, 1.7 * s);
  g.fillStyle(0x0c0e0e, alpha);
  g.fillCircle(-18.65 * s, -1.4 * s, 0.95 * s);

  g.restore();
}

// A tripletail - built with a construction nothing else in the game
// shares: an unusually elongated, rounded soft dorsal AND anal fin, both
// sweeping back and rounding off right alongside the tail fin, all three
// similarly shaped and clustered together at the rear - the real trait
// that gives the species its name, since from a distance it looks like
// it has three separate tails. Dark mottled brown-olive camouflage
// coloring, a real deep, laterally compressed body, and an oddly
// concave head profile.
export function drawTripletail(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x685838;
  const backColor = 0x3c3220;
  const bellyColor = 0x968258;
  const finColor = 0x584a2c;
  const darkColor = 0x201a10;
  const mottleColor = 0x847052;

  const body = [
    { x: -14, y: -1 },
    { x: -12, y: -9 },
    { x: -3, y: -15.5 },
    { x: 8, y: -17 },
    { x: 15, y: -12 },
    { x: 19, y: -5 },
    { x: 19, y: 5 },
    { x: 15, y: 12 },
    { x: 8, y: 17 },
    { x: -3, y: 15.5 },
    { x: -12, y: 9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The real "three tails" - an elongated, rounded soft dorsal, an
  // elongated rounded anal fin, and the actual tail fin, all three
  // similarly rounded and clustered together at the rear.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: 6, y: -16.5 },
      { x: 15, y: -15 },
      { x: 24, y: -9 },
      { x: 26, y: -2 },
      { x: 19, y: -5 },
      { x: 15, y: -12 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(
    [
      { x: 6, y: -16.5 },
      { x: 15, y: -15 },
      { x: 24, y: -9 },
      { x: 26, y: -2 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    false
  );
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: 6, y: 16.5 },
      { x: 15, y: 15 },
      { x: 24, y: 9 },
      { x: 26, y: 2 },
      { x: 19, y: 5 },
      { x: 15, y: 12 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(
    [
      { x: 6, y: 16.5 },
      { x: 15, y: 15 },
      { x: 24, y: 9 },
      { x: 26, y: 2 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    false
  );
  g.fillStyle(finColor, alpha);
  g.fillEllipse(29 * s, 0, 9 * s, 9.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(29 * s, 0, 9 * s, 9.5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 4 * s, -13 * s, 12 * s, -1.5 * s, 6.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Dark mottled brown-olive camouflage blotching.
  g.fillStyle(mottleColor, 0.35 * alpha);
  [
    [-7, -6, 3],
    [0, -8, 3.4],
    [6, -5, 3],
    [-4, 4, 2.8],
    [3, 7, 3]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.5 * s, br * s));

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // The oddly concave head profile.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-13 * s, -6 * s);
  quadCurveTo(g, -13 * s, -6 * s, -16 * s, -2 * s, -14 * s, -1 * s);
  g.strokePath();

  g.fillStyle(0xb0a078, alpha);
  g.fillCircle(-9 * s, -5.4 * s, 2.3 * s);
  g.fillStyle(0x0e0c06, alpha);
  g.fillCircle(-8.6 * s, -5.4 * s, 1.25 * s);

  g.restore();
}

// An atlantic croaker - a real, small drum-family fish told apart by the
// real animal's own field marks: a short fringe of tiny, fine chin
// barbels (much finer and shorter than the Black Drum's own long,
// dangling ones), and golden-bronze coloring with dark wavy diagonal
// streaks arranged in rows down the flank.
export function drawAtlanticCroaker(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc8a868;
  const backColor = 0x8c7038;
  const bellyColor = 0xecd8a8;
  const finColor = 0xac8c50;
  const darkColor = 0x40300c;
  const streakColor = 0x5c4418;
  const barbelColor = 0x9c8050;

  const body = [
    { x: -16, y: 1.2 },
    { x: -14, y: -4.8 },
    { x: -6, y: -8.8 },
    { x: 3, y: -10 },
    { x: 12, y: -7.6 },
    { x: 17, y: -4.2 },
    { x: 20, y: -1.6 },
    { x: 20, y: 1.6 },
    { x: 17, y: 4.2 },
    { x: 12, y: 7.6 },
    { x: 3, y: 10 },
    { x: -6, y: 8.8 },
    { x: -13, y: 5.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(20 * s, -2.8 * s, 27 * s, -6.6 * s, 23 * s, 0);
  g.fillTriangle(20 * s, 2.8 * s, 27 * s, 6.6 * s, 23 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(20 * s, -2.8 * s, 27 * s, -6.6 * s, 23 * s, 0);
  g.strokeTriangle(20 * s, 2.8 * s, 27 * s, 6.6 * s, 23 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4.5 * s, 4.8 * s, -8 * s, 10.8 * s, 1.5 * s, 6.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -14, y: -4.8 },
    { x: -6, y: -8.8 },
    { x: 3, y: -10 },
    { x: 12, y: -7.6 },
    { x: 17, y: -4.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // Dark wavy diagonal streaks arranged in rows - the real Atlantic
  // Croaker's own body pattern.
  g.lineStyle(1 * s, streakColor, 0.5 * alpha);
  [-10, -5, 0, 5, 10].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -7 * s);
    g.lineTo((bx + 4) * s, 6 * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -9.8 * s, 6 * s, -8.4 * s, 1 * s, -14.5 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -9.8 * s, 6 * s, -8.4 * s, 1 * s, -14.5 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -6 * s);
  g.lineTo(-8 * s, 6 * s);
  g.strokePath();

  // The short fringe of tiny, fine chin barbels - much finer and
  // shorter than the Black Drum's own long, dangling ones.
  g.lineStyle(0.6 * s, barbelColor, 0.75 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const bx = -13.5 + i * 0.9;
    g.beginPath();
    g.moveTo(bx * s, 4.5 * s);
    g.lineTo(bx * s, 6.2 * s);
    g.strokePath();
  }

  g.fillStyle(0xf0e0b8, alpha);
  g.fillCircle(-10.5 * s, -2.6 * s, 2 * s);
  g.fillStyle(0x140e04, alpha);
  g.fillCircle(-10.15 * s, -2.6 * s, 1.1 * s);

  g.restore();
}

// A spot - a real, small drum-family fish told apart by the real
// animal's own single unmistakable field mark and namesake: one bold
// black spot sitting right behind the gill cover, at the shoulder -
// unlike any tail-based or mid-flank spot used on other fish here.
// Yellowish fins, faint diagonal bars.
export function drawSpot(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc8bc90;
  const backColor = 0x8c7c48;
  const bellyColor = 0xecdcb0;
  const finColor = 0xe0c860;
  const finDark = 0xa08830;
  const darkColor = 0x40340c;
  const barColor = 0x746438;
  const shoulderSpot = 0x100c04;

  const body = [
    { x: -13, y: 1 },
    { x: -11.5, y: -3.8 },
    { x: -5, y: -7 },
    { x: 2.5, y: -8 },
    { x: 10, y: -6 },
    { x: 14, y: -3.4 },
    { x: 16.5, y: -1.3 },
    { x: 16.5, y: 1.3 },
    { x: 14, y: 3.4 },
    { x: 10, y: 6 },
    { x: 2.5, y: 8 },
    { x: -5, y: 7 },
    { x: -10.5, y: 4.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(16.5 * s, -2.3 * s, 22 * s, -5.4 * s, 18.7 * s, 0);
  g.fillTriangle(16.5 * s, 2.3 * s, 22 * s, 5.4 * s, 18.7 * s, 0);
  g.lineStyle(1 * s, finDark, 0.55 * alpha);
  g.strokeTriangle(16.5 * s, -2.3 * s, 22 * s, -5.4 * s, 18.7 * s, 0);
  g.strokeTriangle(16.5 * s, 2.3 * s, 22 * s, 5.4 * s, 18.7 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 3.8 * s, -7 * s, 8.7 * s, 1 * s, 5.4 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -11.5, y: -3.8 },
    { x: -5, y: -7 },
    { x: 2.5, y: -8 },
    { x: 10, y: -6 },
    { x: 14, y: -3.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 2.6 * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(body, true);

  // Faint diagonal bars.
  g.lineStyle(0.9 * s, barColor, 0.3 * alpha);
  [-6, -1, 4, 9].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -6 * s);
    g.lineTo((bx + 2.5) * s, 6 * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2 * s, -7.8 * s, 5 * s, -6.8 * s, 1 * s, -11.5 * s);
  g.lineStyle(1 * s, finDark, 0.5 * alpha);
  g.strokeTriangle(-2 * s, -7.8 * s, 5 * s, -6.8 * s, 1 * s, -11.5 * s);

  g.lineStyle(0.9 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-7.5 * s, -4.8 * s);
  g.lineTo(-6.8 * s, 4.8 * s);
  g.strokePath();

  // The bold black shoulder spot, right behind the gill cover - the real
  // Spot's own single unmistakable field mark and namesake.
  g.fillStyle(shoulderSpot, 0.85 * alpha);
  g.fillCircle(-8.5 * s, -1.6 * s, 2 * s);

  g.fillStyle(0xf0e4bc, alpha);
  g.fillCircle(-9.3 * s, -2.3 * s, 1.5 * s);
  g.fillStyle(0x140e04, alpha);
  g.fillCircle(-9.05 * s, -2.3 * s, 0.82 * s);

  g.restore();
}

// A pigfish - a real grunt-family fish, bluish-bronze, told apart by the
// real animal's own field mark: rows of small orange-bronze spots and
// short streaks tracing each scale row down the flank, plus bright blue
// and orange lines radiating across the cheek and gill cover.
export function drawPigfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x9cacb0;
  const backColor = 0x5c7078;
  const bellyColor = 0xe4ecec;
  const finColor = 0x788c90;
  const darkColor = 0x283438;
  const spotColor = 0xd8823c;
  const blueColor = 0x3c88b0;

  const body = [
    { x: -16, y: 1.2 },
    { x: -14, y: -5 },
    { x: -6, y: -9 },
    { x: 3, y: -10.2 },
    { x: 12, y: -7.6 },
    { x: 17, y: -4.2 },
    { x: 20, y: -1.6 },
    { x: 20, y: 1.6 },
    { x: 17, y: 4.2 },
    { x: 12, y: 7.6 },
    { x: 3, y: 10.2 },
    { x: -6, y: 9 },
    { x: -13, y: 5.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(20 * s, -2.8 * s, 27 * s, -6.6 * s, 23 * s, 0);
  g.fillTriangle(20 * s, 2.8 * s, 27 * s, 6.6 * s, 23 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(20 * s, -2.8 * s, 27 * s, -6.6 * s, 23 * s, 0);
  g.strokeTriangle(20 * s, 2.8 * s, 27 * s, 6.6 * s, 23 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4.5 * s, 5 * s, -8 * s, 11 * s, 1.5 * s, 7 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -14, y: -5 },
    { x: -6, y: -9 },
    { x: 3, y: -10.2 },
    { x: 12, y: -7.6 },
    { x: 17, y: -4.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // Rows of small orange-bronze spots and short streaks tracing each
  // scale row - the real Pigfish's own body pattern.
  g.fillStyle(spotColor, 0.6 * alpha);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const sx = -9 + col * 4.2;
      const sy = -5 + row * 4.6;
      g.fillCircle(sx * s, sy * s, 0.7 * s);
    }
  }

  // Bright blue and orange lines radiating across the cheek.
  g.lineStyle(0.8 * s, blueColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-13 * s, -3 * s);
  g.lineTo(-9 * s, -1 * s);
  g.strokePath();
  g.lineStyle(0.8 * s, spotColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-13 * s, -0.5 * s);
  g.lineTo(-9 * s, 1 * s);
  g.strokePath();

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -10 * s, 6 * s, -8.6 * s, 1 * s, -14.8 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -10 * s, 6 * s, -8.6 * s, 1 * s, -14.8 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -6.2 * s);
  g.lineTo(-8 * s, 6.2 * s);
  g.strokePath();

  g.fillStyle(0xdcecec, alpha);
  g.fillCircle(-10.5 * s, -2.6 * s, 2 * s);
  g.fillStyle(0x0c1416, alpha);
  g.fillCircle(-10.15 * s, -2.6 * s, 1.1 * s);

  g.restore();
}

// A white grunt - a real grunt-family fish, bluish-grey with real thin
// yellow-gold stripes running along the head, told apart above all by
// the family's own hallmark field mark given full color: a bright
// orange-red interior to the mouth, visible whenever it's open - the
// real detail behind the "grunt" the family makes when it grinds its
// pharyngeal teeth.
export function drawWhiteGrunt(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x9cb0bc;
  const backColor = 0x546878;
  const bellyColor = 0xe0e8ea;
  const finColor = 0x7c909c;
  const darkColor = 0x28343c;
  const stripeColor = 0xe8c848;
  const mouthColor = 0xd83828;

  const body = [
    { x: -16, y: 1.2 },
    { x: -14, y: -5 },
    { x: -6, y: -9 },
    { x: 3, y: -10.2 },
    { x: 12, y: -7.6 },
    { x: 18, y: -4.2 },
    { x: 21, y: -1.6 },
    { x: 21, y: 1.6 },
    { x: 18, y: 4.2 },
    { x: 12, y: 7.6 },
    { x: 3, y: 10.2 },
    { x: -6, y: 9 },
    { x: -13, y: 5.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(21 * s, -2.8 * s, 28 * s, -6.6 * s, 24 * s, 0);
  g.fillTriangle(21 * s, 2.8 * s, 28 * s, 6.6 * s, 24 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(21 * s, -2.8 * s, 28 * s, -6.6 * s, 24 * s, 0);
  g.strokeTriangle(21 * s, 2.8 * s, 28 * s, 6.6 * s, 24 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4.5 * s, 5 * s, -8 * s, 11 * s, 1.5 * s, 7 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Thin yellow-gold stripes along the head.
  g.lineStyle(0.8 * s, stripeColor, 0.65 * alpha);
  [-1.5, 0.5, 2.5].forEach((sy) => {
    g.beginPath();
    g.moveTo(-15 * s, (sy - 3) * s);
    g.lineTo(-6 * s, sy * s);
    g.strokePath();
  });

  const topProfile = [
    { x: -14, y: -5 },
    { x: -6, y: -9 },
    { x: 3, y: -10.2 },
    { x: 12, y: -7.6 },
    { x: 18, y: -4.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -10 * s, 6 * s, -8.6 * s, 1 * s, -14.8 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -10 * s, 6 * s, -8.6 * s, 1 * s, -14.8 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -6.2 * s);
  g.lineTo(-8 * s, 6.2 * s);
  g.strokePath();

  // The bright orange-red mouth interior - the real White Grunt's own
  // hallmark field mark.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, 0.5 * s);
  g.lineTo(-11 * s, 3 * s);
  g.strokePath();
  g.fillStyle(mouthColor, 0.85 * alpha);
  g.fillEllipse(-14.5 * s, 1.8 * s, 2.6 * s, 1.8 * s);

  g.fillStyle(0xe4ecec, alpha);
  g.fillCircle(-10.5 * s, -2.6 * s, 2 * s);
  g.fillStyle(0x0c1416, alpha);
  g.fillCircle(-10.15 * s, -2.6 * s, 1.1 * s);

  g.restore();
}

// A red porgy - a real sparid, reddish-pink over its whole body, told
// apart by the real animal's own field mark: a fine scatter of pale
// blue flecks along the front edge of each scale, giving a speckled
// sheen unlike any solid, striped, or blotched pattern used elsewhere.
export function drawRedPorgy(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe08c78;
  const backColor = 0xb85846;
  const bellyColor = 0xf6d4c4;
  const finColor = 0xcc7460;
  const darkColor = 0x581c10;
  const speckleColor = 0x88c8d8;

  const body = [
    { x: -17, y: 1.2 },
    { x: -15, y: -5.6 },
    { x: -6, y: -10 },
    { x: 4, y: -11.4 },
    { x: 14, y: -8.6 },
    { x: 20, y: -4.6 },
    { x: 23, y: -1.7 },
    { x: 23, y: 1.7 },
    { x: 20, y: 4.6 },
    { x: 14, y: 8.6 },
    { x: 4, y: 11.4 },
    { x: -6, y: 10 },
    { x: -14, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.4 * s, 30.5 * s, -8 * s, 26 * s, 0);
  g.fillTriangle(23 * s, 3.4 * s, 30.5 * s, 8 * s, 26 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(23 * s, -3.4 * s, 30.5 * s, -8 * s, 26 * s, 0);
  g.strokeTriangle(23 * s, 3.4 * s, 30.5 * s, 8 * s, 26 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 6 * s, -9.5 * s, 13.5 * s, 0.5 * s, 8 * s);
  g.fillTriangle(4 * s, 10.2 * s, 0.5 * s, 17 * s, 8.5 * s, 11.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -15, y: -5.6 },
    { x: -6, y: -10 },
    { x: 4, y: -11.4 },
    { x: 14, y: -8.6 },
    { x: 20, y: -4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // The fine scatter of pale blue flecks along the front edge of each
  // scale - the real Red Porgy's own field mark.
  g.fillStyle(speckleColor, 0.55 * alpha);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const sx = -10 + col * 4.4 + (row % 2) * 2;
      const sy = -6.5 + row * 4.2;
      g.fillCircle(sx * s, sy * s, 0.55 * s);
    }
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -11.2 * s, 12 * s, -9.4 * s, 3 * s, -17.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-4 * s, -11.2 * s, 12 * s, -9.4 * s, 3 * s, -17.5 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -8 * s);
  g.lineTo(-8 * s, 8 * s);
  g.strokePath();

  g.fillStyle(0xf4e0d4, alpha);
  g.fillCircle(-11.5 * s, -3.6 * s, 2.3 * s);
  g.fillStyle(0x180c04, alpha);
  g.fillCircle(-11.1 * s, -3.6 * s, 1.25 * s);

  g.restore();
}

// A scup - a real small, compact porgy relative, silvery, told apart by
// two field marks: faint dusky vertical bands across the body (unlike
// the Red Porgy's own solid reddish tone), and a single dark bar
// directly behind the gill cover - a real high-backed, small-mouthed
// porgy body.
export function drawScup(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4ccd0;
  const backColor = 0x8890a0;
  const bellyColor = 0xeef0f0;
  const finColor = 0xa8b0b8;
  const darkColor = 0x383e48;
  const barColor = 0x606874;

  const body = [
    { x: -12, y: 1 },
    { x: -10.5, y: -5.4 },
    { x: -3, y: -9.4 },
    { x: 5, y: -10.4 },
    { x: 12, y: -8 },
    { x: 17, y: -4.4 },
    { x: 19.5, y: -1.6 },
    { x: 19.5, y: 1.6 },
    { x: 17, y: 4.4 },
    { x: 12, y: 8 },
    { x: 5, y: 10.4 },
    { x: -3, y: 9.4 },
    { x: -9.5, y: 5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(19.5 * s, -2.6 * s, 26 * s, -6 * s, 22 * s, 0);
  g.fillTriangle(19.5 * s, 2.6 * s, 26 * s, 6 * s, 22 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(19.5 * s, -2.6 * s, 26 * s, -6 * s, 22 * s, 0);
  g.strokeTriangle(19.5 * s, 2.6 * s, 26 * s, 6 * s, 22 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2 * s, 5 * s, -5 * s, 11 * s, 3 * s, 6.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Faint dusky vertical bands.
  g.fillStyle(barColor, 0.25 * alpha);
  [-6, -1, 4, 9].forEach((bx) => g.fillEllipse(bx * s, 0, 1.8 * s, 8.5 * s));

  const topProfile = [
    { x: -10.5, y: -5.4 },
    { x: -3, y: -9.4 },
    { x: 5, y: -10.4 },
    { x: 12, y: -8 },
    { x: 17, y: -4.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.4 * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokePoints(body, true);

  // A single dark bar directly behind the gill cover.
  g.fillStyle(barColor, 0.45 * alpha);
  g.fillEllipse(-6.5 * s, 0, 1.6 * s, 8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2.5 * s, -10.2 * s, 9 * s, -8.6 * s, 2 * s, -15.5 * s);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokeTriangle(-2.5 * s, -10.2 * s, 9 * s, -8.6 * s, 2 * s, -15.5 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-6.8 * s, -7.4 * s);
  g.lineTo(-6.2 * s, 7.4 * s);
  g.strokePath();

  g.fillStyle(0xe8ecec, alpha);
  g.fillCircle(-8 * s, -3.2 * s, 1.9 * s);
  g.fillStyle(0x0c1014, alpha);
  g.fillCircle(-7.7 * s, -3.2 * s, 1.05 * s);

  g.restore();
}

// A tautog - a real, chunky blackfish wrasse, told apart by the real
// animal's own field mark: dark mottled blackish-green camouflage over
// most of the body, breaking to a pale whitish patch on the chin and
// lower belly, plus thick, fleshy, rubbery lips - a different mouth
// treatment from the Tuskfish's own protruding tusk teeth or the
// Sheepshead's flat incisors.
export function drawTautog(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x3c443c;
  const backColor = 0x1c221c;
  const bellyColor = 0xe0dcc8;
  const finColor = 0x282e26;
  const darkColor = 0x0e120e;
  const mottleColor = 0x545c50;
  const lipColor = 0x605850;

  const body = [
    { x: -17, y: 1.4 },
    { x: -15, y: -5.6 },
    { x: -6, y: -10 },
    { x: 4, y: -11.4 },
    { x: 14, y: -8.6 },
    { x: 20, y: -4.6 },
    { x: 23, y: -1.7 },
    { x: 23, y: 1.7 },
    { x: 20, y: 4.6 },
    { x: 14, y: 8.6 },
    { x: 4, y: 11.4 },
    { x: -6, y: 10 },
    { x: -14, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(23 * s, -3.4 * s, 30.5 * s, -8 * s, 26 * s, 0);
  g.fillTriangle(23 * s, 3.4 * s, 30.5 * s, 8 * s, 26 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(23 * s, -3.4 * s, 30.5 * s, -8 * s, 26 * s, 0);
  g.strokeTriangle(23 * s, 3.4 * s, 30.5 * s, 8 * s, 26 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 6 * s, -9.5 * s, 13.5 * s, 0.5 * s, 8 * s);
  g.fillTriangle(4 * s, 10.2 * s, 0.5 * s, 17 * s, 8.5 * s, 11.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // The dark mottled blackish-green camouflage.
  g.fillStyle(mottleColor, 0.35 * alpha);
  [
    [-8, -5, 3.4],
    [0, -8, 3],
    [8, -5, 3.2],
    [-4, 4, 2.8],
    [5, 6, 3]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.5 * s, br * s));

  const topProfile = [
    { x: -15, y: -5.6 },
    { x: -6, y: -10 },
    { x: 4, y: -11.4 },
    { x: 14, y: -8.6 },
    { x: 20, y: -4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.45 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // The pale whitish patch on the chin and lower belly - breaking the
  // dark camouflage.
  g.fillStyle(bellyColor, 0.5 * alpha);
  g.fillEllipse(-11 * s, 6 * s, 5 * s, 3 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -11.2 * s, 12 * s, -9.4 * s, 3 * s, -17.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-4 * s, -11.2 * s, 12 * s, -9.4 * s, 3 * s, -17.5 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-9 * s, -8 * s);
  g.lineTo(-8 * s, 8 * s);
  g.strokePath();

  // The thick, fleshy, rubbery lips - a real Tautog field mark, a
  // different mouth treatment from any tusk or flat incisor used
  // elsewhere.
  g.fillStyle(lipColor, 0.8 * alpha);
  g.fillEllipse(-16.5 * s, 2.2 * s, 3.2 * s, 2.4 * s);
  g.lineStyle(0.6 * s, darkColor, 0.4 * alpha);
  g.strokeEllipse(-16.5 * s, 2.2 * s, 3.2 * s, 2.4 * s);

  g.fillStyle(0xa8a898, alpha);
  g.fillCircle(-11.5 * s, -3.6 * s, 2.3 * s);
  g.fillStyle(0x0a0a06, alpha);
  g.fillCircle(-11.1 * s, -3.6 * s, 1.25 * s);

  g.restore();
}

// A golden tilefish - a real deep-water tilefish, built around the real
// animal's own single unmistakable field mark: a fleshy pink adipose-
// like crest flopping just above and in front of the first dorsal fin -
// a construction unique to this fish. Iridescent blue-green back fading
// to yellow-gold sides with scattered small yellow spots. Only ever
// found deep.
export function drawGoldenTilefish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe8c458;
  const backColor = 0x1c6c78;
  const bellyColor = 0xf6e4a0;
  const finColor = 0xd8a838;
  const darkColor = 0x4c3410;
  const spotColor = 0xf4e070;
  const crestColor = 0xe08c98;

  const body = [
    { x: -20, y: 1 },
    { x: -18, y: -6 },
    { x: -9, y: -10.5 },
    { x: 2, y: -12 },
    { x: 13, y: -9 },
    { x: 20, y: -5 },
    { x: 24, y: -1.8 },
    { x: 24, y: 1.8 },
    { x: 20, y: 5 },
    { x: 13, y: 9 },
    { x: 2, y: 12 },
    { x: -9, y: 10.5 },
    { x: -17, y: 6.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -3.6 * s, 32 * s, -8.5 * s, 27.5 * s, 0);
  g.fillTriangle(24 * s, 3.6 * s, 32 * s, 8.5 * s, 27.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(24 * s, -3.6 * s, 32 * s, -8.5 * s, 27.5 * s, 0);
  g.strokeTriangle(24 * s, 3.6 * s, 32 * s, 8.5 * s, 27.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 6.4 * s, -11 * s, 14.5 * s, 1 * s, 9.4 * s);
  g.fillTriangle(4 * s, 11.2 * s, 0.5 * s, 18.5 * s, 9.5 * s, 12.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -18, y: -6 },
    { x: -9, y: -10.5 },
    { x: 2, y: -12 },
    { x: 13, y: -9 },
    { x: 20, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5.6 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  // Scattered small yellow spots on the sides.
  g.fillStyle(spotColor, 0.6 * alpha);
  [
    [-8, -1, 1],
    [-2, 3, 0.9],
    [5, -2, 1],
    [11, 2, 0.9],
    [-4, -4, 0.85]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -11.6 * s, 11 * s, -9.4 * s, 3 * s, -17.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-5 * s, -11.6 * s, 11 * s, -9.4 * s, 3 * s, -17.5 * s);

  // The fleshy pink adipose-like crest just above and in front of the
  // first dorsal fin - the real Golden Tilefish's own single
  // unmistakable field mark, a construction unique to this fish.
  g.fillStyle(crestColor, 0.85 * alpha);
  g.fillEllipse(-6 * s, -13 * s, 4.4 * s, 2.4 * s);
  g.lineStyle(0.7 * s, darkColor, 0.4 * alpha);
  g.strokeEllipse(-6 * s, -13 * s, 4.4 * s, 2.4 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-11 * s, -8 * s);
  g.lineTo(-10 * s, 8 * s);
  g.strokePath();

  g.fillStyle(0xf4e8b8, alpha);
  g.fillCircle(-14 * s, -3.6 * s, 2.5 * s);
  g.fillStyle(0x241804, alpha);
  g.fillCircle(-13.6 * s, -3.6 * s, 1.35 * s);

  g.restore();
}

// A blueline tilefish - a real, different-genus tilefish relative of the
// Golden Tilefish here, with no head crest at all - instead told apart
// by the real animal's own field mark: a distinct pale-blue stripe
// running from the eye back along the upper jaw and cheek. Olive-grey to
// pinkish body, a yellow margin on the tail. Only ever found deep.
export function drawBlueLineTilefish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc0a08c;
  const backColor = 0x746048;
  const bellyColor = 0xecd8c4;
  const finColor = 0xa8886c;
  const darkColor = 0x3c2c18;
  const blueColor = 0x4898c8;
  const yellowColor = 0xe8c848;

  const body = [
    { x: -18, y: 1 },
    { x: -16, y: -5.6 },
    { x: -7, y: -9.8 },
    { x: 3, y: -11 },
    { x: 13, y: -8.4 },
    { x: 19, y: -4.6 },
    { x: 22, y: -1.7 },
    { x: 22, y: 1.7 },
    { x: 19, y: 4.6 },
    { x: 13, y: 8.4 },
    { x: 3, y: 11 },
    { x: -7, y: 9.8 },
    { x: -15, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The tail, with a yellow margin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(22 * s, -3.2 * s, 29.5 * s, -7.6 * s, 25 * s, 0);
  g.fillTriangle(22 * s, 3.2 * s, 29.5 * s, 7.6 * s, 25 * s, 0);
  g.lineStyle(1.2 * s, yellowColor, 0.5 * alpha);
  g.strokeTriangle(22 * s, -3.2 * s, 29.5 * s, -7.6 * s, 25 * s, 0);
  g.strokeTriangle(22 * s, 3.2 * s, 29.5 * s, 7.6 * s, 25 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(22 * s, -3.2 * s, 29.5 * s, -7.6 * s, 25 * s, 0);
  g.strokeTriangle(22 * s, 3.2 * s, 29.5 * s, 7.6 * s, 25 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5.5 * s, 6 * s, -10 * s, 13.5 * s, 1 * s, 8.6 * s);
  g.fillTriangle(3.5 * s, 10.4 * s, 0, 17 * s, 8.5 * s, 11.4 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -16, y: -5.6 },
    { x: -7, y: -9.8 },
    { x: 3, y: -11 },
    { x: 13, y: -8.4 },
    { x: 19, y: -4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4 * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -11.2 * s, 11 * s, -9.4 * s, 3 * s, -17 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-4 * s, -11.2 * s, 11 * s, -9.4 * s, 3 * s, -17 * s);

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(-10 * s, -7.6 * s);
  g.lineTo(-9 * s, 7.6 * s);
  g.strokePath();

  // The distinct pale-blue stripe running from the eye back along the
  // upper jaw and cheek - the real Blueline Tilefish's own field mark.
  g.lineStyle(1.4 * s, blueColor, 0.75 * alpha);
  g.beginPath();
  g.moveTo(-14.5 * s, -1.6 * s);
  g.lineTo(-8 * s, 0.2 * s);
  g.strokePath();

  g.fillStyle(0xf0e0cc, alpha);
  g.fillCircle(-13 * s, -3.2 * s, 2.3 * s);
  g.fillStyle(0x1c1006, alpha);
  g.fillCircle(-12.6 * s, -3.2 * s, 1.25 * s);

  g.restore();
}

// An atlantic mackerel - a real Scomber (a different genus from the
// Spanish/School/King Mackerel here), told apart by the real animal's
// own field mark: numerous - roughly twenty - thin wavy dark bars,
// closely packed and confined strictly to the back above the lateral
// line, over an otherwise plain, unmarked silvery-white lower flank and
// belly - a much denser, more numerous, and more tightly restricted
// pattern than any Scomberomorus mackerel here.
export function drawAtlanticMackerel(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc8d0d0;
  const backColor = 0x1c3844;
  const bellyColor = 0xf4f6f4;
  const finColor = 0x2c4650;
  const darkColor = 0x101c22;
  const barColor = 0x14282e;

  const body = [
    { x: -22, y: 0 },
    { x: -19, y: -2.6 },
    { x: -12, y: -4.8 },
    { x: -3, y: -5.8 },
    { x: 7, y: -5.6 },
    { x: 15, y: -4.4 },
    { x: 21, y: -2.6 },
    { x: 24, y: -1.2 },
    { x: 24, y: 1.2 },
    { x: 21, y: 2.6 },
    { x: 15, y: 4.4 },
    { x: 7, y: 5.6 },
    { x: -3, y: 5.8 },
    { x: -12, y: 4.8 },
    { x: -19, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.56, bow: 7 },
    { angle: 0.56, bow: -7 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 16;
    const steps = 9;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (24 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3 - tt * 2.7) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 2.4 * s, -15 * s, 8.5 * s, -6 * s, 4.4 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -19, y: -2.6 },
    { x: -12, y: -4.8 },
    { x: -3, y: -5.8 },
    { x: 7, y: -5.6 },
    { x: 15, y: -4.4 },
    { x: 21, y: -2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.6 * s }))
  );
  g.fillStyle(backColor, 0.6 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Roughly twenty thin wavy dark bars, closely packed and confined
  // strictly to the back above the lateral line - the real Atlantic
  // Mackerel's own field mark.
  g.lineStyle(0.8 * s, barColor, 0.6 * alpha);
  for (let i = 0; i < 20; i += 1) {
    const bx = -18 + i * 2;
    const wob = Math.sin(i * 1.6) * 0.8;
    g.beginPath();
    g.moveTo((bx + wob) * s, -5.2 * s);
    quadCurveTo(g, (bx + wob) * s, -5.2 * s, bx * s, -2.6 * s, (bx - wob) * s, -0.2 * s);
    g.strokePath();
  }

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const fx = 16 + i * 1.7;
    g.fillTriangle(fx * s, -3.6 * s, (fx + 1.2) * s, -3.6 * s, (fx + 0.6) * s, -5.6 * s);
    g.fillTriangle(fx * s, 3.6 * s, (fx + 1.2) * s, 3.6 * s, (fx + 0.6) * s, 5.6 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-15 * s, -2.2 * s);
  g.lineTo(-13 * s, 2.2 * s);
  g.strokePath();

  g.fillStyle(0xeef2f2, alpha);
  g.fillCircle(-17 * s, -0.8 * s, 1.9 * s);
  g.fillStyle(0x0a1216, alpha);
  g.fillCircle(-16.65 * s, -0.8 * s, 1.05 * s);

  g.restore();
}

// A cero mackerel - a real Scomberomorus relative of the Spanish, School,
// and King Mackerel here, told apart by a field mark none of the others
// share: a bronze-orange stripe running the entire length of the lateral
// line, with rows of small dark spots strung both above and below it -
// a combination pattern unique to this mackerel.
export function drawCeroMackerel(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4ccc8;
  const backColor = 0x30443c;
  const bellyColor = 0xf0f2ee;
  const finColor = 0x3c544a;
  const darkColor = 0x18201a;
  const stripeColor = 0xd89840;
  const spotColor = 0x242c24;

  const body = [
    { x: -26, y: 0 },
    { x: -23, y: -2.6 },
    { x: -15, y: -4.8 },
    { x: -3, y: -6.4 },
    { x: 9, y: -6.2 },
    { x: 18, y: -4.8 },
    { x: 24, y: -2.8 },
    { x: 28, y: -1.3 },
    { x: 28, y: 1.3 },
    { x: 24, y: 2.8 },
    { x: 18, y: 4.8 },
    { x: 9, y: 6.2 },
    { x: -3, y: 6.4 },
    { x: -15, y: 4.8 },
    { x: -23, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.56, bow: 7.5 },
    { angle: 0.56, bow: -7.5 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 17;
    const steps = 9;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (28 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.2 - tt * 2.9) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-12 * s, 2.4 * s, -17 * s, 9.5 * s, -6 * s, 4.4 * s);
  g.fillTriangle(-1 * s, 6 * s, -3.5 * s, 10.5 * s, 3 * s, 6.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -23, y: -2.6 },
    { x: -15, y: -4.8 },
    { x: -3, y: -6.4 },
    { x: 9, y: -6.2 },
    { x: 18, y: -4.8 },
    { x: 24, y: -2.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 3.8 * s }))
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // The bronze-orange stripe running the entire length of the lateral
  // line - the real Cero Mackerel's own field mark.
  g.lineStyle(1.8 * s, stripeColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-21 * s, 0.3 * s);
  quadCurveTo(g, -21 * s, 0.3 * s, 0, 1 * s, 23 * s, -0.4 * s);
  g.strokePath();

  // Rows of small dark spots strung both above and below the stripe.
  g.fillStyle(spotColor, 0.55 * alpha);
  [-16, -8, 0, 8, 16].forEach((bx) => {
    g.fillCircle(bx * s, -2.6 * s, 1 * s);
    g.fillCircle((bx + 4) * s, 3 * s, 0.9 * s);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -6.6 * s, 4 * s, -6.1 * s, -1 * s, -12 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-4 * s, -6.6 * s, 4 * s, -6.1 * s, -1 * s, -12 * s);

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = 16 + i * 1.9;
    g.fillTriangle(fx * s, -4.3 * s, (fx + 1.3) * s, -4.3 * s, (fx + 0.65) * s, -6.6 * s);
    g.fillTriangle(fx * s, 4.3 * s, (fx + 1.3) * s, 4.3 * s, (fx + 0.65) * s, 6.6 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-18 * s, -3.4 * s);
  g.lineTo(-16 * s, 3.4 * s);
  g.strokePath();

  g.fillStyle(0xeef2ee, alpha);
  g.fillCircle(-20 * s, -1.4 * s, 2.1 * s);
  g.fillStyle(0x0c1210, alpha);
  g.fillCircle(-19.6 * s, -1.4 * s, 1.15 * s);

  g.restore();
}

// A little tunny - a small real tuna, told apart by two field marks: a
// dense scrawl of dark, wandering, worm-like vermiculated markings
// across the back (unlike the horizontal stripes, vertical bars, or
// finlet colors used on every other tuna here), and a small dark spot
// sitting right below the pectoral fin base, on the lower flank.
export function drawLittleTunny(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xacbabe;
  const backColor = 0x1e3a44;
  const bellyColor = 0xeef2f0;
  const finColor = 0x2e4a54;
  const darkColor = 0x142428;
  const vermColor = 0x142832;
  const spotColor = 0x101c1e;

  const body = [
    { x: -22, y: 0 },
    { x: -19, y: -2.6 },
    { x: -13, y: -5 },
    { x: -4, y: -6.6 },
    { x: 5, y: -6.6 },
    { x: 12, y: -5.4 },
    { x: 18, y: -3.4 },
    { x: 22, y: -1.5 },
    { x: 22, y: 1.5 },
    { x: 18, y: 3.4 },
    { x: 12, y: 5.4 },
    { x: 5, y: 6.6 },
    { x: -4, y: 6.6 },
    { x: -13, y: 5 },
    { x: -19, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.55, bow: 6.5 },
    { angle: 0.55, bow: -6.5 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 14;
    const steps = 8;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (22 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (2.8 - tt * 2.5) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 2.4 * s, -13 * s, 8.5 * s, -4 * s, 4.4 * s);

  // The small dark spot sitting right below the pectoral fin base - the
  // real Little Tunny's own second field mark.
  g.fillStyle(spotColor, 0.75 * alpha);
  g.fillCircle(-7.5 * s, 5 * s, 1.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -19, y: -2.6 },
    { x: -13, y: -5 },
    { x: -4, y: -6.6 },
    { x: 5, y: -6.6 },
    { x: 12, y: -5.4 },
    { x: 18, y: -3.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 4.2 * s }))
  );
  g.fillStyle(backColor, 0.85 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // The dense scrawl of dark, wandering, worm-like vermiculated
  // markings across the back - the real Little Tunny's own field mark.
  g.lineStyle(0.8 * s, vermColor, 0.55 * alpha);
  for (let i = 0; i < 6; i += 1) {
    const vy = -5.6 + i * 1.6;
    g.beginPath();
    g.moveTo(-16 * s, vy * s);
    quadCurveTo(g, -16 * s, vy * s, (-8 + (i % 2) * 3) * s, (vy - 1) * s, 0, (vy + 0.6) * s);
    quadCurveTo(g, 0, (vy + 0.6) * s, (8 - (i % 2) * 3) * s, (vy - 0.6) * s, 14 * s, (vy + 0.8) * s);
    g.strokePath();
  }

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -6.8 * s, 3 * s, -6.4 * s, -0.5 * s, -12 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-4 * s, -6.8 * s, 3 * s, -6.4 * s, -0.5 * s, -12 * s);

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = 13 + i * 1.7;
    g.fillTriangle(fx * s, -3.4 * s, (fx + 1.2) * s, -3.4 * s, (fx + 0.6) * s, -5.4 * s);
    g.fillTriangle(fx * s, 3.4 * s, (fx + 1.2) * s, 3.4 * s, (fx + 0.6) * s, 5.4 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-15 * s, -2.2 * s);
  g.lineTo(-13.5 * s, 2.2 * s);
  g.strokePath();

  g.fillStyle(0xeef3f2, alpha);
  g.fillCircle(-17 * s, -0.6 * s, 1.9 * s);
  g.fillStyle(0x0a1414, alpha);
  g.fillCircle(-16.65 * s, -0.6 * s, 1.05 * s);

  g.restore();
}

// An atlantic bonito - a real, close Sarda relative of the Bonito drawn
// elsewhere in the game, but built at the OPPOSITE extreme of body type:
// noticeably leaner and more elongated (a torpedo-tuna ratio here,
// rather than the other Bonito's own deliberately stocky, short-coupled
// bulk), with a plain small triangular first dorsal rather than the
// other Bonito's single continuous bowed blade - a genuinely different
// fin construction. The real animal's own field mark is still bold,
// dark, oblique stripes (a true Sarda genus trait), but far more
// numerous and steeply angled here than the other Bonito's own fewer,
// shallower stripes.
export function drawAtlanticBonito(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa8bcc4;
  const backColor = 0x18384a;
  const bellyColor = 0xeef2f2;
  const finColor = 0x24404e;
  const darkColor = 0x0e1c26;
  const stripeColor = 0x122430;

  const body = [
    { x: -28, y: 0 },
    { x: -25, y: -3 },
    { x: -17, y: -6 },
    { x: -6, y: -8 },
    { x: 5, y: -8 },
    { x: 14, y: -6.4 },
    { x: 21, y: -4 },
    { x: 25, y: -1.8 },
    { x: 25, y: 1.8 },
    { x: 21, y: 4 },
    { x: 14, y: 6.4 },
    { x: 5, y: 8 },
    { x: -6, y: 8 },
    { x: -17, y: 6 },
    { x: -25, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.58, bow: 8 },
    { angle: 0.58, bow: -8 }
  ].forEach(({ angle, bow }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 18;
    const steps = 9;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (25 + dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3.2 - tt * 2.9) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.6 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 2.6 * s, -14 * s, 9.5 * s, -4 * s, 4.6 * s);
  g.fillTriangle(0, 7 * s, -2.5 * s, 11.5 * s, 4 * s, 7.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -25, y: -3 },
    { x: -17, y: -6 },
    { x: -6, y: -8 },
    { x: 5, y: -8 },
    { x: 14, y: -6.4 },
    { x: 21, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 5 * s }))
  );
  g.fillStyle(backColor, 0.85 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // Numerous, closely-packed, steeply oblique dark stripes - the real
  // Sarda genus field mark, but far denser and steeper than the other
  // Bonito's own fewer, shallower stripes.
  g.lineStyle(1 * s, stripeColor, 0.5 * alpha);
  for (let i = 0; i < 9; i += 1) {
    const bx = -20 + i * 4.4;
    g.beginPath();
    g.moveTo(bx * s, -7.5 * s);
    g.lineTo((bx + 6) * s, 1 * s);
    g.strokePath();
  }

  // A plain small triangular first dorsal - a genuinely different
  // construction from the other Bonito's own single continuous bowed
  // blade.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -8.3 * s, 4 * s, -7.7 * s, -0.5 * s, -14.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-5 * s, -8.3 * s, 4 * s, -7.7 * s, -0.5 * s, -14.5 * s);

  g.fillStyle(finColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const fx = 15 + i * 1.9;
    g.fillTriangle(fx * s, -5.4 * s, (fx + 1.3) * s, -5.4 * s, (fx + 0.65) * s, -8 * s);
    g.fillTriangle(fx * s, 5.4 * s, (fx + 1.3) * s, 5.4 * s, (fx + 0.65) * s, 8 * s);
  }

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -4 * s);
  g.lineTo(-17 * s, 4 * s);
  g.strokePath();

  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-22 * s, -1.6 * s, 2.3 * s);
  g.fillStyle(0x0a1015, alpha);
  g.fillCircle(-21.6 * s, -1.6 * s, 1.25 * s);

  g.restore();
}

// A shortfin mako - the fastest shark there is, built as the leanest,
// most needle-streamlined shark here: an almost perfectly symmetrical,
// high-aspect crescent tail (both lobes nearly equal, a real Mako trait
// built for speed - unlike the heavily lopsided lobes every other shark
// here carries), a sharply conical pointed snout, vivid saturated
// cobalt-blue over a crisp white belly, and long curved teeth left
// visibly protruding even with the jaw shut.
export function drawShortfinMako(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  // A dramatically more vivid, saturated electric blue than the Great
  // White's flat slate grey - not just a tinted version of the same
  // color.
  const backColor = 0x1464b4;
  const bellyColor = 0xf4f6f4;
  const midColor = 0x6ab0e0;
  const finColor = 0x1454a0;
  const darkColor = 0x081c34;
  const toothColor = 0xf6f4ee;

  // A dramatically leaner, needle-slender torpedo body - depth-to-length
  // ratio here is roughly 0.22, well below the Great White's own ~0.32,
  // the real Mako's own build for pure speed rather than bulk.
  const body = [
    { x: -34, y: 0 },
    { x: -30, y: -3.2 },
    { x: -20, y: -5.6 },
    { x: -8, y: -7 },
    { x: 4, y: -7 },
    { x: 15, y: -5.8 },
    { x: 24, y: -4 },
    { x: 30, y: -1.8 },
    { x: 30, y: 1.8 },
    { x: 24, y: 4 },
    { x: 15, y: 5.8 },
    { x: 4, y: 7 },
    { x: -8, y: 7 },
    { x: -20, y: 5.6 },
    { x: -30, y: 3.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The near-symmetrical, high-aspect crescent tail - the real Mako's
  // own field mark, built for pure speed.
  [
    { angle: -0.68, bow: 10, len: 22, baseY: -1.2, w: 5.5 },
    { angle: 0.68, bow: -10, len: 22, baseY: 1.2, w: 5.5 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (30 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  // A pair of caudal keels - stiff horizontal ridges right at the base
  // of the tail, a construction unique to this fish among the sharks
  // here, and a real lamnid-shark speed adaptation.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(21 * s, -3.4 * s, 30 * s, -4.4 * s, 26 * s, -1.4 * s);
  g.fillTriangle(21 * s, 3.4 * s, 30 * s, 4.4 * s, 26 * s, 1.4 * s);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(21 * s, -3.4 * s, 30 * s, -4.4 * s, 26 * s, -1.4 * s);
  g.strokeTriangle(21 * s, 3.4 * s, 30 * s, 4.4 * s, 26 * s, 1.4 * s);

  // A narrow, sharply raked pectoral fin - a slimmer, more scythe-like
  // shape than the Great White's own broad wing.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 3.8 * s, -19 * s, 17 * s, -3 * s, 6.8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 3.8 * s, -19 * s, 17 * s, -3 * s, 6.8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(5 * s, 7.2 * s, 2.5 * s, 12.5 * s, 11 * s, 7.2 * s);
  g.fillTriangle(14 * s, -5.9 * s, 17.5 * s, -5.3 * s, 15.5 * s, -10 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(14 * s, -5.9 * s, 17.5 * s, -5.3 * s, 15.5 * s, -10 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -30, y: -3.2 },
    { x: -20, y: -5.6 },
    { x: -8, y: -7 },
    { x: 4, y: -7 },
    { x: 15, y: -5.8 },
    { x: 24, y: -4 },
    { x: 30, y: -1.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  // A paler mid-blue band sitting between the dark back and the white
  // belly - a real, genuine third tone lamnid sharks like the Mako show,
  // that the flat two-tone Great White doesn't have.
  const midBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (4.4 + Math.sin(i * 1.3) * 1.4) * s }))
  );
  g.fillStyle(midColor, 0.75 * alpha);
  g.fillPoints(midBand, true);
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (1.8 + Math.sin(i * 1.3) * 1) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // A narrower, more sharply swept-back dorsal - a slimmer silhouette
  // than the Great White's own broad, upright triangular fin.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -6, y: -7 },
      { x: -3, y: -23 },
      { x: 1, y: -25 },
      { x: 4, y: -21 },
      { x: 6, y: -7.8 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(
    [
      { x: -6, y: -7 },
      { x: -3, y: -23 },
      { x: 1, y: -25 },
      { x: 4, y: -21 },
      { x: 6, y: -7.8 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    false
  );

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -24 + i * 1.9;
    g.beginPath();
    g.moveTo(gx * s, -5 * s);
    g.lineTo((gx - 1.1) * s, 4.1 * s);
    g.strokePath();
  }

  // A real, dramatically dominant mouthful of long, curved, needle-thin
  // teeth left visibly protruding on BOTH jaws even with the mouth shut
  // - the single most famous real Mako feature, and given far more
  // visual weight here than the Great White's own brief tooth hint.
  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-33.5 * s, 0.8 * s);
  g.lineTo(-23 * s, 3.6 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const tx = -32.5 + i * 2.2;
    g.fillTriangle(tx * s, 1.2 * s, (tx + 1.2) * s, 1.7 * s, (tx + 0.35) * s, -1.6 * s);
  }
  for (let i = 0; i < 4; i += 1) {
    const tx = -31.5 + i * 2.3;
    g.fillTriangle(tx * s, 2.2 * s, (tx + 1.1) * s, 2.6 * s, (tx + 0.35) * s, 4.6 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-25.5 * s, -2.4 * s, 1.6 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-25.5 * s, -2.4 * s, 0.85 * s);

  g.restore();
}

// A whaler shark - deliberately left the plainest, most unmarked
// requiem shark here: a mid-grey-brown body with no ridge, no colored
// fin tips, and no bronze sheen at all, a moderate rounded snout, and an
// ordinary, unremarkable dorsal fin - the real animal's own field mark
// is that it carries none of the specific traits its own named
// relatives do.
export function drawWhalerShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x606058;
  const bellyColor = 0xf0efe8;
  const finColor = 0x606058;
  const darkColor = 0x201f1a;
  const toothColor = 0xf0eee6;

  const body = [
    { x: -34, y: 0 },
    { x: -30, y: -5.0 },
    { x: -20, y: -8.7 },
    { x: -7, y: -11.0 },
    { x: 5, y: -11.0 },
    { x: 16, y: -9.3 },
    { x: 25, y: -6.5 },
    { x: 31, y: -2.8 },
    { x: 31, y: 2.8 },
    { x: 25, y: 6.5 },
    { x: 16, y: 9.3 },
    { x: 5, y: 11.0 },
    { x: -7, y: 11.0 },
    { x: -20, y: 8.7 },
    { x: -30, y: 5.0 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.83, bow: 13, len: 27, baseY: -2.8, w: 5.8 },
    { angle: 0.55, bow: -6.5, len: 13, baseY: 2.8, w: 4.6 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (31 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-12 * s, 5.8 * s, -19 * s, 22.7 * s, -2.5 * s, 10.0 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-12 * s, 5.8 * s, -19 * s, 22.7 * s, -2.5 * s, 10.0 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(7 * s, 10.4 * s, 4 * s, 17.9 * s, 14.5 * s, 10.4 * s);
  g.fillTriangle(17 * s, -8.7 * s, 21 * s, -7.9 * s, 18.5 * s, -14.6 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(17 * s, -8.7 * s, 21 * s, -7.9 * s, 18.5 * s, -14.6 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -30, y: -5.0 },
    { x: -20, y: -8.7 },
    { x: -7, y: -11.0 },
    { x: 5, y: -11.0 },
    { x: 16, y: -9.3 },
    { x: 25, y: -6.5 },
    { x: 31, y: -2.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.6 + Math.sin(i * 1.3) * 1.3) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, -10.2 * s, 7 * s, -9 * s, 1.5 * s, -26 * s);
  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-7 * s, -10.2 * s, 7 * s, -9 * s, 1.5 * s, -26 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -27 + i * 2.2;
    g.beginPath();
    g.moveTo(gx * s, -7.8 * s);
    g.lineTo((gx - 1.3) * s, 6.5 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-33.5 * s, 1 * s);
  g.lineTo(-23 * s, 4.5 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -32 + i * 2.8;
    g.fillTriangle(tx * s, 1.4 * s, (tx + 1.4) * s, 2 * s, (tx + 0.5) * s, 4.4 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-25 * s, -3.4 * s, 1.8 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-25 * s, -3.4 * s, 0.95 * s);

  g.restore();
}

// A bronze whaler - the same requiem-shark genre as the plain Whaler
// here, but told genuinely apart by the real animal's own single field
// mark: a warm, metallic bronze-copper sheen washed across the entire
// back - the real detail the species is named for, built as a tinted
// overlay rather than the Whaler's own flat neutral grey.
export function drawBronzeWhaler(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x8c6030;
  const bellyColor = 0xf2ece0;
  const finColor = 0x8c6030;
  const darkColor = 0x2c1c0c;
  const toothColor = 0xf0eee4;
  const sheenColor = 0xc89040;

  const body = [
    { x: -33, y: 0 },
    { x: -29, y: -3.8 },
    { x: -19, y: -6.6 },
    { x: -7, y: -8.5 },
    { x: 5, y: -8.5 },
    { x: 15, y: -7.1 },
    { x: 24, y: -5.0 },
    { x: 30, y: -2.2 },
    { x: 30, y: 2.2 },
    { x: 24, y: 5.0 },
    { x: 15, y: 7.1 },
    { x: 5, y: 8.5 },
    { x: -7, y: 8.5 },
    { x: -19, y: 6.6 },
    { x: -29, y: 3.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.76, bow: 11, len: 24, baseY: -2.5, w: 5.6 },
    { angle: 0.52, bow: -5.5, len: 11, baseY: 2.5, w: 4.4 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (30 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 4.5 * s, -18 * s, 17.4 * s, -2 * s, 7.6 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-11 * s, 4.5 * s, -18 * s, 17.4 * s, -2 * s, 7.6 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(7 * s, 8.0 * s, 4 * s, 13.7 * s, 14 * s, 8.0 * s);
  g.fillTriangle(16.5 * s, -6.6 * s, 20 * s, -6.1 * s, 18 * s, -11.3 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(16.5 * s, -6.6 * s, 20 * s, -6.1 * s, 18 * s, -11.3 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  // The warm, metallic bronze-copper sheen washed across the back - the
  // real Bronze Whaler's own single field mark.
  g.fillStyle(sheenColor, 0.28 * alpha);
  g.fillEllipse(-1 * s, -3 * s, 30 * s, 9 * s);

  const topProfile = [
    { x: -29, y: -3.8 },
    { x: -19, y: -6.6 },
    { x: -7, y: -8.5 },
    { x: 5, y: -8.5 },
    { x: 15, y: -7.1 },
    { x: 24, y: -5.0 },
    { x: 30, y: -2.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.5 + Math.sin(i * 1.3) * 1.3) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, -9.8 * s, 6.5 * s, -8.6 * s, 1.5 * s, -24.5 * s);
  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-7 * s, -9.8 * s, 6.5 * s, -8.6 * s, 1.5 * s, -24.5 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -25.5 * s + i * 2.1 * s;
    g.beginPath();
    g.moveTo(gx, -6.1 * s);
    g.lineTo(gx - 1.2 * s, 5.0 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-32.5 * s, 1 * s);
  g.lineTo(-22 * s, 4.3 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -31 + i * 2.7;
    g.fillTriangle(tx * s, 1.4 * s, (tx + 1.3) * s, 2 * s, (tx + 0.45) * s, 4.2 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-24 * s, -3.3 * s, 1.75 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-24 * s, -3.3 * s, 0.92 * s);

  g.restore();
}

// A dusky shark - a real, big, bulky requiem shark, told apart by two
// genuine field marks: a raised interdorsal ridge - a real, low fleshy
// ridge running along the back between the first and second dorsal fins,
// drawn as its own separate raised shape, a construction no other shark
// here has - and subtly dusky, softly greyed tips on the fins, a much
// more understated marking than the bold black tips on the Blacktip or
// Spinner Shark right next to it.
export function drawDuskyShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x6c665c;
  const bellyColor = 0xecebe2;
  const finColor = 0x6c665c;
  const darkColor = 0x201e18;
  const toothColor = 0xf0eee4;
  const duskyColor = 0x3c3a34;

  const body = [
    { x: -36, y: 0 },
    { x: -32, y: -6.5 },
    { x: -21, y: -11.3 },
    { x: -8, y: -14.5 },
    { x: 5, y: -14.5 },
    { x: 17, y: -12.0 },
    { x: 27, y: -8.3 },
    { x: 33, y: -3.5 },
    { x: 33, y: 3.5 },
    { x: 27, y: 8.3 },
    { x: 17, y: 12.0 },
    { x: 5, y: 14.5 },
    { x: -8, y: 14.5 },
    { x: -21, y: 11.3 },
    { x: -32, y: 6.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.89, bow: 16, len: 30, baseY: -3.2, w: 6.8 },
    { angle: 0.4, bow: -4.5, len: 9, baseY: 3.2, w: 4.2 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (33 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    // Softly dusky (not bold black) tip.
    g.fillStyle(duskyColor, 0.4 * alpha);
    g.fillCircle(shape[10].x, shape[10].y, 2.2 * s);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-12 * s, 7.0 * s, -20 * s, 27.5 * s, -3 * s, 12.0 * s);
  g.fillStyle(duskyColor, 0.35 * alpha);
  g.fillCircle(-20 * s, 27.5 * s, 2 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-12 * s, 7.0 * s, -20 * s, 27.5 * s, -3 * s, 12.0 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(7.5 * s, 12.8 * s, 4 * s, 21.9 * s, 15 * s, 12.8 * s);
  g.fillTriangle(18 * s, -11.3 * s, 22 * s, -10.3 * s, 19.5 * s, -18.5 * s);
  g.fillStyle(duskyColor, 0.35 * alpha);
  g.fillCircle(19.5 * s, -18.5 * s, 1.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(18 * s, -11.3 * s, 22 * s, -10.3 * s, 19.5 * s, -18.5 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -32, y: -6.5 },
    { x: -21, y: -11.3 },
    { x: -8, y: -14.5 },
    { x: 5, y: -14.5 },
    { x: 17, y: -12.0 },
    { x: 27, y: -8.3 },
    { x: 33, y: -3.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.8 + Math.sin(i * 1.3) * 1.4) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, -11.6 * s, 8 * s, -10.2 * s, 1.5 * s, -29 * s);
  g.fillStyle(duskyColor, 0.35 * alpha);
  g.fillCircle(1.5 * s, -29 * s, 2.4 * s);
  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-8 * s, -11.6 * s, 8 * s, -10.2 * s, 1.5 * s, -29 * s);

  // The raised interdorsal ridge, running along the back between the two
  // dorsal fins - a real, genuine anatomical feature, and a construction
  // no other shark here has.
  g.fillStyle(backColor, 0.9 * alpha);
  g.beginPath();
  g.moveTo(8 * s, -10.5 * s);
  quadCurveTo(g, 8 * s, -10.5 * s, 13 * s, -12.5 * s, 18 * s, -9.8 * s);
  g.lineTo(18 * s, -9.2 * s);
  quadCurveTo(g, 18 * s, -9.2 * s, 13 * s, -11.2 * s, 8 * s, -9.9 * s);
  g.closePath();
  g.fillPath();
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -28 + i * 2.4;
    g.beginPath();
    g.moveTo(gx * s, -9.8 * s);
    g.lineTo((gx - 1.4) * s, 8.0 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-35.5 * s, 1 * s);
  g.lineTo(-24 * s, 4.8 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -34 + i * 2.9;
    g.fillTriangle(tx * s, 1.5 * s, (tx + 1.4) * s, 2.1 * s, (tx + 0.5) * s, 4.6 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-26.5 * s, -3.6 * s, 1.9 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-26.5 * s, -3.6 * s, 1 * s);

  g.restore();
}

// A blacktip shark - a real, mid-sized requiem shark, built around the
// real animal's own bold, unmistakable field mark: solid, saturated,
// dark black tips on every fin EXCEPT the anal fin, which stays plain
// pale - much bolder and higher-contrast than the Dusky Shark's own
// subtle, softly greyed fin edges right next to it.
export function drawBlacktipShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x9c9484;
  const bellyColor = 0xf4f2e8;
  const finColor = 0x9c9484;
  const darkColor = 0x28241a;
  const toothColor = 0xf2f0e6;
  const blackTip = 0x0c0a06;

  const body = [
    { x: -29, y: 0 },
    { x: -25, y: -2.9 },
    { x: -16, y: -5.0 },
    { x: -6, y: -6.3 },
    { x: 4, y: -6.3 },
    { x: 13, y: -5.3 },
    { x: 21, y: -3.6 },
    { x: 26, y: -1.5 },
    { x: 26, y: 1.5 },
    { x: 21, y: 3.6 },
    { x: 13, y: 5.3 },
    { x: 4, y: 6.3 },
    { x: -6, y: 6.3 },
    { x: -16, y: 5.0 },
    { x: -25, y: 2.9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.79, bow: 9.5, len: 19, baseY: -1.6, w: 4.2 },
    { angle: 0.53, bow: -4.5, len: 8.5, baseY: 1.6, w: 3.4 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (26 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.fillStyle(blackTip, 0.85 * alpha);
    g.fillCircle(shape[10].x, shape[10].y, 2 * s);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 3.3 * s, -15 * s, 12.8 * s, -2 * s, 5.7 * s);
  g.fillStyle(blackTip, 0.85 * alpha);
  g.fillCircle(-15 * s, 12.8 * s, 1.7 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 3.3 * s, -15 * s, 12.8 * s, -2 * s, 5.7 * s);

  // The pelvic fin - plain, unmarked.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(5.5 * s, 6.0 * s, 3 * s, 10.4 * s, 11.5 * s, 6.0 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(13.5 * s, -5.1 * s, 17 * s, -4.6 * s, 15 * s, -8.7 * s);
  g.fillStyle(blackTip, 0.85 * alpha);
  g.fillCircle(15 * s, -8.7 * s, 1.3 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(13.5 * s, -5.1 * s, 17 * s, -4.6 * s, 15 * s, -8.7 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -25, y: -2.9 },
    { x: -16, y: -5.0 },
    { x: -6, y: -6.3 },
    { x: 4, y: -6.3 },
    { x: 13, y: -5.3 },
    { x: 21, y: -3.6 },
    { x: 26, y: -1.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2 + Math.sin(i * 1.3) * 1) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, -8.4 * s, 6 * s, -7.4 * s, 1 * s, -20.5 * s);
  g.fillStyle(blackTip, 0.85 * alpha);
  g.fillCircle(1 * s, -20.5 * s, 2 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-6 * s, -8.4 * s, 6 * s, -7.4 * s, 1 * s, -20.5 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -22 + i * 1.9;
    g.beginPath();
    g.moveTo(gx * s, -4.5 * s);
    g.lineTo((gx - 1.1) * s, 3.8 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-28.5 * s, 1 * s);
  g.lineTo(-19 * s, 3.8 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -27 + i * 2.4;
    g.fillTriangle(tx * s, 1.3 * s, (tx + 1.1) * s, 1.8 * s, (tx + 0.4) * s, 3.7 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-21 * s, -2.9 * s, 1.5 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-21 * s, -2.9 * s, 0.8 * s);

  g.restore();
}

// A spinner shark - a real, close look-alike of the Blacktip Shark right
// next to it here (even real ichthyologists tell them apart mainly by
// this one detail) - built more slender and elongated, with a longer,
// more pointed snout, and the real, genuine differentiator: the black
// fin tip continues onto the ANAL fin as well here, unlike the Blacktip
// Shark's own plain, unmarked anal fin.
export function drawSpinnerShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x8c8878;
  const bellyColor = 0xf2f0e6;
  const finColor = 0x8c8878;
  const darkColor = 0x241f16;
  const toothColor = 0xf0eee4;
  const blackTip = 0x0c0a06;

  const body = [
    { x: -32, y: 0 },
    { x: -28, y: -2.6 },
    { x: -18, y: -4.4 },
    { x: -7, y: -5.4 },
    { x: 3, y: -5.4 },
    { x: 12, y: -4.5 },
    { x: 20, y: -3.2 },
    { x: 25, y: -1.4 },
    { x: 25, y: 1.4 },
    { x: 20, y: 3.2 },
    { x: 12, y: 4.5 },
    { x: 3, y: 5.4 },
    { x: -7, y: 5.4 },
    { x: -18, y: 4.4 },
    { x: -28, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.81, bow: 10.5, len: 21, baseY: -1.9, w: 4.4 },
    { angle: 0.49, bow: -4, len: 8, baseY: 1.9, w: 3.4 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (25 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.fillStyle(blackTip, 0.8 * alpha);
    g.fillCircle(shape[10].x, shape[10].y, 1.8 * s);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 2.8 * s, -14.5 * s, 11.6 * s, -2 * s, 5.0 * s);
  g.fillStyle(blackTip, 0.8 * alpha);
  g.fillCircle(-14.5 * s, 11.6 * s, 1.6 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 2.8 * s, -14.5 * s, 11.6 * s, -2 * s, 5.0 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(5 * s, 5.2 * s, 3 * s, 8.9 * s, 10 * s, 5.2 * s);

  // The anal fin, ALSO carrying a black tip - the real Spinner Shark's
  // own single genuine differentiator from the near-identical Blacktip.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, 5.2 * s, 9 * s, 8.3 * s, 15 * s, 5.3 * s);
  g.fillStyle(blackTip, 0.8 * alpha);
  g.fillCircle(9 * s, 8.3 * s, 1.3 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(11 * s, 5.2 * s, 9 * s, 8.3 * s, 15 * s, 5.3 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(12 * s, -4.4 * s, 15 * s, -3.9 * s, 13.3 * s, -7.4 * s);
  g.fillStyle(blackTip, 0.8 * alpha);
  g.fillCircle(13.3 * s, -7.4 * s, 1.1 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(12 * s, -4.4 * s, 15 * s, -3.9 * s, 13.3 * s, -7.4 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -28, y: -2.6 },
    { x: -18, y: -4.4 },
    { x: -7, y: -5.4 },
    { x: 3, y: -5.4 },
    { x: 12, y: -4.5 },
    { x: 20, y: -3.2 },
    { x: 25, y: -1.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (1.8 + Math.sin(i * 1.3) * 0.9) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5.5 * s, -7.2 * s, 5.5 * s, -6.3 * s, 1 * s, -17.5 * s);
  g.fillStyle(blackTip, 0.8 * alpha);
  g.fillCircle(1 * s, -17.5 * s, 1.7 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-5.5 * s, -7.2 * s, 5.5 * s, -6.3 * s, 1 * s, -17.5 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -25 + i * 1.8;
    g.beginPath();
    g.moveTo(gx * s, -3.9 * s);
    g.lineTo((gx - 1) * s, 3.3 * s);
    g.strokePath();
  }

  // The longer, more pointed snout - the real Spinner's own body-shape
  // differentiator from the Blacktip's blunter one.
  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-31.5 * s, 1 * s);
  g.lineTo(-20 * s, 3.4 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -30 + i * 2.4;
    g.fillTriangle(tx * s, 1.3 * s, (tx + 1.1) * s, 1.7 * s, (tx + 0.4) * s, 3.4 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-23.5 * s, -2.6 * s, 1.4 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-23.5 * s, -2.6 * s, 0.75 * s);

  g.restore();
}

// A hammerhead - the plain baseline of the family here: a moderately
// curved, smooth-edged hammer (no scallops or central notch), plain
// grey coloring, and an ordinary dorsal fin height - deliberately not
// as extreme as the Scalloped or Great Hammerhead right next to it.
export function drawHammerhead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x707868;
  const bellyColor = 0xeef0e8;
  const finColor = 0x707868;
  const darkColor = 0x242820;
  const toothColor = 0xf0eee4;

  const body = [
    { x: -30, y: 0 },
    { x: -26, y: -4.2 },
    { x: -16, y: -7.4 },
    { x: -4, y: -9.4 },
    { x: 8, y: -9.4 },
    { x: 18, y: -7.8 },
    { x: 26, y: -5.4 },
    { x: 32, y: -2.4 },
    { x: 32, y: 2.4 },
    { x: 26, y: 5.4 },
    { x: 18, y: 7.8 },
    { x: 8, y: 9.4 },
    { x: -4, y: 9.4 },
    { x: -16, y: 7.4 },
    { x: -26, y: 4.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.8, bow: 12, len: 24, baseY: -2.4, w: 5.2 },
    { angle: 0.52, bow: -6, len: 11, baseY: 2.4, w: 4 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (32 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 4.7 * s, -15 * s, 18.5 * s, -1.5 * s, 8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 4.7 * s, -15 * s, 18.5 * s, -1.5 * s, 8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(9 * s, 8.7 * s, 6 * s, 15 * s, 16 * s, 8.7 * s);
  g.fillTriangle(20 * s, -7.2 * s, 24 * s, -6.5 * s, 21.5 * s, -12 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(20 * s, -7.2 * s, 24 * s, -6.5 * s, 21.5 * s, -12 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -26, y: -4.2 },
    { x: -16, y: -7.4 },
    { x: -4, y: -9.4 },
    { x: 8, y: -9.4 },
    { x: 18, y: -7.8 },
    { x: 26, y: -5.4 },
    { x: 32, y: -2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.4 + Math.sin(i * 1.3) * 1.2) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6.5 * s, -9.4 * s, 7 * s, -8.2 * s, 1 * s, -22 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-6.5 * s, -9.4 * s, 7 * s, -8.2 * s, 1 * s, -22 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -24 + i * 2.1;
    g.beginPath();
    g.moveTo(gx * s, -6.4 * s);
    g.lineTo((gx - 1.2) * s, 5.2 * s);
    g.strokePath();
  }

  // The hammer - a moderately curved, smooth-edged mallet shape, the
  // family's own construction, kept plain and unremarkable here.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(
    [
      { x: -30, y: -0.6 },
      { x: -33, y: -7 },
      { x: -30, y: -8.5 },
      { x: -27, y: -3 },
      { x: -25, y: -3 },
      { x: -27, y: -8.5 },
      { x: -24, y: -7 },
      { x: -21, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(
    [
      { x: -30, y: -0.6 },
      { x: -33, y: -7 },
      { x: -30, y: -8.5 },
      { x: -27, y: -3 },
      { x: -25, y: -3 },
      { x: -27, y: -8.5 },
      { x: -24, y: -7 },
      { x: -21, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: (p.y - 2) * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -30, y: -0.6 },
      { x: -33, y: -7 },
      { x: -30, y: -8.5 },
      { x: -27, y: -3 },
      { x: -25, y: -3 },
      { x: -27, y: -8.5 },
      { x: -24, y: -7 },
      { x: -21, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-30 * s, 1.5 * s);
  g.lineTo(-21 * s, 3 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -29 + i * 2.6;
    g.fillTriangle(tx * s, 1.8 * s, (tx + 1.3) * s, 2.3 * s, (tx + 0.4) * s, 4.4 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-32 * s, -6.7 * s, 1.4 * s);
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-25.5 * s, -6.7 * s, 1.4 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-32 * s, -6.7 * s, 0.75 * s);
  g.fillCircle(-25.5 * s, -6.7 * s, 0.75 * s);

  g.restore();
}

// A scalloped hammerhead - told apart from the plain Hammerhead here by
// the real animal's own field mark: a distinct central notch cut into
// the front-center of the hammer, plus a wavy, scalloped (rather than
// smooth) leading margin along the whole hammer edge.
export function drawScallopedHammerhead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x66705e;
  const bellyColor = 0xeaeee2;
  const finColor = 0x66705e;
  const darkColor = 0x20241a;
  const toothColor = 0xf0eee4;

  const body = [
    { x: -31, y: 0 },
    { x: -27, y: -4.4 },
    { x: -17, y: -7.6 },
    { x: -4, y: -9.6 },
    { x: 9, y: -9.6 },
    { x: 19, y: -8 },
    { x: 27, y: -5.6 },
    { x: 33, y: -2.4 },
    { x: 33, y: 2.4 },
    { x: 27, y: 5.6 },
    { x: 19, y: 8 },
    { x: 9, y: 9.6 },
    { x: -4, y: 9.6 },
    { x: -17, y: 7.6 },
    { x: -27, y: 4.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.8, bow: 12.5, len: 24.5, baseY: -2.4, w: 5.3 },
    { angle: 0.52, bow: -6, len: 11, baseY: 2.4, w: 4 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (33 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9.5 * s, 4.7 * s, -15.5 * s, 18.5 * s, -1.5 * s, 8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9.5 * s, 4.7 * s, -15.5 * s, 18.5 * s, -1.5 * s, 8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(10 * s, 8.9 * s, 7 * s, 15.2 * s, 17 * s, 8.9 * s);
  g.fillTriangle(21 * s, -7.4 * s, 25 * s, -6.7 * s, 22.5 * s, -12.2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(21 * s, -7.4 * s, 25 * s, -6.7 * s, 22.5 * s, -12.2 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -27, y: -4.4 },
    { x: -17, y: -7.6 },
    { x: -4, y: -9.6 },
    { x: 9, y: -9.6 },
    { x: 19, y: -8 },
    { x: 27, y: -5.6 },
    { x: 33, y: -2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.4 + Math.sin(i * 1.3) * 1.2) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6.5 * s, -9.6 * s, 7.5 * s, -8.3 * s, 1 * s, -21 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-6.5 * s, -9.6 * s, 7.5 * s, -8.3 * s, 1 * s, -21 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -25 + i * 2.2;
    g.beginPath();
    g.moveTo(gx * s, -6.5 * s);
    g.lineTo((gx - 1.3) * s, 5.4 * s);
    g.strokePath();
  }

  // The hammer, with a distinct central notch at the front and a wavy,
  // scalloped leading margin - the real Scalloped Hammerhead's own
  // field mark.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(
    [
      { x: -31, y: -0.6 },
      { x: -34, y: -6 },
      { x: -32.5, y: -8 },
      { x: -30, y: -6 },
      { x: -28.5, y: -3.5 },
      { x: -27, y: -3 },
      { x: -25, y: -3 },
      { x: -26.5, y: -3.5 },
      { x: -28, y: -6 },
      { x: -25.5, y: -8 },
      { x: -24, y: -6 },
      { x: -21, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(
    [
      { x: -31, y: -0.6 },
      { x: -34, y: -6 },
      { x: -32.5, y: -8 },
      { x: -30, y: -6 },
      { x: -28.5, y: -3.5 },
      { x: -27, y: -3 },
      { x: -25, y: -3 },
      { x: -26.5, y: -3.5 },
      { x: -28, y: -6 },
      { x: -25.5, y: -8 },
      { x: -24, y: -6 },
      { x: -21, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: (p.y - 2) * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -31, y: -0.6 },
      { x: -34, y: -6 },
      { x: -32.5, y: -8 },
      { x: -30, y: -6 },
      { x: -28.5, y: -3.5 },
      { x: -27, y: -3 },
      { x: -25, y: -3 },
      { x: -26.5, y: -3.5 },
      { x: -28, y: -6 },
      { x: -25.5, y: -8 },
      { x: -24, y: -6 },
      { x: -21, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-31 * s, 1.5 * s);
  g.lineTo(-21 * s, 3 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -30 + i * 2.7;
    g.fillTriangle(tx * s, 1.8 * s, (tx + 1.3) * s, 2.3 * s, (tx + 0.4) * s, 4.4 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-32.5 * s, -6.8 * s, 1.3 * s);
  g.fillCircle(-26 * s, -6.8 * s, 1.3 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-32.5 * s, -6.8 * s, 0.7 * s);
  g.fillCircle(-26 * s, -6.8 * s, 0.7 * s);

  g.restore();
}

// A great hammerhead - the largest hammerhead there is, and the real
// animal's own two field marks given full size: the straightest, most
// rectangular hammer of the family (far less curved/rounded than the
// Scalloped or plain Hammerhead), and a genuinely tall, straight,
// sickle-shaped first dorsal fin - taller than any other shark's dorsal
// in the game.
export function drawGreatHammerhead(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x545c4c;
  const bellyColor = 0xe4e8dc;
  const finColor = 0x545c4c;
  const darkColor = 0x181c12;
  const toothColor = 0xeeece2;

  const body = [
    { x: -38, y: 0 },
    { x: -34, y: -5.2 },
    { x: -22, y: -9 },
    { x: -7, y: -11.4 },
    { x: 8, y: -11.4 },
    { x: 20, y: -9.6 },
    { x: 30, y: -6.6 },
    { x: 37, y: -2.8 },
    { x: 37, y: 2.8 },
    { x: 30, y: 6.6 },
    { x: 20, y: 9.6 },
    { x: 8, y: 11.4 },
    { x: -7, y: 11.4 },
    { x: -22, y: 9 },
    { x: -34, y: 5.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.8, bow: 14, len: 27.5, baseY: -2.8, w: 6 },
    { angle: 0.52, bow: -7, len: 12.5, baseY: 2.8, w: 4.6 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (37 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 5.5 * s, -18 * s, 21.5 * s, -2 * s, 9.4 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-11 * s, 5.5 * s, -18 * s, 21.5 * s, -2 * s, 9.4 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, 10.4 * s, 8 * s, 17.5 * s, 19 * s, 10.4 * s);
  g.fillTriangle(23 * s, -8.6 * s, 27 * s, -7.9 * s, 24.5 * s, -13.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(23 * s, -8.6 * s, 27 * s, -7.9 * s, 24.5 * s, -13.5 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -34, y: -5.2 },
    { x: -22, y: -9 },
    { x: -7, y: -11.4 },
    { x: 8, y: -11.4 },
    { x: 20, y: -9.6 },
    { x: 30, y: -6.6 },
    { x: 37, y: -2.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.8 + Math.sin(i * 1.3) * 1.4) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The genuinely tall, straight, sickle-shaped first dorsal - the real
  // Great Hammerhead's own field mark, taller than any other shark's
  // dorsal here.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -8, y: -11.5 },
      { x: -5, y: -32 },
      { x: 0, y: -34 },
      { x: 5, y: -30 },
      { x: 10, y: -10 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(
    [
      { x: -8, y: -11.5 },
      { x: -5, y: -32 },
      { x: 0, y: -34 },
      { x: 5, y: -30 },
      { x: 10, y: -10 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    false
  );

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -29 + i * 2.4;
    g.beginPath();
    g.moveTo(gx * s, -7.2 * s);
    g.lineTo((gx - 1.4) * s, 6 * s);
    g.strokePath();
  }

  // The hammer - the straightest, most rectangular of the family, far
  // less rounded than the Scalloped or plain Hammerhead's own curved
  // shape.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(
    [
      { x: -37, y: -0.6 },
      { x: -40, y: -7 },
      { x: -37, y: -9 },
      { x: -34, y: -3 },
      { x: -31, y: -3 },
      { x: -28, y: -9 },
      { x: -25, y: -7 },
      { x: -28, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.fillStyle(backColor, 0.55 * alpha);
  g.fillPoints(
    [
      { x: -37, y: -0.6 },
      { x: -40, y: -7 },
      { x: -37, y: -9 },
      { x: -34, y: -3 },
      { x: -31, y: -3 },
      { x: -28, y: -9 },
      { x: -25, y: -7 },
      { x: -28, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: (p.y - 2.2) * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokePoints(
    [
      { x: -37, y: -0.6 },
      { x: -40, y: -7 },
      { x: -37, y: -9 },
      { x: -34, y: -3 },
      { x: -31, y: -3 },
      { x: -28, y: -9 },
      { x: -25, y: -7 },
      { x: -28, y: -0.6 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-37 * s, 1.5 * s);
  g.lineTo(-27 * s, 3.2 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -36 + i * 3;
    g.fillTriangle(tx * s, 1.8 * s, (tx + 1.5) * s, 2.4 * s, (tx + 0.5) * s, 4.8 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-38.5 * s, -6.7 * s, 1.5 * s);
  g.fillCircle(-27 * s, -6.7 * s, 1.5 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-38.5 * s, -6.7 * s, 0.8 * s);
  g.fillCircle(-27 * s, -6.7 * s, 0.8 * s);

  g.restore();
}

// A wobbegong - a real, flat carpet shark built on a construction
// nothing else in the game shares: a broad, flattened, camouflaged body
// (nowhere near the torpedo shape of any other shark here), small
// dorsal fins set far back, and the family's own hallmark - a fringe of
// branching, whisker-like dermal barbels around the mouth and chin. A
// baseline mottled tan-brown camouflage pattern.
export function drawWobbegong(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x8c7850;
  const backColor = 0x5c4c2c;
  const bellyColor = 0xc8b888;
  const finColor = 0x6c5c38;
  const darkColor = 0x2c2414;
  const mottleColor = 0x443a20;

  // A broad, flattened body - a completely different silhouette from
  // any torpedo-shaped shark here.
  const body = [
    { x: -22, y: -6 },
    { x: -24, y: 0 },
    { x: -20, y: 8 },
    { x: -10, y: 13 },
    { x: 3, y: 15 },
    { x: 16, y: 12 },
    { x: 25, y: 6 },
    { x: 25, y: -6 },
    { x: 16, y: -12 },
    { x: 3, y: -15 },
    { x: -10, y: -13 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25 * s, -5 * s, 34 * s, -3 * s, 27 * s, 2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(25 * s, -5 * s, 34 * s, -3 * s, 27 * s, 2 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 12.5 * s, -13 * s, 20 * s, 0, 15.5 * s);
  g.fillTriangle(6 * s, 14.5 * s, 3 * s, 21 * s, 12 * s, 14.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Baseline mottled tan-brown camouflage.
  g.fillStyle(mottleColor, 0.4 * alpha);
  [
    [-10, -3, 4],
    [0, 4, 4.4],
    [8, -5, 3.8],
    [-2, -9, 3.2],
    [12, 2, 3.4]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.4 * s, br * s));

  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(0, -15.2 * s, 8 * s, -13.5 * s, 3 * s, -21 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(0, -15.2 * s, 8 * s, -13.5 * s, 3 * s, -21 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -20 + i * 1.4;
    g.beginPath();
    g.moveTo(gx * s, -10 * s);
    g.lineTo((gx - 0.6) * s, -4 * s);
    g.strokePath();
  }

  // The fringe of branching, whisker-like dermal barbels around the
  // mouth and chin - the real Wobbegong family's own hallmark, a
  // construction unique to this cluster.
  g.lineStyle(0.9 * s, finColor, 0.85 * alpha);
  for (let i = 0; i < 6; i += 1) {
    const bx = -23 + i * 1.5;
    g.beginPath();
    g.moveTo(bx * s, 4 * s);
    quadCurveTo(g, bx * s, 4 * s, (bx - 1.4) * s, (7 + (i % 2)) * s, bx * s, (9 + (i % 2) * 1.4) * s);
    g.strokePath();
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-18 * s, -6 * s, 1.6 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-18 * s, -6 * s, 0.85 * s);

  g.restore();
}

// An ornate wobbegong - the same real carpet-shark family here, but told
// apart by the real animal's own field mark: bold, symmetrical, dark-
// margined "rosette" ring blotches, a geometric, ornate pattern (the
// real detail the species is named for), unlike the plain Wobbegong's
// own simple mottling or the Spotted Wobbegong's own dense small spots.
export function drawOrnateWobbegong(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa08858;
  const backColor = 0x6c5830;
  const bellyColor = 0xd8c894;
  const finColor = 0x7c6838;
  const darkColor = 0x2c2414;
  const rosetteColor = 0x4c3e1e;
  const rosetteFill = 0xc8a860;

  const body = [
    { x: -23, y: -6.2 },
    { x: -25, y: 0 },
    { x: -21, y: 8.2 },
    { x: -11, y: 13.4 },
    { x: 3, y: 15.4 },
    { x: 16.5, y: 12.4 },
    { x: 25.5, y: 6.2 },
    { x: 25.5, y: -6.2 },
    { x: 16.5, y: -12.4 },
    { x: 3, y: -15.4 },
    { x: -11, y: -13.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(25.5 * s, -5.2 * s, 35 * s, -3 * s, 27.5 * s, 2.2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(25.5 * s, -5.2 * s, 35 * s, -3 * s, 27.5 * s, 2.2 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 12.9 * s, -13.4 * s, 20.6 * s, 0, 16 * s);
  g.fillTriangle(6.2 * s, 15 * s, 3 * s, 21.6 * s, 12.4 * s, 15.3 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Bold, symmetrical, dark-margined rosette ring blotches - the real
  // Ornate Wobbegong's own geometric field mark.
  [
    [-9, -4, 3.4],
    [0, 3, 3.8],
    [9, -6, 3.2],
    [-2, -9, 2.8],
    [12, 3, 2.8]
  ].forEach(([bx, by, br]) => {
    g.lineStyle(1.4 * s, rosetteColor, 0.55 * alpha);
    g.strokeEllipse(bx * s, by * s, br * s, br * 0.75 * s);
    g.fillStyle(rosetteFill, 0.35 * alpha);
    g.fillEllipse(bx * s, by * s, br * 0.5 * s, br * 0.38 * s);
  });

  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(0, -15.6 * s, 8.2 * s, -13.9 * s, 3 * s, -21.6 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(0, -15.6 * s, 8.2 * s, -13.9 * s, 3 * s, -21.6 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -21 + i * 1.4;
    g.beginPath();
    g.moveTo(gx * s, -10.2 * s);
    g.lineTo((gx - 0.6) * s, -4.1 * s);
    g.strokePath();
  }

  g.lineStyle(0.9 * s, finColor, 0.85 * alpha);
  for (let i = 0; i < 6; i += 1) {
    const bx = -24 + i * 1.5;
    g.beginPath();
    g.moveTo(bx * s, 4.1 * s);
    quadCurveTo(g, bx * s, 4.1 * s, (bx - 1.4) * s, (7.2 + (i % 2)) * s, bx * s, (9.2 + (i % 2) * 1.4) * s);
    g.strokePath();
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-19 * s, -6.1 * s, 1.6 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-19 * s, -6.1 * s, 0.85 * s);

  g.restore();
}

// A spotted wobbegong - the same carpet-shark family, told apart by the
// real animal's own field mark: numerous small, simple, pale rounded
// spots scattered densely over a darker background - a plainer, denser
// pattern than the Ornate Wobbegong's own bold, geometric rosettes.
export function drawSpottedWobbegong(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x5c5238;
  const backColor = 0x38321e;
  const bellyColor = 0x948458;
  const finColor = 0x44402a;
  const darkColor = 0x181510;
  const spotColor = 0xd0c498;

  const body = [
    { x: -21.5, y: -5.8 },
    { x: -23.5, y: 0 },
    { x: -19.5, y: 7.6 },
    { x: -10, y: 12.4 },
    { x: 2.8, y: 14.3 },
    { x: 15.5, y: 11.5 },
    { x: 24, y: 5.8 },
    { x: 24, y: -5.8 },
    { x: 15.5, y: -11.5 },
    { x: 2.8, y: -14.3 },
    { x: -10, y: -12.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -4.8 * s, 33 * s, -2.8 * s, 26 * s, 2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(24 * s, -4.8 * s, 33 * s, -2.8 * s, 26 * s, 2 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7.5 * s, 11.9 * s, -12.5 * s, 19 * s, 0, 14.6 * s);
  g.fillTriangle(5.8 * s, 13.9 * s, 2.8 * s, 20 * s, 11.5 * s, 14.2 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Numerous small, simple, pale rounded spots, densely scattered - the
  // real Spotted Wobbegong's own field mark, plainer and denser than
  // the Ornate Wobbegong's bold rosettes.
  g.fillStyle(spotColor, 0.55 * alpha);
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const sx = -18 + col * 6.5 + (row % 2) * 3;
      const sy = -10 + row * 4.6;
      g.fillCircle(sx * s, sy * s, 0.8 * s);
    }
  }

  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(0, -14.5 * s, 7.7 * s, -12.9 * s, 2.8 * s, -20 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(0, -14.5 * s, 7.7 * s, -12.9 * s, 2.8 * s, -20 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -19.5 + i * 1.3;
    g.beginPath();
    g.moveTo(gx * s, -9.4 * s);
    g.lineTo((gx - 0.6) * s, -3.8 * s);
    g.strokePath();
  }

  g.lineStyle(0.9 * s, finColor, 0.85 * alpha);
  for (let i = 0; i < 6; i += 1) {
    const bx = -22.5 + i * 1.4;
    g.beginPath();
    g.moveTo(bx * s, 3.8 * s);
    quadCurveTo(g, bx * s, 3.8 * s, (bx - 1.3) * s, (6.7 + (i % 2)) * s, bx * s, (8.6 + (i % 2) * 1.3) * s);
    g.strokePath();
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-17.8 * s, -5.7 * s, 1.5 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-17.8 * s, -5.7 * s, 0.8 * s);

  g.restore();
}

// A gummy shark - a real, harmless houndshark, told apart by the real
// animal's own field marks: plain grey with small scattered white spots,
// a blunt rounded snout, and a smooth, closed mouth line with no
// visible pointed teeth at all - real gummy sharks have flat, plate-like
// grinding teeth, the actual detail the species is named for.
export function drawGummyShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x848c8c;
  const bellyColor = 0xecefee;
  const finColor = 0x848c8c;
  const darkColor = 0x282c2c;
  const spotColor = 0xf4f4f0;

  const body = [
    { x: -27, y: 0 },
    { x: -23, y: -3.8 },
    { x: -14, y: -6.6 },
    { x: -3, y: -8.4 },
    { x: 8, y: -8.4 },
    { x: 17, y: -7 },
    { x: 24, y: -4.8 },
    { x: 29, y: -2.2 },
    { x: 29, y: 2.2 },
    { x: 24, y: 4.8 },
    { x: 17, y: 7 },
    { x: 8, y: 8.4 },
    { x: -3, y: 8.4 },
    { x: -14, y: 6.6 },
    { x: -23, y: 3.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.78, bow: 9.5, len: 19.5, baseY: -2.2, w: 4.2 },
    { angle: 0.5, bow: -4.6, len: 9, baseY: 2.2, w: 3.2 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (29 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 4.1 * s, -13.5 * s, 16 * s, -1.5 * s, 7.1 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 4.1 * s, -13.5 * s, 16 * s, -1.5 * s, 7.1 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(6 * s, 7.6 * s, 3.5 * s, 13 * s, 12.5 * s, 7.6 * s);
  g.fillTriangle(15.5 * s, -6.4 * s, 19 * s, -5.8 * s, 17 * s, -10.6 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(15.5 * s, -6.4 * s, 19 * s, -5.8 * s, 17 * s, -10.6 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  // Small scattered white spots - the real Gummy Shark's own field
  // mark.
  g.fillStyle(spotColor, 0.75 * alpha);
  [
    [-10, -3, 0.9],
    [-3, -5.4, 0.9],
    [5, -3.8, 0.85],
    [-6, 2, 0.85],
    [2, 4, 0.85],
    [10, -1, 0.8],
    [-13, 1.5, 0.8]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  const topProfile = [
    { x: -23, y: -3.8 },
    { x: -14, y: -6.6 },
    { x: -3, y: -8.4 },
    { x: 8, y: -8.4 },
    { x: 17, y: -7 },
    { x: 24, y: -4.8 },
    { x: 29, y: -2.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.2 + Math.sin(i * 1.3) * 1.1) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5.5 * s, -8.4 * s, 6 * s, -7.3 * s, 1 * s, -16.5 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-5.5 * s, -8.4 * s, 6 * s, -7.3 * s, 1 * s, -16.5 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -20 + i * 1.7;
    g.beginPath();
    g.moveTo(gx * s, -5.6 * s);
    g.lineTo((gx - 1) * s, 4.6 * s);
    g.strokePath();
  }

  // A blunt, rounded snout and a smooth, closed mouth line - real gummy
  // sharks have flat plate-like grinding teeth, never visible points.
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-26.5 * s, 0.6 * s);
  quadCurveTo(g, -26.5 * s, 0.6 * s, -24 * s, 2.4 * s, -19 * s, 3 * s);
  g.strokePath();

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-19.5 * s, -2.6 * s, 1.4 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-19.5 * s, -2.6 * s, 0.75 * s);

  g.restore();
}

// A school shark - a real houndshark, told apart by the real animal's
// own field mark: a distinctly long, slender, pointed snout - much
// finer and pointier than the Gummy Shark's own blunt rounded one - a
// plain grey-bronze body, a small second dorsal set well back, and a
// long tail with a small subterminal notch near its tip.
export function drawSchoolShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x746c58;
  const bellyColor = 0xeae6d8;
  const finColor = 0x746c58;
  const darkColor = 0x241f14;
  const toothColor = 0xf0eee2;

  const body = [
    { x: -32, y: 0 },
    { x: -28, y: -2.9 },
    { x: -18, y: -4.9 },
    { x: -6, y: -6.2 },
    { x: 6, y: -6.2 },
    { x: 15, y: -5.1 },
    { x: 22, y: -3.5 },
    { x: 27, y: -1.6 },
    { x: 27, y: 1.6 },
    { x: 22, y: 3.5 },
    { x: 15, y: 5.1 },
    { x: 6, y: 6.2 },
    { x: -6, y: 6.2 },
    { x: -18, y: 4.9 },
    { x: -28, y: 2.9 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A long tail with a small subterminal notch near its tip - a real
  // School Shark trait.
  [
    { angle: -0.91, bow: 17, len: 33, baseY: -1.6, w: 3.6 },
    { angle: 0.38, bow: -3.5, len: 7, baseY: 1.6, w: 2.4 }
  ].forEach(({ angle, bow, len, baseY, w }, idx) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (27 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
    if (idx === 0) {
      g.lineStyle(0.8 * s, darkColor, 0.4 * alpha);
      g.beginPath();
      g.moveTo(shape[7].x, shape[7].y);
      g.lineTo(shape[7].x - 2 * s, shape[7].y + 2 * s);
      g.strokePath();
    }
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 3.0 * s, -14.5 * s, 11.9 * s, -2 * s, 5.2 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 3.0 * s, -14.5 * s, 11.9 * s, -2 * s, 5.2 * s);

  // The small second dorsal, set well back.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(14 * s, -4.8 * s, 17.5 * s, -4.4 * s, 15.7 * s, -7.6 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(14 * s, -4.8 * s, 17.5 * s, -4.4 * s, 15.7 * s, -7.6 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(5.5 * s, 5.7 * s, 3 * s, 9.9 * s, 12 * s, 5.7 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -28, y: -2.9 },
    { x: -18, y: -4.9 },
    { x: -6, y: -6.2 },
    { x: 6, y: -6.2 },
    { x: 15, y: -5.1 },
    { x: 22, y: -3.5 },
    { x: 27, y: -1.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2 + Math.sin(i * 1.3) * 1) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -7.8 * s, 5.5 * s, -6.8 * s, 0.8 * s, -18.5 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-5 * s, -7.8 * s, 5.5 * s, -6.8 * s, 0.8 * s, -18.5 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -24 + i * 1.9;
    g.beginPath();
    g.moveTo(gx * s, -4.1 * s);
    g.lineTo((gx - 1.1) * s, 3.3 * s);
    g.strokePath();
  }

  // The distinctly long, slender, pointed snout - the real School
  // Shark's own field mark, much finer than the Gummy Shark's blunt one.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-31.5 * s, 1 * s);
  g.lineTo(-20 * s, 3.6 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -30 + i * 2.4;
    g.fillTriangle(tx * s, 1.4 * s, (tx + 1.1) * s, 1.8 * s, (tx + 0.4) * s, 3.6 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-23.5 * s, -2.8 * s, 1.4 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-23.5 * s, -2.8 * s, 0.75 * s);

  g.restore();
}

// A blue shark - a real, sleek pelagic shark, built around two genuine
// field marks: the single most vivid, saturated blue-black back of any
// shark here, cut sharply to a bright white belly, and extremely long,
// slender, wing-like pectoral fins - noticeably longer than any other
// shark's own pectoral fins.
export function drawBlueShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x2050a0;
  const bellyColor = 0xf6f8f8;
  const finColor = 0x2050a0;
  const darkColor = 0x0c1c38;
  const toothColor = 0xf2f0ea;

  const body = [
    { x: -34, y: 0 },
    { x: -30, y: -2.5 },
    { x: -19, y: -4.3 },
    { x: -6, y: -5.4 },
    { x: 6, y: -5.4 },
    { x: 16, y: -4.5 },
    { x: 24, y: -3.1 },
    { x: 30, y: -1.4 },
    { x: 30, y: 1.4 },
    { x: 24, y: 3.1 },
    { x: 16, y: 4.5 },
    { x: 6, y: 5.4 },
    { x: -6, y: 5.4 },
    { x: -19, y: 4.3 },
    { x: -30, y: 2.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.9, bow: 14, len: 25, baseY: -1.4, w: 3.1 },
    { angle: 0.44, bow: -4.2, len: 11, baseY: 1.4, w: 2.1 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (30 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  // Extremely long, slender, wing-like pectoral fins - noticeably longer
  // than any other shark's own pectorals.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 2.7 * s, -18 * s, 16.7 * s, -1 * s, 4.8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 2.7 * s, -18 * s, 16.7 * s, -1 * s, 4.8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(6 * s, 5.2 * s, 3.5 * s, 8.8 * s, 12.5 * s, 5.2 * s);
  g.fillTriangle(16.5 * s, -4.3 * s, 20 * s, -3.9 * s, 18 * s, -7.1 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(16.5 * s, -4.3 * s, 20 * s, -3.9 * s, 18 * s, -7.1 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -30, y: -2.5 },
    { x: -19, y: -4.3 },
    { x: -6, y: -5.4 },
    { x: 6, y: -5.4 },
    { x: 16, y: -4.5 },
    { x: 24, y: -3.1 },
    { x: 30, y: -1.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2 + Math.sin(i * 1.3) * 1) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -5.4 * s, 5.5 * s, -4.7 * s, 0.8 * s, -12.9 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-5 * s, -5.4 * s, 5.5 * s, -4.7 * s, 0.8 * s, -12.9 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -25 + i * 2 * 1.05;
    g.beginPath();
    g.moveTo(gx * s, -2.6 * s);
    g.lineTo((gx - 1.2) * s, 2.2 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-33.5 * s, 0.7 * s);
  g.lineTo(-23 * s, 3.1 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -32 + i * 2.6;
    g.fillTriangle(tx * s, 1 * s, (tx + 1.2) * s, 1.3 * s, (tx + 0.4) * s, 2.8 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-25.5 * s, -2.1 * s, 1.7 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-25.5 * s, -2.1 * s, 0.9 * s);

  g.restore();
}

// A spiny dogfish - a real small shark, told apart by the real animal's
// own single most diagnostic field mark, drawn as a true anatomical
// feature no other shark here has: a hard, triangular spine set right
// in front of each of its two dorsal fins - and, just as diagnostic by
// its absence, NO anal fin at all. Grey with small white spots.
export function drawSpinyDogfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x707870;
  const bellyColor = 0xe8ece4;
  const finColor = 0x707870;
  const darkColor = 0x242822;
  const spotColor = 0xeef0e8;
  const spineColor = 0x38403a;

  const body = [
    { x: -20, y: 0 },
    { x: -17, y: -3 },
    { x: -10, y: -5.2 },
    { x: -2, y: -6.4 },
    { x: 6, y: -6.4 },
    { x: 13, y: -5.2 },
    { x: 18, y: -3.6 },
    { x: 22, y: -1.6 },
    { x: 22, y: 1.6 },
    { x: 18, y: 3.6 },
    { x: 13, y: 5.2 },
    { x: 6, y: 6.4 },
    { x: -2, y: 6.4 },
    { x: -10, y: 5.2 },
    { x: -17, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.84, bow: 10.5, len: 21, baseY: -1.6, w: 3.4 },
    { angle: 0.5, bow: -3.4, len: 7, baseY: 1.6, w: 2.4 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (22 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 3.2 * s, -10.5 * s, 11.5 * s, -0.5 * s, 5.2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-6 * s, 3.2 * s, -10.5 * s, 11.5 * s, -0.5 * s, 5.2 * s);

  // NO anal fin drawn here - a real diagnostic absence for this family,
  // unlike every other shark in the game.

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  // Small white spots.
  g.fillStyle(spotColor, 0.7 * alpha);
  [
    [-7, -2, 0.7],
    [-1, -4, 0.65],
    [4, -2.6, 0.65],
    [-4, 1.4, 0.6],
    [2, 2.6, 0.6]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  const topProfile = [
    { x: -17, y: -3 },
    { x: -10, y: -5.2 },
    { x: -2, y: -6.4 },
    { x: 6, y: -6.4 },
    { x: 13, y: -5.2 },
    { x: 18, y: -3.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (1.6 + Math.sin(i * 1.3) * 0.8) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The first dorsal, WITH its own hard triangular spine set right in
  // front of it - the real Spiny Dogfish's own single most diagnostic
  // field mark.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -6.5 * s, 3.5 * s, -5.9 * s, -0.2 * s, -13 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -6.5 * s, 3.5 * s, -5.9 * s, -0.2 * s, -13 * s);
  g.fillStyle(spineColor, alpha);
  g.fillTriangle(-4 * s, -6.4 * s, -2.6 * s, -6.6 * s, -3.5 * s, -10.5 * s);

  // The second dorsal, also with its own spine.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(10 * s, -5.4 * s, 15 * s, -4.8 * s, 12.2 * s, -10.2 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(10 * s, -5.4 * s, 15 * s, -4.8 * s, 12.2 * s, -10.2 * s);
  g.fillStyle(spineColor, alpha);
  g.fillTriangle(9 * s, -5.3 * s, 10.4 * s, -5.5 * s, 9.7 * s, -8.8 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -14.5 + i * 1.3;
    g.beginPath();
    g.moveTo(gx * s, -4.2 * s);
    g.lineTo((gx - 0.8) * s, 3.5 * s);
    g.strokePath();
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-15 * s, -2 * s, 1.1 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-15 * s, -2 * s, 0.6 * s);

  g.restore();
}

// A smooth dogfish - a real, close-sized relative of the Spiny Dogfish
// here, but told genuinely apart by the real animal's own field marks:
// no spines at all on either dorsal fin, no spots, plain smooth
// brownish-grey, and - the real key differentiator - a proper anal fin,
// which the Spiny Dogfish entirely lacks.
export function drawSmoothDogfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x7c7058;
  const bellyColor = 0xe8e2d0;
  const finColor = 0x7c7058;
  const darkColor = 0x282216;
  const toothColor = 0xf0eee2;

  const body = [
    { x: -19, y: 0 },
    { x: -16, y: -3 },
    { x: -9, y: -5.2 },
    { x: -1.5, y: -6.4 },
    { x: 6, y: -6.4 },
    { x: 12.5, y: -5.2 },
    { x: 17.5, y: -3.6 },
    { x: 21, y: -1.6 },
    { x: 21, y: 1.6 },
    { x: 17.5, y: 3.6 },
    { x: 12.5, y: 5.2 },
    { x: 6, y: 6.4 },
    { x: -1.5, y: 6.4 },
    { x: -9, y: 5.2 },
    { x: -16, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.82, bow: 9.8, len: 19.5, baseY: -1.6, w: 3.2 },
    { angle: 0.5, bow: -3.2, len: 6.6, baseY: 1.6, w: 2.2 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (21 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 3.2 * s, -10 * s, 11 * s, -0.5 * s, 5.2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-6 * s, 3.2 * s, -10 * s, 11 * s, -0.5 * s, 5.2 * s);

  // The proper anal fin - the real key differentiator from the Spiny
  // Dogfish, which lacks one entirely.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(4 * s, 6.5 * s, 2 * s, 10.6 * s, 8.5 * s, 6.5 * s);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokeTriangle(4 * s, 6.5 * s, 2 * s, 10.6 * s, 8.5 * s, 6.5 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -16, y: -3 },
    { x: -9, y: -5.2 },
    { x: -1.5, y: -6.4 },
    { x: 6, y: -6.4 },
    { x: 12.5, y: -5.2 },
    { x: 17.5, y: -3.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (1.5 + Math.sin(i * 1.3) * 0.75) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  // Plain first dorsal - no spine, no spots, unlike the Spiny Dogfish.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2.5 * s, -6.5 * s, 3.8 * s, -5.9 * s, 0 * s, -12.5 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-2.5 * s, -6.5 * s, 3.8 * s, -5.9 * s, 0 * s, -12.5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(9.5 * s, -5.4 * s, 14 * s, -4.8 * s, 11.4 * s, -9.6 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(9.5 * s, -5.4 * s, 14 * s, -4.8 * s, 11.4 * s, -9.6 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -13.5 + i * 1.25;
    g.beginPath();
    g.moveTo(gx * s, -4.2 * s);
    g.lineTo((gx - 0.75) * s, 3.4 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-18.5 * s, 0.5 * s);
  g.lineTo(-13 * s, 2.6 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  g.fillTriangle(-17 * s, 1 * s, -15.5 * s, 1.4 * s, -16.2 * s, 3 * s);

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-14 * s, -1.9 * s, 1.1 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-14 * s, -1.9 * s, 0.6 * s);

  g.restore();
}

// A seven gilled shark - a real, ancient primitive shark lineage, built
// with a construction nothing else in the game shares: SEVEN visible
// gill slits (a row of seven lines rather than the usual five every
// other shark here has), and a single dorsal fin set far back near the
// tail - real primitive sharks never evolved a second dorsal at all,
// unlike every modern shark drawn elsewhere here.
export function drawSevenGilledShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x686858;
  const bellyColor = 0xe4e2d4;
  const finColor = 0x686858;
  const darkColor = 0x201f16;
  const toothColor = 0xece8dc;

  const body = [
    { x: -32, y: 0 },
    { x: -28, y: -4.8 },
    { x: -18, y: -8.2 },
    { x: -5, y: -10.2 },
    { x: 8, y: -10 },
    { x: 18, y: -8 },
    { x: 26, y: -5.4 },
    { x: 31, y: -2.4 },
    { x: 31, y: 2.4 },
    { x: 26, y: 5.4 },
    { x: 18, y: 8 },
    { x: 8, y: 10 },
    { x: -5, y: 10.2 },
    { x: -18, y: 8.2 },
    { x: -28, y: 4.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.9, bow: 15.5, len: 30, baseY: -2.4, w: 5 },
    { angle: 0.48, bow: -4.8, len: 9, baseY: 2.4, w: 3.4 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (31 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 4.9 * s, -15 * s, 19 * s, -1.5 * s, 8.4 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 4.9 * s, -15 * s, 19 * s, -1.5 * s, 8.4 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(9 * s, 9.6 * s, 6 * s, 16 * s, 16 * s, 9.6 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -28, y: -4.8 },
    { x: -18, y: -8.2 },
    { x: -5, y: -10.2 },
    { x: 8, y: -10 },
    { x: 18, y: -8 },
    { x: 26, y: -5.4 },
    { x: 31, y: -2.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.4 + Math.sin(i * 1.3) * 1.2) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // A single dorsal fin set far back near the tail - real primitive
  // sharks never evolved a second dorsal, unlike every modern shark
  // drawn elsewhere here.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(15 * s, -8.4 * s, 24 * s, -6.4 * s, 18.5 * s, -18 * s);
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(15 * s, -8.4 * s, 24 * s, -6.4 * s, 18.5 * s, -18 * s);

  // Seven visible gill slits - the real Sevengill's own single most
  // unmistakable field mark, a construction unique to this and the
  // Sixgill Shark.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  for (let i = 0; i < 7; i += 1) {
    const gx = -26 + i * 1.9;
    g.beginPath();
    g.moveTo(gx * s, -7.2 * s);
    g.lineTo((gx - 1) * s, 6 * s);
    g.strokePath();
  }

  // A broad, rounded snout - a real primitive-shark head shape.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-31.5 * s, 1 * s);
  quadCurveTo(g, -31.5 * s, 1 * s, -29 * s, 3.2 * s, -22 * s, 4 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -29 + i * 2.6;
    g.fillTriangle(tx * s, 1.6 * s, (tx + 1.2) * s, 2.1 * s, (tx + 0.4) * s, 3.9 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-22 * s, -3.2 * s, 1.7 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-22 * s, -3.2 * s, 0.9 * s);

  g.restore();
}

// A six gilled shark - a real, ancient primitive shark, bulkier and
// heavier than the Sevengill here, told apart by two real field marks:
// SIX visible gill slits (one fewer than the Sevengill), and large,
// pale, glowing eyes - a real deep-water adaptation for hunting in the
// dark. Also carries a single far-back dorsal fin, the same real
// primitive-shark trait as the Sevengill, but on a blunter-snouted,
// bulkier frame. Only ever found deep.
export function drawSixGilledShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x5c5648;
  const bellyColor = 0xd8d4c4;
  const finColor = 0x5c5648;
  const darkColor = 0x1c1810;
  const toothColor = 0xe8e4d6;
  const eyeGlow = 0xa8e8b8;

  const body = [
    { x: -34, y: 0 },
    { x: -30, y: -5.6 },
    { x: -19, y: -10 },
    { x: -5, y: -12.6 },
    { x: 9, y: -12.4 },
    { x: 20, y: -10 },
    { x: 28, y: -6.8 },
    { x: 33, y: -3 },
    { x: 33, y: 3 },
    { x: 28, y: 6.8 },
    { x: 20, y: 10 },
    { x: 9, y: 12.4 },
    { x: -5, y: 12.6 },
    { x: -19, y: 10 },
    { x: -30, y: 5.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.88, bow: 16, len: 30, baseY: -3, w: 5.6 },
    { angle: 0.48, bow: -5.4, len: 10, baseY: 3, w: 3.8 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (33 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-10 * s, 6 * s, -17 * s, 22.5 * s, -2 * s, 10.4 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-10 * s, 6 * s, -17 * s, 22.5 * s, -2 * s, 10.4 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(10 * s, 11.9 * s, 6.5 * s, 19.5 * s, 18 * s, 11.9 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -30, y: -5.6 },
    { x: -19, y: -10 },
    { x: -5, y: -12.6 },
    { x: 9, y: -12.4 },
    { x: 20, y: -10 },
    { x: 28, y: -6.8 },
    { x: 33, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (3 + Math.sin(i * 1.3) * 1.5) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.3 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The single far-back dorsal fin - the same real primitive-shark trait
  // as the Sevengill, on a bulkier frame here.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(17 * s, -10.4 * s, 27 * s, -7.8 * s, 21 * s, -21.5 * s);
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(17 * s, -10.4 * s, 27 * s, -7.8 * s, 21 * s, -21.5 * s);

  // Six visible gill slits - one fewer than the Sevengill Shark right
  // next to it.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  for (let i = 0; i < 6; i += 1) {
    const gx = -28 + i * 2.1;
    g.beginPath();
    g.moveTo(gx * s, -8.6 * s);
    g.lineTo((gx - 1.2) * s, 7.2 * s);
    g.strokePath();
  }

  // A blunter, heavier snout than the Sevengill's own more pointed one.
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-33.5 * s, 1 * s);
  quadCurveTo(g, -33.5 * s, 1 * s, -30.5 * s, 3.6 * s, -23 * s, 4.6 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -31 + i * 2.8;
    g.fillTriangle(tx * s, 1.8 * s, (tx + 1.3) * s, 2.4 * s, (tx + 0.4) * s, 4.4 * s);
  }

  // Large, pale, glowing eyes - a real deep-water adaptation.
  g.fillStyle(eyeGlow, 0.5 * alpha);
  g.fillCircle(-23.5 * s, -3.6 * s, 2.8 * s);
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-23.5 * s, -3.6 * s, 1.9 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-23.5 * s, -3.6 * s, 1 * s);

  g.restore();
}

// A sawshark - built with a construction nothing else in the game
// shares: a long, flat, blade-like rostrum extending from the snout,
// lined along both edges with alternating large and small teeth, and a
// pair of long, dangling barbels partway along the underside of the saw
// - the real animal's own sensory organs and the single most
// unmistakable head shape of any fish or shark in the game. Slender
// body, two dorsal fins, no anal fin - a real sawshark trait.
export function drawSawshark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x8c7c5c;
  const bellyColor = 0xe4dcc4;
  const finColor = 0x8c7c5c;
  const darkColor = 0x2c2414;
  const sawColor = 0x746850;
  const toothColor = 0xf0eee2;
  const barbelColor = 0x6c6048;

  const body = [
    { x: -18, y: 0 },
    { x: -15, y: -3 },
    { x: -8, y: -5.2 },
    { x: 0, y: -6.4 },
    { x: 8, y: -6.2 },
    { x: 15, y: -5 },
    { x: 21, y: -3.2 },
    { x: 25, y: -1.5 },
    { x: 25, y: 1.5 },
    { x: 21, y: 3.2 },
    { x: 15, y: 5 },
    { x: 8, y: 6.2 },
    { x: 0, y: 6.4 },
    { x: -8, y: 5.2 },
    { x: -15, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.8, bow: 9.5, len: 19, baseY: -1.5, w: 3.4 },
    { angle: 0.5, bow: -3.8, len: 8, baseY: 1.5, w: 2.4 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (25 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, 3.4 * s, -9 * s, 10.5 * s, 0, 5.5 * s);

  // The long, flat, blade-like saw rostrum, lined with alternating large
  // and small teeth along both edges - the real Sawshark's own single
  // most unmistakable field mark.
  g.fillStyle(sawColor, alpha);
  g.fillPoints(
    [
      { x: -18, y: -1 },
      { x: -34, y: -1.3 },
      { x: -34, y: 1.3 },
      { x: -18, y: 1 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  g.strokePoints(
    [
      { x: -18, y: -1 },
      { x: -34, y: -1.3 },
      { x: -34, y: 1.3 },
      { x: -18, y: 1 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 7; i += 1) {
    const tx = -32 + i * 2.1;
    const big = i % 2 === 0;
    const th = big ? 2.4 : 1.4;
    g.fillTriangle(tx * s, -1.2 * s, (tx + 1) * s, -1.2 * s, (tx + 0.5) * s, (-1.2 - th) * s);
    g.fillTriangle(tx * s, 1.2 * s, (tx + 1) * s, 1.2 * s, (tx + 0.5) * s, (1.2 + th) * s);
  }

  // The pair of long, dangling barbels partway along the saw's
  // underside - a real sensory organ, and unique to this fish.
  g.lineStyle(0.8 * s, barbelColor, 0.85 * alpha);
  g.beginPath();
  g.moveTo(-25 * s, 1.2 * s);
  g.lineTo(-25.5 * s, 6 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(-27 * s, 1.2 * s);
  g.lineTo(-27.5 * s, 6.4 * s);
  g.strokePath();

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -15, y: -3 },
    { x: -8, y: -5.2 },
    { x: 0, y: -6.4 },
    { x: 8, y: -6.2 },
    { x: 15, y: -5 },
    { x: 21, y: -3.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (1.4 + Math.sin(i * 1.3) * 0.7) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.75 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -6.5 * s, 4 * s, -6 * s, 0.2 * s, -12.5 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -6.5 * s, 4 * s, -6 * s, 0.2 * s, -12.5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(9 * s, -5.2 * s, 13.5 * s, -4.6 * s, 11 * s, -9.5 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(9 * s, -5.2 * s, 13.5 * s, -4.6 * s, 11 * s, -9.5 * s);

  // No anal fin - a real Sawshark trait, like the Spiny Dogfish.

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -12.5 + i * 1.2;
    g.beginPath();
    g.moveTo(gx * s, -4 * s);
    g.lineTo((gx - 0.7) * s, 3.3 * s);
    g.strokePath();
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-12.5 * s, -2 * s, 1.2 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-12.5 * s, -2 * s, 0.65 * s);

  g.restore();
}

// A thresher shark - built with a construction nothing else in the game
// shares: a massively, dramatically elongated upper tail lobe - the real
// animal's own single most extraordinary field mark, as long as the rest
// of the body put together, used to whip and stun schooling baitfish.
// Everything else kept comparatively plain and slender so the tail reads
// as the obvious hero feature.
export function drawThresherShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x4c5860;
  const bellyColor = 0xeceef0;
  const finColor = 0x4c5860;
  const darkColor = 0x181e24;
  const toothColor = 0xf0eee6;

  const body = [
    { x: -24, y: 0 },
    { x: -21, y: -3.6 },
    { x: -13, y: -6.2 },
    { x: -3, y: -7.8 },
    { x: 6, y: -7.8 },
    { x: 14, y: -6.4 },
    { x: 20, y: -4.2 },
    { x: 24, y: -1.8 },
    { x: 24, y: 1.8 },
    { x: 20, y: 4.2 },
    { x: 14, y: 6.4 },
    { x: 6, y: 7.8 },
    { x: -3, y: 7.8 },
    { x: -13, y: 6.2 },
    { x: -21, y: 3.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The massively elongated upper tail lobe - the real Thresher Shark's
  // own single most extraordinary field mark, roughly as long as the
  // rest of the body.
  {
    const angle = -1.15;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const len = 48;
    const bow = 20;
    const steps = 12;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (24 + dx * len * tt + px * curve) * s;
      const cy = (-1.8 + dy * len * tt + py * curve) * s;
      const ww = (5.5 - tt * 5.2) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  }

  // A short, ordinary lower tail lobe - plain by contrast.
  [{ angle: 0.5, bow: -3.4, len: 8, baseY: 1.8, w: 3 }].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 8;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (24 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 3.9 * s, -13 * s, 15 * s, -1.5 * s, 6.7 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-7 * s, 3.9 * s, -13 * s, 15 * s, -1.5 * s, 6.7 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(5 * s, 7.4 * s, 3 * s, 12.6 * s, 11.5 * s, 7.4 * s);
  g.fillTriangle(15 * s, -6.2 * s, 18.5 * s, -5.6 * s, 16.5 * s, -10.2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(15 * s, -6.2 * s, 18.5 * s, -5.6 * s, 16.5 * s, -10.2 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -21, y: -3.6 },
    { x: -13, y: -6.2 },
    { x: -3, y: -7.8 },
    { x: 6, y: -7.8 },
    { x: 14, y: -6.4 },
    { x: 20, y: -4.2 },
    { x: 24, y: -1.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2 + Math.sin(i * 1.3) * 1) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -7.8 * s, 5.5 * s, -6.8 * s, 0.8 * s, -18.5 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-5 * s, -7.8 * s, 5.5 * s, -6.8 * s, 0.8 * s, -18.5 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -19 + i * 1.9;
    g.beginPath();
    g.moveTo(gx * s, -5.4 * s);
    g.lineTo((gx - 1.1) * s, 4.4 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-23.5 * s, 1 * s);
  g.lineTo(-16 * s, 3.4 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -22 + i * 2.3;
    g.fillTriangle(tx * s, 1.3 * s, (tx + 1) * s, 1.7 * s, (tx + 0.35) * s, 3.4 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-17.5 * s, -2.6 * s, 1.4 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-17.5 * s, -2.6 * s, 0.75 * s);

  g.restore();
}

// An angel shark - built with a construction nothing else in the game
// shares: a real, flattened, ray-like body with huge, broad, wing-like
// pectoral fins spanning nearly the full body width (unlike the
// Wobbegong's own smaller, fringed-mouth flat body) - not fused to the
// head the way a true ray's are - eyes set on TOP of a flattened head
// (rather than the side), and a smooth, unfringed mouth with no barbels
// at all. Sandy, mottled camouflage, dorsal fins set far back near the
// tail.
export function drawAngelShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa89468;
  const backColor = 0x7c6c40;
  const bellyColor = 0xd8c898;
  const finColor = 0x8c7a4c;
  const darkColor = 0x2c2414;
  const mottleColor = 0x584a28;

  // The flattened, ray-like body, with huge broad wing-like pectorals
  // spanning nearly the full width - the real Angel Shark's own
  // unmistakable silhouette, not fused to the head like a true ray.
  const body = [
    { x: -20, y: -3 },
    { x: -18, y: 0 },
    { x: -20, y: 3 },
    { x: -14, y: 10 },
    { x: -2, y: 15 },
    { x: 10, y: 14 },
    { x: 16, y: 8 },
    { x: 16, y: -8 },
    { x: 10, y: -14 },
    { x: -2, y: -15 },
    { x: -14, y: -10 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(16 * s, -5 * s, 26 * s, -3 * s, 18 * s, 2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(16 * s, -5 * s, 26 * s, -3 * s, 18 * s, 2 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 14 * s, -11 * s, 21 * s, 2 * s, 16 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Sandy, mottled camouflage.
  g.fillStyle(mottleColor, 0.4 * alpha);
  [
    [-6, -4, 4],
    [3, 5, 4.2],
    [8, -6, 3.4],
    [-10, 3, 3]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.4 * s, br * s));

  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(1 * s, -14.5 * s, 8 * s, -12.8 * s, 3.5 * s, -20 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(1 * s, -14.5 * s, 8 * s, -12.8 * s, 3.5 * s, -20 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  for (let i = 0; i < 4; i += 1) {
    const gx = -17 + i * 1.2;
    g.beginPath();
    g.moveTo(gx * s, -8.5 * s);
    g.lineTo((gx - 0.5) * s, -3.5 * s);
    g.strokePath();
  }

  // A smooth, unfringed mouth - no barbels at all, unlike the
  // Wobbegong's own fringed dermal lobes.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-16 * s, 2 * s);
  quadCurveTo(g, -16 * s, 2 * s, -13 * s, 5 * s, -8 * s, 5.5 * s);
  g.strokePath();

  // Eyes set on TOP of the flattened head, rather than the side - a
  // real Angel Shark trait.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-15 * s, -6.5 * s, 1.5 * s);
  g.fillCircle(-11 * s, -7.3 * s, 1.5 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-15 * s, -6.5 * s, 0.8 * s);
  g.fillCircle(-11 * s, -7.3 * s, 0.8 * s);

  g.restore();
}

// A nurse shark - a real, docile, sluggish bottom-dweller, told apart by
// the real animal's own field mark: a pair of long, whisker-like sensory
// barbels trailing from the tip of the snout (a different placement from
// the Black Drum's own chin barbels) - a blunt, rounded head, a small
// mouth set well back underneath it, and softened, rounded fin tips
// throughout rather than the sharp points every other shark here has.
// Plain, unmarked brownish-tan.
export function drawNurseShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x8c7452;
  const bellyColor = 0xe4d8b8;
  const finColor = 0x8c7452;
  const darkColor = 0x342a18;
  const barbelColor = 0x746038;

  const body = [
    { x: -26, y: 0 },
    { x: -23, y: -4.6 },
    { x: -13, y: -8 },
    { x: -1, y: -9.8 },
    { x: 10, y: -9.4 },
    { x: 19, y: -7.4 },
    { x: 26, y: -4.4 },
    { x: 31, y: -2 },
    { x: 31, y: 2 },
    { x: 26, y: 4.4 },
    { x: 19, y: 7.4 },
    { x: 10, y: 9.4 },
    { x: -1, y: 9.8 },
    { x: -13, y: 8 },
    { x: -23, y: 4.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Rounded, softened fin tips throughout - a real Nurse Shark trait,
  // and a genuinely different tail construction from every other
  // shark's own sharp-cornered lobes.
  g.fillStyle(finColor, alpha);
  g.fillEllipse(38 * s, -1 * s, 12 * s, 5.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(38 * s, -1 * s, 12 * s, 5.5 * s);
  g.fillStyle(finColor, alpha);
  g.fillEllipse(30 * s, 5 * s, 5 * s, 3.4 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(30 * s, 5 * s, 5 * s, 3.4 * s);

  g.fillStyle(finColor, alpha);
  g.fillEllipse(-10 * s, 11 * s, 8 * s, 5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeEllipse(-10 * s, 11 * s, 8 * s, 5 * s);

  g.fillStyle(finColor, alpha);
  g.fillEllipse(8 * s, 12.5 * s, 5.4 * s, 3.6 * s);
  g.fillEllipse(20 * s, -10.5 * s, 4.6 * s, 3 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -23, y: -4.6 },
    { x: -13, y: -8 },
    { x: -1, y: -9.8 },
    { x: 10, y: -9.4 },
    { x: 19, y: -7.4 },
    { x: 26, y: -4.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.4 + Math.sin(i * 1.3) * 1.2) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillEllipse(1 * s, -14 * s, 6.5 * s, 4.4 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeEllipse(1 * s, -14 * s, 6.5 * s, 4.4 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -21 + i * 2 * 1.05;
    g.beginPath();
    g.moveTo(gx * s, -6.2 * s);
    g.lineTo((gx - 1.2) * s, 5.2 * s);
    g.strokePath();
  }

  // A blunt, rounded head and a small mouth set well back underneath -
  // a real Nurse Shark trait.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-25.5 * s, 1.5 * s);
  quadCurveTo(g, -25.5 * s, 1.5 * s, -22 * s, 3.5 * s, -16 * s, 4 * s);
  g.strokePath();

  // The pair of long, whisker-like sensory barbels trailing from the
  // snout tip - the real Nurse Shark's own field mark, a different
  // placement from the Black Drum's own chin barbels.
  g.lineStyle(0.9 * s, barbelColor, 0.85 * alpha);
  g.beginPath();
  g.moveTo(-26 * s, 0.5 * s);
  quadCurveTo(g, -26 * s, 0.5 * s, -30 * s, 1.5 * s, -31.5 * s, 4 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(-25.5 * s, -1 * s);
  quadCurveTo(g, -25.5 * s, -1 * s, -29.5 * s, -1.6 * s, -31 * s, 1 * s);
  g.strokePath();

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-17 * s, -2.4 * s, 1.3 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-17 * s, -2.4 * s, 0.7 * s);

  g.restore();
}

// A lemon shark - a real coastal requiem shark, told apart by two
// genuine field marks: a distinctive pale yellow-tan "lemon" coloring
// over the whole body (the real detail the species is named for), and a
// second dorsal fin built almost as large as the first - every other
// shark here has a clearly smaller second dorsal, but a real Lemon
// Shark's two dorsals are famously close to equal size.
export function drawLemonShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0xc8b048;
  const bellyColor = 0xf4ecc0;
  const finColor = 0xc8b048;
  const darkColor = 0x4c4014;
  const toothColor = 0xf2f0e2;

  const body = [
    { x: -30, y: 0 },
    { x: -26, y: -4.2 },
    { x: -17, y: -7.2 },
    { x: -5, y: -9 },
    { x: 6, y: -9 },
    { x: 16, y: -7.6 },
    { x: 24, y: -5.2 },
    { x: 29, y: -2.2 },
    { x: 29, y: 2.2 },
    { x: 24, y: 5.2 },
    { x: 16, y: 7.6 },
    { x: 6, y: 9 },
    { x: -5, y: 9 },
    { x: -17, y: 7.2 },
    { x: -26, y: 4.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.72, bow: 9, len: 20, baseY: -2.2, w: 4.6 },
    { angle: 0.6, bow: -7, len: 14, baseY: 2.2, w: 3.6 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (29 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 4.6 * s, -14.5 * s, 17.5 * s, -1.5 * s, 7.9 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-9 * s, 4.6 * s, -14.5 * s, 17.5 * s, -1.5 * s, 7.9 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(6.5 * s, 9.3 * s, 3.5 * s, 15.5 * s, 14 * s, 9.3 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -26, y: -4.2 },
    { x: -17, y: -7.2 },
    { x: -5, y: -9 },
    { x: 6, y: -9 },
    { x: 16, y: -7.6 },
    { x: 24, y: -5.2 },
    { x: 29, y: -2.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.2 + Math.sin(i * 1.3) * 1.1) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5.5 * s, -9 * s, 6 * s, -7.8 * s, 0.8 * s, -20.5 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-5.5 * s, -9 * s, 6 * s, -7.8 * s, 0.8 * s, -20.5 * s);

  // The second dorsal fin, built almost as large as the first - the
  // real Lemon Shark's own field mark, unlike every other shark here.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(13 * s, -7.8 * s, 22 * s, -6 * s, 16.5 * s, -17.5 * s);
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(13 * s, -7.8 * s, 22 * s, -6 * s, 16.5 * s, -17.5 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -22 + i * 2 * 1.05;
    g.beginPath();
    g.moveTo(gx * s, -6.2 * s);
    g.lineTo((gx - 1.2) * s, 5.2 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-29.5 * s, 1 * s);
  g.lineTo(-20 * s, 4.2 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -28 + i * 2.6;
    g.fillTriangle(tx * s, 1.4 * s, (tx + 1.2) * s, 1.9 * s, (tx + 0.4) * s, 4 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-21.5 * s, -3 * s, 1.6 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-21.5 * s, -3 * s, 0.85 * s);

  g.restore();
}

// A sandbar shark - a real, stocky requiem shark, told apart by the real
// animal's own single most famous field mark: an exceptionally tall,
// high, upright first dorsal fin - positioned further forward, right
// over the pectoral fins, and proportionally taller than any other
// requiem shark's own dorsal here (kept clearly shorter than the Great
// Hammerhead's own even taller sickle dorsal, but the tallest among the
// plain-bodied requiem sharks).
export function drawSandbarShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x767066;
  const bellyColor = 0xecebe4;
  const finColor = 0x767066;
  const darkColor = 0x242019;
  const toothColor = 0xf0eee4;

  const body = [
    { x: -30, y: 0 },
    { x: -26, y: -5.1 },
    { x: -17, y: -8.9 },
    { x: -5, y: -11.4 },
    { x: 7, y: -11.4 },
    { x: 17, y: -9.4 },
    { x: 25, y: -6.5 },
    { x: 30, y: -2.7 },
    { x: 30, y: 2.7 },
    { x: 25, y: 6.5 },
    { x: 17, y: 9.4 },
    { x: 7, y: 11.4 },
    { x: -5, y: 11.4 },
    { x: -17, y: 8.9 },
    { x: -26, y: 5.1 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.78, bow: 11, len: 22, baseY: -2.7, w: 5.6 },
    { angle: 0.55, bow: -5, len: 12, baseY: 2.7, w: 4.2 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (30 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.4)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-11 * s, 5.7 * s, -18 * s, 21.8 * s, -2 * s, 9.8 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-11 * s, 5.7 * s, -18 * s, 21.8 * s, -2 * s, 9.8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(7 * s, 11.6 * s, 4 * s, 19.6 * s, 15 * s, 11.6 * s);
  g.fillTriangle(17.5 * s, -9.4 * s, 21 * s, -8.6 * s, 19 * s, -14.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(17.5 * s, -9.4 * s, 21 * s, -8.6 * s, 19 * s, -14.5 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -26, y: -5.1 },
    { x: -17, y: -8.9 },
    { x: -5, y: -11.4 },
    { x: 7, y: -11.4 },
    { x: 17, y: -9.4 },
    { x: 25, y: -6.5 },
    { x: 30, y: -2.7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.4 + Math.sin(i * 1.3) * 1.2) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The exceptionally tall, high, upright first dorsal, positioned
  // further forward right over the pectoral fins - the real Sandbar
  // Shark's own single most famous field mark.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -12, y: -8.5 },
      { x: -9, y: -27 },
      { x: -3, y: -29.5 },
      { x: 3, y: -26 },
      { x: 6, y: -9.4 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(
    [
      { x: -12, y: -8.5 },
      { x: -9, y: -27 },
      { x: -3, y: -29.5 },
      { x: 3, y: -26 },
      { x: 6, y: -9.4 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    false
  );

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -22 + i * 2.1;
    g.beginPath();
    g.moveTo(gx * s, -7.4 * s);
    g.lineTo((gx - 1.2) * s, 6 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-29.5 * s, 1 * s);
  g.lineTo(-19.5 * s, 4.6 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -28 + i * 2.7;
    g.fillTriangle(tx * s, 1.5 * s, (tx + 1.3) * s, 2 * s, (tx + 0.4) * s, 4.2 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-21.5 * s, -3.3 * s, 1.7 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-21.5 * s, -3.3 * s, 0.9 * s);

  g.restore();
}

// A blacktip reef shark - a real, genuinely distinct species from the
// Blacktip Shark drawn elsewhere here (a real, common case of mistaken
// identity even among anglers), smaller and stouter, built for shallow
// reef flats. Told apart by the real animal's own specific field mark:
// the black tip on the first dorsal fin is followed immediately by a
// pale, whitish band directly beneath it - a two-tone "dip" pattern the
// plain solid-black-tipped Blacktip Shark doesn't have - plus black tips
// on the pectorals and the lower tail lobe.
export function drawBlacktipReefShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x8c8c80;
  const bellyColor = 0xf2f2e8;
  const finColor = 0x8c8c80;
  const darkColor = 0x28281e;
  const toothColor = 0xf0eee4;
  const blackTip = 0x0c0a06;
  const paleBand = 0xe8e8dc;

  const body = [
    { x: -22, y: 0 },
    { x: -19, y: -3.4 },
    { x: -12, y: -5.8 },
    { x: -4, y: -7.2 },
    { x: 3, y: -7.2 },
    { x: 10, y: -6 },
    { x: 16, y: -4.2 },
    { x: 20, y: -1.8 },
    { x: 20, y: 1.8 },
    { x: 16, y: 4.2 },
    { x: 10, y: 6 },
    { x: 3, y: 7.2 },
    { x: -4, y: 7.2 },
    { x: -12, y: 5.8 },
    { x: -19, y: 3.4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  [
    { angle: -0.78, bow: 8.5, len: 17, baseY: -1.8, w: 3.6 },
    { angle: 0.5, bow: -4, len: 7.5, baseY: 1.8, w: 2.8 }
  ].forEach(({ angle, bow, len, baseY, w }) => {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const px = -dy;
    const py = dx;
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (20 + dx * len * tt + px * curve) * s;
      const cy = (baseY + dy * len * tt + py * curve) * s;
      const ww = (w - tt * (w - 0.3)) * s;
      left.push({ x: cx + px * ww, y: cy + py * ww });
      right.push({ x: cx - px * ww, y: cy - py * ww });
    }
    const shape = left.concat(right.reverse());
    g.fillStyle(finColor, alpha);
    g.fillPoints(shape, true);
    g.lineStyle(1 * s, darkColor, 0.7 * alpha);
    g.strokePoints(shape, true);
  });
  // Black tip on the lower tail lobe only.
  g.fillStyle(blackTip, 0.8 * alpha);
  g.fillCircle(24 * s, 3.9 * s, 1.5 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-7 * s, 3.3 * s, -11.5 * s, 13 * s, -1.5 * s, 5.8 * s);
  g.fillStyle(blackTip, 0.8 * alpha);
  g.fillCircle(-11.5 * s, 13 * s, 1.4 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-7 * s, 3.3 * s, -11.5 * s, 13 * s, -1.5 * s, 5.8 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(4.5 * s, 5.9 * s, 2.5 * s, 10.2 * s, 9.5 * s, 5.9 * s);

  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -19, y: -3.4 },
    { x: -12, y: -5.8 },
    { x: -4, y: -7.2 },
    { x: 3, y: -7.2 },
    { x: 10, y: -6 },
    { x: 16, y: -4.2 },
    { x: 20, y: -1.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (1.8 + Math.sin(i * 1.3) * 0.9) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.8 * alpha);
  g.strokePoints(body, true);

  // The first dorsal, with a black tip followed immediately by a pale
  // whitish band beneath it - the real Blacktip Reef Shark's own
  // specific "dip" field mark, unlike the Blacktip Shark's own plain
  // solid black tip.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-5 * s, -7.2 * s, 4.5 * s, -6.3 * s, 0.5 * s, -16.5 * s);
  g.fillStyle(paleBand, 0.8 * alpha);
  g.fillTriangle(-2.6 * s, -8.8 * s, 3 * s, -8.4 * s, 0.5 * s, -12.5 * s);
  g.fillStyle(blackTip, 0.85 * alpha);
  g.fillCircle(0.5 * s, -14.5 * s, 2.1 * s);
  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokeTriangle(-5 * s, -7.2 * s, 4.5 * s, -6.3 * s, 0.5 * s, -16.5 * s);

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -17 + i * 1.7;
    g.beginPath();
    g.moveTo(gx * s, -4.8 * s);
    g.lineTo((gx - 1) * s, 4 * s);
    g.strokePath();
  }

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-21.5 * s, 1 * s);
  g.lineTo(-14 * s, 3.4 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -20 + i * 2.1;
    g.fillTriangle(tx * s, 1.2 * s, (tx + 1) * s, 1.6 * s, (tx + 0.35) * s, 3.2 * s);
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-15 * s, -2.4 * s, 1.3 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-15 * s, -2.4 * s, 0.7 * s);

  g.restore();
}

// A guitarfish - a real, genuinely shark-tailed ray: a pointed, elongated
// triangular snout blending into a modest disc, then a long, robust,
// unmistakably SHARK-LIKE tail carrying two real triangular dorsal fins
// and an actual forked caudal fin - a construction most of the flat,
// whip-tailed rays here don't share at all. Plain sandy tan, no pattern.
export function drawGuitarfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4a870;
  const backColor = 0x9c8050;
  const bellyColor = 0xe8d8b0;
  const finColor = 0xac8c58;
  const darkColor = 0x3c3018;

  // The pointed, elongated triangular snout blending into the disc - the
  // real Guitarfish's own defining silhouette.
  const disc = [
    { x: -38, y: 0 },
    { x: -28, y: -6 },
    { x: -16, y: -13 },
    { x: -2, y: -15 },
    { x: 12, y: -12 },
    { x: 12, y: 12 },
    { x: -2, y: 15 },
    { x: -16, y: 13 },
    { x: -28, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The long, robust, shark-like tail with a real forked caudal fin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(38 * s, -3.4 * s, 48 * s, -11 * s, 41 * s, -0.6 * s);
  g.fillTriangle(38 * s, 3.4 * s, 48 * s, 11 * s, 41 * s, 0.6 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(38 * s, -3.4 * s, 48 * s, -11 * s, 41 * s, -0.6 * s);
  g.strokeTriangle(38 * s, 3.4 * s, 48 * s, 11 * s, 41 * s, 0.6 * s);

  const tailTop = [
    { x: 12, y: -6 },
    { x: 22, y: -4.4 },
    { x: 32, y: -3.6 },
    { x: 38, y: -3.4 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x, y: -p.y })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  // Two real triangular dorsal fins along the tail - a genuine shark
  // trait, unlike any whip-tailed ray here.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(17 * s, -4.6 * s, 24 * s, -4 * s, 20 * s, -10 * s);
  g.fillTriangle(28 * s, -3.8 * s, 34 * s, -3.5 * s, 31 * s, -9 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(17 * s, -4.6 * s, 24 * s, -4 * s, 20 * s, -10 * s);
  g.strokeTriangle(28 * s, -3.8 * s, 34 * s, -3.5 * s, 31 * s, -9 * s);

  // Small pectoral-adjacent pelvic fins near the tail root.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(13 * s, 8 * s, 20 * s, 10.5 * s, 16 * s, 5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  const topProfile = [
    { x: -28, y: -6 },
    { x: -16, y: -13 },
    { x: -2, y: -15 },
    { x: 12, y: -12 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (4 + Math.sin(i * 1.3) * 2) * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  // Gill slits, a real cartilaginous-fish trait shared with the sharks.
  g.lineStyle(0.9 * s, darkColor, 0.4 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -6 + i * 2.4;
    g.beginPath();
    g.moveTo(gx * s, 9 * s);
    g.lineTo((gx - 1) * s, 13.5 * s);
    g.strokePath();
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-22 * s, -6.6 * s, 1.5 * s);
  g.fillCircle(-18 * s, -8.6 * s, 1.5 * s);
  g.fillStyle(0x000000, 0.75 * alpha);
  g.fillCircle(-22 * s, -6.6 * s, 0.8 * s);
  g.fillCircle(-18 * s, -8.6 * s, 0.8 * s);

  g.restore();
}

// A shovelnose ray - the same real shark-tailed guitarfish family as the
// Guitarfish here, but told apart by the real animal's own field mark: a
// distinctly broad, blunt, rounded shovel-shaped snout (not a sharp
// point), and a fine grey-brown mottled body instead of the Guitarfish's
// own plain tan.
export function drawShovelnoseRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x9c9478;
  const backColor = 0x746c50;
  const bellyColor = 0xd8d0b0;
  const finColor = 0x847a58;
  const darkColor = 0x302a18;
  const mottleColor = 0x5c5438;

  // The broad, blunt, rounded shovel-shaped snout - the real Shovelnose
  // Ray's own field mark, unlike the Guitarfish's own sharp point.
  const disc = [
    { x: -32, y: -8 },
    { x: -34, y: 0 },
    { x: -32, y: 8 },
    { x: -22, y: 14 },
    { x: -6, y: 16 },
    { x: 10, y: 12.5 },
    { x: 10, y: -12.5 },
    { x: -6, y: -16 },
    { x: -22, y: -14 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(36 * s, -3.2 * s, 45 * s, -10.5 * s, 39 * s, -0.5 * s);
  g.fillTriangle(36 * s, 3.2 * s, 45 * s, 10.5 * s, 39 * s, 0.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(36 * s, -3.2 * s, 45 * s, -10.5 * s, 39 * s, -0.5 * s);
  g.strokeTriangle(36 * s, 3.2 * s, 45 * s, 10.5 * s, 39 * s, 0.5 * s);

  const tailTop = [
    { x: 10, y: -6.2 },
    { x: 20, y: -4.6 },
    { x: 30, y: -3.6 },
    { x: 36, y: -3.2 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x, y: -p.y })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(15 * s, -4.8 * s, 22 * s, -4.2 * s, 18 * s, -10 * s);
  g.fillTriangle(26 * s, -3.8 * s, 32 * s, -3.4 * s, 29 * s, -8.6 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(15 * s, -4.8 * s, 22 * s, -4.2 * s, 18 * s, -10 * s);
  g.strokeTriangle(26 * s, -3.8 * s, 32 * s, -3.4 * s, 29 * s, -8.6 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, 7.5 * s, 18 * s, 10 * s, 14 * s, 4.8 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Fine grey-brown mottling - the real Shovelnose Ray's own texture.
  g.fillStyle(mottleColor, 0.3 * alpha);
  [
    [-18, -5, 3],
    [-8, 4, 2.8],
    [-20, 6, 2.4],
    [-4, -6, 2.6],
    [2, 2, 2.4]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.5 * s, br * s));

  const topProfile = [
    { x: -32, y: -8 },
    { x: -22, y: -14 },
    { x: -6, y: -16 },
    { x: 10, y: -12.5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (4 + Math.sin(i * 1.3) * 2) * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.lineStyle(0.9 * s, darkColor, 0.4 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -4 + i * 2.2;
    g.beginPath();
    g.moveTo(gx * s, 9.5 * s);
    g.lineTo((gx - 1) * s, 13.5 * s);
    g.strokePath();
  }

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-24 * s, -7.4 * s, 1.5 * s);
  g.fillCircle(-20 * s, -9.6 * s, 1.5 * s);
  g.fillStyle(0x000000, 0.75 * alpha);
  g.fillCircle(-24 * s, -7.4 * s, 0.8 * s);
  g.fillCircle(-20 * s, -9.6 * s, 0.8 * s);

  g.restore();
}

// An eagle ray - a real, unmistakable ray built with its own genuinely
// separate head: a protruding, duck-bill-like snout that sits raised and
// distinct from the wing-like pectoral disc (unlike a stingray's own
// smoothly-blended head), rhomboid wings, a long thin whip tail with a
// venomous spine, and the real animal's own field mark: crisp white
// spots scattered over a dark back.
export function drawEagleRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x243848;
  const backColor = 0x142430;
  const bellyColor = 0xd8e0e4;
  const finColor = 0x1c303c;
  const darkColor = 0x0a141c;
  const spotColor = 0xe8ecec;

  const disc = [
    { x: -8, y: -34 },
    { x: 4, y: -30 },
    { x: 10, y: -14 },
    { x: 6, y: 0 },
    { x: 10, y: 14 },
    { x: 4, y: 30 },
    { x: -8, y: 34 },
    { x: -14, y: 20 },
    { x: -16, y: 0 },
    { x: -14, y: -20 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The long, thin whip tail with a venomous spine near its base.
  g.lineStyle(1.6 * s, finColor, alpha);
  g.beginPath();
  g.moveTo(-16 * s, 0);
  quadCurveTo(g, -16 * s, 0, -34 * s, 4 * s, -52 * s, 2 * s);
  g.strokePath();
  g.fillStyle(0xece8d8, alpha);
  g.fillTriangle(-22 * s, 3 * s, -26 * s, 8.5 * s, -24 * s, 1.5 * s);

  // The pointed, duck-bill-like snout, raised and visually separate from
  // the wing disc - the real Eagle Ray's own defining field mark.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -14, y: -6 },
      { x: -20, y: -3 },
      { x: -24, y: 0 },
      { x: -20, y: 3 },
      { x: -14, y: 6 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokePoints(
    [
      { x: -14, y: -6 },
      { x: -20, y: -3 },
      { x: -24, y: 0 },
      { x: -20, y: 3 },
      { x: -14, y: 6 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Crisp white spots on the dark back - the real Eagle Ray's own field
  // mark.
  g.fillStyle(spotColor, 0.85 * alpha);
  [
    [-6, -22, 1.6],
    [0, -12, 1.8],
    [-4, -2, 1.6],
    [2, 8, 1.7],
    [-6, 18, 1.6],
    [4, -20, 1.3],
    [6, 2, 1.4],
    [4, 20, 1.3]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(backColor, 0.5 * alpha);
  g.fillEllipse(-3 * s, 0, 20 * s, 26 * s);
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);
  g.fillStyle(spotColor, 0.85 * alpha);
  [
    [-6, -22, 1.6],
    [0, -12, 1.8],
    [-4, -2, 1.6],
    [2, 8, 1.7],
    [-6, 18, 1.6],
    [4, -20, 1.3],
    [6, 2, 1.4],
    [4, 20, 1.3]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xecefee, alpha);
  g.fillCircle(-15 * s, -3.4 * s, 1.5 * s);
  g.fillStyle(0x06090c, alpha);
  g.fillCircle(-14.7 * s, -3.4 * s, 0.85 * s);

  g.restore();
}

// A manta ray - the largest ray there is, built around its own
// completely unique field marks: paired CEPHALIC FINS - fleshy lobes
// curling forward from the front corners of the head into a scoop
// shape, framing a mouth positioned right at the very front tip of the
// head (a real terminal mouth) - a construction no other ray here has -
// and NO tail spine at all, just a plain thin whip. Huge diamond wings,
// near-black back with pale individual "shoulder" patches near the head.
export function drawMantaRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x14181c;
  const backColor = 0x0a0d10;
  const bellyColor = 0xe8e8e4;
  const finColor = 0x10141a;
  const darkColor = 0x040608;
  const shoulderColor = 0x3c4248;

  const disc = [
    { x: 0, y: -46 },
    { x: 22, y: -22 },
    { x: 12, y: 0 },
    { x: 22, y: 22 },
    { x: 0, y: 46 },
    { x: -22, y: 22 },
    { x: -12, y: 0 },
    { x: -22, y: -22 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A plain, thin whip tail with NO spine at all - the real Manta's own
  // genuine field mark, unlike every barbed ray here.
  g.lineStyle(1.4 * s, finColor, alpha);
  g.beginPath();
  g.moveTo(12 * s, 0);
  quadCurveTo(g, 12 * s, 0, 34 * s, 4 * s, 54 * s, 3 * s);
  g.strokePath();

  // The paired cephalic fins - curling scoop-shaped lobes framing a
  // terminal, front-facing mouth - a construction unique to this fish.
  g.fillStyle(finColor, alpha);
  g.fillPoints(
    [
      { x: -6, y: -44 },
      { x: -14, y: -50 },
      { x: -18, y: -46 },
      { x: -12, y: -40 },
      { x: -4, y: -38 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.fillPoints(
    [
      { x: 6, y: -44 },
      { x: 14, y: -50 },
      { x: 18, y: -46 },
      { x: 12, y: -40 },
      { x: 4, y: -38 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokePoints(
    [
      { x: -6, y: -44 },
      { x: -14, y: -50 },
      { x: -18, y: -46 },
      { x: -12, y: -40 },
      { x: -4, y: -38 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );
  g.strokePoints(
    [
      { x: 6, y: -44 },
      { x: 14, y: -50 },
      { x: 18, y: -46 },
      { x: 12, y: -40 },
      { x: 4, y: -38 }
    ].map((p) => ({ x: p.x * s, y: p.y * s })),
    true
  );

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Pale individual "shoulder" patches near the head - a real, genuine
  // Manta Ray detail (used by researchers to identify individuals).
  g.fillStyle(shoulderColor, 0.6 * alpha);
  g.fillEllipse(-9 * s, -18 * s, 7 * s, 11 * s);
  g.fillEllipse(9 * s, -18 * s, 7 * s, 11 * s);

  g.lineStyle(1.3 * s, darkColor, 0.7 * alpha);
  g.strokePoints(disc, true);

  // The terminal mouth, right at the very front tip of the head - a real
  // Manta trait, unlike the Devil Ray's own underslung mouth.
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-4 * s, -38 * s);
  g.lineTo(4 * s, -38 * s);
  g.strokePath();

  g.fillStyle(0xdcdcd8, alpha);
  g.fillCircle(-9 * s, -32 * s, 1.7 * s);
  g.fillStyle(0x040404, alpha);
  g.fillCircle(-8.7 * s, -32 * s, 0.95 * s);

  g.restore();
}

// A devil ray - a real, close relative of the Manta here (same family),
// but told genuinely apart: smaller, with straighter, more pointed,
// horn-like cephalic fins (rather than the Manta's own rounded scoop
// shape - the real detail the species is named for), a mouth positioned
// UNDERNEATH the head (a real subterminal mouth, unlike the Manta's own
// front-facing one), and - unlike the Manta - it still carries a real
// tail spine.
export function drawDevilRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x342c28;
  const backColor = 0x241e1a;
  const bellyColor = 0xc8c0b4;
  const finColor = 0x2c2420;
  const darkColor = 0x14100c;

  const disc = [
    { x: 0, y: -30 },
    { x: 16, y: -14 },
    { x: 9, y: 0 },
    { x: 16, y: 14 },
    { x: 0, y: 30 },
    { x: -16, y: 14 },
    { x: -9, y: 0 },
    { x: -16, y: -14 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A real tail spine - unlike the Manta's own barbless whip.
  g.lineStyle(1.2 * s, finColor, alpha);
  g.beginPath();
  g.moveTo(9 * s, 0);
  quadCurveTo(g, 9 * s, 0, 26 * s, 3.5 * s, 40 * s, 2.5 * s);
  g.strokePath();
  g.fillStyle(0xece0c8, alpha);
  g.fillTriangle(16 * s, 2.6 * s, 19 * s, 6.5 * s, 17.5 * s, 1.2 * s);

  // The straighter, pointed, horn-like cephalic fins - the real Devil
  // Ray's own field mark and namesake, unlike the Manta's own curled
  // scoop shape.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -28 * s, -11 * s, -36 * s, -2 * s, -25 * s);
  g.fillTriangle(3 * s, -28 * s, 11 * s, -36 * s, 2 * s, -25 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(-3 * s, -28 * s, -11 * s, -36 * s, -2 * s, -25 * s);
  g.strokeTriangle(3 * s, -28 * s, 11 * s, -36 * s, 2 * s, -25 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(disc, true);

  // The mouth, tucked underneath the head - a real subterminal mouth,
  // unlike the Manta's own front-facing one.
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.beginPath();
  g.moveTo(-4 * s, -23 * s);
  g.lineTo(4 * s, -23 * s);
  g.strokePath();

  g.fillStyle(0xc8bcac, alpha);
  g.fillCircle(-6 * s, -21 * s, 1.4 * s);
  g.fillStyle(0x0c0906, alpha);
  g.fillCircle(-5.7 * s, -21 * s, 0.78 * s);

  g.restore();
}

// A stingray - deliberately the plainest, most baseline whip-tailed ray
// here: a smooth oval disc with the head blending seamlessly into it (no
// separate snout at all, unlike the Eagle Ray), a single venomous tail
// spine, and a plain mottled brown body carrying none of its own named
// relatives' specific field marks.
export function drawStingray(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x8c7050;
  const backColor = 0x5c4830;
  const bellyColor = 0xd0bc94;
  const finColor = 0x6c5638;
  const darkColor = 0x241c10;
  const mottleColor = 0x40331e;

  const disc = [
    { x: 0, y: -26 },
    { x: 16, y: -18 },
    { x: 24, y: 0 },
    { x: 16, y: 18 },
    { x: 0, y: 26 },
    { x: -16, y: 18 },
    { x: -24, y: 0 },
    { x: -16, y: -18 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.lineStyle(1.4 * s, finColor, alpha);
  g.beginPath();
  g.moveTo(0, 26 * s);
  quadCurveTo(g, 0, 26 * s, 4 * s, 44 * s, 2 * s, 60 * s);
  g.strokePath();
  g.fillStyle(0xe4d8b8, alpha);
  g.fillTriangle(2 * s, 36 * s, 6 * s, 41 * s, 3.4 * s, 34 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Plain mottled brown blotching - deliberately unremarkable.
  g.fillStyle(mottleColor, 0.3 * alpha);
  [
    [-6, -10, 3.4],
    [7, 4, 3.6],
    [-8, 8, 2.8],
    [4, -8, 3]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.3 * s, br * s));

  g.fillStyle(backColor, 0.35 * alpha);
  g.fillEllipse(0, -4 * s, 16 * s, 20 * s);
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);
  g.fillStyle(mottleColor, 0.3 * alpha);
  [
    [-6, -10, 3.4],
    [7, 4, 3.6],
    [-8, 8, 2.8],
    [4, -8, 3]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.3 * s, br * s));

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xe8dcc4, alpha);
  g.fillCircle(-6 * s, -13.5 * s, 1.6 * s);
  g.fillCircle(6 * s, -13.5 * s, 1.6 * s);
  g.fillStyle(0x0e0a06, alpha);
  g.fillCircle(-5.7 * s, -13.5 * s, 0.9 * s);
  g.fillCircle(6.3 * s, -13.5 * s, 0.9 * s);

  g.restore();
}

// A southern stingray - a real, distinct species from the plain
// Stingray here, told apart by a more angular DIAMOND-shaped disc (sharp
// pointed corners, not the generic Stingray's own rounded oval), a
// cooler grey-brown tone, and a longer tail carrying two serrated spines
// instead of one.
export function drawSouthernStingray(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x6c6c68;
  const backColor = 0x444440;
  const bellyColor = 0xc4c4bc;
  const finColor = 0x545450;
  const darkColor = 0x181816;

  // The angular diamond disc, sharp pointed corners - the real Southern
  // Stingray's own field mark.
  const disc = [
    { x: 0, y: -28 },
    { x: 24, y: 0 },
    { x: 0, y: 28 },
    { x: -24, y: 0 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.lineStyle(1.5 * s, finColor, alpha);
  g.beginPath();
  g.moveTo(0, 28 * s);
  quadCurveTo(g, 0, 28 * s, 5 * s, 50 * s, 3 * s, 70 * s);
  g.strokePath();
  // Two serrated spines - the real second field mark.
  g.fillStyle(0xe0d4b0, alpha);
  g.fillTriangle(3 * s, 40 * s, 7 * s, 46 * s, 4.4 * s, 38 * s);
  g.fillTriangle(3.6 * s, 47 * s, 7.6 * s, 53 * s, 5 * s, 45 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  g.fillStyle(backColor, 0.35 * alpha);
  g.fillEllipse(0, -3 * s, 14 * s, 20 * s);
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xd8d8d0, alpha);
  g.fillCircle(-5 * s, -14 * s, 1.6 * s);
  g.fillCircle(5 * s, -14 * s, 1.6 * s);
  g.fillStyle(0x0a0a08, alpha);
  g.fillCircle(-4.7 * s, -14 * s, 0.9 * s);
  g.fillCircle(5.3 * s, -14 * s, 0.9 * s);

  g.restore();
}

// A cownose ray - built around the real animal's own single most
// unmistakable field mark: a distinctly BILOBED "cow nose" snout - two
// rounded lobes at the front of the head separated by a real notch, a
// construction no other ray here has - plus sharply pointed, swept-back
// falcate wing tips (unlike the Eagle Ray's own more rounded wings).
export function drawCownoseRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x6c5c38;
  const backColor = 0x483c22;
  const bellyColor = 0xd0c49c;
  const finColor = 0x584a2a;
  const darkColor = 0x201808;

  const disc = [
    { x: 0, y: -32 },
    { x: 30, y: -16 },
    { x: 8, y: -2 },
    { x: 8, y: 2 },
    { x: 30, y: 16 },
    { x: 0, y: 32 },
    { x: -30, y: 16 },
    { x: -8, y: 2 },
    { x: -8, y: -2 },
    { x: -30, y: -16 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.lineStyle(1.3 * s, finColor, alpha);
  g.beginPath();
  g.moveTo(0, 2 * s);
  quadCurveTo(g, 0, 2 * s, 4 * s, 24 * s, 2 * s, 40 * s);
  g.strokePath();
  g.fillStyle(0xe8dcb8, alpha);
  g.fillTriangle(2 * s, 20 * s, 6 * s, 25 * s, 3.4 * s, 18 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // The bilobed "cow nose" snout - two rounded lobes with a real notch
  // between them - the real animal's own single most unmistakable field
  // mark and namesake.
  g.fillStyle(finColor, alpha);
  g.fillEllipse(-4 * s, -28 * s, 6 * s, 5 * s);
  g.fillEllipse(4 * s, -28 * s, 6 * s, 5 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(-4 * s, -28 * s, 6 * s, 5 * s);
  g.strokeEllipse(4 * s, -28 * s, 6 * s, 5 * s);
  g.lineStyle(1.2 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(0, -32 * s);
  g.lineTo(0, -24 * s);
  g.strokePath();

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xece0bc, alpha);
  g.fillCircle(-8 * s, -18 * s, 1.5 * s);
  g.fillCircle(8 * s, -18 * s, 1.5 * s);
  g.fillStyle(0x100c04, alpha);
  g.fillCircle(-7.7 * s, -18 * s, 0.82 * s);
  g.fillCircle(8.3 * s, -18 * s, 0.82 * s);

  g.restore();
}

// A butterfly ray - built with a construction nothing else in the game
// shares: an extremely WIDE, very SHORT disc - the widest-relative-to-
// length silhouette of any ray here, genuinely wider than it is long -
// paired with a real, notably stubby, short whip tail, much shorter than
// any other ray's own tail. The real "butterfly" shape the species is
// named for.
export function drawButterflyRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb09868;
  const backColor = 0x84703c;
  const bellyColor = 0xe4d8ac;
  const finColor = 0x94804c;
  const darkColor = 0x2c2410;
  const speckleColor = 0x584a22;

  // The extremely wide, very short disc - genuinely wider than it is
  // long, the real Butterfly Ray's own defining silhouette.
  const disc = [
    { x: 0, y: -12 },
    { x: 20, y: -22 },
    { x: 38, y: -6 },
    { x: 14, y: 0 },
    { x: 38, y: 6 },
    { x: 20, y: 22 },
    { x: 0, y: 12 },
    { x: -20, y: 22 },
    { x: -38, y: 6 },
    { x: -14, y: 0 },
    { x: -38, y: -6 },
    { x: -20, y: -22 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A real, notably stubby, short whip tail - much shorter than any
  // other ray here.
  g.lineStyle(1.4 * s, finColor, alpha);
  g.beginPath();
  g.moveTo(0, 12 * s);
  quadCurveTo(g, 0, 12 * s, 2 * s, 20 * s, 1 * s, 26 * s);
  g.strokePath();
  g.fillStyle(0xece0b8, alpha);
  g.fillTriangle(1.5 * s, 17 * s, 4.5 * s, 20.5 * s, 2.4 * s, 15.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Small dark speckles - a plain, understated pattern.
  g.fillStyle(speckleColor, 0.4 * alpha);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const sx = -20 + col * 10 + (row % 2) * 4;
      const sy = -12 + row * 10;
      g.fillCircle(sx * s, sy * s, 1 * s);
    }
  }

  g.fillStyle(backColor, 0.3 * alpha);
  g.fillEllipse(0, -2 * s, 22 * s, 12 * s);
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);
  g.fillStyle(speckleColor, 0.4 * alpha);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const sx = -20 + col * 10 + (row % 2) * 4;
      const sy = -12 + row * 10;
      g.fillCircle(sx * s, sy * s, 1 * s);
    }
  }

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xf0e4c0, alpha);
  g.fillCircle(-4 * s, -6 * s, 1.6 * s);
  g.fillCircle(4 * s, -6 * s, 1.6 * s);
  g.fillStyle(0x140e04, alpha);
  g.fillCircle(-3.7 * s, -6 * s, 0.9 * s);
  g.fillCircle(4.3 * s, -6 * s, 0.9 * s);

  g.restore();
}

// An electric ray - a real, soft-skinned ray built with a construction
// nothing else in the game shares: a plain CIRCULAR disc (not diamond-
// shaped like every other ray here), with the real animal's own field
// mark - visible pale, kidney-bean-shaped electric organ patches sitting
// under the skin on either side of the head - plus a short, thick, real
// finned tail with two small dorsal fins and an actual caudal fin,
// unlike the whip tails every other ray here carries.
export function drawElectricRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x746858;
  const backColor = 0x4c4438;
  const bellyColor = 0xc4bcac;
  const finColor = 0x5c5344;
  const darkColor = 0x1c1810;
  const organColor = 0xa8a08c;

  // A plain circular disc - not diamond-shaped like every other ray
  // here, the real Electric Ray's own genuine silhouette.
  const disc = { cx: 0, cy: -2, rx: 20, ry: 18 };

  // The short, thick, real finned tail with two dorsal fins and an
  // actual caudal fin - a construction unique to this and the Torpedo
  // Ray among the rays here.
  g.fillStyle(finColor, alpha);
  g.fillEllipse(30 * s, 22 * s, 8 * s, 7 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(30 * s, 22 * s, 8 * s, 7 * s);

  const tailTop = [
    { x: 4, y: 12 },
    { x: 14, y: 16 },
    { x: 24, y: 20 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x + 2, y: p.y + 8 })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(10 * s, 15 * s, 15 * s, 15.5 * s, 12 * s, 9.5 * s);
  g.fillTriangle(18 * s, 18 * s, 23 * s, 18.5 * s, 20 * s, 12.5 * s);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokeTriangle(10 * s, 15 * s, 15 * s, 15.5 * s, 12 * s, 9.5 * s);
  g.strokeTriangle(18 * s, 18 * s, 23 * s, 18.5 * s, 20 * s, 12.5 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillEllipse(disc.cx * s, disc.cy * s, disc.rx * s, disc.ry * s);

  // The visible pale kidney-shaped electric organ patches under the
  // skin - the real Electric Ray's own genuine field mark.
  g.fillStyle(organColor, 0.55 * alpha);
  g.fillEllipse(-9 * s, -4 * s, 6 * s, 10 * s);
  g.fillEllipse(9 * s, -4 * s, 6 * s, 10 * s);

  g.lineStyle(1.2 * s, darkColor, 0.5 * alpha);
  g.strokeEllipse(disc.cx * s, disc.cy * s, disc.rx * s, disc.ry * s);

  g.fillStyle(0xe8e0d0, alpha);
  g.fillCircle(-5 * s, -12 * s, 1.5 * s);
  g.fillCircle(5 * s, -12 * s, 1.5 * s);
  g.fillStyle(0x0e0a06, alpha);
  g.fillCircle(-4.7 * s, -12 * s, 0.85 * s);
  g.fillCircle(5.3 * s, -12 * s, 0.85 * s);

  g.restore();
}

// A torpedo ray - built the same simple way as the plain baseline
// Stingray right beside it (a smooth disc blending straight into the
// head, one venomous-looking tail spine, plain mottled blotching), the
// one deliberate difference being a rounded oval disc instead of the
// Stingray's own diamond-shaped one. Distinguished from the Stingray in
// the water by being a genuinely faster swimmer (see
// OceanScene.SWIM_SPEED), not by a different silhouette.
export function drawTorpedoRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x5c5040;
  const backColor = 0x3c342a;
  const finColor = 0x483e30;
  const darkColor = 0x140f08;
  const mottleColor = 0x241e14;

  // Same whip tail and venomous-looking spine as the plain baseline
  // Stingray right beside it.
  g.lineStyle(1.4 * s, finColor, alpha);
  g.beginPath();
  g.moveTo(0, 26 * s);
  quadCurveTo(g, 0, 26 * s, 4 * s, 44 * s, 2 * s, 60 * s);
  g.strokePath();
  g.fillStyle(0xe4d8b8, alpha);
  g.fillTriangle(2 * s, 36 * s, 6 * s, 41 * s, 3.4 * s, 34 * s);

  // The one deliberate difference from the Stingray: a smooth, rounded
  // oval disc instead of its diamond-shaped one.
  g.fillStyle(bodyColor, alpha);
  g.fillEllipse(0, 0, 48 * s, 52 * s);

  g.fillStyle(backColor, 0.35 * alpha);
  g.fillEllipse(0, -4 * s, 32 * s, 40 * s);

  g.fillStyle(mottleColor, 0.3 * alpha);
  [
    [-6, -10, 3.4],
    [7, 4, 3.6],
    [-8, 8, 2.8],
    [4, -8, 3]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.3 * s, br * s));

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokeEllipse(0, 0, 48 * s, 52 * s);

  g.fillStyle(0xe8dcc4, alpha);
  g.fillCircle(-6 * s, -13.5 * s, 1.6 * s);
  g.fillCircle(6 * s, -13.5 * s, 1.6 * s);
  g.fillStyle(0x0e0a06, alpha);
  g.fillCircle(-5.7 * s, -13.5 * s, 0.9 * s);
  g.fillCircle(6.3 * s, -13.5 * s, 0.9 * s);

  g.restore();
}

// A banjo ray - a real, rounded-disc relative of the shark-tailed
// Guitarfish and Shovelnose Ray here, told apart by its own oval, more
// evenly-rounded disc shape (less angular than either) and the real
// animal's own field mark: fine, dense dark speckling scattered over a
// sandy body - a different pattern technique from the Fiddler Ray's own
// bold saddle bands right next to it.
export function drawBanjoRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc0a878;
  const backColor = 0x8c7248;
  const bellyColor = 0xe8dcb8;
  const finColor = 0xa08858;
  const darkColor = 0x342810;
  const speckleColor = 0x5c4626;

  const disc = [
    { x: -30, y: 0 },
    { x: -26, y: -12 },
    { x: -12, y: -18 },
    { x: 6, y: -16 },
    { x: 14, y: -8 },
    { x: 14, y: 8 },
    { x: 6, y: 16 },
    { x: -12, y: 18 },
    { x: -26, y: 12 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(38 * s, -3.2 * s, 47 * s, -10.5 * s, 41 * s, -0.5 * s);
  g.fillTriangle(38 * s, 3.2 * s, 47 * s, 10.5 * s, 41 * s, 0.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(38 * s, -3.2 * s, 47 * s, -10.5 * s, 41 * s, -0.5 * s);
  g.strokeTriangle(38 * s, 3.2 * s, 47 * s, 10.5 * s, 41 * s, 0.5 * s);

  const tailTop = [
    { x: 14, y: -6.4 },
    { x: 24, y: -4.6 },
    { x: 32, y: -3.6 },
    { x: 38, y: -3.2 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x, y: -p.y })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(19 * s, -4.8 * s, 26 * s, -4.2 * s, 22 * s, -10 * s);
  g.fillTriangle(30 * s, -3.8 * s, 36 * s, -3.4 * s, 33 * s, -8.6 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(19 * s, -4.8 * s, 26 * s, -4.2 * s, 22 * s, -10 * s);
  g.strokeTriangle(30 * s, -3.8 * s, 36 * s, -3.4 * s, 33 * s, -8.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Fine, dense dark speckling - the real Banjo Ray's own field mark.
  g.fillStyle(speckleColor, 0.45 * alpha);
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const sx = -24 + col * 8 + (row % 2) * 3;
      const sy = -14 + row * 6.5;
      g.fillCircle(sx * s, sy * s, 0.7 * s);
    }
  }

  const topProfile = [
    { x: -26, y: -12 },
    { x: -12, y: -18 },
    { x: 6, y: -16 },
    { x: 14, y: -8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (3.6 + Math.sin(i * 1.3) * 1.8) * s }))
  );
  g.fillStyle(backColor, 0.3 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-16 * s, -9.6 * s, 1.4 * s);
  g.fillCircle(-12 * s, -11.6 * s, 1.4 * s);
  g.fillStyle(0x000000, 0.75 * alpha);
  g.fillCircle(-16 * s, -9.6 * s, 0.75 * s);
  g.fillCircle(-12 * s, -11.6 * s, 0.75 * s);

  g.restore();
}

// A fiddler ray - the same real rounded-disc, shark-tailed family as the
// Banjo Ray here, but told apart by its own bold field mark: dark,
// saddle-shaped bands crossing the back - a completely different
// pattern technique (broad bands, not fine speckling) from the Banjo
// Ray's own dense speckled texture.
export function drawFiddlerRay(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb0a082;
  const backColor = 0x847048;
  const bellyColor = 0xe0d4b0;
  const finColor = 0x968256;
  const darkColor = 0x2c2210;
  const saddleColor = 0x40301a;

  const disc = [
    { x: -29, y: 0 },
    { x: -25, y: -12 },
    { x: -11, y: -18 },
    { x: 7, y: -16 },
    { x: 15, y: -8 },
    { x: 15, y: 8 },
    { x: 7, y: 16 },
    { x: -11, y: 18 },
    { x: -25, y: 12 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(39 * s, -3.2 * s, 48 * s, -10.5 * s, 42 * s, -0.5 * s);
  g.fillTriangle(39 * s, 3.2 * s, 48 * s, 10.5 * s, 42 * s, 0.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(39 * s, -3.2 * s, 48 * s, -10.5 * s, 42 * s, -0.5 * s);
  g.strokeTriangle(39 * s, 3.2 * s, 48 * s, 10.5 * s, 42 * s, 0.5 * s);

  const tailTop = [
    { x: 15, y: -6.4 },
    { x: 25, y: -4.6 },
    { x: 33, y: -3.6 },
    { x: 39, y: -3.2 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x, y: -p.y })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(20 * s, -4.8 * s, 27 * s, -4.2 * s, 23 * s, -10 * s);
  g.fillTriangle(31 * s, -3.8 * s, 37 * s, -3.4 * s, 34 * s, -8.6 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(20 * s, -4.8 * s, 27 * s, -4.2 * s, 23 * s, -10 * s);
  g.strokeTriangle(31 * s, -3.8 * s, 37 * s, -3.4 * s, 34 * s, -8.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Dark, saddle-shaped bands crossing the back - the real Fiddler
  // Ray's own bold field mark, a different technique from the Banjo
  // Ray's own fine speckling.
  g.fillStyle(saddleColor, 0.55 * alpha);
  g.fillEllipse(-16 * s, -3 * s, 6 * s, 13 * s);
  g.fillEllipse(-2 * s, -1 * s, 6 * s, 14 * s);
  g.fillEllipse(10 * s, 0, 5 * s, 11 * s);

  const topProfile = [
    { x: -25, y: -12 },
    { x: -11, y: -18 },
    { x: 7, y: -16 },
    { x: 15, y: -8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (3.6 + Math.sin(i * 1.3) * 1.8) * s }))
  );
  g.fillStyle(backColor, 0.25 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(darkColor, alpha);
  g.fillCircle(-15 * s, -9.6 * s, 1.4 * s);
  g.fillCircle(-11 * s, -11.6 * s, 1.4 * s);
  g.fillStyle(0x000000, 0.75 * alpha);
  g.fillCircle(-15 * s, -9.6 * s, 0.75 * s);
  g.fillCircle(-11 * s, -11.6 * s, 0.75 * s);

  g.restore();
}

// A barndoor skate - the largest real skate there is, built around two
// genuine field marks that set the whole skate family apart from the
// rays here: NO tail spine at all (real skates lack the venomous barb
// every stingray-family ray here carries), and small twin dorsal fins
// right near the tip of a shorter, thicker tail instead of a bare whip.
// A very broad, sharply pointed rhomboid disc - the largest, most
// angular wingspan of any skate here - with sparse small dark spots.
export function drawBarndoorSkate(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xa08868;
  const backColor = 0x746040;
  const bellyColor = 0xe0d4b0;
  const finColor = 0x8c7850;
  const darkColor = 0x2c2210;
  const spotColor = 0x3c3018;

  // The very broad, sharply pointed rhomboid disc - the largest,
  // most angular skate wingspan here.
  const disc = [
    { x: 0, y: -30 },
    { x: 34, y: -8 },
    { x: 24, y: 6 },
    { x: 10, y: 4 },
    { x: 10, y: 20 },
    { x: 0, y: 30 },
    { x: -10, y: 20 },
    { x: -10, y: 4 },
    { x: -24, y: 6 },
    { x: -34, y: -8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The shorter, thicker tail with a real caudal fin remnant - NO spine
  // at all, unlike every ray here.
  const tailTop = [
    { x: 6, y: 22 },
    { x: 5, y: 32 },
    { x: 3, y: 40 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x - 4, y: p.y })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(3 * s, 26 * s, 8 * s, 27 * s, 5 * s, 22 * s);
  g.fillTriangle(2 * s, 33 * s, 7 * s, 34 * s, 4 * s, 29 * s);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokeTriangle(3 * s, 26 * s, 8 * s, 27 * s, 5 * s, 22 * s);
  g.strokeTriangle(2 * s, 33 * s, 7 * s, 34 * s, 4 * s, 29 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(1 * s, 38 * s, 5 * s, 44 * s, -1 * s, 41 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Sparse small dark spots.
  g.fillStyle(spotColor, 0.5 * alpha);
  [
    [-14, -6, 1.4],
    [10, -10, 1.4],
    [-4, 4, 1.3],
    [14, 4, 1.3],
    [-16, 10, 1.2]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(backColor, 0.3 * alpha);
  g.fillEllipse(0, -4 * s, 20 * s, 22 * s);
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);
  g.fillStyle(spotColor, 0.5 * alpha);
  [
    [-14, -6, 1.4],
    [10, -10, 1.4],
    [-4, 4, 1.3],
    [14, 4, 1.3],
    [-16, 10, 1.2]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xece0c0, alpha);
  g.fillCircle(-5 * s, -14 * s, 1.5 * s);
  g.fillCircle(5 * s, -14 * s, 1.5 * s);
  g.fillStyle(0x0e0a04, alpha);
  g.fillCircle(-4.7 * s, -14 * s, 0.85 * s);
  g.fillCircle(5.3 * s, -14 * s, 0.85 * s);

  g.restore();
}

// A winter skate - a real, close relative of the Barndoor Skate here,
// told genuinely apart by its own field marks: rounder, less angular
// wing-tip corners, and a pair of dark, eyespot-like blotches sitting
// right at the base of each pectoral fin - a real Winter Skate
// diagnostic mark, unlike the Barndoor's own plain sparse spotting.
export function drawWinterSkate(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x8c7c68;
  const backColor = 0x685a48;
  const bellyColor = 0xd0c4ac;
  const finColor = 0x746450;
  const darkColor = 0x241e14;
  const ocelliColor = 0x1c1810;
  const ocelliRing = 0xc4b494;

  // Rounder, less angular wing-tip corners than the Barndoor Skate.
  const disc = [
    { x: 0, y: -26 },
    { x: 26, y: -6 },
    { x: 20, y: 8 },
    { x: 9, y: 5 },
    { x: 9, y: 18 },
    { x: 0, y: 26 },
    { x: -9, y: 18 },
    { x: -9, y: 5 },
    { x: -20, y: 8 },
    { x: -26, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const tailTop = [
    { x: 5, y: 20 },
    { x: 4, y: 30 },
    { x: 2, y: 37 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x - 3.5, y: p.y })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(2 * s, 24 * s, 7 * s, 25 * s, 4 * s, 20 * s);
  g.fillTriangle(1 * s, 30 * s, 6 * s, 31 * s, 3 * s, 27 * s);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokeTriangle(2 * s, 24 * s, 7 * s, 25 * s, 4 * s, 20 * s);
  g.strokeTriangle(1 * s, 30 * s, 6 * s, 31 * s, 3 * s, 27 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(0.5 * s, 34 * s, 4 * s, 40 * s, -1 * s, 37 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // The dark, eyespot-like blotches at the base of each pectoral fin -
  // the real Winter Skate's own diagnostic mark.
  g.fillStyle(ocelliRing, 0.6 * alpha);
  g.fillCircle(-15 * s, 4 * s, 4.4 * s);
  g.fillCircle(15 * s, 4 * s, 4.4 * s);
  g.fillStyle(ocelliColor, 0.7 * alpha);
  g.fillCircle(-15 * s, 4 * s, 2.4 * s);
  g.fillCircle(15 * s, 4 * s, 2.4 * s);

  g.fillStyle(backColor, 0.3 * alpha);
  g.fillEllipse(0, -3 * s, 17 * s, 18 * s);
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);
  g.fillStyle(ocelliRing, 0.6 * alpha);
  g.fillCircle(-15 * s, 4 * s, 4.4 * s);
  g.fillCircle(15 * s, 4 * s, 4.4 * s);
  g.fillStyle(ocelliColor, 0.7 * alpha);
  g.fillCircle(-15 * s, 4 * s, 2.4 * s);
  g.fillCircle(15 * s, 4 * s, 2.4 * s);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xe8dcc0, alpha);
  g.fillCircle(-4.5 * s, -12 * s, 1.4 * s);
  g.fillCircle(4.5 * s, -12 * s, 1.4 * s);
  g.fillStyle(0x0e0a04, alpha);
  g.fillCircle(-4.2 * s, -12 * s, 0.78 * s);
  g.fillCircle(4.8 * s, -12 * s, 0.78 * s);

  g.restore();
}

// A clearnose skate - a real, genuinely distinctive skate, built around
// its own field mark and namesake: translucent, semi-transparent pale
// "window" patches on either side of the snout tip - real see-through
// cartilage, rendered as a lighter, glassier fill than the rest of the
// body - plus bold dark bars crossing the tail.
export function drawClearnoseSkate(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb09c74;
  const backColor = 0x8c7850;
  const bellyColor = 0xe8dcb8;
  const finColor = 0x968054;
  const darkColor = 0x2c2412;
  const barColor = 0x3c3018;
  const clearColor = 0xf0ecd8;

  const disc = [
    { x: 0, y: -27 },
    { x: 25, y: -7 },
    { x: 19, y: 7 },
    { x: 9, y: 4 },
    { x: 9, y: 19 },
    { x: 0, y: 27 },
    { x: -9, y: 19 },
    { x: -9, y: 4 },
    { x: -19, y: 7 },
    { x: -25, y: -7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const tailTop = [
    { x: 5, y: 21 },
    { x: 4, y: 31 },
    { x: 2, y: 39 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x - 3.6, y: p.y })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  // Bold dark bars crossing the tail - the real Clearnose Skate's own
  // second field mark.
  g.lineStyle(1.6 * s, barColor, 0.6 * alpha);
  [24, 30, 36].forEach((ty) => {
    g.beginPath();
    g.moveTo((3.5 - (ty - 24) * 0.25) * s, ty * s);
    g.lineTo((0.5 - (ty - 24) * 0.25) * s, ty * s);
    g.strokePath();
  });

  g.fillStyle(finColor, alpha);
  g.fillTriangle(2 * s, 25 * s, 7 * s, 26 * s, 4 * s, 21 * s);
  g.fillTriangle(1 * s, 31 * s, 6 * s, 32 * s, 3 * s, 28 * s);
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.strokeTriangle(2 * s, 25 * s, 7 * s, 26 * s, 4 * s, 21 * s);
  g.strokeTriangle(1 * s, 31 * s, 6 * s, 32 * s, 3 * s, 28 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(0.5 * s, 35 * s, 4 * s, 41 * s, -1 * s, 38 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  g.fillStyle(backColor, 0.3 * alpha);
  g.fillEllipse(0, -3 * s, 16 * s, 18 * s);
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // The translucent, semi-transparent "clear nose" patches - real
  // see-through cartilage, and the species' own namesake field mark.
  g.fillStyle(clearColor, 0.55 * alpha);
  g.fillEllipse(-6 * s, -18 * s, 4.4 * s, 6 * s);
  g.fillEllipse(6 * s, -18 * s, 4.4 * s, 6 * s);
  g.lineStyle(0.7 * s, darkColor, 0.3 * alpha);
  g.strokeEllipse(-6 * s, -18 * s, 4.4 * s, 6 * s);
  g.strokeEllipse(6 * s, -18 * s, 4.4 * s, 6 * s);

  g.lineStyle(1.2 * s, darkColor, 0.6 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xece0c0, alpha);
  g.fillCircle(-5 * s, -11 * s, 1.4 * s);
  g.fillCircle(5 * s, -11 * s, 1.4 * s);
  g.fillStyle(0x100c04, alpha);
  g.fillCircle(-4.7 * s, -11 * s, 0.78 * s);
  g.fillCircle(5.3 * s, -11 * s, 0.78 * s);

  g.restore();
}

// A little skate - the smallest of the skates here, deliberately left
// the plainest: a small, simply rounded disc with only fine, sparse
// speckling and no bold pattern at all - the real animal's own field
// mark is essentially its own small size and unremarkable look next to
// its bigger, bolder-marked relatives.
export function drawLittleSkate(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x9c8c70;
  const backColor = 0x746850;
  const bellyColor = 0xd8ccae;
  const finColor = 0x847454;
  const darkColor = 0x282010;
  const speckleColor = 0x584c30;

  const disc = [
    { x: 0, y: -19 },
    { x: 17, y: -5 },
    { x: 13, y: 6 },
    { x: 6, y: 3 },
    { x: 6, y: 13 },
    { x: 0, y: 19 },
    { x: -6, y: 13 },
    { x: -6, y: 3 },
    { x: -13, y: 6 },
    { x: -17, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  const tailTop = [
    { x: 3.5, y: 14.5 },
    { x: 2.8, y: 22 },
    { x: 1.4, y: 28 }
  ];
  const tailBottom = tailTop.map((p) => ({ x: p.x - 2.6, y: p.y })).reverse();
  const tail = tailTop.concat(tailBottom).map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(tail, true);
  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.strokePoints(tail, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(1.4 * s, 17.5 * s, 5 * s, 18.3 * s, 3 * s, 14.5 * s);
  g.fillTriangle(0.6 * s, 22 * s, 4.2 * s, 22.8 * s, 2.2 * s, 20 * s);
  g.lineStyle(0.8 * s, darkColor, 0.4 * alpha);
  g.strokeTriangle(1.4 * s, 17.5 * s, 5 * s, 18.3 * s, 3 * s, 14.5 * s);
  g.strokeTriangle(0.6 * s, 22 * s, 4.2 * s, 22.8 * s, 2.2 * s, 20 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(0.4 * s, 25 * s, 3 * s, 29 * s, -0.6 * s, 27 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);

  // Fine, sparse speckling - deliberately plain and unremarkable.
  g.fillStyle(speckleColor, 0.35 * alpha);
  [
    [-7, -4, 0.8],
    [5, -6, 0.8],
    [-3, 3, 0.7],
    [7, 4, 0.7],
    [-9, 5, 0.7]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.fillStyle(backColor, 0.25 * alpha);
  g.fillEllipse(0, -2 * s, 11 * s, 12 * s);
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(disc, true);
  g.fillStyle(speckleColor, 0.35 * alpha);
  [
    [-7, -4, 0.8],
    [5, -6, 0.8],
    [-3, 3, 0.7],
    [7, 4, 0.7],
    [-9, 5, 0.7]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokePoints(disc, true);

  g.fillStyle(0xe4d8bc, alpha);
  g.fillCircle(-3.2 * s, -8 * s, 1.1 * s);
  g.fillCircle(3.2 * s, -8 * s, 1.1 * s);
  g.fillStyle(0x0c0904, alpha);
  g.fillCircle(-3 * s, -8 * s, 0.6 * s);
  g.fillCircle(3.4 * s, -8 * s, 0.6 * s);

  g.restore();
}

// A great barracuda - the largest barracuda there is, a real fierce
// open-water predator: an elongated cylindrical torpedo body, a long
// underbite jaw bristling with visible dagger-like fangs, and the real
// animal's own field mark - a scatter of irregular dark blotches along
// the lower flank (not stripes or bars, a genuinely different pattern
// technique from the Pickhandle Barracuda's own diagonal chevron bars).
export function drawGreatBarracuda(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xacb4b4;
  const backColor = 0x4c5c5c;
  const bellyColor = 0xf0f2ee;
  const finColor = 0x5c6c6c;
  const darkColor = 0x1c2424;
  const toothColor = 0xf2f0e8;
  const blotchColor = 0x384444;

  const body = [
    { x: -34, y: 0 },
    { x: -30, y: -3.2 },
    { x: -18, y: -5.4 },
    { x: -4, y: -6.4 },
    { x: 10, y: -6.2 },
    { x: 20, y: -4.8 },
    { x: 28, y: -2.6 },
    { x: 33, y: -1.2 },
    { x: 33, y: 1.2 },
    { x: 28, y: 2.6 },
    { x: 20, y: 4.8 },
    { x: 10, y: 6.2 },
    { x: -4, y: 6.4 },
    { x: -18, y: 5.4 },
    { x: -30, y: 3.2 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(33 * s, -1.8 * s, 42 * s, -8.5 * s, 36.5 * s, -0.3 * s);
  g.fillTriangle(33 * s, 1.8 * s, 42 * s, 8.5 * s, 36.5 * s, 0.3 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(33 * s, -1.8 * s, 42 * s, -8.5 * s, 36.5 * s, -0.3 * s);
  g.strokeTriangle(33 * s, 1.8 * s, 42 * s, 8.5 * s, 36.5 * s, 0.3 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-12 * s, 3.6 * s, -17 * s, 12.5 * s, -5 * s, 6.2 * s);
  g.fillTriangle(11 * s, 6.4 * s, 8 * s, 12 * s, 17 * s, 6.6 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Irregular dark blotches along the lower flank - the real Great
  // Barracuda's own field mark.
  g.fillStyle(blotchColor, 0.4 * alpha);
  [
    [-6, 4.5, 2.4],
    [2, 5.4, 2.6],
    [10, 5, 2.2],
    [18, 4, 2]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 1.4 * s, br * s));

  const topProfile = [
    { x: -30, y: -3.2 },
    { x: -18, y: -5.4 },
    { x: -4, y: -6.4 },
    { x: 10, y: -6.2 },
    { x: 20, y: -4.8 },
    { x: 28, y: -2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2 + Math.sin(i * 1.3) * 1) * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -6.5 * s, 5 * s, -5.8 * s, 0.5 * s, -14.5 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-3 * s, -6.5 * s, 5 * s, -5.8 * s, 0.5 * s, -14.5 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(14 * s, -5 * s, 20 * s, -4.4 * s, 17 * s, -10 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(14 * s, -5 * s, 20 * s, -4.4 * s, 17 * s, -10 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-24 * s, -3.6 * s);
  g.lineTo(-22 * s, 3.6 * s);
  g.strokePath();

  // The long underbite jaw, bristling with visible dagger-like fangs.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-33.5 * s, 0.6 * s);
  g.lineTo(-22 * s, 3.6 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 4; i += 1) {
    const tx = -31.5 + i * 2.6;
    g.fillTriangle(tx * s, 1.4 * s, (tx + 1.3) * s, 1.9 * s, (tx + 0.4) * s, 4 * s);
  }

  g.fillStyle(0xecefec, alpha);
  g.fillCircle(-27 * s, -1.6 * s, 2.3 * s);
  g.fillStyle(0x0a0e0e, alpha);
  g.fillCircle(-26.6 * s, -1.6 * s, 1.25 * s);

  g.restore();
}

// A pickhandle barracuda - a real, smaller, more slender relative of the
// Great Barracuda here, told genuinely apart by the real animal's own
// field mark: a series of faint, diagonal chevron-shaped dark bars along
// the upper flank - a completely different pattern (bars, not scattered
// blotches) from the Great Barracuda's own lower-flank splotches.
export function drawPickhandleBarracuda(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xb8c0c0;
  const backColor = 0x5c6c6c;
  const bellyColor = 0xf2f4f0;
  const finColor = 0x687878;
  const darkColor = 0x202a2a;
  const toothColor = 0xf2f0e8;
  const barColor = 0x445050;

  const body = [
    { x: -27, y: 0 },
    { x: -24, y: -2.6 },
    { x: -14, y: -4.4 },
    { x: -3, y: -5.2 },
    { x: 8, y: -5 },
    { x: 16, y: -3.9 },
    { x: 22, y: -2.1 },
    { x: 26, y: -1 },
    { x: 26, y: 1 },
    { x: 22, y: 2.1 },
    { x: 16, y: 3.9 },
    { x: 8, y: 5 },
    { x: -3, y: 5.2 },
    { x: -14, y: 4.4 },
    { x: -24, y: 2.6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -1.4 * s, 33.5 * s, -6.8 * s, 29 * s, -0.2 * s);
  g.fillTriangle(26 * s, 1.4 * s, 33.5 * s, 6.8 * s, 29 * s, 0.2 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(26 * s, -1.4 * s, 33.5 * s, -6.8 * s, 29 * s, -0.2 * s);
  g.strokeTriangle(26 * s, 1.4 * s, 33.5 * s, 6.8 * s, 29 * s, 0.2 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-9 * s, 2.9 * s, -13.5 * s, 10 * s, -3.5 * s, 5 * s);
  g.fillTriangle(9 * s, 5.1 * s, 6.5 * s, 9.7 * s, 13.5 * s, 5.3 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Faint diagonal chevron-shaped dark bars on the upper flank - the
  // real Pickhandle's own field mark.
  g.lineStyle(1.1 * s, barColor, 0.5 * alpha);
  [-16, -8, 0, 8, 16].forEach((bx) => {
    g.beginPath();
    g.moveTo(bx * s, -4.6 * s);
    g.lineTo((bx + 4) * s, 0);
    g.lineTo(bx * s, 3.4 * s);
    g.strokePath();
  });

  const topProfile = [
    { x: -24, y: -2.6 },
    { x: -14, y: -4.4 },
    { x: -3, y: -5.2 },
    { x: 8, y: -5 },
    { x: 16, y: -3.9 },
    { x: 22, y: -2.1 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (1.6 + Math.sin(i * 1.3) * 0.8) * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2.5 * s, -5.3 * s, 4 * s, -4.7 * s, 0.4 * s, -11.5 * s);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(-2.5 * s, -5.3 * s, 4 * s, -4.7 * s, 0.4 * s, -11.5 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, -4 * s, 16 * s, -3.5 * s, 13.5 * s, -8 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(11 * s, -4 * s, 16 * s, -3.5 * s, 13.5 * s, -8 * s);

  g.lineStyle(1 * s, darkColor, 0.45 * alpha);
  g.beginPath();
  g.moveTo(-19 * s, -2.9 * s);
  g.lineTo(-17.5 * s, 2.9 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.65 * alpha);
  g.beginPath();
  g.moveTo(-26.5 * s, 0.5 * s);
  g.lineTo(-17.5 * s, 2.9 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 3; i += 1) {
    const tx = -25 + i * 2.4;
    g.fillTriangle(tx * s, 1.2 * s, (tx + 1.1) * s, 1.6 * s, (tx + 0.35) * s, 3.2 * s);
  }

  g.fillStyle(0xecefec, alpha);
  g.fillCircle(-21.5 * s, -1.3 * s, 1.9 * s);
  g.fillStyle(0x0c1010, alpha);
  g.fillCircle(-21.2 * s, -1.3 * s, 1.05 * s);

  g.restore();
}

// A fat snook - a real, close relative of the Snook here, sharing the
// same genus-wide black lateral stripe, but told genuinely apart by the
// real animal's own field mark: a notably deeper, stockier body (the
// real detail the species is named for, unlike the Snook's own lean
// torpedo build) and a shorter, blunter head profile, plus a warmer,
// more brassy-gold body tone.
export function drawFatSnook(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4b878;
  const backColor = 0x8c8058;
  const bellyColor = 0xece4c0;
  const finColor = 0xa89860;
  const darkColor = 0x342c14;
  const stripeColor = 0x1c1810;

  // A notably deeper, stockier body and a shorter, blunter head - the
  // real Fat Snook's own field mark, unlike the Snook's own lean build.
  const body = [
    { x: -21, y: 1 },
    { x: -19, y: -6.4 },
    { x: -10, y: -12 },
    { x: 3, y: -14 },
    { x: 15, y: -11.4 },
    { x: 22, y: -6.8 },
    { x: 26, y: -2.4 },
    { x: 26, y: 2.4 },
    { x: 22, y: 6.8 },
    { x: 15, y: 11.4 },
    { x: 3, y: 14 },
    { x: -10, y: 12 },
    { x: -18, y: 7 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(26 * s, -4.4 * s, 34.5 * s, -10.2 * s, 29.5 * s, 0);
  g.fillTriangle(26 * s, 4.4 * s, 34.5 * s, 10.2 * s, 29.5 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(26 * s, -4.4 * s, 34.5 * s, -10.2 * s, 29.5 * s, 0);
  g.strokeTriangle(26 * s, 4.4 * s, 34.5 * s, 10.2 * s, 29.5 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 6.6 * s, -13.5 * s, 15.5 * s, -2.5 * s, 9.6 * s);
  g.fillTriangle(3 * s, 12 * s, -0.5 * s, 19.5 * s, 8 * s, 13 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -19, y: -6.4 },
    { x: -10, y: -12 },
    { x: 3, y: -14 },
    { x: 15, y: -11.4 },
    { x: 22, y: -6.8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (4.4 + Math.sin(i * 1.3) * 2.2) * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.7 * alpha);
  g.strokePoints(body, true);

  // The genus-wide black lateral stripe - real, shared with the Snook.
  g.lineStyle(1.9 * s, stripeColor, 0.75 * alpha);
  g.beginPath();
  g.moveTo(-17 * s, 0.6 * s);
  quadCurveTo(g, -17 * s, 0.6 * s, 0, 1.4 * s, 25 * s, -0.5 * s);
  g.strokePath();

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -13.8 * s, 9 * s, -11.6 * s, 1 * s, -22 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-4 * s, -13.8 * s, 9 * s, -11.6 * s, 1 * s, -22 * s);

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-9.5 * s, -9.5 * s);
  g.lineTo(-8.5 * s, 9.5 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.beginPath();
  g.moveTo(-21 * s, 0.5 * s);
  quadCurveTo(g, -21 * s, 0.5 * s, -23 * s, 2 * s, -16 * s, 4.5 * s);
  g.strokePath();

  g.fillStyle(0xf0e8c8, alpha);
  g.fillCircle(-13.5 * s, -3.4 * s, 2.4 * s);
  g.fillStyle(0x0c0a04, alpha);
  g.fillCircle(-13.1 * s, -3.4 * s, 1.3 * s);

  g.restore();
}

// An african pompano - a real, deep-bodied trevally relative, told apart
// by two genuine field marks: a very deep, near-disc-shaped body with a
// steep vertical forehead, and long, trailing filament rays streaming
// off the dorsal and anal fins - a real African Pompano trait, and a
// construction unlike the Permit's own shorter trailing sickle fins.
export function drawAfricanPompano(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc4ccd0;
  const backColor = 0x3c5468;
  const bellyColor = 0xf0f4f4;
  const finColor = 0x2c4454;
  const darkColor = 0x121e28;

  // The very deep, near-disc-shaped body with a steep vertical forehead
  // - the real African Pompano's own defining silhouette.
  const body = [
    { x: -6, y: -22 },
    { x: 4, y: -19 },
    { x: 14, y: -12 },
    { x: 19, y: -3 },
    { x: 19, y: 6 },
    { x: 12, y: 15 },
    { x: 2, y: 21 },
    { x: -8, y: 20 },
    { x: -14, y: 12 },
    { x: -16, y: 0 },
    { x: -14, y: -12 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(19 * s, -3.6 * s, 27 * s, -8 * s, 22 * s, 0);
  g.fillTriangle(19 * s, 5.6 * s, 27 * s, 10 * s, 22 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.55 * alpha);
  g.strokeTriangle(19 * s, -3.6 * s, 27 * s, -8 * s, 22 * s, 0);
  g.strokeTriangle(19 * s, 5.6 * s, 27 * s, 10 * s, 22 * s, 0);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, 8 * s, -9 * s, 16 * s, 2 * s, 12 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -6, y: -22 },
    { x: 4, y: -19 },
    { x: 14, y: -12 },
    { x: 19, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (4 + Math.sin(i * 1.3) * 2) * s }))
  );
  g.fillStyle(backColor, 0.4 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.2 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // The long, trailing filament rays streaming off the dorsal fin - a
  // real African Pompano trait, drawn as thin curved streamers rather
  // than a solid sickle blade.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -20.5 * s, 8 * s, -15.5 * s, 2 * s, -13 * s);
  g.lineStyle(1.1 * s, finColor, 0.85 * alpha);
  g.beginPath();
  g.moveTo(2 * s, -19 * s);
  quadCurveTo(g, 2 * s, -19 * s, -2 * s, -28 * s, 2 * s, -36 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(6 * s, -16.5 * s);
  quadCurveTo(g, 6 * s, -16.5 * s, 5 * s, -25 * s, 9 * s, -32 * s);
  g.strokePath();

  // The matching trailing filaments off the anal fin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 15 * s, 4 * s, 19.5 * s, -1 * s, 21.5 * s);
  g.lineStyle(1.1 * s, finColor, 0.85 * alpha);
  g.beginPath();
  g.moveTo(-2 * s, 20 * s);
  quadCurveTo(g, -2 * s, 20 * s, -6 * s, 28 * s, -2 * s, 35 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-4 * s, -13 * s);
  g.lineTo(-3 * s, 12 * s);
  g.strokePath();

  g.fillStyle(0xeef2f2, alpha);
  g.fillCircle(-9 * s, -13 * s, 2.3 * s);
  g.fillStyle(0x0a1218, alpha);
  g.fillCircle(-8.6 * s, -13 * s, 1.25 * s);

  g.restore();
}

// A lookdown - built with a construction nothing else in the game
// shares: an almost paper-thin, extremely laterally compressed body,
// with a dramatically steep, near-vertical forehead dropping straight
// down to a small, low, underslung mouth - the real detail behind the
// species' own name, since the fish reads as permanently looking down
// its own nose. Mirror-bright silver, deeply forked tail with long
// trailing tips.
export function drawLookdown(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xe4e8e8;
  const backColor = 0xa8b4b8;
  const bellyColor = 0xf6f8f6;
  const finColor = 0xc8d0d0;
  const darkColor = 0x40484c;

  // The dramatically steep, near-vertical forehead and the almost
  // paper-thin, extremely laterally compressed body - the real
  // Lookdown's own unmistakable silhouette.
  const body = [
    { x: -2, y: -19 },
    { x: 6, y: -14 },
    { x: 11, y: -5 },
    { x: 11, y: 4 },
    { x: 6, y: 10 },
    { x: -2, y: 13 },
    { x: -10, y: 9 },
    { x: -13, y: 1 },
    { x: -12, y: -8 },
    { x: -8, y: -15 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, -2.6 * s, 20 * s, -8 * s, 15 * s, -1 * s);
  g.fillTriangle(11 * s, 3.6 * s, 20 * s, 9 * s, 15 * s, 1 * s);
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.strokeTriangle(11 * s, -2.6 * s, 20 * s, -8 * s, 15 * s, -1 * s);
  g.strokeTriangle(11 * s, 3.6 * s, 20 * s, 9 * s, 15 * s, 1 * s);

  g.fillStyle(finColor, alpha);
  g.fillTriangle(-2 * s, 6.5 * s, -6 * s, 13 * s, 3 * s, 9 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -2, y: -19 },
    { x: 6, y: -14 },
    { x: 11, y: -5 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (2.6 + Math.sin(i * 1.3) * 1.3) * s }))
  );
  g.fillStyle(backColor, 0.35 * alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.1 * s, darkColor, 0.65 * alpha);
  g.strokePoints(body, true);

  // A long, low, trailing dorsal filament and matching anal filament -
  // real Lookdown fin streamers.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-1 * s, -18.5 * s, 7 * s, -13.5 * s, 2 * s, -10.5 * s);
  g.lineStyle(1 * s, finColor, 0.8 * alpha);
  g.beginPath();
  g.moveTo(3 * s, -14 * s);
  quadCurveTo(g, 3 * s, -14 * s, 1 * s, -19 * s, 4 * s, -23 * s);
  g.strokePath();

  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  g.beginPath();
  g.moveTo(3 * s, -5.5 * s);
  g.lineTo(3.5 * s, 4.5 * s);
  g.strokePath();

  // The small, low, underslung mouth - positioned right at the base of
  // the steep forehead.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, -14.5 * s);
  g.lineTo(-4 * s, -11.5 * s);
  g.strokePath();

  g.fillStyle(0xf4f6f6, alpha);
  g.fillCircle(-4 * s, -11 * s, 2.4 * s);
  g.fillStyle(0x0a1012, alpha);
  g.fillCircle(-3.6 * s, -11 * s, 1.3 * s);

  g.restore();
}

// A clump of seaweed - a small holdfast with a few long, wavy blades of
// varying length fanning out from it, each tapering to a point. What comes
// up on a bare hook instead of an actual bite.
export function drawSeaweed(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bladeColor = 0x3f7d3a;
  const darkColor = 0x2a5a28;

  const blades = [
    { len: 26, bow: 9, angle: -0.55 },
    { len: 19, bow: -6, angle: -0.15 },
    { len: 30, bow: 10, angle: 0.18 },
    { len: 17, bow: -5, angle: 0.6 }
  ];

  blades.forEach(({ len, bow, angle }, i) => {
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const steps = 10;
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const curve = Math.sin(tt * Math.PI) * bow;
      const cx = (dx * len * tt + px * curve) * s;
      const cy = (dy * len * tt + py * curve) * s;
      const w = (3 - tt * 2.5) * s;
      left.push({ x: cx + px * w, y: cy + py * w });
      right.push({ x: cx - px * w, y: cy - py * w });
    }
    g.fillStyle(i % 2 === 0 ? bladeColor : darkColor, alpha);
    g.fillPoints(left.concat(right.reverse()), true);
  });

  // Holdfast, where the blades meet.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(0, 0, 3 * s);

  g.restore();
}

// A worn-out old rubber boot - shaft, curled toe, a thick sole, an open
// hollow top, a scuffed patch with a tear, and a couple of lace eyelets, so
// it actually reads as a boot and not just a brown blob.
export function drawOldBoot(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x4a3a2e;
  const soleColor = 0x231a14;
  const wornColor = 0x6b5644;
  const darkHole = 0x120d0a;

  const body = [
    { x: -14, y: -22 },
    { x: 2, y: -22 },
    { x: 4, y: -8 },
    { x: 16, y: -10 },
    { x: 22, y: -2 },
    { x: 18, y: 5 },
    { x: 16, y: 6 },
    { x: -14, y: 6 },
    { x: -17, y: 2 },
    { x: -14, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);
  g.lineStyle(1.4 * s, soleColor, 0.9 * alpha);
  g.strokePoints(body, true);

  // Sole, a thicker dark strip along the bottom.
  g.fillStyle(soleColor, alpha);
  g.fillPoints(
    [
      { x: -17 * s, y: 2 * s },
      { x: -14 * s, y: 6 * s },
      { x: 16 * s, y: 6 * s },
      { x: 18 * s, y: 5 * s },
      { x: 17 * s, y: 8 * s },
      { x: -16 * s, y: 8 * s }
    ],
    true
  );

  // Open top of the boot - a dark hollow oval where a foot would go in.
  g.fillStyle(darkHole, alpha);
  g.fillEllipse(-6 * s, -22 * s, 14 * s, 4 * s);

  // A worn/scuffed patch with a small tear, so it reads as beat-up junk
  // instead of a clean new boot.
  g.fillStyle(wornColor, 0.6 * alpha);
  g.fillEllipse(-4 * s, -4 * s, 10 * s, 7 * s);
  g.lineStyle(1 * s, darkHole, 0.8 * alpha);
  g.beginPath();
  g.moveTo(-8 * s, -10 * s);
  g.lineTo(-4 * s, -6 * s);
  g.lineTo(-9 * s, -3 * s);
  g.strokePath();

  // A couple of lace eyelets near the top opening.
  g.fillStyle(soleColor, alpha);
  g.fillCircle(-2 * s, -16 * s, 1.2 * s);
  g.fillCircle(2 * s, -14 * s, 1.2 * s);

  g.restore();
}

// A real deep-sea dragonfish (Stomiidae) - extremely elongated, eel-like
// and near-black, with a hinged jaw of long transparent fangs (real deep-
// sea dragonfish teeth are genuinely glass-clear, so they don't catch and
// betray any stray light), rows of pale photophores down the flank, and a
// long chin barbel tipped with a glowing lure - unlike the Angler Fish's
// dorsal illicium, this hangs and trails from the CHIN, and glows a dim
// red rather than the Angler's cyan: several real dragonfish species
// (the loosejaws) are the rare deep-sea animals that can emit red light,
// which most other deep-sea eyes can't even see - effectively a sniper
// scope invisible to their prey.
export function drawDragonfish(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x0a0c12;
  const bellyColor = 0x14171f;
  const finColor = 0x0e1017;
  const darkColor = 0x000000;
  const fangColor = 0xcfe6f2;
  const photophoreColor = 0xff5a4a;

  // Long, slender, whip-tapering eel body - none of the other deep-sea
  // fish here (the lumpy, globular Angler) reads anywhere near this
  // elongated.
  const top = [
    { x: -34, y: -3 },
    { x: -26, y: -7 },
    { x: -14, y: -6.4 },
    { x: 0, y: -4.4 },
    { x: 16, y: -3 },
    { x: 30, y: -1.8 },
    { x: 44, y: -0.8 }
  ];
  const bottom = [
    { x: 44, y: 0.8 },
    { x: 30, y: 2.4 },
    { x: 16, y: 4 },
    { x: 0, y: 5.2 },
    { x: -14, y: 6.2 },
    { x: -26, y: 4.2 },
    { x: -34, y: 3 }
  ];
  const body = [...top, ...bottom].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A whip-thin tail filament, trailing well past where the body itself
  // tapers out.
  g.lineStyle(1 * s, finColor, 0.85 * alpha);
  g.beginPath();
  g.moveTo(44 * s, 0 * s);
  quadCurveTo(g, 44 * s, 0 * s, 56 * s, -1.5 * s, 66 * s, 0.5 * s);
  g.strokePath();

  // Small dorsal and anal fins, both set unusually far back near the tail
  // rather than centred - matches the real fish, and reads very
  // differently from every forward-set-finned open-water species.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(24 * s, -3 * s, 33 * s, -9 * s, 36 * s, -2.5 * s);
  g.fillTriangle(24 * s, 3.5 * s, 32 * s, 9.5 * s, 35 * s, 3 * s);

  // A tiny pectoral fin just behind the head.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-20 * s, 2 * s, -26 * s, 9 * s, -16 * s, 5 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);
  g.fillStyle(bellyColor, 0.3 * alpha);
  g.fillEllipse(0, 4 * s, 60 * s, 6 * s);
  g.lineStyle(1 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // The huge hinged jaw, dropped open at an angle - real dragonfish can
  // unhinge their jaw far wider than the head itself to take prey larger
  // than they are.
  g.fillStyle(darkColor, alpha);
  g.beginPath();
  g.moveTo(-34 * s, -4 * s);
  g.lineTo(-14 * s, -3 * s);
  g.lineTo(-16 * s, 9 * s);
  g.lineTo(-32 * s, 10 * s);
  g.closePath();
  g.fillPath();

  // Long needle fangs, top and bottom, drawn translucent - too long to
  // fully close over, the real animal's own signature look.
  g.fillStyle(fangColor, 0.55 * alpha);
  for (let i = 0; i < 4; i += 1) {
    const tt = i / 3;
    const tx = -32 + tt * 15;
    g.fillTriangle(tx * s, -3 * s, (tx + 2) * s, -3 * s, (tx + 1) * s, 5 * s);
  }
  for (let i = 0; i < 3; i += 1) {
    const tt = i / 2;
    const tx = -30 + tt * 12;
    g.fillTriangle(tx * s, 9.5 * s, (tx + 2.2) * s, 9.5 * s, (tx + 1.1) * s, 2.5 * s);
  }

  // Small, dark, near-vestigial eye.
  g.fillStyle(0x1c2028, alpha);
  g.fillCircle(-24 * s, -6 * s, 1.6 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-24 * s, -6 * s, 0.9 * s);

  // The chin barbel - unlike the Angler's illicium (which arcs UP off the
  // forehead), this hangs and trails DOWN and back from underneath the
  // jaw, tipped with a dim red photophore lure.
  g.lineStyle(1 * s, 0x1c2028, alpha);
  g.beginPath();
  g.moveTo(-30 * s, 9 * s);
  quadCurveTo(g, -30 * s, 9 * s, -26 * s, 22 * s, -14 * s, 26 * s);
  g.strokePath();

  const lureX = -14 * s;
  const lureY = 26 * s;
  g.fillStyle(photophoreColor, 0.16 * alpha);
  g.fillCircle(lureX, lureY, 7 * s);
  g.fillStyle(photophoreColor, 0.32 * alpha);
  g.fillCircle(lureX, lureY, 4.5 * s);
  g.fillStyle(photophoreColor, 0.9 * alpha);
  g.fillCircle(lureX, lureY, 2.2 * s);
  g.fillStyle(0xffd8d0, alpha);
  g.fillCircle(lureX, lureY, 1 * s);

  // Two faint rows of small photophores dotting the flank and belly - the
  // real animal's array of light-producing spots used to counter-
  // illuminate itself against the faint light from above.
  g.fillStyle(photophoreColor, 0.55 * alpha);
  [-8, 0, 8, 16, 24].forEach((px) => {
    g.fillCircle(px * s, 3.5 * s, 0.9 * s);
  });
  g.fillStyle(photophoreColor, 0.35 * alpha);
  [-4, 4, 12, 20].forEach((px) => {
    g.fillCircle(px * s, -1.5 * s, 0.7 * s);
  });

  g.restore();
}

// A fangtooth - the deepest-common abyssal ambush predator here short of
// the Angler Fish, and instantly recognisable for one real reason alone:
// two huge, curved lower fangs so long the real fish has sockets on
// either side of its own brain just to let its jaw fully close around
// them - they still show even with the mouth shut, unlike any other
// predator's teeth in the game. A tiny, short, deep-bodied fish (almost
// as tall as it is long), unlike the Dragonfish's elongated, eel-like
// build right next to it.
export function drawFangtooth(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x241814;
  const bellyColor = 0x3c2c20;
  const finColor = 0x1c130f;
  const darkColor = 0x000000;
  const fangColor = 0xe8e2d4;

  // A short, deep, compressed body - almost as tall as it is long, unlike
  // any of the game's other elongated deep-sea species.
  const body = [
    { x: -14, y: 0 },
    { x: -12, y: -8 },
    { x: -4, y: -13 },
    { x: 6, y: -11 },
    { x: 12, y: -4 },
    { x: 12, y: 4 },
    { x: 6, y: 11 },
    { x: -4, y: 13 },
    { x: -12, y: 8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A small, rounded tail fin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, -4 * s, 21 * s, -7 * s, 15 * s, 0);
  g.fillTriangle(11 * s, 4 * s, 21 * s, 7 * s, 15 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(11 * s, -4 * s, 21 * s, -7 * s, 15 * s, 0);
  g.strokeTriangle(11 * s, 4 * s, 21 * s, 7 * s, 15 * s, 0);

  // A tall, spiny dorsal fin, and a small rounded pectoral fin.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-3 * s, -12 * s, 5 * s, -11 * s, 0, -21 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-3 * s, -12 * s, 5 * s, -11 * s, 0, -21 * s);
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-6 * s, 3 * s, -14 * s, 9 * s, -3 * s, 9 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);
  // A faint, barely-there paler underside - deep-sea camouflage means
  // almost no visible countershading, same as the Angler Fish.
  g.fillStyle(bellyColor, 0.4 * alpha);
  g.fillEllipse(-1 * s, 6 * s, 16 * s, 7 * s);
  g.lineStyle(1.2 * s, darkColor, 0.9 * alpha);
  g.strokePoints(body, true);

  // The closed jawline.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-14 * s, 0);
  g.lineTo(-6 * s, 3 * s);
  g.strokePath();

  // The two huge lower fangs - the real animal's own unmistakable field
  // mark, so long they still show past the closed jaw.
  g.fillStyle(fangColor, alpha);
  g.fillTriangle(-12 * s, -1 * s, -9 * s, -9 * s, -7 * s, -1 * s);
  g.fillTriangle(-9 * s, 2 * s, -5 * s, -6 * s, -3 * s, 3 * s);
  g.lineStyle(0.6 * s, darkColor, 0.4 * alpha);
  g.strokeTriangle(-12 * s, -1 * s, -9 * s, -9 * s, -7 * s, -1 * s);
  g.strokeTriangle(-9 * s, 2 * s, -5 * s, -6 * s, -3 * s, 3 * s);

  // Small, dark, deep-set eye - real Fangtooth eyes are surprisingly
  // small for a deep-sea fish, unlike most others'.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-9 * s, -6 * s, 1.4 * s);

  // A few spiny skin ridges along the head, the same rough abyssal
  // texture the Angler Fish carries.
  g.fillStyle(finColor, 0.7 * alpha);
  [
    [-2, -9, 1.1],
    [4, -6, 1],
    [-7, -10, 0.9]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  g.restore();
}

// A humpback whale - not a fish or a shark, and drawn nothing like either:
// a real humpback's own unmistakable field marks are a much deeper, chunkier
// body than any shark here, a small stubby dorsal fin sat on a "hump" far
// back on the spine (the real animal's namesake), knobby tubercles studding
// the head and jaw, ventral throat grooves, twin blowholes, a wide notched
// tail fluke, and above all its own huge, elongated, mostly-white pectoral
// flipper - by real proportion nearly a third of the whole body length,
// nothing else in the game has anything close.
export function drawHumpbackWhale(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x20262a;
  const bellyColor = 0xe8e2d0;
  const finColor = 0x20262a;
  const darkColor = 0x0a0c0e;
  const flipperColor = 0xf0ecdc;
  const flipperEdgeColor = 0x2c3236;
  const barnacleColor = 0xc9bfa0;

  // A long, deep-bodied rorqual, thickest around a third of the way back
  // from the rounded (not pointed) snout and tapering to a slender tail
  // stock - real humpbacks read as an elongated torpedo, not a round
  // blob, even though they're much chunkier than any shark here.
  const body = [
    { x: -58, y: 0 },
    { x: -55, y: -8 },
    { x: -46, y: -15 },
    { x: -32, y: -19 },
    { x: -16, y: -20 },
    { x: 0, y: -19 },
    { x: 14, y: -16 },
    { x: 26, y: -11 },
    { x: 34, y: -6 },
    { x: 39, y: 0 },
    { x: 34, y: 6 },
    { x: 26, y: 11 },
    { x: 14, y: 16 },
    { x: 0, y: 19 },
    { x: -16, y: 20 },
    { x: -32, y: 19 },
    { x: -46, y: 15 },
    { x: -55, y: 8 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // The wide, notched tail fluke - two broad flat lobes swept out from a
  // slender peduncle to a deep central notch, the real animal's own
  // iconic silhouette (unlike a fish's single vertical tail fin, a
  // whale's fluke is horizontal, but this side-profile stylization keeps
  // the notch shape recognizable the same way the game's sharks already
  // take real liberties with their own tails).
  const fluke = [
    { x: 36, y: -4 },
    { x: 48, y: -20 },
    { x: 70, y: -22 },
    { x: 56, y: -8 },
    { x: 44, y: -1 },
    { x: 44, y: 1 },
    { x: 56, y: 8 },
    { x: 70, y: 22 },
    { x: 48, y: 20 },
    { x: 36, y: 4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(finColor, alpha);
  g.fillPoints(fluke, true);
  g.lineStyle(1.3 * s, darkColor, 0.7 * alpha);
  g.strokePoints(fluke, true);
  // A faint centerline hints at the fluke lying in its own, horizontal
  // plane rather than standing upright like a fish's tail.
  g.lineStyle(1 * s, darkColor, 0.3 * alpha);
  g.beginPath();
  g.moveTo(40 * s, 0);
  g.lineTo(66 * s, 0);
  g.strokePath();

  // The huge, elongated, mostly-white pectoral flipper, swept back off
  // the front third of the body and tapering to a rounded tip - the real
  // Humpback's own single most famous field mark, nothing else in the
  // game has anything close.
  const flipper = [
    { x: -24, y: 8 },
    { x: -36, y: 16 },
    { x: -47, y: 27 },
    { x: -55, y: 40 },
    { x: -59, y: 53 },
    { x: -52, y: 59 },
    { x: -43, y: 51 },
    { x: -33, y: 38 },
    { x: -22, y: 24 },
    { x: -12, y: 12 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  g.fillStyle(flipperColor, alpha);
  g.fillPoints(flipper, true);
  g.lineStyle(1.2 * s, flipperEdgeColor, 0.7 * alpha);
  g.strokePoints(flipper, true);
  // A dark leading-edge patch near the shoulder and a little mottling
  // further out - real humpback flippers are rarely pure white end to
  // end.
  g.fillStyle(flipperEdgeColor, 0.35 * alpha);
  g.fillEllipse(-30 * s, 16 * s, 8 * s, 5 * s);
  [
    [-45, 34],
    [-53, 47]
  ].forEach(([fx, fy]) => g.fillEllipse(fx * s, fy * s, 4 * s, 6 * s));
  // A few small tubercle bumps along the flipper's own leading edge.
  g.fillStyle(barnacleColor, 0.8 * alpha);
  [
    [-31, 15],
    [-42, 25],
    [-51, 37]
  ].forEach(([tx, ty]) => g.fillCircle(tx * s, ty * s, 1.3 * s));

  // Body - filled pale first so the dark dorsal band above reads as a
  // crisp, fully-opaque line, the same countershading trick as the
  // sharks use.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -55, y: -8 },
    { x: -46, y: -15 },
    { x: -32, y: -19 },
    { x: -16, y: -20 },
    { x: 0, y: -19 },
    { x: 14, y: -16 },
    { x: 26, y: -11 },
    { x: 34, y: -6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (7 + Math.sin(i * 1.1) * 2.4) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.6 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // A small, stubby, hooked dorsal fin sat on a low "hump" far back along
  // the spine - the real animal's own namesake, nowhere near the tall
  // triangular fin a shark carries.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(8 * s, -17 * s, 20 * s, -15 * s, 13 * s, -26 * s);
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(8 * s, -17 * s, 20 * s, -15 * s, 13 * s, -26 * s);

  // A row of small dorsal-ridge "knuckles" running from the fin back to
  // the tail stock - a real, genuine Humpback field mark that sets it
  // apart from the smooth-backed rorquals, not just a decorative frill.
  g.fillStyle(backColor, alpha);
  g.lineStyle(0.8 * s, darkColor, 0.5 * alpha);
  [
    [22, -13],
    [27, -10],
    [31, -7],
    [34, -4]
  ].forEach(([kx, ky]) => {
    g.fillCircle(kx * s, ky * s, 1.6 * s);
    g.strokeCircle(kx * s, ky * s, 1.6 * s);
  });

  // Ventral throat grooves - the real animal's pleated throat, a row of
  // parallel lines running from the chin back under the jaw, unlike any
  // fish or shark's smooth belly.
  g.lineStyle(1 * s, darkColor, 0.4 * alpha);
  for (let i = 0; i < 7; i += 1) {
    const gx0 = -50 + i * 5;
    g.beginPath();
    g.moveTo(gx0 * s, 5 * s);
    quadCurveTo(g, gx0 * s, 5 * s, (gx0 + 3.5) * s, 13 * s, (gx0 + 6) * s, 19 * s);
    g.strokePath();
  }

  // Knobby tubercles studding the rostrum and lower jaw - the real
  // animal's own hair-follicle bumps, unmistakable up close and unique
  // to this species in the game.
  g.fillStyle(barnacleColor, 0.85 * alpha);
  [
    [-54, -6],
    [-49, -11],
    [-42, -15],
    [-34, -18],
    [-25, -20]
  ].forEach(([bx, by]) => g.fillCircle(bx * s, by * s, 1.7 * s));
  [
    [-53, 3],
    [-47, 7],
    [-39, 10]
  ].forEach(([bx, by]) => g.fillCircle(bx * s, by * s, 1.4 * s));
  g.lineStyle(0.6 * s, darkColor, 0.5 * alpha);
  [
    [-54, -6, 1.7],
    [-49, -11, 1.7],
    [-42, -15, 1.7],
    [-34, -18, 1.7],
    [-25, -20, 1.7],
    [-53, 3, 1.4],
    [-47, 7, 1.4],
    [-39, 10, 1.4]
  ].forEach(([bx, by, br]) => g.strokeCircle(bx * s, by * s, br * s));

  // Twin blowholes on top of the head.
  g.fillStyle(darkColor, 0.8 * alpha);
  g.fillEllipse(-47 * s, -17 * s, 1.7 * s, 1 * s);
  g.fillEllipse(-43 * s, -18.5 * s, 1.7 * s, 1 * s);

  // Small, dark eye low on the head, just above the jawline.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-46 * s, -1 * s, 1.8 * s);
  g.fillStyle(0x000000, 0.8 * alpha);
  g.fillCircle(-46 * s, -1 * s, 1 * s);

  g.restore();
}

// The Kraken - not a real animal at all, unlike everything else in the
// game (even Megalodon is a real extinct species): a purely mythical
// sea monster, and drawn like nothing else here as a result - no fins,
// no gills, no shark/fish silhouette whatsoever. A bulbous, torpedo-
// finned mantle like a monstrous squid, one huge unblinking eye, a
// hooked beak, and a radiating cluster of long, curling, sucker-lined
// tentacles standing in for everything a real catch would have instead.
// Never spawns as itself - the one and only moment one can turn up is a
// Ray genuinely on the hook this deep (see OceanScene.updateSwimmers),
// swapped in at the very last instant the same way Megalodon swaps in
// for a shark.
export function drawKraken(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0x581832;
  const bodyDark = 0x330c1e;
  const finColor = 0x40122a;
  const tentacleColor = 0x4c1428;
  const tentacleDark = 0x2c0a18;
  const darkColor = 0x0a0306;
  const suckerColor = 0xe8c8b0;
  const suckerDark = 0xa87858;
  const eyeColor = 0xc8e050;
  const eyeDark = 0x7a9a20;
  const beakColor = 0x140a08;
  const mottleColor = 0x220818;

  // Traces one curling, whip-like tentacle as a proper curved ribbon - a
  // local tangent-based offset (the same technique the Squid bait uses
  // for its own curled body), not a straight radiating spike, so it
  // genuinely curls and undulates along its own length instead of just
  // bending at one joint.
  function tentacle(baseAngle, len, curlDir, wiggleFreq, phase, clubbed) {
    const steps = 16;
    const dirX = Math.sin(baseAngle);
    const dirY = Math.cos(baseAngle) * 0.55;
    const perpX = dirY;
    const perpY = -dirX;
    const spine = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const r = 16 + len * tt;
      const wave = Math.sin(tt * Math.PI * wiggleFreq + phase) * 16 * tt * curlDir;
      const curl = tt * tt * 22 * curlDir;
      spine.push({
        x: dirX * r + perpX * (wave + curl),
        y: 10 + dirY * r + perpY * (wave + curl) + tt * tt * 14
      });
    }
    const left = [];
    const right = [];
    for (let t = 0; t <= steps; t += 1) {
      const tt = t / steps;
      const p0 = spine[Math.max(0, t - 1)];
      const p1 = spine[Math.min(steps, t + 1)];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const dlen = Math.hypot(dx, dy) || 1;
      const nx = -dy / dlen;
      const ny = dx / dlen;
      let w = 4.6 - tt * 3.8;
      if (clubbed && tt > 0.8) w = 1 + (tt - 0.8) * 12;
      left.push({ x: (spine[t].x + nx * w) * s, y: (spine[t].y + ny * w) * s });
      right.push({ x: (spine[t].x - nx * w) * s, y: (spine[t].y - ny * w) * s });
    }
    const shape = left.concat(right.slice().reverse());
    g.fillStyle(tentacleColor, alpha);
    g.fillPoints(shape, true);
    g.fillStyle(tentacleDark, 0.35 * alpha);
    g.fillPoints(right.slice().reverse().concat(spine.map((p) => ({ x: p.x * s, y: p.y * s }))), true);
    g.lineStyle(0.9 * s, darkColor, 0.55 * alpha);
    g.strokePoints(shape, true);

    // Sucker dots down the inner edge, denser and bolder on the clubbed
    // tip of a feeding tentacle - a real giant squid's own field mark.
    for (let t = 2; t < steps; t += clubbed ? 1 : 2) {
      const tt = t / steps;
      const p = left[t];
      const r = clubbed && tt > 0.8 ? 1.3 : 0.9;
      g.fillStyle(suckerDark, 0.5 * alpha);
      g.fillCircle(p.x, p.y, r * 1.4 * s);
      g.fillStyle(suckerColor, 0.85 * alpha);
      g.fillCircle(p.x, p.y, r * s);
    }
  }

  // Eight shorter arms in a wide fan, curling outward in alternating
  // directions - drawn first so the mantle overlaps their base.
  const arms = [
    [-2.7, 40, -1],
    [-2.15, 46, 1],
    [-1.55, 42, -1],
    [-0.85, 38, 1],
    [0.85, 38, -1],
    [1.55, 42, 1],
    [2.15, 46, -1],
    [2.7, 40, 1]
  ];
  arms.forEach(([angle, len, curlDir], i) => tentacle(angle, len, curlDir, 1.6, i * 1.1, false));

  // Two much longer, thinner feeding tentacles with a wide clubbed tip -
  // a real giant squid's own most distinctive feature, and the reach
  // that sells this thing as genuinely huge.
  tentacle(-0.35, 78, -1, 1.1, 0.4, true);
  tentacle(0.35, 78, 1, 1.1, 2.6, true);

  // The bulbous, torpedo-finned mantle - a squid's own body shape, not a
  // fish's.
  const mantle = [
    { x: 0, y: -32 },
    { x: -14, y: -24 },
    { x: -19, y: -7 },
    { x: -15, y: 11 },
    { x: -7, y: 20 },
    { x: 0, y: 23 },
    { x: 7, y: 20 },
    { x: 15, y: 11 },
    { x: 19, y: -7 },
    { x: 14, y: -24 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // A pair of broad, wing-like fins low on the mantle - filled brighter
  // than the tentacles so they actually read as a distinct feature.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-15 * s, 2 * s, -32 * s, 12 * s, -9 * s, 18 * s);
  g.fillTriangle(15 * s, 2 * s, 32 * s, 12 * s, 9 * s, 18 * s);
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-15 * s, 2 * s, -32 * s, 12 * s, -9 * s, 18 * s);
  g.strokeTriangle(15 * s, 2 * s, 32 * s, 12 * s, 9 * s, 18 * s);

  g.fillStyle(bodyColor, alpha);
  g.fillPoints(mantle, true);

  // A darker dorsal wash and a few mottled blotches - the same skin
  // texture trick as the game's sharks, so the mantle reads as living
  // hide rather than a flat colour fill.
  g.fillStyle(bodyDark, 0.5 * alpha);
  g.fillEllipse(0, -16 * s, 30 * s, 20 * s);
  g.fillStyle(mottleColor, 0.35 * alpha);
  [
    [-9, -18, 5],
    [8, -10, 4],
    [-6, 4, 4.5],
    [10, -22, 3.5]
  ].forEach(([mx, my, mr]) => g.fillEllipse(mx * s, my * s, mr * s, mr * 0.7 * s));

  g.lineStyle(1.5 * s, darkColor, 0.85 * alpha);
  g.strokePoints(mantle, true);

  // A crown of short, jagged spines along the top of the head - a
  // monster's silhouette, not a real animal's smooth crown.
  g.fillStyle(finColor, alpha);
  [-8, -3, 3, 8].forEach((sx, i) => {
    const spineLen = i % 2 === 0 ? 9 : 12;
    g.fillTriangle(sx * s, -27 * s, (sx + 4) * s, -27 * s, (sx + 2) * s, (-27 - spineLen) * s);
  });

  // The hooked beak, at the base of the tentacles.
  g.fillStyle(beakColor, alpha);
  g.fillTriangle(-5 * s, 15 * s, 5 * s, 15 * s, 0, 26 * s);
  g.lineStyle(0.8 * s, 0x000000, 0.4 * alpha);
  g.strokeTriangle(-5 * s, 15 * s, 5 * s, 15 * s, 0, 26 * s);

  // One huge, unblinking eye - the real Kraken's own unmistakable field
  // mark, deliberately singular and centred rather than a symmetric
  // pair like every real fish here.
  g.fillStyle(darkColor, 0.6 * alpha);
  g.fillCircle(0.6 * s, -7.4 * s, 9.2 * s);
  g.fillStyle(eyeColor, alpha);
  g.fillCircle(0, -8 * s, 8.6 * s);
  g.fillStyle(eyeDark, 0.5 * alpha);
  g.fillEllipse(2.5 * s, -5 * s, 5 * s, 6 * s);
  g.lineStyle(1.3 * s, darkColor, 0.75 * alpha);
  g.strokeCircle(0, -8 * s, 8.6 * s);
  g.fillStyle(darkColor, alpha);
  g.fillEllipse(0, -8 * s, 2.4 * s, 7.6 * s);
  // A small bright glint, so the huge eye reads as wet and alive rather
  // than a flat painted disc.
  g.fillStyle(0xf0ffe0, 0.8 * alpha);
  g.fillCircle(-2.6 * s, -11.5 * s, 1.4 * s);

  g.restore();
}
