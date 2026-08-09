import Phaser from 'phaser';

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
export function drawPrawn(g, x, y, scale = 1, rotation = 0) {
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
    g.fillStyle(i % 2 === 0 ? bodyColor : darkColor, 1);
    g.fillPoints(quad, true);
    g.lineStyle(1 * s, shellLine, 0.6);
    g.strokePoints([quad[0], quad[1]], false);
  }

  // Head - a rounded blob with a small pointed rostrum and a dark eye dot.
  const head = spine[0];
  g.fillStyle(bodyColor, 1);
  g.fillCircle(head.x, head.y, 7 * s);
  g.fillTriangle(
    head.x - 8 * s, head.y - 2 * s,
    head.x - 8 * s, head.y + 2 * s,
    head.x - 14 * s, head.y
  );
  g.fillStyle(0x2a1a16, 1);
  g.fillCircle(head.x - 2 * s, head.y - 2 * s, 1.4 * s);

  // Thin trailing antennae.
  g.lineStyle(1 * s, darkColor, 0.8);
  g.beginPath();
  g.moveTo(head.x - 6 * s, head.y - 3 * s);
  g.lineTo(head.x - 20 * s, head.y - 10 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(head.x - 6 * s, head.y + 3 * s);
  g.lineTo(head.x - 18 * s, head.y + 9 * s);
  g.strokePath();

  // Small legs along the inner curve of the body.
  g.lineStyle(0.8 * s, darkColor, 0.7);
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
  g.fillStyle(darkColor, 1);
  g.fillTriangle(
    tail.x, tail.y,
    tail.x + tux * 8 * s + tpx * 5 * s, tail.y + tuy * 8 * s + tpy * 5 * s,
    tail.x + tux * 8 * s - tpx * 5 * s, tail.y + tuy * 8 * s - tpy * 5 * s
  );

  g.restore();
}

// A flathead fish - the distinctive silhouette is a flat, low-profile head
// (eyes set high, almost froglike) with the body's dorsal hump rising up
// right behind it, tapering back to the tail - not a generic fish-emoji
// blob. Sandy/olive with darker mottled camouflage, matching a real
// bottom-dweller's coloring.
export function drawFlathead(g, x, y, scale = 1, rotation = 0) {
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
  g.fillStyle(finColor, 1);
  g.fillTriangle(27 * s, -3 * s, 27 * s, 3 * s, 40 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7);
  g.strokeTriangle(27 * s, -3 * s, 27 * s, 3 * s, 40 * s, 0);

  // Pectoral fin, just behind the head.
  g.fillStyle(finColor, 1);
  g.fillTriangle(-6 * s, 4 * s, -14 * s, 14 * s, -2 * s, 8 * s);

  // Body.
  g.fillStyle(baseColor, 1);
  g.fillPoints(body, true);
  g.lineStyle(1.4 * s, darkColor, 0.8);
  g.strokePoints(body, true);

  // Mottled camouflage blotches - a bottom-dweller's sandy pattern.
  g.fillStyle(darkColor, 0.55);
  [
    [-14, -4, 4],
    [-2, -6, 3.5],
    [8, -3, 3],
    [-8, 3, 3],
    [4, 4, 2.6]
  ].forEach(([bx, by, br]) => g.fillEllipse(bx * s, by * s, br * 2 * s, br * 1.3 * s));

  // Eye, set high on the flat head - flathead eyes sit almost on top,
  // froglike, not on the side like most fish.
  g.fillStyle(0xf2e6c8, 1);
  g.fillCircle(-21 * s, -6 * s, 2.6 * s);
  g.fillStyle(0x201510, 1);
  g.fillCircle(-20.5 * s, -6 * s, 1.4 * s);

  g.restore();
}
