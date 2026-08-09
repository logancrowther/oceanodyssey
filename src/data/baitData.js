// Just one bait for now - Prawns. More (and probability tuning) come later.
export const BAIT = [
  { id: 'prawn', name: 'Prawns', cost: 5, packSize: 6 }
];

export function getBait(id) {
  return BAIT.find((b) => b.id === id);
}
