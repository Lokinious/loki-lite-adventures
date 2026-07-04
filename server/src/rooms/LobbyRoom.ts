import type { Client } from "colyseus";
import colyseus from "colyseus";
import classDefinitions from "../../../content/classes.json" with { type: "json" };
import enemyDefinitions from "../../../content/enemies.json" with { type: "json" };
import itemDefinitions from "../../../content/items.json" with { type: "json" };
import mapDefinitions from "../../../content/maps.json" with { type: "json" };
import sceneDefinitions from "../../../content/scenes.json" with { type: "json" };
import { CombatLogEntry, EnemyState, LobbyState, PlayerState } from "./schema/LobbyState.js";

const { Room } = colyseus;

type JoinOptions = {
  roomCode?: string;
  playerName?: string;
};

type SelectCharacterMessage = {
  classId: string;
};

type MoveMessage = {
  x: number;
  y: number;
};

type AttackMessage = {
  targetId: string;
};

type SceneActionMessage = {
  actionId: string;
};

type PurchaseMessage = {
  itemId: string;
};

type CharacterDefinition = {
  id: string;
  name: string;
  health: number;
  movement: number;
  startingInventory: string[];
};

type EnemyDefinition = {
  id: string;
  name: string;
  health: number;
  armorClass: number;
  movement: number;
  attacks: Array<{
    name: string;
    toHit: number;
    damage: string;
  }>;
};

type ItemDefinition = {
  id: string;
  name: string;
  price: number;
  effect: string;
};

type MapDefinition = {
  id: string;
  name: string;
  width: number;
  height: number;
};

type SceneDefinition = {
  id: string;
  title: string;
  description: string;
  mapId: string;
  sceneType: "story" | "encounter" | "shop" | "victory";
  nextSceneId?: string;
  objective?: string;
};

type CombatStats = {
  attackBonus: number;
  damageDice: string;
  defense: number;
};

type Point = {
  x: number;
  y: number;
};

type ActiveTurnView = {
  type: "player" | "enemy" | "none";
  id: string;
  name: string;
};

type TurnOrderEntry = {
  id: string;
  name: string;
  kind: "player" | "enemy";
  subtitle: string;
  active: boolean;
};

type SceneView = {
  id: string;
  title: string;
  description: string;
  objective: string;
  mapId: string;
  sceneType: "story" | "encounter" | "shop" | "victory";
};

type SceneActionView = {
  id: string;
  label: string;
};

type MerchantItemView = {
  id: string;
  name: string;
  price: number;
  effect: string;
};

type VictorySummaryView = {
  playersSurvived: number;
  goldEarned: number;
  enemiesDefeated: number;
  totalTurns: number;
  adventureDuration: string;
};

type RoomSnapshot = {
  roomCode: string;
  currentScene: SceneView;
  sceneActions: SceneActionView[];
  gridWidth: number;
  gridHeight: number;
  activeTurn: ActiveTurnView;
  turnOrder: TurnOrderEntry[];
  partyGold: number;
  totalGoldEarned: number;
  enemiesDefeated: number;
  completedEncounters: string[];
  merchantItems: MerchantItemView[];
  victorySummary: VictorySummaryView | null;
  players: Array<{
    id: string;
    name: string;
    classId: string;
    className: string;
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    movement: number;
    remainingMovement: number;
    defense: number;
    attackBonus: number;
    damageDice: string;
    alive: boolean;
    gold: number;
    inventory: string[];
  }>;
  enemies: Array<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    defense: number;
    x: number;
    y: number;
    movement: number;
    attackBonus: number;
    damageDice: string;
    alive: boolean;
  }>;
  combatLog: Array<{
    id: number;
    message: string;
  }>;
};

const maxClients = 6;
const maxCombatLogEntries = 40;
const startingPlayerGold = 10;

const availableClasses = classDefinitions as CharacterDefinition[];
const availableEnemies = enemyDefinitions as EnemyDefinition[];
const availableItems = itemDefinitions as ItemDefinition[];
const availableMaps = mapDefinitions as MapDefinition[];
const availableScenes = sceneDefinitions as SceneDefinition[];

const defaultClass = availableClasses[0] ?? {
  id: "guardian",
  name: "Guardian",
  health: 14,
  movement: 5,
  startingInventory: []
};

const classesById = new Map(availableClasses.map((classDefinition) => [classDefinition.id, classDefinition]));
const enemiesById = new Map(availableEnemies.map((enemyDefinition) => [enemyDefinition.id, enemyDefinition]));
const itemsById = new Map(availableItems.map((itemDefinition) => [itemDefinition.id, itemDefinition]));
const mapsById = new Map(availableMaps.map((mapDefinition) => [mapDefinition.id, mapDefinition]));
const scenesById = new Map(availableScenes.map((sceneDefinition) => [sceneDefinition.id, sceneDefinition]));

