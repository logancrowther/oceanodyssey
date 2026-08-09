const STORAGE_KEY = 'oceanOdysseySave';

function defaultState() {
  return {
    coins: 20,
    // Every owned item - bait (e.g. 'prawn') and caught fish (e.g.
    // 'flathead') alike - keyed by id -> count. Fish can be equipped as
    // bait too, so there's no separate "bait" vs "fish" storage.
    inventory: {},
    equippedBait: null,
    selectedLocation: null
  };
}

class GameState {
  constructor() {
    this.data = defaultState();
  }

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.data = defaultState();
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      this.data = { ...defaultState(), ...parsed };
    } catch (e) {
      this.data = defaultState();
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  get coins() {
    return this.data.coins;
  }

  get equippedBait() {
    return this.data.equippedBait;
  }

  addCoins(amount) {
    this.data.coins += amount;
    this.save();
  }

  spendCoins(amount) {
    if (this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  }

  ownedCount(itemId) {
    return this.data.inventory[itemId] || 0;
  }

  addItem(itemId, count = 1) {
    this.data.inventory[itemId] = this.ownedCount(itemId) + count;
    this.save();
  }

  removeItem(itemId, count = 1) {
    const owned = this.ownedCount(itemId);
    if (owned < count) return false;
    this.data.inventory[itemId] = owned - count;
    this.save();
    return true;
  }

  // Any owned item can be loaded as bait - a bought bait item or a fish
  // caught earlier.
  equipBait(itemId) {
    if (this.ownedCount(itemId) <= 0) return false;
    this.data.equippedBait = itemId;
    this.save();
    return true;
  }

  // Called on cast - uses up one unit of whatever's equipped, unequipping
  // automatically once the stack runs out.
  consumeEquippedBait() {
    const itemId = this.data.equippedBait;
    if (!itemId || !this.removeItem(itemId, 1)) return false;
    if (this.ownedCount(itemId) <= 0) {
      this.data.equippedBait = null;
      this.save();
    }
    return true;
  }

  sellItem(itemId, count, valuePerUnit) {
    if (!this.removeItem(itemId, count)) return 0;
    const earned = valuePerUnit * count;
    this.addCoins(earned);
    return earned;
  }
}

export default new GameState();
