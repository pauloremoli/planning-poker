import type { ClientToServerMessage, ServerToClientMessage } from "@planning-poker/shared";

type MessageHandler = (message: ServerToClientMessage) => void;
type VoidHandler = () => void;

/** Thin typed wrapper around the app's one WebSocket connection. Auto-reconnects with backoff so a brief network blip resumes on its own. */
export class SignalingClient {
  private socket: WebSocket | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private openHandlers = new Set<VoidHandler>();
  private closeHandlers = new Set<VoidHandler>();
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
      for (const handler of this.openHandlers) handler();
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as ServerToClientMessage;
        for (const handler of this.messageHandlers) handler(message);
      } catch {
        // ignore malformed frames
      }
    });

    socket.addEventListener("close", () => {
      if (this.closedByUser) return;
      for (const handler of this.closeHandlers) handler();
      setTimeout(() => this.connect(), this.reconnectDelayMs);
      this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 10_000);
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /** Fires once per successful (re)connection — including the very first one. */
  onOpen(handler: VoidHandler): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  /** Fires when the connection drops and an automatic reconnect is about to be attempted (never for a deliberate `close()`). */
  onClose(handler: VoidHandler): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
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