const combatStatsByClassId: Record<string, CombatStats> = {
  guardian: { attackBonus: 5, damageDice: "1d8+3", defense: 14 },
  ranger: { attackBonus: 5, damageDice: "1d8+2", defense: 13 },
  arcanist: { attackBonus: 4, damageDice: "1d10+2", defense: 11 },
  mystic: { attackBonus: 4, damageDice: "1d6+2", defense: 12 }
};

const merchantItemIds = ["healing_potion", "iron_sword"];

const spawnPoints: Point[] = [
  { x: 1, y: 1 },
  { x: 8, y: 1 },
  { x: 1, y: 6 },
  { x: 8, y: 6 },
  { x: 1, y: 3 },
  { x: 8, y: 3 }
];

const encounterSpawnBySceneId: Record<string, Array<{ enemyId: string; position: Point }>> = {
  forest: [{ enemyId: "goblin", position: { x: 4, y: 1 } }],
  boss: [{ enemyId: "goblin_chief", position: { x: 5, y: 1 } }]
};

export class LobbyRoom extends Room<LobbyState> {
  override maxClients = maxClients;
  private combatLogIndex = 0;

  override onCreate(options: JoinOptions) {
    const state = new LobbyState();
    state.roomCode = normalizeRoomCode(options.roomCode);
    this.setState(state);
    this.setMetadata({ roomCode: state.roomCode });
    this.applySceneState("tavern");
    this.syncState();

    this.onMessage("selectCharacter", (client, message: SelectCharacterMessage) => {
      this.handleCharacterSelection(client, message);
    });

    this.onMessage("requestMove", (client, message: MoveMessage) => {
      this.handleMoveRequest(client, message);
    });

    this.onMessage("requestAttack", (client, message: AttackMessage) => {
      this.handleAttackRequest(client, message);
    });

    this.onMessage("endTurn", (client) => {
      this.handleEndTurn(client);
    });

    this.onMessage("requestSceneAction", (client, message: SceneActionMessage) => {
      this.handleSceneAction(client, message);
    });

    this.onMessage("requestPurchase", (client, message: PurchaseMessage) => {
      this.handlePurchaseRequest(client, message);
    });

    this.onMessage("requestState", (client) => {
      this.send(client, "roomState", this.buildSnapshot());
    });
  }

  override onJoin(client: Client, options: JoinOptions) {
    const character = defaultClass;
    const player = this.createPlayerState(client.sessionId, sanitizePlayerName(options.playerName), character);

    this.state.players.set(client.sessionId, player);
    this.state.turnOrder.push(client.sessionId);
    this.repositionPlayers();
    this.recalculatePartyGold();

    if (this.getCurrentScene().sceneType === "encounter" && !this.hasActiveTurn()) {
      this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? "");
    }

