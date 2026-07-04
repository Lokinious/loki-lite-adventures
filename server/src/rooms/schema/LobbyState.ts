import type * as ColyseusSchema from "@colyseus/schema";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  ArraySchema,
  MapSchema,
  Schema,
  type
} = require("@colyseus/schema") as typeof ColyseusSchema;

export class CombatLogEntry extends Schema {
  @type("number") id = 0;
  @type("string") message = "";
}

export class PlayerState extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type("string") classId = "guardian";
  @type("string") className = "";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") health = 0;
  @type("number") maxHealth = 0;
  @type("number") movement = 0;
  @type("number") remainingMovement = 0;
  @type("number") defense = 10;
  @type("number") attackBonus = 0;
  @type("string") damageDice = "1d6";
  @type("boolean") alive = true;
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
  @type("number") gridWidth = 10;
  @type("number") gridHeight = 8;
  @type("string") activeTurnType = "none";
  @type("string") activeTurnId = "";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: EnemyState }) enemies = new MapSchema<EnemyState>();
  @type(["string"]) turnOrder = new ArraySchema<string>();
  @type([CombatLogEntry]) combatLog = new ArraySchema<CombatLogEntry>();
}
