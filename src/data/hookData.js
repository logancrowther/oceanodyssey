// Hooks are a different kind of owned item from bait (see GameState) -
// boolean ownership, never a count, and never consumed: once you have
// one, you have it forever. Basic Hook is the one every save starts
// with, and can never be fully unequipped (only swapped for a different
// owned hook) - there's always exactly one hook equipped.
export const HOOKS = [
  { id: 'basic_hook', name: 'Basic Hook', tier: 'common' },
  { id: 'advanced_hook', name: 'Advanced Hook', tier: 'rare' },
  { id: 'abyssal_hook', name: 'Abyssal Hook', tier: 'mythic' }
];

export function getHook(id) {
  return HOOKS.find((h) => h.id === id);
}