    this.addCombatLog(`${player.name} joined room ${this.state.roomCode}.`);
    this.syncState();
    this.publishSnapshot();
  }

  override onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    const playerName = player.name;
    const wasActiveTurn = this.isPlayerTurn(client.sessionId);

    this.state.players.delete(client.sessionId);
    this.removeTurnOrderEntry(client.sessionId);
    this.recalculatePartyGold();

    if (wasActiveTurn) {
      this.advanceTurn();
      return;
    }

    if (this.getLivingPlayerOrder().length === 0) {
      this.clearActiveTurn();
    }

    this.addCombatLog(`${playerName} left the room.`);
    this.syncState();
    this.publishSnapshot();
  }

  override onDispose() {
    this.state.players.clear();
    this.state.enemies.clear();
    while (this.state.turnOrder.length > 0) {
      this.state.turnOrder.pop();
    }
    while (this.state.completedEncounters.length > 0) {
      this.state.completedEncounters.pop();
    }
  }

  private handleCharacterSelection(client: Client, message: SelectCharacterMessage) {
    const player = this.state.players.get(client.sessionId);
    const currentScene = this.getCurrentScene();

    if (!player) {
      return;
    }

    if (currentScene.id !== "tavern") {
      this.rejectAction(client, "Classes can only be changed in the tavern.");
      return;
    }

    const selectedClass = classesById.get(message.classId);

    if (!selectedClass) {
      this.rejectAction(client, "That class is not available.");
      return;
    }

    player.classId = selectedClass.id;
    player.className = selectedClass.name;
    player.health = selectedClass.health;
    player.maxHealth = selectedClass.health;
    player.movement = selectedClass.movement;
    player.remainingMovement = selectedClass.movement;
    player.alive = true;
    resetStringArray(player.inventory, selectedClass.startingInventory ?? []);
    applyCombatStatsToPlayer(player, getCombatStatsForClass(selectedClass.id));

    this.addCombatLog(`${player.name} selected ${player.className}.`);
    this.syncState();
    this.publishSnapshot();
  }

  private handleMoveRequest(client: Client, message: MoveMessage) {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.getCurrentScene().sceneType !== "encounter") {
      this.rejectAction(client, "Movement is only available during encounters.");
      return;
    }

    if (!this.isPlayerTurn(client.sessionId)) {
      this.rejectAction(client, "It is not your turn.");
      return;
    }

    if (!player.alive) {
      this.rejectAction(client, "Defeated adventurers cannot move.");
      return;
    }

    if (!isWholeNumber(message.x) || !isWholeNumber(message.y)) {
      this.rejectAction(client, "Choose a valid tile.");
      return;
    }

    if (
      message.x < 0 ||
      message.y < 0 ||
      message.x >= this.state.gridWidth ||
      message.y >= this.state.gridHeight
    ) {
      this.rejectAction(client, "That tile is outside the battle map.");
      return;
    }

    const distance = calculateDistance(player.x, player.y, message.x, message.y);

    if (distance === 0) {
      return;
    }

    if (distance > player.remainingMovement) {
      this.rejectAction(client, "That move is farther than your remaining movement.");
      return;
    }

    if (this.isOccupied(message.x, message.y, client.sessionId)) {
      this.rejectAction(client, "That tile is already occupied.");
      return;
    }

    player.x = message.x;
    player.y = message.y;
    player.remainingMovement -= distance;

    this.addCombatLog(
      `${player.name} moved to (${message.x + 1}, ${message.y + 1}) with ${player.remainingMovement} movement left.`
    );
    this.syncState();
    this.publishSnapshot();
  }

  private handleAttackRequest(client: Client, message: AttackMessage) {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.getCurrentScene().sceneType !== "encounter") {
      this.rejectAction(client, "Attack actions are only available during encounters.");
      return;
    }

    if (!this.isPlayerTurn(client.sessionId)) {
      this.rejectAction(client, "It is not your turn.");
      return;
    }

    if (!player.alive) {
      this.rejectAction(client, "Defeated adventurers cannot attack.");
      return;
    }

    const enemy = this.state.enemies.get(message.targetId);

    if (!enemy || !enemy.alive) {
      this.rejectAction(client, "That target is no longer available.");
      return;
    }

    if (calculateDistance(player.x, player.y, enemy.x, enemy.y) !== 1) {
      this.rejectAction(client, "That target is not adjacent.");
      return;
    }

    this.addCombatLog(`${player.name} attacks ${enemy.name}.`);

    const attackRoll = rollDie(20);
    const attackTotal = attackRoll + player.attackBonus;
    this.addCombatLog(
      `Attack roll: d20 (${attackRoll}) + ${player.attackBonus} = ${attackTotal} vs ${enemy.defense}.`
    );

    if (attackTotal < enemy.defense) {
      this.addCombatLog(`${player.name} misses ${enemy.name}.`);
      this.syncState();
      this.publishSnapshot();
      return;
    }

    const damageResult = rollDiceExpression(player.damageDice);
    enemy.hp = Math.max(0, enemy.hp - damageResult.total);

    this.addCombatLog(`${player.name} hits ${enemy.name}.`);
    this.addCombatLog(
      `Damage dealt: ${damageResult.total}. ${enemy.name} is now at ${enemy.hp}/${enemy.maxHp} HP.`
    );

    if (enemy.hp === 0) {
      enemy.alive = false;
      this.state.enemiesDefeated += 1;
      this.addCombatLog(`${enemy.name} is defeated.`);

      if (!this.getLivingEnemies().length) {
        this.handleEncounterCompletion(player, enemy);
        return;
      }
    }

    this.syncState();
    this.publishSnapshot();
  }

  private handleEndTurn(client: Client) {
    if (!this.isPlayerTurn(client.sessionId)) {
      this.rejectAction(client, "Only the active player can end the turn.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (player) {
      this.addCombatLog(`${player.name} ended their turn.`);
    }

    this.advanceTurn();
  }

  private handleSceneAction(client: Client, message: SceneActionMessage) {
    if (!this.state.players.has(client.sessionId)) {
      return;
    }

    switch (this.getCurrentScene().id) {
      case "tavern":
        if (message.actionId === "accept_quest") {
          this.addCombatLog("The party accepts the goblin quest.");
          if (!this.state.adventureStartedAt) {
            this.state.adventureStartedAt = new Date().toISOString();
          }
          this.transitionToScene("forest", "The party leaves the tavern for the forest road.");
          return;
        }

        if (message.actionId === "leave") {
          this.addCombatLog("The party decides to stay at the tavern for now.");
          this.syncState();
          this.publishSnapshot();
        }
        return;

      case "merchant":
        if (message.actionId === "continue_to_boss") {
          this.transitionToScene("boss", "The party follows the merchant's directions to the goblin camp.");
        }
        return;

      case "victory":
        if (message.actionId === "return_to_lobby") {
          this.resetAdventure();
        }
        return;

      default:
        return;
    }
  }

  private handlePurchaseRequest(client: Client, message: PurchaseMessage) {
    const player = this.state.players.get(client.sessionId);
    const currentScene = this.getCurrentScene();

    if (!player) {
      return;
    }

    if (currentScene.sceneType !== "shop") {
      this.rejectAction(client, "Purchases can only be made in the merchant scene.");
      return;
    }

    const item = itemsById.get(message.itemId);

    if (!item || !merchantItemIds.includes(item.id)) {
      this.rejectAction(client, "That item is not for sale.");
      return;
    }

    if (player.gold < item.price) {
      this.rejectAction(client, "You do not have enough gold.");
      return;
    }

    player.gold -= item.price;
    player.inventory.push(item.id);
    this.recalculatePartyGold();

    this.addCombatLog(`${player.name} buys ${item.name} for ${item.price} gold.`);
    this.syncState();
    this.publishSnapshot();
  }

  private handleEncounterCompletion(attacker: PlayerState, defeatedEnemy: EnemyState) {
    const currentScene = this.getCurrentScene();
    appendUnique(this.state.completedEncounters, currentScene.id);
    this.addCombatLog(`${currentScene.title} encounter complete.`);

    if (currentScene.id === "forest") {
      this.rewardGold(5, "Goblin defeated. Party gains 5 gold.");
      this.transitionToScene("merchant", "The road is clear and a merchant approaches.");
      return;
    }

    if (currentScene.id === "boss") {
      this.rewardGold(20, "Goblin Chief defeated. Party gains 20 gold.");
      attacker.inventory.push("iron_sword");
      this.addCombatLog(`${attacker.name} receives an Iron Sword.`);
      this.state.adventureCompletedAt = new Date().toISOString();
      this.addCombatLog("Adventure complete. The goblin threat is broken.");
      this.transitionToScene("victory", `${defeatedEnemy.name} falls and the adventure is won.`);
      return;
    }

    this.syncState();
    this.publishSnapshot();
  }

  private transitionToScene(sceneId: string, transitionMessage: string) {
    const nextScene = scenesById.get(sceneId);

    if (!nextScene) {
      return;
    }

    this.addCombatLog(transitionMessage);
    this.applySceneState(sceneId);
    this.addCombatLog(`Scene transition: ${nextScene.title}.`);
    this.syncState();
    this.publishSnapshot();
  }

  private applySceneState(sceneId: string) {
    const scene = scenesById.get(sceneId);
    const map = mapsById.get(scene?.mapId ?? "forest") ?? defaultMapDefinition();

    this.state.currentSceneId = sceneId;
    this.state.gridWidth = map.width;
    this.state.gridHeight = map.height;
    this.clearEnemies();
    this.clearActiveTurn();

    if (scene?.sceneType === "encounter") {
      this.repositionPlayers();
      this.spawnEncounter(sceneId);
      this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? "");
      return;
    }

    this.repositionPlayers();
  }

  private spawnEncounter(sceneId: string) {
    const spawns = encounterSpawnBySceneId[sceneId] ?? [];

    for (const spawn of spawns) {
      const definition = enemiesById.get(spawn.enemyId);

      if (!definition) {
        continue;
      }

      const enemy = new EnemyState();
      enemy.id = `${definition.id}-1`;
      enemy.name = definition.name;
      enemy.hp = definition.health;
      enemy.maxHp = definition.health;
      enemy.defense = definition.armorClass;
      enemy.x = spawn.position.x;
      enemy.y = spawn.position.y;
      enemy.movement = definition.movement;
      enemy.attackBonus = definition.attacks[0]?.toHit ?? 2;
      enemy.damageDice = definition.attacks[0]?.damage ?? "1d4+1";
      enemy.alive = true;
      this.state.enemies.set(enemy.id, enemy);
    }
  }

  private rewardGold(amount: number, message: string) {
    const recipients = this.getLivingPlayers().length ? this.getLivingPlayers() : [...this.state.players.values()];

    if (!recipients.length) {
      return;
    }

    const baseShare = Math.floor(amount / recipients.length);
    let remainder = amount % recipients.length;

    for (const player of recipients) {
      const share = baseShare + (remainder > 0 ? 1 : 0);
      player.gold += share;
      if (remainder > 0) {
        remainder -= 1;
      }
    }

    this.state.totalGoldEarned += amount;
    this.recalculatePartyGold();
    this.addCombatLog(message);
  }

  private resetAdventure() {
    while (this.state.completedEncounters.length > 0) {
      this.state.completedEncounters.pop();
    }

    this.state.totalGoldEarned = 0;
    this.state.enemiesDefeated = 0;
    this.state.totalTurns = 0;
    this.state.adventureStartedAt = "";
    this.state.adventureCompletedAt = "";
    this.combatLogIndex = 0;
    while (this.state.combatLog.length > 0) {
      this.state.combatLog.pop();
    }

    for (const player of this.state.players.values()) {
      const classDefinition = classesById.get(player.classId) ?? defaultClass;
      player.health = classDefinition.health;
      player.maxHealth = classDefinition.health;
      player.movement = classDefinition.movement;
      player.remainingMovement = classDefinition.movement;
      player.alive = true;
      player.gold = startingPlayerGold;
      resetStringArray(player.inventory, classDefinition.startingInventory ?? []);
      applyCombatStatsToPlayer(player, getCombatStatsForClass(player.classId));
    }

    this.repositionPlayers();
    this.recalculatePartyGold();
    this.applySceneState("tavern");
    this.addCombatLog("The party returns to the tavern, ready for another adventure.");
    this.syncState();
    this.publishSnapshot();
  }

  private startNextPlayerTurn(sessionId: string) {
    const player = this.state.players.get(sessionId);

    if (!player || !player.alive) {
      this.clearActiveTurn();
      return;
    }

    this.state.activeTurnType = "player";
    this.state.activeTurnId = sessionId;
    player.remainingMovement = player.movement;
    this.state.totalTurns += 1;
    this.addCombatLog(`${player.name}'s turn begins.`);
  }

  private advanceTurn() {
    if (this.getCurrentScene().sceneType !== "encounter") {
      this.clearActiveTurn();
      this.syncState();
      this.publishSnapshot();
      return;
    }

    const order = this.getLivingPlayerOrder();

    if (!order.length) {
      this.clearActiveTurn();
      this.syncState();
      this.publishSnapshot();
      return;
    }

    const currentIndex = order.indexOf(this.state.activeTurnId);

    if (this.getLivingEnemies().length > 0 && currentIndex === order.length - 1) {
      this.executeEnemyTurn();
    } else {
      const nextSessionId =
        currentIndex === -1
          ? order[0]
          : order[(currentIndex + 1 + order.length) % order.length];

      if (nextSessionId) {
        this.startNextPlayerTurn(nextSessionId);
      } else {
        this.clearActiveTurn();
      }
    }

    this.syncState();
    this.publishSnapshot();
  }

  private executeEnemyTurn() {
    const enemy = this.getLivingEnemies()[0];

    if (!enemy) {
      this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? "");
      return;
    }

    this.state.activeTurnType = "enemy";
    this.state.activeTurnId = enemy.id;
    this.state.totalTurns += 1;
    this.addCombatLog(`${enemy.name}'s turn begins.`);

    const target = this.findNearestLivingPlayer(enemy);

    if (!target) {
      this.addCombatLog(`${enemy.name} has no living targets.`);
    } else if (calculateDistance(enemy.x, enemy.y, target.x, target.y) === 1) {
      this.performEnemyAttack(enemy, target);
    } else {
      const nextPoint = this.getEnemyStep(enemy, target);

      if (nextPoint) {
        enemy.x = nextPoint.x;
        enemy.y = nextPoint.y;
        this.addCombatLog(
          `${enemy.name} moves to (${enemy.x + 1}, ${enemy.y + 1}) toward ${target.name}.`
        );
      } else {
        this.addCombatLog(`${enemy.name} holds position.`);
      }
    }

    this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? "");
  }

  private performEnemyAttack(enemy: EnemyState, target: PlayerState) {
    this.addCombatLog(`${enemy.name} attacks ${target.name}.`);

    const attackRoll = rollDie(20);
    const attackTotal = attackRoll + enemy.attackBonus;
    this.addCombatLog(
      `Enemy roll: d20 (${attackRoll}) + ${enemy.attackBonus} = ${attackTotal} vs ${target.defense}.`
    );

    if (attackTotal < target.defense) {
      this.addCombatLog(`${enemy.name} misses ${target.name}.`);
      return;
    }

    const damageResult = rollDiceExpression(enemy.damageDice);
    target.health = Math.max(0, target.health - damageResult.total);
    target.alive = target.health > 0;

    this.addCombatLog(`${enemy.name} hits ${target.name}.`);
    this.addCombatLog(
      `Enemy damage: ${damageResult.total}. ${target.name} is now at ${target.health}/${target.maxHealth} HP.`
    );

    if (!target.alive) {
      target.remainingMovement = 0;
      this.addCombatLog(`${target.name} is knocked out.`);
    }
  }

  private findNearestLivingPlayer(enemy: EnemyState) {
    return this.getLivingPlayers().sort((left, right) => {
      const leftDistance = calculateDistance(enemy.x, enemy.y, left.x, left.y);
      const rightDistance = calculateDistance(enemy.x, enemy.y, right.x, right.y);

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left.name.localeCompare(right.name);
    })[0];
  }

  private getEnemyStep(enemy: EnemyState, target: PlayerState): Point | null {
    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    const candidates: Point[] = [];

    if (deltaX !== 0) {
      candidates.push({ x: enemy.x + Math.sign(deltaX), y: enemy.y });
    }

    if (deltaY !== 0) {
      candidates.push({ x: enemy.x, y: enemy.y + Math.sign(deltaY) });
    }

    for (const candidate of candidates) {
      if (
        candidate.x < 0 ||
        candidate.y < 0 ||
        candidate.x >= this.state.gridWidth ||
        candidate.y >= this.state.gridHeight
      ) {
        continue;
      }

      if (!this.isOccupiedByLivingUnit(candidate.x, candidate.y, enemy.id)) {
        return candidate;
      }
    }

    return null;
  }

  private createPlayerState(sessionId: string, playerName: string, character: CharacterDefinition) {
    const player = new PlayerState();
    player.id = sessionId;
    player.name = playerName;
    player.classId = character.id;
    player.className = character.name;
    player.health = character.health;
    player.maxHealth = character.health;
    player.movement = character.movement;
    player.remainingMovement = character.movement;
    player.alive = true;
    player.gold = startingPlayerGold;
    resetStringArray(player.inventory, character.startingInventory ?? []);
    applyCombatStatsToPlayer(player, getCombatStatsForClass(character.id));
    return player;
  }

  private repositionPlayers() {
    const players = [...this.state.players.values()];

    players.forEach((player, index) => {
      const spawnPoint = spawnPoints[index] ?? spawnPoints[spawnPoints.length - 1] ?? { x: 1, y: 1 };
      player.x = spawnPoint.x;
      player.y = spawnPoint.y;
      player.remainingMovement = player.movement;
    });
  }

  private clearEnemies() {
    this.state.enemies.clear();
  }

  private clearActiveTurn() {
    this.state.activeTurnType = "none";
    this.state.activeTurnId = "";
  }

  private getCurrentScene() {
    return scenesById.get(this.state.currentSceneId) ?? defaultSceneDefinition();
  }

  private getLivingPlayers() {
    return [...this.state.players.values()].filter((player) => player.alive);
  }

  private getLivingPlayerOrder() {
    return [...this.state.turnOrder].filter((sessionId): sessionId is string => {
      if (typeof sessionId !== "string") {
        return false;
      }

      return Boolean(this.state.players.get(sessionId)?.alive);
    });
  }

  private getLivingEnemies() {
    return [...this.state.enemies.values()].filter((enemy) => enemy.alive);
  }

  private isPlayerTurn(sessionId: string) {
    return this.state.activeTurnType === "player" && this.state.activeTurnId === sessionId;
  }

  private hasActiveTurn() {
    return this.state.activeTurnType !== "none" && this.state.activeTurnId !== "";
  }

  private removeTurnOrderEntry(sessionId: string) {
    const remainingOrder = [...this.state.turnOrder].filter(
      (entry): entry is string => typeof entry === "string" && entry !== sessionId
    );
    resetStringArray(this.state.turnOrder, remainingOrder);
  }

  private addCombatLog(message: string) {
    const entry = new CombatLogEntry();
    entry.id = this.combatLogIndex;
    entry.message = message;
    this.combatLogIndex += 1;
    this.state.combatLog.push(entry);

    while (this.state.combatLog.length > maxCombatLogEntries) {
      this.state.combatLog.shift();
    }
  }

  private rejectAction(client: Client, message: string) {
    this.send(client, "actionRejected", { message });
  }

  private recalculatePartyGold() {
    this.state.partyGold = [...this.state.players.values()].reduce((total, player) => total + player.gold, 0);
  }

  private isOccupied(x: number, y: number, ignoredSessionId?: string) {
    return this.isOccupiedByLivingUnit(x, y, undefined, ignoredSessionId);
  }

  private isOccupiedByLivingUnit(
    x: number,
    y: number,
    ignoredEnemyId?: string,
    ignoredSessionId?: string
  ) {
    for (const [sessionId, player] of this.state.players.entries()) {
      if (!player.alive || sessionId === ignoredSessionId) {
        continue;
      }

      if (player.x === x && player.y === y) {
        return true;
      }
    }

    for (const enemy of this.state.enemies.values()) {
      if (!enemy.alive || enemy.id === ignoredEnemyId) {
        continue;
      }

      if (enemy.x === x && enemy.y === y) {
        return true;
      }
    }

    return false;
  }

  private buildActiveTurnView(): ActiveTurnView {
    if (this.state.activeTurnType === "player") {
      const player = this.state.players.get(this.state.activeTurnId);
      if (player) {
        return { type: "player", id: player.id, name: player.name };
      }
    }

    if (this.state.activeTurnType === "enemy") {
      const enemy = this.state.enemies.get(this.state.activeTurnId);
      if (enemy) {
        return { type: "enemy", id: enemy.id, name: enemy.name };
      }
    }

    return { type: "none", id: "", name: "No active turn" };
  }

  private buildSceneActions(): SceneActionView[] {
    switch (this.getCurrentScene().id) {
      case "tavern":
        return [
          { id: "accept_quest", label: "Accept Quest" },
          { id: "leave", label: "Leave" }
        ];
      case "merchant":
        return [{ id: "continue_to_boss", label: "Continue to Boss" }];
      case "victory":
        return [{ id: "return_to_lobby", label: "Return to Lobby" }];
      default:
        return [];
    }
  }

  private buildMerchantItems(): MerchantItemView[] {
    if (this.getCurrentScene().sceneType !== "shop") {
      return [];
    }

    return merchantItemIds
      .map((itemId) => itemsById.get(itemId))
      .filter((item): item is ItemDefinition => item !== undefined)
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        effect: item.effect
      }));
  }

  private buildVictorySummary(): VictorySummaryView | null {
    if (this.getCurrentScene().sceneType !== "victory") {
      return null;
    }

    const startedAt = this.state.adventureStartedAt ? new Date(this.state.adventureStartedAt).getTime() : Date.now();
    const completedAt = this.state.adventureCompletedAt ? new Date(this.state.adventureCompletedAt).getTime() : Date.now();

    return {
      playersSurvived: this.getLivingPlayers().length,
      goldEarned: this.state.totalGoldEarned,
      enemiesDefeated: this.state.enemiesDefeated,
      totalTurns: this.state.totalTurns,
      adventureDuration: formatDuration(completedAt - startedAt)
    };
  }

  private syncState() {
    const nextState = new LobbyState();
    nextState.roomCode = this.state.roomCode;
    nextState.currentSceneId = this.state.currentSceneId;
    nextState.gridWidth = this.state.gridWidth;
    nextState.gridHeight = this.state.gridHeight;
    nextState.activeTurnType = this.state.activeTurnType;
    nextState.activeTurnId = this.state.activeTurnId;
    nextState.partyGold = this.state.partyGold;
    nextState.totalGoldEarned = this.state.totalGoldEarned;
    nextState.enemiesDefeated = this.state.enemiesDefeated;
    nextState.totalTurns = this.state.totalTurns;
    nextState.adventureStartedAt = this.state.adventureStartedAt;
    nextState.adventureCompletedAt = this.state.adventureCompletedAt;

    for (const [sessionId, player] of this.state.players.entries()) {
      nextState.players.set(sessionId, clonePlayerState(player));
    }

    for (const [enemyId, enemy] of this.state.enemies.entries()) {
      nextState.enemies.set(enemyId, cloneEnemyState(enemy));
    }

    resetStringArray(nextState.turnOrder, [...this.state.turnOrder].filter(isString));
    resetStringArray(nextState.completedEncounters, [...this.state.completedEncounters].filter(isString));

    for (const entry of this.state.combatLog) {
      if (entry) {
        nextState.combatLog.push(cloneCombatLogEntry(entry));
      }
    }

    this.setState(nextState);
  }

  private publishSnapshot() {
    this.broadcast("roomState", this.buildSnapshot());
  }

  private buildSnapshot(): RoomSnapshot {
    const currentScene = this.getCurrentScene();
    const activeTurn = this.buildActiveTurnView();

    return {
      roomCode: this.state.roomCode,
      currentScene: {
        id: currentScene.id,
        title: currentScene.title,
        description: currentScene.description,
        objective: currentScene.objective ?? "Complete the current objective.",
        mapId: currentScene.mapId,
        sceneType: currentScene.sceneType
      },
      sceneActions: this.buildSceneActions(),
      gridWidth: this.state.gridWidth,
      gridHeight: this.state.gridHeight,
      activeTurn,
      turnOrder: [
        ...this.getLivingPlayerOrder().map((playerId) => {
          const player = this.state.players.get(playerId);
          return player
            ? {
                id: player.id,
                name: player.name,
                kind: "player" as const,
                subtitle: player.className,
                active: activeTurn.type === "player" && activeTurn.id === player.id
              }
            : undefined;
        }),
        ...this.getLivingEnemies().map((enemy) => ({
          id: enemy.id,
          name: enemy.name,
          kind: "enemy" as const,
          subtitle: `${enemy.hp}/${enemy.maxHp} HP`,
          active: activeTurn.type === "enemy" && activeTurn.id === enemy.id
        }))
      ].filter((entry): entry is TurnOrderEntry => entry !== undefined),
      partyGold: this.state.partyGold,
      totalGoldEarned: this.state.totalGoldEarned,
      enemiesDefeated: this.state.enemiesDefeated,
      completedEncounters: [...this.state.completedEncounters].filter(isString),
      merchantItems: this.buildMerchantItems(),
      victorySummary: this.buildVictorySummary(),
      players: [...this.state.players.values()].map((player) => ({
        id: player.id,
        name: player.name,
        classId: player.classId,
        className: player.className,
        x: player.x,
        y: player.y,
        health: player.health,
        maxHealth: player.maxHealth,
        movement: player.movement,
        remainingMovement: player.remainingMovement,
        defense: player.defense,
        attackBonus: player.attackBonus,
        damageDice: player.damageDice,
        alive: player.alive,
        gold: player.gold,
        inventory: [...player.inventory].filter(isString)
      })),
      enemies: [...this.state.enemies.values()].map((enemy) => ({
        id: enemy.id,
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        defense: enemy.defense,
        x: enemy.x,
        y: enemy.y,
        movement: enemy.movement,
        attackBonus: enemy.attackBonus,
        damageDice: enemy.damageDice,
        alive: enemy.alive
      })),
      combatLog: [...this.state.combatLog]
        .filter((entry): entry is CombatLogEntry => entry !== undefined)
        .map((entry) => ({
          id: entry.id,
          message: entry.message
        }))
    };
  }
}

