import type {
  EnemyView,
  InventoryItemView,
  JoinRole,
  LobbyView,
  LogEntryView,
  PlayerView,
  SceneOptionView
} from "../game/types";

type PartyPanelProps = {
  lobby: LobbyView;
  targetAction?: {
    label: string;
    canTarget(player: PlayerView): boolean;
    getMessage(player: PlayerView): string;
    onTarget(playerId: string): void;
  } | null;
};

type EnemyPanelProps = {
  enemies: EnemyView[];
  actionLabel: string;
  canTargetEnemy(enemy: EnemyView): boolean;
  getEnemyRangeMessage(enemy: EnemyView): string;
  onTarget(targetId: string): void;
};

type LogPanelProps = {
  title: string;
  logs: LogEntryView[];
  testId: string;
  countTestId: string;
  entryPrefix: string;
};

type DmLogTabsPanelProps = {
  publicLogs: LogEntryView[];
  dmLogs: LogEntryView[];
  activeTab: "public" | "dm";
  onTabChange(tab: "public" | "dm"): void;
};

type DmPanelProps = {
  lobby: LobbyView;
  role: JoinRole;
  sceneTarget: string;
  onSceneTargetChange(sceneId: string): void;
  goldAmount: string;
  onGoldAmountChange(value: string): void;
  commandDraft: string;
  onCommandDraftChange(value: string): void;
  dmCommand: string;
  onDmCommandChange(value: string): void;
  onStartAdventure(): void;
  onAdvanceScene(): void;
  onPreviousScene(): void;
  onRestartScene(): void;
  onSetScene(sceneId: string): void;
  onSpawnGoblin(): void;
  onSpawnGoblinChief(): void;
  onAwardPartyGold(amount: number): void;
  onAddPublicMessage(message: string): void;
  onRunCommand(command: string): void;
};

type CharacterSheetPanelProps = {
  player: PlayerView | null;
};

type InventoryPanelProps = {
  player: PlayerView | null;
  onEquip(itemId: string): void;
  onUse(itemId: string): void;
  canEquip(item: InventoryItemView): boolean;
  canUse(item: InventoryItemView): boolean;
};

type ActionHotbarProps = {
  currentPlayer: PlayerView | null;
  activeMode: "attack" | "ability";
  onModeChange(mode: "attack" | "ability"): void;
  onUsePotion(): void;
  onEndTurn(): void;
  canAttack: boolean;
  canUseAbility: boolean;
  canUsePotion: boolean;
  canEndTurn: boolean;
};

export function PartyPanel({ lobby, targetAction = null }: PartyPanelProps) {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>Party</h2>
        <span data-testid="connected-player-count">{lobby.players.length}/6</span>
      </div>
      <p className="meta-copy" data-testid="party-gold">
        Party Gold: {lobby.partyGold}
      </p>
      {lobby.dmName ? (
        <p className="meta-copy" data-testid="dm-summary">
          Dungeon Master: {lobby.dmName}
        </p>
      ) : (
        <p className="meta-copy" data-testid="dm-summary">
          No Dungeon Master connected.
        </p>
      )}
      <div className="player-list" data-testid="player-list">
        {lobby.players.length ? (
          lobby.players.map((player) => (
            <PlayerCard key={player.id} player={player} targetAction={targetAction} />
          ))
        ) : (
          <p className="meta-copy">Players will appear here once they join.</p>
        )}
      </div>
    </section>
  );
}

function PlayerCard({
  player,
  targetAction
}: {
  player: PlayerView;
  targetAction: PartyPanelProps["targetAction"];
}) {
  return (
    <article
      className="player-card"
      data-testid={`player-card-${player.id}`}
      data-player-name={player.name}
    >
      <div>
        <strong data-testid={`player-name-${player.id}`}>{player.name}</strong>
        <p data-testid={`player-class-${player.id}`}>{player.characterIdentity}</p>
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
        <span data-testid={`player-level-${player.id}`}>Level {player.level}</span>
        <span data-testid={`player-defense-${player.id}`}>Defense {player.defense}</span>
        <span data-testid={`player-attack-${player.id}`}>Attack +{player.attackBonus}</span>
        <span data-testid={`player-state-${player.id}`}>
          {player.alive ? (player.confirmedCharacter ? "Ready" : "Unconfirmed") : "Knocked out"}
        </span>
      </div>
      <p data-testid={`player-inventory-${player.id}`}>
        Inventory: {player.inventory.length ? player.inventory.map((item) => item.name).join(", ") : "Empty"}
      </p>
      {targetAction ? (
        <div className="button-row">
          <button
            type="button"
            data-testid={`player-target-button-${player.id}`}
            onClick={() => targetAction.onTarget(player.id)}
            disabled={!targetAction.canTarget(player)}
          >
            {targetAction.label}
          </button>
          <span className="meta-copy" data-testid={`player-target-status-${player.id}`}>
            {targetAction.getMessage(player)}
          </span>
        </div>
      ) : null}
    </article>
  );
}

