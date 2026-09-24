# Planning Poker

Anonymous, link-only planning poker. No accounts — create a room, share the
link (or QR code), and start estimating. Room state lives only in memory
for as long as the room is active; nothing is written to disk.

**Voting** — everyone sees the current task, picks a card, and watches who's still deciding:

![Voting](docs/screenshots/voting.png)

**Host view** — invite QR code, round controls, task management, and live results:

![Host page](docs/screenshots/host.png)

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

This starts the server on `:3001` and the Vite dev server on `:5173` (which
proxies `/ws` to the server). Open `http://localhost:5173`.

Other useful scripts:

```bash
npm run typecheck   # type-check all workspaces
npm test             # run the test suite (shared, server, client)
npm run build        # build the client for production (client/dist)
npm start            # run the production server (serves client/dist + WebSocket)
```

## Documentation

- [User guide](docs/src) — how to use the app (built with mdBook: `mdbook serve`)
- [Architecture](architecture.md) — how the app is put together

## License

MIT — see [LICENSE](./LICENSE).
