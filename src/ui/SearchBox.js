import Phaser from 'phaser';
import { label } from './textStyle.js';
import { createIconButton, drawCloseIcon } from './iconButton.js';

// A live-filtering search field built from Phaser primitives - there's no
// DOM plugin configured in main.js, so a real HTML <input> isn't available
// here. This fakes one with a background box, a Text object for the typed
// value, a blinking caret, and direct keyboard capture instead. Shared
// between ShopScene's sell list and InventoryScene's bag grid, both of
// which needed an identical "type to filter" search box.
export function createSearchBox(scene, x, y, width, opts = {}) {
  const boxH = opts.height ?? 42;
  const placeholder = opts.placeholder ?? 'Search...';
  const maxLength = opts.maxLength ?? 24;
  const onChange = opts.onChange ?? (() => {});

  let query = '';
  let focused = false;

  const bg = scene.add.rectangle(x, y, width, boxH, 0x0c3446).setStrokeStyle(2, 0x1c5a73);
  bg.setInteractive({ useHandCursor: true });
  const bounds = new Phaser.Geom.Rectangle(x - width / 2, y - boxH / 2, width, boxH);

  const placeholderText = scene.add.text(x - width / 2 + 16, y, placeholder, label('15px', { color: '#5f8aa0' })).setOrigin(0, 0.5);
  const valueText = scene.add.text(x - width / 2 + 16, y, '', label('15px')).setOrigin(0, 0.5);
  const cursor = scene.add.rectangle(x - width / 2 + 16, y, 2, 20, 0xffffff).setOrigin(0, 0.5);
  cursor.setVisible(false);

  function setFocused(value) {
    focused = value;
    bg.setStrokeStyle(2, focused ? 0xffe17d : 0x1c5a73);
    if (!focused) cursor.setVisible(false);
  }

  function refreshDisplay() {
    valueText.setText(query);
    placeholderText.setVisible(query.length === 0);
    cursor.x = valueText.x + valueText.width + 2;
  }

  function setQuery(next) {
    query = next;
    refreshDisplay();
    onChange(query);
  }

  bg.on('pointerdown', () => setFocused(true));

  const clearBtn = createIconButton(scene, x + width / 2 - 20, y, 13, drawCloseIcon, () => {
    setQuery('');
    setFocused(true);
  });

  const blinkTimer = scene.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => {
      if (focused) cursor.setVisible(!cursor.visible);
    }
  });

  // Any click outside the box blurs it - including clicks on other
  // buttons, which still fire their own handlers independently of this.
  // Uses worldX/worldY, not the raw x/y - every scene here zooms its
  // camera to fit the 960x600 design space at a higher render
  // resolution (see main.js's RES_MULT), so plain pointer.x/y are in
  // unzoomed canvas pixels and never actually match design-space bounds
  // like this one - that mismatch was why the box could never stay
  // focused long enough to type into.
  const pointerHandler = (pointer) => {
    setFocused(Phaser.Geom.Rectangle.Contains(bounds, pointer.worldX, pointer.worldY));
  };
  scene.input.on('pointerdown', pointerHandler);

  const keyHandler = (event) => {
    if (!focused) return;
    // Let real browser shortcuts (Ctrl+C, Cmd+R, etc.) pass through
    // untouched instead of dropping a stray letter into the search box.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (query.length === 0) return;
      setQuery(query.slice(0, -1));
    } else if (event.key === 'Escape') {
      setFocused(false);
    } else if (event.key.length === 1 && query.length < maxLength) {
      setQuery(query + event.key);
    }
  };
  scene.input.keyboard.on('keydown', keyHandler);

  refreshDisplay();

  return {
    bounds,
    getValue: () => query,
    setFocused,
    destroy() {
      blinkTimer.remove(false);
      scene.input.off('pointerdown', pointerHandler);
      scene.input.keyboard.off('keydown', keyHandler);
      bg.destroy();
      placeholderText.destroy();
      valueText.destroy();
      cursor.destroy();
      clearBtn.destroy();
    }
  };
}
