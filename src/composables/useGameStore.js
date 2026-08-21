import { reactive, computed, watch } from 'vue'
import questionsData from '../data/questions.json'
import neverHaveIEverData from '../data/neverHaveIEver.json'

const allCategories = [...new Set(questionsData.flatMap((q) => q.categories))].sort()
const allDifficulties = ['easy', 'medium', 'hard']

const STORAGE_KEY = 'truthOrDareState'

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const persisted = loadPersisted()

const defaultCategoryDifficulties = Object.fromEntries(
  allCategories.map((c) => [c, [...allDifficulties]]),
)

const state = reactive({
  screen: persisted?.screen ?? 'setup', // 'setup' | 'game'
  players: persisted?.players ?? [],
  selectedCategories: (persisted?.selectedCategories ?? []).filter((c) => allCategories.includes(c)),
  // Which difficulties count as "on" for each category — defaults to all three.
  categoryDifficulties: { ...defaultCategoryDifficulties, ...(persisted?.categoryDifficulties ?? {}) },
  neverHaveIEverDifficulties: persisted?.neverHaveIEverDifficulties ?? [...allDifficulties],
  gameStyle: persisted?.gameStyle ?? 'order', // 'order' | 'random' | 'hotpotato' | 'neverhaveiever'
  currentPlayerIndex: persisted?.currentPlayerIndex ?? 0,
  awaitingSpin: persisted?.awaitingSpin ?? false,
  drawnIds: new Set(persisted?.drawnIds ?? []),
  neverDrawnIds: new Set(persisted?.neverDrawnIds ?? []),
  currentQuestion: persisted?.currentQuestion ?? null,
  currentNeverStatement: persisted?.currentNeverStatement ?? null,
  passBuckUsed: new Set(persisted?.passBuckUsed ?? []),
  customQuestions: persisted?.customQuestions ?? [],
  soundEnabled: persisted?.soundEnabled ?? true,
})

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        screen: state.screen,
        players: state.players,
        selectedCategories: state.selectedCategories,
        categoryDifficulties: state.categoryDifficulties,
        neverHaveIEverDifficulties: state.neverHaveIEverDifficulties,
        gameStyle: state.gameStyle,
        currentPlayerIndex: state.currentPlayerIndex,
        awaitingSpin: state.awaitingSpin,
        drawnIds: [...state.drawnIds],
        neverDrawnIds: [...state.neverDrawnIds],
        currentQuestion: state.currentQuestion,
        currentNeverStatement: state.currentNeverStatement,
        passBuckUsed: [...state.passBuckUsed],
        customQuestions: state.customQuestions,
        soundEnabled: state.soundEnabled,
      }),
    )
  } catch {
    // Storage unavailable or full — the game still works, it just won't survive a refresh.
  }
}

watch(state, saveState, { deep: true })

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

function toggleCategoryDifficulty(category, difficulty) {
  const list = state.categoryDifficulties[category]
  if (!list) return
  const i = list.indexOf(difficulty)
  if (i === -1) list.push(difficulty)
  else list.splice(i, 1)
}

function toggleNeverDifficulty(difficulty) {
  const list = state.neverHaveIEverDifficulties
  const i = list.indexOf(difficulty)
  if (i === -1) list.push(difficulty)
  else list.splice(i, 1)
}

function setGameStyle(gameStyle) {
  state.gameStyle = gameStyle
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled
}

const canStart = computed(() => {
  if (state.players.length === 0) return false
  if (state.gameStyle === 'neverhaveiever') return state.neverHaveIEverDifficulties.length > 0
  return (
    state.selectedCategories.length >= 1 &&
    state.selectedCategories.some((c) => state.categoryDifficulties[c]?.length > 0)
  )
})

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
  state.neverDrawnIds.clear()
  state.passBuckUsed.clear()
  state.currentQuestion = null
  state.currentNeverStatement = null
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

function allQuestions() {
  return [...questionsData, ...state.customQuestions.filter((q) => q.type !== 'never')]
}

function questionsPool(type) {
  return allQuestions().filter(
    (q) =>
      q.type === type &&
      // Player-authored questions are always in play, however the category filter is set.
      (q.categories[0] === 'Custom' ||
        q.categories.some(
          (c) =>
            state.selectedCategories.includes(c) &&
            state.categoryDifficulties[c]?.includes(q.difficulty),
        )) &&
      !state.drawnIds.has(q.id),
  )
}

const remainingCount = computed(() => ({
  truth: questionsPool('truth').length,
  dare: questionsPool('dare').length,
}))

const remainingNever = computed(() => neverPool().length)

function drawQuestion(type) {
  let pool = questionsPool(type)
  if (pool.length === 0) {
    // exhausted this round — reset drawn ids for this type and start over
    const drawnOfOtherType = allQuestions().filter(
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
  let pool = allQuestions().filter((q) => !state.drawnIds.has(q.id))
  if (pool.length === 0) {
    state.drawnIds.clear()
    pool = allQuestions()
  }
  const question = pool[Math.floor(Math.random() * pool.length)]
  state.drawnIds.add(question.id)
  state.currentQuestion = { ...question, isMystery: true }
}

function customNeverStatements() {
  return state.customQuestions.filter((q) => q.type === 'never')
}

function neverPool() {
  const builtin = neverHaveIEverData.filter((q) => state.neverHaveIEverDifficulties.includes(q.difficulty))
  // Player-authored statements are always in play, regardless of the difficulty filter.
  return [...builtin, ...customNeverStatements()].filter((q) => !state.neverDrawnIds.has(q.id))
}

function drawNeverHaveIEver() {
  let pool = neverPool()
  if (pool.length === 0) {
    state.neverDrawnIds.clear()
    pool = [
      ...neverHaveIEverData.filter((q) => state.neverHaveIEverDifficulties.includes(q.difficulty)),
      ...customNeverStatements(),
    ]
  }
  if (pool.length === 0) {
    state.currentNeverStatement = null
    return
  }
  const item = pool[Math.floor(Math.random() * pool.length)]
  state.neverDrawnIds.add(item.id)
  state.currentNeverStatement = item
}

// Forces the drawn card onto another player. Each player index may only do this once per game.
function passTheBuck(passerIndex, targetIndex) {
  state.passBuckUsed.add(passerIndex)
  if (state.currentQuestion) {
    state.currentQuestion.passedTo = targetIndex
  }
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

function addCustomQuestion(type, text) {
  const trimmed = text.trim()
  if (!trimmed) return
  state.customQuestions.push({
    id: `custom-${state.customQuestions.length}-${Math.random()}`,
    type,
    categories: ['Custom'],
    difficulty: 'medium',
    text: type === 'never' ? `Never have I ever ${trimmed}` : trimmed,
  })
}

function removeCustomQuestion(id) {
  const i = state.customQuestions.findIndex((q) => q.id === id)
  if (i !== -1) state.customQuestions.splice(i, 1)
}

export function useGameStore() {
  return {
    state,
    allCategories,
    allDifficulties,
    canStart,
    currentPlayer,
    remainingCount,
    remainingNever,
    addPlayer,
    removePlayer,
    toggleCategory,
    toggleCategoryDifficulty,
    toggleNeverDifficulty,
    setGameStyle,
    toggleSound,
    startGame,
    backToSetup,
    resolveSpin,
    drawQuestion,
    drawWildCard,
    drawMysteryBox,
    drawNeverHaveIEver,
    chooseNextPlayer,
    passTheBuck,
    nextTurn,
    addCustomQuestion,
    removeCustomQuestion,
  }
}