import type { ClientToServerMessage, ServerToClientMessage } from "@planning-poker/shared";

type Handler = (message: ServerToClientMessage) => void;

/** Thin typed wrapper around the signaling WebSocket. Auto-reconnects so the fast host-disconnected push and claim-host CAS keep working through brief network blips. */
export class SignalingClient {
  private socket: WebSocket | null = null;
  private handlers = new Set<Handler>();
  private queue: ClientToServerMessage[] = [];
  private closedByUser = false;
  private reconnectDelayMs = 1000;

  constructor(private url: string) {
    this.connect();
  }

  private connect(): void {
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.reconnectDelayMs = 1000;
      for (const message of this.queue.splice(0)) this.send(message);
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as ServerToClientMessage;
        for (const handler of this.handlers) handler(message);
      } catch {
        // ignore malformed frames
      }
    });

    socket.addEventListener("close", () => {
      if (this.closedByUser) return;
      setTimeout(() => this.connect(), this.reconnectDelayMs);
      this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 10_000);
    });
  }

  onMessage(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(message: ClientToServerMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.queue.push(message);
    }
  }

  close(): void {
    this.closedByUser = true;
    this.socket?.close();
  }
}
