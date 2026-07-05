import { expect, test, type Page } from "@playwright/test";

function roomCode(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

async function openParticipant(page: Page, code: string, playerName: string, mode: "create" | "join", role: "dm" | "player") {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByTestId("player-name-input").fill(playerName);
  await page.getByTestId("room-code-input").fill(code);
  await page.getByTestId(role === "dm" ? "join-role-dm" : "join-role-player").check();
  await page.getByTestId(`${mode}-room-button`).click();
  await expect(page.getByTestId("connection-summary")).toContainText(code);
}

async function reconnectParticipant(page: Page, code: string, playerName: string) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByTestId("player-name-input").fill(playerName);
  await page.getByTestId("room-code-input").fill(code);
  await page.getByTestId("join-role-player").check();
  await page.getByTestId("join-room-button").click();
}

async function confirmCharacter(page: Page, raceId: string, classId: string, expectedIdentity: string) {
  await page.getByTestId(`race-card-${raceId}`).click();
  await page.getByTestId(`class-card-${classId}`).click();
  await page.getByTestId("confirm-character-button").click();
  await expect(page.getByTestId("selected-class-label")).toContainText(expectedIdentity);
}

async function waitForPlayRoute(page: Page, code: string) {
  await expect(page).toHaveURL(new RegExp(`/room/${code}/play$`));
}

async function runDebug(page: Page, action: string, ...payload: unknown[]) {
  await page.evaluate(
    ({ actionName, actionPayload }) => {
      const debug = (window as Window & { __lokiDebug?: Record<string, (...values: unknown[]) => void> }).__lokiDebug;

      if (!debug?.[actionName]) {
        throw new Error(`Missing debug hook: ${actionName}`);
      }

      debug[actionName](...actionPayload);
    },
    { actionName: action, actionPayload: payload }
  );
}

async function runDmTool(page: Page, message: Record<string, unknown>) {
  await runDebug(page, "runDmTool", message);
}

async function getLobbySnapshot(page: Page) {
  return page.evaluate(() => {
    const debug = (window as Window & { __lokiDebug?: { getLobbySnapshot?: () => unknown } }).__lokiDebug;
    return debug?.getLobbySnapshot ? debug.getLobbySnapshot() : null;
  });
}

async function completeRoll(page: Page) {
  const rollButton = page.locator('[data-testid^="roll-check-"]:not([disabled])').last();
  await expect(rollButton).toBeVisible();
  await rollButton.click();
}

async function joinAndConfirm(browserPage: Page, code: string, playerName: string, raceId: string, classId: string, expectedIdentity: string) {
  await openParticipant(browserPage, code, playerName, "join", "player");
  await confirmCharacter(browserPage, raceId, classId, expectedIdentity);
}

async function getPlayerId(page: Page, playerName: string) {
  const testId = await page.locator(`[data-testid^="player-card-"][data-player-name="${playerName}"]`).first().getAttribute("data-testid");

  if (!testId) {
    throw new Error(`Could not find player card for ${playerName}.`);
  }

  return testId.replace("player-card-", "");
}

function countOccurrences(text: string, needle: string) {
  return text.split(needle).length - 1;
}

async function getBox(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();

  if (!box) {
    throw new Error(`Missing bounding box for ${testId}.`);
  }

  return box;
}

