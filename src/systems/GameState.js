// Bumped when a change makes old save data meaningless (this one - the
// underwater redesign changed the whole game) so everyone starts fresh
// under a new key instead of the old save silently carrying over.
const STORAGE_KEY = 'oceanOdysseySave_v2';

function defaultState() {
  return {
    coins: 0,
    // Stackable bait items (e.g. 'prawn') - identical units, so a simple
    // id -> count is fine.
    inventory: {},
    // Individual catches - NOT stacked, because two catches of the same
    // species can have different weights and so different values. Each is
    // its own entry: { uid, itemId, weightKg, value }.
    catches: [],
    nextCatchUid: 1,
    equippedBait: null,
    // Which specific catch (by uid) is equipped, when the equipped bait is
    // an individual catch rather than a stackable item - so equipping one
    // Flathead doesn't also mark every OTHER Flathead in the bag as
    // equipped, and casting only ever consumes that exact fish.
    equippedCatchUid: null,
    // How many times the line-length upgrade has been bought (see
    // data/upgradeData.js) - determines how deep the hook can go. 0 =
    // starting line, no purchases yet.
    lineLengthTier: 0
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

  // Resets everything back to a fresh save - coins, inventory, catches, the
  // works - and persists that reset immediately so a reload doesn't bring
  // the old save back.
  wipe() {
    this.data = defaultState();
    this.save();
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

  get equippedCatchUid() {
    return this.data.equippedCatchUid;
  }

  get lineLengthTier() {
    return this.data.lineLengthTier;
  }

  // Spends coins to buy one more line-length upgrade - the caller (ShopScene)
  // supplies the cost for the next purchase from data/upgradeData.js.
  buyLineUpgrade(cost) {
    if (!this.spendCoins(cost)) return false;
    this.data.lineLengthTier += 1;
    this.save();
    return true;
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

  // --- Stackable bait (identical units, no individual value) ---

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

  // --- Individual catches (each its own weight/value, never stacked) ---

  addCatch(itemId, weightKg, value) {
    const uid = this.data.nextCatchUid;
    this.data.nextCatchUid += 1;
    this.data.catches.push({ uid, itemId, weightKg, value });
    this.save();
    return uid;
  }

  catchesOf(itemId) {
    return this.data.catches.filter((c) => c.itemId === itemId);
  }

  removeCatch(uid) {
    const index = this.data.catches.findIndex((c) => c.uid === uid);
    if (index === -1) return null;
    const [removed] = this.data.catches.splice(index, 1);
    // If the catch being removed (sold, or just used up as bait) was the
    // one currently equipped, don't leave equippedCatchUid pointing at
    // something that no longer exists.
    if (this.data.equippedCatchUid === uid) {
      this.data.equippedBait = null;
      this.data.equippedCatchUid = null;
    }
    this.save();
    return removed;
  }

  removeAnyCatchOf(itemId) {
    const index = this.data.catches.findIndex((c) => c.itemId === itemId);
    if (index === -1) return null;
    const [removed] = this.data.catches.splice(index, 1);
    this.save();
    return removed;
  }

  sellCatch(uid) {
    const removed = this.removeCatch(uid);
    if (!removed) return 0;
    this.addCoins(removed.value);
    return removed.value;
  }

  // --- Bait equipping - either a stackable item (every unit identical, so
  // just the species id) or one SPECIFIC individual catch (by uid, since
  // two catches of the same species can be very different fish) works as
  // bait ---

  // uid omitted/null -> equip a stackable item (e.g. Prawns) by species id.
  // uid given -> equip that exact catch (and only that one - other catches
  // of the same species are untouched and stay unequipped).
  equipBait(itemId, uid = null) {
    if (uid != null) {
      const owned = this.data.catches.some((c) => c.uid === uid && c.itemId === itemId);
      if (!owned) return false;
      this.data.equippedBait = itemId;
      this.data.equippedCatchUid = uid;
      this.save();
      return true;
    }
    if (this.ownedCount(itemId) <= 0) return false;
    this.data.equippedBait = itemId;
    this.data.equippedCatchUid = null;
    this.save();
    return true;
  }

  // Called on cast - uses up whatever's equipped: the exact catch if one
  // was equipped by uid, otherwise one unit of the stackable item.
  consumeEquippedBait() {
    const itemId = this.data.equippedBait;
    if (!itemId) return false;

    if (this.data.equippedCatchUid != null) {
      const removed = this.removeCatch(this.data.equippedCatchUid);
      this.data.equippedBait = null;
      this.data.equippedCatchUid = null;
      this.save();
      return !!removed;
    }

    if (this.ownedCount(itemId) <= 0) return false;
    this.removeItem(itemId, 1);
    if (this.ownedCount(itemId) <= 0) {
      this.data.equippedBait = null;
      this.save();
    }
    return true;
  }
}

export default new GameState();
