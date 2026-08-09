import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { BAIT } from '../data/baitData.js';
import { FISH } from '../data/fishData.js';
import { createButton } from '../ui/Button.js';
import { addStatusBar } from '../ui/fishIcon.js';
import { drawPrawn, drawFlathead } from '../ui/tackle.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { heading, subheading, label } from '../ui/textStyle.js';

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super('InventoryScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    this.rows = [];

    this.add.rectangle(0, 0, width, height, 0x0e3f5c).setOrigin(0, 0);
    this.add.text(width / 2, 98, 'Tackle Bag', heading('30px')).setOrigin(0.5);
    this.add
      .text(width / 2, 118, 'Equip bait to load it on your hook', subheading('15px'))
      .setOrigin(0.5);

    this.statusBar = addStatusBar(this, GameState);

    // Bought bait and caught fish are both equippable as bait, so they
    // share the same row layout here - a fish only shows up once the player
    // actually has one, though, not before they've ever caught it.
    const items = [{ id: BAIT[0].id, name: BAIT[0].name, draw: (g, x, y) => drawPrawn(g, x, y, 1.7) }];
    if (GameState.ownedCount(FISH[0].id) > 0) {
      items.push({ id: FISH[0].id, name: FISH[0].name, draw: (g, x, y) => drawFlathead(g, x, y, 1.15) });
    }

    items.forEach((item, i) => this.buildRow(item, 190 + i * 110));

    createButton(
      this,
      width / 2,
      height - 50,
      220,
      56,
      'Back',
      () => {
        this.scene.start('FishingScene');
      },
      { fontSize: '20px' }
    );
  }

  buildRow(item, y) {
    const width = DESIGN_WIDTH;
    this.add.rectangle(width / 2, y, 500, 96, 0x145a73).setStrokeStyle(2, 0x0c3446);

    const g = this.add.graphics();
    item.draw(g, width / 2 - 195, y);

    this.add.text(width / 2 - 130, y - 16, item.name, label('19px')).setOrigin(0, 0.5);
    const ownedText = this.add
      .text(width / 2 - 130, y + 12, '', label('14px', { color: '#bfe9ff' }))
      .setOrigin(0, 0.5);

    const equipBtn = createButton(this, width / 2 + 175, y, 130, 50, '', () => this.equip(item), {
      fontSize: '15px'
    });

    const refresh = () => {
      const owned = GameState.ownedCount(item.id);
      const equipped = GameState.equippedBait === item.id;
      ownedText.setText(`Owned: ${owned}`);
      equipBtn.setLabel(equipped ? 'Equipped' : 'Equip');
      equipBtn.setEnabled(owned > 0 && !equipped);
    };
    refresh();

    this.rows.push({ refresh });
  }

  equip(item) {
    if (!GameState.equipBait(item.id)) return;
    this.rows.forEach((row) => row.refresh());
  }
}
