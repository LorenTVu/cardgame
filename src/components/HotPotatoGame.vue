<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useGameStore } from '../composables/useGameStore'
import { useSound } from '../composables/useSound'
import PlayerPickerDialog from './PlayerPickerDialog.vue'
import CategoryTags from './CategoryTags.vue'

const { state, drawQuestion, passTheBuck } = useGameStore()
const { playTick, playExplosion } = useSound()

const MIN_MS = 5000
const MAX_MS = 20000

const phase = ref('idle') // 'idle' | 'ticking' | 'exploded'
const passes = ref(0)
let timer = null

const CARD_META = {
  truth: { label: '📜 TRUTH', badgeClass: 'bg-[#00e5ff] text-black font-bold' },
  dare: { label: '🔥 DARE', badgeClass: 'bg-[#ff3b70] text-white font-bold' },
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

// --- Pass the Buck ---
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
    <!-- Idle Phase -->
    <template v-if="phase === 'idle'">
      <div class="text-center">
        <span class="pixel-badge bg-[#ffe600] text-black">SURVIVAL MODE</span>
        <h1 class="pixel-title mt-2 text-2xl font-extrabold sm:text-3xl">🥔 HOT POTATO</h1>
      </div>

      <p class="max-w-xs text-center font-['Pixelify_Sans'] text-base font-bold text-slate-800 bg-white/80 border-2 border-black p-3">
        Pass the device around fast! A hidden timer will explode between <strong>5 and 20 seconds</strong>!
      </p>

      <button
        type="button"
        class="pixel-btn pixel-btn-yellow px-8 py-4 text-xs font-bold uppercase shadow-[6px_6px_0px_#000]"
        @click="start"
      >
        START ROUND 🔥
      </button>
    </template>

    <!-- Ticking Phase -->
    <template v-else-if="phase === 'ticking'">
      <div class="text-center">
        <h1 class="font-['Press_Start_2P'] text-xl font-bold text-red-600 animate-pulse">
          🔥 TICKING...
        </h1>
        <p class="font-['Pixelify_Sans'] text-sm font-bold text-slate-800 mt-1">Pass it fast!</p>
      </div>

      <button
        type="button"
        class="glow-urgent flex h-40 w-40 flex-col items-center justify-center border-4 border-black bg-[#ff2222] font-['Press_Start_2P'] text-base font-bold text-white shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1"
        @click="pass"
      >
        <span class="text-4xl mb-1">🥔</span>
        <span>PASS!</span>
      </button>

      <div class="pixel-badge bg-[#ffe600] text-black">
        PASSED <span class="font-black">{{ passes }}</span> TIMES
      </div>
    </template>

    <!-- Exploded Phase -->
    <template v-else>
      <div class="text-center">
        <span class="pixel-badge bg-red-600 text-white font-bold">BOOM! 💥</span>
        <h1 class="pixel-title mt-2 text-2xl font-extrabold sm:text-3xl">TIME'S UP!</h1>
        <p class="font-['Pixelify_Sans'] text-sm font-bold text-slate-800 mt-1">Whoever holds the device now...</p>
      </div>

      <div
        v-if="state.currentQuestion"
        class="pixel-card-dare relative w-full max-w-sm p-6 text-center"
      >
        <CategoryTags :categories="state.currentQuestion.categories" :difficulty="state.currentQuestion.difficulty" />

        <div class="mt-4 flex flex-col items-center gap-3">
          <span
            class="pixel-badge uppercase font-bold"
            :class="CARD_META[state.currentQuestion.type].badgeClass"
          >
            {{ CARD_META[state.currentQuestion.type].label }}
          </span>
          <p v-if="passedToName" class="font-['Press_Start_2P'] text-[10px] text-red-600">
            🔄 DEFLECTED TO {{ passedToName }}!
          </p>
          <p class="font-['Pixelify_Sans'] text-xl font-bold leading-relaxed text-black">
            {{ state.currentQuestion.text }}
          </p>
        </div>
      </div>

      <button
        v-if="canPassBuck"
        type="button"
        class="pixel-btn pixel-btn-white px-4 py-2 text-[10px] font-bold text-red-600"
        @click="passBuckStep = 'choosing-passer'"
      >
        🔄 PASS THE BUCK (DEFLECT)
      </button>

      <button
        type="button"
        class="pixel-btn pixel-btn-yellow w-full max-w-sm py-3.5 text-xs font-bold uppercase"
        @click="start"
      >
        NEXT ROUND →
      </button>
    </template>

    <!-- Dialogs -->
    <PlayerPickerDialog
      v-if="passBuckStep === 'choosing-passer'"
      title="PASS THE BUCK"
      subtitle="WHO'S USING PASS?"
      :players="eligiblePassers"
      @pick="pickPasser"
    />

    <PlayerPickerDialog
      v-if="passBuckStep === 'choosing-target'"
      title="PASS THE BUCK"
      subtitle="WHO DO THEY PASS TO?"
      :players="targetsForPasser"
      @pick="pickPassBuckTarget"
    />
  </div>
</template>