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
