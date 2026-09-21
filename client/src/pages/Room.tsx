import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
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
  const { state, isHost } = useRoom();
  const shareUrl = `${window.location.origin}/room/${state?.roomId ?? ""}`;
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="shell">
      <div className="brand">
        Planning<span>Poker</span>
      </div>
      <ConnectionStatusBanner />
      {!state ? (
        <p className="muted">Connecting to room…</p>
      ) : (
        <>
          {isHost && (
            <div className="card stack">
              <h3>Invite others</h3>
              <QRCodeDisplay url={shareUrl} />
            </div>
          )}
          <TaskPanel />
          <VotingDeck />
          <RoundControls onToggleSummary={() => setShowSummary((s) => !s)} />
          <ResultsPanel />
          <ParticipantList />
          {showSummary && <SessionSummary onClose={() => setShowSummary(false)} />}
        </>
      )}
    </div>
  );
}
