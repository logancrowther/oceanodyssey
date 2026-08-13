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

// A salmon - a streamlined torpedo-shaped body (not a flat bottom-dweller
// like the Flathead), a forked tail, a triangular dorsal fin, and the small
// fleshy adipose fin between the dorsal and the tail that marks it as a
// salmonid. Silvery sides with a dark blue-green back (real countershading,
// not a flat single tone) and a scatter of small dark spots along the back
// and tail, like an ocean-phase salmon.
export function drawSalmon(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const bodyColor = 0xc3d3d8;
  const backColor = 0x35586b;
  const bellyColor = 0xf1f5f2;
  const finColor = 0x7f97a0;
  const darkColor = 0x223640;
  const spotColor = 0x24404c;

  const body = [
    { x: -34, y: 0 },
    { x: -31, y: -3 },
    { x: -24, y: -6 },
    { x: -12, y: -9 },
    { x: 0, y: -10 },
    { x: 12, y: -9 },
    { x: 22, y: -6 },
    { x: 28, y: -3 },
    { x: 28, y: 3 },
    { x: 22, y: 6 },
    { x: 12, y: 9 },
    { x: 0, y: 10 },
    { x: -12, y: 9 },
    { x: -24, y: 6 },
    { x: -31, y: 3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Forked tail, out past the caudal peduncle - a moderate fork, not the
  // deep scythe of a tuna.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(28 * s, -3 * s, 44 * s, -11 * s, 35 * s, 0);
  g.fillTriangle(28 * s, 3 * s, 44 * s, 11 * s, 35 * s, 0);
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(28 * s, -3 * s, 44 * s, -11 * s, 35 * s, 0);
  g.strokeTriangle(28 * s, 3 * s, 44 * s, 11 * s, 35 * s, 0);

  // Pectoral, pelvic and anal fins - small and swept back, well below the
  // dorsal fin's size.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-16 * s, 4 * s, -24 * s, 13 * s, -12 * s, 7 * s);
  g.fillTriangle(-4 * s, 9 * s, -8 * s, 17 * s, 3 * s, 10 * s);
  g.fillTriangle(16 * s, 6 * s, 20 * s, 13 * s, 24 * s, 7 * s);

  // Body.
  g.fillStyle(bodyColor, alpha);
  g.fillPoints(body, true);

  // Dark blue-green back, banded along the top of the body's own profile -
  // real countershading, dark on top fading toward a pale belly, instead of
  // one flat body tone.
  const topProfile = [
    { x: -31, y: -3 },
    { x: -24, y: -6 },
    { x: -12, y: -9 },
    { x: 0, y: -10 },
    { x: 12, y: -9 },
    { x: 22, y: -6 },
    { x: 28, y: -3 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p) => ({ x: p.x, y: p.y + 7 * s }))
  );
  g.fillStyle(backColor, 0.85 * alpha);
  g.fillPoints(backBand, true);

  // Pale belly strip along the bottom edge.
  const bottomProfile = [
    { x: -24, y: 6 },
    { x: -12, y: 9 },
    { x: 0, y: 10 },
    { x: 12, y: 9 },
    { x: 22, y: 6 }
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

  // Dorsal fin, a simple triangular sail on the back.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-4 * s, -9.5 * s, 6 * s, -9 * s, 1 * s, -22 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-4 * s, -9.5 * s, 6 * s, -9 * s, 1 * s, -22 * s);

  // Adipose fin - the small fleshy fin between the dorsal and the tail that
  // marks this as a salmonid rather than just any fish.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(16 * s, -7 * s, 21 * s, -6 * s, 18.5 * s, -13 * s);

  // Scattered dark spots along the back and tail, like a real salmon.
  g.fillStyle(spotColor, 0.8 * alpha);
  [
    [-14, -6, 1.1],
    [-4, -7.5, 1.2],
    [6, -6.5, 1],
    [14, -5.5, 1],
    [20, -4.5, 0.9],
    [32, -5, 0.9],
    [30, 3, 0.8]
  ].forEach(([sx, sy, sr]) => g.fillCircle(sx * s, sy * s, sr * s));

  // Gill line, marking the gill cover just behind the head.
  g.lineStyle(1 * s, darkColor, 0.5 * alpha);
  g.beginPath();
  g.moveTo(-21 * s, -6 * s);
  g.lineTo(-19 * s, 6 * s);
  g.strokePath();

  // Eye, set laterally at a normal height - not high-set/froglike like the
  // Flathead's.
  g.fillStyle(0xeef3f4, alpha);
  g.fillCircle(-27 * s, -2 * s, 2.4 * s);
  g.fillStyle(0x131a1c, alpha);
  g.fillCircle(-26.6 * s, -2 * s, 1.3 * s);

  g.restore();
}

// A mullet - a stouter, more cylindrical body than the Salmon's, with a
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

  // Blunter, more rounded head than the Salmon's pointed one, and a
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
  // first dorsal and the smaller soft second dorsal - unlike the Salmon's
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
// torpedo like the Salmon/Mullet), a steep sloped forehead, one long
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
// Salmon's, not laterally compressed like the Bream's), a tall curved
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

// A bull shark - shorter and far stockier than either other shark, with a
// very short, blunt, flat-fronted snout (no point at all, unlike the Great
// White's fine tip or even the Tiger Shark's own wide nose - the real
// animal's own "bull-nosed" field mark), a noticeably heavier girth
// relative to its length, small eyes set for hunting in the murky, shallow
// water this species actually prefers, and a lower, more rounded first
// dorsal fin set further forward on the back. Plain grey-brown
// countershading with no stripes and none of the Great White's crisp
// two-tone - just a flat, murky grey back fading to a pale belly.
export function drawBullShark(g, x, y, scale = 1, rotation = 0, alpha = 1) {
  g.save();
  g.translateCanvas(x, y);
  if (rotation) g.rotateCanvas(rotation);
  const s = scale;

  const backColor = 0x5e5a4c;
  const bellyColor = 0xefe9da;
  const finColor = 0x5e5a4c;
  const darkColor = 0x1c1a14;
  const toothColor = 0xf5f5f0;

  // A short, thickset, heavyset body - the front edge is a flat vertical
  // pair of points instead of a single pointed vertex, which is what reads
  // as a blunt, rounded-off snout rather than any kind of point.
  const body = [
    { x: -29, y: -6 },
    { x: -20, y: -12 },
    { x: -6, y: -16 },
    { x: 8, y: -16 },
    { x: 19, y: -13 },
    { x: 27, y: -9 },
    { x: 33, y: -4 },
    { x: 33, y: 4 },
    { x: 27, y: 9 },
    { x: 19, y: 13 },
    { x: 8, y: 16 },
    { x: -6, y: 16 },
    { x: -20, y: 12 },
    { x: -29, y: 6 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));

  // Heterocercal tail - same real-shark construction as the other two,
  // scaled to this shorter body.
  [
    { angle: -0.8, bow: 13, len: 27, baseY: -3, w: 6 },
    { angle: 0.56, bow: -7, len: 12, baseY: 3, w: 4.6 }
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

  // Broad, stiff pectoral fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-8 * s, 9 * s, -16 * s, 25 * s, 3 * s, 13 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(-8 * s, 9 * s, -16 * s, 25 * s, 3 * s, 13 * s);

  // Pelvic and small second dorsal/anal fins.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(11 * s, 14 * s, 8 * s, 21 * s, 19 * s, 14 * s);
  g.fillTriangle(21 * s, -11 * s, 26 * s, -10 * s, 23 * s, -17 * s);
  g.lineStyle(1 * s, darkColor, 0.6 * alpha);
  g.strokeTriangle(21 * s, -11 * s, 26 * s, -10 * s, 23 * s, -17 * s);

  // Body - solid pale base, then a plain, flat grey-brown back band with no
  // stripes - just a murky-water countershading tone, unlike either other
  // shark's own marking.
  g.fillStyle(bellyColor, alpha);
  g.fillPoints(body, true);

  const topProfile = [
    { x: -29, y: -6 },
    { x: -20, y: -12 },
    { x: -6, y: -16 },
    { x: 8, y: -16 },
    { x: 19, y: -13 },
    { x: 27, y: -9 },
    { x: 33, y: -4 }
  ].map((p) => ({ x: p.x * s, y: p.y * s }));
  const backBand = topProfile.concat(
    topProfile
      .slice()
      .reverse()
      .map((p, i) => ({ x: p.x, y: p.y + (4 + Math.sin(i * 1.2) * 1.4) * s }))
  );
  g.fillStyle(backColor, alpha);
  g.fillPoints(backBand, true);

  g.lineStyle(1.5 * s, darkColor, 0.85 * alpha);
  g.strokePoints(body, true);

  // A lower, more rounded, more forward-set first dorsal fin than either
  // other shark's - real bull sharks carry a broader, less towering fin set
  // further up the back toward the head.
  g.fillStyle(finColor, alpha);
  g.fillTriangle(-12 * s, -15 * s, 5 * s, -14 * s, -4 * s, -29 * s);
  g.lineStyle(1.3 * s, darkColor, 0.7 * alpha);
  g.strokeTriangle(-12 * s, -15 * s, 5 * s, -14 * s, -4 * s, -29 * s);

  // Gill slits.
  g.lineStyle(1.1 * s, darkColor, 0.6 * alpha);
  for (let i = 0; i < 5; i += 1) {
    const gx = -22 + i * 2.4;
    g.beginPath();
    g.moveTo(gx * s, -11 * s);
    g.lineTo((gx - 1.4) * s, 10 * s);
    g.strokePath();
  }

  // A wide, blunt jaw with a dense row of teeth - a real bull shark's own
  // powerful bite.
  g.lineStyle(1 * s, darkColor, 0.7 * alpha);
  g.beginPath();
  g.moveTo(-28 * s, 3 * s);
  g.lineTo(-15 * s, 8 * s);
  g.strokePath();
  g.fillStyle(toothColor, alpha);
  for (let i = 0; i < 5; i += 1) {
    const tx = -27 + i * 2.6;
    g.fillTriangle(tx * s, 3.5 * s, (tx + 2) * s, 4.8 * s, (tx + 0.8) * s, 8 * s);
  }

  // Small, dark, watchful eyes - noticeably smaller than either the Great
  // White's or the Tiger Shark's own eye, a real hunter-in-murky-water trait.
  g.fillStyle(darkColor, alpha);
  g.fillCircle(-21 * s, -8 * s, 1.5 * s);
  g.fillStyle(0x000000, 0.85 * alpha);
  g.fillCircle(-21 * s, -8 * s, 0.8 * s);

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
