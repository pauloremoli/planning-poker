import type { Participant } from "@planning-poker/shared";
import { parseVoteValue } from "../utils/deck";

export type ResultsTag = "lowest" | "highest" | "majority";

export interface ResultsDistributionRow {
  value: string;
  count: number;
  percent: number;
  names: string[];
  /** A row can carry more than one tag (e.g. only two distinct numeric votes, tied on count). */
  tags: ResultsTag[];
  /** Whether `names` is worth surfacing in the UI — a tagged row, or "?"/"☕" (who's unsure or calling for a break is always worth naming, even with no tag of its own). */
  showNames: boolean;
}

export interface ResultsSummary {
  average: number | null;
  totalVotes: number;
  distribution: ResultsDistributionRow[];
}

/** Never part of the scale — "unsure" and "let's take a break", not a low or high estimate. */
const NON_SCALE_VALUES = new Set(["?", "☕"]);

export function buildResultsSummary(participants: Participant[], deckValues: string[]): ResultsSummary {
  const voters = participants.filter((p): p is Participant & { vote: string } => p.vote !== null);
  const totalVotes = voters.length;

  const groups = new Map<string, string[]>();
  for (const v of voters) groups.set(v.vote, [...(groups.get(v.vote) ?? []), v.name]);

  // Ties break by the deck's own card order (e.g. T-shirt sizes XS < S < M <
  // L < XL < XXL) rather than alphabetically or by whoever happened to vote
  // first — alphabetical would put "L" before "S" before "XL", which is
  // meaningless for an ordered scale.
  const deckOrder = (value: string) => {
    const i = deckValues.indexOf(value);
    return i === -1 ? deckValues.length : i;
  };

  const numeric = voters.map((v) => ({ vote: v.vote, value: parseVoteValue(v.vote) })).filter((v): v is { vote: string; value: number } => v.value !== null);
  const average = numeric.length > 0 ? numeric.reduce((a, b) => a + b.value, 0) / numeric.length : null;

  // Lowest/highest need a spread to be meaningful — everyone agreeing (or
  // only one relevant vote) would just tag the same single row twice.
  // Prefer actual numeric magnitude when the deck has numbers (correct even
  // for a custom deck typed out of order); fall back to the deck's listed
  // order for a non-numeric scale like T-shirt sizes, where "lowest"/"highest"
  // means smallest/largest size, not a number.
  let lowestValues: string[] = [];
  let highestValues: string[] = [];
  if (numeric.length > 0) {
    const minValue = Math.min(...numeric.map((n) => n.value));
    const maxValue = Math.max(...numeric.map((n) => n.value));
    if (minValue !== maxValue) {
      lowestValues = [...new Set(numeric.filter((n) => n.value === minValue).map((n) => n.vote))];
      highestValues = [...new Set(numeric.filter((n) => n.value === maxValue).map((n) => n.vote))];
    }
  } else {
    const ordinal = voters
      .filter((v) => !NON_SCALE_VALUES.has(v.vote))
      .map((v) => ({ vote: v.vote, order: deckOrder(v.vote) }))
      .filter((v) => v.order < deckValues.length);
    if (ordinal.length > 0) {
      const minOrder = Math.min(...ordinal.map((o) => o.order));
      const maxOrder = Math.max(...ordinal.map((o) => o.order));
      if (minOrder !== maxOrder) {
        lowestValues = [...new Set(ordinal.filter((o) => o.order === minOrder).map((o) => o.vote))];
        highestValues = [...new Set(ordinal.filter((o) => o.order === maxOrder).map((o) => o.vote))];
      }
    }
  }

  const maxCount = totalVotes > 0 ? Math.max(...[...groups.values()].map((names) => names.length)) : 0;
  // "Majority" only means something when more than one person actually agreed —
  // with every vote unique (maxCount === 1) there's no real plurality to call out.
  const majorityValues = maxCount > 1 ? [...groups.entries()].filter(([, names]) => names.length === maxCount).map(([value]) => value) : [];

  const distribution: ResultsDistributionRow[] = [...groups.entries()]
    .map(([value, names]) => {
      const tags: ResultsTag[] = [];
      if (lowestValues.includes(value)) tags.push("lowest");
      if (highestValues.includes(value)) tags.push("highest");
      if (majorityValues.includes(value)) tags.push("majority");
      const showNames = tags.length > 0 || NON_SCALE_VALUES.has(value);
      return { value, count: names.length, percent: Math.round((names.length / totalVotes) * 100), names, tags, showNames };
    })
    .sort((a, b) => deckOrder(a.value) - deckOrder(b.value));

  return { average, totalVotes, distribution };
}
