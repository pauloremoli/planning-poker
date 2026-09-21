import { useState } from "react";
import type { Participant } from "@planning-poker/shared";
import { useRoom } from "../context/RoomContext";

export default function ParticipantRow({ participant }: { participant: Participant }) {
  const { state, myPeerId, isHost, grantAdmin, revokeAdmin, transferHost } = useRoom();
  const [menuOpen, setMenuOpen] = useState(false);

  const isMe = participant.peerId === myPeerId;
  const canManage = isHost && !isMe;
  const voted = participant.vote !== null;
  const statusClass = participant.away ? "away" : state?.revealed ? "revealed" : voted ? "voted" : "pending";
  const statusText = participant.away ? "Away" : state?.revealed ? (participant.vote ?? "—") : voted ? "Voted" : "Waiting";

  return (
    <li className={`participant-row${participant.away ? " away" : ""}`}>
      <span className="participant-name">
        {participant.name}
        {isMe && <span className="muted">(you)</span>}
        {participant.role === "host" && <span className="badge host">Host</span>}
        {participant.role === "admin" && <span className="badge admin">Admin</span>}
        {participant.away && <span className="badge">Away</span>}
      </span>

      <div className="row">
        <span className={`vote-status ${statusClass}`}>
          <span className="vote-dot" />
          {statusText}
        </span>

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
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
