// Line-length upgrades are an open-ended, repeatable purchase rather than a
// fixed tier ladder: every purchase adds the same amount of extra reach, but
// costs more than the last (see COST_GROWTH). GameState.data.lineLengthTier
// just counts how many times it's been bought so far.
const BASE_DEPTH = 900; // starting line, no purchases yet (world px)
const DEPTH_PER_UPGRADE = 450; // extra reachable depth (world px) per purchase
const BASE_COST = 40; // cost of the very first upgrade
const COST_GROWTH = 1.55; // each purchase costs this much more than the last

export function currentUpgrade(count) {
  return { maxDepth: BASE_DEPTH + count * DEPTH_PER_UPGRADE };
}

// Always returns the next purchasable upgrade - there's no cap, so unlike
// the old tier table this never runs out.
export function nextUpgrade(count) {
  return {
    maxDepth: BASE_DEPTH + (count + 1) * DEPTH_PER_UPGRADE,
    cost: Math.round(BASE_COST * COST_GROWTH ** count)
  };
}
