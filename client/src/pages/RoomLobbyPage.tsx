import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DmPanel, EnemyPanel, LogPanel, PartyPanel } from "../components/GamePanels";
import { useRoomConnection } from "../game/RoomConnectionContext";
import type { EnemyView } from "../game/types";
import { getPlayableClasses } from "../services/content";

export function RoomLobbyPage() {
  const navigate = useNavigate();
  const { roomCode: routeRoomCode = "" } = useParams();
  const playableClasses = useMemo(() => getPlayableClasses(), []);
  const {
    lobby,
    role,
    sessionId,
    roomCode,
    playerName,
    status,
    isConnected,
    requestState,
    selectClass,
    attack,
    sceneAction,
    runDmAction,
    runDmCommand
  } = useRoomConnection();
  const [selectedClassId, setSelectedClassId] = useState(playableClasses[0]?.id ?? "");
  const [sceneTarget, setSceneTarget] = useState("tavern");
  const [goldAmount, setGoldAmount] = useState("5");
  const [commandDraft, setCommandDraft] = useState("");
  const [dmCommand, setDmCommand] = useState("");

  useEffect(() => {
    requestState();
  }, []);

  useEffect(() => {
    if (lobby?.adventureStarted && routeRoomCode) {
      navigate(`/room/${routeRoomCode}/play`);
    }
  }, [lobby?.adventureStarted, navigate, routeRoomCode]);

  useEffect(() => {
    if (lobby?.availableScenes.length) {
      setSceneTarget(lobby.currentScene.id);
    }
  }, [lobby?.availableScenes.length, lobby?.currentScene.id]);

  const currentPlayer = lobby?.players.find((player) => player.id === sessionId) ?? null;

  useEffect(() => {
    setSelectedClassId(currentPlayer?.classId ?? playableClasses[0]?.id ?? "");
  }, [currentPlayer?.classId, playableClasses]);

  if (!isConnected || !lobby || roomCode !== routeRoomCode) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h1>Room connection required</h1>
          <p className="meta-copy">
            Join a room from the landing page before opening the lobby route directly.
          </p>
          <Link className="inline-link" to="/">
            Return to landing
          </Link>
        </section>
      </main>
    );
  }

  const currentScene = lobby.currentScene;
  const playerSceneControlsVisible = role === "player" && lobby.sceneActions.length > 0;

  function canAttackEnemy(enemy: EnemyView) {
    if (!currentPlayer || !currentPlayer.alive || !enemy.alive) {
      return false;
    }

    return Math.abs(currentPlayer.x - enemy.x) + Math.abs(currentPlayer.y - enemy.y) === 1;
  }

  function getEnemyRangeMessage(enemy: EnemyView) {
    if (!currentPlayer || !enemy.alive) {
      return "No target";
    }

    return canAttackEnemy(enemy) ? "Adjacent target" : "Move adjacent to attack";
  }

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Room Lobby</span>
          <h1>{lobby.roomCode}</h1>
          <p>
            Connected as <strong>{playerName}</strong>. Players choose classes here, while the
            Dungeon Master can prepare the story and start the adventure.
          </p>
        </div>
        <div className="status-card" data-testid="status-card">
          <span className="status-label">Status</span>
          <strong data-testid="status-message">{status}</strong>
          <span className="status-note" data-testid="connection-summary">
            Connected as {role === "dm" ? lobby.dmName : currentPlayer?.name ?? playerName} in {lobby.roomCode}.
          </span>
        </div>
      </section>

      <section className="lobby-layout">
        <div className="left-column">
          <section className="panel">
            <div className="section-header">
              <h2>Current scene</h2>
              <span data-testid="scene-title">{currentScene.title}</span>
            </div>
            <p className="scene-copy" data-testid="scene-description">
              {currentScene.description}
            </p>
            <p className="meta-copy" data-testid="scene-objective">
              Objective: {currentScene.objective}
            </p>
            <p className="meta-copy" data-testid="scene-type">
              Type: {currentScene.sceneType}
            </p>
          </section>

          {role === "player" ? (
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
                      onClick={() => {
                        setSelectedClassId(playableClass.id);
                        selectClass(playableClass.id);
                      }}
                      disabled={lobby.adventureStarted}
                    >
                      <strong>{playableClass.name}</strong>
                      <span>Health: {playableClass.health}</span>
                      <span>Movement: {playableClass.movement}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <PartyPanel lobby={lobby} />
        </div>

        <div className="center-column">
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

          {playerSceneControlsVisible ? (
            <section className="panel">
              <div className="section-header">
                <h2>Story choices</h2>
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
              </div>
            </section>
          ) : (
            <section className="panel">
              <h2>Ready to play</h2>
              <p className="meta-copy">
                {role === "dm"
                  ? "Use the Dungeon Master controls to start and guide the adventure."
                  : lobby.dmName
                    ? "Waiting for the Dungeon Master to begin the story."
                    : "Without a DM, players can still use the story buttons once the adventure begins."}
              </p>
            </section>
          )}

          <EnemyPanel
            enemies={lobby.enemies}
            canAttackEnemy={canAttackEnemy}
            getEnemyRangeMessage={getEnemyRangeMessage}
            onAttack={attack}
          />
        </div>

        <div className="right-column">
          <LogPanel
            title="Shared Log"
            logs={lobby.publicLog}
            testId="combat-log"
            countTestId="combat-log-count"
            entryPrefix="combat-log-entry-"
          />
          {role === "dm" ? (
            <LogPanel
              title="DM Log"
              logs={lobby.dmLog}
              testId="dm-log"
              countTestId="dm-log-count"
              entryPrefix="dm-log-entry-"
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
