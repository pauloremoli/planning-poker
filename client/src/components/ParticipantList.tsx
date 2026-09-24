import type { Participant } from "@planning-poker/shared";
import { useRoom } from "../context/RoomContext";
import ParticipantRow from "./ParticipantRow";

interface StatusGroup {
  key: string;
  label: string;
  items: Participant[];
}

export default function ParticipantList() {
  const { state } = useRoom();
  if (!state) return null;

  const byJoinIndex = (a: Participant, b: Participant) => a.joinIndex - b.joinIndex;
  const active = state.participants.filter((p) => !p.isSpectator);
  const groups: StatusGroup[] = [
    { key: "waiting", label: "Waiting", items: active.filter((p) => p.vote === null).sort(byJoinIndex) },
    { key: "voted", label: "Voted", items: active.filter((p) => p.vote !== null).sort(byJoinIndex) },
    { key: "spectators", label: "Spectators", items: state.participants.filter((p) => p.isSpectator).sort(byJoinIndex) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="card stack">
      <h3>Participants ({state.participants.length})</h3>
      <div className="participant-columns">
        {groups.map((group) => (
          <div key={group.key} className="participant-column">
            <span className="participant-column-label muted">
              {group.label} ({group.items.length})
            </span>
            <ul className="participant-list">
              {group.items.map((p) => (
                <ParticipantRow key={p.peerId} participant={p} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
