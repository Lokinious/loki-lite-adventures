import type { Client } from "colyseus";
import colyseus from "colyseus";
import classDefinitions from "../../../content/classes.json" with { type: "json" };
import { CombatLogEntry, LobbyState, PlayerState } from "./schema/LobbyState.js";

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

type RoomSnapshot = {
  roomCode: string;
  gridWidth: number;
  gridHeight: number;
  activeTurnSessionId: string;
  turnOrder: string[];
  players: Array<{
    id: string;
    name: string;
    classId: string;
    className: string;
    x: number;
    y: number;
    health: number;
    movement: number;
    remainingMovement: number;
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

type Point = {
  x: number;
  y: number;
};

const gridWidth = 10;
const gridHeight = 8;
const maxCombatLogEntries = 24;
const availableClasses = classDefinitions as CharacterDefinition[];
const defaultClass = availableClasses[0] ?? {
  id: "guardian",
  name: "Guardian",
  health: 14,
  movement: 5
};
const classesById = new Map(availableClasses.map((classDefinition) => [classDefinition.id, classDefinition]));
const spawnPoints: Point[] = [
  { x: 1, y: 1 },
  { x: 8, y: 1 },
  { x: 1, y: 6 },
  { x: 8, y: 6 },
  { x: 4, y: 1 },
  { x: 5, y: 6 }
];

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

    this.onMessage("selectCharacter", (client, message: SelectCharacterMessage) => {
      this.handleCharacterSelection(client, message);
    });

    this.onMessage("requestMove", (client, message: MoveMessage) => {
      this.handleMoveRequest(client, message);
    });

    this.onMessage("endTurn", (client) => {
      this.handleEndTurn(client);
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
    player.movement = character.movement;
    player.remainingMovement = character.movement;
    player.x = spawnPoint.x;
    player.y = spawnPoint.y;

    this.state.players.set(client.sessionId, player);
    this.state.turnOrder.push(client.sessionId);

    if (!this.state.activeTurnSessionId) {
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
    const wasActiveTurn = this.state.activeTurnSessionId === client.sessionId;

    this.state.players.delete(client.sessionId);
    this.removeTurnOrderEntry(client.sessionId);

    if (wasActiveTurn) {
      this.advanceTurn();
    } else if (this.state.turnOrder.length === 0) {
      this.state.activeTurnSessionId = "";
    }

    this.addCombatLog(`${leftPlayerName} left the room.`);
    this.syncState();
    this.publishSnapshot();
  }

  override onDispose() {
    this.state.players.clear();
    while (this.state.turnOrder.length > 0) {
      this.state.turnOrder.pop();
    }
  }

  private handleCharacterSelection(client: Client, message: SelectCharacterMessage) {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (
      this.state.activeTurnSessionId === client.sessionId &&
      player.remainingMovement !== player.movement
    ) {
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
    player.movement = selectedClass.movement;
    player.remainingMovement = selectedClass.movement;

    this.addCombatLog(`${player.name} selected ${player.className}.`);
    this.syncState();
    this.publishSnapshot();
  }

  private handleMoveRequest(client: Client, message: MoveMessage) {
    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.state.activeTurnSessionId !== client.sessionId) {
      this.rejectAction(client, "It is not your turn.");
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
      this.rejectAction(client, "Another adventurer is already on that tile.");
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

  private handleEndTurn(client: Client) {
    if (this.state.activeTurnSessionId !== client.sessionId) {
      this.rejectAction(client, "Only the active player can end the turn.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (player) {
      this.addCombatLog(`${player.name} ended their turn.`);
    }

    this.advanceTurn();
    this.syncState();
    this.publishSnapshot();
  }

  private startTurn(sessionId: string) {
    const player = this.state.players.get(sessionId);

    if (!player) {
      this.state.activeTurnSessionId = "";
      return;
    }

    this.state.activeTurnSessionId = sessionId;
    player.remainingMovement = player.movement;
    this.addCombatLog(`${player.name}'s turn begins.`);
  }

  private advanceTurn() {
    const order = [...this.state.turnOrder].filter(
      (sessionId): sessionId is string =>
        typeof sessionId === "string" && this.state.players.has(sessionId)
    );

    if (order.length === 0) {
      this.state.activeTurnSessionId = "";
      return;
    }

    const currentIndex = order.indexOf(this.state.activeTurnSessionId);
    const nextSessionId =
      currentIndex === -1
        ? order[0]
        : order[(currentIndex + 1 + order.length) % order.length];

    if (!nextSessionId) {
      this.state.activeTurnSessionId = "";
      return;
    }

    this.startTurn(nextSessionId);
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
      if (sessionId === ignoredSessionId) {
        continue;
      }

      if (player.x === x && player.y === y) {
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
    nextState.activeTurnSessionId = this.state.activeTurnSessionId;

    for (const [sessionId, player] of this.state.players.entries()) {
      nextState.players.set(sessionId, clonePlayerState(player));
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
    return {
      roomCode: this.state.roomCode,
      gridWidth: this.state.gridWidth,
      gridHeight: this.state.gridHeight,
      activeTurnSessionId: this.state.activeTurnSessionId,
      turnOrder: [...this.state.turnOrder].filter(
        (sessionId): sessionId is string => typeof sessionId === "string"
      ),
      players: [...this.state.players.values()].map((player) => ({
        id: player.id,
        name: player.name,
        classId: player.classId,
        className: player.className,
        x: player.x,
        y: player.y,
        health: player.health,
        movement: player.movement,
        remainingMovement: player.remainingMovement
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

function clonePlayerState(player: PlayerState) {
  const nextPlayer = new PlayerState();
  nextPlayer.id = player.id;
  nextPlayer.name = player.name;
  nextPlayer.classId = player.classId;
  nextPlayer.className = player.className;
  nextPlayer.x = player.x;
  nextPlayer.y = player.y;
  nextPlayer.health = player.health;
  nextPlayer.movement = player.movement;
  nextPlayer.remainingMovement = player.remainingMovement;
  return nextPlayer;
}

function cloneCombatLogEntry(entry: CombatLogEntry) {
  const nextEntry = new CombatLogEntry();
  nextEntry.id = entry.id;
  nextEntry.message = entry.message;
  return nextEntry;
}
