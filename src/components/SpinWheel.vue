<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useSound } from '../composables/useSound'

const props = defineProps({
  players: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['landed'])
const { playTick } = useSound()

const PALETTE = ['#ffe600', '#00e5ff', '#ff3b70', '#39ff14', '#ff8800', '#b03bff', '#00ffcc', '#ffcc00']
const SIZE = 340
const CENTER = SIZE / 2
const RADIUS = SIZE / 2 - 8
const FRICTION = 1.2 // higher = spins down faster
const STOP_THRESHOLD = 15 // deg/sec below which we consider it stopped
const GLOW_START_SPEED = 320 // deg/sec below which the glow starts building

const FLASH_DURATION = 500 // ms — how long the winner flash plays before the result is revealed

const wheelWrapperEl = ref(null)
const rotation = ref(0)
const spinning = ref(false)
const glow = ref(0) // 0..1, ramps up as the spin slows down
const flashActive = ref(false)

let angularVelocity = 0
let rafId = null
let lastTime = 0
let dragging = false
let dragLastAngle = 0
let dragLastTime = 0
let lastSegmentIndex = 0
let flashTimeoutId = null

const segmentAngle = computed(() => 360 / props.players.length)

const labelFontSize = computed(() => {
  const n = props.players.length
  if (n <= 8) return 14
  if (n <= 12) return 12
  if (n <= 16) return 10
  return 8
})

const labelMaxChars = computed(() => {
  const n = props.players.length
  if (n <= 12) return 14
  if (n <= 16) return 12
  return 10
})

function toXY(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  }
}

function angleFromEvent(e, rect) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  return (Math.atan2(dx, -dy) * 180) / Math.PI
}

function normalizeDelta(delta) {
  let d = delta % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

const wedges = computed(() =>
  props.players.map((name, i) => {
    const seg = segmentAngle.value
    const start = i * seg
    const end = start + seg
    const p1 = toXY(start, RADIUS)
    const p2 = toXY(end, RADIUS)
    const mid = start + seg / 2
    const labelPos = toXY(mid, RADIUS * 0.62)

    let labelRotate = mid - 90
    labelRotate = ((labelRotate % 360) + 360) % 360
    if (labelRotate > 90 && labelRotate < 270) labelRotate += 180
    return {
      name: name.length > labelMaxChars.value ? `${name.slice(0, labelMaxChars.value - 1)}…` : name,
      color: PALETTE[i % PALETTE.length],
      path: `M ${CENTER} ${CENTER} L ${p1.x} ${p1.y} A ${RADIUS} ${RADIUS} 0 0 1 ${p2.x} ${p2.y} Z`,
      labelX: labelPos.x,
      labelY: labelPos.y,
      labelRotate,
    }
  }),
)

function tickIfCrossedBoundary() {
  const idx = Math.floor(rotation.value / segmentAngle.value)
  if (idx !== lastSegmentIndex) {
    lastSegmentIndex = idx
    playTick()
  }
}

function cancelPhysics() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function startPhysics() {
  if (rafId !== null) return
  lastTime = performance.now()
  rafId = requestAnimationFrame(step)
}

function step(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05)
  lastTime = now
  rotation.value += angularVelocity * dt
  angularVelocity *= Math.exp(-FRICTION * dt)
  tickIfCrossedBoundary()

  const speed = Math.abs(angularVelocity)
  glow.value = dragging ? 0 : Math.max(0, Math.min(1, 1 - speed / GLOW_START_SPEED))

  if (!dragging && speed < STOP_THRESHOLD) {
    angularVelocity = 0
    rafId = null
    finishSpin()
    return
  }
  rafId = requestAnimationFrame(step)
}

function finishSpin() {
  spinning.value = false
  glow.value = 0
  const seg = segmentAngle.value
  const mod = ((rotation.value % 360) + 360) % 360
  const angleAtPointer = (360 - mod) % 360
  const index = Math.floor(angleAtPointer / seg) % props.players.length

  flashActive.value = true
  flashTimeoutId = setTimeout(() => {
    flashActive.value = false
    flashTimeoutId = null
    emit('landed', index)
  }, FLASH_DURATION)
}

