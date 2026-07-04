import { useEffect, useMemo, useRef, useState } from "react";
import { Client, Room } from "colyseus.js";
import {
  createGameBridge,
  type TacticalSnapshot
} from "../phaser/createPhaserConfig";
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
  movement: number;
  remainingMovement: number;
};

type CombatLogEntryView = {
  id: number;
  message: string;
};

type LobbyView = {
  roomCode: string;
  gridWidth: number;
  gridHeight: number;
  activeTurnSessionId: string;
  turnOrder: string[];
  players: PlayerView[];
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
    gameBridgeRef.current = createGameBridge(phaserContainerId, (x, y) => {
      joinedRoomRef.current?.send("requestMove", { x, y });
    });

    return () => {
      gameBridgeRef.current?.destroy();
      gameBridgeRef.current = null;
    };
  }, []);

  useEffect(() => {
    joinedRoomRef.current = joinedRoom;
  }, [joinedRoom]);

  const playersById = useMemo(() => {
    return new Map(lobby?.players.map((player) => [player.id, player]) ?? []);
  }, [lobby]);

  const tacticalSnapshot = useMemo<TacticalSnapshot | null>(() => {
    if (!lobby) {
      return null;
    }

    return {
      width: lobby.gridWidth,
      height: lobby.gridHeight,
      tokens: lobby.players.map((player) => ({
        id: player.id,
        name: player.name,
        classId: player.classId,
        className: player.className,
        x: player.x,
        y: player.y,
        isActiveTurn: player.id === lobby.activeTurnSessionId,
        isSelf: player.id === sessionId
      }))
    };
  }, [lobby, sessionId]);

  const currentPlayer = lobby?.players.find((player) => player.id === sessionId) ?? null;
  const activePlayer =
    lobby?.players.find((player) => player.id === lobby.activeTurnSessionId) ?? null;
  const isCurrentPlayersTurn = activePlayer?.id === sessionId;

  useEffect(() => {
    gameBridgeRef.current?.sync(
      tacticalSnapshot ?? {
        width: 10,
        height: 8,
        tokens: []
      }
    );
  }, [tacticalSnapshot]);

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
      setStatus(
        `${mode === "create" ? "Created" : "Joined"} room ${roomCode}. Click a tile when it is your turn.`
      );

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

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Loki Lite Adventures</span>
          <h1>Local multiplayer prototype</h1>
          <p>
            Join the same room in two tabs, pick a class, move your token on your turn,
            and watch the shared action log update live.
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
              <h2>Connected players</h2>
              <span data-testid="connected-player-count">{lobby?.players.length ?? 0}/6</span>
            </div>
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
                    <span data-testid={`player-health-${player.id}`}>HP {player.health}</span>
                    <span data-testid={`player-move-${player.id}`}>
                      Move {player.remainingMovement}/{player.movement}
                    </span>
                    <span data-testid={`player-tile-${player.id}`}>
                      Tile {player.x + 1},{player.y + 1}
                    </span>
                  </div>
                </article>
              )) ?? <p className="meta-copy">Join a room to see the roster.</p>}
            </div>
          </section>
        </div>

        <div className="center-column">
          <section className="panel">
            <div className="section-header">
              <h2>Tactical map</h2>
              <span data-testid="active-turn-label">
                {activePlayer
                  ? `${activePlayer.name}'s turn`
                  : "Waiting for players"}
              </span>
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
                {isCurrentPlayersTurn
                  ? `You have ${currentPlayer?.remainingMovement ?? 0} movement left.`
                  : "Click-to-move unlocks only on your turn."}
              </span>
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="panel">
            <div className="section-header">
              <h2>Turn order</h2>
              <span data-testid="turn-order-status">{activePlayer ? "Live" : "Idle"}</span>
            </div>
            <ol className="turn-order" data-testid="turn-order-list">
              {lobby?.turnOrder.map((playerId) => {
                const player = playersById.get(playerId);

                if (!player) {
                  return null;
                }

                const isActive = player.id === lobby.activeTurnSessionId;

                return (
                  <li
                    key={player.id}
                    data-testid={`turn-order-item-${player.id}`}
                    data-player-name={player.name}
                    data-active={isActive ? "true" : "false"}
                    className={`turn-order__item${isActive ? " turn-order__item--active" : ""}`}
                  >
                    <strong>{player.name}</strong>
                    <span>{player.className}</span>
                  </li>
                );
              }) ?? <li className="meta-copy">Turn order appears after players join.</li>}
            </ol>
          </section>

          <section className="panel">
            <div className="section-header">
              <h2>Action log</h2>
              <span data-testid="combat-log-count">{lobby?.combatLog.length ?? 0} entries</span>
            </div>
            <div className="combat-log" data-testid="combat-log">
              {lobby?.combatLog.map((entry) => (
                <p key={entry.id} data-testid={`combat-log-entry-${entry.id}`}>
                  {entry.message}
                </p>
              )) ?? <p className="meta-copy">Room activity will appear here.</p>}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
