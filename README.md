# Planning Poker

Anonymous, link-only planning poker. No accounts, no server-side storage of
names or votes — rooms live entirely in the browsers connected to them,
synced peer-to-peer over WebRTC. A tiny signaling server only helps browsers
find each other; it never sees room data, and forgets a room the instant
everyone leaves.

## Features

- **Link-only rooms** — create a room, share the link (and QR code); only
  people with the link can join.
- **Fibonacci deck by default**, plus Modified Fibonacci, T-shirt sizes,
  powers of two, or a custom deck. Your deck preference and display name are
  remembered locally (`localStorage`) — never sent to any server.
- **Multiple tasks** — the host/admin can queue up tasks with a title and
  description; "Next task" advances through the list, "Vote again" re-votes
  the current one.
- **Roles** — the room creator starts as host and can promote others to
  admin (co-host powers: reveal, reset, manage tasks/deck) or transfer
  ownership outright.
- **Automatic host migration** — if the host disconnects unexpectedly, the
  room keeps going: the next-in-line admin (or, failing that, the
  earliest-joined participant) is promoted automatically, with no
  interruption.
- **Away mode** — step away without leaving; away participants are excluded
  from voting and from the "everyone voted" check.
- **Auto-reveal** — optionally reveal automatically 5s after every active
  participant has voted.
- **Session summary** — a plain-text recap of every task, its votes, and its
  average, ready to copy or save as a `.txt` file.

## Architecture

An npm-workspaces monorepo:

```
shared/   Message and type contracts shared by client and server
server/   Node + Express + ws — a pure WebRTC signaling relay (no app data)
client/   React + Vite + TypeScript — the actual UI and WebRTC logic
```

Room state (participants, votes, tasks, deck, etc.) is synced directly
between browsers over WebRTC DataChannels in a star topology: the host is
the hub, everyone else connects only to the host. The signaling server's
only job is relaying the WebRTC handshake (offers/answers/ICE candidates)
by room ID — it holds nothing beyond that, purely in memory, for the
lifetime of a connection.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

This starts the signaling server on `:3001` and the Vite dev server on
`:5173` (which proxies `/ws` to the signaling server). Open
`http://localhost:5173`.

Other useful scripts:

```bash
npm run typecheck   # type-check all workspaces
npm run build        # build the client for production (client/dist)
npm start             # run the production server (serves client/dist + signaling)
```

## Deployment

The server serves both the signaling WebSocket endpoint and the built
static client from the same origin — a single deployable. It needs a host
that supports long-lived WebSocket connections (e.g. Fly.io, Render, or any
VPS); there's no database and nothing to persist.

```bash
npm run build
NODE_ENV=production PORT=3001 npm start
```

## License

MIT — see [LICENSE](./LICENSE).
