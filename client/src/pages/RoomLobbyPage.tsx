import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CharacterSheetPanel, DmPanel, DmWorldToolsPanel, EnemyPanel, LogPanel, PartyPanel } from "../components/GamePanels";
import { PreparationCanvas } from "../components/PreparationCanvas";
import { useRoomConnection } from "../game/RoomConnectionContext";
import type { EnemyView } from "../game/types";
import { buildCampaignPackageFromLobby, saveCampaignToLibrary, triggerCampaignDownload, type CampaignVisibility } from "../services/campaignLibrary";

export function RoomLobbyPage() {
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
    selectRace,
    selectClass,
    confirmCharacter,
    selectProfile,
    attack,
    sceneAction,
    runDmAction,
    runDmTool,
    runDmCommand,
    setStatus
  } = useRoomConnection();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [sceneTarget, setSceneTarget] = useState("tavern");
  const [goldAmount, setGoldAmount] = useState("5");
  const [commandDraft, setCommandDraft] = useState("");
  const [dmCommand, setDmCommand] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [campaignVersion, setCampaignVersion] = useState("1.0.0");
  const [campaignTheme, setCampaignTheme] = useState("Adventure");
  const [campaignTags, setCampaignTags] = useState("");
  const [campaignVisibility, setCampaignVisibility] = useState<CampaignVisibility>("private");
  const [campaignChangeNotes, setCampaignChangeNotes] = useState("");

  useEffect(() => {
    requestState();
  }, []);

  useEffect(() => {
    if (lobby && lobby.roomPhase !== "preparation" && routeRoomCode) {
      navigate(`/room/${routeRoomCode}/play`);
    }
  }, [lobby, navigate, routeRoomCode]);

  useEffect(() => {
    if (lobby?.availableScenes.length) {
      setSceneTarget(lobby.currentScene.id);
    }
  }, [lobby?.availableScenes.length, lobby?.currentScene.id]);

  useEffect(() => {
    if (!lobby?.currentCampaign) {
      return;
    }

    setCampaignName(lobby.currentCampaign.name);
    setCampaignDescription(lobby.currentCampaign.description);
    setCampaignVersion(lobby.currentCampaign.version);
    setCampaignTheme(lobby.currentCampaign.theme);
    setCampaignTags(lobby.currentCampaign.tags.join(", "));
    setCampaignVisibility(lobby.currentCampaign.visibility);
    setCampaignChangeNotes(lobby.currentCampaign.changeNotes);
  }, [lobby?.currentCampaign]);

  const currentPlayer = lobby?.players.find((player) => player.id === sessionId) ?? null;

  useEffect(() => {
    setSelectedClassId(currentPlayer?.classId ?? lobby?.availableClasses[0]?.id ?? "");
    setSelectedRaceId(currentPlayer?.raceId ?? lobby?.availableRaces[0]?.id ?? "");
  }, [currentPlayer?.classId, currentPlayer?.raceId, lobby?.availableClasses, lobby?.availableRaces]);

  const selectedClass = useMemo(
    () => lobby?.availableClasses.find((playableClass) => playableClass.id === selectedClassId) ?? null,
    [lobby?.availableClasses, selectedClassId]
  );

  const selectedRace = useMemo(
    () => lobby?.availableRaces.find((playableRace) => playableRace.id === selectedRaceId) ?? null,
    [lobby?.availableRaces, selectedRaceId]
  );

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

  const activeLobby = lobby;
  const currentScene = activeLobby.currentScene;
  const playerSceneControlsVisible = role === "player" && activeLobby.sceneActions.length > 0;

  function canAttackEnemy(enemy: EnemyView) {
    if (!currentPlayer || !currentPlayer.alive || !enemy.alive) {
      return false;
    }

    return Math.abs(currentPlayer.x - enemy.x) + Math.abs(currentPlayer.y - enemy.y) <= currentPlayer.attackRange;
  }

  function getEnemyRangeMessage(enemy: EnemyView) {
    if (!currentPlayer || !enemy.alive) {
      return "No target";
    }

    return canAttackEnemy(enemy) ? "Target in range" : `Need range ${currentPlayer.attackRange}`;
  }

  function buildCampaignPackage() {
    return buildCampaignPackageFromLobby(activeLobby, {
      id: activeLobby.currentCampaign?.ownership === "creator" ? activeLobby.currentCampaign.id : campaignName,
      name: campaignName || activeLobby.currentCampaign?.name || "Custom Campaign",
      description: campaignDescription,
      author: activeLobby.currentCampaign?.author || playerName,
      creatorName: playerName,
      version: campaignVersion,
      difficulty: activeLobby.currentCampaign?.difficulty ?? "medium",
      recommendedPlayers: activeLobby.currentCampaign?.recommendedPlayers ?? "2-6",
      theme: campaignTheme,
      levelRange: activeLobby.currentCampaign?.levelRange ?? "1-3",
      tags: campaignTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      estimatedLength: activeLobby.currentCampaign?.estimatedLength ?? "1-2 Sessions",
      changeNotes: campaignChangeNotes,
      visibility: campaignVisibility,
      ownership: "creator",
      requiredPacks: activeLobby.currentCampaign?.requiredPacks ?? ["core"]
    });
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
          <span className="status-note" data-testid="room-phase-label">
            Phase: {lobby.roomPhase} · Map: {lobby.currentMapKey} · Difficulty: {lobby.campaignDifficulty}
          </span>
        </div>
      </section>

      {role === "dm" ? (
        <>
          <section className="dm-prep-layout" data-testid="dm-preparation-layout">
            <div className="dm-prep-main">
              <PreparationCanvas lobby={lobby} onRunTool={runDmTool} />
              <DmWorldToolsPanel lobby={lobby} onRunTool={runDmTool} />
            </div>

            <div className="dm-prep-side">
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
              <section className="panel" data-testid="campaign-manager-panel">
                <div className="section-header">
                  <h2>Campaign Manager</h2>
                  <span data-testid="campaign-manager-summary">{lobby.currentCampaign?.name ?? "Custom Campaign"}</span>
                </div>
                <div className="two-column-grid">
                  <label className="field">
                    <span>Name</span>
                    <input data-testid="campaign-name-input" value={campaignName} onChange={(event) => setCampaignName(event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Version</span>
                    <input data-testid="campaign-version-input" value={campaignVersion} onChange={(event) => setCampaignVersion(event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Theme</span>
                    <input data-testid="campaign-theme-input" value={campaignTheme} onChange={(event) => setCampaignTheme(event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Visibility</span>
                    <select data-testid="campaign-visibility-select" value={campaignVisibility} onChange={(event) => setCampaignVisibility(event.target.value as CampaignVisibility)}>
                      <option value="private">Private</option>
                      <option value="shared">Shared</option>
                      <option value="public">Public</option>
                      <option value="official">Official</option>
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span>Description</span>
                  <textarea data-testid="campaign-description-input" value={campaignDescription} onChange={(event) => setCampaignDescription(event.target.value)} rows={3} />
                </label>
                <label className="field">
                  <span>Tags</span>
                  <input data-testid="campaign-tags-input" value={campaignTags} onChange={(event) => setCampaignTags(event.target.value)} placeholder="goblin, mystery, shared" />
                </label>
                <label className="field">
                  <span>Change Notes</span>
                  <textarea data-testid="campaign-change-notes-input" value={campaignChangeNotes} onChange={(event) => setCampaignChangeNotes(event.target.value)} rows={2} />
                </label>
                <div className="button-row">
                  <button
                    type="button"
                    data-testid="save-campaign-button"
                    onClick={() => {
                      const packageData = buildCampaignPackage();
                      saveCampaignToLibrary({
                        category: "my",
                        metadata: packageData.metadata,
                        packageData
                      });
                      setStatus(`Saved campaign ${packageData.metadata.name} to My Campaigns.`);
                    }}
                  >
                    Save Campaign
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    data-testid="export-campaign-json-button"
                    onClick={() => triggerCampaignDownload(buildCampaignPackage(), "json")}
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    data-testid="export-campaign-package-button"
                    onClick={() => triggerCampaignDownload(buildCampaignPackage(), "package")}
                  >
                    Export Package
                  </button>
                </div>
              </section>
              <PartyPanel lobby={lobby} />
              <LogPanel
                title="Shared Log"
                logs={lobby.publicLog}
                testId="combat-log"
                countTestId="combat-log-count"
                entryPrefix="combat-log-entry-"
              />
              <LogPanel
                title="DM Log"
                logs={lobby.dmLog}
                testId="dm-log"
                countTestId="dm-log-count"
                entryPrefix="dm-log-entry-"
              />
            </div>
          </section>
        </>
      ) : (
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

            <section className="panel">
              <div className="section-header">
                <h2>Character creation</h2>
                <span data-testid="selected-class-label">
                  {currentPlayer?.characterIdentity ?? "Not selected yet"}
                </span>
              </div>
              <div className="player-list" data-testid="character-profile-list">
                <p className="meta-copy">Load an existing character profile or leave this blank to create a new one.</p>
                {lobby.characterProfiles.length ? (
                  lobby.characterProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      className="player-card"
                      data-testid={`profile-load-${profile.id}`}
                      onClick={() => selectProfile(profile.id)}
                      disabled={
                        lobby.roomPhase !== "preparation" ||
                        (lobby.campaignDifficulty === "legendary" && profile.status === "permanentlyDead")
                      }
                    >
                      <strong>{profile.name}</strong>
                      <span>{profile.raceName} {profile.className}</span>
                      <span>Level {profile.level} · XP {profile.xp} · {profile.status}</span>
                    </button>
                  ))
                ) : (
                  <p className="meta-copy">No saved profiles for this player name yet.</p>
                )}
              </div>
              <h3>Choose a race</h3>
              <div className="class-grid" data-testid="race-grid">
                {lobby.availableRaces.map((playableRace) => {
                  const isSelected = selectedRaceId === playableRace.id;

                  return (
                    <button
                      key={playableRace.id}
                      type="button"
                      data-testid={`race-card-${playableRace.id}`}
                      className={`class-card${isSelected ? " class-card--selected" : ""}`}
                      onClick={() => {
                        setSelectedRaceId(playableRace.id);
                        selectRace(playableRace.id);
                      }}
                      disabled={lobby.roomPhase !== "preparation"}
                    >
                      <strong>{playableRace.name}</strong>
                      <span>{playableRace.description}</span>
                      <span>{playableRace.traitName}</span>
                    </button>
                  );
                })}
              </div>
              <h3>Choose a class</h3>
              <div className="class-grid">
                {lobby.availableClasses.map((playableClass) => {
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
                      disabled={lobby.roomPhase !== "preparation"}
                    >
                      <strong>{playableClass.name}</strong>
                      <span>{playableClass.description}</span>
                      <span>Health: {playableClass.health}</span>
                      <span>Movement: {playableClass.movement}</span>
                      <span>Ability: {playableClass.abilityName}</span>
                    </button>
                  );
                })}
              </div>
              <div className="player-card top-gap" data-testid="character-preview-card">
                <strong data-testid="character-preview-identity">
                  {currentPlayer?.characterIdentity ??
                    `${selectedRace?.name ?? "Race"} ${selectedClass?.name ?? "Class"}`}
                </strong>
                <div className="player-stats">
                  <span data-testid="preview-health">HP {currentPlayer?.maxHealth ?? selectedClass?.health ?? 0}</span>
                  <span data-testid="preview-movement">Move {currentPlayer?.movement ?? selectedClass?.movement ?? 0}</span>
                  <span data-testid="preview-defense">Defense {currentPlayer?.defense ?? selectedClass?.defense ?? 0}</span>
                  <span data-testid="preview-attack">Attack +{currentPlayer?.attackBonus ?? selectedClass?.attackBonus ?? 0}</span>
                  <span data-testid="preview-range">Range {currentPlayer?.attackRange ?? selectedClass?.attackRange ?? 0}</span>
                  <span data-testid="preview-spell-damage">Spell +{currentPlayer?.spellDamage ?? selectedClass?.spellDamage ?? 0}</span>
                </div>
                {selectedRace ? (
                  <p className="meta-copy" data-testid="selected-race-trait">
                    {selectedRace.traitName}: {selectedRace.traitDescription}
                  </p>
                ) : null}
              </div>
              <div className="button-row top-gap">
                <button
                  type="button"
                  data-testid="confirm-character-button"
                  onClick={confirmCharacter}
                  disabled={lobby.roomPhase !== "preparation"}
                >
                  Confirm Character
                </button>
                <span className="meta-copy" data-testid="character-confirmation-state">
                  {currentPlayer?.confirmedCharacter ? `Character confirmed as ${currentPlayer.characterName || currentPlayer.characterIdentity}.` : "Choose race and class, then confirm."}
                </span>
              </div>
            </section>

            <CharacterSheetPanel player={currentPlayer} />
            <PartyPanel lobby={lobby} />
          </div>

          <div className="center-column">
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
                  {lobby.dmName
                    ? "Waiting for the Dungeon Master to begin the story."
                    : "Without a DM, players can still use the story buttons once the adventure begins."}
                </p>
              </section>
            )}

            <EnemyPanel
              enemies={lobby.enemies}
              actionLabel="Attack"
              canTargetEnemy={canAttackEnemy}
              getEnemyRangeMessage={getEnemyRangeMessage}
              onTarget={attack}
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
          </div>
        </section>
      )}
    </main>
  );
}
