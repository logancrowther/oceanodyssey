import Phaser from 'phaser';
import { createButton } from '../ui/Button.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { shadeColor, buildSeaPolygon, drawSunGlow, drawBoatHull } from '../ui/oceanArt.js';
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

    // Same sunny-day sky gradient and calm, animated sea as the fishing view.
    const skyTop = shadeColor(SKY_COLOR, 0.85);
    const skyBottom = shadeColor(SKY_COLOR, 1.2);
    const skyG = this.add.graphics();
    skyG.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
    skyG.fillRect(0, 0, width, height);

    this.seaGraphics = this.add.graphics();
    this.renderSea(0);

    drawSunGlow(this.add.graphics(), 800, 110);

    this.drawBoatAndCaptain();

    this.add
      .text(width / 2, 150, 'Ocean Odyssey', heading('56px', { strokeThickness: 6 }))
      .setOrigin(0.5);

    this.add
      .text(width / 2, 204, 'Cast your line. Chart the seas.', subheading())
      .setOrigin(0.5);

    createButton(this, width / 2, height * 0.72, 220, 60, 'Play', () => {
      this.scene.start('WorldMapScene');
    }, { fontSize: '24px' });
  }

  renderSea(t) {
    const g = this.seaGraphics;
    g.clear();
    g.fillStyle(WATER_COLOR, 1);
    g.fillPoints(buildSeaPolygon(DESIGN_WIDTH, DESIGN_HEIGHT, WATERLINE_Y, t), true);
  }

  // The same boat as the fishing view, but with the captain standing up and
  // pointing out at the horizon instead of seated and casting - no rod, reel
  // or handle here.
  drawBoatAndCaptain() {
    const originX = 0;
    const originY = WATERLINE_Y;
    const scale = 1.3;
    const container = this.add.container(originX, originY);
    container.setScale(scale);
    this.boatContainer = container;
    this.boatBaseY = originY;

    // Body drawn before the hull, so the hull hides everything below the
    // gunwale line - the captain reads as standing inside the boat.
    const bodyG = this.add.graphics();
    container.add(bodyG);

    const black = 0x1a1a1a;
    const lineWidth = 6;
    const hip = { x: 58, y: -5 };
    const neck = { x: 62, y: -69 };
    const shoulder = { x: 62, y: -63 };
    const headRadius = 20;
    const head = { x: neck.x, y: neck.y - headRadius };

    bodyG.lineStyle(lineWidth, black, 1);

    // Torso.
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(neck.x, neck.y);
    bodyG.strokePath();

    // Legs, standing straight, feet planted on the boat's floor.
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(48, 10);
    bodyG.lineTo(46, 26);
    bodyG.strokePath();
    bodyG.beginPath();
    bodyG.moveTo(hip.x, hip.y);
    bodyG.lineTo(70, 10);
    bodyG.lineTo(70, 26);
    bodyG.strokePath();

    // Resting arm, swung out and down at the side - away from the torso, so
    // it reads as a separate limb instead of overlapping it.
    bodyG.lineStyle(lineWidth, black, 1);
    bodyG.beginPath();
    bodyG.moveTo(shoulder.x, shoulder.y);
    bodyG.lineTo(32, -50);
    bodyG.lineTo(26, -22);
    bodyG.strokePath();

    // Pointing arm, raised out toward the horizon - land ho!
    bodyG.beginPath();
    bodyG.moveTo(shoulder.x, shoulder.y);
    bodyG.lineTo(105, -70);
    bodyG.lineTo(155, -72);
    bodyG.strokePath();

    // Round joints at the hip and neck, so the thick strokes read as one
    // continuous body instead of separate segments meeting at sharp corners.
    bodyG.fillStyle(black, 1);
    bodyG.fillCircle(hip.x, hip.y, lineWidth / 2);
    bodyG.fillCircle(neck.x, neck.y, lineWidth / 2);

    // Plain head, no face.
    bodyG.lineStyle(lineWidth - 1, black, 1);
    bodyG.strokeCircle(head.x, head.y, headRadius);

    const hullG = this.add.graphics();
    container.add(hullG);
    drawBoatHull(hullG);
  }

  update(time, delta) {
    this.waveT += delta * 0.001;
    this.renderSea(this.waveT);

    // Gentle rocking, matching the calm sea used out on the water.
    this.boatContainer.rotation = Math.sin(this.waveT * 1.3) * 0.02;
    this.boatContainer.y = this.boatBaseY + Math.sin(this.waveT * 1.3 + 0.6) * 2;
  }
}
