// Bumped when a change makes old save data meaningless (this one - the
// underwater redesign changed the whole game) so everyone starts fresh
// under a new key instead of the old save silently carrying over.
// v3 bump: the checksum below is now MANDATORY for this key, no exceptions -
// v2 (checksum-less) saves get migrated across exactly once, below, rather
// than sharing a key where "checksum missing" has to stay a trusted state
// forever (that gap was verified exploitable - deleting just the checksum
// key made a hand-edited save look identical to a legitimate pre-checksum
// save; bumping the key means "no checksum" under v3 is never trusted).
const LEGACY_STORAGE_KEY = 'oceanOdysseySave_v2';
const STORAGE_KEY = 'oceanOdysseySave_v3';
const CHECKSUM_KEY = STORAGE_KEY + '_chk';
// Not real cryptography - the point isn't to stop someone determined enough
// to read the (obfuscated) bundle and reimplement this, it's to stop the
// far more common "open DevTools > Application > Local Storage and edit
// coins to 999999" cheat, which otherwise works with zero effort since the
// save is just plaintext JSON. A mismatch here means the stored JSON was
// hand-edited outside the game, so it's discarded rather than trusted.
const SALT = 'abyssal-odyssey-save-v3';

function hashState(str) {
  const salted = SALT + str;
  let h = 0x811c9dc5;
  for (let i = 0; i < salted.length; i += 1) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

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
    lineLengthTier: 0,
    // Every species id ever landed, permanently - powers the Fishing
    // Index (see FishIndexScene). Deliberately separate from `catches`
    // (which empties out as fish are sold or eaten as bait) so an index
    // entry stays unlocked forever once first caught, id -> true.
    discoveredFish: {}
  };
}

class GameState {
  constructor() {
    this.data = defaultState();
    this._saveTimer = null;
    if (typeof window !== 'undefined') {
      // Guarantees a debounced save still lands if the tab closes before
      // its timer fires.
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  load() {
    let raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      // Nothing under the current (checksummed) key yet - the ONE case
      // where a pre-existing save with no checksum is still trusted: a
      // real v2 save left over from before this key bump. Migrated once,
      // immediately below, straight into the strictly-checked v3 key -
      // after this point in time "no checksum" is never trusted again.
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw === null) {
        this.data = defaultState();
        return;
      }
      raw = legacyRaw;
    } else {
      // Under the current key, a checksum is mandatory - missing or wrong
      // both mean the JSON doesn't match what the game itself last wrote,
      // whether from hand-editing or corruption, so it's discarded rather
      // than trusted.
      const storedChecksum = localStorage.getItem(CHECKSUM_KEY);
      if (storedChecksum === null || storedChecksum !== hashState(raw)) {
        this.data = defaultState();
        this.flush();
        return;
      }
    }

    try {
      const parsed = JSON.parse(raw);
      this.data = { ...defaultState(), ...parsed };
      // Saves from before the Fishing Index existed have no discoveredFish
      // record at all - backfill it from whatever's still sitting in the
      // bag right now, so a species the player is visibly holding doesn't
      // show up locked. Anything already sold or used as bait by then is
      // unrecoverable and stays locked until caught again.
      this.data.catches.forEach((c) => {
        this.data.discoveredFish[c.itemId] = true;
      });
    } catch (e) {
      this.data = defaultState();
    }
    // Immediately re-save so a migrated v2 save (or anything that just went
    // through the merge/backfill above) is durably persisted under the
    // checksummed v3 key right away, not left waiting on the next mutation.
    this.flush();
  }

  // Resets everything back to a fresh save - coins, inventory, catches, the
  // works - and persists that reset immediately so a reload doesn't bring
  // the old save back.
  wipe() {
    this.data = defaultState();
    this.flush();
  }

  // A single action (catching a fish, say) can trigger several of these
  // in a row - consuming bait, adding the catch, adding coins each call
  // this once. JSON.stringify-ing the whole save (which only grows as
  // more catches pile up over a session) and writing it to localStorage
  // is synchronous and was being paid on every single one of those calls
  // - the real cause of the game periodically freezing for a moment.
  // Coalescing a burst of calls into one write shortly after keeps the
  // same "always saved" guarantee without paying that cost per mutation.
  save() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this.flush();
    }, 200);
  }

  // Writes immediately, bypassing the debounce - for moments that need
  // the save to be durable right now (a wipe, or the tab closing).
  flush() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    const raw = JSON.stringify(this.data);
    localStorage.setItem(STORAGE_KEY, raw);
    localStorage.setItem(CHECKSUM_KEY, hashState(raw));
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
    this.data.discoveredFish[itemId] = true;
    this.save();
    return uid;
  }

  isDiscovered(itemId) {
    return !!this.data.discoveredFish[itemId];
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