function getCombatStatsForClass(classId: string): CombatStats {
  return combatStatsByClassId[classId] ?? combatStatsByClassId.guardian!;
}

function applyCombatStatsToPlayer(player: PlayerState, stats: CombatStats) {
  player.attackBonus = stats.attackBonus;
  player.damageDice = stats.damageDice;
  player.defense = stats.defense;
}

function clonePlayerState(player: PlayerState) {
  const nextPlayer = new PlayerState();
  nextPlayer.id = player.id;
  nextPlayer.name = player.name;
  nextPlayer.classId = player.classId;
  nextPlayer.className = player.className;
  nextPlayer.x = player.x;
  nextPlayer.y = player.y;
  nextPlayer.health = player.health;
  nextPlayer.maxHealth = player.maxHealth;
  nextPlayer.movement = player.movement;
  nextPlayer.remainingMovement = player.remainingMovement;
  nextPlayer.defense = player.defense;
  nextPlayer.attackBonus = player.attackBonus;
  nextPlayer.damageDice = player.damageDice;
  nextPlayer.alive = player.alive;
  nextPlayer.gold = player.gold;
  resetStringArray(nextPlayer.inventory, [...player.inventory].filter(isString));
  return nextPlayer;
}

function cloneEnemyState(enemy: EnemyState) {
  const nextEnemy = new EnemyState();
  nextEnemy.id = enemy.id;
  nextEnemy.name = enemy.name;
  nextEnemy.hp = enemy.hp;
  nextEnemy.maxHp = enemy.maxHp;
  nextEnemy.defense = enemy.defense;
  nextEnemy.x = enemy.x;
  nextEnemy.y = enemy.y;
  nextEnemy.movement = enemy.movement;
  nextEnemy.attackBonus = enemy.attackBonus;
  nextEnemy.damageDice = enemy.damageDice;
  nextEnemy.alive = enemy.alive;
  return nextEnemy;
}

