import Phaser from 'phaser';

function shade(color, factor) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const r = Phaser.Math.Clamp(Math.round(c.red * factor), 0, 255);
  const g = Phaser.Math.Clamp(Math.round(c.green * factor), 0, 255);
  const b = Phaser.Math.Clamp(Math.round(c.blue * factor), 0, 255);
  return Phaser.Display.Color.GetColor(r, g, b);
}

// A translucent glassy "bubble" pill: soft vertical gradient fill, a bright
// thin rim, and a small glint highlight near the top-left - reads as a
// bubble/water-droplet instead of a flat rectangle, to match the underwater
// setting. Same call shape as createButton (Button.js) so it's a drop-in
// swap: same opts (color/textColor/fontSize/disabled/container) and the
// same returned api (setLabel/setEnabled/destroy).
export function createBubbleButton(scene, x, y, width, height, label, onClick, opts = {}) {
  const baseColor = opts.color ?? 0x4fb8e8;
  const textColor = opts.textColor ?? '#ffffff';
  const fontSize = opts.fontSize ?? '18px';
  const disabledColor = 0x4a5b63;
  const radius = height / 2;
  const halfW = width / 2;
  const halfH = height / 2;

  const container = scene.add.container(x, y);

  const g = scene.add.graphics();
  container.add(g);

  const text = scene.add
    .text(0, 0, label, {
      fontSize,
      color: textColor,
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontStyle: 'bold'
    })
    .setOrigin(0.5);
  container.add(text);

  let enabled = opts.disabled !== true;
  let hovered = false;

  function redraw() {
    const base = enabled ? baseColor : disabledColor;
    const top = shade(base, hovered && enabled ? 1.5 : 1.3);
    const bottom = shade(base, hovered && enabled ? 0.85 : 0.75);
    const fillAlpha = enabled ? 0.62 : 0.4;

    g.clear();

    // Soft glassy body.
    g.fillGradientStyle(top, top, bottom, bottom, fillAlpha);
    g.fillRoundedRect(-halfW, -halfH, width, height, radius);

    // Bright thin rim.
    g.lineStyle(1.6, 0xf2fbff, enabled ? (hovered ? 0.85 : 0.6) : 0.3);
    g.strokeRoundedRect(-halfW, -halfH, width, height, radius);

    // A small glint near the top-left, like light catching a bubble's
    // surface - the detail that reads as "bubble" rather than "rectangle".
    g.fillStyle(0xffffff, enabled ? (hovered ? 0.5 : 0.35) : 0.15);
    g.fillEllipse(-halfW * 0.45, -halfH * 0.45, width * 0.28, height * 0.32);

    text.setAlpha(enabled ? 1 : 0.6);
  }

  const hitZone = scene.add.zone(0, 0, width, height).setOrigin(0.5);
  container.add(hitZone);
  hitZone.setInteractive({ useHandCursor: true });

  if (opts.container) opts.container.add(container);

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

  const api = {
    setLabel(newLabel) {
      text.setText(newLabel);
    },
    setEnabled(value) {
      enabled = value;
      redraw();
    },
    destroy() {
      container.destroy();
    }
  };

  redraw();
  return api;
}