test("reg scen 1 persists XP, gold, inventory, equipment, and level across reconnect", async ({ browser }) => {
  const code = roomCode("reg-1");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  let playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(playerPage, code, "Alpha", "human", "ranger", "Human Ranger");

  await runDmTool(dmPage, { tool: "createEncounterGroup", name: "Goblin Skirmish", enemyId: "goblin", x: 4, y: 2, mapKey: "adventure" });

  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(playerPage, code);

  await runDmTool(dmPage, { tool: "setMap", mapKey: "adventure" });
  await expect(playerPage.getByTestId("scene-title")).toContainText("Adventure Area");
  await runDmTool(dmPage, { tool: "activateEncounterGroup", encounterId: "encounter-1" });
  await expect(playerPage.getByTestId("turn-order-status")).toContainText("Live");
  await runDebug(dmPage, "runDmCommand", "/victory");

  await runDmTool(dmPage, { tool: "giveReward", name: "gold", target: "player", playerName: "Alpha", amount: 35 });
  await runDmTool(dmPage, { tool: "giveReward", name: "xp", target: "player", playerName: "Alpha", amount: 120 });
  await expect(playerPage.getByTestId("character-level")).toContainText("Level 2");
  await expect(playerPage.getByTestId("character-xp")).toContainText("XP 120");
  await expect(playerPage.getByTestId("party-gold")).toContainText("45");

  await runDebug(dmPage, "runDmCommand", "/scene merchant");
  await expect(playerPage.getByTestId("merchant-items")).toContainText("Leather Armor");
  const buyButton = playerPage.getByTestId("merchant-buy-leather_armor");
  await buyButton.click();
  await expect(playerPage.getByTestId("inventory-panel")).toContainText("Leather Armor");
  await playerPage.getByTestId("equip-item-leather_armor").click();
  await expect(playerPage.getByTestId("character-equipment-summary")).toContainText("Armor: leather_armor");
  await expect(playerPage.getByTestId("party-gold")).toContainText("25");

  await runDmTool(dmPage, { tool: "setMap", mapKey: "camp" });
  await expect(playerPage.getByTestId("scene-title")).toContainText("Camp");

  await playerPage.close();
  playerPage = await context.newPage();
  await reconnectParticipant(playerPage, code, "Alpha");
  await waitForPlayRoute(playerPage, code);
  await expect(playerPage.getByTestId("character-level")).toContainText("Level 2");
  await expect(playerPage.getByTestId("character-xp")).toContainText("XP 120");
  await expect(playerPage.getByTestId("party-gold")).toContainText("25");
  await expect(playerPage.getByTestId("inventory-panel")).toContainText("Leather Armor");
  await expect(playerPage.getByTestId("character-equipment-summary")).toContainText("Armor: leather_armor");

  await context.close();
});

test("reg scen 2 revives a dead character without losing inventory or XP", async ({ browser }) => {
  const code = roomCode("reg-2");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  const playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(playerPage, code, "Bravo", "dwarf", "guardian", "Dwarf Guardian");
  const bravoId = await getPlayerId(dmPage, "Bravo");

  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(playerPage, code);

  await runDmTool(dmPage, { tool: "giveReward", name: "xp", target: "player", playerName: "Bravo", amount: 120 });
  await runDmTool(dmPage, { tool: "giveReward", name: "item", target: "player", playerName: "Bravo", itemId: "healing_potion" });
  await runDmTool(dmPage, { tool: "setMap", mapKey: "camp" });
  await runDmTool(dmPage, { tool: "setPlayerStatus", playerId: bravoId, status: "dead" });

  await expect(playerPage.getByTestId("character-status")).toContainText("dead");
  await expect(playerPage.getByTestId("inventory-panel")).toContainText("Healing Potion");
  await expect(playerPage.getByTestId("character-xp")).toContainText("XP 120");
  await playerPage.getByTestId("camp-revive-button").click();
  await expect(playerPage.getByTestId("character-status")).toContainText("alive");
  await expect(playerPage.getByTestId("inventory-panel")).toContainText("Healing Potion");
  await expect(playerPage.getByTestId("character-xp")).toContainText("XP 120");

  await context.close();
});

