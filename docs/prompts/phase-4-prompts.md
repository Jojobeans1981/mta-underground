# Phase 4 — Implementation Prompts

## Prompt 4.1: EconomyManager

**Create:** `src/managers/EconomyManager.ts`

See phase-4.md for complete spec.

**Imports:** PlayerSave from types, SaveManager, GameEvents

**Properties:** wallet (number), saveManager reference, game event emitter reference

**Methods:**
- `init(save: PlayerSave, saveManager: SaveManager, events: Phaser.Events.EventEmitter): void` — load wallet from save
- `getBalance(): number`
- `earn(amount: number, source: string): boolean` — add to wallet, update save, update stats.totalMoneyEarned, emit MONEY_EARNED
- `spend(amount: number, itemId: string): boolean` — if wallet < amount return false. Subtract, save, emit MONEY_SPENT
- `canAfford(amount: number): boolean`

**Modify `src/scenes/BootScene.ts`:** Create EconomyManager, init with save data, store in registry.

**Acceptance:** earn/spend work. Balance persists via save. Events emitted.

---

## Prompt 4.2: ProgressionManager

**Create:** `src/managers/ProgressionManager.ts`

See phase-4.md for complete spec. This is the largest manager.

**Imports:** PlayerSave, ClassProgress, CharacterClass, ItemDefinition, ItemEffect, SkinDefinition from types. SaveManager. Balance functions. GameEvents. Item/skin data.

**Methods:**
- `init(save: PlayerSave, saveManager: SaveManager, events: Phaser.Events.EventEmitter): void`
- `addXP(amount, source): { leveledUp, newLevel, xpGained }` — apply XP multiplier from equipped items, add XP, check level-up (loop for multi-level), emit events, save
- `getLevel()`, `getXP()`, `getXPToNextLevel()`, `getXPProgress()`, `isMaxLevel()`
- `calculateXPRequired(level)` — uses formula from balance.ts
- `checkUnlocks(): string[]` — check what missions/items/skins newly unlocked at current level
- `equipItem(itemId): boolean`, `unequipItem(itemId): boolean`
- `getEquippedEffects(): ItemEffect[]`
- `purchaseItem(itemId): boolean` — check level + funds, call economyManager.spend, add to ownedItems
- `purchaseSkin(skinId): boolean`
- `equipSkin(skinId): boolean`
- `getOwnedItems(): string[]`, `getEquippedItems(): string[]`, `getOwnedSkins(): string[]`, `getActiveSkin(): string`

**Modify `src/scenes/BootScene.ts`:** Create ProgressionManager, init, store in registry.

**Acceptance:** XP gain causes level-ups. Items purchasable/equippable. Unlocks calculated correctly. Level 2 at 200 XP, level 3 at 440 cumulative.

---

## Prompt 4.3: ShopScene

**Create:** `src/scenes/ShopScene.ts`

Scene key: `'ShopScene'`. See phase-4.md for complete visual spec.

- Title "TRANSIT SUPPLY"
- Two tabs: "EQUIPMENT" / "SKINS"
- Back button → return to previous scene
- Equipment tab: scrollable list of items, each card shows icon, name, rarity color, description, effects, price/OWNED/LOCKED, BUY/EQUIP/EQUIPPED buttons
- Skins tab: same layout with character preview
- Purchase flow: confirmation dialog → economyManager/progressionManager calls → success animation or error
- All data from police-items.ts and skins.ts

**Modify `src/main.ts`:** Add ShopScene.
**Modify `src/scenes/GameScene.ts` or HUDScene:** Add "SHOP" button accessible when no mission active.

**Acceptance:** All 5 items and 3 skins displayed correctly. Purchase, equip, and state all work. Price checks enforced.

---

## Prompt 4.4: StatsScene

**Create:** `src/scenes/StatsScene.ts`

Scene key: `'StatsScene'`. See phase-4.md.

- "OFFICER STATS" title
- Back button
- Display: Level, play time, missions completed/failed, money earned/spent/balance, XP earned, NPCs caught, completion %
- All from PlayerSave.stats and ClassProgress
- XP bar showing progress to next level

