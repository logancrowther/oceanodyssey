import Phaser from 'phaser';

function shade(color, factor) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  const r = Phaser.Math.Clamp(Math.round(c.red * factor), 0, 255);
  const g = Phaser.Math.Clamp(Math.round(c.green * factor), 0, 255);
  const b = Phaser.Math.Clamp(Math.round(c.blue * factor), 0, 255);
  return Phaser.Display.Color.GetColor(r, g, b);
}

// A plain flat button: rounded rect, solid fill, thin border. Hover
// brightens it slightly; that's the only state change - no depth, no press
// animation, no shadow.
export function createButton(scene, x, y, width, height, label, onClick, opts = {}) {
  const baseColor = opts.color ?? 0x1f6f8b;
  const textColor = opts.textColor ?? '#ffffff';
  const fontSize = opts.fontSize ?? '18px';
  const disabledColor = 0x33424a;
  const radius = Math.min(height * 0.32, width * 0.2, 12);
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
    const fillColor = enabled && hovered ? shade(base, 1.18) : base;

    g.clear();
    g.fillStyle(fillColor, 1);
    g.fillRoundedRect(-halfW, -halfH, width, height, radius);
    g.lineStyle(2, 0x0c2430, enabled ? 0.55 : 0.3);
    g.strokeRoundedRect(-halfW, -halfH, width, height, radius);

    text.setAlpha(enabled ? 1 : 0.6);
  }

  const hitZone = scene.add.zone(0, 0, width, height).setOrigin(0.5);
  container.add(hitZone);
  hitZone.setInteractive({ useHandCursor: true });

  // Reparent into a caller-supplied container (e.g. a scrollable list) - the
  // button keeps its own x/y, which then read as relative to that
  // container's transform instead of the scene's, so it scrolls/moves along
  // with the rest of that container's contents.
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
