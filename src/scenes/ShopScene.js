import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { BAIT } from '../data/baitData.js';
import { getCatchable, sizeScaleFor } from '../data/catchables.js';
import { createButton } from '../ui/Button.js';
import { createIconButton, drawCloseIcon } from '../ui/iconButton.js';
import { addStatusBar } from '../ui/fishIcon.js';
import {
  drawPrawn,
  drawFlathead,
  drawSalmon,
  drawMullet,
  drawBream,
  drawTuna,
  drawTailor,
  drawTrevally,
  drawGreatWhite,
  drawTigerShark,
  drawSeaweed,
  drawOldBoot
} from '../ui/tackle.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { heading, subheading, label } from '../ui/textStyle.js';

// Base icon scale for an average-sized one of each - a specific catch's
// actual weight then grows or shrinks it from there, so a heavier catch
// visibly looks bigger in the list than a lighter one of the same species.
const CATCH_DRAWERS = {
  flathead: (g, x, y, weightKg) => drawFlathead(g, x, y, 1.0 * sizeScaleFor('flathead', weightKg)),
  salmon: (g, x, y, weightKg) => drawSalmon(g, x, y, 0.9 * sizeScaleFor('salmon', weightKg)),
  mullet: (g, x, y, weightKg) => drawMullet(g, x, y, 0.95 * sizeScaleFor('mullet', weightKg)),
  bream: (g, x, y, weightKg) => drawBream(g, x, y, 0.9 * sizeScaleFor('bream', weightKg)),
  tuna: (g, x, y, weightKg) => drawTuna(g, x, y, 0.75 * sizeScaleFor('tuna', weightKg)),
  tailor: (g, x, y, weightKg) => drawTailor(g, x, y, 0.95 * sizeScaleFor('tailor', weightKg)),
  trevally: (g, x, y, weightKg) => drawTrevally(g, x, y, 0.85 * sizeScaleFor('trevally', weightKg)),
  great_white: (g, x, y, weightKg) => drawGreatWhite(g, x, y, 0.62 * sizeScaleFor('great_white', weightKg)),
  tiger_shark: (g, x, y, weightKg) => drawTigerShark(g, x, y, 0.65 * sizeScaleFor('tiger_shark', weightKg)),
  old_boot: (g, x, y, weightKg) => drawOldBoot(g, x, y, 1.3 * sizeScaleFor('old_boot', weightKg)),
  seaweed: (g, x, y, weightKg) => drawSeaweed(g, x, y, 1.2 * sizeScaleFor('seaweed', weightKg))
};

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data) {
    this.mode = (data && data.mode) || 'menu';
    this.pendingFlash = (data && data.flash) || null;
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;

    this.add.rectangle(0, 0, width, height, 0x0e3f5c).setOrigin(0, 0);
    this.statusBar = addStatusBar(this, GameState);
    createIconButton(this, width - 40, 92, 22, drawCloseIcon, () => this.scene.start('FishingScene'));

    if (this.mode === 'buy') {
      this.buildBuy(width, height);
    } else if (this.mode === 'sell') {
      this.buildSell(width, height);
    } else {
      this.buildMenu(width, height);
    }
  }

  // The landing view - just two big doors in, one for buying bait, one for
  // selling whatever's been caught.
  buildMenu(width, height) {
    this.add.text(width / 2, 98, 'Bait & Tackle Shop', heading('30px')).setOrigin(0.5);
    this.add.text(width / 2, 130, 'What are you here for?', subheading('16px')).setOrigin(0.5);

    createButton(this, width / 2 - 130, 280, 220, 90, 'Buy', () => this.scene.restart({ mode: 'buy' }), {
      fontSize: '26px'
    });
    createButton(this, width / 2 + 130, 280, 220, 90, 'Sell', () => this.scene.restart({ mode: 'sell' }), {
      fontSize: '26px'
    });

    createButton(
      this,
      width / 2,
      height - 90,
      220,
      56,
      'Back to Boat',
      () => {
        this.scene.start('FishingScene');
      },
      { fontSize: '20px' }
    );
  }

  buildBuy(width, height) {
    this.add.text(width / 2, 98, 'Buy Bait', heading('30px')).setOrigin(0.5);

    this.messageText = this.add
      .text(width / 2, height - 164, '', subheading('18px', { color: '#ffe17d' }))
      .setOrigin(0.5);

    const bait = BAIT[0];
    const buyY = 220;
    this.add.rectangle(width / 2, buyY, 460, 100, 0x145a73).setStrokeStyle(2, 0x0c3446);
    const prawnIcon = this.add.graphics();
    drawPrawn(prawnIcon, width / 2 - 175, buyY, 1.7);
    this.add.text(width / 2 - 120, buyY - 18, bait.name, label('20px')).setOrigin(0, 0.5);
    this.add
      .text(width / 2 - 120, buyY + 12, `${bait.packSize} for $${bait.cost}`, label('15px', { color: '#bfe9ff' }))
      .setOrigin(0, 0.5);
    createButton(this, width / 2 + 155, buyY, 120, 50, 'Buy', () => this.buyBait(bait), { fontSize: '18px' });

    this.buildBackButton(width, height);
  }

  buildSell(width, height) {
    this.add.text(width / 2, 98, 'Sell Your Catch', heading('30px')).setOrigin(0.5);

    this.messageText = this.add
      .text(width / 2, height - 164, '', subheading('18px', { color: '#ffe17d' }))
      .setOrigin(0.5);

    const catches = GameState.data.catches;
    if (catches.length === 0) {
      this.add
        .text(width / 2, 260, "Nothing to sell yet.\nGo catch something!", { ...subheading('17px'), align: 'center' })
        .setOrigin(0.5);
    } else {
      catches.forEach((c, i) => this.buildCatchRow(c, 175 + i * 82));
    }

    this.buildBackButton(width, height);

    if (this.pendingFlash) this.flashMessage(this.pendingFlash);
  }

  buildCatchRow(c, y) {
    const width = DESIGN_WIDTH;
    const info = getCatchable(c.itemId);
    const draw = CATCH_DRAWERS[c.itemId];

    this.add.rectangle(width / 2, y, 460, 72, 0x145a73).setStrokeStyle(2, 0x0c3446);
    const icon = this.add.graphics();
    if (draw) draw(icon, width / 2 - 175, y, c.weightKg);
    this.add.text(width / 2 - 120, y - 12, info.name, label('17px')).setOrigin(0, 0.5);
    this.add
      .text(width / 2 - 120, y + 12, `${c.weightKg}kg`, label('13px', { color: '#bfe9ff' }))
      .setOrigin(0, 0.5);
    createButton(this, width / 2 + 155, y, 120, 46, `Sell +$${c.value}`, () => this.sellCatch(c.uid), {
      fontSize: '14px'
    });
  }

  buildBackButton(width, height) {
    createButton(
      this,
      width / 2,
      height - 90,
      220,
      56,
      'Back',
      () => {
        this.scene.restart({ mode: 'menu' });
      },
      { fontSize: '20px' }
    );
  }

  buyBait(bait) {
    if (GameState.spendCoins(bait.cost)) {
      GameState.addItem(bait.id, bait.packSize);
      this.statusBar.refresh();
      this.flashMessage(`Bought ${bait.packSize} ${bait.name}!`);
    } else {
      this.flashMessage('Not enough coins!');
    }
  }

  sellCatch(uid) {
    const catchInfo = GameState.data.catches.find((c) => c.uid === uid);
    const name = catchInfo ? getCatchable(catchInfo.itemId).name : 'catch';
    const earned = GameState.sellCatch(uid);
    if (earned <= 0) return;
    // Simplest reliable refresh after a sale - rebuild the sell list so the
    // sold row is gone and the rest shift up.
    this.scene.restart({ mode: 'sell', flash: `Sold ${name} for $${earned}!` });
  }

  flashMessage(text) {
    this.messageText.setText(text);
    this.time.delayedCall(1400, () => this.messageText.setText(''));
  }
}
