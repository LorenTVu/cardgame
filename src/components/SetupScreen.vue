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
  setGameStyle,
  removeCustomQuestion,
  startGame,
} = useGameStore()

const newPlayerName = ref('')

const GAME_STYLES = [
  { id: 'order', label: 'IN ORDER', icon: '➡️', desc: 'Turn by turn' },
  { id: 'random', label: 'SPIN WHEEL', icon: '🎡', desc: 'Random victim' },
  { id: 'hotpotato', label: 'HOT POTATO', icon: '🥔', desc: 'Timed bomb!' },
  { id: 'neverhaveiever', label: 'NEVER EVER', icon: '🤐', desc: 'Group round' },
]

const DIFFICULTIES = [
  { id: 'easy', label: 'EASY', activeClass: 'bg-[#39ff14] text-black font-bold' },
  { id: 'medium', label: 'MED', activeClass: 'bg-[#ffe600] text-black font-bold' },
  { id: 'hard', label: 'HARD', activeClass: 'bg-[#ff3b70] text-white font-bold' },
]

const CUSTOM_TYPE_ICON = { truth: '📜', dare: '🔥', never: '🤐' }

function handleAddPlayer() {
  addPlayer(newPlayerName.value)
  newPlayerName.value = ''
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-6 md:max-w-4xl">
    <!-- 2000s Arcade Header -->
    <header class="text-center py-2">
      <div class="inline-block bg-[#00e5ff] border-2 border-black px-3 py-1 font-['Press_Start_2P'] text-[10px] font-bold shadow-[3px_3px_0px_#000] mb-3">
        🎮 2000s ARCADE EDITION
      </div>
      <h1 class="pixel-title text-3xl font-extrabold tracking-wider sm:text-5xl">
        TRUTH <span class="pixel-title-blue">OR</span> DARE
      </h1>
      <p class="mt-3 font-['Pixelify_Sans'] text-base font-bold text-slate-900 bg-white/70 border-2 border-black px-3 py-1 inline-block shadow-[3px_3px_0px_#000]">
        Press START to begin your party challenge!
      </p>
    </header>

    <InstallPrompt />

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
      <!-- Left Column: Players & Mode -->
      <div class="flex flex-col gap-6">
        <!-- Players Panel -->
        <section class="pixel-card p-5">
          <div class="flex items-center justify-between mb-4 border-b-4 border-black pb-2">
            <div class="flex items-center gap-2">
              <span class="text-xl">👾</span>
              <h2 class="font-['Press_Start_2P'] text-xs font-bold text-black uppercase">PLAYERS</h2>
            </div>
            <span class="pixel-badge bg-[#ffe600] text-black">
              {{ state.players.length }} READY
            </span>
          </div>

          <form class="flex gap-2 mb-4" @submit.prevent="handleAddPlayer">
            <input
              v-model="newPlayerName"
              type="text"
              placeholder="PLAYER NAME..."
              class="w-full border-4 border-black bg-white px-3 py-2 font-['Pixelify_Sans'] text-base font-bold uppercase placeholder-slate-400 outline-none"
              maxlength="20"
            />
            <button
              type="submit"
              class="pixel-btn pixel-btn-yellow px-4 py-2 text-xs font-bold shrink-0 disabled:opacity-50"
              :disabled="!newPlayerName.trim()"
            >
              ADD
            </button>
          </form>

          <p v-if="state.players.length === 0" class="text-center py-4 font-['Pixelify_Sans'] text-sm font-bold text-slate-600">
            No players added yet! Add at least 1 player.
          </p>

          <ul v-else class="flex flex-wrap gap-2">
            <li
              v-for="(player, index) in state.players"
              :key="index"
              class="flex items-center gap-2 border-2 border-black bg-[#ffe600] px-3 py-1 font-['Press_Start_2P'] text-[11px] font-bold text-black shadow-[2px_2px_0px_#000]"
            >
              <span>{{ player }}</span>
              <button
                type="button"
                class="font-bold text-red-600 hover:text-red-800"
                aria-label="Remove player"
                @click="removePlayer(index)"
              >
                ✕
              </button>
            </li>
          </ul>
        </section>

        <!-- Game Style Panel -->
        <section class="pixel-card p-5">
          <div class="flex items-center gap-2 mb-4 border-b-4 border-black pb-2">
            <span class="text-xl">🕹️</span>
            <h2 class="font-['Press_Start_2P'] text-xs font-bold text-black uppercase">GAME MODE</h2>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="style in GAME_STYLES"
              :key="style.id"
              type="button"
              class="pixel-btn flex flex-col items-start p-3 text-left transition-all"
              :class="state.gameStyle === style.id ? 'pixel-btn-yellow' : 'pixel-btn-white'"
              @click="setGameStyle(style.id)"
            >
              <span class="text-2xl mb-1">{{ style.icon }}</span>
              <span class="font-['Press_Start_2P'] text-[10px] font-bold leading-tight">{{ style.label }}</span>
              <span class="font-['Pixelify_Sans'] text-xs font-semibold text-slate-700 mt-1">{{ style.desc }}</span>
            </button>
          </div>
        </section>
      </div>

      <!-- Right Column: Categories & Custom Questions -->
      <div class="flex flex-col gap-6">
        <!-- Categories Panel -->
        <section class="pixel-card p-5">
          <div class="flex items-center justify-between mb-4 border-b-4 border-black pb-2">
            <div class="flex items-center gap-2">
              <span class="text-xl">🎯</span>
              <h2 class="font-['Press_Start_2P'] text-xs font-bold text-black uppercase">CATEGORIES</h2>
            </div>
          </div>

          <div class="flex flex-col gap-2.5">
            <div
              v-for="category in allCategories"
              :key="category"
              class="flex flex-wrap items-center justify-between gap-2 border-2 border-black bg-slate-50 p-2.5 shadow-[2px_2px_0px_#000]"
            >
              <label class="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  class="h-5 w-5 border-2 border-black accent-yellow-400"
                  :checked="state.selectedCategories.includes(category)"
                  @change="toggleCategory(category)"
                />
                <span class="font-['Press_Start_2P'] text-[11px] font-bold text-black">
                  {{ category }}
                </span>
              </label>

              <!-- Difficulty Buttons -->
              <div v-if="state.selectedCategories.includes(category)" class="flex gap-1">
                <button
                  v-for="diff in DIFFICULTIES"
                  :key="diff.id"
                  type="button"
                  class="border-2 border-black px-2 py-0.5 font-['Press_Start_2P'] text-[9px] uppercase shadow-[1px_1px_0px_#000] transition-all"
                  :class="
                    state.categoryDifficulties[category]?.includes(diff.id)
                      ? diff.activeClass
                      : 'bg-white text-slate-500'
                  "
                  @click="toggleCategoryDifficulty(category, diff.id)"
                >
                  {{ diff.label }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Custom Questions Panel -->
        <section class="pixel-card p-5">
          <div class="flex items-center gap-2 mb-4 border-b-4 border-black pb-2">
            <span class="text-xl">✍️</span>
            <h2 class="font-['Press_Start_2P'] text-xs font-bold text-black uppercase">CUSTOM DECK</h2>
          </div>

          <AddCustomQuestionForm />

          <ul v-if="state.customQuestions.length" class="mt-4 flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
            <li
              v-for="q in state.customQuestions"
              :key="q.id"
              class="flex items-center justify-between gap-2 border-2 border-black bg-white p-2 font-['Pixelify_Sans'] text-sm font-bold text-black"
            >
              <span class="line-clamp-1"><span>{{ CUSTOM_TYPE_ICON[q.type] }}</span> {{ q.text }}</span>
              <button
                type="button"
                class="font-bold text-red-600 hover:text-red-800 shrink-0 px-1"
                aria-label="Remove custom question"
                @click="removeCustomQuestion(q.id)"
              >
                ✕
              </button>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <!-- Start Button -->
    <button
      type="button"
      class="pixel-btn pixel-btn-yellow w-full py-4 text-base font-bold tracking-widest uppercase shadow-[6px_6px_0px_#000] disabled:opacity-40"
      :disabled="!canStart"
      @click="startGame"
    >
      ▶ START GAME ◀
    </button>
  </div>
</template>