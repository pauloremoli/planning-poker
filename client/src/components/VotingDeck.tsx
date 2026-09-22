import { useRoom } from "../context/RoomContext";
import VotingCard from "./VotingCard";

export default function VotingDeck() {
  const { state, myPeerId, isSpectator, castVote, setSpectator } = useRoom();
  if (!state) return null;

  const myVote = state.participants.find((p) => p.peerId === myPeerId)?.vote ?? null;

  return (
    <div className="card stack">
      <div className="row between">
        <h3>Pick a card</h3>
        <button onClick={() => setSpectator(!isSpectator)}>
          {isSpectator ? "Join voting" : "Spectator"}
        </button>
      </div>
      {isSpectator ? (
        <p className="muted">You're spectating and won't be counted for this round. Click "Join voting" to vote.</p>
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
