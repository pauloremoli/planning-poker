import { useState } from "react";

export default function NamePrompt({ initialName, onSubmit }: { initialName: string; onSubmit: (name: string) => void }) {
  const [name, setName] = useState(initialName);

  return (
    <div className="card stack">
      <h2>Join room</h2>
      <label className="stack">
        <span className="muted">Your name</span>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          maxLength={40}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSubmit(name.trim())}
        />
      </label>
      <button className="primary" disabled={!name.trim()} onClick={() => onSubmit(name.trim())}>
        Join
      </button>
    </div>
  );
}
