import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDisplayName } from "../hooks/useDisplayName";
import { useDeckPreference } from "../hooks/useDeckPreference";
import { generateRoomId } from "../utils/id";
import DeckSettings from "./DeckSettings";

export default function CreateRoomForm() {
  const navigate = useNavigate();
  const [name, setName] = useDisplayName();
  const [deck, setDeck] = useDeckPreference();
  const [localName, setLocalName] = useState(name);

  function handleCreate() {
    const trimmed = localName.trim();
    if (!trimmed) return;
    setName(trimmed);
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`, { state: { mode: "create", deck } });
  }

  return (
    <div className="card stack">
      <h2>Create a room</h2>
      <label className="stack">
        <span className="muted">Your name</span>
        <input type="text" value={localName} onChange={(e) => setLocalName(e.target.value)} placeholder="e.g. Alex" maxLength={40} />
      </label>
      <label className="stack">
        <span className="muted">Default deck for rooms you create</span>
        <DeckSettings value={deck} onChange={setDeck} />
      </label>
      <button className="primary" onClick={handleCreate} disabled={!localName.trim()}>
        Create Room
      </button>
    </div>
  );
}