test("reg scen 3 blocks a legendary permanently dead character from rejoining", async ({ browser }) => {
  const code = roomCode("reg-3");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  let playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(playerPage, code, "Charlie", "elf", "arcanist", "Elf Arcanist");
  const charlieId = await getPlayerId(dmPage, "Charlie");

  await runDmTool(dmPage, { tool: "setCampaignDifficulty", difficulty: "legendary" });
  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(playerPage, code);

  await runDmTool(dmPage, { tool: "setPlayerStatus", playerId: charlieId, status: "permanentlyDead" });
  await expect(playerPage.getByTestId("character-status")).toContainText("permanentlyDead");

  await playerPage.close();
  playerPage = await context.newPage();
  await reconnectParticipant(playerPage, code, "Charlie");
  await expect(playerPage.getByTestId("status-message")).toContainText("permanently dead");
  await expect(playerPage).toHaveURL(/\/$/);

  await context.close();
});

test("reg scen 4 keeps secrets hidden on failure, reveals on success, and persists after reconnect", async ({ browser }) => {
  const code = roomCode("reg-4");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  let playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(playerPage, code, "Delta", "human", "mystic", "Human Mystic");

  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(playerPage, code);

  await runDmTool(dmPage, { tool: "placeEntity", entityType: "secret_passage_marker", x: 3, y: 2, mapKey: "starting", visibilityState: "hidden" });
  await runDmTool(dmPage, {
    tool: "createSecret",
    checkType: "investigation",
    dc: 12,
    description: "A hidden passage opens behind the stones.",
    linkedEntityId: "entity-1"
  });

  await runDmTool(dmPage, {
    tool: "createSkillCheck",
    checkType: "investigation",
    dc: 99,
    title: "Search the wall",
    description: "Look for a hidden mechanism.",
    target: "player",
    playerName: "Delta",
    visibility: "targeted",
    successMessage: "You find the passage.",
    failureMessage: "Nothing shifts.",
    linkedSecretId: "secret-1",
    effectType: "reveal_secret"
  });
  await completeRoll(playerPage);
  await expect(playerPage.getByTestId("world-entity-count")).toContainText("0");
  await expect(playerPage.getByTestId("combat-log")).not.toContainText("A hidden passage opens behind the stones.");

  await runDmTool(dmPage, {
    tool: "createSkillCheck",
    checkType: "investigation",
    dc: 1,
    title: "Search the wall again",
    description: "Look for a hidden mechanism.",
    target: "player",
    playerName: "Delta",
    visibility: "targeted",
    successMessage: "You find the passage.",
    failureMessage: "Nothing shifts.",
    linkedSecretId: "secret-1",
    effectType: "reveal_secret"
  });
  await completeRoll(playerPage);
  await expect(playerPage.getByTestId("world-entity-count")).toContainText("1");
  await expect(playerPage.getByTestId("combat-log")).toContainText("A hidden passage opens behind the stones.");

  await playerPage.close();
  playerPage = await context.newPage();
  await reconnectParticipant(playerPage, code, "Delta");
  await waitForPlayRoute(playerPage, code);
  await expect(playerPage.getByTestId("world-entity-count")).toContainText("1");
  await expect(playerPage.getByTestId("combat-log")).toContainText("A hidden passage opens behind the stones.");

  await context.close();
});

