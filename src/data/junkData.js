// Junk you can snag on the hook instead of an actual bite - same odds and
// same reel-in fight as a real fish, just not worth much.
export const JUNK = [
  {
    id: 'old_boot',
    name: 'Old Boot',
    baseWeightKg: 0.9,
    valuePerKg: 1.1,
    turnsRequired: 1.4,
    rarity: 'common',
    difficultyMultiplier: 0.8
  }
];

export function getJunk(id) {
  return JUNK.find((j) => j.id === id);
}
