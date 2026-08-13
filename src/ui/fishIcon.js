import { label } from './textStyle.js';

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
