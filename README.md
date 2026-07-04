# Loki Lite Adventures

Browser-based multiplayer tabletop RPG platform for short-form adventures. The DM drives the story while the engine handles bookkeeping, combat math, movement, and content loading.

## Stack

- **Client:** React, TypeScript, Phaser, Vite
- **Server:** Node.js, TypeScript, Colyseus, Express
- **Shared:** TypeScript models and constants
- **Data:** JSON content packs plus PostgreSQL migrations

## Workspace layout

```text
client/      React + Phaser frontend
server/      Colyseus rooms and gameplay systems
shared/      Shared types and constants
content/     Content-driven JSON definitions
database/    PostgreSQL migrations
```

## Quick start

```bash
npm install
npm run build
```

For local development, run the frontend and backend in separate terminals:

```bash
npm run dev:client
npm run dev:server
```

## Current scaffold

This bootstrap includes:

- a Vite React client with a Phaser preview scene
- a Colyseus-powered lobby room and server health endpoint
- shared gameplay/content types
- starter JSON data for classes, spells, enemies, items, maps, and encounters
- an initial PostgreSQL migration for accounts, characters, rooms, and adventure saves

## Milestone 1 target

Deliver a playable prototype where two players and one DM can complete a short encounter with:

- multiplayer room creation
- character selection
- grid movement
- one map
- one enemy type
- dice rolling
- basic combat
- turn order
- combat log
