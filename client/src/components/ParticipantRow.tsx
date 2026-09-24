import { useState } from "react";
import type { Participant } from "@planning-poker/shared";
import { useRoom } from "../context/RoomContext";

export default function ParticipantRow({ participant }: { participant: Participant }) {
  const { state, myPeerId, isHost, grantAdmin, revokeAdmin, transferHost, kickParticipant } = useRoom();
  const [menuOpen, setMenuOpen] = useState(false);

  const isMe = participant.peerId === myPeerId;
  const canManage = isHost && !isMe;
  const voted = participant.vote !== null;
  const statusClass = !participant.connected ? "spectator" : participant.isSpectator ? "spectator" : state?.revealed ? "revealed" : voted ? "voted" : "pending";
  const title = !participant.connected ? "Reconnecting…" : participant.isSpectator ? "Spectator" : undefined;

  return (
    <li className={`participant-chip${participant.isSpectator || !participant.connected ? " spectator" : ""}`}>
      <span className={`participant-chip-dot ${statusClass}`} title={title} />
      <span className="participant-chip-name">
        {participant.name}
        {isMe && <span className="muted"> (you)</span>}
      </span>
      {participant.role === "host" && <span className="badge host">Host</span>}
      {participant.role === "admin" && <span className="badge admin">Admin</span>}

      {canManage && (
        <div className="dropdown-menu">
          <button className="icon-button" onClick={() => setMenuOpen((o) => !o)} aria-label="Manage participant">
            ⋯
          </button>
          {menuOpen && (
            <div className="dropdown-menu-panel">
              {participant.role === "admin" ? (
                <button
                  onClick={() => {
                    revokeAdmin(participant.peerId);
                    setMenuOpen(false);
                  }}
                >
                  Remove admin
                </button>
              ) : (
                <button
                  onClick={() => {
                    grantAdmin(participant.peerId);
                    setMenuOpen(false);
                  }}
                >
                  Make admin
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(`Make ${participant.name} the room owner? You'll become an admin.`)) {
                    transferHost(participant.peerId);
                  }
                  setMenuOpen(false);
                }}
              >
                Transfer ownership
              </button>
              <button
                className="danger"
                onClick={() => {
                  if (confirm(`Remove ${participant.name} from the room?`)) {
                    kickParticipant(participant.peerId);
                  }
                  setMenuOpen(false);
                }}
              >
                Remove from room
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
