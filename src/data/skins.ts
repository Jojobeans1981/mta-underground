import { SkinDefinition } from '@/types/game.types';

export const POLICE_SKINS: SkinDefinition[] = [
  {
    id: 'police_skin_default',
    name: 'Standard Blue',
    classRequired: 'police',
    price: 0,
    levelRequired: 1,
    spriteConfig: { shape: 'rect', primaryColor: '#1a237e', secondaryColor: '#283593', size: 12 },
  },
  {
    id: 'police_skin_plain',
    name: 'Plainclothes',
    classRequired: 'police',
    price: 1000,
    levelRequired: 3,
    spriteConfig: { shape: 'rect', primaryColor: '#616161', secondaryColor: '#424242', size: 12 },
  },
  {
    id: 'police_skin_gold',
    name: 'Gold Shield',
    classRequired: 'police',
    price: 2500,
    levelRequired: 5,
    spriteConfig: { shape: 'rect', primaryColor: '#1a237e', secondaryColor: '#ffd700', size: 12 },
  },
];
