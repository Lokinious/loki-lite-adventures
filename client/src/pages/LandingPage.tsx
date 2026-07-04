import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomConnection } from "../game/RoomConnectionContext";
import type { JoinMode, JoinRole } from "../game/types";

const defaultRoomCode = "local-adventure";
const defaultPlayerName = `Guest-${Math.random().toString(36).slice(2, 6)}`;

export function LandingPage() {
  const navigate = useNavigate();
  const { connect, status, isConnected, roomCode: connectedRoomCode } = useRoomConnection();
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [role, setRole] = useState<JoinRole>("player");
  const [isBusy, setIsBusy] = useState(false);

  async function handleConnect(mode: JoinMode) {
    setIsBusy(true);

    try {
      const normalizedRoomCode = await connect({
        mode,
        roomCode,
        playerName,
        role
      });

      navigate(`/room/${normalizedRoomCode}`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="landing-shell">
      <section className="landing-card">
        <span className="eyebrow">Loki Lite Adventures</span>
        <h1>Join the table</h1>
        <p>
          Choose a room, pick whether you are joining as a player or the Dungeon Master,
          and launch the local multiplayer adventure.
        </p>

        <div className="status-card" data-testid="status-card">
          <span className="status-label">Status</span>
          <strong data-testid="status-message">{status}</strong>
        </div>

        <label className="field">
          <span>Name</span>
          <input
            data-testid="player-name-input"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={20}
          />
        </label>

        <label className="field">
          <span>Room code</span>
          <input
            data-testid="room-code-input"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value)}
            maxLength={24}
          />
        </label>

        <fieldset className="role-picker" data-testid="role-picker">
          <legend>Join role</legend>
          <label className="role-option">
            <input
              data-testid="join-role-player"
              type="radio"
              name="join-role"
              checked={role === "player"}
              onChange={() => setRole("player")}
            />
            <span>Join as Player</span>
          </label>
          <label className="role-option">
            <input
              data-testid="join-role-dm"
              type="radio"
              name="join-role"
              checked={role === "dm"}
              onChange={() => setRole("dm")}
            />
            <span>Join as Dungeon Master</span>
          </label>
        </fieldset>

        <div className="button-row">
          <button
            type="button"
            data-testid="create-room-button"
            onClick={() => void handleConnect("create")}
            disabled={isBusy}
          >
            Create room
          </button>
          <button
            type="button"
            data-testid="join-room-button"
            onClick={() => void handleConnect("join")}
            disabled={isBusy}
          >
            Join room
          </button>
        </div>

        {isConnected ? (
          <button
            type="button"
            className="secondary-button"
            data-testid="resume-room-button"
            onClick={() => navigate(`/room/${connectedRoomCode}`)}
          >
            Resume current room
          </button>
        ) : null}
      </section>
    </main>
  );
}
