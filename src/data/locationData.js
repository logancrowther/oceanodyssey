export const LOCATIONS = [
  {
    id: 'sunny_shallows',
    name: 'Sunny Shallows',
    waterColor: 0x3fa9e0,
    skyColor: 0x9fd9f0
  },
  {
    id: 'kelp_forest',
    name: 'Kelp Forest',
    waterColor: 0x1f7a5c,
    skyColor: 0x7fc9c4
  },
  {
    id: 'shipwreck_reef',
    name: 'Shipwreck Reef',
    waterColor: 0x2c6b8f,
    skyColor: 0x8ab0c9
  },
  {
    id: 'deep_abyss',
    name: 'Deep Abyss',
    waterColor: 0x0b1f3a,
    skyColor: 0x2a3b52
  }
];

export function getLocation(id) {
  return LOCATIONS.find((l) => l.id === id);
}
