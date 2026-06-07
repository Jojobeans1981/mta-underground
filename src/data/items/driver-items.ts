import { ItemDefinition, SkinDefinition } from '@/types/game.types';

export const DRIVER_ITEMS: ItemDefinition[] = [
  {
    id: 'driver_mirror_1', name: 'Standard Mirrors', description: 'Basic side mirrors. See what is behind you.',
    classRequired: 'driver', type: 'equipment', rarity: 'common', price: 0, levelRequired: 1,
    effects: [{ stat: 'detection_range', modifier: 80 }],
    icon: { shape: 'rect', primaryColor: '#78909c', secondaryColor: '#546e7a', size: 16 },
  },
  {
    id: 'driver_mirror_2', name: 'Wide-Angle Mirrors', description: 'See further and wider. Spot stops earlier.',
    classRequired: 'driver', type: 'equipment', rarity: 'uncommon', price: 450, levelRequired: 2,
    effects: [{ stat: 'detection_range', modifier: 120 }],
    icon: { shape: 'rect', primaryColor: '#1565c0', secondaryColor: '#0d47a1', size: 16 },
  },
  {
    id: 'driver_seat_1', name: 'Ergonomic Seat', description: 'Better comfort means better stamina.',
    classRequired: 'driver', type: 'equipment', rarity: 'common', price: 350, levelRequired: 1,
    effects: [{ stat: 'stamina', modifier: 1.15 }],
    icon: { shape: 'rect', primaryColor: '#4e342e', secondaryColor: '#3e2723', size: 16 },
  },
  {
    id: 'driver_engine_1', name: 'Turbo Engine', description: 'More speed between stops.',
    classRequired: 'driver', type: 'equipment', rarity: 'rare', price: 900, levelRequired: 3,
    effects: [{ stat: 'speed', modifier: 1.15 }],
    icon: { shape: 'rect', primaryColor: '#d32f2f', secondaryColor: '#b71c1c', size: 16 },
  },
  {
    id: 'driver_gps_1', name: 'Advanced GPS', description: 'Route optimization earns more XP.',
    classRequired: 'driver', type: 'equipment', rarity: 'epic', price: 1400, levelRequired: 5,
    effects: [{ stat: 'xp_multiplier', modifier: 1.18 }],
    icon: { shape: 'rect', primaryColor: '#ffd700', secondaryColor: '#ff8f00', size: 16 },
  },
];

export const DRIVER_SKINS: SkinDefinition[] = [
  {
    id: 'driver_skin_default', name: 'Standard Uniform', classRequired: 'driver', price: 0, levelRequired: 1,
    spriteConfig: { shape: 'rect', primaryColor: '#0d47a1', secondaryColor: '#ff6f00', size: 12 },
  },
  {
    id: 'driver_skin_express', name: 'Express Driver', classRequired: 'driver', price: 900, levelRequired: 3,
    spriteConfig: { shape: 'rect', primaryColor: '#1b5e20', secondaryColor: '#ffd700', size: 12 },
  },
  {
    id: 'driver_skin_veteran', name: 'Veteran Driver', classRequired: 'driver', price: 2200, levelRequired: 5,
    spriteConfig: { shape: 'rect', primaryColor: '#212121', secondaryColor: '#ff6f00', size: 12 },
  },
];