**Modify `src/main.ts`:** Add StatsScene.

**Acceptance:** All stats display accurately from save data. XP bar fills correctly.

---

## Prompt 4.5: HUD Economy Components

**Create:** `src/ui/MoneyDisplay.ts`, `src/ui/XPBar.ts`, `src/ui/NotificationToast.ts`

### MoneyDisplay
- Top-right, below minimap
- Gold coin icon + "$X" text
- Animate counting on change
- "+$X" / "-$X" popup that floats up and fades
- Listens for MONEY_EARNED/MONEY_SPENT events

### XPBar
- Below MoneyDisplay
- "LVL X" text + horizontal purple progress bar
- Smooth fill tween on XP gain
- Level-up: flash gold, "LEVEL UP!" text, bar resets
- Listens for XP_EARNED/LEVEL_UP events

### NotificationToast
- Slides in from top of screen
- Types: level_up (purple), mission_unlock (orange), item_unlock (blue), purchase (gold)
- Auto-hides after 3s
- Queue system: shows one at a time, next queued toast shows after current hides
- Listens for LEVEL_UP, MISSION_UNLOCKED, ITEM_PURCHASED events

**Modify `src/scenes/HUDScene.ts`:** Create all three, add to scene, call update(delta) on each.

**Acceptance:** Money display updates on earn/spend. XP bar fills and triggers level-up animation. Toasts show and queue correctly.

---

## Prompt 4.6: Items & Skins Data

**Create:** `src/data/items/police-items.ts`, `src/data/skins.ts`

### police-items.ts
Export `POLICE_ITEMS: ItemDefinition[]` with exactly these 5 items (copy from phase-4.md):
1. Standard Radio ($0, lvl 1, detection_range 100)
2. Long-Range Radio ($500, lvl 2, detection_range 125)
3. Running Shoes ($300, lvl 1, speed 1.10)
4. Tactical Vest ($800, lvl 3, stamina 1.20)
5. Detective Badge ($1500, lvl 5, xp_multiplier 1.15)

### skins.ts
Export `POLICE_SKINS: SkinDefinition[]` with exactly 3 skins (copy from phase-4.md):
1. Standard Blue ($0, lvl 1)
2. Plainclothes ($1000, lvl 3)
3. Gold Shield ($2500, lvl 5)

**Acceptance:** Arrays have correct length and all fields match spec.

---

## Prompt 4.7: Phase 4 Integration

**Modify existing files:**

### MissionManager / MissionCompleteScene
- When mission completes: call `economyManager.earn(rewards.money + bonusMoney, missionId)` and `progressionManager.addXP(rewards.xp + bonusXp, missionId)`
- For reward itemIds: add directly to ownedItems

### Player.ts
- On game start and after equip/unequip: call `applyItemEffects(progressionManager.getEquippedEffects())`
- On skin change: regenerate player texture with skin colors

### PursuitSystem
- Read catch_radius from equipped item effects (detection_range stat)

### GameScene
- Listen for LEVEL_UP to check new mission unlocks
- Update available missions when level changes

**Acceptance:**
1. Complete mission → money + XP awarded → visible in HUD
2. Level up at correct XP thresholds
3. Buy items → equip → player stats change (speed, stamina visible)
4. Skins change player appearance
5. All persists across sessions

---

## Phase 4 Summary

| Prompt | Files | Description |
|--------|-------|-------------|
| 4.1 | 1 manager + mods | EconomyManager — money transactions |
| 4.2 | 1 manager + mods | ProgressionManager — XP, levels, items, skins |
| 4.3 | 1 scene + mods | ShopScene — item/skin store |
| 4.4 | 1 scene + mods | StatsScene — player statistics |
| 4.5 | 3 UI + mods | MoneyDisplay, XPBar, NotificationToast |
| 4.6 | 2 data files | Police items + skins definitions |
| 4.7 | Modifications | Wire rewards, item effects, skin rendering |
