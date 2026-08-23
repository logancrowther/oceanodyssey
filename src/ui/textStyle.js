// One shared typography system for the whole game: same font, same outline
// technique (fill + stroke, never a drop shadow), just three weights/sizes.
// Every scene's text should come from here instead of hand-rolling its own
// style object, so the game reads as one consistent design instead of a
// patchwork of whatever a given scene happened to use.
const FONT = 'Segoe UI, Arial, sans-serif';
const OUTLINE = '#123244';

function base(fontSize, extra) {
  return {
    fontFamily: FONT,
    fontSize,
    color: '#ffffff',
    stroke: OUTLINE,
    strokeThickness: 3,
    ...extra
  };
}

// Big scene titles ("Abyssal Odyssey", "Choose a Fishing Spot", ...).
export function heading(fontSize = '30px', extra = {}) {
  return base(fontSize, { fontStyle: 'bold', strokeThickness: 5, ...extra });
}

// Secondary lines: subtitles, in-scene messages.
export function subheading(fontSize = '18px', extra = {}) {
  return base(fontSize, { strokeThickness: 3, ...extra });
}

// Small UI text: status readouts, item labels, captions.
export function label(fontSize = '16px', extra = {}) {
  return base(fontSize, { strokeThickness: 2, ...extra });
}
