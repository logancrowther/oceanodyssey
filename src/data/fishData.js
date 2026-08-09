// Just one species for now - more (and rarity/probability tuning) come later.
export const FISH = [
  {
    id: 'flathead',
    name: 'Flathead',
    value: 8,
    // Typical weight for an average-sized one - individual catches roll a
    // size multiplier (see FishingScene.onBite) that scales this up or down.
    baseWeightKg: 1.6,
    // Reel minigame tuning: how many full crank rotations it takes to land
    // it, and how fast it fights back (rotation lost per second) if the
    // player stops cranking. Kept easy for now - real difficulty tuning
    // comes later once there's more than one fish to tell apart.
    turnsRequired: 1.5,
    decayPerSecond: 0.4
  }
];

export function getFish(id) {
  return FISH.find((f) => f.id === id);
}
