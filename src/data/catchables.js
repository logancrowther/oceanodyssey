import { FISH, getFish } from './fishData.js';
import { getJunk } from './junkData.js';

// Fish and junk share the same shape (id/name/baseWeightKg/valuePerKg) even
// though they come from separate data files - this is the one place that
// knows how to look either up by id. (Seaweed is no longer a catchable -
// its data file and model are untouched but unreferenced.)
export function getCatchable(id) {
  return getFish(id) || getJunk(id);
}

// Every fish's rank by average value (1 = single most valuable species in
// the game), computed once from the static FISH list - the same "highest
// value first" ordering the Fishing Index's own rank badge uses. Junk
// (the Old Boot) and bait (Prawn/Squid) are never in FISH, so they simply
// have no rank.
const VALUE_RANK = {};
FISH.slice()
  .sort((a, b) => b.baseWeightKg * b.valuePerKg - a.baseWeightKg * a.valuePerKg || a.name.localeCompare(b.name))
  .forEach((f, i) => {
    VALUE_RANK[f.id] = i + 1;
  });

export function valueRankOf(id) {
  return VALUE_RANK[id] || null;
}

// A species' rarity tier for UI colour-coding, derived purely from its
// value rank above rather than the FISH[].rarity field (which nothing
// else in the game reads) - so the tiers always line up with "how
// valuable is this thing", and adding a new fish re-sorts everyone
// around it automatically instead of needing a hand-picked label. Bands
// widen further down the list (fewer, more exclusive top tiers; the
// long common tail), matching how the Index/Bag/Sell screens read: the
// two rarest things in the game (Megalodon, Humpback Whale) are Mythic,
// the next 33 are Legendary, and it tapers from there.
const RARITY_BANDS = [
  { max: 2, tier: 'mythic' },
  { max: 35, tier: 'legendary' },
  { max: 55, tier: 'epic' },
  { max: 85, tier: 'rare' },
  { max: 130, tier: 'uncommon' }
];

export function rarityTierFor(id) {
  const rank = VALUE_RANK[id];
  if (rank == null) return 'common';
  const band = RARITY_BANDS.find((b) => rank <= b.max);
  return band ? band.tier : 'common';
}

// Panel fill/stroke/tag-text colour per tier for the grid/list boxes in
// the Fishing Index, Bag, and Sell screens - kept deliberately muted
// (dark, low-saturation) so they read as a tint of the game's own panel
// colour rather than a saturated paint swatch; `tag` is a touch brighter
// than `stroke` so the label text stays legible against the fill.
// `common` is deliberately left as this game's original panel colour
// ("just normal", not a distinct hue) since most of the roster sits there.
// `glow` is the same hue as `tag` (just numeric, for Graphics.fillStyle
// rather than a CSS text colour) - used behind the catch-reveal art.
export const RARITY_COLORS = {
  common: { fill: 0x145a73, stroke: 0x0c3446, tag: '#7fa8bd', glow: 0x7fa8bd },
  uncommon: { fill: 0x1e4a37, stroke: 0x336a4d, tag: '#7fd1a0', glow: 0x7fd1a0 },
  rare: { fill: 0x1c3a5c, stroke: 0x33568a, tag: '#7fb2e8', glow: 0x7fb2e8 },
  epic: { fill: 0x362a4c, stroke: 0x54406e, tag: '#c19ee8', glow: 0xc19ee8 },
  legendary: { fill: 0x4c4020, stroke: 0x6e5c2e, tag: '#e8cc6a', glow: 0xe8cc6a },
  mythic: { fill: 0x4c2424, stroke: 0x6e3636, tag: '#e88a8a', glow: 0xe88a8a }
};

// Display name for each tier's tag ("Mythical" rather than "mythic" to
// match how the game talks about it everywhere else).
export const RARITY_LABELS = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythical'
};

export function rarityColorFor(id) {
  return RARITY_COLORS[rarityTierFor(id)];
}

export function rarityLabelFor(id) {
  return RARITY_LABELS[rarityTierFor(id)];
}

// How much bigger or smaller than its "icon" size a specific catch should
// be drawn, based on how its actual rolled weight compares to its species'
// average - so a 3.2kg Flathead visibly dwarfs a 1kg one instead of every
// catch of a species looking identical regardless of size. Clamped so an
// extreme roll still reads as recognizably the same creature, just at the
// edge of the size range, rather than distorting into something silly.
export function sizeScaleFor(id, weightKg) {
  const info = getCatchable(id);
  if (!info || !info.baseWeightKg || !weightKg) return 1;
  const ratio = weightKg / info.baseWeightKg;
  return Math.min(1.9, Math.max(0.55, ratio));
}
