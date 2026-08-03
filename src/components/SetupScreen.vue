<script setup>
import { ref } from 'vue'
import { useGameStore } from '../composables/useGameStore'

const { state, allCategories, canStart, addPlayer, removePlayer, toggleCategory, setMode, startGame } =
  useGameStore()

const newPlayerName = ref('')

function handleAddPlayer() {
  addPlayer(newPlayerName.value)
  newPlayerName.value = ''
}
</script>

<template>
  <div class="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-4 py-8">
    <header class="text-center">
      <h1 class="font-display title-outline text-3xl tracking-tight text-white sm:text-4xl">
        Truth <span class="text-warning">or</span> Dare
      </h1>
      <p class="mt-3 text-sm opacity-70">Set up your players and pick your categories to begin.</p>
    </header>

    <section class="rounded-box border-4 border-neutral/40 bg-base-200 shadow-[0_6px_0_0_rgba(43,42,85,0.15)]">
      <div class="flex flex-col gap-3 p-4">
        <h2 class="font-display text-lg text-secondary">Players</h2>

        <form class="join w-full" @submit.prevent="handleAddPlayer">
          <input
            v-model="newPlayerName"
            type="text"
            placeholder="Add a player name"
            class="input join-item w-full"
            style="--input-color: var(--color-base-300)"
            maxlength="20"
          />
          <button type="submit" class="btn join-item btn-warning font-display">Add</button>
        </form>

        <p v-if="state.players.length === 0" class="text-sm opacity-60">
          No players yet — add at least one to start.
        </p>

        <ul v-else class="flex flex-wrap gap-2">
          <li
            v-for="(player, index) in state.players"
            :key="index"
            class="badge badge-lg gap-2 border-0 bg-base-300 py-4 font-display text-base-content"
          >
            {{ player }}
            <button
              type="button"
              class="text-error"
              aria-label="Remove player"
              @click="removePlayer(index)"
            >
              ✕
            </button>
          </li>
        </ul>
      </div>
    </section>

    <section class="rounded-box border-4 border-neutral/40 bg-base-200 shadow-[0_6px_0_0_rgba(43,42,85,0.15)]">
      <div class="flex flex-col gap-3 p-4">
        <h2 class="font-display text-lg text-secondary">Categories</h2>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label
            v-for="category in allCategories"
            :key="category"
            class="label cursor-pointer justify-start gap-2 rounded-field border-2 border-base-300 bg-base-100 px-3 py-2"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-warning checkbox-sm"
              :checked="state.selectedCategories.includes(category)"
              @change="toggleCategory(category)"
            />
            {{ category }}
          </label>
        </div>
      </div>
    </section>

    <section class="rounded-box border-4 border-neutral/40 bg-base-200 shadow-[0_6px_0_0_rgba(43,42,85,0.15)]">
      <div class="flex flex-col gap-3 p-4">
        <h2 class="font-display text-lg text-secondary">Turn Order</h2>
        <div class="join w-full">
          <button
            type="button"
            class="btn join-item font-display flex-1"
            :class="state.mode === 'order' ? 'btn-warning' : 'btn-ghost'"
            @click="setMode('order')"
          >
            In Order
          </button>
          <button
            type="button"
            class="btn join-item font-display flex-1"
            :class="state.mode === 'random' ? 'btn-warning' : 'btn-ghost'"
            @click="setMode('random')"
          >
            🎡 Random Spin
          </button>
        </div>
      </div>
    </section>

    <button
      type="button"
      class="btn btn-lg btn-success font-display mt-auto shadow-[0_6px_0_0_rgba(43,42,85,0.15)]"
      :disabled="!canStart"
      @click="startGame"
    >
      Start Game
    </button>
  </div>
</template>