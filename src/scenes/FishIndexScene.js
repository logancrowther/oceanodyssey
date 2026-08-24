import Phaser from 'phaser';
import GameState from '../systems/GameState.js';
import { FISH } from '../data/fishData.js';
import { createIconButton, drawCloseIcon } from '../ui/iconButton.js';
import { createSearchBox } from '../ui/SearchBox.js';
import { addStatusBar } from '../ui/fishIcon.js';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from '../constants.js';
import { heading, subheading, label } from '../ui/textStyle.js';
import { CATCH_DRAWERS } from './InventoryScene.js';

const COLS = 3;
const CELL_W = 225;
const CELL_H = 148;
const VIEWPORT_TOP = 165;
const VIEWPORT_BOTTOM_MARGIN = 24;
const SCROLL_SPEED = 0.6;

// Every silhouette texture is baked once (species art never changes) and
// reused for the rest of the game session - keyed off this prefix so a
// second visit to the scene doesn't redo the work.
const SILHOUETTE_PREFIX = 'fishIndexSilhouette_';
const SILHOUETTE_W = CELL_W - 16;
const SILHOUETTE_H = CELL_H - 16;

export default class FishIndexScene extends Phaser.Scene {
  constructor() {
    super('FishIndexScene');
  }

  create() {
    this.cameras.main.setZoom(this.scale.width / DESIGN_WIDTH);
    this.cameras.main.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    this.cells = [];
    this.maxScroll = 0;

    this.add.rectangle(0, 0, width, height, 0x0e3f5c).setOrigin(0, 0);
    this.add.text(width / 2, 68, 'Fishing Index', heading('28px')).setOrigin(0.5);
    this.add
      .text(width / 2, 90, 'Catch a species once to unlock it here for good', subheading('14px'))
      .setOrigin(0.5);

    this.statusBar = addStatusBar(this, GameState);
    createIconButton(this, width - 40, 92, 22, drawCloseIcon, () => this.scene.start('OceanScene'));

    // Every real fish in the game (junk items like the Old Boot aren't
    // species, so they don't belong in a fishing log), ordered least to
    // most valuable "on average" (an average-weight catch's coin value -
    // the same baseWeightKg * valuePerKg an actual catch's value is
    // derived from, just without a specific roll to plug in).
    const withValue = FISH.map((f) => ({
      itemId: f.id,
      name: f.name,
      baseWeightKg: f.baseWeightKg,
      avgValue: f.baseWeightKg * f.valuePerKg
    }));
    this.allItems = withValue.slice().sort((a, b) => a.avgValue - b.avgValue || a.name.localeCompare(b.name));

    // The badge in each box's corner is a value RANK, not a list position -
    // the single most valuable fish in the game is always "1#" regardless
    // of where it happens to scroll to, so it's computed off a separate
    // descending sort rather than off this.allItems' own (ascending) order.
    const byValueDesc = withValue.slice().sort((a, b) => b.avgValue - a.avgValue || a.name.localeCompare(b.name));
    this.valueRank = {};
    byValueDesc.forEach((item, i) => {
      this.valueRank[item.itemId] = i + 1;
    });

    this.viewportBottom = height - VIEWPORT_BOTTOM_MARGIN;

    this.searchBox = createSearchBox(this, width / 2, 120, 320, {
      placeholder: 'Search the index...',
      onChange: () => this.refreshGrid()
    });

    this.input.on('wheel', (pointer, over, dx, dy) => {
      if (this.maxScroll <= 0 || !this.gridContainer) return;
      this.gridContainer.y = Phaser.Math.Clamp(this.gridContainer.y - dy * SCROLL_SPEED, -this.maxScroll, 0);
      this.redrawScrollbar(this.viewportBottom - VIEWPORT_TOP);
    });

    this.refreshGrid();
  }

