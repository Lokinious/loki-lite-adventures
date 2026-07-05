import { useEffect, useMemo, useState } from "react";
import type {
  LobbyView,
  MapSlotKey,
  PreparationAssetType,
  VisibilityState,
  WorldEntityType
} from "../game/types";

type DmToolMessage = {
  tool: string;
  mapKey?: MapSlotKey;
  assetType?: PreparationAssetType;
  playerId?: string;
  entityId?: string;
  entityType?: WorldEntityType;
  visibilityState?: VisibilityState;
  visibleToPlayers?: boolean;
  note?: string;
  x?: number;
  y?: number;
  encounterId?: string;
  secretId?: string;
};

type PreparationCanvasProps = {
  lobby: LobbyView;
  onRunTool(message: DmToolMessage): void;
};

type PlacementTool = "inspect" | "player_spawn" | "npc" | "shop" | "encounter" | "secret" | "object";

type Selection =
  | { kind: "spawn"; id: string }
  | { kind: "encounter"; id: string }
  | { kind: "entity"; id: string }
  | null;

const objectPlacementOptions: WorldEntityType[] = [
  "chest",
  "door",
  "bookshelf",
  "statue",
  "campfire",
  "lever",
  "barrel",
  "treasure_chest",
  "hidden_object",
  "trap_marker"
];

const visibilityOptions: VisibilityState[] = ["hidden", "visible", "revealed", "dm_only"];

