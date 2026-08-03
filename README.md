# Truth or Dare

A local, single-device Truth or Dare party game. Built with Vue 3 (Composition API), Tailwind CSS + DaisyUI, and Vite as an installable PWA.

## Setup

```sh
bun install
```

## Develop

```sh
bun run dev
```

## Build

```sh
bun run build
```

## How it works

- Questions live in [src/data/questions.json](src/data/questions.json) — each entry has `id`, `type` (`truth`/`dare`), `categories`, and `text`. Add or edit questions there.
- Game state (players, selected categories, turn mode, drawn questions) is managed in [src/composables/useGameStore.js](src/composables/useGameStore.js).
- The setup screen ([src/components/SetupScreen.vue](src/components/SetupScreen.vue)) configures players/categories/turn order; the game screen ([src/components/GameScreen.vue](src/components/GameScreen.vue)) runs the actual game.