test("phase8.1 visual preparation canvas lets the DM place and inspect map assets directly", async ({ browser }) => {
  const code = roomCode("prep-81");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  const playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await openParticipant(playerPage, code, "Echo", "join", "player");

  await dmPage.getByTestId("prep-open-map-adventure").click();
  await expect(dmPage.getByTestId("prep-current-map-label")).toContainText("Adventure Area");

  await dmPage.getByTestId("prep-tool-player_spawn").click();
  await dmPage.getByTestId("prep-spawn-slot-select").selectOption("P1");
  await dmPage.getByTestId("prep-place-1-1").click();
  await expect(dmPage.getByTestId("prep-marker-spawn-P1")).toBeVisible();

  await dmPage.getByTestId("prep-tool-npc").click();
  await dmPage.getByTestId("prep-npc-preset-select").selectOption("merchant");
  await dmPage.getByTestId("prep-place-2-1").click();
  await expect(dmPage.getByTestId("prep-marker-entity-entity-1")).toBeVisible();

  await dmPage.getByTestId("prep-tool-shop").click();
  await dmPage.getByTestId("prep-shop-template-select").selectOption("general_store");
  await dmPage.getByTestId("prep-place-3-1").click();
  await expect(dmPage.getByTestId("prep-marker-entity-entity-2")).toBeVisible();

  await dmPage.getByTestId("prep-tool-encounter").click();
  await dmPage.getByTestId("prep-encounter-theme-select").selectOption("Goblin");
  await dmPage.getByTestId("prep-encounter-difficulty-select").selectOption("easy");
  await dmPage.getByTestId("prep-place-4-1").click();
  await expect(dmPage.getByTestId("prep-marker-encounter-encounter-1")).toBeVisible();

  await dmPage.getByTestId("prep-tool-secret").click();
  await dmPage.getByTestId("prep-place-5-1").click();
  await expect(dmPage.getByTestId("prep-marker-entity-entity-3")).toBeVisible();

  await dmPage.getByTestId("prep-tool-object").click();
  await dmPage.getByTestId("prep-place-6-1").click();
  await expect(dmPage.getByTestId("prep-marker-entity-entity-4")).toBeVisible();

  await dmPage.getByTestId("prep-marker-entity-entity-1").click();
  await expect(dmPage.getByTestId("prep-selection-name")).toContainText("Merchant");
  await dmPage.getByTestId("prep-entity-notes").fill("Greets the party at the gate.");
  await dmPage.getByTestId("prep-save-entity").click();
  await expect(dmPage.getByTestId("dm-log")).toContainText("Updated DM notes for Merchant.");

  await expect(playerPage.getByTestId("prep-map-canvas")).toHaveCount(0);

  await context.close();
});