function cancelFlash() {
  if (flashTimeoutId) {
    clearTimeout(flashTimeoutId)
    flashTimeoutId = null
  }
  flashActive.value = false
}

function spinFromButton() {
  if (spinning.value || dragging || props.players.length < 2) return
  angularVelocity = 1900 + Math.random() * 500
  spinning.value = true
  startPhysics()
}

function onWheelScroll(e) {
  if (props.players.length < 2) return
  e.preventDefault()
  angularVelocity += e.deltaY * 3
  angularVelocity = Math.max(Math.min(angularVelocity, 3000), -3000)
  spinning.value = true
  startPhysics()
}

function onPointerDown(e) {
  if (props.players.length < 2) return
  cancelPhysics()
  cancelFlash()
  dragging = true
  spinning.value = false
  angularVelocity = 0
  glow.value = 0
  lastSegmentIndex = Math.floor(rotation.value / segmentAngle.value)
  const rect = wheelWrapperEl.value.getBoundingClientRect()
  dragLastAngle = angleFromEvent(e, rect)
  dragLastTime = performance.now()
  wheelWrapperEl.value.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!dragging) return
  const rect = wheelWrapperEl.value.getBoundingClientRect()
  const angle = angleFromEvent(e, rect)
  const delta = normalizeDelta(angle - dragLastAngle)
  const now = performance.now()
  const dt = Math.max((now - dragLastTime) / 1000, 0.001)
  rotation.value += delta
  angularVelocity = delta / dt
  dragLastAngle = angle
  dragLastTime = now
  tickIfCrossedBoundary()
}

function onPointerUp() {
  if (!dragging) return
  dragging = false
  spinning.value = true
  startPhysics()
}

onUnmounted(() => {
  cancelPhysics()
  cancelFlash()
})
</script>

<template>
  <div class="mx-auto flex flex-col items-center gap-4">
    <div
      ref="wheelWrapperEl"
      class="relative aspect-square w-[85vw] max-w-[340px] touch-none select-none drop-shadow-[6px_6px_0px_#000]"
      :class="players.length >= 2 ? 'cursor-grab active:cursor-grabbing' : ''"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheelScroll"
    >
      <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="h-full w-full">
        <g :transform="`rotate(${rotation} ${CENTER} ${CENTER})`">
          <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" fill="#ffffff" stroke="#000000" stroke-width="6" />
          <path
            v-for="(wedge, i) in wedges"
            :key="i"
            :d="wedge.path"
            :fill="wedge.color"
            stroke="#000000"
            stroke-width="3"
          />
          <text
            v-for="(wedge, i) in wedges"
            :key="`label-${i}`"
            :x="wedge.labelX"
            :y="wedge.labelY"
            :transform="`rotate(${wedge.labelRotate} ${wedge.labelX} ${wedge.labelY})`"
            fill="#000000"
            :font-size="labelFontSize"
            font-family="'Press Start 2P', monospace"
            font-weight="700"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ wedge.name }}
          </text>
        </g>
      </svg>

      <!-- Fixed Pointer -->
      <div
        class="pointer-events-none absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-1"
        style="
          border-left: 14px solid transparent;
          border-right: 14px solid transparent;
          border-top: 22px solid #000000;
        "
      />

      <!-- Winner Flash -->
      <div
        v-if="flashActive"
        class="pointer-events-none absolute left-1/2 top-0 z-20 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style="
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 230, 0, 0.9) 50%,
            rgba(255, 230, 0, 0) 75%
          );
          animation: pointer-flash 0.5s ease-out forwards;
        "
      />

      <!-- Center Pixel Yellow Spin Button -->
      <button
        type="button"
        class="pixel-btn pixel-btn-yellow absolute inset-0 m-auto flex h-24 w-24 flex-col items-center justify-center rounded-full text-center disabled:opacity-60"
        :disabled="spinning || players.length < 2"
        @pointerdown.stop
        @click="spinFromButton"
      >
        <span class="font-['Press_Start_2P'] text-[11px] font-extrabold uppercase">{{ spinning ? '...' : 'SPIN' }}</span>
      </button>
    </div>
    <p class="font-['Pixelify_Sans'] text-xs font-bold text-slate-900">TAP SPIN, DRAG, OR SCROLL TO SPIN!</p>
  </div>
</template>
