<script setup>
import { ref } from 'vue'
import { useGameStore } from '../composables/useGameStore'
import AddCustomQuestionForm from './AddCustomQuestionForm.vue'
import InstallPrompt from './InstallPrompt.vue'

const {
  state,
  allCategories,
  canStart,
  addPlayer,
  removePlayer,
  toggleCategory,
  toggleCategoryDifficulty,
  toggleNeverDifficulty,
  setGameStyle,
  removeCustomQuestion,
  startGame,
} = useGameStore()

const newPlayerName = ref('')

const GAME_STYLES = [
  { id: 'order', label: '➡️ In Order' },
  { id: 'random', label: '🎡 Random Spin' },
  { id: 'hotpotato', label: '🥔 Hot Potato' },
  { id: 'neverhaveiever', label: '🤐 Never Have I Ever' },
]

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', activeClass: 'btn-success' },
  { id: 'medium', label: 'Medium', activeClass: 'btn-warning' },
  { id: 'hard', label: 'Hard', activeClass: 'btn-error' },
]

const CUSTOM_TYPE_ICON = { truth: '📜', dare: '🔥', never: '🤐' }

function handleAddPlayer() {
  addPlayer(newPlayerName.value)
  newPlayerName.value = ''
}
</script>

<template>
  <div class="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-4 py-8 md:max-w-5xl">
    <header class="text-center">
      <h1 class="font-display title-outline text-3xl tracking-tight text-white sm:text-4xl">
        Truth <span class="text-warning">or</span> Dare
      </h1>
      <p class="mt-3 text-sm opacity-70">Set up your players and pick your categories to begin.</p>
    </header>

    <InstallPrompt />

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
      <div class="flex flex-col gap-6">
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
            <h2 class="font-display text-lg text-secondary">Game Style</h2>
            <div class="flex flex-wrap justify-center gap-2">
              <button
                v-for="style in GAME_STYLES"
                :key="style.id"
                type="button"
                class="btn font-display"
                :class="state.gameStyle === style.id ? 'btn-warning' : 'btn-ghost'"
                @click="setGameStyle(style.id)"
              >
                {{ style.label }}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="flex flex-col gap-6">
        <section
          v-if="state.gameStyle !== 'neverhaveiever'"
          class="rounded-box border-4 border-neutral/40 bg-base-200 shadow-[0_6px_0_0_rgba(43,42,85,0.15)]"
        >
          <div class="flex flex-col gap-3 p-4">
            <h2 class="font-display text-lg text-secondary">Categories</h2>
            <div class="flex flex-col gap-2">
              <div
                v-for="category in allCategories"
                :key="category"
                class="flex flex-wrap items-center justify-between gap-2 rounded-field border-2 border-base-300 bg-base-100 px-3 py-2"
              >
                <label class="label cursor-pointer justify-start gap-3 p-0">
                  <input
                    type="checkbox"
                    class="toggle toggle-warning"
                    :checked="state.selectedCategories.includes(category)"
                    @change="toggleCategory(category)"
                  />
                  <span
                    class="font-display"
                    :class="state.selectedCategories.includes(category) ? 'text-base-content' : ''"
                  >
                    {{ category }}
                  </span>
                </label>
                <div v-if="state.selectedCategories.includes(category)" class="join">
                  <button
                    v-for="diff in DIFFICULTIES"
                    :key="diff.id"
                    type="button"
                    class="btn join-item btn-xs font-display"
                    :class="
                      state.categoryDifficulties[category]?.includes(diff.id) ? diff.activeClass : 'btn-ghost'
                    "
                    @click="toggleCategoryDifficulty(category, diff.id)"
                  >
                    {{ diff.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          v-else
          class="rounded-box border-4 border-neutral/40 bg-base-200 shadow-[0_6px_0_0_rgba(43,42,85,0.15)]"
        >
          <div class="flex flex-col gap-3 p-4">
            <h2 class="font-display text-lg text-secondary">Never Have I Ever Difficulty</h2>
            <div class="join">
              <button
                v-for="diff in DIFFICULTIES"
                :key="diff.id"
                type="button"
                class="btn join-item font-display flex-1"
                :class="state.neverHaveIEverDifficulties.includes(diff.id) ? diff.activeClass : 'btn-ghost'"
                @click="toggleNeverDifficulty(diff.id)"
              >
                {{ diff.label }}
              </button>
            </div>
          </div>
        </section>

        <section class="rounded-box border-4 border-neutral/40 bg-base-200 shadow-[0_6px_0_0_rgba(43,42,85,0.15)]">
          <div class="flex flex-col gap-3 p-4">
            <h2 class="font-display text-lg text-secondary">Custom Questions</h2>
            <AddCustomQuestionForm />
            <ul v-if="state.customQuestions.length" class="flex flex-col gap-1">
              <li
                v-for="q in state.customQuestions"
                :key="q.id"
                class="flex items-center justify-between gap-2 rounded-field bg-base-100 px-3 py-2 text-sm"
              >
                <span>{{ CUSTOM_TYPE_ICON[q.type] }} {{ q.text }}</span>
                <button
                  type="button"
                  class="text-error shrink-0"
                  aria-label="Remove custom question"
                  @click="removeCustomQuestion(q.id)"
                >
                  ✕
                </button>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>

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