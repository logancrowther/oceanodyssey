// Prawns and Squid - each species only bites bait it would realistically
// eat (see FISH[].baits in fishData.js and OceanScene's bait-matching
// check), so which one's equipped actually matters, not just whether one is.
//
// Deep Sea Bait, Plastic Lure, Shimmering Lure, Colossal Bait, and
// Abyssal Bait are never sold directly here (see `crateOnly` and
// ShopScene's Buy list, which filters them out) - the only way to get any
// of them is a Bait Crate roll. Every one of them but Deep Sea Bait is
// universal (see OceanScene.speciesAcceptsBait) - unlike Prawn/Squid,
// nothing turns any of them down regardless of what it actually eats.
// Deep Sea Bait is real bait, not a reusable lure - it's consumed on
// every catch same as Prawn/Squid, catches exactly what Squid does (not
// universal), and carries only the tiniest bit of the others' extra
// "luck". Colossal Bait carries its own Epic-tier specialty: it skews the
// whole spawn pool toward the biggest species in it (see
// OceanScene.NORMAL_POOL_BIG) - real "big bait catches big fish".
export const BAIT = [
  { id: 'prawn', name: 'Prawns', cost: 5, packSize: 6 },
  { id: 'squid', name: 'Squid', cost: 8, packSize: 4 },
  { id: 'deep_sea_bait', name: 'Deep Sea Bait', crateOnly: true },
  { id: 'plastic_lure', name: 'Plastic Lure', crateOnly: true },
  { id: 'colossal_bait', name: 'Colossal Bait', crateOnly: true },
  { id: 'shimmering_lure', name: 'Shimmering Lure', crateOnly: true },
  { id: 'abyssal_bait', name: 'Abyssal Bait', crateOnly: true }
];

export function getBait(id) {
  return BAIT.find((b) => b.id === id);
}
