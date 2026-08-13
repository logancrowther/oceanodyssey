import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { createBubbleButton } from '../ui/BubbleButton.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { shadeColor, buildSeaPolygon, drawSunGlow } from '../ui/oceanArt.js';
import { heading, subheading } from '../ui/textStyle.js';

const WATERLINE_Y = 340;
const SKY_COLOR = 0x9fd9f0;
const WATER_COLOR = 0x3fa9e0;

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    // The game canvas renders at a higher pixel density than the design
    // space (see main.js) - zooming the camera to match means every
    // position below can stay in plain 960x600 coordinates.
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    this.waveT = 0;

    // Same sunny-day sky gradient and calm, animated sea OceanScene's dive
    // transition starts from, so pressing Play reads as diving straight
    // into this same water.
    const skyTop = shadeColor(SKY_COLOR, 0.85);
    const skyBottom = shadeColor(SKY_COLOR, 1.2);
    const skyG = this.add.graphics();
    skyG.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
    skyG.fillRect(0, 0, width, height);

    this.seaGraphics = this.add.graphics();
    this.renderSea(0);

    drawSunGlow(this.add.graphics(), 800, 110);

    this.add
      .text(width / 2, 220, 'Ocean Odyssey', heading('56px', { strokeThickness: 6 }))
      .setOrigin(0.5);

    this.add
      .text(width / 2, 274, 'Cast your line. Chart the seas.', subheading())
      .setOrigin(0.5);

    createBubbleButton(
      this,
      width / 2,
      height * 0.72,
      220,
      60,
      'Play',
      () => {
        this.scene.start('OceanScene');
      },
      { fontSize: '24px' }
    );

    this.buildWipeDataButton(width, height);
  }

  // Tucked in the bottom right, well away from Play - resets coins,
  // inventory and catches back to a fresh save. Destructive, so it takes a
  // second confirming tap within a few seconds rather than wiping on the
  // very first click.
  buildWipeDataButton(width, height) {
    let confirming = false;
    let confirmTimer = null;

    const btn = createBubbleButton(
      this,
      width - 100,
      height - 30,
      170,
      38,
      'Wipe Data',
      () => {
        if (!confirming) {
          confirming = true;
          btn.setLabel('Tap to confirm');
          confirmTimer = this.time.delayedCall(2500, () => {
            confirming = false;
            btn.setLabel('Wipe Data');
          });
          return;
        }
        if (confirmTimer) confirmTimer.remove(false);
        confirming = false;
        GameState.wipe();
        btn.setLabel('Data wiped');
        this.time.delayedCall(1200, () => btn.setLabel('Wipe Data'));
      },
      { fontSize: '13px', color: 0xb84a4a }
    );
  }

  renderSea(t) {
    const g = this.seaGraphics;
    g.clear();
    g.fillStyle(WATER_COLOR, 1);
    g.fillPoints(buildSeaPolygon(DESIGN_WIDTH, DESIGN_HEIGHT, WATERLINE_Y, t), true);
  }

  update(time, delta) {
    this.waveT += delta * 0.001;
    this.renderSea(this.waveT);
  }
}
