<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../composables/useGameStore'
import { useSound } from '../composables/useSound'
import SpinWheel from './SpinWheel.vue'
import HotPotatoGame from './HotPotatoGame.vue'
import NeverHaveIEverGame from './NeverHaveIEverGame.vue'
import PlayerPickerDialog from './PlayerPickerDialog.vue'
import AddCustomQuestionForm from './AddCustomQuestionForm.vue'
import CategoryTags from './CategoryTags.vue'

const {
  state,
  currentPlayer,
  remainingCount,
  remainingNever,
  drawQuestion,
  drawWildCard,
  drawMysteryBox,
  chooseNextPlayer,
  passTheBuck,
  recordCompletion,
  generateForfeit,
  nextTurn,
  backToSetup,
  resolveSpin,
  toggleSound,
} = useGameStore()

const { playReveal, playMystery, playLanding, playSuccess, playForfeit } = useSound()

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

const currentScores = computed(() => {
  const player = currentPlayer.value
  return state.playerScores[player] || { completed: 0, forfeits: 0 }
})

const sortedLeaderboard = computed(() => {
  return [...state.players]
    .map((name) => ({
      name,
      completed: state.playerScores[name]?.completed || 0,
      forfeits: state.playerScores[name]?.forfeits || 0,
    }))
    .sort((a, b) => b.completed - a.completed)
})

const CARD_META = {
  truth: { label: '📜 TRUTH', badgeClass: 'bg-[#00e5ff] text-black font-bold' },
  dare: { label: '🔥 DARE', badgeClass: 'bg-[#ff3b70] text-white font-bold' },
  wild: { label: '🎲 WILD CARD', badgeClass: 'bg-[#39ff14] text-black font-bold' },
}

const currentCardBadge = computed(() => {
  const q = state.currentQuestion
  if (!q) return null
  const base = CARD_META[q.type] || CARD_META.truth
  if (q.isMystery) {
    return { label: `🎁 MYSTERY · ${base.label.replace(/^\S+\s/, '')}`, badgeClass: 'bg-[#b03bff] text-white font-bold' }
  }
  return base
})

