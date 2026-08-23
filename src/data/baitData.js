// Prawns and Squid - each species only bites bait it would realistically
// eat (see FISH[].baits in fishData.js and OceanScene's bait-matching
// check), so which one's equipped actually matters, not just whether one is.
export const BAIT = [
  { id: 'prawn', name: 'Prawns', cost: 5, packSize: 6 },
  { id: 'squid', name: 'Squid', cost: 8, packSize: 4 }
];

export function getBait(id) {
  return BAIT.find((b) => b.id === id);
}
