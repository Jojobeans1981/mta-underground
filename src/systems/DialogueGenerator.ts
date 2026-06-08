import { AgentPersona, AgentMood, AgentIntent, pick } from '@/data/personas';

export type TimePhase = 'dawn' | 'morning' | 'midday' | 'evening' | 'night';
export type WeatherKind = 'clear' | 'rain' | 'snow' | 'fog';

export interface DialogueContext {
  persona: AgentPersona;
  mood: AgentMood;
  intent: AgentIntent;
  timePhase: TimePhase;
  weather: WeatherKind;
  playerIsPolice: boolean;
  /** Strong situational reactions override the normal chatter. */
  reactToPlayer?: boolean;
  reactToSiren?: boolean;
  reactToGraffiti?: boolean;
}

/**
 * Procedural, context-aware dialogue.
 *
 * Lines are composed at runtime from the agent's persona + mood + intent and
 * the live world state (time of day, weather, nearby events). It's a generative
 * grammar — a small "generative agent" brain that runs entirely client-side,
 * so the city's chatter is reactive and varied without any LLM API call.
 */
export class DialogueGenerator {
  private static readonly INTENT_LINES: Record<AgentIntent, string[]> = {
    commute_work: [
      'Gonna be late if this train is delayed again.',
      'Third coffee and I still feel dead. Morning shift, you know.',
      'If I miss the express I miss the whole meeting.',
      'Every single morning, the same crush at the turnstiles.',
      'Swipe, run, pray the doors stay open. The {occupation} commute.',
    ],
    commute_home: [
      'Long day. I just want my couch.',
      'Finally clocked out. Heading home before the rush gets worse.',
      'Whoever designed this transfer owes me an apology.',
      'Home, then nothing. That is the plan.',
      'Another shift down. The {occupation} life never stops.',
    ],
    errand: [
      'Just grabbing a few things before the lines get crazy.',
      'I had a list. I lost the list.',
      'Quick errand, then back. Famous last words.',
      'They moved the bodega? Nothing stays the same here.',
    ],
    leisure: [
      'No rush today. For once.',
      'Best people-watching in the world, right here.',
      'Just taking it all in. The city never really stops.',
      'Walking helps me think.',
    ],
    nightlife: [
      'Night is young. The city is just waking up.',
      'Last train or cab money — that is always the question.',
      'You can find anything open at this hour if you know where to look.',
      'The platform is quiet now. I kind of like it.',
    ],
    idle: [
      'Just waiting on someone.',
      'Killing time. You know how it is.',
      'Nice spot to stand and watch the trains roll by.',
      'No place to be for a minute. Rare.',
    ],
  };

  private static readonly MOOD_ASIDES: Record<AgentMood, string[]> = {
    cheerful: ['Honestly? Good day so far.', 'Can\'t complain, can\'t complain.', 'Feeling lucky today.'],
    content: ['It is what it is.', 'Same as always, and that\'s fine.', 'Steady day.'],
    stressed: ['I really do not have time for this.', 'My whole schedule is falling apart.', 'Too much, too fast today.'],
    tired: ['So tired I can barely see straight.', 'Need about three more hours of sleep.', 'Running on fumes.'],
    annoyed: ['Of course. Of course this happens to me.', 'I am this close to losing it.', 'Give me a break, just one.'],
    nervous: ['Keep your head down, keep moving.', 'Something feels off today.', 'I just want to get where I\'m going.'],
  };

  private static readonly WEATHER_LINES: Record<WeatherKind, string[]> = {
    clear: ['At least the weather\'s holding.', 'Clear skies — take it while it lasts.'],
    rain: ['This rain is relentless. Soaked through already.', 'Forgot my umbrella. Naturally.', 'Everyone crams underground when it pours.'],
    snow: ['Snow\'s pretty for about five minutes, then it\'s slush.', 'Cold enough to freeze the rails.', 'Bundle up, it\'s brutal out.'],
    fog: ['Can barely see the end of the platform in this fog.', 'Whole city\'s gone grey and soft.', 'Eerie morning, this fog.'],
  };

  private static readonly OCCUPATION_LINES: string[] = [
    'Twelve years a {occupation} and the trains still surprise me.',
    'You learn the city fast as a {occupation}.',
    'Ask any {occupation} — we live and die by the schedule.',
    'Being a {occupation} in this town is not for the faint of heart.',
  ];

  // --- Reactions (override normal chatter) ---
  private static readonly REACT_POLICE: string[] = [
    'Evening, officer. Everything alright?',
    'Oh — didn\'t see you there, officer.',
    'Just heading home, officer, no trouble here.',
    'Good to see a uniform around. Feels safer.',
    'I didn\'t do anything! ...Sorry. Force of habit.',
  ];
  private static readonly REACT_POLICE_NERVOUS: string[] = [
    'I— I was just leaving. Honest.',
    'Is there a problem, officer?',
    'Whatever you heard, it wasn\'t me.',
  ];
  private static readonly REACT_SIREN: string[] = [
    'You hear that? Something\'s going down.',
    'Sirens again. This block, I swear.',
    'Everybody\'s looking — what happened over there?',
    'Move aside, somebody\'s in a hurry.',
  ];
  private static readonly REACT_GRAFFITI: string[] = [
    'New tag on that wall. The crews are busy lately.',
    'Somebody\'s been marking up the whole station.',
    'That graffiti wasn\'t there yesterday.',
  ];

  /** Generate a single line for the given context. */
  static generate(ctx: DialogueContext): string {
    // Strong reactions take priority
    if (ctx.reactToSiren && Math.random() < 0.85) {
      return this.fill(pick(this.REACT_SIREN), ctx);
    }
    if (ctx.reactToGraffiti && Math.random() < 0.7) {
      return this.fill(pick(this.REACT_GRAFFITI), ctx);
    }
    if (ctx.reactToPlayer && ctx.playerIsPolice && Math.random() < 0.9) {
      const bank = ctx.mood === 'nervous' ? this.REACT_POLICE_NERVOUS : this.REACT_POLICE;
      return this.fill(pick(bank), ctx);
    }

    // Otherwise compose ambient chatter
    const roll = Math.random();
    let base: string;
    if (roll < 0.5) {
      base = pick(this.INTENT_LINES[ctx.intent]);
    } else if (roll < 0.78 && ctx.weather !== 'clear') {
      base = pick(this.WEATHER_LINES[ctx.weather]);
    } else if (roll < 0.88) {
      base = pick(this.OCCUPATION_LINES);
    } else if (ctx.weather === 'clear') {
      base = pick(this.INTENT_LINES[ctx.intent]);
    } else {
      base = pick(this.WEATHER_LINES[ctx.weather]);
    }

    // Sometimes append a mood-colored aside for texture
    if (Math.random() < 0.4) {
      base += ' ' + pick(this.MOOD_ASIDES[ctx.mood]);
    }

    return this.fill(base, ctx);
  }

  private static fill(line: string, ctx: DialogueContext): string {
    return line
      .replace(/\{occupation\}/g, ctx.persona.occupation)
      .replace(/\{name\}/g, ctx.persona.name);
  }
}