const cardGlassClass = computed(() => {
  if (state.activeForfeit) return 'pixel-card-dare'
  const q = state.currentQuestion
  if (!q) return 'pixel-card'
  if (q.isMystery) return 'pixel-card-mystery'
  if (q.type === 'truth') return 'pixel-card-truth'
  if (q.type === 'dare') return 'pixel-card-dare'
  if (q.type === 'wild') return 'pixel-card-wild'
  return 'pixel-card'
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
    !state.activeForfeit &&
    !!state.currentQuestion &&
    !state.currentQuestion.isMystery &&
    state.currentQuestion.passedTo == null &&
    !state.passBuckUsed.has(state.currentPlayerIndex) &&
    otherPlayers.value.length > 0,
)

function handleDraw(type) {
  drawQuestion(type)
  playReveal()
}

function handleDrawWildCard() {
  drawWildCard()
  playReveal()
}

function handleDrawMysteryBox() {
  drawMysteryBox()
  playMystery()
}

function handleRedrawCurrent() {
  const q = state.currentQuestion
  if (!q) return
  if (q.isMystery) {
    handleDrawMysteryBox()
  } else if (q.type === 'wild') {
    handleDrawWildCard()
  } else {
    handleDraw(q.type)
  }
}

function handleComplete() {
  playSuccess()
  recordCompletion()
}

function handleRefuseForfeit() {
  playForfeit()
  generateForfeit()
}

// --- Spin Wheel confirmation ---
const pendingWinnerIndex = ref(null)
const pendingWinnerName = ref('')

function onWheelLanded(index) {
  pendingWinnerIndex.value = index
  pendingWinnerName.value = state.players[index]
  playLanding()
}

function confirmWinner() {
  resolveSpin(pendingWinnerIndex.value)
  pendingWinnerIndex.value = null
  pendingWinnerName.value = ''
}

// --- Mystery Box ---
const showNextPlayerPicker = ref(false)

function completeMysteryBox() {
  playSuccess()
  if (state.players.length < 2) {
    recordCompletion()
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

// Modals
const showAddCustom = ref(false)
const showLeaderboard = ref(false)
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-5 md:max-w-3xl">
    <!-- Top Header -->
    <header class="pixel-card flex items-center justify-between gap-2 p-3">
      <button
        type="button"
        class="pixel-btn pixel-btn-yellow px-3 py-1 text-[11px] font-bold"
        @click="backToSetup"
      >
        ← SETUP
      </button>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="pixel-btn pixel-btn-yellow px-2 py-1 text-xs font-bold"
          title="High Scores / Leaderboard"
          @click="showLeaderboard = true"
        >
          🏆 SCORES
        </button>

        <button
          type="button"
          class="pixel-btn pixel-btn-white px-2 py-1 text-xs font-bold"
          :aria-label="state.soundEnabled ? 'Mute sound' : 'Unmute sound'"
          @click="toggleSound"
        >
          {{ state.soundEnabled ? '🔊' : '🔇' }}
        </button>

        <button
          type="button"
          class="pixel-btn pixel-btn-white px-2 py-1 text-xs font-bold"
          aria-label="Add custom question"
          @click="showAddCustom = true"
        >
          ➕
        </button>
      </div>
    </header>

    <!-- Game Style: Random Spin Wheel -->
    <template v-if="state.gameStyle === 'random' && state.awaitingSpin">
      <div class="flex flex-1 flex-col items-center justify-center gap-6 py-2">
        <div class="text-center">
          <span class="pixel-badge bg-[#ffe600] text-black">RANDOM WHEEL</span>
          <h1 class="pixel-title mt-2 text-2xl font-extrabold sm:text-3xl">
            SPIN FOR PLAYER!
          </h1>
        </div>
        <SpinWheel :players="state.players" @landed="onWheelLanded" />
      </div>

      <!-- Spin Winner Modal -->
      <div
        v-if="pendingWinnerName"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      >
        <Transition name="pop" appear>
          <div
            class="pixel-card-yellow w-full max-w-sm p-6 text-center shadow-[8px_8px_0px_#000]"
          >
            <p class="font-['Press_Start_2P'] text-[10px] uppercase text-black font-bold">PLAYER CHOSEN!</p>
            <h2 class="pixel-title mt-3 text-3xl font-extrabold text-black">{{ pendingWinnerName }}</h2>
            <button
              type="button"
              class="pixel-btn pixel-btn-yellow mt-6 w-full py-3 text-xs font-bold uppercase"
              @click="confirmWinner"
            >
              LET'S GO! 🎉
            </button>
          </div>
        </Transition>
      </div>
    </template>

    <!-- Game Style: Hot Potato -->
    <template v-else-if="state.gameStyle === 'hotpotato'">
      <HotPotatoGame />
    </template>

    <!-- Game Style: Never Have I Ever -->
    <template v-else-if="state.gameStyle === 'neverhaveiever'">
      <NeverHaveIEverGame />
    </template>

    <!-- Standard Gameplay -->
    <template v-else>
      <!-- Current Player & Stats Banner -->
      <div class="pixel-card p-3 text-center">
        <div class="flex items-center justify-between">
          <span
            v-if="state.gameStyle === 'order' && prevPlayerName"
            class="font-['Press_Start_2P'] text-[9px] text-slate-600"
          >
            ← {{ prevPlayerName }}
          </span>
          <div class="mx-auto text-center">
            <p class="font-['Press_Start_2P'] text-[9px] text-slate-600 uppercase">CURRENT TURN</p>
            <h1 class="pixel-title text-2xl font-extrabold text-[#ffe600] sm:text-3xl">
              {{ currentPlayer }}
            </h1>
          </div>
          <span
            v-if="state.gameStyle === 'order' && nextPlayerName"
            class="font-['Press_Start_2P'] text-[9px] text-slate-600"
          >
            {{ nextPlayerName }} →
          </span>
        </div>

        <!-- Live Score Pills for current player -->
        <div class="mt-2 flex justify-center gap-3">
          <span class="pixel-badge bg-[#39ff14] text-black">⭐ {{ currentScores.completed }} STARS</span>
          <span class="pixel-badge bg-[#ff3b70] text-white">💀 {{ currentScores.forfeits }} FORFEITS</span>
        </div>
      </div>

      <!-- Main Question OR Forfeit Punishment Card -->
      <div
        class="relative flex min-h-[250px] flex-1 flex-col items-center justify-center p-6 text-center overflow-hidden"
        :class="cardGlassClass"
      >
        <CategoryTags
          v-if="state.currentQuestion && !state.activeForfeit"
          :categories="state.currentQuestion.categories"
          :difficulty="state.currentQuestion.difficulty"
        />

        <div class="flex h-full w-full items-center justify-center p-2">
          <Transition name="pop" mode="out-in">
            <!-- Active Forfeit / Punishment Display -->
            <div v-if="state.activeForfeit" key="forfeit" class="flex flex-col items-center gap-3 max-w-md">
              <span class="pixel-badge bg-[#ff3b70] text-white font-bold">
                💀 PENALTY / FORFEIT
              </span>
              <p class="font-['Pixelify_Sans'] text-xl sm:text-2xl font-bold leading-relaxed text-black">
                {{ state.activeForfeit }}
              </p>
            </div>

            <!-- Active Question Display -->
            <div v-else-if="state.currentQuestion" :key="state.currentQuestion.id" class="flex flex-col items-center gap-3 max-w-md">
              <span
                class="pixel-badge uppercase font-bold"
                :class="currentCardBadge.badgeClass"
              >
                {{ currentCardBadge.label }}
              </span>
              <p v-if="passedToName" class="font-['Press_Start_2P'] text-[10px] text-red-600">
                🔄 DEFLECTED TO {{ passedToName }}!
              </p>
              <p class="font-['Pixelify_Sans'] text-xl sm:text-2xl font-bold leading-relaxed text-black">
                {{ state.currentQuestion.text }}
              </p>
            </div>

            <!-- Empty Deck Card -->
            <div v-else key="empty" class="flex flex-col items-center gap-2">
              <span class="text-4xl">🕹️</span>
              <p class="font-['Pixelify_Sans'] text-lg font-bold leading-relaxed text-slate-700">
                DRAW A TRUTH OR DARE,<br />OR PICK A WILD CARD!
              </p>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Pass the Buck Button -->
      <div v-if="canPassBuck" class="flex justify-center">
        <button
          type="button"
          class="pixel-btn pixel-btn-white px-4 py-2 text-[10px] font-bold text-red-600"
          @click="showPassBuckPicker = true"
        >
          🔄 PASS THE BUCK (DEFLECT)
        </button>
      </div>

      <!-- Action Buttons -->
      <!-- Case 1: Displaying a Forfeit -->
      <template v-if="state.activeForfeit">
        <button
          type="button"
          class="pixel-btn pixel-btn-yellow w-full py-4 text-xs font-bold uppercase"
          @click="nextTurn"
        >
          ✅ PENALTY DONE → NEXT TURN
        </button>
      </template>

      <!-- Case 2: Mystery Box Completion -->
      <template v-else-if="state.currentQuestion?.isMystery">
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="pixel-btn pixel-btn-green py-3.5 text-xs font-bold uppercase"
            @click="completeMysteryBox"
          >
            ⭐ COMPLETED!
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn-pink py-3.5 text-xs font-bold uppercase"
            @click="handleRefuseForfeit"
          >
            💀 REFUSE / FORFEIT
          </button>
        </div>

        <button
          type="button"
          class="pixel-btn pixel-btn-purple w-full py-3 text-xs font-bold uppercase"
          @click="handleDrawMysteryBox"
        >
          🎁 DRAW ANOTHER MYSTERY
        </button>
      </template>

      <!-- Case 3: Active Card Drawn — Full Options (Complete, Forfeit, Redraw, Switch Card) -->
      <template v-else-if="state.currentQuestion">
        <!-- Result Buttons -->
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="pixel-btn pixel-btn-green py-3.5 text-xs font-bold uppercase"
            @click="handleComplete"
          >
            ⭐ COMPLETED! (+1 STAR)
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn-pink py-3.5 text-xs font-bold uppercase"
            @click="handleRefuseForfeit"
          >
            💀 REFUSE / FORFEIT
          </button>
        </div>

        <!-- Switch / Redraw Card Bar -->
        <div class="pixel-card p-3 bg-[#fffde6]">
          <p class="font-['Press_Start_2P'] text-[9px] uppercase text-slate-800 text-center mb-2 font-bold">
            🔄 WANT A DIFFERENT CARD?
          </p>
          <div class="grid grid-cols-4 gap-2">
            <button
              type="button"
              class="pixel-btn pixel-btn-cyan py-2 text-[9px] font-bold uppercase"
              @click="handleDraw('truth')"
            >
              📜 TRUTH
            </button>
            <button
              type="button"
              class="pixel-btn pixel-btn-pink py-2 text-[9px] font-bold uppercase"
              @click="handleDraw('dare')"
            >
              🔥 DARE
            </button>
            <button
              type="button"
              class="pixel-btn pixel-btn-green py-2 text-[9px] font-bold uppercase"
              @click="handleDrawWildCard"
            >
              🎲 WILD
            </button>
            <button
              type="button"
              class="pixel-btn pixel-btn-purple py-2 text-[9px] font-bold uppercase"
              @click="handleDrawMysteryBox"
            >
              🎁 MYSTERY
            </button>
          </div>
        </div>

        <button
          type="button"
          class="pixel-btn pixel-btn-yellow w-full py-3 text-xs font-bold uppercase"
          @click="nextTurn"
        >
          SKIP TO NEXT PLAYER →
        </button>
      </template>

      <!-- Case 4: No Card Drawn Yet -->
      <template v-else>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="pixel-btn pixel-btn-cyan py-4 text-xs font-bold uppercase"
            @click="handleDraw('truth')"
          >
            📜 TRUTH
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn-pink py-4 text-xs font-bold uppercase"
            @click="handleDraw('dare')"
          >
            🔥 DARE
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="pixel-btn pixel-btn-green py-3.5 text-xs font-bold uppercase"
            @click="handleDrawWildCard"
          >
            🎲 WILD CARD
          </button>

          <button
            type="button"
            class="pixel-btn pixel-btn-purple py-3.5 text-xs font-bold uppercase"
            @click="handleDrawMysteryBox"
          >
            🎁 MYSTERY BOX
          </button>
        </div>
      </template>
    </template>

    <!-- Leaderboard Modal -->
    <div v-if="showLeaderboard" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Transition name="pop" appear>
        <div class="pixel-card-yellow w-full max-w-md p-6 shadow-[8px_8px_0px_#000]">
          <div class="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🏆</span>
              <h2 class="font-['Press_Start_2P'] text-xs font-bold text-black uppercase">HIGH SCORES</h2>
            </div>
            <button
              type="button"
              class="font-bold text-black hover:text-red-600 text-lg"
              @click="showLeaderboard = false"
            >
              ✕
            </button>
          </div>

          <div class="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            <div
              v-for="(p, i) in sortedLeaderboard"
              :key="p.name"
              class="flex items-center justify-between border-2 border-black bg-white p-3 font-['Pixelify_Sans'] text-base font-bold text-black"
            >
              <div class="flex items-center gap-2">
                <span class="font-['Press_Start_2P'] text-[10px] text-amber-500">#{{ i + 1 }}</span>
                <span>{{ p.name }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="pixel-badge bg-[#39ff14] text-black">⭐ {{ p.completed }}</span>
                <span class="pixel-badge bg-[#ff3b70] text-white">💀 {{ p.forfeits }}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="pixel-btn pixel-btn-yellow mt-5 w-full py-2.5 text-xs font-bold uppercase"
            @click="showLeaderboard = false"
          >
            BACK TO GAME
          </button>
        </div>
      </Transition>
    </div>

    <!-- Dialogs & Add Custom Modal -->
    <PlayerPickerDialog
      v-if="showNextPlayerPicker"
      title="ASSIGN NEXT TURN"
      subtitle="PICK ANYONE!"
      :players="otherPlayers"
      @pick="pickNextPlayer"
    />

    <PlayerPickerDialog
      v-if="showPassBuckPicker"
      title="PASS THE BUCK"
      subtitle="WHO DOES IT INSTEAD?"
      :players="otherPlayers"
      @pick="pickPassBuckTarget"
    />

    <div v-if="showAddCustom" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Transition name="pop" appear>
        <div class="pixel-card-yellow w-full max-w-sm p-5 shadow-[8px_8px_0px_#000]">
          <p class="font-['Press_Start_2P'] mb-2 text-[10px] font-bold text-black uppercase">CREATE QUESTION</p>
          <AddCustomQuestionForm @added="showAddCustom = false" />
          <button
            type="button"
            class="pixel-btn pixel-btn-white mt-3 w-full py-2 text-[10px] font-bold"
            @click="showAddCustom = false"
          >
            CANCEL
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>