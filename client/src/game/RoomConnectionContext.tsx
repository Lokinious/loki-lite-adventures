import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Client, Room } from "colyseus.js";
import type { JoinMode, JoinRole, LobbyView } from "./types";

type ConnectOptions = {
  mode: JoinMode;
  roomCode: string;
  playerName: string;
  role: JoinRole;
};

type DmActionMessage = {
  actionId:
    | "startAdventure"
    | "advanceScene"
    | "previousScene"
    | "restartScene"
    | "setScene"
    | "spawnGoblin"
    | "spawnGoblinChief"
    | "awardPartyGold"
    | "addPublicLogMessage";
  sceneId?: string;
  amount?: number;
  message?: string;
};

type RoomConnectionContextValue = {
  status: string;
  lobby: LobbyView | null;
  sessionId: string;
  role: JoinRole;
  roomCode: string;
  playerName: string;
  isConnected: boolean;
  connect(options: ConnectOptions): Promise<string>;
  leave(): Promise<void>;
  requestState(): void;
  selectRace(raceId: string): void;
  selectClass(classId: string): void;
  confirmCharacter(): void;
  move(x: number, y: number): void;
  attack(targetId: string): void;
  useAbility(abilityId: string, targetId: string): void;
  endTurn(): void;
  purchase(itemId: string): void;
  equipItem(itemId: string): void;
  useItem(itemId: string): void;
  sceneAction(actionId: string): void;
  runDmAction(message: DmActionMessage): void;
  runDmCommand(command: string): void;
  setStatus(message: string): void;
};

const RoomConnectionContext = createContext<RoomConnectionContextValue | null>(null);

function getServerUrl() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.hostname}:2567`;
}

function normalizeRoomCode(roomCode: string) {
  const normalized = roomCode.trim().toLowerCase();

  if (!normalized) {
    return "local-adventure";
  }

  return normalized.replace(/[^a-z0-9-_]/g, "").slice(0, 24) || "local-adventure";
}

export function RoomConnectionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState("Connect to the local server to begin.");
  const [lobby, setLobby] = useState<LobbyView | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [role, setRole] = useState<JoinRole>("player");
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    return () => {
      void roomRef.current?.leave();
      roomRef.current = null;
    };
  }, []);

  async function leave() {
    const activeRoom = roomRef.current;

    roomRef.current = null;
    setLobby(null);
    setSessionId("");
    setRoomCode("");
    setPlayerName("");

    if (activeRoom) {
      await activeRoom.leave();
    }
  }

  async function connect(options: ConnectOptions) {
    const normalizedRoomCode = normalizeRoomCode(options.roomCode);
    const client = new Client(getServerUrl());

    if (roomRef.current) {
      await roomRef.current.leave();
      roomRef.current = null;
    }

    try {
      const room =
        options.mode === "create"
          ? await client.create("lobby", {
              roomCode: normalizedRoomCode,
              playerName: options.playerName,
              role: options.role
            })
          : await client.join("lobby", {
              roomCode: normalizedRoomCode,
              playerName: options.playerName,
              role: options.role
            });

      roomRef.current = room;
      setSessionId(room.sessionId);
      setRole(options.role);
      setRoomCode(normalizedRoomCode);
      setPlayerName(options.playerName);
      setStatus(`${options.mode === "create" ? "Created" : "Joined"} room ${normalizedRoomCode}.`);

      room.onMessage("roomState", (snapshot: LobbyView) => {
        setLobby(snapshot);
        setRole(snapshot.selfRole);
      });

      room.onMessage("actionRejected", (message: { message: string }) => {
        setStatus(message.message);
      });

      room.onLeave(() => {
        roomRef.current = null;
        setLobby(null);
        setSessionId("");
        setRoomCode("");
        setPlayerName("");
        setStatus("Disconnected from the room.");
      });

      room.send("requestState");
      return normalizedRoomCode;
    } catch (error) {
      roomRef.current = null;
      setLobby(null);
      setSessionId("");
      setRoomCode("");
      setPlayerName("");
      setStatus(error instanceof Error ? error.message : "Unable to connect to the room.");
      throw error;
    }
  }

  function requestState() {
    roomRef.current?.send("requestState");
  }

  function selectRace(raceId: string) {
    roomRef.current?.send("selectRace", { raceId });
  }

  function selectClass(classId: string) {
    roomRef.current?.send("selectCharacter", { classId });
  }

  function confirmCharacter() {
    roomRef.current?.send("confirmCharacter");
  }

  function move(x: number, y: number) {
    roomRef.current?.send("requestMove", { x, y });
  }

  function attack(targetId: string) {
    roomRef.current?.send("requestAttack", { targetId });
  }

  function useAbility(abilityId: string, targetId: string) {
    roomRef.current?.send("requestUseAbility", { abilityId, targetId });
  }

  function endTurn() {
    roomRef.current?.send("endTurn");
  }

  function purchase(itemId: string) {
    roomRef.current?.send("requestPurchase", { itemId });
  }

  function equipItem(itemId: string) {
    roomRef.current?.send("requestEquipItem", { itemId });
  }

  function useItem(itemId: string) {
    roomRef.current?.send("requestUseItem", { itemId });
  }

  function sceneAction(actionId: string) {
    roomRef.current?.send("requestSceneAction", { actionId });
  }

  function runDmAction(message: DmActionMessage) {
    roomRef.current?.send("requestDmAction", message);
  }

  function runDmCommand(command: string) {
    roomRef.current?.send("requestDmCommand", { command });
  }

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    const debugWindow = window as Window & {
      __lokiDebug?: {
        selectRace(raceId: string): void;
        selectClass(classId: string): void;
        confirmCharacter(): void;
        move(x: number, y: number): void;
        attack(targetId: string): void;
        useAbility(abilityId: string, targetId: string): void;
        endTurn(): void;
        purchase(itemId: string): void;
        equipItem(itemId: string): void;
        useItem(itemId: string): void;
        sceneAction(actionId: string): void;
        runDmCommand(command: string): void;
      };
    };

    debugWindow.__lokiDebug = {
      selectRace,
      selectClass,
      confirmCharacter,
      move,
      attack,
      useAbility,
      endTurn,
      purchase,
      equipItem,
      useItem,
      sceneAction,
      runDmCommand
    };

    return () => {
      delete debugWindow.__lokiDebug;
    };
  }, [attack, confirmCharacter, endTurn, equipItem, move, purchase, runDmCommand, sceneAction, selectClass, selectRace, useAbility, useItem]);

  const value = useMemo<RoomConnectionContextValue>(
    () => ({
      status,
      lobby,
      sessionId,
      role,
      roomCode,
      playerName,
      isConnected: roomRef.current !== null,
      connect,
      leave,
      requestState,
      selectRace,
      selectClass,
      confirmCharacter,
      move,
      attack,
      useAbility,
      endTurn,
      purchase,
      equipItem,
      useItem,
      sceneAction,
      runDmAction,
      runDmCommand,
      setStatus
    }),
    [lobby, playerName, role, roomCode, sessionId, status]
  );

  return <RoomConnectionContext.Provider value={value}>{children}</RoomConnectionContext.Provider>;
}

export function useRoomConnection() {
  const context = useContext(RoomConnectionContext);

  if (!context) {
    throw new Error("useRoomConnection must be used within a RoomConnectionProvider.");
  }

  return context;
}
