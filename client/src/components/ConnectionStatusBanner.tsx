import { useRoom } from "../context/RoomContext";

const COPY: Record<string, string> = {
  connecting: "Connecting…",
  "host-disconnected": "Host disconnected — promoting the next participant to host…",
  reconnecting: "Reconnecting…",
  "room-not-found": "This room doesn't exist (or the host hasn't finished setting it up yet).",
};

export default function ConnectionStatusBanner() {
  const { status } = useRoom();
  if (status === "connected") return null;

  const message = COPY[status] ?? status;
  const isWarning = status === "host-disconnected" || status === "room-not-found";

  return <div className={`banner${isWarning ? " warn" : ""}`}>{message}</div>;
}