test("phase10.5 rapid content packs build a synchronized adventure from presets", async ({ browser }) => {
  const code = roomCode("phase10-5");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  const alphaPage = await context.newPage();
  const bravoPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(alphaPage, code, "Alpha", "human", "ranger", "Human Ranger");
  await joinAndConfirm(bravoPage, code, "Bravo", "dwarf", "guardian", "Dwarf Guardian");

  await expect(dmPage.getByTestId("prep-pack-goblin")).toContainText("Goblin Content Pack");
  await expect(dmPage.getByTestId("prep-pack-undead")).toContainText("Undead Content Pack");

  await dmPage.getByTestId("prep-adventure-template-select").selectOption("goblin_cave");
  await dmPage.getByTestId("prep-apply-adventure-template").click();
  await expect(dmPage.getByTestId("prep-current-map-label")).toContainText("Starting Area");

  await dmPage.getByTestId("prep-tool-player_spawn").click();
  await dmPage.getByTestId("prep-spawn-slot-select").selectOption("P1");
  await dmPage.getByTestId("prep-place-0-0").click();
  await dmPage.getByTestId("prep-spawn-slot-select").selectOption("P2");
  await dmPage.getByTestId("prep-place-1-0").click();
  await dmPage.getByTestId("prep-marker-spawn-P1").click();
  await expect(dmPage.getByTestId("prep-selection-name")).toContainText("P1 spawn");
  await expect(dmPage.getByTestId("prep-selection-panel")).toContainText("Alpha");
  await dmPage.getByTestId("prep-marker-spawn-P2").click();
  await expect(dmPage.getByTestId("prep-selection-panel")).toContainText("Bravo");

  await dmPage.getByTestId("prep-tool-npc").click();
  await dmPage.getByTestId("prep-npc-preset-select").selectOption("guard");
  await dmPage.getByTestId("prep-place-7-4").click();

  await dmPage.getByTestId("prep-tool-shop").click();
  await dmPage.getByTestId("prep-shop-template-select").selectOption("blacksmith");
  await dmPage.getByTestId("prep-place-8-4").click();

  await dmPage.getByTestId("prep-open-map-adventure").click();
  await dmPage.getByTestId("prep-tool-encounter").click();
  await dmPage.getByTestId("prep-encounter-theme-select").selectOption("Goblin");
  await dmPage.getByTestId("prep-encounter-difficulty-select").selectOption("hard");
  await dmPage.getByTestId("prep-place-7-4").click();
  await expect(dmPage.getByTestId("prep-encounter-template-preview")).toContainText("Chief");

  await dmPage.getByTestId("dm-save-template").click();
  await dmPage.getByTestId("prep-open-map-starting").click();
  await dmPage.getByTestId("prep-tool-player_spawn").click();
  await dmPage.getByTestId("prep-spawn-slot-select").selectOption("P1");
  await dmPage.getByTestId("prep-place-5-0").click();
  await dmPage.getByTestId("dm-load-template").click();
  await expect(dmPage.getByTestId("prep-marker-spawn-P1")).toBeVisible();

  const prepSnapshot = await getLobbySnapshot(dmPage) as {
    preparationSpawns: Array<{ slotId: string; assignedPlayerName?: string; x: number; y: number }>;
    shops: Array<{ name: string; inventory: Array<{ name: string }> }>;
    npcs: Array<{ role: string }>;
  };
  expect(prepSnapshot.preparationSpawns.some((spawn) => spawn.slotId === "P1" && spawn.x === 0 && spawn.y === 0)).toBeTruthy();
  expect(prepSnapshot.preparationSpawns.some((spawn) => spawn.slotId === "P2" && spawn.assignedPlayerName === "Bravo")).toBeTruthy();
  expect(prepSnapshot.shops.some((shop) => shop.name === "Blacksmith" && shop.inventory.some((item) => item.name === "Chain Armor"))).toBeTruthy();
  expect(prepSnapshot.npcs.some((npc) => npc.role === "guard")).toBeTruthy();

  await dmPage.getByTestId("prep-open-map-adventure").click();
  await expect(dmPage.getByTestId("prep-marker-encounter-encounter-3")).toBeVisible();

  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(alphaPage, code);
  await waitForPlayRoute(bravoPage, code);

  const alphaSnapshot = await getLobbySnapshot(alphaPage) as { players: Array<{ name: string; x: number; y: number }> };
  const bravoSnapshot = await getLobbySnapshot(bravoPage) as { players: Array<{ name: string; x: number; y: number }> };
  expect(alphaSnapshot.players.find((player) => player.name === "Alpha")).toMatchObject({ x: 0, y: 0 });
  expect(bravoSnapshot.players.find((player) => player.name === "Bravo")).toMatchObject({ x: 1, y: 0 });

  await context.close();
});

test("phase10 fog hides entities until the DM reveals area and entity", async ({ browser }) => {
  const code = roomCode("phase10-fog");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  const playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(playerPage, code, "Echo", "human", "ranger", "Human Ranger");

  await runDmTool(dmPage, { tool: "placeEntity", entityType: "chest", x: 2, y: 2, mapKey: "starting", visibilityState: "hidden" });
  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(playerPage, code);

  await expect(playerPage.getByTestId("world-entity-count")).toContainText("0");
  await dmPage.getByTestId("dm-world-tab-world").click();
  await dmPage.getByTestId("dm-fog-name").fill("Inn Room");
  await dmPage.getByTestId("dm-fog-x").fill("0");
  await dmPage.getByTestId("dm-fog-y").fill("0");
  await dmPage.getByTestId("dm-fog-width").fill("4");
  await dmPage.getByTestId("dm-fog-height").fill("4");
  await dmPage.getByTestId("dm-reveal-area").click();
  await expect(playerPage.getByTestId("world-entity-count")).toContainText("0");

  await dmPage.getByTestId("dm-world-tab-npcs").click();
  await dmPage.locator('[data-testid^="dm-reveal-entity-"]').first().click();
  await expect(playerPage.getByTestId("world-entity-count")).toContainText("1");

  await context.close();
});

