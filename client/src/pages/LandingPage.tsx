import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomConnection } from "../game/RoomConnectionContext";
import type { JoinMode, JoinRole } from "../game/types";
import {
  campaignValidationPackIds,
  createTemplateCampaignPackage,
  getCampaignTemplates,
  getOfficialCampaigns,
  getStoredCampaigns,
  saveImportedCampaign,
  validateCampaignPackage,
  type CampaignCategory,
  type CampaignLibraryEntry,
  type CampaignSelectionMode
} from "../services/campaignLibrary";

const defaultRoomCode = "local-adventure";
const defaultPlayerName = `Guest-${Math.random().toString(36).slice(2, 6)}`;

function matchesFilter(entry: CampaignLibraryEntry, filters: { difficulty: string; theme: string; players: string; author: string; tag: string }) {
  const { metadata } = entry;
  const authorNeedle = filters.author.trim().toLowerCase();
  const tagNeedle = filters.tag.trim().toLowerCase();

  if (filters.difficulty !== "all" && metadata.difficulty.toLowerCase() !== filters.difficulty.toLowerCase()) {
    return false;
  }

  if (filters.theme !== "all" && metadata.theme.toLowerCase() !== filters.theme.toLowerCase()) {
    return false;
  }

  if (filters.players !== "all" && metadata.recommendedPlayers !== filters.players) {
    return false;
  }

  if (authorNeedle && !metadata.author.toLowerCase().includes(authorNeedle)) {
    return false;
  }

  if (tagNeedle && !metadata.tags.some((tag) => tag.toLowerCase().includes(tagNeedle))) {
    return false;
  }

  return true;
}

