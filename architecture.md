# Architecture

Planning Poker is an npm-workspaces monorepo with three packages:

```
shared/   Data model, the room-state reducer, and the WebSocket protocol
server/   Node + Express + ws — the authoritative room server
client/   React + Vite + TypeScript — the UI
```

## Server-authoritative, one process

The server holds each room's `RoomState` in memory and is the sole source of
truth. Every action a client sends — a vote, a reveal, a task edit — is
applied server-side by a pure reducer, and the resulting state is broadcast
to everyone in the room over one WebSocket connection per participant.
There is **no peer-to-peer layer**: the WebSocket is the entire application
protocol.

Because state lives in one process's memory, the app requires exactly one
running server instance — a second instance would hold its own inconsistent
copy of every room. This is enforced at deploy time (`fly deploy --ha=false`,
`min_machines_running`; see [Deployment](#deployment)), not in application
code.

## Package responsibilities

**`shared`** owns everything both sides must agree on:

- `dataChannelTypes.ts` — `RoomState`, `Participant`, `DeckConfig`,
  `TaskInfo`/`TaskResult`, the `RoomAction` union, and `hasPermission`.
- `roomReducer.ts` — `applyAction`, the pure function that turns a
  `RoomState` + `RoomAction` into the next `RoomState`. This is the single
  place room-mutation logic lives; the server just calls it and broadcasts.
- `signalingTypes.ts` — the WebSocket message envelopes
  (`ClientToServerMessage` / `ServerToClientMessage`).
- `deck.ts` — vote-value parsing (`parseVoteValue`) shared by client
  (rendering) and server (averaging).

**`server`** (`server/src/signaling/`) is a thin layer around the shared
reducer:

- `RoomStore.ts` — owns the `Map` of live rooms, each room's sockets, and
  the disconnect-grace and auto-reveal timers. Calls `applyAction` and
  broadcasts whenever the resulting state actually changed.
- `SignalingServer.ts` — the `ws` connection handler: parses incoming JSON,
  dispatches to `RoomStore`, and runs a heartbeat ping/pong so idle
  connections aren't silently dropped by a reverse proxy.

**`client`** (`client/src/`) is a normal React app. `webrtc/ConnectionManager.ts`
and `webrtc/SignalingClient.ts` own the one WebSocket connection per tab
despite the directory name — a holdover from an earlier peer-to-peer design
(see the `Rework connection model` commit) that has since been simplified
to a plain client/server model.

```
pages/         Home, Room, About — routed by react-router-dom
components/    Presentational + feature components (voting deck, results, tasks, ...)
context/       RoomContext — the app's one source of connection state
hooks/         useRoomConnection, useDeckPreference, useDisplayName
webrtc/        SignalingClient (raw WebSocket) + ConnectionManager (app-level API)
utils/         id/peer generation, localStorage/sessionStorage wrappers, deck helpers, linkify
```

`useRoomConnection` creates one `ConnectionManager` for the lifetime of a
`Room` page mount and exposes `state` / `status` / `myPeerId` as React
state. `RoomProvider` wraps that hook and derives the UI-facing surface:
`isHost`, `isSpectator`, `canControlRound` (from `hasPermission`), and one
bound method per `RoomAction`. Components call `useRoom()` and never talk
to `ConnectionManager` directly.

## Data flow

```
 browser tab                          server (one process)
┌─────────────┐  connect-room /      ┌──────────────────────────┐
│ React UI     │  room-action        │ SignalingServer (ws)      │
│  ↕ RoomContext │ ───────────────▶  │  ↕                        │
│ ConnectionManager                  │ RoomStore                 │
│  (1 WebSocket) │ ◀─────────────── │  applyAction (shared)     │
└─────────────┘  room-state          │  in-memory RoomState      │
                  (broadcast to all) └──────────────────────────┘
```

1. A client sends `connect-room` (create-or-join, idempotent) or
   `room-action` (a `RoomAction`, e.g. `vote-cast`).
2. `RoomStore` looks up the room, calls `applyAction` (or `addParticipant`
   for a new join), and compares the result to the previous state by
   reference.
3. If the state changed, `RoomStore` broadcasts `{ type: "room-state", state
   }` to every socket in the room. Permission checks and no-ops are handled
   entirely inside `applyAction`, so `RoomStore` never needs to know what a
   given action means.

## WebSocket protocol

Defined in `shared/src/signalingTypes.ts`.

```ts
type ClientToServerMessage =
  | { type: "connect-room"; roomId: string; peerId: string; name: string; createWithDeck?: DeckConfig }
  | { type: "room-action"; roomId: string; action: RoomAction };

type ServerToClientMessage =
  | { type: "room-state"; state: RoomState }
  | { type: "room-not-found" }
  | { type: "kicked" }
  | { type: "error"; message: string };
```

- **`connect-room`** — idempotent connect/reconnect. If the room doesn't
  exist yet, `createWithDeck` creates it with this peer as host; omitted
  against an unknown room, the server replies `room-not-found`. If the room
  exists and `peerId` is already a participant, this is a reconnect (same
  identity, role, vote) rather than adding a duplicate.
- **`room-action`** — wraps a `RoomAction` with the `roomId` it applies to.
- **`room-state`** — the full, authoritative state, broadcast to every
  socket in the room whenever it changes.
- **`kicked`** — sent right before the server drops a kicked participant's
  connection; the client clears its locally-stored identity for that room
  and does not attempt to reconnect.

**Heartbeat**: idle WebSocket connections get silently dropped by most
reverse proxies (Fly's edge included) after ~60s. `SignalingServer` runs a
protocol-level ping every 25s; sockets that haven't answered the previous
ping by the next tick are terminated. Browsers answer pings automatically —
no client code is involved.

## Room state & permissions

`RoomState` (`shared/src/dataChannelTypes.ts`) holds the deck, reveal/round
state, the participant list, the task queue (`currentTaskId` tracked by id,
not array index, so reorders/removals can't desync it), and a snapshot of
each task's result once revealed.

`hasPermission(role, action)` is the single source of truth for what each
role can do:

| Action | host | admin | member |
|---|---|---|---|
| `reveal`, `reset`, `set-deck`, `manage-tasks`, `auto-reveal` | ✅ | ✅ | ❌ |
| `grant-admin`, `revoke-admin`, `transfer-host`, `kick` | ✅ | ❌ | ❌ |

Every `request-*` action in `roomReducer.ts`'s `applyAction` checks
`hasPermission` before mutating anything, and returns the **same object
reference** for a rejected or no-op action — callers use `next === prev` to
skip a broadcast cheaply.

**Auto-reveal**: when enabled (the default), `RoomStore` starts a timer the
moment every non-spectator participant has voted, and fires a reveal on the
host's behalf after 2000ms. The timer re-checks the round number and
reveal/enabled/everyone-voted conditions when it fires, so a stale timer
from a round that already moved on is a safe no-op.

**Reconnects**: a closed socket doesn't remove a participant immediately —
`RoomStore` marks them `connected: false` and waits 5000ms before actually
removing them, unless they reconnect (same `peerId`) in the meantime, which
is exactly what a page reload does (the client persists its `peerId` in
`sessionStorage`).

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev            # server (tsx watch) + client (vite), concurrently
npm run typecheck      # tsc --noEmit across shared, server, client, in order
npm test               # vitest run across shared, server, client, in order
npm run test:coverage  # same, with coverage
npm run build          # builds the client for production (client/dist)
npm start              # runs the production server (serves client/dist + the WebSocket)
```

`shared` is built from source directly — workspace symlinks resolve
`@planning-poker/shared` straight to `shared/src`, so editing shared types
is picked up immediately by both dev servers, no separate compile step.

Tests sit next to the code they cover (`*.test.ts(x)`).

## Deployment

`server/src/index.ts` runs an Express app plus a `ws` `WebSocketServer`
mounted at `/ws` on the same HTTP server. `GET /healthz` is a plain
liveness check. In production (`NODE_ENV=production`), Express also serves
the built client (`client/dist`) as static files, with a catch-all falling
back to `index.html` for client-side routing — so the deployed artifact is
**one process** serving both the static client and the WebSocket endpoint.

**Docker**: a two-stage build (`Dockerfile`) — `npm ci` + `npm run build` in
the build stage, then a slim runtime image that runs the server's
TypeScript directly via `tsx` (`npm run start -w server`), keeping the
monorepo's workspace-symlink layout intact instead of bundling/flattening
`@planning-poker/shared`.

**Fly.io** (`fly.toml`): app `planning2poker`, region `ewr`, HTTPS forced,
`min_machines_running = 0` (scales to zero when idle), a `/healthz` health
check, and a single `shared-cpu-1x` / 256MB VM.

**CI/CD** (`.github/workflows/deploy.yml`): on every push/PR to `main`, runs
typecheck/test/build; on push to `main` after that passes, deploys via
`flyctl deploy --remote-only --ha=false`. The `--ha=false` flag is what
keeps Fly from ever running more than one machine at once, per the
single-process constraint above. Deploys are serialized via a concurrency
group so two pushes can't race each other.