test("phase10 trigger zones fire once, spawn enemies, and update the dashboard", async ({ browser }) => {
  const code = roomCode("phase10-trigger");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  const playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(playerPage, code, "Foxtrot", "human", "ranger", "Human Ranger");

  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(playerPage, code);
  await runDmTool(dmPage, { tool: "setMap", mapKey: "adventure" });
  await runDmTool(dmPage, { tool: "revealAllFog", mapKey: "adventure" });
  await runDmTool(dmPage, { tool: "createDynamicEvent", eventName: "Bridge Ambush Event", eventKind: "ambush", x: 2, y: 1, width: 1, height: 1, enemyId: "goblin", amount: 2, note: "The bushes shake violently." });
  await runDmTool(dmPage, { tool: "createTriggerZone", name: "Bridge Ambush", triggerType: "enter_area", eventId: "event-1", mapKey: "adventure", x: 2, y: 1, width: 1, height: 1, onceOnly: true });

  await dmPage.getByTestId("dm-world-tab-world").click();
  await expect(dmPage.getByTestId("dm-dashboard-summary")).toContainText("1 active triggers");

  await runDebug(playerPage, "move", 2, 1);
  await expect(playerPage.getByTestId("combat-log")).toContainText("The bushes shake violently.");
  await expect(dmPage.getByTestId("dm-dashboard-triggered")).toContainText("1");

  const enemyCountAfterFirstTrigger = (await playerPage.getByTestId("enemy-count").textContent()) ?? "";
  const logAfterFirstTrigger = (await playerPage.getByTestId("combat-log").textContent()) ?? "";
  await runDebug(playerPage, "move", 1, 1);
  await runDebug(playerPage, "move", 2, 1);
  await expect(playerPage.getByTestId("enemy-count")).toHaveText(enemyCountAfterFirstTrigger);
  const logAfterSecondEntry = (await playerPage.getByTestId("combat-log").textContent()) ?? "";
  expect(countOccurrences(logAfterSecondEntry, "The bushes shake violently.")).toBe(countOccurrences(logAfterFirstTrigger, "The bushes shake violently."));

  await context.close();
});

