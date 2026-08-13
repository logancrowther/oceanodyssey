import Phaser from 'phaser';

function shade(color, factor) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const r = Phaser.Math.Clamp(Math.round(c.red * factor), 0, 255);
  const g = Phaser.Math.Clamp(Math.round(c.green * factor), 0, 255);
  const b = Phaser.Math.Clamp(Math.round(c.blue * factor), 0, 255);
  return Phaser.Display.Color.GetColor(r, g, b);
}

// A small round icon "bubble" - a glassy gradient fill, bright rim and a
// glint highlight, matching createBubbleButton's look - driven by a
// caller-supplied icon-drawing callback instead of a text label.
export function createIconButton(scene, x, y, radius, drawIcon, onClick, opts = {}) {
  const baseColor = opts.color ?? 0x4fb8e8;
  const disabledColor = 0x4a5b63;
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
    const top = shade(base, hovered && enabled ? 1.5 : 1.3);
    const bottom = shade(base, hovered && enabled ? 0.85 : 0.75);
    g.clear();
    g.fillGradientStyle(top, top, bottom, bottom, enabled ? 0.62 : 0.4);
    g.fillCircle(0, 0, radius);
    g.lineStyle(1.6, 0xf2fbff, enabled ? (hovered ? 0.85 : 0.6) : 0.3);
    g.strokeCircle(0, 0, radius);
    g.fillStyle(0xffffff, enabled ? (hovered ? 0.5 : 0.35) : 0.15);
    g.fillEllipse(-radius * 0.4, -radius * 0.4, radius * 0.6, radius * 0.7);
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

// A plain X - two crossing strokes - for a close/exit button.
export function drawCloseIcon(g, radius) {
  const s = radius / 20;
  g.lineStyle(2.4 * s, 0xdce8f0, 1);
  g.beginPath();
  g.moveTo(-7 * s, -7 * s);
  g.lineTo(7 * s, 7 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(7 * s, -7 * s);
  g.lineTo(-7 * s, 7 * s);
  g.strokePath();
}

// A shopping cart - basket outline with a couple of wire lines, a handle,
// and two wheels - instead of a plain coin pair.
export function drawShopIcon(g, radius) {
  const s = radius / 20;
  const cartColor = 0xdce8f0;
  const wheelColor = 0x1c2a33;

  // Basket, a trapezoid outline.
  g.lineStyle(1.6 * s, cartColor, 1);
  g.beginPath();
  g.moveTo(-9 * s, -8 * s);
  g.lineTo(9 * s, -8 * s);
  g.lineTo(6 * s, 4 * s);
  g.lineTo(-6 * s, 4 * s);
  g.closePath();
  g.strokePath();

  // A wire line across the basket for a cart-mesh look.
  g.lineStyle(1 * s, cartColor, 0.85);
  g.beginPath();
  g.moveTo(-8 * s, -3 * s);
  g.lineTo(7.5 * s, -3 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(-1 * s, -8 * s);
  g.lineTo(-2 * s, 4 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(3 * s, -8 * s);
  g.lineTo(1.5 * s, 4 * s);
  g.strokePath();

  // Handle, angling up and out from the basket's top-left corner.
  g.lineStyle(1.6 * s, cartColor, 1);
  g.beginPath();
  g.moveTo(-9 * s, -8 * s);
  g.lineTo(-12 * s, -13 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(-14 * s, -13 * s);
  g.lineTo(-11 * s, -13 * s);
  g.strokePath();

  // Wheels.
  g.fillStyle(wheelColor, 1);
  g.fillCircle(-4 * s, 8 * s, 2 * s);
  g.fillCircle(4 * s, 8 * s, 2 * s);
  g.lineStyle(1 * s, cartColor, 0.9);
  g.strokeCircle(-4 * s, 8 * s, 2 * s);
  g.strokeCircle(4 * s, 8 * s, 2 * s);
}

// A backpack - main body, front pocket, a top flap, shoulder straps and a
// little buckle - instead of a plain pouch trapezoid.
export function drawBagIcon(g, radius) {
  const s = radius / 20;
  const bodyColor = 0xd9b98a;
  const pocketColor = 0xc4a578;
  const strapColor = 0x8a6a45;

  // Shoulder straps, drawn first so the body overlaps their top ends.
  g.lineStyle(2 * s, strapColor, 1);
  g.beginPath();
  g.moveTo(-5 * s, -9 * s);
  g.lineTo(-6.5 * s, -15 * s);
  g.strokePath();
  g.beginPath();
  g.moveTo(5 * s, -9 * s);
  g.lineTo(6.5 * s, -15 * s);
  g.strokePath();

  // Top flap.
  g.fillStyle(pocketColor, 1);
  g.fillRoundedRect(-8 * s, -10 * s, 16 * s, 7 * s, 3 * s);
  g.lineStyle(1 * s, strapColor, 0.7);
  g.strokeRoundedRect(-8 * s, -10 * s, 16 * s, 7 * s, 3 * s);

  // Main body.
  g.fillStyle(bodyColor, 1);
  g.fillRoundedRect(-9 * s, -6 * s, 18 * s, 18 * s, 4 * s);
  g.lineStyle(1.3 * s, strapColor, 0.85);
  g.strokeRoundedRect(-9 * s, -6 * s, 18 * s, 18 * s, 4 * s);

  // Front pocket.
  g.fillStyle(pocketColor, 1);
  g.fillRoundedRect(-6 * s, 2 * s, 12 * s, 8 * s, 2.5 * s);
  g.lineStyle(1 * s, strapColor, 0.7);
  g.strokeRoundedRect(-6 * s, 2 * s, 12 * s, 8 * s, 2.5 * s);

  // Small buckle on the pocket.
  g.fillStyle(strapColor, 1);
  g.fillCircle(0, 6 * s, 1.2 * s);
}
