<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../composables/useGameStore'
import SpinWheel from './SpinWheel.vue'
import HotPotatoGame from './HotPotatoGame.vue'
import PlayerPickerDialog from './PlayerPickerDialog.vue'

const {
  state,
  currentPlayer,
  remainingCount,
  drawQuestion,
  drawWildCard,
  drawMysteryBox,
  chooseNextPlayer,
  passTheBuck,
  nextTurn,
  backToSetup,
  resolveSpin,
} = useGameStore()

const prevPlayerName = computed(() => {
  const n = state.players.length
  if (n < 2) return ''
  return state.players[(state.currentPlayerIndex - 1 + n) % n]
})

const nextPlayerName = computed(() => {
  const n = state.players.length
  if (n < 2) return ''
  return state.players[(state.currentPlayerIndex + 1) % n]
})

const CARD_META = {
  truth: { label: '📜 Truth', badgeClass: 'badge-secondary' },
  dare: { label: '🔥 Dare', badgeClass: 'badge-primary' },
  wild: { label: '🎲 Wild Card', badgeClass: 'badge-success' },
}

const currentCardBadge = computed(() => {
  const q = state.currentQuestion
  if (!q) return null
  const base = CARD_META[q.type]
  if (q.isMystery) {
    return { label: `🎁 Mystery · ${base.label.replace(/^\S+\s/, '')}`, badgeClass: 'badge-neutral' }
  }
  return base
})

const otherPlayers = computed(() =>
  state.players
    .map((name, index) => ({ name, index }))
    .filter((p) => p.index !== state.currentPlayerIndex),
)

const passedToName = computed(() => {
  const to = state.currentQuestion?.passedTo
  return to == null ? '' : state.players[to]
})

const canPassBuck = computed(
  () =>
    !!state.currentQuestion &&
    !state.currentQuestion.isMystery &&
    state.currentQuestion.passedTo == null &&
    !state.passBuckUsed.has(state.currentPlayerIndex) &&
    otherPlayers.value.length > 0,
)

// --- Spin Wheel confirmation ---
const pendingWinnerIndex = ref(null)
const pendingWinnerName = ref('')

function onWheelLanded(index) {
  pendingWinnerIndex.value = index
  pendingWinnerName.value = state.players[index]
}

function confirmWinner() {
  resolveSpin(pendingWinnerIndex.value)
  pendingWinnerIndex.value = null
  pendingWinnerName.value = ''
}

// --- Mystery Box ---
const showNextPlayerPicker = ref(false)

function completeMysteryBox() {
  if (state.players.length < 2) {
    state.currentQuestion = null
    nextTurn()
    return
  }
  showNextPlayerPicker.value = true
}

function pickNextPlayer(index) {
  chooseNextPlayer(index)
  showNextPlayerPicker.value = false
}

// --- Pass the Buck ---
const showPassBuckPicker = ref(false)

function pickPassBuckTarget(index) {
  passTheBuck(state.currentPlayerIndex, index)
  showPassBuckPicker.value = false
}
</script>