test("phase10 living world state persists secrets, environment modifiers, reputation, and journal entries", async ({ browser }) => {
  const code = roomCode("phase10-world");
  const context = await browser.newContext();
  const dmPage = await context.newPage();
  let playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(playerPage, code, "Gamma", "human", "mystic", "Human Mystic");

  await runDmTool(dmPage, { tool: "placeEntity", entityType: "chest", x: 2, y: 2, mapKey: "starting", visibilityState: "revealed" });
  await runDmTool(dmPage, { tool: "placeEntity", entityType: "secret_passage_marker", x: 3, y: 2, mapKey: "starting", visibilityState: "hidden" });
  await runDmTool(dmPage, { tool: "setPlayerSpawn", spawnSlotId: "P1", mapKey: "starting", x: 2, y: 1 });
  await runDmTool(dmPage, { tool: "createSecret", checkType: "investigation", dc: 1, description: "A hidden passage opens beside the chest.", linkedEntityId: "entity-2" });
  await runDmTool(dmPage, { tool: "configureEntityInteraction", entityId: "entity-1", interactionTitle: "Inspect the chest", description: "Look for hidden mechanisms.", checkType: "investigation", dc: 1, visibility: "targeted", successMessage: "You find the catch.", failureMessage: "Nothing happens.", effectType: "reveal_secret", linkedSecretId: "secret-1", targetPlayerMode: "single" });

  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(playerPage, code);
  await runDmTool(dmPage, { tool: "revealAllFog", mapKey: "starting" });

  await dmPage.getByTestId("dm-world-tab-world").click();
  await dmPage.getByTestId("dm-time-select").selectOption("night");
  await dmPage.getByTestId("dm-set-time").click();
  await dmPage.getByTestId("dm-weather-select").selectOption("fog");
  await dmPage.getByTestId("dm-set-weather").click();
  await dmPage.getByTestId("dm-faction-select").selectOption("merchants_guild");
  await dmPage.getByTestId("dm-reputation-amount").fill("10");
  await dmPage.getByTestId("dm-adjust-reputation").click();
  await dmPage.getByTestId("dm-journal-entry").fill("Merchants Guild offers safer roads.");
  await dmPage.getByTestId("dm-add-journal-entry").click();

  await runDmTool(dmPage, { tool: "createSkillCheck", checkType: "perception", dc: 1, title: "Night Watch", description: "Scan the camp perimeter.", target: "player", playerName: "Gamma", visibility: "dm", successMessage: "You hear distant footsteps.", failureMessage: "The darkness conceals the threat." });
  await completeRoll(playerPage);
  await dmPage.getByTestId("log-tab-dm").click();
  await expect(dmPage.getByTestId("dm-log")).toContainText("- 4 environment");

  await playerPage.locator('[data-testid^="entity-interact-"]').first().click();
  await completeRoll(playerPage);
  await expect(playerPage.getByTestId("combat-log")).toContainText("A hidden passage opens beside the chest.");
  await expect(dmPage.getByTestId("dm-dashboard-summary")).toContainText("0 hidden secrets");
  await expect(playerPage.getByTestId("world-status-panel")).toContainText("night");
  await expect(playerPage.getByTestId("world-status-panel")).toContainText("fog");
  await expect(playerPage.getByTestId("world-status-panel")).toContainText("merchants_guild: 10");
  await expect(playerPage.getByTestId("journal-panel")).toContainText("Merchants Guild offers safer roads.");

  await playerPage.close();
  playerPage = await context.newPage();
  await reconnectParticipant(playerPage, code, "Gamma");
  await waitForPlayRoute(playerPage, code);
  await expect(playerPage.getByTestId("world-status-panel")).toContainText("merchants_guild: 10");
  await expect(playerPage.getByTestId("journal-panel")).toContainText("Merchants Guild offers safer roads.");
  await expect(playerPage.getByTestId("combat-log")).toContainText("A hidden passage opens beside the chest.");

  await context.close();
});

test("phase10 dm logs stay in a dedicated sidebar and never cover controls", async ({ browser }) => {
  const code = roomCode("phase10-layout");
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  const dmPage = await context.newPage();
  const playerPage = await context.newPage();

  await openParticipant(dmPage, code, "DungeonMaster", "create", "dm");
  await joinAndConfirm(playerPage, code, "Hotel", "human", "ranger", "Human Ranger");
  await dmPage.getByTestId("dm-start-adventure").click();
  await waitForPlayRoute(dmPage, code);
  await waitForPlayRoute(playerPage, code);

  await dmPage.getByTestId("dm-world-tab-world").click();

  const controlsBox = await getBox(dmPage, "play-controls-column");
  const sidebarBox = await getBox(dmPage, "play-log-sidebar");
  const skillPanelBox = await getBox(dmPage, "dm-skill-check-panel");
  const commandButtonBox = await getBox(dmPage, "dm-run-command");

  expect(sidebarBox.x).toBeGreaterThanOrEqual(controlsBox.x + controlsBox.width - 1);
  expect(sidebarBox.x).toBeGreaterThanOrEqual(skillPanelBox.x + skillPanelBox.width - 1);
  expect(sidebarBox.x).toBeGreaterThanOrEqual(commandButtonBox.x + commandButtonBox.width - 1);

  await dmPage.getByTestId("dm-run-command").click();
  await dmPage.getByTestId("dm-check-preset-12").click();

  await dmPage.setViewportSize({ width: 1000, height: 1200 });
  const stackedControlsBox = await getBox(dmPage, "play-controls-column");
  const stackedSidebarBox = await getBox(dmPage, "play-log-sidebar");

  expect(stackedSidebarBox.y).toBeGreaterThanOrEqual(stackedControlsBox.y + stackedControlsBox.height - 1);

  await context.close();
});
