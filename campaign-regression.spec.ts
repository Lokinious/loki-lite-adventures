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

async function completeRoll(page: Page) {
  const rollButton = page.locator('[data-testid^="roll-check-"]').last();
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
