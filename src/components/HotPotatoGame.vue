<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useGameStore } from '../composables/useGameStore'
import { useSound } from '../composables/useSound'
import PlayerPickerDialog from './PlayerPickerDialog.vue'

const { state, drawQuestion, passTheBuck } = useGameStore()
const { playTick, playExplosion } = useSound()

const MIN_MS = 5000
const MAX_MS = 20000

const phase = ref('idle') // 'idle' | 'ticking' | 'exploded'
const passes = ref(0)
let timer = null

const CARD_META = {
  truth: { label: '📜 Truth', badgeClass: 'badge-secondary' },
  dare: { label: '🔥 Dare', badgeClass: 'badge-primary' },
}

const passedToName = computed(() => {
  const to = state.currentQuestion?.passedTo
  return to == null ? '' : state.players[to]
})

const eligiblePassers = computed(() =>
  state.players
    .map((name, index) => ({ name, index }))
    .filter((p) => !state.passBuckUsed.has(p.index)),
)

const canPassBuck = computed(
  () =>
    !!state.currentQuestion &&
    state.currentQuestion.passedTo == null &&
    state.players.length > 1 &&
    eligiblePassers.value.length > 0,
)

// --- Pass the Buck (two-step: who's using it, then who it goes to) ---
const passBuckStep = ref('none') // 'none' | 'choosing-passer' | 'choosing-target'
const chosenPasserIndex = ref(null)

const targetsForPasser = computed(() =>
  state.players
    .map((name, index) => ({ name, index }))
    .filter((p) => p.index !== chosenPasserIndex.value),
)

function pickPasser(index) {
  chosenPasserIndex.value = index
  passBuckStep.value = 'choosing-target'
}

function pickPassBuckTarget(index) {
  passTheBuck(chosenPasserIndex.value, index)
  passBuckStep.value = 'none'
  chosenPasserIndex.value = null
}

function start() {
  phase.value = 'ticking'
  passes.value = 0
  state.currentQuestion = null
  const duration = MIN_MS + Math.random() * (MAX_MS - MIN_MS)
  timer = setTimeout(explode, duration)
}

function pass() {
  passes.value++
  playTick()
}

function explode() {
  timer = null
  phase.value = 'exploded'
  drawQuestion(Math.random() < 0.5 ? 'truth' : 'dare')
  playExplosion()
}

function cancelTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

onUnmounted(cancelTimer)
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-6 py-4">
    <template v-if="phase === 'idle'">
      <h1 class="font-display title-outline text-center text-3xl text-white">🥔 Hot Potato</h1>
      <p class="font-display max-w-xs text-center text-base-content/70">
        Pass the device around fast — a hidden timer will go off somewhere between 5 and 20
        seconds. Whoever's holding it when it does must do a Truth or Dare!
      </p>
      <button type="button" class="btn btn-lg btn-error font-display" @click="start">
        Start Round
      </button>
    </template>

    <template v-else-if="phase === 'ticking'">
      <h1 class="font-display title-outline animate-pulse text-center text-2xl text-white">
        🔥 Passing...
      </h1>
      <p class="font-display text-center text-base-content/70">
        Pass it fast — nobody knows when it'll go off!
      </p>
      <button
        type="button"
        class="btn btn-circle btn-error font-display glow-urgent h-40 w-40 text-lg"
        @click="pass"
      >
        🥔 Pass!
      </button>
      <p class="font-display text-sm text-base-content/50">Passed {{ passes }} times</p>
    </template>

    <template v-else>
      <h1 class="font-display title-outline text-center text-3xl text-white">💥 Time's Up!</h1>
      <p class="font-display text-center text-secondary">Whoever's holding it now...</p>
      <div
        v-if="state.currentQuestion"
        class="rounded-box w-full max-w-sm border-4 border-neutral/40 bg-base-200 p-6 text-center shadow-[0_8px_0_0_rgba(43,42,85,0.15)]"
      >
        <span
          class="font-display badge badge-lg px-4 py-4"
          :class="CARD_META[state.currentQuestion.type].badgeClass"
        >
          {{ CARD_META[state.currentQuestion.type].label }}
        </span>
        <p v-if="passedToName" class="font-display mt-2 text-sm text-error">
          🔄 Passed to {{ passedToName }}!
        </p>
        <p class="mt-4 text-xl font-medium leading-snug">{{ state.currentQuestion.text }}</p>
      </div>

      <button
        v-if="canPassBuck"
        type="button"
        class="btn btn-outline btn-error btn-sm font-display"
        @click="passBuckStep = 'choosing-passer'"
      >
        🔄 Pass the Buck
      </button>

      <button type="button" class="btn btn-lg btn-warning font-display" @click="start">
        Next Round →
      </button>
    </template>

    <PlayerPickerDialog
      v-if="passBuckStep === 'choosing-passer'"
      title="Pass the Buck"
      subtitle="Who's using their pass?"
      :players="eligiblePassers"
      @pick="pickPasser"
    />

    <PlayerPickerDialog
      v-if="passBuckStep === 'choosing-target'"
      title="Pass the Buck"
      subtitle="Who do they pass it to?"
      :players="targetsForPasser"
      @pick="pickPassBuckTarget"
    />
  </div>
</template>