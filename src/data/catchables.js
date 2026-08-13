import { getFish } from './fishData.js';
import { getJunk } from './junkData.js';

// Fish and junk share the same shape (id/name/baseWeightKg/valuePerKg) even
// though they come from separate data files - this is the one place that
// knows how to look either up by id. (Seaweed is no longer a catchable -
// its data file and model are untouched but unreferenced.)
export function getCatchable(id) {
  return getFish(id) || getJunk(id);
}

// How much bigger or smaller than its "icon" size a specific catch should
// be drawn, based on how its actual rolled weight compares to its species'
// average - so a 3.2kg Flathead visibly dwarfs a 1kg one instead of every
// catch of a species looking identical regardless of size. Clamped so an
// extreme roll still reads as recognizably the same creature, just at the
// edge of the size range, rather than distorting into something silly.
export function sizeScaleFor(id, weightKg) {
  const info = getCatchable(id);
  if (!info || !info.baseWeightKg || !weightKg) return 1;
  const ratio = weightKg / info.baseWeightKg;
  return Math.min(1.9, Math.max(0.55, ratio));
}