function titleCase(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function markerVariantForEntity(type: WorldEntityType) {
  if (type === "npc" || type === "shopkeeper") {
    return "character";
  }

  if (type === "secret_marker" || type === "secret_passage_marker" || type === "hidden_object") {
    return "secret";
  }

  return "object";
}

export function PreparationCanvas({ lobby, onRunTool }: PreparationCanvasProps) {
  const [activeTool, setActiveTool] = useState<PlacementTool>("inspect");
  const [selectedPlayerId, setSelectedPlayerId] = useState(lobby.players[0]?.id ?? "");
  const [objectEntityType, setObjectEntityType] = useState<WorldEntityType>("chest");
  const [selection, setSelection] = useState<Selection>(null);
  const [entityVisibility, setEntityVisibility] = useState<VisibilityState>("visible");
  const [entityNotes, setEntityNotes] = useState("");

  useEffect(() => {
    if (!lobby.players.some((player) => player.id === selectedPlayerId)) {
      setSelectedPlayerId(lobby.players[0]?.id ?? "");
    }
  }, [lobby.players, selectedPlayerId]);

  const currentSessionMap = useMemo(
    () => lobby.sessionMaps.find((map) => map.key === lobby.currentMapKey) ?? lobby.sessionMaps[0] ?? null,
    [lobby.currentMapKey, lobby.sessionMaps]
  );

  const selectedEntity =
    selection?.kind === "entity" ? lobby.worldEntities.find((entity) => entity.id === selection.id) ?? null : null;
  const selectedSpawn =
    selection?.kind === "spawn" ? lobby.preparationSpawns.find((spawn) => spawn.playerId === selection.id) ?? null : null;
  const selectedEncounter =
    selection?.kind === "encounter"
      ? lobby.preparationEncounters.find((encounter) => encounter.id === selection.id) ?? null
      : null;

  useEffect(() => {
    if (!selectedEntity) {
      return;
    }

    setEntityVisibility(
      selectedEntity.visibleToPlayers ? (selectedEntity.discovered ? "revealed" : "visible") : "hidden"
    );
    setEntityNotes(selectedEntity.dmNotes ?? "");
  }, [selectedEntity?.id, selectedEntity?.dmNotes, selectedEntity?.discovered, selectedEntity?.visibleToPlayers]);

  const markersByTile = useMemo(() => {
    const markers = new Map<string, Array<{
      key: string;
      kind: "spawn" | "encounter" | "entity";
      id: string;
      label: string;
      variant: "spawn" | "encounter" | "character" | "secret" | "object";
      hidden?: boolean;
    }>>();

    const appendMarker = (
      x: number,
      y: number,
      marker: {
        key: string;
        kind: "spawn" | "encounter" | "entity";
        id: string;
        label: string;
        variant: "spawn" | "encounter" | "character" | "secret" | "object";
        hidden?: boolean;
      }
    ) => {
      const key = `${x},${y}`;
      const existing = markers.get(key) ?? [];
      existing.push(marker);
      markers.set(key, existing);
    };

    for (const spawn of lobby.preparationSpawns) {
      appendMarker(spawn.x, spawn.y, {
        key: `spawn-${spawn.playerId}`,
        kind: "spawn",
        id: spawn.playerId,
        label: spawn.playerName.slice(0, 2).toUpperCase(),
        variant: "spawn"
      });
    }

    for (const encounter of lobby.preparationEncounters) {
      appendMarker(encounter.x, encounter.y, {
        key: encounter.id,
        kind: "encounter",
        id: encounter.id,
        label: `E${encounter.enemyCount}`,
        variant: "encounter"
      });
    }

    for (const entity of lobby.worldEntities) {
      appendMarker(entity.x, entity.y, {
        key: entity.id,
        kind: "entity",
        id: entity.id,
        label: entity.name.slice(0, 2).toUpperCase(),
        variant: markerVariantForEntity(entity.type),
        hidden: !entity.visibleToPlayers
      });
    }

    return markers;
  }, [lobby.preparationEncounters, lobby.preparationSpawns, lobby.worldEntities]);

  function openMap(mapKey: MapSlotKey) {
    setSelection(null);
    onRunTool({ tool: "setMap", mapKey });
  }

  function placeOnTile(x: number, y: number) {
    if (activeTool === "inspect") {
      setSelection(null);
      return;
    }

    if (activeTool === "player_spawn") {
      onRunTool({ tool: "placePreparationAsset", assetType: "player_spawn", mapKey: lobby.currentMapKey, playerId: selectedPlayerId, x, y });
      return;
    }

    onRunTool({
      tool: "placePreparationAsset",
      assetType: activeTool,
      mapKey: lobby.currentMapKey,
      ...(activeTool === "secret"
        ? { entityType: "secret_marker" as WorldEntityType }
        : activeTool === "object"
          ? { entityType: objectEntityType }
          : {}),
      visibilityState: activeTool === "secret" ? "hidden" : "visible",
      x,
      y
    });
  }

  function saveEntityInspector() {
    if (!selectedEntity) {
      return;
    }

    onRunTool({
      tool: "setEntityVisibility",
      entityId: selectedEntity.id,
      visibilityState: entityVisibility,
      visibleToPlayers: entityVisibility === "visible" || entityVisibility === "revealed"
    });
    onRunTool({
      tool: "setEntityNotes",
      entityId: selectedEntity.id,
      note: entityNotes
    });
  }

  const tileCount = lobby.gridWidth * lobby.gridHeight;

  return (
    <section className="panel prep-canvas-panel" data-testid="prep-canvas-panel">
      <div className="section-header">
        <div>
          <h2>Preparation Canvas</h2>
          <p className="meta-copy" data-testid="prep-current-map-label">
            Editing {currentSessionMap?.label ?? "Map"} - {currentSessionMap?.mapName ?? lobby.currentScene.title}
          </p>
        </div>
        <span className="status-note" data-testid="prep-current-map-size">
          {lobby.gridWidth} x {lobby.gridHeight}
        </span>
      </div>

      <div className="prep-map-preview-grid" data-testid="prep-map-preview-grid">
        {lobby.sessionMaps.map((sessionMap) => (
          <article
            key={sessionMap.key}
            className={`prep-map-card${sessionMap.key === lobby.currentMapKey ? " prep-map-card--active" : ""}`}
            data-testid={`prep-map-card-${sessionMap.key}`}
          >
            <strong>{sessionMap.label}</strong>
            <span>{sessionMap.mapName}</span>
            <span className="meta-copy">
              {sessionMap.entityCount} entities · {sessionMap.encounterCount} encounters · {sessionMap.spawnCount} spawns
            </span>
            <button type="button" className="secondary-button" data-testid={`prep-open-map-${sessionMap.key}`} onClick={() => openMap(sessionMap.key)}>
              Open Map
            </button>
          </article>
        ))}
      </div>

      <section className="dm-control-group prep-toolbox" data-testid="prep-toolbox">
        <div className="section-header">
          <h3>Placement Tools</h3>
          <span className="meta-copy" data-testid="prep-active-tool-label">
            {titleCase(activeTool)}
          </span>
        </div>
        <div className="button-row">
          {([
            { id: "inspect", label: "Inspect" },
            { id: "player_spawn", label: "Player Spawn" },
            { id: "npc", label: "NPC" },
            { id: "shop", label: "Shop" },
            { id: "encounter", label: "Encounter" },
            { id: "secret", label: "Secret" },
            { id: "object", label: "Object" }
          ] as const).map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={activeTool === tool.id ? "tab-button tab-button--active" : "tab-button"}
              data-testid={`prep-tool-${tool.id}`}
              onClick={() => setActiveTool(tool.id)}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <div className="two-column-grid">
          <label className="field">
            <span>Spawn player</span>
            <select
              data-testid="prep-spawn-player-select"
              value={selectedPlayerId}
              onChange={(event) => setSelectedPlayerId(event.target.value)}
              disabled={activeTool !== "player_spawn"}
            >
              {lobby.players.length ? (
                lobby.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))
              ) : (
                <option value="">Waiting for players</option>
              )}
            </select>
          </label>
          <label className="field">
            <span>Object type</span>
            <select
              data-testid="prep-object-type-select"
              value={objectEntityType}
              onChange={(event) => setObjectEntityType(event.target.value as WorldEntityType)}
              disabled={activeTool !== "object"}
            >
              {objectPlacementOptions.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {titleCase(entityType)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div
        className="prep-map-shell"
        data-testid="prep-map-canvas"
        style={{ gridTemplateColumns: `repeat(${lobby.gridWidth}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: tileCount }, (_, index) => {
          const x = index % lobby.gridWidth;
          const y = Math.floor(index / lobby.gridWidth);
          const tileMarkers = markersByTile.get(`${x},${y}`) ?? [];

          return (
            <div key={`${x}-${y}`} className="prep-tile" data-testid={`prep-tile-${x}-${y}`}>
              <button
                type="button"
                className="prep-tile-button"
                data-testid={`prep-place-${x}-${y}`}
                onClick={() => placeOnTile(x, y)}
                aria-label={`Preparation tile ${x + 1}, ${y + 1}`}
              />
              <span className="prep-tile-coordinates">
                {x + 1},{y + 1}
              </span>
              <div className="prep-marker-stack">
                {tileMarkers.map((marker) => (
                  <button
                    key={marker.key}
                    type="button"
                    className={`prep-marker prep-marker--${marker.variant}${marker.hidden ? " prep-marker--hidden" : ""}`}
                    data-testid={`prep-marker-${marker.kind}-${marker.id}`}
                    onClick={() => setSelection({ kind: marker.kind, id: marker.id })}
                  >
                    {marker.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <section className="dm-control-group prep-inspector" data-testid="prep-selection-panel">
        <div className="section-header">
          <h3>Selection</h3>
          <span className="meta-copy" data-testid="prep-selection-kind">
            {selectedEntity ? "Entity" : selectedSpawn ? "Spawn" : selectedEncounter ? "Encounter" : "Tile"}
          </span>
        </div>
        {selectedEntity ? (
          <div className="player-list">
            <strong data-testid="prep-selection-name">{selectedEntity.name}</strong>
            <span className="meta-copy">
              {titleCase(selectedEntity.type)} · tile {selectedEntity.x + 1},{selectedEntity.y + 1}
            </span>
            <label className="field">
              <span>Visibility</span>
              <select data-testid="prep-entity-visibility" value={entityVisibility} onChange={(event) => setEntityVisibility(event.target.value as VisibilityState)}>
                {visibilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>DM notes</span>
              <textarea data-testid="prep-entity-notes" rows={3} value={entityNotes} onChange={(event) => setEntityNotes(event.target.value)} />
            </label>
            <div className="button-row">
              <button type="button" data-testid="prep-save-entity" onClick={saveEntityInspector}>
                Save Entity
              </button>
              {selectedEntity.linkedSecretId ? (
                <button
                  type="button"
                  className="secondary-button"
                  data-testid="prep-reveal-secret"
                  onClick={() => {
                    if (!selectedEntity.linkedSecretId) {
                      return;
                    }

                    onRunTool({ tool: "revealSecret", secretId: selectedEntity.linkedSecretId });
                  }}
                >
                  Reveal Secret
                </button>
              ) : null}
            </div>
            <p className="meta-copy">{selectedEntity.publicDetails}</p>
          </div>
        ) : selectedSpawn ? (
          <div className="player-list">
            <strong data-testid="prep-selection-name">{selectedSpawn.playerName} spawn</strong>
            <span className="meta-copy">
              Tile {selectedSpawn.x + 1},{selectedSpawn.y + 1}
            </span>
            <p className="meta-copy">Choose Player Spawn, then click another tile to move this marker.</p>
          </div>
        ) : selectedEncounter ? (
          <div className="player-list">
            <strong data-testid="prep-selection-name">{selectedEncounter.name}</strong>
            <span className="meta-copy">
              {selectedEncounter.enemyCount} enemies · tile {selectedEncounter.x + 1},{selectedEncounter.y + 1}
            </span>
            <p className="meta-copy">{selectedEncounter.notes}</p>
            <button type="button" data-testid="prep-activate-encounter" onClick={() => onRunTool({ tool: "activateEncounterGroup", encounterId: selectedEncounter.id })}>
              Activate Encounter
            </button>
          </div>
        ) : (
          <p className="meta-copy" data-testid="prep-selection-empty">
            Click a marker to edit it, or choose a placement tool and click the map to build the scene directly.
          </p>
        )}
      </section>
    </section>
  );
}
