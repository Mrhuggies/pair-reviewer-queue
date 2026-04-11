# NOTES

## Stack

Vite + React + TypeScript on the client. Express + TypeScript on the server, seeded in memory from `data/review_items.json`. Zod validates incoming actions at the API boundary. Tailwind for styling with one accent colour (indigo) so status colours can carry the semantic weight.

No database, no Docker, no router, no state management library, no test framework. The brief allowed reasonable shortcuts and I took them.

## Assumptions

- **Only the assigned reviewer can approve, reject, or escalate an `in_review` item.** The brief is silent on this. I went with the stricter default because it is the safer call for an ops tool and because it makes the "claimed by X" signal in the UI load-bearing.
- **Claim is one-way.** No unclaim, no reassign. The brief does not ask for either and adding them widens the state machine without evidence that an ops team needs it.
- **Escalate does not require a reason.** Same reasoning.
- **Current reviewer is selected from a small dropdown.** Defaults to `alex`. The options are `alex`, `sam`, `morgan`, matching the reviewers that actually appear in the seed data.
- **In-memory state.** Persistence is explicitly out of scope, so state resets on server restart.
- **Seed data invariants are enforced at load time.** An `unassigned` row with a non-null reviewer, or an `in_review` row with a null reviewer, throws before the server starts. A terminal row can carry either because it represents history.

## Trade-offs

- **One pure `canPerform` function used by both server and client.** The server is the source of truth and returns a structured error when a rule is violated. The client mirrors the function so disabled buttons can show the reviewer the reason without a round trip. Defence in depth, one place to change if the rules move.
- **Refetch after every action instead of optimistic UI.** The brief allowed it, it keeps the code small, and it makes the server the only thing the UI trusts. The cost is a brief network round trip after each click. Acceptable.
- **Zod validates the request body, not the URL path.** A missing id is a `404 NOT_FOUND`, a bad action string is a `400 BAD_REQUEST`. Two different failure modes with two different status codes.
- **Reviewer strings are normalised once.** Trim and lowercase applied at seed load and on every incoming action. This kills a whole class of "Alex vs alex vs  alex" comparison bugs.
- **Queue ordering has a deterministic tiebreaker.** Two items with identical risk, tier, and timestamp fall back to id ascending so the list does not flip between refetches.
- **Confirmation toast with no undo button.** I thought about offering undo on the terminal actions but it would either break the "terminal states are immutable" rule from the brief, or silently lie to the user by reverting the UI without reverting the server. The toast still tells the reviewer exactly what happened, to which item, and gives them five seconds or an X button to dismiss.
- **Mobile uses an inline accordion for the detail panel.** On small screens the detail and action buttons appear directly under the tapped row rather than at the bottom of the page. On desktop the layout stays as side-by-side master-detail.
- **No test framework.** The core logic sits in one pure function that is small enough to read end to end. The inline curl-based smoke tests in the commit history exercise every branch.
- **Tailwind with one accent colour.** Indigo is used for the primary claim button, the selected row highlight, and focus rings. Status colours (slate, blue, emerald, rose, amber) carry all the other semantic weight.

## What I would do next with more time

- Durable store with an audit log per item so that every state change records who did it, when, and why.
- Optimistic concurrency control on claim. Two reviewers clicking at the same moment should not both succeed. A version column and a compare-and-set would fix this.
- Real per-reviewer auth. The dropdown is there so I could exercise the multi-reviewer rule paths, not as a model for production.
- Live queue updates over SSE or websockets so a reviewer sees new work without needing to refetch.
- A real test suite. Pure rule tests, API contract tests, and one end-to-end happy path.
- Filters and search on the queue once the list grows past one screen.
- Keyboard shortcuts (`j`/`k` to move, `c`/`a`/`r`/`e` to act). Ops teams live in these tools and keyboard-first navigation is the fastest thing you can give them. I cut them from this build to protect the timebox.
- An "escalate with reason" flow. Escalation without context is usually an anti-pattern in real ops tools.
