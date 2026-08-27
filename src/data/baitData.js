// Prawns and Squid - each species only bites bait it would realistically
// eat (see FISH[].baits in fishData.js and OceanScene's bait-matching
// check), so which one's equipped actually matters, not just whether one is.
//
// Deep Sea Bait, Plastic Lure, Shimmering Lure, and Abyssal Bait are
// never sold directly here (see `crateOnly` and ShopScene's Buy list,
// which filters them out) - the only way to get any of them is a Bait
// Crate roll. All four are universal bait (see
// OceanScene.speciesAcceptsBait) - unlike Prawn/Squid, nothing turns them
// down regardless of what it actually eats, which is the whole point of
// pulling one from a crate instead of just buying more Prawns. Unlike the
// two lures, Deep Sea Bait is real bait, not a reusable lure - it's
// consumed on every catch same as Prawn/Squid, and carries none of the
// lures' own extra "luck".
export const BAIT = [
  { id: 'prawn', name: 'Prawns', cost: 5, packSize: 6 },
  { id: 'squid', name: 'Squid', cost: 8, packSize: 4 },
  { id: 'deep_sea_bait', name: 'Deep Sea Bait', crateOnly: true },
  { id: 'plastic_lure', name: 'Plastic Lure', crateOnly: true },
  { id: 'shimmering_lure', name: 'Shimmering Lure', crateOnly: true },
  { id: 'abyssal_bait', name: 'Abyssal Bait', crateOnly: true }
];

export function getBait(id) {
  return BAIT.find((b) => b.id === id);
}
