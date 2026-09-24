import { useRoom } from "../context/RoomContext";

const COPY: Record<string, string> = {
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  "room-not-found": "This room doesn't exist (or hasn't finished being created yet).",
};

export default function ConnectionStatusBanner() {
  const { status } = useRoom();
  if (status === "connected") return null;

  const message = COPY[status] ?? status;
  const isWarning = status === "room-not-found";

  return <div className={`banner${isWarning ? " warn" : ""}`}>{message}</div>;
}
