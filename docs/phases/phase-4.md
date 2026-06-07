# Phase 4: Economy, Progression & Shop

## Current State (After Phase 3)
The full Metro Police gameplay loop works:
- MainMenuScene (New Game / Continue / Settings)
- CharacterSelectScene (Police playable, Rider/Driver "Coming Soon")
- 10 police missions playable: patrol, pursuit, investigate, escort
- MissionManager tracks objectives, timers, completion, failure
- PursuitSystem for chase mechanics (FareEvader NPCs flee intelligently)
- PatrolSystem for checkpoint-based missions
- SuspiciousNPC for investigation missions
- RadioDisplay shows dispatch messages with typewriter effect
- MissionTracker HUD shows active objectives and timer
- MissionBriefScene and MissionCompleteScene for mission flow
- All Phase 0–2 systems running (world, navigation, NPCs, dialogue)

### Existing Files
All Phase 0 + 1 + 2 files plus:
- `src/scenes/MainMenuScene.ts`, `src/scenes/CharacterSelectScene.ts`
- `src/scenes/MissionBriefScene.ts`, `src/scenes/MissionCompleteScene.ts`
- `src/managers/MissionManager.ts`
- `src/systems/PursuitSystem.ts`, `src/systems/PatrolSystem.ts`
- `src/entities/FareEvader.ts`, `src/entities/SuspiciousNPC.ts`
- `src/ui/MissionTracker.ts`, `src/ui/RadioDisplay.ts`
- `src/data/missions/police-missions.ts`

## Goal
Add the full economy and progression loop. Players earn money from missions, spend it in a shop on items and cosmetics, gain XP, level up, and unlock new content. This makes the game feel rewarding and gives reasons to replay missions or grind for upgrades.

## Tech Stack
Same as Phase 0.

## Coding Standards
Same as Phase 0.

## Deliverables

### 1. EconomyManager

**`src/managers/EconomyManager.ts`**

Handles all money transactions.

**Properties:**
- `wallet: number` — current money balance (read from PlayerSave.wallet)

**Methods:**
- `init(save: PlayerSave): void` — loads wallet from save
- `getBalance(): number` — returns current wallet
- `earn(amount: number, source: string): boolean`:
  1. Add amount to wallet
  2. Update PlayerSave.wallet via SaveManager
  3. Update stats.totalMoneyEarned
  4. Emit GameEvents.MONEY_EARNED with { amount, source, newBalance }
  5. Return true

- `spend(amount: number, itemId: string): boolean`:
  1. If wallet < amount, return false
  2. Subtract amount from wallet
  3. Update PlayerSave.wallet via SaveManager
  4. Update stats.totalMoneySpent
  5. Emit GameEvents.MONEY_SPENT with { amount, itemId, newBalance }
  6. Return true

- `canAfford(amount: number): boolean` — returns wallet >= amount

Instantiated in BootScene, stored in registry as `'economyManager'`.

### 2. ProgressionManager

**`src/managers/ProgressionManager.ts`**

Handles XP, leveling, and unlock calculations.

**Properties:**
- `currentClass: CharacterClass` — the active class
- `classProgress: ClassProgress` — reference to active class progress in save

**Methods:**
- `init(save: PlayerSave): void` — loads class progress for selected class

- `addXP(amount: number, source: string): { leveledUp: boolean; newLevel: number; xpGained: number }`:
  1. Apply XP multiplier from equipped items (if any have xp_multiplier effect)
  2. Add XP to classProgress.xp
  3. Update stats.totalXpEarned
  4. Check if xp >= xpToNextLevel:
     - If yes: level up, subtract xpToNextLevel from xp, recalculate xpToNextLevel
     - Can level up multiple times in one call (loop)
  5. Emit GameEvents.XP_EARNED with { amount, source }
  6. If leveled up: emit GameEvents.LEVEL_UP with { newLevel }
  7. Save via SaveManager
  8. Return result object

- `getLevel(): number` — returns classProgress.level
- `getXP(): number` — returns classProgress.xp
- `getXPToNextLevel(): number` — returns classProgress.xpToNextLevel
- `getXPProgress(): number` — returns xp / xpToNextLevel (0 to 1)
- `isMaxLevel(): boolean` — returns level >= MAX_LEVEL

- `calculateXPRequired(level: number): number`:
  - Level 1: 0 (start)
  - Level 2+: `Math.floor(BASE_XP * Math.pow(XP_GROWTH, level - 2))`
  - Uses BASE_XP=200, XP_GROWTH=1.2 from balance.ts

- `checkUnlocks(): string[]`:
  - After level up, check which missions/items/skins are newly unlocked
  - Returns array of newly unlocked IDs
  - Updates classProgress.unlockedMissionIds

