import { useMemo } from "react";
import { useRoom } from "../context/RoomContext";
import { parseVoteValue } from "../utils/deck";

export default function ResultsPanel() {
  const { state } = useRoom();

  const summary = useMemo(() => {
    if (!state?.revealed) return null;
    const votes = state.participants.map((p) => p.vote).filter((v): v is string => v !== null);
    const numeric = votes.map(parseVoteValue).filter((n): n is number => n !== null);
    const average = numeric.length > 0 ? numeric.reduce((a, b) => a + b, 0) / numeric.length : null;

    const counts = new Map<string, number>();
    for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
    const maxCount = Math.max(1, ...counts.values());

    return { average, votes, distribution: [...counts.entries()].sort((a, b) => b[1] - a[1]), maxCount };
  }, [state]);

  if (!summary) return null;

  return (
    <div className="card stack">
      <div className="row between">
        <h3>Results</h3>
        {summary.average !== null && <span className="muted">Average: {summary.average.toFixed(1)}</span>}
      </div>
      {summary.votes.length === 0 ? (
        <p className="muted">Nobody voted this round.</p>
      ) : (
        <div className="stack">
          {summary.distribution.map(([value, count]) => (
            <div key={value} className="row">
              <span style={{ width: 28 }}>{value}</span>
              <div className="results-bar-track" style={{ flex: 1 }}>
                <div className="results-bar-fill" style={{ width: `${(count / summary.maxCount) * 100}%` }} />
              </div>
              <span className="muted" style={{ width: 24, textAlign: "right" }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
