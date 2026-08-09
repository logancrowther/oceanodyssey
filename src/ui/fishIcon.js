import { label } from './textStyle.js';

// A small flag planted at a chosen map point: a pole and a plain red
// triangular pennant - no icon on it, just a clean flag shape.
export function drawFlagMarker(scene, x, y) {
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();

  g.lineStyle(3, 0x3a2a1a, 1);
  g.beginPath();
  g.moveTo(0, 2);
  g.lineTo(0, -30);
  g.strokePath();
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(0, 3, 12, 4);

  const flagColor = 0xd6392c;
  const flagShadow = 0x9c281f;
  g.fillStyle(flagColor, 1);
  g.fillTriangle(0, -30, 26, -23, 0, -16);
  g.lineStyle(1.5, flagShadow, 0.9);
  g.strokeTriangle(0, -30, 26, -23, 0, -16);

  container.add(g);
  return container;
}

export function addStatusBar(scene, gameState, opts = {}) {
  const coinColor = opts.coinColor ?? '#ffe17d';

  // Kept well inset from the corner - the game canvas now covers the whole
  // browser window (Scale.ENVELOP) and crops whatever overflows, so on a
  // browser window proportioned much wider than the design's 960x600 (an
  // ultrawide monitor with a shortish window, say), a real chunk of the top
  // edge (and bottom, symmetrically) gets cropped off. y=92 clears that even
  // out to a ~2.3:1 window aspect, well past a typical 16:9.
  const coinText = scene.add.text(34, 92, '', label('18px', { color: coinColor }));

  function refresh() {
    coinText.setText(`Coins: ${gameState.coins}`);
  }

  refresh();
  return { refresh };
}
