import { useMemo, useState } from "react";
import type {
  AutomationEffectType,
  DynamicEventKind,
  EnemyView,
  FactionId,
  InventoryItemView,
  JoinRole,
  LobbyView,
  LogEntryView,
  NpcView,
  PlayerSkillCheckView,
  PlayerView,
  QuestStatus,
  QuestView,
  RewardHistoryView,
  SceneOptionView,
  SecretView,
  ShopView,
  SkillCheckType,
  SkillCheckVisibility,
  SkillCheckView,
  TimeOfDay,
  WeatherType,
  WorldEntityType,
  WorldEntityView
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

type WorldEntityPanelProps = {
  entities: WorldEntityView[];
  onInteract?: (entityId: string) => void;
  canInteract?: (entity: WorldEntityView) => boolean;
};

type ShopPanelProps = {
  shops: ShopView[];
  onBuy(shopId: string, itemId: string): void;
  canBuy(shop: ShopView, price: number): boolean;
};

type QuestPanelProps = {
  quests: QuestView[];
};

type PlayerSkillChecksPanelProps = {
  checks: PlayerSkillCheckView[];
  onRoll(checkId: string): void;
};

type DmWorldToolsPanelProps = {
  lobby: LobbyView;
  onRunTool(message: Record<string, unknown>): void;
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
    <article className="player-card" data-testid={`player-card-${player.id}`} data-player-name={player.name}>
      <div>
        <strong data-testid={`player-name-${player.id}`}>{player.name}</strong>
        <p data-testid={`player-class-${player.id}`}>{player.characterIdentity}</p>
      </div>
      <div className="player-stats">
        <span data-testid={`player-health-${player.id}`}>HP {player.health}/{player.maxHealth}</span>
        <span data-testid={`player-move-${player.id}`}>Move {player.remainingMovement}/{player.movement}</span>
        <span data-testid={`player-tile-${player.id}`}>Tile {player.x + 1},{player.y + 1}</span>
        <span data-testid={`player-gold-${player.id}`}>Gold {player.gold}</span>
        <span data-testid={`player-level-${player.id}`}>Level {player.level}</span>
        <span data-testid={`player-defense-${player.id}`}>Defense {player.defense}</span>
        <span data-testid={`player-attack-${player.id}`}>Attack +{player.attackBonus}</span>
        <span data-testid={`player-state-${player.id}`}>{player.confirmedCharacter ? player.status : "unconfirmed"}</span>
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
        <span data-testid="character-confirmed">{player.confirmedCharacter ? "Confirmed" : "Awaiting confirmation"}</span>
        <span data-testid="character-level">Level {player.level}</span>
        <span data-testid="character-xp">XP {player.xp}</span>
        <span data-testid="character-status">{player.status}</span>
        <span data-testid="character-ability-slots">Ability Slots {player.abilitySlots}</span>
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

export function InventoryPanel({ player, onEquip, onUse, canEquip, canUse }: InventoryPanelProps) {
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

export function WorldEntityPanel({ entities, onInteract, canInteract }: WorldEntityPanelProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const selectedEntity = entities.find((entity) => entity.id === selectedEntityId) ?? entities[0] ?? null;

  return (
    <section className="panel" data-testid="world-entity-panel">
      <div className="section-header">
        <h2>Discoveries</h2>
        <span data-testid="world-entity-count">{entities.length} visible</span>
      </div>
      <div className="player-list">
        {entities.length ? (
          entities.map((entity) => (
            <article key={entity.id} className="player-card" data-testid={`entity-card-${entity.id}`}>
              <div>
                <strong>{entity.name}</strong>
                <p>{formatEntityLabel(entity.type)}</p>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  data-testid={`entity-view-${entity.id}`}
                  onClick={() => setSelectedEntityId(entity.id)}
                >
                  View
                </button>
                {onInteract ? (
                  <button
                    type="button"
                    data-testid={`entity-interact-${entity.id}`}
                    onClick={() => onInteract(entity.id)}
                    disabled={!canInteract?.(entity)}
                  >
                    Interact
                  </button>
                ) : null}
                <span className="meta-copy">Tile {entity.x + 1},{entity.y + 1}</span>
              </div>
            </article>
          ))
        ) : (
          <p className="meta-copy">Nothing new has been revealed in this scene.</p>
        )}
      </div>
      {selectedEntity ? (
        <article className="player-card top-gap" data-testid="entity-detail-card">
          <strong data-testid="entity-detail-name">{selectedEntity.name}</strong>
          <p data-testid="entity-detail-text">{selectedEntity.publicDetails}</p>
          {selectedEntity.interaction ? (
            <p className="meta-copy" data-testid="entity-detail-interaction">
              {capitalizeCheck(selectedEntity.interaction.checkType)} DC {selectedEntity.interaction.dc}
            </p>
          ) : null}
          {selectedEntity.dmNotes ? <p className="meta-copy" data-testid="entity-detail-dm-notes">{selectedEntity.dmNotes}</p> : null}
        </article>
      ) : null}
    </section>
  );
}

export function ShopPanel({ shops, onBuy, canBuy }: ShopPanelProps) {
  return (
    <section className="panel" data-testid="dynamic-shop-panel">
      <div className="section-header">
        <h2>Visible Shops</h2>
        <span data-testid="dynamic-shop-count">{shops.length} shop(s)</span>
      </div>
      <div className="player-list">
        {shops.length ? (
          shops.map((shop) => (
            <article key={shop.id} className="player-card" data-testid={`dynamic-shop-${shop.id}`}>
              <div>
                <strong>{shop.name}</strong>
                <p>{shop.accessible ? "Accessible" : "Move adjacent to trade"}</p>
              </div>
              <div className="player-list">
                {shop.inventory.map((item) => (
                  <div key={`${shop.id}-${item.itemId}`} className="player-card compact-card">
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.effect}</p>
                    </div>
                    <div className="button-row">
                      <span data-testid={`shop-stock-${shop.id}-${item.itemId}`}>Stock {item.stock}</span>
                      <button
                        type="button"
                        data-testid={`shop-buy-${shop.id}-${item.itemId}`}
                        onClick={() => onBuy(shop.id, item.itemId)}
                        disabled={!canBuy(shop, item.price) || item.stock <= 0}
                      >
                        Buy ({item.price}g)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="meta-copy">No visible shops are available.</p>
        )}
      </div>
    </section>
  );
}

export function QuestPanel({ quests }: QuestPanelProps) {
  return (
    <section className="panel" data-testid="quest-panel">
      <div className="section-header">
        <h2>Quests</h2>
        <span data-testid="quest-count">{quests.length} tracked</span>
      </div>
      <div className="player-list">
        {quests.length ? (
          quests.map((quest) => (
            <article key={quest.id} className="player-card" data-testid={`quest-card-${quest.id}`}>
              <div>
                <strong>{quest.title}</strong>
                <p>{quest.publicObjective}</p>
              </div>
              <div className="player-stats">
                <span data-testid={`quest-status-${quest.id}`}>Status: {quest.status}</span>
                <span>Gold {quest.rewardGold}</span>
                <span>{quest.rewardItems.length ? `Items: ${quest.rewardItems.join(", ")}` : "No item reward"}</span>
              </div>
            </article>
          ))
        ) : (
          <p className="meta-copy">No quests are visible yet.</p>
        )}
      </div>
    </section>
  );
}

export function PlayerSkillChecksPanel({ checks, onRoll }: PlayerSkillChecksPanelProps) {
  return (
    <section className="panel" data-testid="player-skill-checks-panel">
      <div className="section-header">
        <h2>Skill Checks</h2>
        <span data-testid="player-skill-check-count">{checks.length} card(s)</span>
      </div>
      <div className="player-list">
        {checks.length ? (
          checks.map((check) => (
            <article key={check.id} className="player-card" data-testid={`player-check-${check.id}`}>
              <div>
                <strong>{check.title}</strong>
                <p>{check.description}</p>
                <p>{capitalizeCheck(check.checkType)}{check.showDc && check.dc ? ` DC ${check.dc}` : ""}</p>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  data-testid={`roll-check-${check.id}`}
                  onClick={() => onRoll(check.id)}
                  disabled={!check.canRoll}
                >
                  {check.rolled ? "Rolled" : "Roll"}
                </button>
                <span className="meta-copy">{check.resultText || "Awaiting roll."}</span>
              </div>
            </article>
          ))
        ) : (
          <p className="meta-copy">No pending or completed checks target you right now.</p>
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
        <button type="button" data-testid="hotbar-potion" onClick={onUsePotion} disabled={!canUsePotion}>
          Healing Potion
        </button>
        <button type="button" data-testid="hotbar-end-turn" onClick={onEndTurn} disabled={!canEndTurn}>
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
            <article key={enemy.id} className="player-card enemy-card" data-testid={`enemy-card-${enemy.id}`} data-enemy-name={enemy.name}>
              <div>
                <strong data-testid={`enemy-name-${enemy.id}`}>{enemy.name}</strong>
                <p data-testid={`enemy-status-${enemy.id}`}>{enemy.alive ? "Alive" : "Defeated"}</p>
              </div>
              <div className="player-stats">
                <span data-testid={`enemy-health-${enemy.id}`}>HP {enemy.hp}/{enemy.maxHp}</span>
                <span data-testid={`enemy-defense-${enemy.id}`}>Defense {enemy.defense}</span>
                <span data-testid={`enemy-tile-${enemy.id}`}>Tile {enemy.x + 1},{enemy.y + 1}</span>
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
        <span data-testid="turn-order-status">{lobby.activeTurn.type === "none" ? "Idle" : "Live"}</span>
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

export function RewardHistoryPanel({ rewards }: { rewards: RewardHistoryView[] }) {
  return (
    <section className="panel" data-testid="reward-history-panel">
      <div className="section-header">
        <h2>Rewards</h2>
        <span data-testid="reward-history-count">{rewards.length} entries</span>
      </div>
      <div className="combat-log">
        {rewards.length ? rewards.map((entry) => <p key={entry.id}>{entry.message}</p>) : <p className="meta-copy">No rewards logged yet.</p>}
      </div>
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
        {logs.length ? logs.map((entry) => <p key={entry.id} data-testid={`${entryPrefix}${entry.id}`}>{entry.message}</p>) : <p className="meta-copy">No messages yet.</p>}
      </div>
    </section>
  );
}

export function DmLogTabsPanel({ publicLogs, dmLogs, activeTab, onTabChange }: DmLogTabsPanelProps) {
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
        <button type="button" className={showingPublic ? "tab-button tab-button--active" : "tab-button"} data-testid="log-tab-public" onClick={() => onTabChange("public")}>
          Public Log
        </button>
        <button type="button" className={!showingPublic ? "tab-button tab-button--active" : "tab-button"} data-testid="log-tab-dm" onClick={() => onTabChange("dm")}>
          DM Log
        </button>
      </div>
      <div className="combat-log" data-testid={panelTestId}>
        {activeLogs.length ? activeLogs.map((entry) => <p key={entry.id} data-testid={`${entryPrefix}${entry.id}`}>{entry.message}</p>) : <p className="meta-copy">No messages yet.</p>}
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
          <button type="button" className="secondary-button" data-testid="dm-start-adventure" onClick={onStartAdventure}>Scene</button>
          <button type="button" className="secondary-button" data-testid="dm-spawn-goblin" onClick={onSpawnGoblin}>Spawn</button>
          <button type="button" className="secondary-button" data-testid="dm-award-gold" onClick={() => onAwardPartyGold(Number(goldAmount))}>Gold</button>
          <button type="button" className="secondary-button" data-testid="dm-add-public-message" onClick={() => onAddPublicMessage(commandDraft)}>Narrate</button>
          <button type="button" className="secondary-button" data-testid="dm-note-shortcut" onClick={() => onRunCommand(`/note ${commandDraft}`)}>Note</button>
          <button type="button" className="secondary-button" data-testid="dm-victory-shortcut" onClick={() => onRunCommand("/victory")}>Victory</button>
        </div>

        <div className="dm-control-group">
          <h3>Scene</h3>
          <div className="button-row">
            <button type="button" className="secondary-button" data-testid="dm-previous-scene" onClick={onPreviousScene}>Prev</button>
            <button type="button" className="secondary-button" data-testid="dm-advance-scene" onClick={onAdvanceScene}>Next</button>
            <button type="button" className="secondary-button" data-testid="dm-restart-scene" onClick={onRestartScene}>Restart</button>
          </div>
          <label className="field">
            <span>Move to scene</span>
            <select data-testid="dm-scene-select" value={sceneTarget} onChange={(event) => onSceneTargetChange(event.target.value)}>
              {lobby.availableScenes.map((scene) => <SceneOption key={scene.id} scene={scene} />)}
            </select>
          </label>
          <button type="button" data-testid="dm-set-scene" onClick={() => onSetScene(sceneTarget)}>Go To Scene</button>
        </div>

        <div className="dm-control-group">
          <h3>Spawn</h3>
          <div className="button-row">
            <button type="button" data-testid="dm-spawn-goblin-chief" onClick={onSpawnGoblinChief}>Goblin Chief</button>
          </div>
        </div>

        <div className="dm-control-group">
          <h3>Gold</h3>
          <div className="button-row">
            <input data-testid="dm-gold-input" type="number" min="1" value={goldAmount} onChange={(event) => onGoldAmountChange(event.target.value)} />
            <button type="button" className="secondary-button" data-testid="dm-gold-plus-five" onClick={() => onAwardPartyGold(5)}>+5</button>
          </div>
        </div>

        <div className="dm-control-group">
          <h3>Narrate / Note</h3>
          <div className="field">
            <textarea data-testid="dm-public-message-input" value={commandDraft} onChange={(event) => onCommandDraftChange(event.target.value)} rows={3} />
          </div>
        </div>

        <div className="dm-panel__footer">
          <div className="field">
            <input data-testid="dm-command-input" value={dmCommand} onChange={(event) => onDmCommandChange(event.target.value)} placeholder="/narrate The forest goes silent." />
          </div>
          <button type="button" data-testid="dm-run-command" onClick={() => onRunCommand(dmCommand)}>Run Hidden Command</button>
        </div>
      </div>
    </section>
  );
}

export function DmWorldToolsPanel({ lobby, onRunTool }: DmWorldToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<"maps" | "players" | "npcs" | "objects" | "shops" | "quests" | "encounters" | "secrets" | "rewards" | "notes" | "world">("maps");
  const [selectedMapKey, setSelectedMapKey] = useState(lobby.currentMapKey);
  const [selectedMapId, setSelectedMapId] = useState(lobby.sessionMaps.find((map) => map.key === lobby.currentMapKey)?.mapId ?? lobby.currentScene.mapId);
  const [npcName, setNpcName] = useState("Gatekeeper");
  const [npcRole, setNpcRole] = useState("guard");
  const [placeNpcId, setPlaceNpcId] = useState("");
  const [entityType, setEntityType] = useState<WorldEntityType>("npc");
  const [entityX, setEntityX] = useState("1");
  const [entityY, setEntityY] = useState("1");
  const [spawnPlayerId, setSpawnPlayerId] = useState("");
  const [spawnX, setSpawnX] = useState("1");
  const [spawnY, setSpawnY] = useState("1");
  const [playerStatus, setPlayerStatus] = useState("alive");
  const [shopName, setShopName] = useState("Camp Supply");
  const [shopNpcId, setShopNpcId] = useState("");
  const [shopItemId, setShopItemId] = useState("healing_potion");
  const [shopPrice, setShopPrice] = useState("10");
  const [shopStock, setShopStock] = useState("2");
  const [questTitle, setQuestTitle] = useState("Find the missing scout");
  const [questObjective, setQuestObjective] = useState("Search the tree line for signs of the missing scout.");
  const [questRewardGold, setQuestRewardGold] = useState("10");
  const [secretCheckType, setSecretCheckType] = useState<SkillCheckType>("perception");
  const [secretDc, setSecretDc] = useState("14");
  const [secretText, setSecretText] = useState("A cracked wall hides a narrow passage.");
  const [secretEntityId, setSecretEntityId] = useState("");
  const [rewardType, setRewardType] = useState<"gold" | "item" | "xp" | "healing" | "quest_progress">("gold");
  const [rewardAmount, setRewardAmount] = useState("5");
  const [rewardPlayerId, setRewardPlayerId] = useState("party");
  const [rewardItemId, setRewardItemId] = useState("healing_potion");
  const [encounterName, setEncounterName] = useState("Forest Ambush");
  const [encounterEnemyId, setEncounterEnemyId] = useState("goblin");
  const [encounterX, setEncounterX] = useState("4");
  const [encounterY, setEncounterY] = useState("2");
  const [templateName, setTemplateName] = useState("Prepared Expedition");
  const [sessionNote, setSessionNote] = useState("");
  const [checkType, setCheckType] = useState<SkillCheckType>("insight");
  const [checkDc, setCheckDc] = useState("14");
  const [checkTarget, setCheckTarget] = useState("party");
  const [selectedCheckPlayers, setSelectedCheckPlayers] = useState<string[]>([]);
  const [checkVisibility, setCheckVisibility] = useState<SkillCheckVisibility>("targeted");
  const [checkTitle, setCheckTitle] = useState("Read the room");
  const [checkDescription, setCheckDescription] = useState("Investigate the scene for hidden clues.");
  const [checkSuccess, setCheckSuccess] = useState("A hidden clue is revealed.");
  const [checkFailure, setCheckFailure] = useState("Nothing useful is uncovered.");
  const [successEffectType, setSuccessEffectType] = useState<AutomationEffectType>("none");
  const [failureEffectType, setFailureEffectType] = useState<AutomationEffectType>("none");
  const [effectDiscountPercent, setEffectDiscountPercent] = useState("15");
  const [effectNarration, setEffectNarration] = useState("The result changes the scene.");
  const [selectedInteractionEntityId, setSelectedInteractionEntityId] = useState("");
  const [interactionTitle, setInteractionTitle] = useState("Inspect the object");
  const [interactionDescription, setInteractionDescription] = useState("A closer look may reveal something important.");
  const [interactionNotes, setInteractionNotes] = useState("");
  const [fogName, setFogName] = useState("Hidden Room");
  const [fogWidth, setFogWidth] = useState("2");
  const [fogHeight, setFogHeight] = useState("2");
  const [triggerName, setTriggerName] = useState("Bridge Ambush");
  const [triggerWidth, setTriggerWidth] = useState("1");
  const [triggerHeight, setTriggerHeight] = useState("1");
  const [triggerTargetEntityId, setTriggerTargetEntityId] = useState("");
  const [triggerEventId, setTriggerEventId] = useState("");
  const [eventName, setEventName] = useState("Bridge Ambush Event");
  const [eventKind, setEventKind] = useState<DynamicEventKind>("ambush");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(lobby.timeOfDay);
  const [weather, setWeather] = useState<WeatherType>(lobby.weather);
  const [factionId, setFactionId] = useState<FactionId>("merchants_guild");
  const [reputationAmount, setReputationAmount] = useState("5");
  const [journalEntry, setJournalEntry] = useState("The world changes.");
  const [patrolEntityId, setPatrolEntityId] = useState("");
  const [patrolWaypoints, setPatrolWaypoints] = useState("1,1;3,1;3,3");

  const latestShop = lobby.shops.at(-1) ?? null;
  const latestQuest = lobby.quests.at(-1) ?? null;
  const latestSecret = lobby.secrets.at(-1) ?? null;

  const npcOptions = useMemo(() => lobby.npcs, [lobby.npcs]);
  const entityOptions = useMemo(() => lobby.worldEntities, [lobby.worldEntities]);
  const quickActionButtons = [
    { id: "skill-check", label: "Skill Check", run: () => setActiveTab("secrets") },
    { id: "reveal-secret", label: "Reveal Secret", run: () => latestSecret && onRunTool({ tool: "revealSecret", secretId: latestSecret.id }) },
    { id: "spawn-enemy", label: "Spawn Enemy", run: () => onRunTool({ tool: "createEncounterGroup", name: encounterName, enemyId: encounterEnemyId, x: Number(encounterX), y: Number(encounterY), mapKey: selectedMapKey }) },
    { id: "give-gold", label: "Give Gold", run: () => onRunTool({ tool: "giveReward", name: "gold", target: "party", amount: Number(rewardAmount) || 5 }) },
    { id: "give-item", label: "Give Item", run: () => onRunTool({ tool: "giveReward", name: "item", target: rewardPlayerId === "party" ? "party" : "player", playerName: rewardPlayerId, itemId: rewardItemId }) },
    { id: "narrate", label: "Narrate", run: () => onRunTool({ tool: "addSessionNote", note: effectNarration }) },
    { id: "start-encounter", label: "Start Encounter", run: () => onRunTool({ tool: "activateEncounterGroup", encounterId: "encounter-1" }) },
    { id: "move-map", label: "Move Map", run: () => onRunTool({ tool: "setMap", mapKey: selectedMapKey }) },
    { id: "complete-quest", label: "Complete Quest", run: () => latestQuest && onRunTool({ tool: "setQuestStatus", questId: latestQuest.id, name: "completed" }) }
  ];

  return (
    <section className="panel" data-testid="dm-world-tools-panel">
      <div className="section-header">
        <h2>DM World Tools</h2>
        <span data-testid="dm-world-summary">
          {lobby.roomPhase.toUpperCase()} · {lobby.currentMapKey} · {lobby.npcs.length} NPCs · {lobby.shops.length} shops
        </span>
      </div>

      <section className="dm-control-group" data-testid="dm-quick-actions">
        <h3>Quick Actions</h3>
        <div className="button-row">
          {quickActionButtons.map((action) => (
            <button key={action.id} type="button" data-testid={`dm-quick-${action.id}`} onClick={action.run}>
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section className="dm-control-group" data-testid="dm-skill-check-panel">
        <h3>Skill Check Panel</h3>
        <div className="two-column-grid">
          <label className="field">
            <span>Skill</span>
            <select data-testid="dm-check-type" value={checkType} onChange={(event) => setCheckType(event.target.value as SkillCheckType)}>
              {lobby.availableSkillChecks.map((skill) => <option key={skill} value={skill}>{capitalizeCheck(skill)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>DC</span>
            <input data-testid="dm-check-dc" value={checkDc} onChange={(event) => setCheckDc(event.target.value)} />
          </label>
          <label className="field">
            <span>Target</span>
            <select data-testid="dm-check-target" value={checkTarget} onChange={(event) => setCheckTarget(event.target.value)}>
              <option value="party">Party</option>
              <option value="selected">Selected Players</option>
              {lobby.players.map((player) => <option key={player.id} value={player.name}>{player.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Visibility</span>
            <select data-testid="dm-check-visibility" value={checkVisibility} onChange={(event) => setCheckVisibility(event.target.value as SkillCheckVisibility)}>
              <option value="public">Public result</option>
              <option value="dm">DM-only result</option>
              <option value="targeted">Player + DM only</option>
            </select>
          </label>
        </div>
        <div className="button-row">
          {[5, 10, 12, 15, 18, 20, 25].map((preset) => (
            <button key={preset} type="button" className="secondary-button" data-testid={`dm-check-preset-${preset}`} onClick={() => setCheckDc(String(preset))}>
              {preset}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Title</span>
          <input data-testid="dm-check-title" value={checkTitle} onChange={(event) => setCheckTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Description</span>
          <input data-testid="dm-check-description" value={checkDescription} onChange={(event) => setCheckDescription(event.target.value)} />
        </label>
        <label className="field">
          <span>Success message</span>
          <input data-testid="dm-check-success" value={checkSuccess} onChange={(event) => setCheckSuccess(event.target.value)} />
        </label>
        <label className="field">
          <span>Failure message</span>
          <input data-testid="dm-check-failure" value={checkFailure} onChange={(event) => setCheckFailure(event.target.value)} />
        </label>
        {checkTarget === "selected" ? (
          <div className="player-list">
            {lobby.players.map((player) => (
              <label key={player.id} className="role-option">
                <input
                  type="checkbox"
                  checked={selectedCheckPlayers.includes(player.id)}
                  onChange={(event) =>
                    setSelectedCheckPlayers((current) =>
                      event.target.checked ? [...current, player.id] : current.filter((entry) => entry !== player.id)
                    )
                  }
                />
                <span>{player.name}</span>
              </label>
            ))}
          </div>
        ) : null}
        <div className="two-column-grid">
          <label className="field">
            <span>Success effect</span>
            <select data-testid="dm-check-success-effect" value={successEffectType} onChange={(event) => setSuccessEffectType(event.target.value as AutomationEffectType)}>
              <option value="none">None</option>
              <option value="reveal_secret">Reveal Secret</option>
              <option value="reward">Give Reward</option>
              <option value="quest_progress">Quest Progress</option>
              <option value="shop_discount">Shop Discount</option>
              <option value="trigger_event">Trigger Event</option>
              <option value="trigger_combat">Trigger Combat</option>
              <option value="narration">Narration</option>
            </select>
          </label>
          <label className="field">
            <span>Failure effect</span>
            <select data-testid="dm-check-failure-effect" value={failureEffectType} onChange={(event) => setFailureEffectType(event.target.value as AutomationEffectType)}>
              <option value="none">None</option>
              <option value="trigger_event">Trigger Event</option>
              <option value="trigger_combat">Trigger Combat</option>
              <option value="narration">Narration</option>
            </select>
          </label>
          <label className="field">
            <span>Discount %</span>
            <input data-testid="dm-check-discount" value={effectDiscountPercent} onChange={(event) => setEffectDiscountPercent(event.target.value)} />
          </label>
          <label className="field">
            <span>Effect narration</span>
            <input data-testid="dm-check-effect-note" value={effectNarration} onChange={(event) => setEffectNarration(event.target.value)} />
          </label>
        </div>
        <div className="button-row">
          <button
            type="button"
            data-testid="dm-create-check"
            onClick={() =>
              onRunTool({
                tool: "createSkillCheck",
                checkType,
                dc: Number(checkDc),
                title: checkTitle,
                description: checkDescription,
                target: checkTarget === "party" ? "party" : checkTarget === "selected" ? "player" : "player",
                playerName: checkTarget === "selected" ? undefined : checkTarget,
                targetPlayerIds: checkTarget === "selected" ? selectedCheckPlayers : undefined,
                visibility: checkVisibility,
                successMessage: checkSuccess,
                failureMessage: checkFailure,
                linkedSecretId: latestSecret?.id,
                effectType: successEffectType,
                failureEffectType,
                linkedShopId: latestShop?.id,
                questId: latestQuest?.id,
                discountPercent: Number(effectDiscountPercent),
                note: effectNarration
              })
            }
          >
            Create Check
          </button>
        </div>
      </section>

      <div className="tab-row">
        {(["maps", "players", "npcs", "objects", "shops", "quests", "encounters", "secrets", "rewards", "notes", "world"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "tab-button tab-button--active" : "tab-button"}
            data-testid={`dm-world-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === "maps" ? (
        <div className="player-list">
          <div className="two-column-grid">
            <label className="field">
              <span>Session map</span>
              <select data-testid="dm-session-map-select" value={selectedMapKey} onChange={(event) => setSelectedMapKey(event.target.value as typeof selectedMapKey)}>
                {lobby.sessionMaps.map((sessionMap) => <option key={sessionMap.key} value={sessionMap.key}>{sessionMap.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Base map</span>
              <select data-testid="dm-map-definition-select" value={selectedMapId} onChange={(event) => setSelectedMapId(event.target.value)}>
                {lobby.availableMaps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}
              </select>
            </label>
          </div>
          <div className="button-row">
            <button type="button" data-testid="dm-set-current-map" onClick={() => onRunTool({ tool: "setMap", mapKey: selectedMapKey })}>Open Map</button>
            <button type="button" data-testid="dm-save-map-definition" onClick={() => onRunTool({ tool: "setMapDefinition", mapKey: selectedMapKey, mapId: selectedMapId })}>Assign Base Map</button>
          </div>
          <label className="field">
            <span>Template name</span>
            <input data-testid="dm-template-name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
          </label>
          <div className="button-row">
            <button type="button" data-testid="dm-save-template" onClick={() => onRunTool({ tool: "saveTemplate", templateName })}>Save Template</button>
            <select data-testid="dm-load-template-select" value={templateName} onChange={(event) => setTemplateName(event.target.value)}>
              {lobby.savedTemplates.length ? lobby.savedTemplates.map((template) => <option key={template.id} value={template.name}>{template.name}</option>) : <option value={templateName}>{templateName}</option>}
            </select>
            <button type="button" data-testid="dm-load-template" onClick={() => onRunTool({ tool: "loadTemplate", templateName })}>Load Template</button>
          </div>
          <label className="field">
            <span>Campaign difficulty</span>
            <select data-testid="dm-campaign-difficulty" value={lobby.campaignDifficulty} onChange={(event) => onRunTool({ tool: "setCampaignDifficulty", difficulty: event.target.value })}>
              <option value="casual">Casual</option>
              <option value="hardcore">Hardcore</option>
              <option value="legendary">Legendary</option>
            </select>
          </label>
          <div className="player-list">
            {lobby.sessionMaps.map((sessionMap) => (
              <article key={sessionMap.key} className="player-card" data-testid={`session-map-${sessionMap.key}`}>
                <div>
                  <strong>{sessionMap.label}</strong>
                  <p>{sessionMap.mapName}</p>
                </div>
                <div className="player-stats">
                  <span>Spawns {sessionMap.spawnCount}</span>
                  <span>Encounters {sessionMap.encounterCount}</span>
                  <span>Entities {sessionMap.entityCount}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "players" ? (
        <div className="player-list">
          <div className="two-column-grid">
            <label className="field">
              <span>Player</span>
              <select data-testid="dm-player-spawn-select" value={spawnPlayerId} onChange={(event) => setSpawnPlayerId(event.target.value)}>
                <option value="">Choose player</option>
                {lobby.players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Map</span>
              <select data-testid="dm-player-spawn-map" value={selectedMapKey} onChange={(event) => setSelectedMapKey(event.target.value as typeof selectedMapKey)}>
                {lobby.sessionMaps.map((sessionMap) => <option key={sessionMap.key} value={sessionMap.key}>{sessionMap.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Spawn X</span>
              <input data-testid="dm-player-spawn-x" value={spawnX} onChange={(event) => setSpawnX(event.target.value)} />
            </label>
            <label className="field">
              <span>Spawn Y</span>
              <input data-testid="dm-player-spawn-y" value={spawnY} onChange={(event) => setSpawnY(event.target.value)} />
            </label>
          </div>
          <button type="button" data-testid="dm-save-player-spawn" onClick={() => onRunTool({ tool: "setPlayerSpawn", playerId: spawnPlayerId, mapKey: selectedMapKey, x: Number(spawnX), y: Number(spawnY) })}>Save Spawn</button>
          <div className="button-row">
            <select data-testid="dm-player-status" value={playerStatus} onChange={(event) => setPlayerStatus(event.target.value)}>
              <option value="alive">Alive</option>
              <option value="downed">Downed</option>
              <option value="dead">Dead</option>
              <option value="permanentlyDead">Permanently Dead</option>
            </select>
            <button type="button" data-testid="dm-set-player-status" onClick={() => onRunTool({ tool: "setPlayerStatus", playerId: spawnPlayerId, status: playerStatus })}>Apply Status</button>
          </div>
          {lobby.players.map((player) => (
            <article key={player.id} className="player-card" data-testid={`dm-player-prep-${player.id}`}>
              <div>
                <strong>{player.name}</strong>
                <p>{player.characterIdentity}</p>
              </div>
              <div className="player-stats">
                <span>{player.status}</span>
                <span>Level {player.level}</span>
                <span>Adventures {player.completedAdventures}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === "npcs" ? (
        <div className="player-list">
          <label className="field">
            <span>Name</span>
            <input data-testid="dm-npc-name" value={npcName} onChange={(event) => setNpcName(event.target.value)} />
          </label>
          <label className="field">
            <span>Role</span>
            <input data-testid="dm-npc-role" value={npcRole} onChange={(event) => setNpcRole(event.target.value)} />
          </label>
          <div className="button-row">
            <button type="button" data-testid="dm-create-npc" onClick={() => onRunTool({ tool: "createNpc", name: npcName, role: npcRole })}>Create NPC</button>
            <button type="button" data-testid="dm-generate-npc" onClick={() => onRunTool({ tool: "generateNpc" })}>Generate NPC</button>
          </div>
          <div className="two-column-grid">
            <label className="field">
              <span>NPC to place</span>
              <select data-testid="dm-place-npc-select" value={placeNpcId} onChange={(event) => setPlaceNpcId(event.target.value)}>
                <option value="">Choose NPC</option>
                {npcOptions.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Marker type</span>
              <select data-testid="dm-entity-type" value={entityType} onChange={(event) => setEntityType(event.target.value as WorldEntityType)}>
                {lobby.availableEntityTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>X</span>
              <input data-testid="dm-entity-x" value={entityX} onChange={(event) => setEntityX(event.target.value)} />
            </label>
            <label className="field">
              <span>Y</span>
              <input data-testid="dm-entity-y" value={entityY} onChange={(event) => setEntityY(event.target.value)} />
            </label>
          </div>
          <div className="button-row">
            <button
              type="button"
              data-testid="dm-place-entity"
              onClick={() =>
                onRunTool({
                  tool: "placeEntity",
                  entityType,
                  npcId: placeNpcId,
                  x: Number(entityX),
                  y: Number(entityY),
                  visibilityState: "hidden",
                  mapKey: selectedMapKey
                })
              }
            >
              Place Entity
            </button>
          </div>
          {lobby.worldEntities.map((entity) => (
            <article key={entity.id} className="player-card" data-testid={`dm-entity-row-${entity.id}`}>
              <div>
                <strong>{entity.name}</strong>
                <p>{formatEntityLabel(entity.type)}</p>
              </div>
              <div className="button-row">
                <button type="button" data-testid={`dm-reveal-entity-${entity.id}`} onClick={() => onRunTool({ tool: "setEntityVisibility", entityId: entity.id, visibleToPlayers: true })}>Reveal</button>
                <button type="button" data-testid={`dm-hide-entity-${entity.id}`} onClick={() => onRunTool({ tool: "setEntityVisibility", entityId: entity.id, visibleToPlayers: false })}>Hide</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === "objects" ? (
        <div className="player-list">
          <div className="two-column-grid">
            <label className="field">
              <span>Object type</span>
              <select data-testid="dm-object-type" value={entityType} onChange={(event) => setEntityType(event.target.value as WorldEntityType)}>
                {lobby.availableEntityTypes.filter((type) => type.id !== "npc" && type.id !== "shopkeeper").map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Map</span>
              <select data-testid="dm-object-map" value={selectedMapKey} onChange={(event) => setSelectedMapKey(event.target.value as typeof selectedMapKey)}>
                {lobby.sessionMaps.map((sessionMap) => <option key={sessionMap.key} value={sessionMap.key}>{sessionMap.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>X</span>
              <input data-testid="dm-object-x" value={entityX} onChange={(event) => setEntityX(event.target.value)} />
            </label>
            <label className="field">
              <span>Y</span>
              <input data-testid="dm-object-y" value={entityY} onChange={(event) => setEntityY(event.target.value)} />
            </label>
          </div>
          <button type="button" data-testid="dm-place-object" onClick={() => onRunTool({ tool: "placeEntity", entityType, x: Number(entityX), y: Number(entityY), mapKey: selectedMapKey, visibilityState: entityType === "secret_marker" || entityType === "trap_marker" ? "dm_only" : "hidden" })}>Place Object</button>
          <label className="field">
            <span>Configure object</span>
            <select data-testid="dm-interaction-entity" value={selectedInteractionEntityId} onChange={(event) => setSelectedInteractionEntityId(event.target.value)}>
              <option value="">Choose object</option>
              {entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Interaction title</span>
            <input data-testid="dm-interaction-title" value={interactionTitle} onChange={(event) => setInteractionTitle(event.target.value)} />
          </label>
          <label className="field">
            <span>Interaction description</span>
            <input data-testid="dm-interaction-description" value={interactionDescription} onChange={(event) => setInteractionDescription(event.target.value)} />
          </label>
          <label className="field">
            <span>DM notes</span>
            <textarea data-testid="dm-interaction-notes" value={interactionNotes} onChange={(event) => setInteractionNotes(event.target.value)} rows={2} />
          </label>
          <div className="button-row">
            <button
              type="button"
              data-testid="dm-configure-interaction"
              onClick={() =>
                onRunTool({
                  tool: "configureEntityInteraction",
                  entityId: selectedInteractionEntityId,
                  interactionTitle,
                  description: interactionDescription,
                  checkType,
                  dc: Number(checkDc),
                  visibility: checkVisibility,
                  successMessage: checkSuccess,
                  failureMessage: checkFailure,
                  effectType: successEffectType,
                  failureEffectType,
                  linkedSecretId: latestSecret?.id,
                  linkedShopId: latestShop?.id,
                  questId: latestQuest?.id,
                  discountPercent: Number(effectDiscountPercent),
                  note: effectNarration,
                  targetPlayerMode: "single"
                })
              }
            >
              Save Interaction
            </button>
            <button type="button" data-testid="dm-save-entity-notes" onClick={() => onRunTool({ tool: "setEntityNotes", entityId: selectedInteractionEntityId, note: interactionNotes })}>
              Save Notes
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === "shops" ? (
        <div className="player-list">
          <label className="field">
            <span>Shop name</span>
            <input data-testid="dm-shop-name" value={shopName} onChange={(event) => setShopName(event.target.value)} />
          </label>
          <label className="field">
            <span>Shopkeeper NPC</span>
            <select data-testid="dm-shop-npc" value={shopNpcId} onChange={(event) => setShopNpcId(event.target.value)}>
              <option value="">Latest NPC</option>
              {npcOptions.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
            </select>
          </label>
          <div className="button-row">
            <button type="button" data-testid="dm-create-shop" onClick={() => onRunTool({ tool: "createShop", name: shopName, npcId: shopNpcId || undefined })}>Create Shop</button>
            <button type="button" data-testid="dm-generate-shop" onClick={() => onRunTool({ tool: "generateShop" })}>Generate Shop</button>
          </div>
          <div className="two-column-grid">
            <label className="field">
              <span>Item</span>
              <select data-testid="dm-shop-item" value={shopItemId} onChange={(event) => setShopItemId(event.target.value)}>
                {["healing_potion", "iron_sword", "leather_armor"].map((itemId) => <option key={itemId} value={itemId}>{itemId}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Price</span>
              <input data-testid="dm-shop-price" value={shopPrice} onChange={(event) => setShopPrice(event.target.value)} />
            </label>
            <label className="field">
              <span>Stock</span>
              <input data-testid="dm-shop-stock" value={shopStock} onChange={(event) => setShopStock(event.target.value)} />
            </label>
          </div>
          <button
            type="button"
            data-testid="dm-shop-add-item"
            onClick={() => latestShop && onRunTool({ tool: "addShopItem", shopId: latestShop.id, itemId: shopItemId, price: Number(shopPrice), stock: Number(shopStock) })}
            disabled={!latestShop}
          >
            Add Item To Latest Shop
          </button>
        </div>
      ) : null}

      {activeTab === "quests" ? (
        <div className="player-list">
          <label className="field">
            <span>Quest title</span>
            <input data-testid="dm-quest-title" value={questTitle} onChange={(event) => setQuestTitle(event.target.value)} />
          </label>
          <label className="field">
            <span>Objective</span>
            <textarea data-testid="dm-quest-objective" value={questObjective} onChange={(event) => setQuestObjective(event.target.value)} rows={3} />
          </label>
          <label className="field">
            <span>Reward gold</span>
            <input data-testid="dm-quest-reward-gold" value={questRewardGold} onChange={(event) => setQuestRewardGold(event.target.value)} />
          </label>
          <div className="button-row">
            <button type="button" data-testid="dm-create-quest" onClick={() => onRunTool({ tool: "createQuest", title: questTitle, objective: questObjective, rewardGold: Number(questRewardGold) })}>Create Quest</button>
            <button type="button" data-testid="dm-generate-quest" onClick={() => onRunTool({ tool: "generateQuest" })}>Generate Quest</button>
            <button type="button" data-testid="dm-offer-latest-quest" onClick={() => latestQuest && onRunTool({ tool: "setQuestStatus", questId: latestQuest.id, name: "offered" })} disabled={!latestQuest}>Offer Latest</button>
            <button type="button" data-testid="dm-complete-latest-quest" onClick={() => latestQuest && onRunTool({ tool: "setQuestStatus", questId: latestQuest.id, name: "completed" })} disabled={!latestQuest}>Complete Latest</button>
          </div>
        </div>
      ) : null}

      {activeTab === "encounters" ? (
        <div className="player-list">
          <label className="field">
            <span>Encounter name</span>
            <input data-testid="dm-encounter-name" value={encounterName} onChange={(event) => setEncounterName(event.target.value)} />
          </label>
          <div className="two-column-grid">
            <label className="field">
              <span>Enemy</span>
              <select data-testid="dm-encounter-enemy" value={encounterEnemyId} onChange={(event) => setEncounterEnemyId(event.target.value)}>
                {["goblin", "goblin_chief", "wolf", "skeleton"].map((enemyId) => <option key={enemyId} value={enemyId}>{enemyId}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Map</span>
              <select data-testid="dm-encounter-map" value={selectedMapKey} onChange={(event) => setSelectedMapKey(event.target.value as typeof selectedMapKey)}>
                {lobby.sessionMaps.map((sessionMap) => <option key={sessionMap.key} value={sessionMap.key}>{sessionMap.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Trigger X</span>
              <input data-testid="dm-encounter-x" value={encounterX} onChange={(event) => setEncounterX(event.target.value)} />
            </label>
            <label className="field">
              <span>Trigger Y</span>
              <input data-testid="dm-encounter-y" value={encounterY} onChange={(event) => setEncounterY(event.target.value)} />
            </label>
          </div>
          <button type="button" data-testid="dm-create-encounter" onClick={() => onRunTool({ tool: "createEncounterGroup", name: encounterName, enemyId: encounterEnemyId, x: Number(encounterX), y: Number(encounterY), mapKey: selectedMapKey })}>Stage Encounter</button>
        </div>
      ) : null}

      {activeTab === "secrets" ? (
        <div className="player-list">
          <label className="field">
            <span>Check type</span>
            <select data-testid="dm-secret-check-type" value={secretCheckType} onChange={(event) => setSecretCheckType(event.target.value as SkillCheckType)}>
              {lobby.availableSkillChecks.map((skill) => <option key={skill} value={skill}>{capitalizeCheck(skill)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>DC</span>
            <input data-testid="dm-secret-dc" value={secretDc} onChange={(event) => setSecretDc(event.target.value)} />
          </label>
          <label className="field">
            <span>Reveal text</span>
            <textarea data-testid="dm-secret-text" value={secretText} onChange={(event) => setSecretText(event.target.value)} rows={3} />
          </label>
          <label className="field">
            <span>Linked entity</span>
            <select data-testid="dm-secret-entity" value={secretEntityId} onChange={(event) => setSecretEntityId(event.target.value)}>
              <option value="">No linked marker</option>
              {entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </label>
          <div className="button-row">
            <button type="button" data-testid="dm-create-secret" onClick={() => onRunTool({ tool: "createSecret", checkType: secretCheckType, dc: Number(secretDc), description: secretText, linkedEntityId: secretEntityId || undefined })}>Create Secret</button>
            <button type="button" data-testid="dm-generate-secret" onClick={() => onRunTool({ tool: "generateSecret" })}>Generate Secret</button>
            <button type="button" data-testid="dm-reveal-latest-secret" onClick={() => latestSecret && onRunTool({ tool: "revealSecret", secretId: latestSecret.id })} disabled={!latestSecret}>Reveal Latest</button>
          </div>
        </div>
      ) : null}

      {activeTab === "rewards" ? (
        <div className="player-list">
          <div className="two-column-grid">
            <label className="field">
              <span>Reward type</span>
              <select data-testid="dm-reward-type" value={rewardType} onChange={(event) => setRewardType(event.target.value as typeof rewardType)}>
                <option value="gold">Gold</option>
                <option value="item">Item</option>
                <option value="xp">XP</option>
                <option value="healing">Healing</option>
                <option value="quest_progress">Quest Progress</option>
              </select>
            </label>
            <label className="field">
              <span>Target</span>
              <select data-testid="dm-reward-target" value={rewardPlayerId} onChange={(event) => setRewardPlayerId(event.target.value)}>
                <option value="party">Party</option>
                {lobby.players.map((player) => <option key={player.id} value={player.name}>{player.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Amount</span>
              <input data-testid="dm-reward-amount" value={rewardAmount} onChange={(event) => setRewardAmount(event.target.value)} />
            </label>
            <label className="field">
              <span>Item</span>
              <select data-testid="dm-reward-item" value={rewardItemId} onChange={(event) => setRewardItemId(event.target.value)}>
                {["healing_potion", "iron_sword", "leather_armor"].map((itemId) => <option key={itemId} value={itemId}>{itemId}</option>)}
              </select>
            </label>
          </div>
          <button
            type="button"
            data-testid="dm-give-reward"
            onClick={() =>
              onRunTool({
                tool: "giveReward",
                name: rewardType,
                target: rewardPlayerId === "party" ? "party" : "player",
                playerName: rewardPlayerId,
                amount: Number(rewardAmount),
                itemId: rewardItemId,
                questId: latestQuest?.id
              })
            }
          >
            Give Reward
          </button>
          <RewardHistoryPanel rewards={lobby.rewardHistory} />
        </div>
      ) : null}

      {activeTab === "notes" ? (
        <div className="player-list">
          <label className="field">
            <span>Session note</span>
            <textarea data-testid="dm-session-note-input" value={sessionNote} onChange={(event) => setSessionNote(event.target.value)} rows={3} />
          </label>
          <button type="button" data-testid="dm-save-session-note" onClick={() => onRunTool({ tool: "addSessionNote", note: sessionNote })}>Save Session Note</button>
          <section className="panel">
            <div className="section-header">
              <h2>Session Notes</h2>
              <span data-testid="dm-session-notes-count">{lobby.sessionNotes.length} entries</span>
            </div>
            <div className="combat-log" data-testid="dm-session-notes-log">
              {lobby.sessionNotes.length ? lobby.sessionNotes.map((entry) => <p key={entry.id} data-testid={`dm-session-note-entry-${entry.id}`}>{entry.message}</p>) : <p className="meta-copy">No session notes yet.</p>}
            </div>
          </section>
          <LogPanel title="DM Notes" logs={lobby.dmLog} testId="dm-notes-log" countTestId="dm-notes-count" entryPrefix="dm-note-entry-" />
        </div>
      ) : null}

      {activeTab === "world" ? (
        <div className="player-list">
          <section className="panel" data-testid="dm-dashboard-panel">
            <div className="section-header">
              <h2>Living World Dashboard</h2>
              <span data-testid="dm-dashboard-summary">
                {lobby.triggerZones.filter((zone) => zone.active).length} active triggers · {lobby.secrets.filter((secret) => !secret.revealed).length} hidden secrets
              </span>
            </div>
            <div className="player-stats two-column-grid">
              <span data-testid="dm-dashboard-time">Time: {lobby.timeOfDay}</span>
              <span data-testid="dm-dashboard-weather">Weather: {lobby.weather}</span>
              <span data-testid="dm-dashboard-triggered">Triggered: {lobby.triggerZones.filter((zone) => zone.triggered).length}</span>
              <span data-testid="dm-dashboard-encounters">Encounters: {lobby.sessionMaps.reduce((total, map) => total + map.encounterCount, 0)}</span>
            </div>
            <div className="player-stats">
              {lobby.factionReputation.map((entry) => <span key={entry.factionId}>{entry.factionId}: {entry.score}</span>)}
            </div>
          </section>

          <div className="two-column-grid">
            <label className="field">
              <span>Fog name</span>
              <input data-testid="dm-fog-name" value={fogName} onChange={(event) => setFogName(event.target.value)} />
            </label>
            <label className="field">
              <span>Map</span>
              <select data-testid="dm-fog-map" value={selectedMapKey} onChange={(event) => setSelectedMapKey(event.target.value as typeof selectedMapKey)}>
                {lobby.sessionMaps.map((sessionMap) => <option key={sessionMap.key} value={sessionMap.key}>{sessionMap.label}</option>)}
              </select>
            </label>
            <label className="field">
              <span>X</span>
              <input data-testid="dm-fog-x" value={entityX} onChange={(event) => setEntityX(event.target.value)} />
            </label>
            <label className="field">
              <span>Y</span>
              <input data-testid="dm-fog-y" value={entityY} onChange={(event) => setEntityY(event.target.value)} />
            </label>
            <label className="field">
              <span>Width</span>
              <input data-testid="dm-fog-width" value={fogWidth} onChange={(event) => setFogWidth(event.target.value)} />
            </label>
            <label className="field">
              <span>Height</span>
              <input data-testid="dm-fog-height" value={fogHeight} onChange={(event) => setFogHeight(event.target.value)} />
            </label>
          </div>
          <div className="button-row">
            <button type="button" data-testid="dm-reveal-area" onClick={() => onRunTool({ tool: "createFogArea", name: fogName, mapKey: selectedMapKey, x: Number(entityX), y: Number(entityY), width: Number(fogWidth), height: Number(fogHeight) })}>
              Reveal Area
            </button>
            <button type="button" data-testid="dm-hide-latest-area" onClick={() => lobby.fogAreas.at(-1) && onRunTool({ tool: "setFogAreaVisibility", areaId: lobby.fogAreas.at(-1)?.id, visibleToPlayers: false })} disabled={!lobby.fogAreas.length}>
              Hide Area
            </button>
            <button type="button" data-testid="dm-reveal-all" onClick={() => onRunTool({ tool: "revealAllFog", mapKey: selectedMapKey })}>
              Reveal All
            </button>
            <button type="button" data-testid="dm-reset-fog" onClick={() => onRunTool({ tool: "resetFog", mapKey: selectedMapKey })}>
              Reset Fog
            </button>
          </div>

          <div className="two-column-grid">
            <label className="field">
              <span>Event name</span>
              <input data-testid="dm-event-name" value={eventName} onChange={(event) => setEventName(event.target.value)} />
            </label>
            <label className="field">
              <span>Event kind</span>
              <select data-testid="dm-event-kind" value={eventKind} onChange={(event) => setEventKind(event.target.value as DynamicEventKind)}>
                {["ambush", "trap", "discovery", "dialogue_reveal", "quest_update", "map_transition", "reward_event"].map((kind) => <option key={kind} value={kind}>{kind}</option>)}
              </select>
            </label>
          </div>
          <div className="button-row">
            <button type="button" data-testid="dm-create-event" onClick={() => onRunTool({ tool: "createDynamicEvent", eventName, eventKind, note: effectNarration, enemyId: encounterEnemyId, amount: Number(rewardAmount), x: Number(encounterX), y: Number(encounterY), width: Number(triggerWidth), height: Number(triggerHeight), secretId: latestSecret?.id, questId: latestQuest?.id, mapKey: selectedMapKey })}>
              Create Event
            </button>
            <select data-testid="dm-trigger-event" value={triggerEventId} onChange={(event) => setTriggerEventId(event.target.value)}>
              <option value="">Latest event</option>
              {lobby.dynamicEvents.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </div>

          <div className="two-column-grid">
            <label className="field">
              <span>Trigger name</span>
              <input data-testid="dm-trigger-name" value={triggerName} onChange={(event) => setTriggerName(event.target.value)} />
            </label>
            <label className="field">
              <span>Trigger target entity</span>
              <select data-testid="dm-trigger-entity" value={triggerTargetEntityId} onChange={(event) => setTriggerTargetEntityId(event.target.value)}>
                <option value="">Area trigger</option>
                {entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Width</span>
              <input data-testid="dm-trigger-width" value={triggerWidth} onChange={(event) => setTriggerWidth(event.target.value)} />
            </label>
            <label className="field">
              <span>Height</span>
              <input data-testid="dm-trigger-height" value={triggerHeight} onChange={(event) => setTriggerHeight(event.target.value)} />
            </label>
          </div>
          <div className="button-row">
            <button type="button" data-testid="dm-create-trigger-zone" onClick={() => onRunTool({ tool: "createTriggerZone", name: triggerName, triggerType: triggerTargetEntityId ? "interact_object" : "enter_area", entityId: triggerTargetEntityId || undefined, eventId: triggerEventId || lobby.dynamicEvents.at(-1)?.id, mapKey: selectedMapKey, x: Number(encounterX), y: Number(encounterY), width: Number(triggerWidth), height: Number(triggerHeight), onceOnly: true, visibleToPlayers: false })}>
              Create Trigger
            </button>
            <button type="button" data-testid="dm-fire-latest-trigger" onClick={() => lobby.triggerZones.at(-1) && onRunTool({ tool: "fireTrigger", eventId: lobby.triggerZones.at(-1)?.id })} disabled={!lobby.triggerZones.length}>
              Fire Latest Trigger
            </button>
          </div>

          <div className="two-column-grid">
            <label className="field">
              <span>Time</span>
              <select data-testid="dm-time-select" value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value as TimeOfDay)}>
                {["morning", "afternoon", "evening", "night"].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Weather</span>
              <select data-testid="dm-weather-select" value={weather} onChange={(event) => setWeather(event.target.value as WeatherType)}>
                {["clear", "rain", "fog", "storm", "snow"].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Faction</span>
              <select data-testid="dm-faction-select" value={factionId} onChange={(event) => setFactionId(event.target.value as FactionId)}>
                {["town_guard", "bandits", "merchants_guild", "arcane_circle"].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Reputation</span>
              <input data-testid="dm-reputation-amount" value={reputationAmount} onChange={(event) => setReputationAmount(event.target.value)} />
            </label>
          </div>
          <div className="button-row">
            <button type="button" data-testid="dm-set-time" onClick={() => onRunTool({ tool: "setTimeOfDay", timeOfDay })}>Set Time</button>
            <button type="button" data-testid="dm-set-weather" onClick={() => onRunTool({ tool: "setWeather", weather })}>Set Weather</button>
            <button type="button" data-testid="dm-adjust-reputation" onClick={() => onRunTool({ tool: "setReputation", factionId, amount: Number(reputationAmount) })}>Adjust Reputation</button>
          </div>

          <div className="two-column-grid">
            <label className="field">
              <span>Patrol entity</span>
              <select data-testid="dm-patrol-entity" value={patrolEntityId} onChange={(event) => setPatrolEntityId(event.target.value)}>
                <option value="">Choose entity</option>
                {entityOptions.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Waypoints</span>
              <input data-testid="dm-patrol-waypoints" value={patrolWaypoints} onChange={(event) => setPatrolWaypoints(event.target.value)} />
            </label>
          </div>
          <div className="button-row">
            <button type="button" data-testid="dm-create-patrol" onClick={() => onRunTool({ tool: "createPatrolRoute", entityId: patrolEntityId, waypointText: patrolWaypoints, loop: true })}>Create Patrol</button>
            <button type="button" data-testid="dm-advance-patrols" onClick={() => onRunTool({ tool: "advancePatrols" })}>Advance Patrols</button>
          </div>

          <label className="field">
            <span>Journal entry</span>
            <textarea data-testid="dm-journal-entry" value={journalEntry} onChange={(event) => setJournalEntry(event.target.value)} rows={2} />
          </label>
          <button type="button" data-testid="dm-add-journal-entry" onClick={() => onRunTool({ tool: "addJournalEntry", note: journalEntry })}>
            Add Journal Entry
          </button>
        </div>
      ) : null}

      <section className="panel" data-testid="dm-tracker-checks">
        <div className="section-header">
          <h2>Tracked Checks</h2>
          <span data-testid="dm-tracker-check-count">{lobby.skillChecks.length}</span>
        </div>
        <div className="player-list">
          {lobby.skillChecks.length ? (
            lobby.skillChecks.map((check) => (
              <article key={check.id} className="player-card" data-testid={`dm-check-row-${check.id}`}>
                <div>
                  <strong>{check.title}</strong>
                  <p>{capitalizeCheck(check.checkType)} DC {check.dc} · {check.visibility}</p>
                </div>
                <div className="player-stats">
                  <span>Status: {check.status}</span>
                  <span>Targets: {check.targetNames.join(", ")}</span>
                </div>
              </article>
            ))
          ) : (
            <p className="meta-copy">No DM-created checks yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}

function SceneOption({ scene }: { scene: SceneOptionView }) {
  return <option value={scene.id}>{scene.title} ({scene.sceneType})</option>;
}

function formatEntityLabel(type: WorldEntityType) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function capitalizeCheck(value: SkillCheckType) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

export function QuestStatusBadge({ status }: { status: QuestStatus }) {
  return <span>{status}</span>;
}