  refreshGrid() {
    const width = DESIGN_WIDTH;
    const height = DESIGN_HEIGHT;
    const viewportHeight = this.viewportBottom - VIEWPORT_TOP;

    if (this.gridContainer) {
      this.gridContainer.destroy();
      this.gridContainer = null;
    }
    if (this.gridMaskGraphics) {
      this.gridMaskGraphics.destroy();
      this.gridMaskGraphics = null;
    }
    if (this.scrollG) {
      this.scrollG.destroy();
      this.scrollG = null;
    }
    if (this.scrollHintText) {
      this.scrollHintText.destroy();
      this.scrollHintText = null;
    }
    if (this.emptyResultsText) {
      this.emptyResultsText.destroy();
      this.emptyResultsText = null;
    }
    this.cells = [];

    const query = this.searchBox.getValue().trim().toLowerCase();
    // A locked entry shows only "???" - searching by name should only ever
    // match species the player has actually unlocked, not spoil what an
    // as-yet-uncaught fish is called.
    const items = query
      ? this.allItems.filter((item) => GameState.isDiscovered(item.itemId) && item.name.toLowerCase().includes(query))
      : this.allItems;

    if (items.length === 0) {
      this.maxScroll = 0;
      this.emptyResultsText = this.add
        .text(width / 2, VIEWPORT_TOP + viewportHeight / 2, `No unlocked fish matches "${this.searchBox.getValue()}"`, {
          ...subheading('16px', { color: '#bfe9ff' }),
          align: 'center'
        })
        .setOrigin(0.5);
      return;
    }

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

    this.gridMaskGraphics = this.make.graphics();
    this.gridMaskGraphics.fillStyle(0xffffff);
    this.gridMaskGraphics.fillRect(0, VIEWPORT_TOP, width, viewportHeight);
    this.gridContainer.setMask(this.gridMaskGraphics.createGeometryMask());

    if (this.maxScroll > 0) {
      this.scrollTrackX = width - 12;
      this.scrollG = this.add.graphics();
      this.redrawScrollbar(viewportHeight);
      if (!this.scrollHintText) {
        this.scrollHintText = this.add
          .text(width / 2, height - 8, 'Scroll for more', label('12px', { color: '#7fa8bd' }))
          .setOrigin(0.5, 1);
      }
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

  // Bakes (once, then caches by species id) a pure black silhouette of a
  // species in the exact outline of its normal render - draw its real art
  // to an offscreen texture, then a black tint multiplies every opaque
  // pixel's colour down to 0,0,0 while leaving the alpha shape untouched.
  silhouetteTexture(itemId) {
    const key = SILHOUETTE_PREFIX + itemId;
    if (this.textures.exists(key)) return key;

    const drawer = CATCH_DRAWERS[itemId];
    const info = FISH.find((f) => f.id === itemId);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    if (drawer && info) {
      drawer(g, SILHOUETTE_W / 2, SILHOUETTE_H / 2, info.baseWeightKg);
    }
    g.generateTexture(key, SILHOUETTE_W, SILHOUETTE_H);
    g.destroy();
    return key;
  }

  buildCell(item, x, y) {
    const panel = this.add.rectangle(x, y, CELL_W - 16, CELL_H - 16, 0x145a73).setStrokeStyle(2, 0x0c3446);
    this.gridContainer.add(panel);

    const discovered = GameState.isDiscovered(item.itemId);
    const drawY = y - CELL_H / 2 + 40;

    if (discovered) {
      const drawer = CATCH_DRAWERS[item.itemId];
      const g = this.add.graphics();
      if (drawer) drawer(g, x, drawY, item.baseWeightKg);
      this.gridContainer.add(g);
    } else {
      const key = this.silhouetteTexture(item.itemId);
      const img = this.add.image(x, drawY, key).setTint(0x000000);
      this.gridContainer.add(img);
    }

    const nameText = this.add
      .text(x, y - 16, discovered ? item.name : '???', label('15px', discovered ? {} : { color: '#4a6472' }))
      .setOrigin(0.5);
    this.gridContainer.add(nameText);

    // Value rank badge, bottom-left corner of the box - shown even for a
    // locked "???" entry, since a number alone doesn't spoil what the fish
    // actually is.
    const rank = this.valueRank[item.itemId];
    const rankText = this.add
      .text(x - (CELL_W - 16) / 2 + 8, y + (CELL_H - 16) / 2 - 8, `${rank}#`, label('12px', { color: '#7fa8bd' }))
      .setOrigin(0, 1);
    this.gridContainer.add(rankText);
  }
}
