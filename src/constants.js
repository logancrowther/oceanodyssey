// The design/coordinate space every scene lays elements out in - all of the
// game's hardcoded positions (buttons, the island outline, the boat, etc.)
// assume this exact size. The actual game canvas can render at a higher
// pixel density than this (see main.js) for crispness; scenes stay unaware
// of that and just zoom their camera to compensate.
export const DESIGN_WIDTH = 960;
export const DESIGN_HEIGHT = 600;
