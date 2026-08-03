import { reactive, computed } from 'vue'
import questionsData from '../data/questions.json'

const allCategories = [...new Set(questionsData.flatMap((q) => q.categories))].sort()

const state = reactive({
  screen: 'setup', // 'setup' | 'game'
  players: [],
  selectedCategories: [],
  gameStyle: 'order', // 'order' | 'random' | 'hotpotato'
  currentPlayerIndex: 0,
  awaitingSpin: false,
  drawnIds: new Set(),
  currentQuestion: null,
})

function needsSpinFor(playerCount) {
  return state.gameStyle === 'random' && playerCount > 1
}

function addPlayer(name) {
  const trimmed = name.trim()
  if (!trimmed) return
  state.players.push(trimmed)
}

function removePlayer(index) {
  state.players.splice(index, 1)
}

function toggleCategory(category) {
  const i = state.selectedCategories.indexOf(category)
  if (i === -1) state.selectedCategories.push(category)
  else state.selectedCategories.splice(i, 1)
}

function setGameStyle(gameStyle) {
  state.gameStyle = gameStyle
}

const canStart = computed(
  () => state.players.length >= 1 && state.selectedCategories.length >= 1,
)

function startGame() {
  if (!canStart.value) return
  if (needsSpinFor(state.players.length)) {
    state.currentPlayerIndex = null
    state.awaitingSpin = true
  } else {
    state.currentPlayerIndex = 0
    state.awaitingSpin = false
  }
  state.drawnIds.clear()
  state.currentQuestion = null
  state.screen = 'game'
}

function backToSetup() {
  state.screen = 'setup'
  state.currentQuestion = null
}

function resolveSpin(index) {
  state.currentPlayerIndex = index
  state.awaitingSpin = false
}

const currentPlayer = computed(() => state.players[state.currentPlayerIndex] ?? '')

function questionsPool(type) {
  return questionsData.filter(
    (q) =>
      q.type === type &&
      q.categories.some((c) => state.selectedCategories.includes(c)) &&
      !state.drawnIds.has(q.id),
  )
}

const remainingCount = computed(() => ({
  truth: questionsPool('truth').length,
  dare: questionsPool('dare').length,
}))

function drawQuestion(type) {
  let pool = questionsPool(type)
  if (pool.length === 0) {
    // exhausted this round — reset drawn ids for this type and start over
    const drawnOfOtherType = questionsData.filter(
      (q) => q.type !== type && state.drawnIds.has(q.id),
    )
    state.drawnIds = new Set(drawnOfOtherType.map((q) => q.id))
    pool = questionsPool(type)
  }
  if (pool.length === 0) {
    state.currentQuestion = null
    return
  }
  const question = pool[Math.floor(Math.random() * pool.length)]
  state.drawnIds.add(question.id)
  state.currentQuestion = question
}

function drawWildCard() {
  const others = state.players.filter((_, i) => i !== state.currentPlayerIndex)
  const asker = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null
  const text = asker
    ? `${asker} asks you anything — no rules!`
    : 'Someone in the room asks you anything — no rules!'
  state.currentQuestion = { id: `wild-${state.players.length}-${Math.random()}`, type: 'wild', text }
}

// Mystery Box ignores the category filter entirely — any question, any category.
function drawMysteryBox() {
  let pool = questionsData.filter((q) => !state.drawnIds.has(q.id))
  if (pool.length === 0) {
    state.drawnIds.clear()
    pool = questionsData
  }
  const question = pool[Math.floor(Math.random() * pool.length)]
  state.drawnIds.add(question.id)
  state.currentQuestion = { ...question, isMystery: true }
}

// Lets the current player hand the next turn to anyone, bypassing order/random-spin for one round.
function chooseNextPlayer(index) {
  state.currentPlayerIndex = index
  state.awaitingSpin = false
  state.currentQuestion = null
}

function nextTurn() {
  state.currentQuestion = null
  if (state.players.length === 0) return
  if (needsSpinFor(state.players.length)) {
    state.awaitingSpin = true
    state.currentPlayerIndex = null
  } else {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
  }
}

export function useGameStore() {
  return {
    state,
    allCategories,
    canStart,
    currentPlayer,
    remainingCount,
    addPlayer,
    removePlayer,
    toggleCategory,
    setGameStyle,
    startGame,
    backToSetup,
    resolveSpin,
    drawQuestion,
    drawWildCard,
    drawMysteryBox,
    chooseNextPlayer,
    nextTurn,
  }
}