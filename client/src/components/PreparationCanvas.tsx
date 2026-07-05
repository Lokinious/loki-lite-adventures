import { useEffect, useMemo, useState } from "react";
import type {
  EncounterDifficulty,
  LobbyView,
  MapSlotKey,
  PreparationAssetType,
  SpawnSlotId,
  VisibilityState,
  WorldEntityType
} from "../game/types";
import { getMapBackgroundBundle } from "../services/assetLibrary";
import type { MapMetadata } from "../../../content/assets/schema";

type DmToolMessage = {
  tool: string;
  mapKey?: MapSlotKey;
  spawnSlotId?: SpawnSlotId;
  assetType?: PreparationAssetType;
  playerId?: string;
  entityId?: string;
  entityType?: WorldEntityType;
  encounterTemplateId?: string;
  encounterTheme?: string;
  encounterDifficulty?: EncounterDifficulty;
  shopTemplateId?: string;
  npcPresetId?: string;
  adventureTemplateId?: string;
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
const spawnSlotIds: SpawnSlotId[] = ["P1", "P2", "P3", "P4", "P5", "P6"];
const encounterDifficultyOptions: EncounterDifficulty[] = ["easy", "medium", "hard", "boss", "epic"];

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

function coordinateStyle(metadata: MapMetadata, x: number, y: number) {
  return {
    left: `${(x / metadata.width) * 100}%`,
    top: `${(y / metadata.height) * 100}%`
  };
}

function zoneStyle(metadata: MapMetadata, zone: { x: number; y: number; width: number; height: number }) {
  return {
    left: `${(zone.x / metadata.width) * 100}%`,
    top: `${(zone.y / metadata.height) * 100}%`,
    width: `${(zone.width / metadata.width) * 100}%`,
    height: `${(zone.height / metadata.height) * 100}%`
  };
}

function MapCoordinateDebugOverlay({ metadata }: { metadata: MapMetadata }) {
  return (
    <div className="prep-coordinate-debug" data-testid="prep-coordinate-debug-overlay">
      <div className="prep-walkable-bounds" data-testid="prep-walkable-bounds" style={zoneStyle(metadata, metadata.walkableBounds)} />
      {metadata.spawnPoints.map((spawn) => (
        <span key={spawn.id} className="prep-coordinate-marker prep-coordinate-marker--spawn" data-testid={`prep-debug-spawn-${spawn.id}`} style={coordinateStyle(metadata, spawn.x, spawn.y)}>
          {spawn.id.toUpperCase()}
        </span>
      ))}
      {metadata.npcPositions.map((npc) => (
        <span key={npc.npcId} className="prep-coordinate-marker prep-coordinate-marker--npc" data-testid={`prep-debug-npc-${npc.npcId}`} style={coordinateStyle(metadata, npc.x, npc.y)}>
          NPC
        </span>
      ))}
      {metadata.shopPositions.map((shop) => (
        <span key={shop.shopId} className="prep-coordinate-marker prep-coordinate-marker--shop" data-testid={`prep-debug-shop-${shop.shopId}`} style={coordinateStyle(metadata, shop.x, shop.y)}>
          SHOP
        </span>
      ))}
      {metadata.questMarkers.map((quest) => (
        <span key={`${quest.questId}-${quest.x}-${quest.y}`} className="prep-coordinate-marker prep-coordinate-marker--quest" data-testid={`prep-debug-quest-${quest.questId}`} style={coordinateStyle(metadata, quest.x, quest.y)}>
          QUEST
        </span>
      ))}
      {metadata.encounterZones.map((zone) => (
        <div key={zone.id} className="prep-encounter-zone" data-testid={`prep-debug-encounter-${zone.id}`} style={zoneStyle(metadata, zone)}>
          <span>{zone.name}</span>
        </div>
      ))}
    </div>
  );
}

export function PreparationCanvas({ lobby, onRunTool }: PreparationCanvasProps) {
  const [activeTool, setActiveTool] = useState<PlacementTool>("inspect");
  const [selectedSpawnSlot, setSelectedSpawnSlot] = useState<SpawnSlotId>("P1");
  const [objectEntityType, setObjectEntityType] = useState<WorldEntityType>("chest");
  const [selectedNpcPresetId, setSelectedNpcPresetId] = useState(lobby.npcPresets[0]?.id ?? "merchant");
  const [selectedShopTemplateId, setSelectedShopTemplateId] = useState(lobby.shopTemplates[0]?.id ?? "general_store");
  const [selectedAdventureTemplateId, setSelectedAdventureTemplateId] = useState(lobby.adventureTemplates[0]?.id ?? "goblin_cave");
  const [encounterTheme, setEncounterTheme] = useState(lobby.encounterTemplates[0]?.theme ?? "Goblin");
  const [encounterDifficulty, setEncounterDifficulty] = useState<EncounterDifficulty>(lobby.encounterTemplates[0]?.difficulty ?? "easy");
  const [selection, setSelection] = useState<Selection>(null);
  const [entityVisibility, setEntityVisibility] = useState<VisibilityState>("visible");
  const [entityNotes, setEntityNotes] = useState("");
  const [showCoordinateDebug, setShowCoordinateDebug] = useState(true);

  useEffect(() => {
    if (!lobby.npcPresets.some((preset) => preset.id === selectedNpcPresetId)) {
      setSelectedNpcPresetId(lobby.npcPresets[0]?.id ?? "merchant");
    }
  }, [lobby.npcPresets, selectedNpcPresetId]);

  useEffect(() => {
    if (!lobby.shopTemplates.some((template) => template.id === selectedShopTemplateId)) {
      setSelectedShopTemplateId(lobby.shopTemplates[0]?.id ?? "general_store");
    }
  }, [lobby.shopTemplates, selectedShopTemplateId]);

  useEffect(() => {
    if (!lobby.adventureTemplates.some((template) => template.id === selectedAdventureTemplateId)) {
      setSelectedAdventureTemplateId(lobby.adventureTemplates[0]?.id ?? "goblin_cave");
    }
  }, [lobby.adventureTemplates, selectedAdventureTemplateId]);

  useEffect(() => {
    if (!lobby.encounterTemplates.some((template) => template.theme === encounterTheme)) {
      setEncounterTheme(lobby.encounterTemplates[0]?.theme ?? "Goblin");
    }
  }, [encounterTheme, lobby.encounterTemplates]);

  useEffect(() => {
    if (!lobby.encounterTemplates.some((template) => template.theme === encounterTheme && template.difficulty === encounterDifficulty)) {
      setEncounterDifficulty(
        lobby.encounterTemplates.find((template) => template.theme === encounterTheme)?.difficulty ??
          lobby.encounterTemplates[0]?.difficulty ??
          "easy"
      );
    }
  }, [encounterDifficulty, encounterTheme, lobby.encounterTemplates]);

  const currentSessionMap = useMemo(
    () => lobby.sessionMaps.find((map) => map.key === lobby.currentMapKey) ?? lobby.sessionMaps[0] ?? null,
    [lobby.currentMapKey, lobby.sessionMaps]
  );
  const mapBundle = useMemo(
    () => (currentSessionMap ? getMapBackgroundBundle(currentSessionMap.mapId) : { metadata: null, backgroundAsset: null }),
    [currentSessionMap?.mapId]
  );
  const encounterThemes = useMemo(
    () => [...new Set(lobby.encounterTemplates.map((template) => template.theme))],
    [lobby.encounterTemplates]
  );
  const matchingEncounterTemplates = useMemo(
    () =>
      lobby.encounterTemplates.filter(
        (template) => template.theme === encounterTheme && template.difficulty === encounterDifficulty
      ),
    [encounterDifficulty, encounterTheme, lobby.encounterTemplates]
  );

  const selectedEntity =
    selection?.kind === "entity" ? lobby.worldEntities.find((entity) => entity.id === selection.id) ?? null : null;
  const selectedSpawn =
    selection?.kind === "spawn" ? lobby.preparationSpawns.find((spawn) => spawn.slotId === selection.id) ?? null : null;
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
        key: `spawn-${spawn.slotId}`,
        kind: "spawn",
        id: spawn.slotId,
        label: spawn.slotId,
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

  function applyAdventureTemplate() {
    onRunTool({ tool: "applyAdventureTemplate", adventureTemplateId: selectedAdventureTemplateId });
  }

  function placeOnTile(x: number, y: number) {
    if (activeTool === "inspect") {
      setSelection(null);
      return;
    }

    if (activeTool === "player_spawn") {
      onRunTool({ tool: "placePreparationAsset", assetType: "player_spawn", mapKey: lobby.currentMapKey, spawnSlotId: selectedSpawnSlot, x, y });
      return;
    }

    onRunTool({
      tool: "placePreparationAsset",
      assetType: activeTool,
      mapKey: lobby.currentMapKey,
      ...(activeTool === "npc" ? { npcPresetId: selectedNpcPresetId } : {}),
      ...(activeTool === "shop" ? { shopTemplateId: selectedShopTemplateId, npcPresetId: "merchant" } : {}),
      ...(activeTool === "encounter"
        ? {
            encounterTheme,
            encounterDifficulty,
            ...(matchingEncounterTemplates[0]?.id ? { encounterTemplateId: matchingEncounterTemplates[0].id } : {})
          }
        : {}),
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
      <label className="debug-toggle">
        <input
          type="checkbox"
          data-testid="prep-coordinate-debug-toggle"
          checked={showCoordinateDebug}
          onChange={(event) => setShowCoordinateDebug(event.target.checked)}
        />
        <span>Coordinate overlay</span>
      </label>

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

      <section className="dm-control-group prep-content-pack-panel" data-testid="prep-content-pack-panel">
        <div className="section-header">
          <h3>Content Packs</h3>
          <span className="meta-copy">{lobby.contentPacks.length} loaded</span>
        </div>
        <div className="prep-pack-grid">
          {lobby.contentPacks.map((pack) => (
            <article key={pack.id} className="prep-pack-card" data-testid={`prep-pack-${pack.id}`}>
              <strong>{pack.name}</strong>
              <span>{pack.theme}</span>
              <span className="meta-copy">
                {pack.encounterCount} encounters · {pack.shopTemplateCount} shops · {pack.npcPresetCount} NPCs
              </span>
            </article>
          ))}
        </div>
        <div className="two-column-grid">
          <label className="field">
            <span>Adventure template</span>
            <select data-testid="prep-adventure-template-select" value={selectedAdventureTemplateId} onChange={(event) => setSelectedAdventureTemplateId(event.target.value)}>
              {lobby.adventureTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <div className="player-list">
            {lobby.adventureTemplates
              .filter((template) => template.id === selectedAdventureTemplateId)
              .map((template) => (
                <article key={template.id} className="prep-template-summary">
                  <strong>{template.theme}</strong>
                  <span className="meta-copy">
                    {template.startingMapName} · {template.adventureMapName} · {template.bossMapName} · {template.campMapName}
                  </span>
                </article>
              ))}
          </div>
        </div>
        <div className="button-row">
          <button type="button" data-testid="prep-apply-adventure-template" onClick={applyAdventureTemplate}>
            Load Adventure Template
          </button>
        </div>
      </section>

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
            <span>Spawn slot</span>
            <select
              data-testid="prep-spawn-slot-select"
              value={selectedSpawnSlot}
              onChange={(event) => setSelectedSpawnSlot(event.target.value as SpawnSlotId)}
              disabled={activeTool !== "player_spawn"}
            >
              {spawnSlotIds.map((slotId) => (
                <option key={slotId} value={slotId}>
                  {slotId}
                </option>
              ))}
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
          <label className="field">
            <span>NPC preset</span>
            <select
              data-testid="prep-npc-preset-select"
              value={selectedNpcPresetId}
              onChange={(event) => setSelectedNpcPresetId(event.target.value)}
              disabled={activeTool !== "npc"}
            >
              {lobby.npcPresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Shop template</span>
            <select
              data-testid="prep-shop-template-select"
              value={selectedShopTemplateId}
              onChange={(event) => setSelectedShopTemplateId(event.target.value)}
              disabled={activeTool !== "shop"}
            >
              {lobby.shopTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Encounter theme</span>
            <select
              data-testid="prep-encounter-theme-select"
              value={encounterTheme}
              onChange={(event) => setEncounterTheme(event.target.value)}
              disabled={activeTool !== "encounter"}
            >
              {encounterThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Encounter difficulty</span>
            <select
              data-testid="prep-encounter-difficulty-select"
              value={encounterDifficulty}
              onChange={(event) => setEncounterDifficulty(event.target.value as EncounterDifficulty)}
              disabled={activeTool !== "encounter"}
            >
              {encounterDifficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {titleCase(difficulty)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {activeTool === "encounter" && matchingEncounterTemplates[0] ? (
          <p className="meta-copy" data-testid="prep-encounter-template-preview">
            {matchingEncounterTemplates[0].name}: {matchingEncounterTemplates[0].enemyNames.join(", ")}
          </p>
        ) : null}
      </section>

      <div
        className="prep-map-shell"
        data-testid="prep-map-canvas"
        style={{
          aspectRatio: mapBundle.metadata ? `${mapBundle.metadata.width} / ${mapBundle.metadata.height}` : undefined
        }}
      >
        {mapBundle.backgroundAsset ? (
          <img
            className="prep-map-background"
            data-testid="prep-map-background"
            src={mapBundle.backgroundAsset.imagePath}
            alt=""
            draggable={false}
          />
        ) : null}
        {showCoordinateDebug && mapBundle.metadata ? <MapCoordinateDebugOverlay metadata={mapBundle.metadata} /> : null}
        <div className="prep-tile-grid" style={{ gridTemplateColumns: `repeat(${lobby.gridWidth}, minmax(0, 1fr))` }}>
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
            <strong data-testid="prep-selection-name">{selectedSpawn.slotId} spawn</strong>
            <span className="meta-copy">
              Tile {selectedSpawn.x + 1},{selectedSpawn.y + 1} · {selectedSpawn.assignedPlayerName ?? "Unassigned"}
            </span>
            <p className="meta-copy">Choose a spawn slot, then click another tile to move this marker.</p>
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
