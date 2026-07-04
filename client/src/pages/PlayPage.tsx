import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DmLogTabsPanel, DmPanel, EnemyPanel, LogPanel, PartyPanel, TurnOrderPanel } from "../components/GamePanels";
import { useRoomConnection } from "../game/RoomConnectionContext";
import type { EnemyView } from "../game/types";
import { createGameBridge, type TacticalSnapshot } from "../phaser/createPhaserConfig";

const phaserContainerId = "battlefield-preview";

export function PlayPage() {
  const navigate = useNavigate();
  const { roomCode: routeRoomCode = "" } = useParams();
  const {
    lobby,
    role,
    sessionId,
    roomCode,
    playerName,
    status,
    isConnected,
    requestState,
    move,
    attack,
    endTurn,
    purchase,
    sceneAction,
    runDmAction,
    runDmCommand
  } = useRoomConnection();
  const [sceneTarget, setSceneTarget] = useState("forest");
  const [goldAmount, setGoldAmount] = useState("5");
  const [commandDraft, setCommandDraft] = useState("");
  const [dmCommand, setDmCommand] = useState("");
  const [activeLogTab, setActiveLogTab] = useState<"public" | "dm">("public");
  const gameBridgeRef = useRef<ReturnType<typeof createGameBridge> | null>(null);

  useEffect(() => {
    requestState();
  }, []);

  useEffect(() => {
    if (lobby?.availableScenes.length) {
      setSceneTarget(lobby.currentScene.id);
    }
  }, [lobby?.availableScenes.length, lobby?.currentScene.id]);

  const currentPlayer = lobby?.players.find((player) => player.id === sessionId) ?? null;
  const activeTurn = lobby?.activeTurn ?? { type: "none", id: "", name: "No active turn" };
  const isCurrentPlayersTurn = activeTurn.type === "player" && activeTurn.id === sessionId;
  const activeTurnLabel =
    activeTurn.type === "none" ? "Waiting for players" : `${activeTurn.name}'s turn`;

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
    if (!isConnected || !lobby || roomCode !== routeRoomCode) {
      return;
    }

    gameBridgeRef.current = createGameBridge(phaserContainerId, (x, y) => {
      move(x, y);
    });

    return () => {
      gameBridgeRef.current?.destroy();
      gameBridgeRef.current = null;
    };
  }, [isConnected, lobby?.roomCode, move, roomCode, routeRoomCode]);

  useEffect(() => {
    if (!lobby) {
      return;
    }

    gameBridgeRef.current?.sync(
      tacticalSnapshot ?? {
        mapId: lobby.currentScene.mapId,
        sceneTitle: lobby.currentScene.title,
        width: lobby.gridWidth,
        height: lobby.gridHeight,
        tokens: []
      }
    );
  }, [lobby, tacticalSnapshot]);

  if (!isConnected || !lobby || roomCode !== routeRoomCode) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h1>Room connection required</h1>
          <p className="meta-copy">
            Join a room from the landing page before opening the play route directly.
          </p>
          <Link className="inline-link" to="/">
            Return to landing
          </Link>
        </section>
      </main>
    );
  }

  const currentScene = lobby.currentScene;

  function canAttackEnemy(enemy: EnemyView) {
    if (
      role !== "player" ||
      !currentPlayer ||
      !currentPlayer.alive ||
      !enemy.alive ||
      !isCurrentPlayersTurn
    ) {
      return false;
    }

    return Math.abs(currentPlayer.x - enemy.x) + Math.abs(currentPlayer.y - enemy.y) === 1;
  }

  function getEnemyRangeMessage(enemy: EnemyView) {
    if (role !== "player" || !currentPlayer || !enemy.alive) {
      return role === "dm" ? "DM observes combat" : "No target";
    }

    return canAttackEnemy(enemy) ? "Adjacent target" : "Move adjacent to attack";
  }

  function getMovementStatusMessage() {
    if (currentScene.sceneType !== "encounter") {
      return role === "dm" ? "Dungeon Master view." : "Movement unlocks during encounter scenes.";
    }

    if (activeTurn.type === "enemy") {
      return `${activeTurn.name} is acting automatically.`;
    }

    if (isCurrentPlayersTurn) {
      return `You have ${currentPlayer?.remainingMovement ?? 0} movement left.`;
    }

    return role === "dm" ? "Observing player turns." : "Click-to-move unlocks only on your turn.";
  }

  return (
    <main className="play-shell">
      <section className="play-header">
        <div>
          <span className="eyebrow">Live Adventure</span>
          <h1 data-testid="scene-title">{currentScene.title}</h1>
          <p data-testid="scene-description">{currentScene.description}</p>
          <p className="meta-copy" data-testid="scene-objective">
            Objective: {currentScene.objective}
          </p>
          <p className="meta-copy" data-testid="scene-type">
            Type: {currentScene.sceneType}
          </p>
        </div>
        <div className="status-card" data-testid="status-card">
          <span className="status-label">Status</span>
          <strong data-testid="status-message">{status}</strong>
          <span className="status-note" data-testid="connection-summary">
            Connected as {role === "dm" ? lobby.dmName : currentPlayer?.name ?? playerName} in {lobby.roomCode}.
          </span>
          <strong data-testid="active-turn-label">{activeTurnLabel}</strong>
        </div>
      </section>

      <section className="play-layout">
        <div className="play-main">
          <section className="panel play-map-panel">
            <div className="section-header">
              <h2>Tactical Map</h2>
              <span data-testid="movement-status">{getMovementStatusMessage()}</span>
            </div>
            <div className="map-shell" data-testid="map-shell">
              <div id={phaserContainerId} className="phaser-surface play-phaser-surface" />
            </div>
            <div className="button-row">
              <button
                type="button"
                data-testid="end-turn-button"
                onClick={endTurn}
                disabled={role !== "player" || !isCurrentPlayersTurn}
              >
                End turn
              </button>
            </div>
          </section>

          {currentScene.sceneType === "story" ? (
            <section className="panel">
              <h2>Story choices</h2>
              <div className="button-row">
                {lobby.sceneActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`scene-action-${action.id}`}
                    onClick={() => sceneAction(action.id)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {currentScene.sceneType === "shop" ? (
            <section className="panel">
              <h2>Merchant inventory</h2>
              <div className="shop-grid" data-testid="merchant-items">
                {lobby.merchantItems.map((item) => (
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
                        onClick={() => purchase(item.id)}
                        disabled={role !== "player" || !currentPlayer || currentPlayer.gold < item.price}
                      >
                        Buy
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="button-row top-gap">
                {lobby.sceneActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`scene-action-${action.id}`}
                    onClick={() => sceneAction(action.id)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {currentScene.sceneType === "victory" ? (
            <section className="panel" data-testid="victory-panel">
              <h2>Adventure Complete</h2>
              <div className="victory-grid">
                <p data-testid="victory-players-survived">
                  Players Survived: {lobby.victorySummary?.playersSurvived ?? 0}
                </p>
                <p data-testid="victory-gold-earned">
                  Gold Earned: {lobby.victorySummary?.goldEarned ?? 0}
                </p>
                <p data-testid="victory-enemies-defeated">
                  Enemies Defeated: {lobby.victorySummary?.enemiesDefeated ?? 0}
                </p>
                <p data-testid="victory-total-turns">
                  Total Turns: {lobby.victorySummary?.totalTurns ?? 0}
                </p>
                <p data-testid="victory-duration">
                  Adventure Duration: {lobby.victorySummary?.adventureDuration ?? "0m 0s"}
                </p>
              </div>
              <div className="button-row">
                {lobby.sceneActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-testid={`scene-action-${action.id}`}
                    onClick={() => sceneAction(action.id)}
                  >
                    {action.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigate(`/room/${routeRoomCode}`)}
                >
                  Back to Room Lobby
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <div className="play-side">
          {role === "dm" ? (
            <DmPanel
              lobby={lobby}
              role={role}
              sceneTarget={sceneTarget}
              onSceneTargetChange={setSceneTarget}
              goldAmount={goldAmount}
              onGoldAmountChange={setGoldAmount}
              commandDraft={commandDraft}
              onCommandDraftChange={setCommandDraft}
              dmCommand={dmCommand}
              onDmCommandChange={setDmCommand}
              onStartAdventure={() => runDmAction({ actionId: "startAdventure" })}
              onAdvanceScene={() => runDmAction({ actionId: "advanceScene" })}
              onPreviousScene={() => runDmAction({ actionId: "previousScene" })}
              onRestartScene={() => runDmAction({ actionId: "restartScene" })}
              onSetScene={(sceneId) => runDmAction({ actionId: "setScene", sceneId })}
              onSpawnGoblin={() => runDmAction({ actionId: "spawnGoblin" })}
              onSpawnGoblinChief={() => runDmAction({ actionId: "spawnGoblinChief" })}
              onAwardPartyGold={(amount) => runDmAction({ actionId: "awardPartyGold", amount })}
              onAddPublicMessage={(message) => {
                runDmAction({ actionId: "addPublicLogMessage", message });
                setCommandDraft("");
              }}
              onRunCommand={(command) => {
                runDmCommand(command);
                setDmCommand("");
              }}
            />
          ) : null}
          <PartyPanel lobby={lobby} />
          <TurnOrderPanel lobby={lobby} />
          <EnemyPanel
            enemies={lobby.enemies}
            canAttackEnemy={canAttackEnemy}
            getEnemyRangeMessage={getEnemyRangeMessage}
            onAttack={attack}
          />
          {role === "dm" ? (
            <>
              <DmLogTabsPanel
                publicLogs={lobby.publicLog}
                dmLogs={lobby.dmLog}
                activeTab={activeLogTab}
                onTabChange={setActiveLogTab}
              />
            </>
          ) : (
            <LogPanel
              title="Shared Log"
              logs={lobby.publicLog}
              testId="combat-log"
              countTestId="combat-log-count"
              entryPrefix="combat-log-entry-"
            />
          )}
        </div>
      </section>
    </main>
  );
}