- `equipItem(itemId: string): boolean`:
  1. Verify item is in ownedItems
  2. Check if same-type item already equipped (only 1 per type)
  3. Add to equippedItems, remove previous same-type if any
  4. Save
  5. Return true/false

- `unequipItem(itemId: string): boolean`:
  1. Remove from equippedItems
  2. Save
  3. Return true

- `getEquippedEffects(): ItemEffect[]`:
  - Gather all effects from all equipped items
  - Return combined array

- `purchaseItem(itemId: string): boolean`:
  1. Look up ItemDefinition
  2. Check level requirement met
  3. Check not already owned
  4. Call economyManager.spend(item.price, itemId)
  5. If spend succeeds: add to ownedItems, save
  6. Emit GameEvents.ITEM_PURCHASED
  7. Return true/false

- `purchaseSkin(skinId: string): boolean`:
  - Same as purchaseItem but for skins
  - Emit ITEM_PURCHASED

- `equipSkin(skinId: string): boolean`:
  1. Verify skin is owned
  2. Set activeSkinId = skinId
  3. Save
  4. Return true

Instantiated in BootScene, stored in registry as `'progressionManager'`.

### 3. ShopScene

**`src/scenes/ShopScene.ts`** — Phaser.Scene (key: `'ShopScene'`):

Browse and purchase items and cosmetic skins.

**Accessed from:** GameScene pause menu or a "SHOP" button in HUDScene (when no mission is active).

**Visual layout:**
- Dark background (COLOR_UI_BACKGROUND)
- Title "TRANSIT SUPPLY" at top
- Two tabs: "EQUIPMENT" and "SKINS" (toggle between item types)
- Back button (top-left) → return to previous scene

**Equipment tab:**
- Scrollable list of items for current class
- Each item card shows:
  - Item icon (SpriteConfig rendered as colored shape)
  - Name and rarity (color-coded: common=white, uncommon=green, rare=blue, epic=purple)
  - Description text
  - Effect text (e.g., "+25% detection range")
  - Price in gold text, or "OWNED" in green, or "LEVEL X REQUIRED" in red
  - "BUY" button (orange) if affordable + level met + not owned
  - "EQUIP" button (blue) if owned but not equipped
  - "EQUIPPED" label (green) if currently equipped

**Skins tab:**
- Similar layout but for cosmetic skins
- Each skin card shows:
  - Larger character sprite preview using the skin's colors
  - Name
  - Price or "OWNED" or "LEVEL X REQUIRED"
  - "BUY" / "EQUIP" / "EQUIPPED" buttons

**Purchase flow:**
1. Player taps "BUY"
2. Confirmation popup: "Buy {item} for ${price}?"
3. On confirm: call progressionManager.purchaseItem/purchaseSkin
4. On success: play purchase animation (coin shower), update card to show "OWNED"
5. On fail (insufficient funds): shake the price text, show "Not enough money" toast

### 4. StatsScene

**`src/scenes/StatsScene.ts`** — Phaser.Scene (key: `'StatsScene'`):

View player statistics and progress.

**Accessed from:** MainMenuScene or pause menu.

**Visual layout:**
- Dark background
- Title "OFFICER STATS" at top
- Back button → return to previous scene
- Class badge/icon + name + level display
- XP bar showing progress to next level

**Stats displayed:**
- Level: X / MAX_LEVEL
- Total Play Time: HH:MM:SS
- Missions Completed: X
- Missions Failed: X
- Total Money Earned: $X
- Total Money Spent: $X
- Current Balance: $X
- Total XP Earned: X
- NPCs Caught: X (police stat)
- Completion: X/10 missions

All values read from PlayerSave.stats and ClassProgress.

### 5. MoneyDisplay HUD

**`src/ui/MoneyDisplay.ts`**

Shows current wallet balance in the HUD.

