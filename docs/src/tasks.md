# Managing tasks

Tasks are the items your team estimates one at a time. Only a host or admin
can manage the task queue; everyone else just sees whichever task is
currently up for a vote.

## Adding and editing tasks

From the **Tasks** card (host/admin only, visible in the [host
view](./images/host.png)):

- Select **+ Add task**, give it a title (e.g. `PROJ-123 Add search
  filter`) and an optional description, then **Add**. Links in the
  description are turned into clickable links automatically.
- Select the pencil icon on any task to edit its title or description.
- Use the up/down arrows to reorder the queue, or the ✕ to remove a task.
- Select a task's title to make it the current one — voting resets for
  whichever task becomes current.

The very first task added automatically becomes the current one. Removing
the current task falls back to a sensible neighbor in the list.

## What everyone else sees

Regular participants only see the task currently being voted on — its title,
description, and (once revealed) its average — not the rest of the queue.
This keeps the voting screen focused and avoids "spoiling" what's coming up
next.

## Moving through the queue

Selecting **Next task** in [round controls](./roles.md#round-controls)
clears the current round's votes and advances to the next task in the list.
If you're already on the last task, it's a no-op for the queue position but
still clears votes, so you can re-vote the last item with a clean slate.

Working without a task list is fine too — if you never add any tasks, the
room just runs as a single, ongoing round.
