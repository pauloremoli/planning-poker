export default function VotingCard({ value, selected, disabled, onSelect }: { value: string; selected: boolean; disabled: boolean; onSelect: () => void }) {
  return (
    <button className={`voting-card${selected ? " selected" : ""}`} disabled={disabled} onClick={onSelect}>
      {value}
    </button>
  );
}
