import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Deliberately not wrapped in <StrictMode>: RoomProvider's effect owns a
// real signaling WebSocket + live WebRTC connections. StrictMode's dev-only
// double mount/cleanup/mount briefly opens two independent connections for
// the same peerId, and the throwaway one's teardown looks to the remote
// host like the participant actually left, corrupting room state — a
// dev-mode-only artifact (StrictMode is stripped from production builds)
// that this connection-owning class isn't a good fit for.
createRoot(document.getElementById("root")!).render(<App />);