function cloneCombatLogEntry(entry: CombatLogEntry) {
  const nextEntry = new CombatLogEntry();
  nextEntry.id = entry.id;
  nextEntry.message = entry.message;
  return nextEntry;
}

function resetStringArray(target: { length: number; pop(): void; push(value: string): void }, values: string[]) {
  while (target.length > 0) {
    target.pop();
  }

  for (const value of values) {
    target.push(value);
  }
}

function appendUnique(target: { push(value: string): void }, value: string) {
  const values = target as unknown as Iterable<string>;
  if ([...values].includes(value)) {
    return;
  }

  target.push(value);
}

function isString(value: string | undefined): value is string {
  return typeof value === "string";
}

function calculateDistance(fromX: number, fromY: number, toX: number, toY: number) {
  return Math.abs(fromX - toX) + Math.abs(fromY - toY);
}

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollDiceExpression(expression: string) {
  const match = expression.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    return { total: 0 };
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = Number(match[3] ?? 0);
  let total = modifier;

  for (let index = 0; index < count; index += 1) {
    total += rollDie(sides);
  }

  return { total };
}

function isWholeNumber(value: number) {
  return Number.isInteger(value);
}

function normalizeRoomCode(roomCode?: string) {
  const normalized = roomCode?.trim().toLowerCase();

  if (!normalized) {
    return "local-adventure";
  }

  return normalized.replace(/[^a-z0-9-_]/g, "").slice(0, 24) || "local-adventure";
}

function sanitizePlayerName(playerName?: string) {
  const trimmedName = playerName?.trim();

  if (!trimmedName) {
    return `Guest-${Math.random().toString(36).slice(2, 6)}`;
  }

  return trimmedName.slice(0, 20);
}

function defaultSceneDefinition(): SceneDefinition {
  return scenesById.get("tavern") ?? {
    id: "tavern",
    title: "Tavern",
    description: "Gather your party.",
    mapId: "tavern",
    sceneType: "story",
    objective: "Begin the adventure."
  };
}

function defaultMapDefinition(): MapDefinition {
  return mapsById.get("forest") ?? {
    id: "forest",
    name: "Forest Road",
    width: 10,
    height: 8
  };
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
