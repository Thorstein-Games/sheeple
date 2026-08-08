# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

This is the Next.js (App Router) client for Sheeple, a real-time multiplayer party game. It connects over WebSocket to the `megingjord` Colyseus game server (separate repo) — it does **not** run its own game server logic. `server.ts` is just a custom Next.js HTTP server (used so dev/prod both run through one process); it has nothing to do with the game's realtime layer.

Note: README.md is stale — it describes a Socket.IO setup that no longer exists. The actual realtime stack is Colyseus (`colyseus.js` client), as reflected in `lib/colyseus/`.

## Commands

```bash
pnpm dev          # tsx watch server.ts — custom server with hot reload, kills :3000/:3001 first
pnpm dev:basic    # plain `next dev`, no custom server
pnpm build        # next build
pnpm start        # NODE_ENV=production node server.js (requires build output)
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
```

There is no test runner configured in this repo.

## Architecture

**Server connection** ([lib/config/gameConfig.ts](lib/config/gameConfig.ts)): `getGameServerUrl()` picks the Colyseus server address — `ws://localhost:2567` in dev, `wss://megingjord.onrender.com` (or `GAME_SERVER_URL` env var) in production. Game tuning constants (`MAX_PLAYERS`, `ROUND_DURATION`, etc.) also live here.

**Colyseus client wiring** ([lib/colyseus/ColyseusProvider.tsx](lib/colyseus/ColyseusProvider.tsx)): a React context (`ColyseusProvider`/`useColyseus`) holds the single `Colyseus.Client`, the active `room`, connection state, and a derived `players` list kept in sync via `room.state.players.onAdd/onRemove/onChange`. It also patches `consumeSeatReservation` to bridge a version mismatch — the server (`@colyseus/core@0.17`) returns a flat seat reservation shape, but the client lib (`colyseus.js@0.16`) expects the older nested `{ room: {...} }` shape. Don't "fix" that patch without checking both repos' Colyseus versions are still mismatched.

Two persistent per-browser identifiers are generated client-side and sent with every join: `playerId` (localStorage, survives across tabs/sessions) and `tabId` (sessionStorage, per-tab) — used by the server to distinguish reconnects from genuinely new players across multiple tabs.

**Room join flow** ([lib/colyseus/RoomService.ts](lib/colyseus/RoomService.ts)): `joinLobby` joins the `lobby` room type; `joinOrCreateGameRoom` either joins a specific room by ID (`client.joinById`, e.g. via a room code) or matches into the `sheeple_game` room type (`client.joinOrCreate`). Both room type names must match what's registered in the megingjord server's `src/index.ts`.

**Schema mirroring**: `lib/colyseus/schema/` (client-side copies for deserialization: `BaseGameState` re-exports `BaseGameState`/`Player` from `shared/schema/`, plus `SheepleState`) and `shared/schema/` (`BaseGameState`, `Player`, `RoomMetadata`) must stay structurally in sync with the equivalent schemas in the megingjord server repo — Colyseus state sync breaks silently if client and server schema definitions diverge. `lib/colyseus/_archived_room_files/` is dead code (old room implementations now owned by the server repo) and is excluded from `tsconfig.json` — don't resurrect it without checking it against the current server-side rooms first.

**Game UI flow**: `app/lobby` (room browser/creation) → `app/room/[roomId]` (the live game, driven by `useGameRoom.ts` which subscribes to room state) using components in `app/components/` (`GameLobby`, `ReadyRoom`, `RoundPlay`, `RoundResults`, `RoundTransition`, `GameEndScreen`, `Chat`, `CountdownTimer`, etc. — these map fairly directly to the game phases defined server-side).

## Cross-repo notes

This client and the `megingjord` server are developed together. When changing message names, payload shapes, or schema fields, check both repos — see `megingjord`'s [API.md](../megingjord/API.md) and [GAME_INTEGRATION.md](../megingjord/GAME_INTEGRATION.md) for the server-side contract. [GAME_INTEGRATION.md](GAME_INTEGRATION.md) and [SHEEPLE_GAME_LOGIC.md](SHEEPLE_GAME_LOGIC.md) in this repo are copies of the same docs from the server repo.
