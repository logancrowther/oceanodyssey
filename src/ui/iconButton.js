import Phaser from 'phaser';

function shade(color, factor) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const r = Phaser.Math.Clamp(Math.round(c.red * factor), 0, 255);
  const g = Phaser.Math.Clamp(Math.round(c.green * factor), 0, 255);
  const b = Phaser.Math.Clamp(Math.round(c.blue * factor), 0, 255);
  return Phaser.Display.Color.GetColor(r, g, b);
}

// A small round icon button - same flat, no-3D language as Button.js, just
// circular and driven by a caller-supplied icon-drawing callback instead of
// a text label.
export function createIconButton(scene, x, y, radius, drawIcon, onClick, opts = {}) {
  const baseColor = opts.color ?? 0x1f6f8b;
  const disabledColor = 0x33424a;
  const container = scene.add.container(x, y);

  const g = scene.add.graphics();
  container.add(g);

  const iconG = scene.add.graphics();
  container.add(iconG);
  drawIcon(iconG, radius);

  let hovered = false;
  let enabled = true;

  function redraw() {
    const base = enabled ? baseColor : disabledColor;
    const fillColor = enabled && hovered ? shade(base, 1.18) : base;
    g.clear();
    g.fillStyle(fillColor, 1);
    g.fillCircle(0, 0, radius);
    g.lineStyle(2, 0x0c2430, enabled ? 0.55 : 0.3);
    g.strokeCircle(0, 0, radius);
    iconG.setAlpha(enabled ? 1 : 0.5);
  }

  const hitZone = scene.add.zone(0, 0, radius * 2, radius * 2).setOrigin(0.5);
  container.add(hitZone);
  hitZone.setInteractive({ useHandCursor: true });
  hitZone.on('pointerover', () => {
    hovered = true;
    redraw();
  });
  hitZone.on('pointerout', () => {
    hovered = false;
    redraw();
  });
  hitZone.on('pointerdown', () => {
    if (enabled) onClick();
  });

  redraw();

  return {
    setEnabled(value) {
      enabled = value;
      redraw();
    },
    destroy() {
      container.destroy();
    }
  };
}

export function drawShopIcon(g, radius) {
  const s = radius / 20;
  g.fillStyle(0xffe17d, 1);
  g.fillCircle(-3 * s, 3 * s, 8 * s);
  g.fillCircle(4 * s, -4 * s, 8 * s);
  g.lineStyle(1.4 * s, 0x8a6a1a, 0.8);
  g.strokeCircle(-3 * s, 3 * s, 8 * s);
  g.strokeCircle(4 * s, -4 * s, 8 * s);
}

export function drawBagIcon(g, radius) {
  const s = radius / 20;
  const bodyPoints = [
    { x: -9 * s, y: -2 * s },
    { x: 9 * s, y: -2 * s },
    { x: 7 * s, y: 12 * s },
    { x: -7 * s, y: 12 * s }
  ];
  g.fillStyle(0xd9b98a, 1);
  g.fillPoints(bodyPoints, true);
  g.lineStyle(1.4 * s, 0x8a6a45, 0.8);
  g.strokePoints(bodyPoints, true);
  g.lineStyle(1.6 * s, 0x8a6a45, 1);
  g.beginPath();
  g.arc(0, -2 * s, 5 * s, Math.PI, 0, false);
  g.strokePath();
}
