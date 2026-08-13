import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { BAIT } from '../data/baitData.js';
import { getCatchable, sizeScaleFor } from '../data/catchables.js';
import { currentUpgrade, nextUpgrade } from '../data/upgradeData.js';
import { createBubbleButton } from '../ui/BubbleButton.js';
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
  drawKingfish,
  drawWhiting,
  drawCoralTrout,
  drawAngler,
  drawGreatWhite,
  drawTigerShark,
  drawBullShark,
  drawMegalodon,
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
  kingfish: (g, x, y, weightKg) => drawKingfish(g, x, y, 0.78 * sizeScaleFor('kingfish', weightKg)),
  whiting: (g, x, y, weightKg) => drawWhiting(g, x, y, 1.1 * sizeScaleFor('whiting', weightKg)),
  coral_trout: (g, x, y, weightKg) => drawCoralTrout(g, x, y, 0.85 * sizeScaleFor('coral_trout', weightKg)),
  angler_fish: (g, x, y, weightKg) => drawAngler(g, x, y, 0.95 * sizeScaleFor('angler_fish', weightKg)),
  great_white: (g, x, y, weightKg) => drawGreatWhite(g, x, y, 0.62 * sizeScaleFor('great_white', weightKg)),
  tiger_shark: (g, x, y, weightKg) => drawTigerShark(g, x, y, 0.65 * sizeScaleFor('tiger_shark', weightKg)),
  bull_shark: (g, x, y, weightKg) => drawBullShark(g, x, y, 0.68 * sizeScaleFor('bull_shark', weightKg)),
  // Much smaller base multiplier than the other sharks - the drawer itself
  // is built at a far larger native scale (that towering dorsal fin), so
  // this keeps a caught one from blowing out the row instead of just
  // looking bigger like the other legendary catches do.
  megalodon: (g, x, y, weightKg) => drawMegalodon(g, x, y, 0.35 * sizeScaleFor('megalodon', weightKg)),
  old_boot: (g, x, y, weightKg) => drawOldBoot(g, x, y, 1.3 * sizeScaleFor('old_boot', weightKg))
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
    createIconButton(this, width - 40, 92, 22, drawCloseIcon, () => this.scene.start('OceanScene'));

    if (this.mode === 'buy') {
      this.buildBuy(width, height);
    } else if (this.mode === 'sell') {
      this.buildSell(width, height);
    } else if (this.mode === 'upgrades') {
      this.buildUpgrades(width, height);
    } else {
      this.buildMenu(width, height);
    }
  }

  // The landing view - three doors in: buy bait, sell the day's catch, or
  // upgrade the line to reach deeper water.
  buildMenu(width, height) {
    this.add.text(width / 2, 98, 'Bait & Tackle Shop', heading('30px')).setOrigin(0.5);
    this.add.text(width / 2, 130, 'What are you here for?', subheading('16px')).setOrigin(0.5);

    createBubbleButton(this, width / 2 - 170, 280, 190, 90, 'Buy', () => this.scene.restart({ mode: 'buy' }), {
      fontSize: '24px'
    });
    createBubbleButton(this, width / 2, 280, 190, 90, 'Sell', () => this.scene.restart({ mode: 'sell' }), {
      fontSize: '24px'
    });
    createBubbleButton(
      this,
      width / 2 + 170,
      280,
      190,
      90,
      'Upgrades',
      () => this.scene.restart({ mode: 'upgrades' }),
      { fontSize: '20px' }
    );

    createBubbleButton(
      this,
      width / 2,
      height - 90,
      220,
      56,
      'Back to Ocean',
      () => {
        this.scene.start('OceanScene');
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
    createBubbleButton(this, width / 2 + 155, buyY, 120, 50, 'Buy', () => this.buyBait(bait), { fontSize: '18px' });

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
      this.buildCatchList(catches, width, height);
    }

    this.buildBackButton(width, height);

    if (this.pendingFlash) this.flashMessage(this.pendingFlash);
  }

  buildUpgrades(width, height) {
    this.add.text(width / 2, 98, 'Line Upgrades', heading('30px')).setOrigin(0.5);

    this.messageText = this.add
      .text(width / 2, height - 164, '', subheading('18px', { color: '#ffe17d' }))
      .setOrigin(0.5);

    const count = GameState.lineLengthTier;
    const current = currentUpgrade(count);
    const next = nextUpgrade(count);

    this.add
      .text(width / 2, 175, `Current reach: ${Math.round(current.maxDepth / 12)}m deep`, subheading('17px'))
      .setOrigin(0.5);
    this.add
      .text(width / 2, 205, `${count} upgrade${count === 1 ? '' : 's'} bought so far`, label('14px', { color: '#7fa8bd' }))
      .setOrigin(0.5);

    const panelY = 280;
    this.add.rectangle(width / 2, panelY, 460, 110, 0x145a73).setStrokeStyle(2, 0x0c3446);
    this.add.text(width / 2, panelY - 22, 'Longer Line', label('20px')).setOrigin(0.5);
    this.add
      .text(width / 2, panelY + 8, `Reach ${Math.round(next.maxDepth / 12)}m deep`, label('15px', { color: '#bfe9ff' }))
      .setOrigin(0.5);
    const buyBtn = createBubbleButton(
      this,
      width / 2,
      panelY + 42,
      160,
      44,
      `Buy - $${next.cost}`,
      () => this.buyUpgrade(next.cost),
      { fontSize: '15px' }
    );
    if (GameState.coins < next.cost) buyBtn.setEnabled(false);

    this.buildBackButton(width, height);

    if (this.pendingFlash) this.flashMessage(this.pendingFlash);
  }

  // The catch list can run well past what fits on screen (every catch is
  // its own row, and there's no cap on how many you can be holding), so it
  // sits in its own container clipped to a fixed viewport and scrolled with
  // the mouse wheel - rather than rows silently overflowing past the back
  // button with no way to reach them.
  buildCatchList(catches, width, height) {
    const rowHeight = 82;
    const viewTop = 140;
    const viewBottom = height - 128;
    const viewHeight = viewBottom - viewTop;
    const contentHeight = catches.length * rowHeight;
    const maxScroll = Math.max(0, contentHeight - viewHeight);

    const listContainer = this.add.container(0, viewTop);
    catches.forEach((c, i) => this.buildCatchRow(c, 41 + i * rowHeight, listContainer));

    if (maxScroll <= 0) return;

    const maskShape = this.make.graphics().fillStyle(0xffffff).fillRect(0, viewTop, width, viewHeight);
    listContainer.setMask(maskShape.createGeometryMask());

    let scrollY = 0;
    const applyScroll = () => {
      scrollY = Phaser.Math.Clamp(scrollY, -maxScroll, 0);
      listContainer.y = viewTop + scrollY;
    };

    this.input.on('wheel', (pointer, over, dx, dy) => {
      scrollY -= dy * 0.5;
      applyScroll();
    });

    // A small fading hint so it's obvious there's more to see below,
    // without needing a full scrollbar widget.
    this.add
      .text(width / 2, viewBottom + 14, '↓ scroll for more ↓', label('12px', { color: '#7fa8bd' }))
      .setOrigin(0.5);
  }

  buildCatchRow(c, y, container) {
    const width = DESIGN_WIDTH;
    const info = getCatchable(c.itemId);
    const draw = CATCH_DRAWERS[c.itemId];

    const bg = this.add.rectangle(width / 2, y, 460, 72, 0x145a73).setStrokeStyle(2, 0x0c3446);
    const icon = this.add.graphics();
    if (draw) draw(icon, width / 2 - 175, y, c.weightKg);
    const nameText = this.add.text(width / 2 - 120, y - 12, info.name, label('17px')).setOrigin(0, 0.5);
    const weightText = this.add
      .text(width / 2 - 120, y + 12, `${c.weightKg}kg`, label('13px', { color: '#bfe9ff' }))
      .setOrigin(0, 0.5);

    // Added to the container before the button below, so the row panel
    // renders underneath it - added the other way round, the opaque panel
    // painted on top would bury the Sell button, making it unclickable.
    if (container) container.add([bg, icon, nameText, weightText]);

    createBubbleButton(this, width / 2 + 155, y, 120, 46, `Sell +$${c.value}`, () => this.sellCatch(c.uid), {
      fontSize: '14px',
      container
    });
  }

  buildBackButton(width, height) {
    createBubbleButton(
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

  buyUpgrade(cost) {
    if (!GameState.buyLineUpgrade(cost)) {
      this.flashMessage('Not enough coins!');
      return;
    }
    this.statusBar.refresh();
    this.scene.restart({ mode: 'upgrades', flash: 'Line upgraded!' });
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
