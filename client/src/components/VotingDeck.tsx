import { useRoom } from "../context/RoomContext";
import VotingCard from "./VotingCard";

export default function VotingDeck() {
  const { state, myPeerId, isAway, castVote, setAway } = useRoom();
  if (!state) return null;

  const myVote = state.participants.find((p) => p.peerId === myPeerId)?.vote ?? null;

  return (
    <div className="card stack">
      <div className="row between">
        <h3>Pick a card</h3>
        <button className="subtle" onClick={() => setAway(!isAway)}>
          {isAway ? "I'm back" : "Mark myself away"}
        </button>
      </div>
      {isAway ? (
        <p className="muted">You're marked as away and won't be counted for this round. Click "I'm back" to rejoin voting.</p>
      ) : (
        <div className="deck">
          {state.deck.values.map((value) => (
            <VotingCard
              key={value}
              value={value}
              selected={myVote === value}
              disabled={state.revealed}
              onSelect={() => castVote(myVote === value ? null : value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
