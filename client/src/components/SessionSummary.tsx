import { useMemo, useState } from "react";
import { useRoom } from "../context/RoomContext";

function buildSummaryText(state: NonNullable<ReturnType<typeof useRoom>["state"]>): string {
  const lines: string[] = [];
  lines.push("Planning Poker Session Summary");
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push("");

  if (state.tasks.length === 0) {
    lines.push("No tasks were added this session.");
  } else {
    state.tasks.forEach((task, i) => {
      lines.push(`${i + 1}. ${task.title}`);
      if (task.description) lines.push(`   ${task.description.replace(/\n/g, "\n   ")}`);
      const result = state.taskResults[task.id];
      if (result && result.votes.length > 0) {
        // Distribution only — no participant names, keeping the summary anonymous.
        const counts = new Map<string, number>();
        for (const v of result.votes) counts.set(v.value, (counts.get(v.value) ?? 0) + 1);
        // Ties break by the deck's own card order (e.g. T-shirt sizes), not alphabetically.
        const deckOrder = (value: string) => {
          const i = state.deck.values.indexOf(value);
          return i === -1 ? state.deck.values.length : i;
        };
        const distribution = [...counts.entries()].sort((a, b) => b[1] - a[1] || deckOrder(a[0]) - deckOrder(b[0]));
        lines.push(`   Votes: ${distribution.map(([value, count]) => `${value} x${count}`).join(", ")}`);
        lines.push(`   Average: ${result.average !== null ? result.average.toFixed(1) : "n/a"}`);
      } else {
        lines.push("   Not yet voted.");
      }
      lines.push("");
    });
  }

  return lines.join("\n");
}

export default function SessionSummary({ onClose }: { onClose: () => void }) {
  const { state } = useRoom();
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => (state ? buildSummaryText(state) : ""), [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — the text is still selectable in the box below
    }
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planning-poker-${state?.roomId ?? "session"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card stack">
      <div className="row between">
        <h3>Session summary</h3>
        <button className="subtle" onClick={onClose}>
          Close
        </button>
      </div>
      <textarea readOnly value={text} rows={12} onFocus={(e) => e.target.select()} style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.85rem" }} />
      <div className="row wrap">
        <button className="primary" onClick={copy}>
          {copied ? "Copied!" : "Copy to clipboard"}
        </button>
        <button onClick={download}>Save as .txt</button>
      </div>
    </div>
  );
}
