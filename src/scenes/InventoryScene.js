import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { BAIT } from '../data/baitData.js';
import { getCatchable, sizeScaleFor } from '../data/catchables.js';
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

const COLS = 3;
const CELL_W = 225;
const CELL_H = 148;
const VIEWPORT_TOP = 150;
const VIEWPORT_BOTTOM_MARGIN = 24;
const SCROLL_SPEED = 0.6;

// Base icon scale for an average-sized one of each - shrunk to match the
// smaller grid cells - a specific catch's actual weight then grows or
// shrinks it further from there.
const CATCH_DRAWERS = {
  flathead: (g, x, y, weightKg) => drawFlathead(g, x, y, 0.85 * sizeScaleFor('flathead', weightKg)),
  salmon: (g, x, y, weightKg) => drawSalmon(g, x, y, 0.78 * sizeScaleFor('salmon', weightKg)),
  mullet: (g, x, y, weightKg) => drawMullet(g, x, y, 0.82 * sizeScaleFor('mullet', weightKg)),
  bream: (g, x, y, weightKg) => drawBream(g, x, y, 0.78 * sizeScaleFor('bream', weightKg)),
  tuna: (g, x, y, weightKg) => drawTuna(g, x, y, 0.65 * sizeScaleFor('tuna', weightKg)),
  tailor: (g, x, y, weightKg) => drawTailor(g, x, y, 0.82 * sizeScaleFor('tailor', weightKg)),
  trevally: (g, x, y, weightKg) => drawTrevally(g, x, y, 0.72 * sizeScaleFor('trevally', weightKg)),
  kingfish: (g, x, y, weightKg) => drawKingfish(g, x, y, 0.65 * sizeScaleFor('kingfish', weightKg)),
  whiting: (g, x, y, weightKg) => drawWhiting(g, x, y, 0.95 * sizeScaleFor('whiting', weightKg)),
  coral_trout: (g, x, y, weightKg) => drawCoralTrout(g, x, y, 0.7 * sizeScaleFor('coral_trout', weightKg)),
  angler_fish: (g, x, y, weightKg) => drawAngler(g, x, y, 0.78 * sizeScaleFor('angler_fish', weightKg)),
  great_white: (g, x, y, weightKg) => drawGreatWhite(g, x, y, 0.54 * sizeScaleFor('great_white', weightKg)),
  tiger_shark: (g, x, y, weightKg) => drawTigerShark(g, x, y, 0.56 * sizeScaleFor('tiger_shark', weightKg)),
  bull_shark: (g, x, y, weightKg) => drawBullShark(g, x, y, 0.58 * sizeScaleFor('bull_shark', weightKg)),
  megalodon: (g, x, y, weightKg) => drawMegalodon(g, x, y, 0.3 * sizeScaleFor('megalodon', weightKg)),
  old_boot: (g, x, y, weightKg) => drawOldBoot(g, x, y, 1.1 * sizeScaleFor('old_boot', weightKg))
};