export function CharacterSheetPanel({ player }: CharacterSheetPanelProps) {
  if (!player) {
    return null;
  }

  return (
    <section className="panel" data-testid="character-sheet">
      <div className="section-header">
        <h2>Character Sheet</h2>
        <span data-testid="character-identity">{player.characterIdentity}</span>
      </div>
      <div className="player-stats two-column-grid">
        <span data-testid="character-confirmed">
          {player.confirmedCharacter ? "Confirmed" : "Awaiting confirmation"}
        </span>
        <span data-testid="character-level">Level {player.level}</span>
        <span data-testid="character-xp">XP {player.xp}</span>
        <span data-testid="character-defense">Defense {player.defense}</span>
        <span data-testid="character-attack-bonus">Attack +{player.attackBonus}</span>
        <span data-testid="character-range">Range {player.attackRange}</span>
        <span data-testid="character-spell-damage">Spell +{player.spellDamage}</span>
        <span data-testid="character-damage-dice">Damage {player.damageDice}</span>
      </div>
      <div className="player-stats two-column-grid">
        <span data-testid="character-might">Might {player.might}</span>
        <span data-testid="character-agility">Agility {player.agility}</span>
        <span data-testid="character-focus">Focus {player.focus}</span>
        <span data-testid="character-spirit">Spirit {player.spirit}</span>
      </div>
      <p className="meta-copy" data-testid="character-equipment-summary">
        Weapon: {player.equippedWeapon || "None"} | Armor: {player.equippedArmor || "None"}
      </p>
    </section>
  );
}

