import { useRoom } from "../context/RoomContext";
import DeckSettings from "./DeckSettings";

export default function RoundControls({ onToggleSummary }: { onToggleSummary: () => void }) {
  const { state, canControlRound, reveal, reset, nextTask, setDeck, setAutoReveal } = useRoom();

  if (!state || !canControlRound) return null;

  const currentIndex = state.tasks.findIndex((t) => t.id === state.currentTaskId);
  const hasNextTask = currentIndex !== -1 && currentIndex < state.tasks.length - 1;

  return (
    <div className="card stack">
      <h3>Round controls</h3>
      <div className="row wrap">
        <button className="primary" onClick={reveal} disabled={state.revealed}>
          Reveal votes
        </button>
        <button onClick={reset}>Vote again</button>
        <button onClick={nextTask} disabled={!hasNextTask}>
          Next task
        </button>
        <button className="subtle" onClick={onToggleSummary}>
          End session
        </button>
      </div>
      <label className="stack">
        <span className="muted">Deck for this room</span>
        <DeckSettings value={state.deck} onChange={setDeck} />
      </label>
      <label className="checkbox-row">
        <input type="checkbox" checked={state.autoRevealEnabled} onChange={(e) => setAutoReveal(e.target.checked)} />
        <span>Auto-reveal 2s after everyone has voted</span>
      </label>
    </div>
  );
}
