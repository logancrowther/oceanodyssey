// Line-length upgrades are an open-ended, repeatable purchase rather than a
// fixed tier ladder. The first few purchases deliberately add LESS reach
// each time than later ones do - a brand new player buying their very first
// upgrade shouldn't leap straight from 75m to 225m in a single purchase.
// From SMALL_STEP_COUNT onward the jump opens up to the bigger step, so
// reaching genuinely deep water (the Angler Fish's 4000m) still doesn't take
// an absurd number of purchases once the early smoothing has done its job.
// GameState.data.lineLengthTier just counts how many times it's been bought
// so far.
const BASE_DEPTH = 900; // starting line, no purchases yet (world px) - 75m
const SMALL_STEP = 900; // 75m - the size of each of the first few upgrades
const SMALL_STEP_COUNT = 5; // how many purchases get the smaller step
const LARGE_STEP = 1800; // 150m - the size of every upgrade after that
// Cost scales directly off the resulting depth rather than compounding off
// the purchase count - buying up to a 2000m reach costs ~$30k as that one
// purchase, not an exponentially-compounded total. (An earlier 1.55x-per-
// purchase compounding model needed ~105 purchases to reach the Angler
// Fish's 4000m and blew up into an astronomical total cost well before
// getting there.)
const COST_PER_METER = 15;

function depthForCount(count) {
  const smallSteps = Math.min(count, SMALL_STEP_COUNT);
  const largeSteps = Math.max(0, count - SMALL_STEP_COUNT);
  return BASE_DEPTH + smallSteps * SMALL_STEP + largeSteps * LARGE_STEP;
}

export function currentUpgrade(count) {
  return { maxDepth: depthForCount(count) };
}

// Always returns the next purchasable upgrade - there's no cap, so unlike
// the old tier table this never runs out.
export function nextUpgrade(count) {
  const maxDepth = depthForCount(count + 1);
  const maxDepthM = Math.round(maxDepth / 12);
  return {
    maxDepth,
    cost: maxDepthM * COST_PER_METER
  };
}