export function InventoryPanel({
  player,
  onEquip,
  onUse,
  canEquip,
  canUse
}: InventoryPanelProps) {
  if (!player) {
    return null;
  }

  return (
    <section className="panel" data-testid="inventory-panel">
      <div className="section-header">
        <h2>Inventory</h2>
        <span data-testid="inventory-count">{player.inventory.length} items</span>
      </div>
      <div className="player-list">
        {player.inventory.length ? (
          player.inventory.map((item) => (
            <article key={item.entryId} className="player-card" data-testid={`inventory-item-${item.entryId}`}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.effect}</p>
              </div>
              <div className="player-stats">
                <span>{item.itemType}</span>
                <span>{item.equipped ? "Equipped" : "Unequipped"}</span>
              </div>
              <div className="button-row">
                {item.equippable ? (
                  <button
                    type="button"
                    data-testid={`equip-item-${item.id}`}
                    onClick={() => onEquip(item.id)}
                    disabled={!canEquip(item)}
                  >
                    Equip
                  </button>
                ) : null}
                {item.usable ? (
                  <button
                    type="button"
                    data-testid={`use-item-${item.id}`}
                    onClick={() => onUse(item.id)}
                    disabled={!canUse(item)}
                  >
                    Use
                  </button>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className="meta-copy">No items collected yet.</p>
        )}
      </div>
    </section>
  );
}

export function ActionHotbar({
  currentPlayer,
  activeMode,
  onModeChange,
  onUsePotion,
  onEndTurn,
  canAttack,
  canUseAbility,
  canUsePotion,
  canEndTurn
}: ActionHotbarProps) {
  return (
    <section className="panel" data-testid="action-hotbar">
      <div className="section-header">
        <h2>Action Hotbar</h2>
        <span data-testid="action-hotbar-state">
          {activeMode === "attack"
            ? `Targeting basic attack (${currentPlayer?.attackRange ?? 0} range)`
            : `Targeting ${currentPlayer?.ability?.name ?? "class ability"}`}
        </span>
      </div>
      <div className="button-row hotbar-row">
        <button
          type="button"
          className={activeMode === "attack" ? "tab-button tab-button--active" : "tab-button"}
          data-testid="hotbar-basic-attack"
          onClick={() => onModeChange("attack")}
          disabled={!canAttack}
        >
          Basic Attack
        </button>
        <button
          type="button"
          className={activeMode === "ability" ? "tab-button tab-button--active" : "tab-button"}
          data-testid="hotbar-class-ability"
          onClick={() => onModeChange("ability")}
          disabled={!canUseAbility}
        >
          {currentPlayer?.ability?.name ?? "Class Ability"}
        </button>
        <button
          type="button"
          data-testid="hotbar-potion"
          onClick={onUsePotion}
          disabled={!canUsePotion}
        >
          Healing Potion
        </button>
        <button
          type="button"
          data-testid="hotbar-end-turn"
          onClick={onEndTurn}
          disabled={!canEndTurn}
        >
          End Turn
        </button>
      </div>
      <p className="meta-copy" data-testid="selected-ability-summary">
        {currentPlayer?.ability
          ? `${currentPlayer.ability.name}: ${currentPlayer.ability.description}`
          : "No class ability available."}
      </p>
    </section>
  );
}

export function EnemyPanel({
  enemies,
  actionLabel,
  canTargetEnemy,
  getEnemyRangeMessage,
  onTarget
}: EnemyPanelProps) {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>Enemies</h2>
        <span data-testid="enemy-count">{enemies.length} total</span>
      </div>
      <div className="player-list" data-testid="enemy-list">
        {enemies.length ? (
          enemies.map((enemy) => (
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
                  onClick={() => onTarget(enemy.id)}
                  disabled={!canTargetEnemy(enemy)}
                >
                  {actionLabel}
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
  );
}

export function TurnOrderPanel({ lobby }: { lobby: LobbyView }) {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>Turn order</h2>
        <span data-testid="turn-order-status">
          {lobby.activeTurn.type === "none" ? "Idle" : "Live"}
        </span>
      </div>
      <ol className="turn-order" data-testid="turn-order-list">
        {lobby.turnOrder.length ? (
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
  );
}

export function LogPanel({ title, logs, testId, countTestId, entryPrefix }: LogPanelProps) {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>{title}</h2>
        <span data-testid={countTestId}>{logs.length} entries</span>
      </div>
      <div className="combat-log" data-testid={testId}>
        {logs.length ? (
          logs.map((entry) => (
            <p key={entry.id} data-testid={`${entryPrefix}${entry.id}`}>
              {entry.message}
            </p>
          ))
        ) : (
          <p className="meta-copy">No messages yet.</p>
        )}
      </div>
    </section>
  );
}

export function DmLogTabsPanel({
  publicLogs,
  dmLogs,
  activeTab,
  onTabChange
}: DmLogTabsPanelProps) {
  const showingPublic = activeTab === "public";
  const activeLogs = showingPublic ? publicLogs : dmLogs;
  const panelTestId = showingPublic ? "combat-log" : "dm-log";
  const countTestId = showingPublic ? "combat-log-count" : "dm-log-count";
  const entryPrefix = showingPublic ? "combat-log-entry-" : "dm-log-entry-";

  return (
    <section className="panel">
      <div className="section-header">
        <h2>Logs</h2>
        <span data-testid={countTestId}>{activeLogs.length} entries</span>
      </div>
      <div className="tab-row">
        <button
          type="button"
          className={showingPublic ? "tab-button tab-button--active" : "tab-button"}
          data-testid="log-tab-public"
          onClick={() => onTabChange("public")}
        >
          Public Log
        </button>
        <button
          type="button"
          className={!showingPublic ? "tab-button tab-button--active" : "tab-button"}
          data-testid="log-tab-dm"
          onClick={() => onTabChange("dm")}
        >
          DM Log
        </button>
      </div>
      <div className="combat-log" data-testid={panelTestId}>
        {activeLogs.length ? (
          activeLogs.map((entry) => (
            <p key={entry.id} data-testid={`${entryPrefix}${entry.id}`}>
              {entry.message}
            </p>
          ))
        ) : (
          <p className="meta-copy">No messages yet.</p>
        )}
      </div>
    </section>
  );
}

export function DmPanel({
  lobby,
  role,
  sceneTarget,
  onSceneTargetChange,
  goldAmount,
  onGoldAmountChange,
  commandDraft,
  onCommandDraftChange,
  dmCommand,
  onDmCommandChange,
  onStartAdventure,
  onAdvanceScene,
  onPreviousScene,
  onRestartScene,
  onSetScene,
  onSpawnGoblin,
  onSpawnGoblinChief,
  onAwardPartyGold,
  onAddPublicMessage,
  onRunCommand
}: DmPanelProps) {
  if (role !== "dm") {
    return null;
  }

  return (
    <section className="panel dm-panel" data-testid="dm-panel">
      <div className="section-header">
        <h2>Dungeon Master Controls</h2>
        <span data-testid="dm-current-scene">{lobby.currentScene.title}</span>
      </div>

      <div className="dm-panel__body">
        <div className="dm-compact-grid" data-testid="dm-command-shortcuts">
          <button type="button" className="secondary-button" data-testid="dm-start-adventure" onClick={onStartAdventure}>
            Scene
          </button>
          <button type="button" className="secondary-button" data-testid="dm-spawn-goblin" onClick={onSpawnGoblin}>
            Spawn
          </button>
          <button type="button" className="secondary-button" data-testid="dm-award-gold" onClick={() => onAwardPartyGold(Number(goldAmount))}>
            Gold
          </button>
          <button type="button" className="secondary-button" data-testid="dm-add-public-message" onClick={() => onAddPublicMessage(commandDraft)}>
            Narrate
          </button>
          <button type="button" className="secondary-button" data-testid="dm-note-shortcut" onClick={() => onRunCommand(`/note ${commandDraft}`)}>
            Note
          </button>
          <button type="button" className="secondary-button" data-testid="dm-victory-shortcut" onClick={() => onRunCommand("/victory")}>
            Victory
          </button>
        </div>

        <div className="dm-control-group">
          <h3>Scene</h3>
          <div className="button-row">
            <button type="button" className="secondary-button" data-testid="dm-previous-scene" onClick={onPreviousScene}>
              Prev
            </button>
            <button type="button" className="secondary-button" data-testid="dm-advance-scene" onClick={onAdvanceScene}>
              Next
            </button>
            <button type="button" className="secondary-button" data-testid="dm-restart-scene" onClick={onRestartScene}>
              Restart
            </button>
          </div>
          <label className="field">
            <span>Move to scene</span>
            <select
              data-testid="dm-scene-select"
              value={sceneTarget}
              onChange={(event) => onSceneTargetChange(event.target.value)}
            >
              {lobby.availableScenes.map((scene) => (
                <SceneOption key={scene.id} scene={scene} />
              ))}
            </select>
          </label>
          <button type="button" data-testid="dm-set-scene" onClick={() => onSetScene(sceneTarget)}>
            Go To Scene
          </button>
        </div>

        <div className="dm-control-group">
          <h3>Spawn</h3>
          <div className="button-row">
            <button type="button" data-testid="dm-spawn-goblin-chief" onClick={onSpawnGoblinChief}>
              Goblin Chief
            </button>
          </div>
        </div>

        <div className="dm-control-group">
          <h3>Gold</h3>
          <div className="button-row">
            <input
              data-testid="dm-gold-input"
              type="number"
              min="1"
              value={goldAmount}
              onChange={(event) => onGoldAmountChange(event.target.value)}
            />
            <button type="button" className="secondary-button" data-testid="dm-gold-plus-five" onClick={() => onAwardPartyGold(5)}>
              +5
            </button>
          </div>
        </div>

        <div className="dm-control-group">
          <h3>Narrate / Note</h3>
          <div className="field">
            <textarea
              data-testid="dm-public-message-input"
              value={commandDraft}
              onChange={(event) => onCommandDraftChange(event.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="dm-panel__footer">
          <div className="field">
            <input
              data-testid="dm-command-input"
              value={dmCommand}
              onChange={(event) => onDmCommandChange(event.target.value)}
              placeholder="/narrate The forest goes silent."
            />
          </div>
          <button
            type="button"
            data-testid="dm-run-command"
            onClick={() => onRunCommand(dmCommand)}
          >
            Run Hidden Command
          </button>
        </div>
      </div>
    </section>
  );
}

function SceneOption({ scene }: { scene: SceneOptionView }) {
  return (
    <option value={scene.id}>
      {scene.title} ({scene.sceneType})
    </option>
  );
}
