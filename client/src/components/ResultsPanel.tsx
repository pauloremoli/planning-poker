import { useMemo } from "react";
import { useRoom } from "../context/RoomContext";
import { buildResultsSummary, type ResultsTag } from "./resultsSummary";

const TAG_LABEL: Record<ResultsTag, string> = {
  lowest: "Lowest",
  highest: "Highest",
  majority: "Majority",
};

export default function ResultsPanel() {
  const { state } = useRoom();

  const summary = useMemo(() => {
    if (!state?.revealed) return null;
    return buildResultsSummary(state.participants, state.deck.values);
  }, [state]);

  if (!summary) return null;

  return (
    <div className="card results-panel">
      <h3>Results</h3>
      {summary.totalVotes === 0 ? (
        <p className="muted">Nobody voted this round.</p>
      ) : (
        <>
          {summary.average !== null && (
            <div className="results-average">
              <span className="results-average-value">{summary.average.toFixed(1)}</span>
              <span className="muted">average</span>
            </div>
          )}
          <div className="results-distribution">
            {summary.distribution.map((row) => (
              <div key={row.value} className="results-distribution-row">
                <div className="results-distribution-main">
                  <span className="results-distribution-value">{row.value}</span>
                  <span className="muted results-distribution-pct">{row.percent}%</span>
                  <span className="muted results-distribution-count">
                    ({row.count} {row.count === 1 ? "vote" : "votes"})
                  </span>
                </div>
                {row.showNames && (
                  <div className="results-distribution-voters">
                    {row.tags.map((tag) => (
                      <span key={tag} className={`results-tag results-tag-${tag}`}>
                        {TAG_LABEL[tag]}
                      </span>
                    ))}
                    <span className="muted">{row.names.join(", ")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
