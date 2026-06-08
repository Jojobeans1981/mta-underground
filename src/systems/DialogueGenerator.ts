import { AgentPersona, AgentMood, AgentIntent, NeedKind, pick } from '@/data/personas';

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
  /** This resident has met the player before (warmer greeting). */
  knownToPlayer?: boolean;
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
  // Warmer greeting once a resident has met the player before
  private static readonly KNOWN_GREETINGS: string[] = [
    'Hey, it\'s you again! Good to see a familiar face.',
    'Officer! Twice in one day — this neighborhood\'s in good hands.',
    'Oh, hi again. Nice to see you around.',
    'Back so soon? I\'m starting to recognize you.',
  ];

  // --- The Sims: needs ---
  private static readonly NEED_SEEK: Record<NeedKind, string[]> = {
    hunger: ['I\'m starving — need to grab a bite.', 'Could murder a slice right now.', 'Food. I need food.'],
    energy: ['I\'m wiped. Gotta sit down somewhere.', 'So tired I could sleep standing up.', 'Need to rest these feet.'],
    social: ['Could really use some company.', 'It gets lonely in a crowd, you know?', 'Wish I\'d run into a friend.'],
    fun: ['I am so bored. Need something to do.', 'Same routine every day. I need a break.', 'Could use a little fun.'],
  };
  private static readonly NEED_SATISFIED: Record<NeedKind, string[]> = {
    hunger: ['Ahh, that hit the spot.', 'Much better with something in my stomach.', 'Finally, a proper meal.'],
    energy: ['Okay, I can keep going now.', 'That little rest helped.', 'Recharged. Back to it.'],
    social: ['Good to catch up with someone.', 'A little chat goes a long way.', 'Feeling better after that.'],
    fun: ['Ha, needed that.', 'Alright, that was a nice break.', 'Good to blow off some steam.'],
  };

  // --- Witness clues (police questioning) ---
  private static readonly WITNESS_CLUES: string[] = [
    'They bolted toward the downtown platform — red jacket, moving fast!',
    'Yeah, I saw it. They ducked into the station, headed uptown.',
    'Cut through the crowd that way, didn\'t even swipe a card!',
    'Couldn\'t miss it — they ran south, knocked over a trash can.',
  ];

  static knownGreeting(): string { return pick(this.KNOWN_GREETINGS); }
  static needSeekLine(k: NeedKind): string { return pick(this.NEED_SEEK[k]); }
  static needSatisfiedLine(k: NeedKind): string { return pick(this.NEED_SATISFIED[k]); }
  static witnessClue(): string { return pick(this.WITNESS_CLUES); }

  // --- Two-agent social exchanges (NPC-to-NPC) ---
  private static readonly GREETINGS: string[] = [
    'Hey! Long time no see.',
    'Yo, you headed downtown too?',
    'Did you catch the game last night?',
    'You look like you\'re in a hurry.',
    'This line is a mess today, right?',
    'Wait — don\'t I know you?',
    'You hear they\'re fixing the signals again?',
  ];
  private static readonly RESPONSES: string[] = [
    'Ha, tell me about it.',
    'Every single day, I swear.',
    'Yeah, running late as usual.',
    'Good to see you! Gotta run though.',
    'Right? Same old story.',
    'No way, what a coincidence.',
    'Take care, catch you around.',
  ];

  /** A short two-line exchange between two agents. */
  static socialExchange(): { opener: string; response: string } {
    return {
      opener: pick(this.GREETINGS),
      response: pick(this.RESPONSES),
    };
  }

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
      if (ctx.knownToPlayer && Math.random() < 0.7) {
        return this.fill(this.knownGreeting(), ctx);
      }
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