export function LandingPage() {
  const navigate = useNavigate();
  const { connect, status, isConnected, roomCode: connectedRoomCode } = useRoomConnection();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [roomCode, setRoomCode] = useState(defaultRoomCode);
  const [role, setRole] = useState<JoinRole>("player");
  const [campaignMode, setCampaignMode] = useState<CampaignSelectionMode>("prebuilt");
  const [selectedCampaignId, setSelectedCampaignId] = useState("journey_of_the_faithful");
  const [selectedTemplateId, setSelectedTemplateId] = useState("one_shot");
  const [importStatus, setImportStatus] = useState("");
  const [filters, setFilters] = useState({
    difficulty: "all",
    theme: "all",
    players: "all",
    author: "",
    tag: ""
  });
  const [storedCampaigns, setStoredCampaigns] = useState(() => getStoredCampaigns());
  const [isBusy, setIsBusy] = useState(false);

  const officialCampaigns = useMemo(() => getOfficialCampaigns(), []);
  const campaignTemplates = useMemo(() => getCampaignTemplates(), []);
  const filteredOfficialCampaigns = useMemo(
    () => officialCampaigns.filter((entry) => matchesFilter(entry, filters)),
    [filters, officialCampaigns]
  );
  const filteredCommunityCampaigns = useMemo(
    () => storedCampaigns.filter((entry) => entry.category === "community" && matchesFilter(entry, filters)),
    [filters, storedCampaigns]
  );
  const filteredMyCampaigns = useMemo(
    () => storedCampaigns.filter((entry) => entry.category === "my" && matchesFilter(entry, filters)),
    [filters, storedCampaigns]
  );

  const selectedCampaign =
    officialCampaigns.find((entry) => entry.metadata.id === selectedCampaignId) ??
    storedCampaigns.find((entry) => entry.metadata.id === selectedCampaignId) ??
    null;
  const selectedCampaignMatchesMode =
    campaignMode === "new" ||
    (campaignMode === "custom" ? selectedCampaign?.category === "my" : selectedCampaign !== null);

  async function handleConnect(mode: JoinMode) {
    setIsBusy(true);

    try {
      const connectOptions = {
        mode,
        roomCode,
        playerName,
        role
      } as const;
      const campaignPayload =
        role === "dm" && mode === "create"
          ? campaignMode === "new"
            ? createTemplateCampaignPackage(selectedTemplateId, playerName)
            : selectedCampaign?.packageData
          : undefined;
      const normalizedRoomCode = await connect({
        ...connectOptions,
        ...(role === "dm" && mode === "create" ? { campaignMode } : {}),
        ...(campaignPayload ? { campaignPayload } : {})
      });

      navigate(`/room/${normalizedRoomCode}`);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleImportCampaign(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const result = validateCampaignPackage(parsed, campaignValidationPackIds);

      if (!result.valid || !result.normalized) {
        setImportStatus(result.error ?? "Campaign file is invalid.");
        return;
      }

      saveImportedCampaign(result.normalized, "community");
      const nextStoredCampaigns = getStoredCampaigns();
      setStoredCampaigns(nextStoredCampaigns);
      setSelectedCampaignId(result.normalized.metadata.id);
      setCampaignMode("prebuilt");
      setImportStatus(`Imported ${result.normalized.metadata.name}.`);
    } catch {
      setImportStatus("Campaign file could not be imported.");
    } finally {
      event.target.value = "";
    }
  }

  function renderCampaignCard(entry: CampaignLibraryEntry, category: CampaignCategory) {
    const isSelected = selectedCampaignId === entry.metadata.id;

    return (
      <button
        key={entry.metadata.id}
        type="button"
        className={`campaign-card${isSelected ? " campaign-card--selected" : ""}`}
        data-testid={`campaign-card-${entry.metadata.id}`}
        onClick={() => {
          setSelectedCampaignId(entry.metadata.id);
          setCampaignMode(category === "my" ? "custom" : "prebuilt");
        }}
      >
        <strong>{entry.metadata.name}</strong>
        <span>Author: {entry.metadata.author}</span>
        <span>Difficulty: {entry.metadata.difficulty}</span>
        <span>Level: {entry.metadata.levelRange}</span>
        <span>Theme: {entry.metadata.theme}</span>
        <span>Players: {entry.metadata.recommendedPlayers}</span>
        <span>Length: {entry.metadata.estimatedLength}</span>
      </button>
    );
  }

  const dmCreateDisabled = role === "dm" && !selectedCampaignMatchesMode;

  return (
    <main className="landing-shell">
      <section className="landing-card landing-card--wide">
        <span className="eyebrow">Loki Lite Adventures</span>
        <h1>Create Campaign Session</h1>
        <p>
          Choose a room, select a campaign, and launch a local tabletop session with official packs,
          saved custom campaigns, or imported community files.
        </p>

        <div className="status-card" data-testid="status-card">
          <span className="status-label">Status</span>
          <strong data-testid="status-message">{status}</strong>
          {importStatus ? <span className="status-note" data-testid="campaign-import-status">{importStatus}</span> : null}
        </div>

        <div className="landing-grid">
          <div className="landing-form-column">
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

            {role === "dm" ? (
              <section className="campaign-selector" data-testid="campaign-selector">
                <div className="section-header">
                  <h2>Campaign Session</h2>
                  <span data-testid="campaign-selection-summary">
                    {campaignMode === "new" ? selectedTemplateId : selectedCampaign?.metadata.name ?? "Select a campaign"}
                  </span>
                </div>

                <fieldset className="role-picker" data-testid="campaign-mode-picker">
                  <legend>Campaign type</legend>
                  <label className="role-option">
                    <input
                      data-testid="campaign-mode-new"
                      type="radio"
                      name="campaign-mode"
                      checked={campaignMode === "new"}
                      onChange={() => setCampaignMode("new")}
                    />
                    <span>New Campaign</span>
                  </label>
                  <label className="role-option">
                    <input
                      data-testid="campaign-mode-custom"
                      type="radio"
                      name="campaign-mode"
                      checked={campaignMode === "custom"}
                      onChange={() => setCampaignMode("custom")}
                    />
                    <span>Custom Campaign</span>
                  </label>
                  <label className="role-option">
                    <input
                      data-testid="campaign-mode-prebuilt"
                      type="radio"
                      name="campaign-mode"
                      checked={campaignMode === "prebuilt"}
                      onChange={() => setCampaignMode("prebuilt")}
                    />
                    <span>Prebuilt Campaign</span>
                  </label>
                </fieldset>

                {campaignMode === "new" ? (
                  <div className="campaign-card-grid" data-testid="campaign-template-grid">
                    {campaignTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={`campaign-card${selectedTemplateId === template.id ? " campaign-card--selected" : ""}`}
                        data-testid={`campaign-template-${template.id}`}
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        <strong>{template.name}</strong>
                        <span>{template.description}</span>
                        <span>{template.recommendedMaps} maps · {template.recommendedQuests} quests</span>
                        <span>Players: {template.recommendedPlayerCount}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="button-row">
                  <button type="button" className="secondary-button" data-testid="campaign-import-button" onClick={() => fileInputRef.current?.click()}>
                    Import Campaign File
                  </button>
                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept=".json,.loki-campaign.json,application/json"
                    data-testid="campaign-import-input"
                    onChange={(event) => void handleImportCampaign(event)}
                  />
                </div>
              </section>
            ) : null}

            <div className="button-row">
              <button
                type="button"
                data-testid="create-room-button"
                onClick={() => void handleConnect("create")}
                disabled={isBusy || dmCreateDisabled}
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
          </div>

          {role === "dm" ? (
            <div className="campaign-browser-column" data-testid="campaign-browser">
              <div className="section-header">
                <h2>Campaign Browser</h2>
                <span>Official · Community · My Campaigns</span>
              </div>

              <div className="campaign-filter-grid">
                <label className="field">
                  <span>Difficulty</span>
                  <select data-testid="campaign-filter-difficulty" value={filters.difficulty} onChange={(event) => setFilters((current) => ({ ...current, difficulty: event.target.value }))}>
                    <option value="all">All</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
                <label className="field">
                  <span>Theme</span>
                  <select data-testid="campaign-filter-theme" value={filters.theme} onChange={(event) => setFilters((current) => ({ ...current, theme: event.target.value }))}>
                    <option value="all">All</option>
                    <option value="Bandit">Bandit</option>
                    <option value="Goblin">Goblin</option>
                    <option value="Undead">Undead</option>
                    <option value="Vampire">Vampire</option>
                    <option value="Mystery">Mystery</option>
                  </select>
                </label>
                <label className="field">
                  <span>Player Count</span>
                  <select data-testid="campaign-filter-players" value={filters.players} onChange={(event) => setFilters((current) => ({ ...current, players: event.target.value }))}>
                    <option value="all">All</option>
                    <option value="2-5">2-5</option>
                    <option value="2-6">2-6</option>
                    <option value="3-6">3-6</option>
                  </select>
                </label>
                <label className="field">
                  <span>Author</span>
                  <input data-testid="campaign-filter-author" value={filters.author} onChange={(event) => setFilters((current) => ({ ...current, author: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Tags</span>
                  <input data-testid="campaign-filter-tag" value={filters.tag} onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))} />
                </label>
              </div>

              <section className="campaign-browser-section" data-testid="official-campaigns-section">
                <h3>Official Campaigns</h3>
                <div className="campaign-card-grid">
                  {filteredOfficialCampaigns.map((entry) => renderCampaignCard(entry, "official"))}
                </div>
              </section>

              <section className="campaign-browser-section" data-testid="community-campaigns-section">
                <h3>Community Campaigns</h3>
                <div className="campaign-card-grid">
                  {filteredCommunityCampaigns.length ? filteredCommunityCampaigns.map((entry) => renderCampaignCard(entry, "community")) : <p className="meta-copy">Import a campaign file to add it here.</p>}
                </div>
              </section>

              <section className="campaign-browser-section" data-testid="my-campaigns-section">
                <h3>My Campaigns</h3>
                <div className="campaign-card-grid">
                  {filteredMyCampaigns.length ? filteredMyCampaigns.map((entry) => renderCampaignCard(entry, "my")) : <p className="meta-copy">Saved custom campaigns appear here.</p>}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
