export const FISH = [
  {
    id: 'flathead',
    name: 'Flathead',
    // Typical weight for an average-sized one - individual catches roll a
    // size multiplier (see FishingScene.onBite) that scales this up or down,
    // and value scales with the resulting weight - a bigger catch is worth
    // more, not a flat price regardless of size.
    baseWeightKg: 1.6,
    valuePerKg: 5,
    // Reel minigame tuning: how many full crank rotations an average-sized
    // one takes to land, before the per-catch size roll and rarity
    // multiplier below scale it further - a bigger, rarer catch pulls
    // harder and takes more cranking than a small common one.
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.3
  },
  {
    id: 'salmon',
    name: 'Salmon',
    // A bigger, more prized catch than the Flathead - heavier on average,
    // worth more per kg, and a noticeably tougher fight (see rarity/
    // difficultyMultiplier below).
    baseWeightKg: 3.2,
    valuePerKg: 9,
    turnsRequired: 2.3,
    rarity: 'rare',
    difficultyMultiplier: 1.6
  },
  {
    id: 'mullet',
    name: 'Mullet',
    // A common, easy-going schooling fish - smaller and cheaper than the
    // Flathead, and the least of a fight to reel in.
    baseWeightKg: 1.3,
    valuePerKg: 4,
    turnsRequired: 1.7,
    rarity: 'common',
    difficultyMultiplier: 1.0
  },
  {
    id: 'bream',
    name: 'Bream',
    // A decent eating fish, a step up from the Mullet - a bit heavier, a
    // bit more valuable, and a bit more of a fight, without matching the
    // Flathead or Salmon.
    baseWeightKg: 1.1,
    valuePerKg: 6,
    turnsRequired: 1.8,
    rarity: 'uncommon',
    difficultyMultiplier: 1.15
  },
  {
    id: 'tuna',
    name: 'Tuna',
    // The big one - heavier than the Salmon, worth the most per kg, and by
    // far the toughest fight of any of them.
    baseWeightKg: 5.5,
    valuePerKg: 12,
    turnsRequired: 2.8,
    rarity: 'rare',
    difficultyMultiplier: 1.9
  },
  {
    id: 'tailor',
    name: 'Tailor',
    // Modest size, but a real scrapper for it - punches above its weight
    // in the reel fight compared to fish of similar size like the Bream.
    baseWeightKg: 1.0,
    valuePerKg: 5.5,
    turnsRequired: 1.9,
    rarity: 'uncommon',
    difficultyMultiplier: 1.35
  },
  {
    id: 'trevally',
    name: 'Trevally',
    // A solid, deep-bodied fish with a real reputation as a hard fighter -
    // noticeably tougher than its size alone would suggest, closing in on
    // the Salmon's own fight despite being a fair bit lighter.
    baseWeightKg: 2.0,
    valuePerKg: 7,
    turnsRequired: 2.1,
    rarity: 'uncommon',
    difficultyMultiplier: 1.45
  },
  {
    id: 'great_white',
    name: 'Great White Shark',
    // The legendary catch - not in the normal bite pool at all (see
    // FishingScene.LARGE_BAIT_IDS/GREAT_WHITE_CHANCE): it only has a
    // chance to bite when fishing with a big fish (a Salmon or Tuna) as
    // bait, and even then it's a rare event, not a guarantee. Enormous,
    // by far the most valuable thing in the game, and the single toughest
    // fight there is.
    baseWeightKg: 220,
    valuePerKg: 15,
    // Turned up well past the Tuna's own numbers (2.8/1.9) on purpose - any
    // shark should be a genuine, sustained struggle to land, not just
    // another fish with a bigger number attached.
    turnsRequired: 4.2,
    rarity: 'legendary',
    difficultyMultiplier: 2.8
  },
  {
    id: 'tiger_shark',
    name: 'Tiger Shark',
    // Also only reachable via a big fish as bait (see
    // FishingScene.LARGE_BAIT_IDS/TIGER_SHARK_CHANCE) - a bit more likely
    // to turn up than the Great White when it's rolled for, but still rare.
    // Smaller and less valuable than the Great White, but every bit as
    // much of a fight to land - every shark in the game is a real
    // struggle, not just the rarest one.
    baseWeightKg: 145,
    valuePerKg: 12,
    turnsRequired: 3.9,
    rarity: 'legendary',
    difficultyMultiplier: 2.6
  }
];

export function getFish(id) {
  return FISH.find((f) => f.id === id);
}