<template>
  <div class="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-4 py-8">
    <header class="flex items-center justify-between">
      <button type="button" class="btn btn-sm btn-outline font-display" @click="backToSetup">
        ← Setup
      </button>
      <div class="font-display badge badge-accent">
        {{ remainingCount.truth }}T · {{ remainingCount.dare }}D left
      </div>
    </header>

    <template v-if="state.gameStyle === 'random' && state.awaitingSpin">
      <div class="flex flex-1 flex-col items-center justify-center gap-8 py-4">
        <h1 class="font-display title-outline text-center text-2xl text-white">
          Spin for<br />Next Player
        </h1>
        <SpinWheel :players="state.players" @landed="onWheelLanded" />
      </div>

      <div
        v-if="pendingWinnerName"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral/40 p-4"
      >
        <Transition name="pop" appear>
          <div
            class="rounded-box border-4 border-neutral/40 bg-base-200 p-8 text-center shadow-[0_8px_0_0_rgba(43,42,85,0.2)]"
          >
            <p class="font-display text-sm uppercase tracking-widest text-secondary">Up Next</p>
            <h2 class="font-display title-outline mt-2 text-4xl text-white">{{ pendingWinnerName }}</h2>
            <button type="button" class="btn btn-lg btn-success font-display mt-6" @click="confirmWinner">
              Let's Go! 🎉
            </button>
          </div>
        </Transition>
      </div>
    </template>

    <template v-else-if="state.gameStyle === 'hotpotato'">
      <HotPotatoGame />
    </template>

    <template v-else>
      <div class="text-center">
        <p class="font-display text-sm uppercase tracking-widest text-secondary">Current Turn</p>
        <div class="mt-2 flex items-center justify-center gap-3">
          <span
            v-if="state.gameStyle === 'order' && prevPlayerName"
            class="font-display text-xs text-base-content/40"
          >
            ← {{ prevPlayerName }}
          </span>
          <h1 class="font-display title-outline text-4xl text-white">{{ currentPlayer }}</h1>
          <span
            v-if="state.gameStyle === 'order' && nextPlayerName"
            class="font-display text-xs text-base-content/40"
          >
            {{ nextPlayerName }} →
          </span>
        </div>
      </div>

      <div class="rounded-box min-h-64 flex-1 border-4 border-neutral/40 bg-base-200 shadow-[0_8px_0_0_rgba(43,42,85,0.15)]">
        <div class="flex h-full items-center justify-center p-6 text-center">
          <Transition name="pop" mode="out-in">
            <div v-if="state.currentQuestion" :key="state.currentQuestion.id" class="flex flex-col items-center gap-4">
              <span class="font-display badge badge-lg px-4 py-4" :class="currentCardBadge.badgeClass">
                {{ currentCardBadge.label }}
              </span>
              <p v-if="passedToName" class="font-display text-sm text-error">
                🔄 Passed to {{ passedToName }}!
              </p>
              <p class="text-2xl font-medium leading-snug">{{ state.currentQuestion.text }}</p>
            </div>
            <p v-else key="empty" class="font-display text-base leading-relaxed text-base-content/60">
              Pick Truth, Dare,<br />or something wilder
            </p>
          </Transition>
        </div>
      </div>

      <div v-if="canPassBuck" class="flex justify-center">
        <button
          type="button"
          class="btn btn-outline btn-error btn-sm font-display"
          @click="showPassBuckPicker = true"
        >
          🔄 Pass the Buck
        </button>
      </div>

      <template v-if="state.currentQuestion?.isMystery">
        <button type="button" class="btn btn-lg btn-success font-display" @click="completeMysteryBox">
          ✅ Completed! Choose Who's Next
        </button>
      </template>

      <template v-else>
        <div class="grid grid-cols-2 gap-4">
          <button type="button" class="btn btn-lg btn-secondary font-display" @click="drawQuestion('truth')">
            📜 Truth
          </button>
          <button type="button" class="btn btn-lg btn-primary font-display" @click="drawQuestion('dare')">
            🔥 Dare
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <button type="button" class="btn btn-lg btn-success font-display" @click="drawWildCard">
            🎲 Wild Card
          </button>
          <button type="button" class="btn btn-lg btn-neutral font-display" @click="drawMysteryBox">
            🎁 Mystery Box
          </button>
        </div>

        <button type="button" class="btn btn-lg btn-warning font-display" @click="nextTurn">
          Next Player →
        </button>
      </template>
    </template>

    <PlayerPickerDialog
      v-if="showNextPlayerPicker"
      title="Assign Next Turn"
      subtitle="Pick Anyone!"
      :players="otherPlayers"
      @pick="pickNextPlayer"
    />

    <PlayerPickerDialog
      v-if="showPassBuckPicker"
      title="Pass the Buck"
      subtitle="Who has to do it instead?"
      :players="otherPlayers"
      @pick="pickPassBuckTarget"
    />
  </div>
</template>