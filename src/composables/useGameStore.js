import { reactive, computed, watch } from 'vue'
import questionsData from '../data/questions.json'
import neverHaveIEverData from '../data/neverHaveIEver.json'

const allCategories = [...new Set(questionsData.flatMap((q) => q.categories))].sort()
const allDifficulties = ['easy', 'medium', 'hard']

const FORFEITS_LIST = [
  '🥤 Take 2 sips of your drink!',
  '🏋️ Do 10 jumping jacks or pushups right now!',
  '🤖 Talk in a robot voice for the next 2 rounds!',
  '🎤 Sing the chorus of a song out loud!',
  '💃 Do your best retro arcade victory dance for 10 seconds!',
  '🤳 Let the group pick a funny emoji to send to a friend!',
  '🎭 Speak only in whispers until your next turn!',
  '🙈 Do a 15-second dramatic impression of another player!',
  '🍕 Tell the group your most embarrassing food combination!',
  '🤐 Keep your mouth completely closed for 1 minute!',
]

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
  playerScores: persisted?.playerScores ?? {}, // { playerName: { completed: 0, forfeits: 0 } }
  selectedCategories: (persisted?.selectedCategories ?? []).filter((c) => allCategories.includes(c)),
  categoryDifficulties: { ...defaultCategoryDifficulties, ...(persisted?.categoryDifficulties ?? {}) },
  gameStyle: persisted?.gameStyle ?? 'order', // 'order' | 'random' | 'hotpotato' | 'neverhaveiever'
  currentPlayerIndex: persisted?.currentPlayerIndex ?? 0,
  awaitingSpin: persisted?.awaitingSpin ?? false,
  drawnIds: new Set(persisted?.drawnIds ?? []),
  neverDrawnIds: new Set(persisted?.neverDrawnIds ?? []),
  currentQuestion: persisted?.currentQuestion ?? null,
  currentNeverStatement: persisted?.currentNeverStatement ?? null,
  activeForfeit: persisted?.activeForfeit ?? null,
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
        playerScores: state.playerScores,
        selectedCategories: state.selectedCategories,
        categoryDifficulties: state.categoryDifficulties,
        gameStyle: state.gameStyle,
        currentPlayerIndex: state.currentPlayerIndex,
        awaitingSpin: state.awaitingSpin,
        drawnIds: [...state.drawnIds],
        neverDrawnIds: [...state.neverDrawnIds],
        currentQuestion: state.currentQuestion,
        currentNeverStatement: state.currentNeverStatement,
        activeForfeit: state.activeForfeit,
        passBuckUsed: [...state.passBuckUsed],
        customQuestions: state.customQuestions,
        soundEnabled: state.soundEnabled,
      }),
    )
  } catch {
    // Storage fallback
  }
}

watch(state, saveState, { deep: true })

function initPlayerScores() {
  state.players.forEach((p) => {
    if (!state.playerScores[p]) {
      state.playerScores[p] = { completed: 0, forfeits: 0 }
    }
  })
}

function addPlayer(name) {
  const trimmed = name.trim()
  if (!trimmed) return
  if (!state.players.includes(trimmed)) {
    state.players.push(trimmed)
    state.playerScores[trimmed] = { completed: 0, forfeits: 0 }
  }
}

function removePlayer(index) {
  const name = state.players[index]
  if (name) delete state.playerScores[name]
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

function setGameStyle(gameStyle) {
  state.gameStyle = gameStyle
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled
}

const canStart = computed(
  () =>
    state.players.length >= 1 &&
    state.selectedCategories.length >= 1 &&
    state.selectedCategories.some((c) => state.categoryDifficulties[c]?.length > 0),
)

function startGame() {
  if (!canStart.value) return
  initPlayerScores()
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
  state.activeForfeit = null
  state.screen = 'game'
}

function backToSetup() {
  state.screen = 'setup'
  state.currentQuestion = null
  state.activeForfeit = null
}

function resolveSpin(index) {
  state.currentPlayerIndex = index
  state.awaitingSpin = false
}

function needsSpinFor(playerCount) {
  return state.gameStyle === 'random' && playerCount > 1
}

const currentPlayer = computed(() => state.players[state.currentPlayerIndex] ?? '')

function allQuestions() {
  return [...questionsData, ...state.customQuestions.filter((q) => q.type !== 'never')]
}

function matchesCategoryFilter(q) {
  return q.categories.some(
    (c) => state.selectedCategories.includes(c) && state.categoryDifficulties[c]?.includes(q.difficulty),
  )
}

function questionsPool(type) {
  return allQuestions().filter(
    (q) =>
      q.type === type &&
      (q.categories[0] === 'Custom' || matchesCategoryFilter(q)) &&
      !state.drawnIds.has(q.id),
  )
}

const remainingCount = computed(() => ({
  truth: questionsPool('truth').length,
  dare: questionsPool('dare').length,
}))

const remainingNever = computed(() => neverPool().length)

function drawQuestion(type) {
  state.activeForfeit = null
  let pool = questionsPool(type)
  if (pool.length === 0) {
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
  state.activeForfeit = null
  const others = state.players.filter((_, i) => i !== state.currentPlayerIndex)
  const asker = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null
  const text = asker
    ? `${asker} asks you anything — no rules!`
    : 'Someone in the room asks you anything — no rules!'
  state.currentQuestion = { id: `wild-${state.players.length}-${Math.random()}`, type: 'wild', text }
}

function drawMysteryBox() {
  state.activeForfeit = null
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
  const builtin = neverHaveIEverData.filter(matchesCategoryFilter)
  return [...builtin, ...customNeverStatements()].filter((q) => !state.neverDrawnIds.has(q.id))
}

function drawNeverHaveIEver() {
  state.activeForfeit = null
  let pool = neverPool()
  if (pool.length === 0) {
    state.neverDrawnIds.clear()
    pool = [...neverHaveIEverData.filter(matchesCategoryFilter), ...customNeverStatements()]
  }
  if (pool.length === 0) {
    state.currentNeverStatement = null
    return
  }
  const item = pool[Math.floor(Math.random() * pool.length)]
  state.neverDrawnIds.add(item.id)
  state.currentNeverStatement = item
}

function passTheBuck(passerIndex, targetIndex) {
  state.passBuckUsed.add(passerIndex)
  if (state.currentQuestion) {
    state.currentQuestion.passedTo = targetIndex
  }
}

function chooseNextPlayer(index) {
  state.currentPlayerIndex = index
  state.awaitingSpin = false
  state.currentQuestion = null
  state.activeForfeit = null
}

function recordCompletion() {
  const player = currentPlayer.value
  if (player) {
    if (!state.playerScores[player]) state.playerScores[player] = { completed: 0, forfeits: 0 }
    state.playerScores[player].completed += 1
  }
  nextTurn()
}

function generateForfeit() {
  const player = currentPlayer.value
  if (player) {
    if (!state.playerScores[player]) state.playerScores[player] = { completed: 0, forfeits: 0 }
    state.playerScores[player].forfeits += 1
  }
  const randomPunishment = FORFEITS_LIST[Math.floor(Math.random() * FORFEITS_LIST.length)]
  state.activeForfeit = randomPunishment
}

function nextTurn() {
  state.currentQuestion = null
  state.activeForfeit = null
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
    recordCompletion,
    generateForfeit,
    nextTurn,
    addCustomQuestion,
    removeCustomQuestion,
  }
}