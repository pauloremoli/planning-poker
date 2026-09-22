import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { DeckConfig } from "@planning-poker/shared";
import { DEFAULT_DECK } from "@planning-poker/shared";
import { RoomProvider, useRoom } from "../context/RoomContext";
import { useDisplayName } from "../hooks/useDisplayName";
import NamePrompt from "../components/NamePrompt";
import ConnectionStatusBanner from "../components/ConnectionStatusBanner";
import QRCodeDisplay from "../components/QRCodeDisplay";
import VotingDeck from "../components/VotingDeck";
import ParticipantList from "../components/ParticipantList";
import ResultsPanel from "../components/ResultsPanel";
import RoundControls from "../components/RoundControls";
import TaskPanel from "../components/TaskPanel";
import SessionSummary from "../components/SessionSummary";
import BrandHeader from "../components/BrandHeader";

interface NavState {
  mode?: "create" | "join";
  deck?: DeckConfig;
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navState = (location.state as NavState | null) ?? {};
  const mode: "create" | "join" = navState.mode === "create" ? "create" : "join";
  const [storedName, setStoredName] = useDisplayName();
  // Only the "join" path needs an explicit confirm click (even if a stored
  // name pre-fills the prompt); "create" reuses the name already collected
  // on Home the moment it's available.
  const [confirmedJoinName, setConfirmedJoinName] = useState<string | null>(null);

  if (!roomId) return null;

  const name = mode === "create" ? storedName : confirmedJoinName;

  if (!name) {
    return (
      <div className="shell">
        <NamePrompt
          initialName={storedName}
          onSubmit={(n) => {
            setStoredName(n);
            setConfirmedJoinName(n);
          }}
        />
      </div>
    );
  }

  return (
    <RoomProvider mode={mode} roomId={roomId} name={name} createDeck={navState.deck ?? DEFAULT_DECK}>
      <RoomScreen />
    </RoomProvider>
  );
}

function RoomScreen() {
  const { state, status, isHost, canControlRound } = useRoom();
  const shareUrl = `${window.location.origin}/room/${state?.roomId ?? ""}`;
  const [showSummary, setShowSummary] = useState(false);

  if (status === "kicked") {
    return (
      <div className="shell">
        <BrandHeader />
        <div className="card stack">
          <h3>You were removed from this room</h3>
          <p className="muted">The host removed you from this session. You can head back home to create or join a different room.</p>
          <Link to="/">
            <button className="primary">Back to home</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <BrandHeader />
      <ConnectionStatusBanner />
      {!state ? (
        <p className="muted">Connecting to room…</p>
      ) : (
        <>
          {/* Everyone: what's being voted on, voting, and the results. */}
          <TaskPanel />
          <VotingDeck />
          <ResultsPanel />

          {/* Host/admin only: round, task, and deck management — visually
              set apart from the voting flow above with an accent border. */}
          {canControlRound && (
            <div className="admin-zone">
              <span className="admin-zone-label">Host controls</span>
              {isHost && (
                <div className="card stack">
                  <h3>Invite others</h3>
                  <QRCodeDisplay url={shareUrl} />
                </div>
              )}
              <RoundControls onToggleSummary={() => setShowSummary((s) => !s)} />
            </div>
          )}

          <ParticipantList />
          {showSummary && <SessionSummary onClose={() => setShowSummary(false)} />}
        </>
      )}
    </div>
  );
}
