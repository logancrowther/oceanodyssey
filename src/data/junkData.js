// Junk that can drift onto the hook alongside real fish - same spawn odds,
// just not worth much. Unlike every fish, it's not alive: it never flees a
// fast-moving hook (see OceanScene.updateSwimmers), so difficultyMultiplier
// here is unused.
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
