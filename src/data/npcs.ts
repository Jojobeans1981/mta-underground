import { NPCDefinition } from '@/types/game.types';

export const CIVILIAN_DEFINITIONS: NPCDefinition[] = [
  {
    id: 'civilian_1',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#795548', secondaryColor: '#5d4037', size: 10 },
    speed: 60,
    behaviorPattern: 'wander',
    interactable: true,
    dialogueLines: [
      'Running late again...',
      'Is the downtown train running?',
      'Only in New York...',
      'I have been waiting twenty minutes.',
      'You know when the next bus is?',
    ],
  },
  {
    id: 'civilian_2',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#607d8b', secondaryColor: '#455a64', size: 10 },
    speed: 50,
    behaviorPattern: 'follow_path',
    interactable: true,
    dialogueLines: [
      'Excuse me, coming through!',
      'Watch the closing doors!',
      'Three trains just passed, all full.',
      'This is my stop... wait, no it is not.',
    ],
  },
  {
    id: 'civilian_3',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#ff7043', secondaryColor: '#e64a19', size: 10 },
    speed: 70,
    behaviorPattern: 'wander',
    interactable: true,
    dialogueLines: [
      'This station always smells weird.',
      'I shoulda taken the bus.',
      'My MetroCard keeps failing.',
      'Signal problems, what else is new.',
    ],
  },
  {
    id: 'civilian_4',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#ab47bc', secondaryColor: '#8e24aa', size: 10 },
    speed: 55,
    behaviorPattern: 'crowd',
    interactable: true,
    dialogueLines: [
      'At least it is not raining down here.',
      'Do not make eye contact...',
      'Is this the right platform?',
      'Another day, another dollar.',
    ],
  },
];

export const FARE_EVADER_DEFINITION: NPCDefinition = {
  id: 'fare_evader_base',
  type: 'fare_evader',
  spriteConfig: { shape: 'rect', primaryColor: '#c62828', secondaryColor: '#b71c1c', size: 10 },
  // Slower than the player's 120 walk (and far below the 180 sprint) so the gap
  // always closes — the chase is winnable without perfect stamina management.
  speed: 110,
  behaviorPattern: 'flee',
  interactable: false,
  dialogueLines: [],
};

export const SUSPICIOUS_PERSON_DEFINITION: NPCDefinition = {
  id: 'suspicious_base',
  type: 'suspicious_person',
  spriteConfig: { shape: 'rect', primaryColor: '#37474f', secondaryColor: '#263238', size: 10 },
  speed: 40,
  behaviorPattern: 'stationary',
  interactable: true,
  dialogueLines: [
    'What are you looking at?',
    'I am just waiting for someone.',
    'Move along, officer.',
    'Mind your own business.',
  ],
};

/** Maps a civilian definition ID to its texture key */
export function getCivilianTextureKey(definitionId: string): string {
  switch (definitionId) {
    case 'civilian_1': return 'npc_civilian_1';
    case 'civilian_2': return 'npc_civilian_2';
    case 'civilian_3': return 'npc_civilian_3';
    case 'civilian_4': return 'npc_civilian_4';
    default: return 'npc_civilian_1';
  }
}

export function getNPCTextureKey(type: string, definitionId: string): string {
  if (type === 'civilian') return getCivilianTextureKey(definitionId);
  if (type === 'fare_evader') return 'npc_fare_evader';
  if (type === 'suspicious_person') return 'npc_suspicious';
  return 'npc_civilian_1';
}