export default class InventoryScene extends Phaser.Scene {
  constructor() {
    super('InventoryScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    this.cells = [];
    this.maxScroll = 0;

    this.add.rectangle(0, 0, width, height, 0x0e3f5c).setOrigin(0, 0);
    this.add.text(width / 2, 68, 'Inventory', heading('28px')).setOrigin(0.5);
    this.add
      .text(width / 2, 90, 'Equip bait to load it on your hook', subheading('14px'))
      .setOrigin(0.5);

    this.statusBar = addStatusBar(this, GameState);
    createIconButton(this, width - 40, 92, 22, drawCloseIcon, () => this.scene.start('OceanScene'));

    // Bait stacks (identical units - one cell, a count) and individual
    // catches (each its own cell, since two catches of the same species can
    // weigh - and be worth - different amounts, so they're never merged
    // into one count) all only show up once the player actually has one.
    const items = [];
    if (GameState.ownedCount(BAIT[0].id) > 0) {
      items.push({
        itemId: BAIT[0].id,
        name: BAIT[0].name,
        sub: `Owned: ${GameState.ownedCount(BAIT[0].id)}`,
        draw: (g, x, y) => drawPrawn(g, x, y, 1.3)
      });
    }
    GameState.data.catches.forEach((c) => {
      const info = getCatchable(c.itemId);
      const drawer = CATCH_DRAWERS[c.itemId];
      items.push({
        itemId: c.itemId,
        uid: c.uid,
        name: info.name,
        sub: `${c.weightKg}kg`,
        draw: drawer ? (g, x, y) => drawer(g, x, y, c.weightKg) : null
      });
    });

    const viewportBottom = height - VIEWPORT_BOTTOM_MARGIN;
    const viewportHeight = viewportBottom - VIEWPORT_TOP;

    if (items.length === 0) {
      this.add
        .text(width / 2, VIEWPORT_TOP + viewportHeight / 2, "Nothing in your bag yet.\nBuy bait or catch something first!", {
          ...subheading('17px'),
          align: 'center'
        })
        .setOrigin(0.5);
      return;
    }

    // Everything below is built into a single scrollable container so a bag
    // full of individually-weighed catches (which never stack) can still
    // all be reached with the mouse wheel instead of overflowing off the
    // bottom of the screen - clipped to the viewport band via a mask so
    // rows scrolled out of view don't show through the header or status bar.
    this.gridContainer = this.add.container(0, 0);
    const gridWidth = COLS * CELL_W;
    const startX = (width - gridWidth) / 2 + CELL_W / 2;
    items.forEach((item, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * CELL_W;
      const y = VIEWPORT_TOP + CELL_H / 2 + 8 + row * CELL_H;
      this.buildCell(item, x, y);
    });

    const rows = Math.ceil(items.length / COLS);
    const contentHeight = rows * CELL_H + 16;
    this.maxScroll = Math.max(0, contentHeight - viewportHeight);

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, VIEWPORT_TOP, width, viewportHeight);
    this.gridContainer.setMask(maskShape.createGeometryMask());

    if (this.maxScroll > 0) {
      this.scrollTrackX = width - 12;
      this.scrollG = this.add.graphics();
      this.redrawScrollbar(viewportHeight);
      this.input.on('wheel', (pointer, over, dx, dy) => {
        this.gridContainer.y = Phaser.Math.Clamp(this.gridContainer.y - dy * SCROLL_SPEED, -this.maxScroll, 0);
        this.redrawScrollbar(viewportHeight);
      });
      this.add
        .text(width / 2, height - 8, 'Scroll for more', label('12px', { color: '#7fa8bd' }))
        .setOrigin(0.5, 1);
    }
  }

  redrawScrollbar(viewportHeight) {
    this.scrollG.clear();
    this.scrollG.fillStyle(0x0c2430, 0.4);
    this.scrollG.fillRoundedRect(this.scrollTrackX, VIEWPORT_TOP, 6, viewportHeight, 3);
    const ratio = Phaser.Math.Clamp(viewportHeight / (viewportHeight + this.maxScroll), 0.08, 1);
    const thumbH = viewportHeight * ratio;
    const scrollFrac = this.maxScroll > 0 ? -this.gridContainer.y / this.maxScroll : 0;
    const thumbY = VIEWPORT_TOP + scrollFrac * (viewportHeight - thumbH);
    this.scrollG.fillStyle(0x4ad991, 0.85);
    this.scrollG.fillRoundedRect(this.scrollTrackX, thumbY, 6, thumbH, 3);
  }

  buildCell(item, x, y) {
    const panel = this.add.rectangle(x, y, CELL_W - 16, CELL_H - 16, 0x145a73).setStrokeStyle(2, 0x0c3446);
    this.gridContainer.add(panel);

    const g = this.add.graphics();
    if (item.draw) item.draw(g, x, y - CELL_H / 2 + 40);
    this.gridContainer.add(g);

    const nameText = this.add.text(x, y - 16, item.name, label('15px')).setOrigin(0.5);
    this.gridContainer.add(nameText);
    const subText = this.add.text(x, y + 3, item.sub, label('11px', { color: '#bfe9ff' })).setOrigin(0.5);
    this.gridContainer.add(subText);

    const equipBtn = createBubbleButton(this, x, y + 34, 116, 32, '', () => this.equip(item.itemId, item.uid), {
      fontSize: '12px',
      container: this.gridContainer
    });

    // A stackable item (Prawns, no uid) is "equipped" at the species level.
    // An individual catch is equipped by its own uid - so with three
    // Flatheads in the bag, equipping one only marks that exact card as
    // Equipped, not all three (each could be a different weight/value).
    const refresh = () => {
      const equipped =
        item.uid != null ? GameState.equippedCatchUid === item.uid : GameState.equippedBait === item.itemId && GameState.equippedCatchUid == null;
      equipBtn.setLabel(equipped ? 'Equipped' : 'Equip');
      equipBtn.setEnabled(!equipped);
    };
    refresh();

    this.cells.push({ refresh });
  }

  equip(itemId, uid) {
    if (!GameState.equipBait(itemId, uid)) return;
    this.cells.forEach((cell) => cell.refresh());
  }
}
