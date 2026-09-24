export default function VotingCard({ value, selected, onSelect }: { value: string; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`voting-card${selected ? " selected" : ""}`} onClick={onSelect}>
      {value}
    </button>
  );
}
