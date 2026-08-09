import Phaser from 'phaser';

export function shadeColor(color, factor) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const r = Phaser.Math.Clamp(Math.round(c.red * factor), 0, 255);
  const g = Phaser.Math.Clamp(Math.round(c.green * factor), 0, 255);
  const b = Phaser.Math.Clamp(Math.round(c.blue * factor), 0, 255);
  return Phaser.Display.Color.GetColor(r, g, b);
}

export function waveSurfaceY(x, waterlineY, t, amplitude = 5) {
  return waterlineY + Math.sin(x * 0.02 + t) * amplitude;
}

// A closed polygon for a calm, gently animated sea: a wavy top edge down to
// the bottom of the canvas.
export function buildSeaPolygon(width, height, waterlineY, t, amplitude = 5) {
  const surface = [];
  for (let x = 0; x <= width; x += 16) {
    surface.push({ x, y: waveSurfaceY(x, waterlineY, t, amplitude) });
  }
  return [...surface, { x: width, y: height }, { x: 0, y: height }];
}

// Layered glow sun, brightest at the core - no rays.
export function drawSunGlow(g, cx, cy) {
  g.fillStyle(0xffcc33, 0.2);
  g.fillCircle(cx, cy, 62);
  g.fillStyle(0xffd24d, 0.35);
  g.fillCircle(cx, cy, 48);
  g.fillStyle(0xffe97a, 1);
  g.fillCircle(cx, cy, 34);
  g.fillStyle(0xfff6cf, 1);
  g.fillCircle(cx, cy, 22);
}

// Simple rowboat hull: flat gunwale top, smooth rounded bottom, symmetric
// about local x=0 so it can sit flush with the left screen edge with only
// its right half ever needing to be on screen.
export function drawBoatHull(g, { halfWidth = 160, topY = -20, bottomY = 60 } = {}) {
  const hull = [];
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = t * Math.PI;
    hull.push({
      x: halfWidth * Math.cos(angle),
      y: topY + (bottomY - topY) * Math.sin(angle)
    });
  }

  g.fillStyle(0x9a9a9a, 1);
  g.fillPoints(hull, true);
  g.lineStyle(3, 0x555555, 1);
  g.beginPath();
  hull.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
  g.strokePath();

  g.lineStyle(4, 0x6b6b6b, 1);
  g.beginPath();
  g.moveTo(-halfWidth, topY);
  g.lineTo(halfWidth, topY);
  g.strokePath();
}
