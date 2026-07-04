import type * as ColyseusSchema from "@colyseus/schema";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  ArraySchema,
  MapSchema,
  Schema,
  type
} = require("@colyseus/schema") as typeof ColyseusSchema;

export class LogEntryState extends Schema {
  @type("number") id = 0;
  @type("string") message = "";
}

export class PlayerState extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type("string") role = "player";
  @type("string") raceId = "human";
  @type("string") raceName = "Human";
  @type("string") classId = "guardian";
  @type("string") className = "";
  @type("string") characterIdentity = "";
  @type("boolean") confirmedCharacter = false;
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") health = 0;
  @type("number") maxHealth = 0;
  @type("number") movement = 0;
  @type("number") remainingMovement = 0;
  @type("number") might = 0;
  @type("number") agility = 0;
  @type("number") focus = 0;
  @type("number") spirit = 0;
  @type("number") defense = 10;
  @type("number") attackBonus = 0;
  @type("number") attackRange = 1;
  @type("number") spellDamage = 0;
  @type("string") damageDice = "1d6";
  @type("string") abilityId = "";
  @type("string") abilityName = "";
  @type("boolean") alive = true;
  @type("number") gold = 0;
  @type("string") equippedWeapon = "";
  @type("string") equippedArmor = "";
  @type("number") xp = 0;
  @type("number") level = 1;
  @type("boolean") actionUsed = false;
  @type("boolean") adaptableUsed = false;
  @type("boolean") luckyFailureUsed = false;
  @type(["string"]) inventory = new ArraySchema<string>();
}

export class EnemyState extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type("number") hp = 0;
  @type("number") maxHp = 0;
  @type("number") defense = 0;
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") movement = 0;
  @type("number") attackBonus = 0;
  @type("string") damageDice = "1d4";
  @type("boolean") alive = true;
}

export class LobbyState extends Schema {
  @type("string") roomCode = "local-adventure";
  @type("string") dmSessionId = "";
  @type("string") dmName = "";
  @type("string") currentSceneId = "tavern";
  @type("number") gridWidth = 10;
  @type("number") gridHeight = 8;
  @type("string") activeTurnType = "none";
  @type("string") activeTurnId = "";
  @type("number") partyGold = 0;
  @type("number") totalGoldEarned = 0;
  @type("number") enemiesDefeated = 0;
  @type("number") totalTurns = 0;
  @type("string") adventureStartedAt = "";
  @type("string") adventureCompletedAt = "";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: EnemyState }) enemies = new MapSchema<EnemyState>();
  @type(["string"]) turnOrder = new ArraySchema<string>();
  @type(["string"]) completedEncounters = new ArraySchema<string>();
  @type([LogEntryState]) publicLog = new ArraySchema<LogEntryState>();
  @type([LogEntryState]) dmLog = new ArraySchema<LogEntryState>();
}