**Visual:**
- Positioned top-right, below minimap
- Small gold circle icon (coin) + "$X" text in COLOR_UI_MONEY (#ffd700)
- When money changes: animate the number counting up/down
- Brief "+$X" or "-$X" popup text that floats up and fades (green for earn, red for spend)

**Methods:**
- `setBalance(amount: number): void` — updates display
- `animateChange(delta: number): void` — shows the +/- popup
- `update(delta: number): void` — handles animation

Added to HUDScene. Listens for GameEvents.MONEY_EARNED and MONEY_SPENT.

### 6. XPBar HUD

**`src/ui/XPBar.ts`**

Shows XP progress and level in the HUD.

**Visual:**
- Positioned below MoneyDisplay
- "LVL X" text in white
- Horizontal progress bar (COLOR_UI_XP purple fill on dark background)
- Bar width represents XP progress to next level (0% to 100%)
- On XP gain: bar fills with smooth tween animation
- On level up: bar flashes gold, "LEVEL UP!" text appears briefly, bar resets to 0

**Methods:**
- `setLevel(level: number): void`
- `setProgress(progress: number): void` — 0 to 1
- `animateLevelUp(): void` — gold flash + text
- `update(delta: number): void`

Added to HUDScene. Listens for GameEvents.XP_EARNED and LEVEL_UP.

### 7. NotificationToast

**`src/ui/NotificationToast.ts`**

Generic popup notification system for game events.

**Visual:**
- Slides in from top of screen
- Rounded rectangle background (color varies by type)
- Icon + message text
- Auto-hides after 3 seconds with slide-out animation
- Stacks: multiple toasts queue up, showing one at a time

**Types:**
- `level_up` — purple background, star icon, "LEVEL UP! Now Level X"
- `mission_unlock` — orange background, badge icon, "New Mission Unlocked: {name}"
- `item_unlock` — blue background, item icon, "New Item Available: {name}"
- `purchase` — gold background, coin icon, "Purchased: {name}"
- `achievement` — green background, trophy icon, "{text}"

**Methods:**
- `show(type: string, message: string): void` — queues a notification
- `update(delta: number): void` — handles display and queue

Added to HUDScene. Listens for LEVEL_UP, MISSION_UNLOCKED, ITEM_PURCHASED events.

### 8. Police Items Data

**`src/data/items/police-items.ts`** — Exports `ItemDefinition[]`:

```typescript
[
  {
    id: 'police_radio_1',
    name: 'Standard Radio',
    description: 'Basic police radio. Gets the job done.',
    classRequired: 'police',
    type: 'equipment',
    rarity: 'common',
    price: 0,
    levelRequired: 1,
    effects: [{ stat: 'detection_range', modifier: 100 }],
    icon: { shape: 'rect', primaryColor: '#555555', secondaryColor: '#333333', size: 16 }
  },
  {
    id: 'police_radio_2',
    name: 'Long-Range Radio',
    description: 'Extended range for tracking suspects across stations.',
    classRequired: 'police',
    type: 'equipment',
    rarity: 'uncommon',
    price: 500,
    levelRequired: 2,
    effects: [{ stat: 'detection_range', modifier: 125 }],
    icon: { shape: 'rect', primaryColor: '#1565c0', secondaryColor: '#0d47a1', size: 16 }
  },
  {
    id: 'police_shoes_1',
    name: 'Running Shoes',
    description: 'Lightweight tactical boots. Faster on foot.',
    classRequired: 'police',
    type: 'equipment',
    rarity: 'common',
    price: 300,
    levelRequired: 1,
    effects: [{ stat: 'speed', modifier: 1.10 }],
    icon: { shape: 'rect', primaryColor: '#ff6f00', secondaryColor: '#e65100', size: 16 }
  },
  {
    id: 'police_vest_1',
    name: 'Tactical Vest',
    description: 'Extra stamina for long chases.',
    classRequired: 'police',
    type: 'equipment',
    rarity: 'rare',
    price: 800,
    levelRequired: 3,
    effects: [{ stat: 'stamina', modifier: 1.20 }],
    icon: { shape: 'rect', primaryColor: '#2e7d32', secondaryColor: '#1b5e20', size: 16 }
  },
  {
    id: 'police_badge_1',
    name: 'Detective Badge',
    description: 'Earn more experience from every action.',
    classRequired: 'police',
    type: 'equipment',
    rarity: 'epic',
    price: 1500,
    levelRequired: 5,
    effects: [{ stat: 'xp_multiplier', modifier: 1.15 }],
    icon: { shape: 'badge', primaryColor: '#ffd700', secondaryColor: '#ff8f00', size: 16 }
  }
]
```

### 9. Police Skins Data

**`src/data/skins.ts`** — Exports `SkinDefinition[]`:

```typescript
[
  {
    id: 'police_skin_default',
    name: 'Standard Blue',
    classRequired: 'police',
    price: 0,
    levelRequired: 1,
    spriteConfig: { shape: 'rect', primaryColor: '#1a237e', secondaryColor: '#283593', size: 12 }
  },
  {
    id: 'police_skin_plain',
    name: 'Plainclothes',
    classRequired: 'police',
    price: 1000,
    levelRequired: 3,
    spriteConfig: { shape: 'rect', primaryColor: '#616161', secondaryColor: '#424242', size: 12 }
  },
  {
    id: 'police_skin_gold',
    name: 'Gold Shield',
    classRequired: 'police',
    price: 2500,
    levelRequired: 5,
    spriteConfig: { shape: 'rect', primaryColor: '#1a237e', secondaryColor: '#ffd700', size: 12 }
  }
]
```

### 10. Integration: Mission Rewards

Modify MissionManager and MissionCompleteScene to actually award rewards:

**When a mission completes successfully:**
1. MissionManager emits MISSION_COMPLETED with rewards data
2. GameScene (or a listener) calls:
   - `economyManager.earn(rewards.money + bonusMoney, missionId)`
   - `progressionManager.addXP(rewards.xp + bonusXp, missionId)`
   - For each itemId in rewards.itemIds: add to ownedItems directly
3. MissionCompleteScene shows animated money/XP counting up
4. If level up occurred: NotificationToast shows "LEVEL UP" + any new unlocks

**When a mission fails:**
- No rewards
- Stats updated (missionsFailedCount)

### 11. Integration: Item Effects on Player

Modify Player.ts to apply equipped item effects:

- On game start (and after equip/unequip):
  1. Get equipped effects from progressionManager.getEquippedEffects()
  2. Apply speed modifier: `this.speed = PLAYER_SPEED * speedModifier` (default 1.0)
  3. Apply stamina modifier: `this.maxStamina = PLAYER_STAMINA_MAX * staminaModifier`
  4. Apply detection range: update PursuitSystem catch radius
  5. Apply XP multiplier: stored in ProgressionManager, applied on XP gain

### 12. Integration: Skin Rendering

Modify Player sprite when skin changes:
- In Player constructor and on skin equip:
  1. Look up SkinDefinition by activeSkinId
  2. Regenerate player texture using skin's colors
  3. Apply new texture to sprite

## Files Created in This Phase

| File | Purpose |
|------|---------|
| `src/managers/EconomyManager.ts` | Money transactions |
| `src/managers/ProgressionManager.ts` | XP, levels, unlocks, items, skins |
| `src/scenes/ShopScene.ts` | Item/skin store |
| `src/scenes/StatsScene.ts` | Player statistics display |
| `src/ui/MoneyDisplay.ts` | Wallet HUD element |
| `src/ui/XPBar.ts` | XP progress HUD element |
| `src/ui/NotificationToast.ts` | Popup notification system |
| `src/data/items/police-items.ts` | Police item definitions |
| `src/data/skins.ts` | Skin definitions |

## Files Modified in This Phase

| File | Change |
|------|--------|
| `src/scenes/BootScene.ts` | Add EconomyManager + ProgressionManager to registry |
| `src/scenes/GameScene.ts` | Add shop access button, integrate economy/progression listeners |
| `src/scenes/HUDScene.ts` | Add MoneyDisplay, XPBar, NotificationToast components |
| `src/scenes/MissionCompleteScene.ts` | Wire up actual reward distribution (money + XP + items) |
| `src/managers/MissionManager.ts` | Emit rewards on completion, trigger unlock checks |
| `src/entities/Player.ts` | Apply item effects to speed/stamina; update sprite from skin |
| `src/systems/PursuitSystem.ts` | Read catch_radius from equipped item effects |
| `src/config/game-config.ts` | Register ShopScene, StatsScene |

## Acceptance Criteria

1. Completing Mission 1 awards $100 and 50 XP — visible in HUD
2. Money display shows current balance, animates on earn/spend
3. XP bar fills smoothly on XP gain
4. Reaching 200 XP triggers level up to Level 2: notification toast, bar resets, "Rush Hour Patrol" mission unlocks
5. ShopScene accessible from HUD button (when no mission active)
6. ShopScene shows all 5 items: Standard Radio (owned), Long-Range Radio ($500, level 2), Running Shoes ($300), Tactical Vest ($800, level 3 locked), Detective Badge ($1500, level 5 locked)
7. Buying Running Shoes: balance decreases by $300, item marked "OWNED", equip button appears
8. Equipping Running Shoes: player moves 10% faster (visible difference)
9. Cannot buy items when insufficient funds or level too low
10. ShopScene skins tab shows 3 skins: Standard Blue (equipped), Plainclothes (level 3 locked), Gold Shield (level 5 locked)
11. Equipping a skin changes the player sprite colors
12. StatsScene shows all stats accurately (play time, missions, money, XP, etc.)
13. Mission 10 completion awards Gold Shield skin directly to inventory
14. Level-up unlocks are accurate per the XP table (Level 2=200 XP, Level 3=440, etc.)
15. All economic state persists across sessions (close browser, reopen, balance preserved)
16. No way to go negative on money
17. No TypeScript errors, no console errors
