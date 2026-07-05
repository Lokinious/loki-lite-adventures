import { useEffect, useMemo, useRef, useState } from "react";
import { Client, Room } from "colyseus.js";
import { createGameBridge, type TacticalSnapshot } from "../phaser/createPhaserConfig";
import { getPlayableClasses } from "../services/content";

const phaserContainerId = "battlefield-preview";
const defaultRoomCode = "local-adventure";
const defaultPlayerName = `Guest-${Math.random().toString(36).slice(2, 6)}`;

type PlayerView = {
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
};

type EnemyView = {
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
};

type CombatLogEntryView = {
  id: number;
  message: string;
};

type ActiveTurnView = {
  type: "player" | "enemy" | "none";
  id: string;
  name: string;
};

type TurnOrderEntryView = {
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

type LobbyView = {
  roomCode: string;
  currentScene: SceneView;
  sceneActions: SceneActionView[];
  gridWidth: number;
  gridHeight: number;
  activeTurn: ActiveTurnView;
  turnOrder: TurnOrderEntryView[];
  partyGold: number;
  totalGoldEarned: number;
  enemiesDefeated: number;
  completedEncounters: string[];
  merchantItems: MerchantItemView[];
  victorySummary: VictorySummaryView | null;
  players: PlayerView[];
  enemies: EnemyView[];
  combatLog: CombatLogEntryView[];
};

type JoinedRoom = Room;
type GameBridge = ReturnType<typeof createGameBridge>;

function getServerUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.hostname}:2567`;
}

export function HomePage() {
  const playableClasses = useMemo(() => getPlayableClasses(), []);
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [status, setStatus] = useState("Connect to the local server to begin.");
  const [joinedRoom, setJoinedRoom] = useState<JoinedRoom | null>(null);
  const [lobby, setLobby] = useState<LobbyView | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(playableClasses[0]?.id ?? "");
  const joinedRoomRef = useRef<JoinedRoom | null>(null);
  const gameBridgeRef = useRef<GameBridge | null>(null);

  useEffect(() => {
    gameBridgeRef.current = createGameBridge(
      phaserContainerId,
      (x, y) => {
        joinedRoomRef.current?.send("requestMove", { x, y });
      },
      () => {}
    );

    return () => {
      gameBridgeRef.current?.destroy();
      gameBridgeRef.current = null;
    };
  }, []);

  useEffect(() => {
    joinedRoomRef.current = joinedRoom;
  }, [joinedRoom]);

  const currentScene = lobby?.currentScene ?? null;
  const playersById = useMemo(
    () => new Map(lobby?.players.map((player) => [player.id, player]) ?? []),
    [lobby]
  );
  const currentPlayer = lobby?.players.find((player) => player.id === sessionId) ?? null;
  const activeTurn = lobby?.activeTurn ?? { type: "none", id: "", name: "No active turn" };
  const isCurrentPlayersTurn = activeTurn.type === "player" && activeTurn.id === sessionId;
  const activeTurnLabel =
    activeTurn.type === "none" ? "Waiting for players" : `${activeTurn.name}'s turn`;
  const sceneStatusLabel =
    currentScene?.sceneType === "encounter"
      ? activeTurnLabel
      : currentScene?.sceneType === "shop"
        ? "Merchant scene"
        : currentScene?.sceneType === "victory"
          ? "Victory"
          : "Story scene";

  const tacticalSnapshot = useMemo<TacticalSnapshot | null>(() => {
    if (!lobby || lobby.currentScene.sceneType !== "encounter") {
      return null;
    }

    return {
      mapId: lobby.currentScene.mapId,
      sceneTitle: lobby.currentScene.title,
      width: lobby.gridWidth,
      height: lobby.gridHeight,
      tokens: [
        ...lobby.players
          .filter((player) => player.alive)
          .map((player) => ({
            id: player.id,
            name: player.name,
            classId: player.classId,
            className: player.className,
            tokenKind: "player" as const,
            x: player.x,
            y: player.y,
            isActiveTurn: activeTurn.type === "player" && activeTurn.id === player.id,
            isSelf: player.id === sessionId
          })),
        ...lobby.enemies
          .filter((enemy) => enemy.alive)
          .map((enemy) => ({
            id: enemy.id,
            name: enemy.name,
            classId: "enemy-goblin",
            className: enemy.name,
            tokenKind: "enemy" as const,
            x: enemy.x,
            y: enemy.y,
            isActiveTurn: activeTurn.type === "enemy" && activeTurn.id === enemy.id,
            isSelf: false
          }))
      ]
    };
  }, [activeTurn, lobby, sessionId]);

  useEffect(() => {
    gameBridgeRef.current?.sync(
      tacticalSnapshot ?? {
        mapId: "tavern",
        sceneTitle: currentScene?.title ?? "Tavern",
        width: 10,
        height: 8,
        tokens: []
      }
    );
  }, [currentScene?.title, tacticalSnapshot]);

  useEffect(() => {
    setSelectedClassId(currentPlayer?.classId ?? playableClasses[0]?.id ?? "");
  }, [currentPlayer?.classId, playableClasses]);

  async function connectToRoom(mode: "create" | "join") {
    const client = new Client(getServerUrl());

    try {
      if (joinedRoomRef.current) {
        void joinedRoomRef.current.leave();
      }

      const room =
        mode === "create"
          ? await client.create("lobby", { roomCode, playerName })
          : await client.join("lobby", { roomCode, playerName });
      const typedRoom = room as JoinedRoom;

      setJoinedRoom(typedRoom);
      setSessionId(typedRoom.sessionId);
      setStatus(`${mode === "create" ? "Created" : "Joined"} room ${roomCode}.`);

      typedRoom.onMessage("roomState", (snapshot: LobbyView) => {
        setLobby(snapshot);
      });

      typedRoom.onMessage("actionRejected", (message: { message: string }) => {
        setStatus(message.message);
      });

      typedRoom.onLeave(() => {
        setJoinedRoom(null);
        setLobby(null);
        setSessionId("");
        setStatus("Disconnected from the room.");
      });

      typedRoom.send("requestState");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to connect to the room.");
    }
  }

  function handleClassSelection(classId: string) {
    setSelectedClassId(classId);
    joinedRoom?.send("selectCharacter", { classId });
  }

  function handleEndTurn() {
    joinedRoom?.send("endTurn");
  }

  function handleAttack(targetId: string) {
    joinedRoom?.send("requestAttack", { targetId });
  }

  function handleSceneAction(actionId: string) {
    joinedRoom?.send("requestSceneAction", { actionId });
  }

  function handlePurchase(itemId: string) {
    joinedRoom?.send("requestPurchase", { itemId });
  }

  function canAttackEnemy(enemy: EnemyView) {
    if (!currentPlayer || !currentPlayer.alive || !enemy.alive || !isCurrentPlayersTurn) {
      return false;
    }

    return Math.abs(currentPlayer.x - enemy.x) + Math.abs(currentPlayer.y - enemy.y) === 1;
  }

  function getEnemyRangeMessage(enemy: EnemyView) {
    if (!currentPlayer || !enemy.alive) {
      return "No target";
    }

    if (canAttackEnemy(enemy)) {
      return "Adjacent target";
    }

    return "Move adjacent to attack";
  }

  function getMovementStatusMessage() {
    if (!currentScene || currentScene.sceneType !== "encounter") {
      return "Scene actions drive the story forward.";
    }

    if (activeTurn.type === "enemy") {
      return `${activeTurn.name} is acting automatically.`;
    }

    if (isCurrentPlayersTurn) {
      return `You have ${currentPlayer?.remainingMovement ?? 0} movement left.`;
    }

    return "Click-to-move unlocks only on your turn.";
  }

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Loki Lite Adventures</span>
          <h1>First complete adventure</h1>
          <p>
            Start in the tavern, clear the forest road, visit the merchant, defeat the
            Goblin Chief, and finish the adventure together.
          </p>
        </div>
        <div className="status-card" data-testid="status-card">
          <span className="status-label">Status</span>
          <strong data-testid="status-message">{status}</strong>
          <span className="status-note">Server URL: {getServerUrl()}</span>
        </div>
      </section>

      <section className="lobby-layout">
        <div className="left-column">
          <section className="panel">
            <h2>Room controls</h2>
            <label className="field">
              <span>Player name</span>
              <input
                data-testid="player-name-input"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                maxLength={20}
              />
            </label>
            <label className="field">
              <span>Room code</span>
              <input
                data-testid="room-code-input"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value)}
                maxLength={24}
              />
            </label>
            <div className="button-row">
              <button
                type="button"
                data-testid="create-room-button"
                onClick={() => void connectToRoom("create")}
              >
                Create room
              </button>
              <button
                type="button"
                data-testid="join-room-button"
                onClick={() => void connectToRoom("join")}
              >
                Join room
              </button>
            </div>
            {joinedRoom ? (
              <p className="meta-copy" data-testid="connection-summary">
                Connected as <strong>{currentPlayer?.name ?? playerName}</strong> in{" "}
                <strong>{lobby?.roomCode ?? roomCode}</strong>.
              </p>
            ) : null}
          </section>

          <section className="panel">
            <div className="section-header">
              <h2>Class selection</h2>
              <span data-testid="selected-class-label">
                {currentPlayer?.className ?? "Not selected yet"}
              </span>
            </div>
            <div className="class-grid">
              {playableClasses.map((playableClass) => {
                const isSelected = selectedClassId === playableClass.id;

                return (
                  <button
                    key={playableClass.id}
                    type="button"
                    data-testid={`class-card-${playableClass.id}`}
                    className={`class-card${isSelected ? " class-card--selected" : ""}`}
                    onClick={() => handleClassSelection(playableClass.id)}
                    disabled={!joinedRoom}
                  >
                    <strong>{playableClass.name}</strong>
                    <span>Health: {playableClass.health}</span>
                    <span>Movement: {playableClass.movement}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="section-header">
              <h2>Party</h2>
              <span data-testid="connected-player-count">
                {lobby?.players.length ?? 0}/6
              </span>
            </div>
            <p className="meta-copy" data-testid="party-gold">
              Party Gold: {lobby?.partyGold ?? 0}
            </p>
            <div className="player-list" data-testid="player-list">
              {lobby?.players.map((player) => (
                <article
                  key={player.id}
                  className="player-card"
                  data-testid={`player-card-${player.id}`}
                  data-player-name={player.name}
                >
                  <div>
                    <strong data-testid={`player-name-${player.id}`}>{player.name}</strong>
                    <p data-testid={`player-class-${player.id}`}>{player.className}</p>
                  </div>
                  <div className="player-stats">
                    <span data-testid={`player-health-${player.id}`}>
                      HP {player.health}/{player.maxHealth}
                    </span>
                    <span data-testid={`player-move-${player.id}`}>
                      Move {player.remainingMovement}/{player.movement}
                    </span>
                    <span data-testid={`player-tile-${player.id}`}>
                      Tile {player.x + 1},{player.y + 1}
                    </span>
                    <span data-testid={`player-gold-${player.id}`}>Gold {player.gold}</span>
                    <span data-testid={`player-state-${player.id}`}>
                      {player.alive ? "Ready" : "Knocked out"}
                    </span>
                  </div>
                  <p data-testid={`player-inventory-${player.id}`}>
                    Inventory: {player.inventory.length ? player.inventory.join(", ") : "Empty"}
                  </p>
                </article>
              )) ?? <p className="meta-copy">Join a room to see the party.</p>}
            </div>
          </section>
        </div>

        <div className="center-column">
          <section className="panel" data-testid="scene-panel">
            <div className="section-header">
              <h2 data-testid="scene-title">{currentScene?.title ?? "Tavern"}</h2>
              <span data-testid="active-turn-label">{sceneStatusLabel}</span>
            </div>
            <p className="scene-copy" data-testid="scene-description">
              {currentScene?.description ?? "Choose an action to begin."}
            </p>
            <p className="meta-copy" data-testid="scene-objective">
              Objective: {currentScene?.objective ?? "Gather the party."}
            </p>
            <p className="meta-copy" data-testid="scene-type">
              Type: {currentScene?.sceneType ?? "story"}
            </p>
            {lobby?.completedEncounters.length ? (
              <p className="meta-copy" data-testid="completed-encounters">
                Completed: {lobby.completedEncounters.join(", ")}
              </p>
            ) : null}
          </section>

          <section
            className="panel"
            style={{ display: currentScene?.sceneType === "encounter" ? "block" : "none" }}
          >
            <div className="section-header">
              <h2>Tactical map</h2>
            </div>
            <div className="map-shell" data-testid="map-shell">
              <div id={phaserContainerId} className="phaser-surface" />
            </div>
            <div className="button-row">
              <button
                type="button"
                data-testid="end-turn-button"
                onClick={handleEndTurn}
                disabled={!joinedRoom || !isCurrentPlayersTurn}
              >
                End turn
              </button>
              <span className="meta-copy" data-testid="movement-status">
                {getMovementStatusMessage()}
              </span>
            </div>
          </section>

          {currentScene?.sceneType === "story" ? (
            <section className="panel">
              <div className="section-header">
                <h2>Story choices</h2>
              </div>
              <div className="button-row">
                {(lobby?.sceneActions ?? []).map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`scene-action-${action.id}`}
                    onClick={() => handleSceneAction(action.id)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {currentScene?.sceneType === "shop" ? (
            <section className="panel">
              <div className="section-header">
                <h2>Merchant inventory</h2>
              </div>
              <div className="shop-grid" data-testid="merchant-items">
                {(lobby?.merchantItems ?? []).map((item) => (
                  <article key={item.id} className="player-card" data-testid={`shop-item-${item.id}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.effect}</p>
                    </div>
                    <div className="button-row">
                      <span data-testid={`shop-price-${item.id}`}>{item.price} gold</span>
                      <button
                        type="button"
                        data-testid={`merchant-buy-${item.id}`}
                        onClick={() => handlePurchase(item.id)}
                        disabled={!currentPlayer || currentPlayer.gold < item.price}
                      >
                        Buy
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="button-row top-gap">
                {(lobby?.sceneActions ?? []).map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`scene-action-${action.id}`}
                    onClick={() => handleSceneAction(action.id)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {currentScene?.sceneType === "victory" ? (
            <section className="panel" data-testid="victory-panel">
              <div className="section-header">
                <h2>Adventure Complete</h2>
              </div>
              <div className="victory-grid">
                <p data-testid="victory-players-survived">
                  Players Survived: {lobby?.victorySummary?.playersSurvived ?? 0}
                </p>
                <p data-testid="victory-gold-earned">
                  Gold Earned: {lobby?.victorySummary?.goldEarned ?? 0}
                </p>
                <p data-testid="victory-enemies-defeated">
                  Enemies Defeated: {lobby?.victorySummary?.enemiesDefeated ?? 0}
                </p>
                <p data-testid="victory-total-turns">
                  Total Turns: {lobby?.victorySummary?.totalTurns ?? 0}
                </p>
                <p data-testid="victory-duration">
                  Adventure Duration: {lobby?.victorySummary?.adventureDuration ?? "0m 0s"}
                </p>
              </div>
              <div className="button-row">
                {(lobby?.sceneActions ?? []).map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`scene-action-${action.id}`}
                    onClick={() => handleSceneAction(action.id)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="right-column">
          <section className="panel">
            <div className="section-header">
              <h2>Enemies</h2>
              <span data-testid="enemy-count">{lobby?.enemies.length ?? 0} total</span>
            </div>
            <div className="player-list" data-testid="enemy-list">
              {lobby?.enemies.length ? (
                lobby.enemies.map((enemy) => (
                  <article
                    key={enemy.id}
                    className="player-card enemy-card"
                    data-testid={`enemy-card-${enemy.id}`}
                    data-enemy-name={enemy.name}
                  >
                    <div>
                      <strong data-testid={`enemy-name-${enemy.id}`}>{enemy.name}</strong>
                      <p data-testid={`enemy-status-${enemy.id}`}>
                        {enemy.alive ? "Alive" : "Defeated"}
                      </p>
                    </div>
                    <div className="player-stats">
                      <span data-testid={`enemy-health-${enemy.id}`}>
                        HP {enemy.hp}/{enemy.maxHp}
                      </span>
                      <span data-testid={`enemy-defense-${enemy.id}`}>
                        Defense {enemy.defense}
                      </span>
                      <span data-testid={`enemy-tile-${enemy.id}`}>
                        Tile {enemy.x + 1},{enemy.y + 1}
                      </span>
                    </div>
                    <div className="button-row">
                      <button
                        type="button"
                        data-testid={`enemy-attack-button-${enemy.id}`}
                        onClick={() => handleAttack(enemy.id)}
                        disabled={currentScene?.sceneType !== "encounter" || !canAttackEnemy(enemy)}
                      >
                        Attack
                      </button>
                      <span className="meta-copy" data-testid={`enemy-range-${enemy.id}`}>
                        {getEnemyRangeMessage(enemy)}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="meta-copy">No active enemies in this scene.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="section-header">
              <h2>Turn order</h2>
              <span data-testid="turn-order-status">
                {activeTurn.type === "none" ? "Idle" : "Live"}
              </span>
            </div>
            <ol className="turn-order" data-testid="turn-order-list">
              {lobby?.turnOrder.length ? (
                lobby.turnOrder.map((turnEntry) => (
                  <li
                    key={turnEntry.id}
                    data-testid={`turn-order-item-${turnEntry.id}`}
                    data-player-name={turnEntry.name}
                    data-active={turnEntry.active ? "true" : "false"}
                    className={`turn-order__item${turnEntry.active ? " turn-order__item--active" : ""}`}
                  >
                    <strong>{turnEntry.name}</strong>
                    <span>{turnEntry.subtitle}</span>
                  </li>
                ))
              ) : (
                <li className="meta-copy">Turn order appears during encounters.</li>
              )}
            </ol>
          </section>

          <section className="panel">
            <div className="section-header">
              <h2>Action log</h2>
              <span data-testid="combat-log-count">{lobby?.combatLog.length ?? 0} entries</span>
            </div>
            <div className="combat-log" data-testid="combat-log">
              {lobby?.combatLog.length ? (
                lobby.combatLog.map((entry) => (
                  <p key={entry.id} data-testid={`combat-log-entry-${entry.id}`}>
                    {entry.message}
                  </p>
                ))
              ) : (
                <p className="meta-copy">Room activity will appear here.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
