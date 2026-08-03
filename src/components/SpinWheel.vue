<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  players: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['landed'])

const PALETTE = ['#ffb5c2', '#a9ddf0', '#ffe29a', '#b7ecd0', '#d0c6f5']
const SIZE = 340
const CENTER = SIZE / 2
const RADIUS = SIZE / 2 - 8
const FRICTION = 1.2 // higher = spins down faster
const STOP_THRESHOLD = 15 // deg/sec below which we consider it stopped
const GLOW_START_SPEED = 320 // deg/sec below which the glow starts building

const wheelWrapperEl = ref(null)
const rotation = ref(0)
const spinning = ref(false)
const glow = ref(0) // 0..1, ramps up as the spin slows down

let angularVelocity = 0
let rafId = null
let lastTime = 0
let dragging = false
let dragLastAngle = 0
let dragLastTime = 0

const segmentAngle = computed(() => 360 / props.players.length)

const labelFontSize = computed(() => {
  const n = props.players.length
  if (n <= 8) return 20
  if (n <= 12) return 17
  if (n <= 16) return 15
  return 13
})

const labelMaxChars = computed(() => {
  const n = props.players.length
  if (n <= 12) return 14
  if (n <= 16) return 12
  return 10
})

const wheelFilter = computed(() => {
  const spread = 10 + glow.value * 18
  const alpha = 0.2 + glow.value * 0.6
  return `drop-shadow(0 6px 0 rgba(43,42,85,0.2)) drop-shadow(0 0 ${spread}px rgba(255,205,60,${alpha}))`
})

// Angle 0 = top (12 o'clock), increasing clockwise — matches on-screen rotation direction.
function toXY(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  }
}

// Inverse of toXY's convention: angle (clockwise from top) of a point relative to wheel center.
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
    // Radial orientation: text reads outward along the wedge's spoke, so its
    // length is bounded by the (constant) radial band rather than the
    // (shrinking) tangential arc — lets font stay bigger as players are added.
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
  emit('landed', index)
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
  dragging = true
  spinning.value = false
  angularVelocity = 0
  glow.value = 0
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
}

function onPointerUp() {
  if (!dragging) return
  dragging = false
  spinning.value = true
  startPhysics()
}

onUnmounted(cancelPhysics)
</script>

<template>
  <div class="mx-auto flex flex-col items-center gap-6">
    <div
      ref="wheelWrapperEl"
      class="relative aspect-square w-[85vw] max-w-85 touch-none select-none"
      :class="players.length >= 2 ? 'cursor-grab active:cursor-grabbing' : ''"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheelScroll"
    >
      <div class="h-full w-full" :style="{ transform: `rotate(${rotation}deg)` }">
        <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="h-full w-full" :style="{ filter: wheelFilter }">
          <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" fill="#ffffff" stroke="#ffcd3c" stroke-width="7" />
          <path
            v-for="(wedge, i) in wedges"
            :key="i"
            :d="wedge.path"
            :fill="wedge.color"
            stroke="#ffffff"
            stroke-width="3"
          />
          <text
            v-for="(wedge, i) in wedges"
            :key="`label-${i}`"
            :x="wedge.labelX"
            :y="wedge.labelY"
            :transform="`rotate(${wedge.labelRotate} ${wedge.labelX} ${wedge.labelY})`"
            fill="#2b2a55"
            :font-size="labelFontSize"
            font-family="'Fredoka', sans-serif"
            font-weight="700"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            {{ wedge.name }}
          </text>
        </svg>
      </div>

      <!-- fixed pointer -->
      <div
        class="pointer-events-none absolute left-1/2 top-0 z-10 h-0 w-0 -translate-x-1/2 -translate-y-1"
        style="border-left: 14px solid transparent; border-right: 14px solid transparent; border-top: 20px solid #6c63b5"
      />

      <!-- center hub / spin button -->
      <button
        type="button"
        class="btn btn-circle btn-accent font-display absolute inset-0 m-auto h-24 w-24 border-4 border-base-200 text-base shadow-[0_4px_0_0_rgba(43,42,85,0.2)]"
        :disabled="spinning || players.length < 2"
        @pointerdown.stop
        @click="spinFromButton"
      >
        {{ spinning ? '...' : 'Spin' }}
      </button>
    </div>
    <p class="font-display text-xs text-base-content/60">Tap Spin, drag the wheel, or scroll to spin!</p>
  </div>
</template>
