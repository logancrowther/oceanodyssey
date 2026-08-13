import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import OceanScene from './scenes/OceanScene.js';
import ShopScene from './scenes/ShopScene.js';
import InventoryScene from './scenes/InventoryScene.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from './constants.js';

// Phaser's Scale Manager has no working option to render the canvas at a
// higher pixel density than its CSS size (verified against the installed
// Phaser 3.90 source - the old `resolution` config is a no-op). Since
// Scale.ENVELOP stretches the canvas to cover the whole browser window, a
// 960x600 buffer gets visibly blurred when CSS-upscaled on anything bigger
// than that. So the actual game/buffer size here is boosted by RES_MULT,
// and every scene zooms its camera by the same factor in its create() -
// all existing 960x600-based positions keep working unchanged, just
// rendered at higher real resolution.
const RES_MULT = Math.max(2, window.devicePixelRatio || 1);

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#04263b',
  scale: {
    // ENVELOP scales to cover the whole window edge to edge (no letterbox
    // bars), cropping whatever overflows on wider/taller screens instead of
    // shrinking to fit within them.
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DESIGN_WIDTH * RES_MULT,
    height: DESIGN_HEIGHT * RES_MULT
  },
  scene: [BootScene, TitleScene, OceanScene, ShopScene, InventoryScene]
};

new Phaser.Game(config);
