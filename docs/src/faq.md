# FAQ & troubleshooting

## Why did I briefly see someone as disconnected?

A dropped connection (a flaky network, a laptop going to sleep) or a page
reload briefly marks that participant as disconnected before they're
actually removed from the room. If they reconnect within a few seconds —
which a simple reload does automatically — they resume their exact seat:
same name, role, and vote. Only if they stay disconnected longer than that
does the room drop them for good. A quick refresh should never look like
someone left.

## What does the connection banner mean?

At the top of a room screen you may briefly see:

- **Connecting** — your browser is establishing the connection.
- **Connected** — everything's live; no banner is shown.
- **Reconnecting** — the connection dropped and your browser is retrying
  automatically. No action needed unless it persists.
- **Room not found** — see below.
- **Kicked** — the host removed you (see [Roles & host
  controls](./roles.md#removing-someone)).

## "Room not found"

The room either never existed at that link, or everyone has already left it
and it's been discarded. Rooms aren't archived or reopenable — ask whoever
was hosting to create a new one and share the fresh link.

## I was removed from a room — can I get back in?

Not with the same link. If a host removes you, reopening that room's link
won't resume your old seat; you'd need a new invite from the host to rejoin
as a fresh participant (and it's the host's call whether to send one).

## What happens if the host leaves without transferring ownership?

Admins can still run rounds (reveal, vote again, next task, change the
deck, manage tasks) as long as they're in the room — but promoting/demoting
admins, transferring host, and removing participants stop being available
to anyone, since those require the host role specifically. If you're
handing off a room, [transfer ownership](./roles.md#managing-participants)
deliberately before you go.

## Does my vote stay private until reveal?

Yes — other participants only see *that* you've voted, never the value,
until a host or admin reveals the round.

## Is anything saved permanently?

No. Room state (participants, votes, tasks, results) lives only for as long
as the room is active and is discarded once everyone leaves — there's no
account, database record, or history to look back on later. The only things
saved for next time are, locally in your own browser: your display name and
your default deck preference. Take a [session
summary](./ending-a-session.md) before you're done if you want to keep a
copy of the results.

## Can I use this on my phone?

Yes — it's a normal web page and works in a mobile browser. Scanning a
host's QR code is often the fastest way to join from a phone.

## Can two people share the same name?

Yes, names aren't unique identifiers — the app tracks each participant by
their own browser tab, not by name. If it's confusing in a large room,
just ask people to use distinct names.
