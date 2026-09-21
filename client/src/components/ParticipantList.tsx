import { useRoom } from "../context/RoomContext";
import ParticipantRow from "./ParticipantRow";

export default function ParticipantList() {
  const { state } = useRoom();
  if (!state) return null;

  // Still-waiting participants first (most actionable — who to wait for),
  // then everyone who's voted, then anyone marked away at the bottom;
  // stable within each group by join order.
  const statusRank = (p: (typeof state.participants)[number]) => (p.away ? 2 : p.vote !== null ? 1 : 0);
  const sorted = [...state.participants].sort((a, b) => statusRank(a) - statusRank(b) || a.joinIndex - b.joinIndex);

  return (
    <div className="card stack">
      <h3>Participants ({sorted.length})</h3>
      <ul className="participant-list">
        {sorted.map((p) => (
          <ParticipantRow key={p.peerId} participant={p} />
        ))}
      </ul>
    </div>
  );
}
