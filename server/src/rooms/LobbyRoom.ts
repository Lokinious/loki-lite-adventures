import type { Client } from "colyseus";
import colyseus from "colyseus";
import classDefinitions from "../../../content/classes.json" with { type: "json" };
import enemyDefinitions from "../../../content/enemies.json" with { type: "json" };
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

type RoomSnapshot = {
  roomCode: string;
  gridWidth: number;
  gridHeight: number;
  activeTurn: ActiveTurnView;
  turnOrder: TurnOrderEntry[];
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

type CharacterDefinition = {
  id: string;
  name: string;
  health: number;
  movement: number;
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

type CombatStats = {
  attackBonus: number;
  damageDice: string;
  defense: number;
};

type Point = {
  x: number;
  y: number;
};

const gridWidth = 10;
const gridHeight = 8;
const maxCombatLogEntries = 24;
const availableClasses = classDefinitions as CharacterDefinition[];
const availableEnemies = enemyDefinitions as EnemyDefinition[];
const defaultClass = availableClasses[0] ?? {
  id: "guardian",
  name: "Guardian",
  health: 14,
  movement: 5
};
const classesById = new Map(availableClasses.map((classDefinition) => [classDefinition.id, classDefinition]));
const combatStatsByClassId: Record<string, CombatStats> = {
  guardian: {
    attackBonus: 5,
    damageDice: "1d8+3",
    defense: 14
  },
  ranger: {
    attackBonus: 5,
    damageDice: "1d8+2",
    defense: 13
  },
  arcanist: {
    attackBonus: 4,
    damageDice: "1d10+2",
    defense: 11
  },
  mystic: {
    attackBonus: 4,
    damageDice: "1d6+2",
    defense: 12
  }
};
const goblinDefinition = availableEnemies.find((enemy) => enemy.id === "goblin") ?? {
  id: "goblin",
  name: "Goblin",
  health: 12,
  armorClass: 5,
  movement: 4,
  attacks: [
    {
      name: "Rusty Stab",
      toHit: 12,
      damage: "1d4+1"
    }
  ]
};
const spawnPoints: Point[] = [
  { x: 1, y: 1 },
  { x: 8, y: 1 },
  { x: 1, y: 6 },
  { x: 8, y: 6 },
  { x: 4, y: 1 },
  { x: 5, y: 6 }
];
const goblinSpawnPoint: Point = { x: 4, y: 1 };

export class LobbyRoom extends Room<LobbyState> {
  override maxClients = 6;
  private combatLogIndex = 0;

  override onCreate(options: JoinOptions) {
    const state = new LobbyState();
    state.roomCode = normalizeRoomCode(options.roomCode);
    state.gridWidth = gridWidth;
    state.gridHeight = gridHeight;

    this.setState(state);
    this.setMetadata({ roomCode: state.roomCode });
    this.spawnGoblin();

    this.onMessage("selectCharacter", (client, message: SelectCharacterMessage) => {
      this.handleCharacterSelection(client, message);
    });

    this.onMessage("requestMove", (client, message: MoveMessage) => {
      this.handleMoveRequest(client, message);
    });

    this.onMessage("endTurn", (client) => {
      this.handleEndTurn(client);
    });

    this.onMessage("requestAttack", (client, message: AttackMessage) => {
      this.handleAttackRequest(client, message);
    });

    this.onMessage("requestState", (client) => {
      this.send(client, "roomState", this.buildSnapshot());
    });
  }

  override onJoin(client: Client, options: JoinOptions) {
    const character = defaultClass;
    const spawnPoint = this.findSpawnPoint();
    const player = new PlayerState();

    player.id = client.sessionId;
    player.name = sanitizePlayerName(options.playerName);
    player.classId = character.id;
    player.className = character.name;
    player.health = character.health;
    player.maxHealth = character.health;
    player.movement = character.movement;
    player.remainingMovement = character.movement;
    applyCombatStatsToPlayer(player, getCombatStatsForClass(character.id));
    player.x = spawnPoint.x;
    player.y = spawnPoint.y;
    player.alive = true;

    this.state.players.set(client.sessionId, player);
    this.state.turnOrder.push(client.sessionId);

    if (!this.hasActiveTurn()) {
      this.startTurn(client.sessionId);
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

    const leftPlayerName = player.name;
    const wasActiveTurn =
      this.state.activeTurnType === "player" && this.state.activeTurnId === client.sessionId;

    this.state.players.delete(client.sessionId);
    this.removeTurnOrderEntry(client.sessionId);

    if (wasActiveTurn) {
      this.advanceTurn();
    } else if (this.state.turnOrder.length === 0) {
      this.state.activeTurnType = "none";
      this.state.activeTurnId = "";
    }

    this.addCombatLog(`${leftPlayerName} left the room.`);
    this.syncState();
    this.publishSnapshot();
  }

  override onDispose() {
    this.state.players.clear();
    this.state.enemies.clear();
    while (this.state.turnOrder.length > 0) {
      this.state.turnOrder.pop();
    }
  }

  private handleCharacterSelection(client: Client, message: SelectCharacterMessage) {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.isPlayerTurn(client.sessionId) && player.remainingMovement !== player.movement) {
      this.rejectAction(client, "Finish your turn before changing classes.");
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
    applyCombatStatsToPlayer(player, getCombatStatsForClass(selectedClass.id));
    player.alive = player.health > 0;

    this.addCombatLog(`${player.name} selected ${player.className}.`);
    this.syncState();
    this.publishSnapshot();
  }

  private handleMoveRequest(client: Client, message: MoveMessage) {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
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
    enemy.alive = enemy.hp > 0;

    this.addCombatLog(`${player.name} hits ${enemy.name}.`);
    this.addCombatLog(
      `Damage roll: ${player.damageDice} = ${damageResult.total}. ${enemy.name} is now at ${enemy.hp}/${enemy.maxHp} HP.`
    );

    if (!enemy.alive) {
      this.addCombatLog(`${enemy.name} is defeated.`);
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

  private startTurn(sessionId: string) {
    const player = this.state.players.get(sessionId);

    if (!player || !player.alive) {
      this.state.activeTurnType = "none";
      this.state.activeTurnId = "";
      return;
    }

    this.state.activeTurnType = "player";
    this.state.activeTurnId = sessionId;
    player.remainingMovement = player.movement;
    this.addCombatLog(`${player.name}'s turn begins.`);
  }

  private advanceTurn() {
    const order = this.getLivingPlayerOrder();

    if (order.length === 0) {
      this.state.activeTurnType = "none";
      this.state.activeTurnId = "";
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
        this.startTurn(nextSessionId);
      } else {
        this.state.activeTurnType = "none";
        this.state.activeTurnId = "";
      }
    }

    this.syncState();
    this.publishSnapshot();
  }

  private findSpawnPoint(): Point {
    for (const spawnPoint of spawnPoints) {
      if (!this.isOccupied(spawnPoint.x, spawnPoint.y)) {
        return spawnPoint;
      }
    }

    for (let y = 0; y < this.state.gridHeight; y += 1) {
      for (let x = 0; x < this.state.gridWidth; x += 1) {
        if (!this.isOccupied(x, y)) {
          return { x, y };
        }
      }
    }

    return { x: 0, y: 0 };
  }

  private isOccupied(x: number, y: number, ignoredSessionId?: string) {
    for (const [sessionId, player] of this.state.players.entries()) {
      if (sessionId === ignoredSessionId || !player.alive) {
        continue;
      }

      if (player.x === x && player.y === y) {
        return true;
      }
    }

    for (const enemy of this.state.enemies.values()) {
      if (!enemy.alive) {
        continue;
      }

      if (enemy.x === x && enemy.y === y) {
        return true;
      }
    }

    return false;
  }

  private removeTurnOrderEntry(sessionId: string) {
    const remainingOrder = [...this.state.turnOrder].filter(
      (entry): entry is string => typeof entry === "string" && entry !== sessionId
    );

    while (this.state.turnOrder.length > 0) {
      this.state.turnOrder.pop();
    }

    for (const remainingSessionId of remainingOrder) {
      this.state.turnOrder.push(remainingSessionId);
    }
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

  private syncState() {
    const nextState = new LobbyState();
    nextState.roomCode = this.state.roomCode;
    nextState.gridWidth = this.state.gridWidth;
    nextState.gridHeight = this.state.gridHeight;
    nextState.activeTurnType = this.state.activeTurnType;
    nextState.activeTurnId = this.state.activeTurnId;

    for (const [sessionId, player] of this.state.players.entries()) {
      nextState.players.set(sessionId, clonePlayerState(player));
    }

    for (const [enemyId, enemy] of this.state.enemies.entries()) {
      nextState.enemies.set(enemyId, cloneEnemyState(enemy));
    }

    for (const sessionId of this.state.turnOrder) {
      if (typeof sessionId === "string") {
        nextState.turnOrder.push(sessionId);
      }
    }

    for (const entry of this.state.combatLog) {
      nextState.combatLog.push(cloneCombatLogEntry(entry));
    }

    this.setState(nextState);
  }

  private publishSnapshot() {
    this.broadcast("roomState", this.buildSnapshot());
  }

  private buildSnapshot(): RoomSnapshot {
    const livingEnemies = this.getLivingEnemies();
    const activeTurn = this.buildActiveTurnView();

    return {
      roomCode: this.state.roomCode,
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
        ...livingEnemies.map((enemy) => ({
          id: enemy.id,
          name: enemy.name,
          kind: "enemy" as const,
          subtitle: `${enemy.hp}/${enemy.maxHp} HP`,
          active: activeTurn.type === "enemy" && activeTurn.id === enemy.id
        }))
      ].filter((entry): entry is TurnOrderEntry => entry !== undefined),
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
        alive: player.alive
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

  private spawnGoblin() {
    const goblin = new EnemyState();
    goblin.id = "goblin-1";
    goblin.name = goblinDefinition.name;
    goblin.hp = goblinDefinition.health;
    goblin.maxHp = goblinDefinition.health;
    goblin.defense = goblinDefinition.armorClass;
    goblin.x = goblinSpawnPoint.x;
    goblin.y = goblinSpawnPoint.y;
    goblin.movement = goblinDefinition.movement;
    goblin.attackBonus = goblinDefinition.attacks[0]?.toHit ?? 12;
    goblin.damageDice = goblinDefinition.attacks[0]?.damage ?? "1d4+1";
    goblin.alive = true;
    this.state.enemies.set(goblin.id, goblin);
  }

  private getLivingPlayerOrder() {
    return [...this.state.turnOrder].filter((sessionId): sessionId is string => {
      if (typeof sessionId !== "string") {
        return false;
      }

      const player = this.state.players.get(sessionId);
      return Boolean(player?.alive);
    });
  }

  private getLivingPlayers() {
    return [...this.state.players.values()].filter((player) => player.alive);
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

  private executeEnemyTurn() {
    const enemy = this.getLivingEnemies()[0];

    if (!enemy) {
      const firstPlayer = this.getLivingPlayerOrder()[0];
      if (firstPlayer) {
        this.startTurn(firstPlayer);
      }
      return;
    }

    this.state.activeTurnType = "enemy";
    this.state.activeTurnId = enemy.id;
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

    const firstPlayer = this.getLivingPlayerOrder()[0];

    if (firstPlayer) {
      this.startTurn(firstPlayer);
    } else {
      this.state.activeTurnType = "none";
      this.state.activeTurnId = "";
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
    const candidateSteps: Point[] = [];

    if (Math.abs(deltaX) >= Math.abs(deltaY) && deltaX !== 0) {
      candidateSteps.push({ x: enemy.x + Math.sign(deltaX), y: enemy.y });
    }

    if (deltaY !== 0) {
      candidateSteps.push({ x: enemy.x, y: enemy.y + Math.sign(deltaY) });
    }

    if (Math.abs(deltaX) < Math.abs(deltaY) && deltaX !== 0) {
      candidateSteps.push({ x: enemy.x + Math.sign(deltaX), y: enemy.y });
    }

    for (const candidate of candidateSteps) {
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

  private isOccupiedByLivingUnit(x: number, y: number, ignoredEnemyId?: string) {
    for (const player of this.state.players.values()) {
      if (player.alive && player.x === x && player.y === y) {
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
    target.remainingMovement = target.alive ? target.remainingMovement : 0;

    this.addCombatLog(`${enemy.name} hits ${target.name}.`);
    this.addCombatLog(
      `Enemy damage: ${enemy.damageDice} = ${damageResult.total}. ${target.name} is now at ${target.health}/${target.maxHealth} HP.`
    );

    if (!target.alive) {
      this.addCombatLog(`${target.name} is knocked out.`);
    }
  }
}

function calculateDistance(fromX: number, fromY: number, toX: number, toY: number) {
  return Math.abs(fromX - toX) + Math.abs(fromY - toY);
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
