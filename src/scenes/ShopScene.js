import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { BAIT } from '../data/baitData.js';
import { FISH } from '../data/fishData.js';
import { createButton } from '../ui/Button.js';
import { addStatusBar } from '../ui/fishIcon.js';
import { drawPrawn, drawFlathead } from '../ui/tackle.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { heading, subheading, label } from '../ui/textStyle.js';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;

    this.add.rectangle(0, 0, width, height, 0x0e3f5c).setOrigin(0, 0);
    this.add.text(width / 2, 98, 'Bait & Tackle Shop', heading('30px')).setOrigin(0.5);

    this.statusBar = addStatusBar(this, GameState);

    this.messageText = this.add
      .text(width / 2, height - 130, '', subheading('18px', { color: '#ffe17d' }))
      .setOrigin(0.5);

    // Buy panel - Prawns.
    const bait = BAIT[0];
    const buyY = 190;
    this.add.rectangle(width / 2, buyY, 460, 100, 0x145a73).setStrokeStyle(2, 0x0c3446);
    const prawnIcon = this.add.graphics();
    drawPrawn(prawnIcon, width / 2 - 175, buyY, 1.7);
    this.add.text(width / 2 - 120, buyY - 18, bait.name, label('20px')).setOrigin(0, 0.5);
    this.add
      .text(width / 2 - 120, buyY + 12, `${bait.packSize} for $${bait.cost}`, label('15px', { color: '#bfe9ff' }))
      .setOrigin(0, 0.5);
    createButton(this, width / 2 + 155, buyY, 120, 50, 'Buy', () => this.buyBait(bait), { fontSize: '18px' });

    // Sell panel - Flathead. Only shown once the player actually has one to
    // sell - no point advertising a fish they haven't caught yet.
    const fish = FISH[0];
    if (GameState.ownedCount(fish.id) > 0) {
      const sellY = 310;
      this.add.rectangle(width / 2, sellY, 460, 100, 0x145a73).setStrokeStyle(2, 0x0c3446);
      const fishIcon = this.add.graphics();
      drawFlathead(fishIcon, width / 2 - 175, sellY, 1.15);
      this.add.text(width / 2 - 120, sellY - 18, fish.name, label('20px')).setOrigin(0, 0.5);
      this.ownedText = this.add
        .text(width / 2 - 120, sellY + 12, '', label('15px', { color: '#bfe9ff' }))
        .setOrigin(0, 0.5);
      this.updateOwnedText(fish);
      this.sellBtn = createButton(
        this,
        width / 2 + 155,
        sellY,
        120,
        50,
        `Sell +$${fish.value}`,
        () => this.sellFish(fish),
        { fontSize: '15px' }
      );
      this.sellBtn.setEnabled(GameState.ownedCount(fish.id) > 0);
    }

    createButton(
      this,
      width / 2,
      height - 56,
      220,
      56,
      'Back',
      () => {
        this.scene.start('FishingScene');
      },
      { fontSize: '20px' }
    );
  }

  updateOwnedText(fish) {
    this.ownedText.setText(`Owned: ${GameState.ownedCount(fish.id)}`);
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

  sellFish(fish) {
    const earned = GameState.sellItem(fish.id, 1, fish.value);
    if (earned <= 0) return;
    this.statusBar.refresh();
    this.updateOwnedText(fish);
    this.sellBtn.setEnabled(GameState.ownedCount(fish.id) > 0);
    this.flashMessage(`Sold a ${fish.name} for $${earned}!`);
  }

  flashMessage(text) {
    this.messageText.setText(text);
    this.time.delayedCall(1400, () => this.messageText.setText(''));
  }
}
