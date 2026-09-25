import { useGameStore } from './useGameStore'

let audioCtx = null

function getCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

// Synthesizes authentic 8-bit retro arcade tones using square/sawtooth oscillators
function tone(freq, duration, delay = 0, type = 'square', peakVolume = 0.15) {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
  osc.connect(gain)
  gain.connect(ctx.destination)
  const start = ctx.currentTime + delay
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peakVolume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

// Spawns retro 8-bit square confetti particles across the window!
export function triggerPixelConfetti() {
  if (typeof document === 'undefined') return
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.inset = '0'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '9999'
  container.style.overflow = 'hidden'
  document.body.appendChild(container)

  const colors = ['#ffe600', '#00e5ff', '#ff3b70', '#39ff14', '#b03bff', '#ffffff']
  const particleCount = 45

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div')
    const size = Math.floor(Math.random() * 8) + 8
    const color = colors[Math.floor(Math.random() * colors.length)]
    const startX = Math.random() * 100
    const endX = startX + (Math.random() * 20 - 10)
    const fallDuration = Math.random() * 1.5 + 1.2

    p.style.position = 'absolute'
    p.style.top = '-20px'
    p.style.left = `${startX}vw`
    p.style.width = `${size}px`
    p.style.height = `${size}px`
    p.style.backgroundColor = color
    p.style.border = '2px solid #000000'
    p.style.boxShadow = '2px 2px 0px #000000'
    p.style.transition = `transform ${fallDuration}s linear, opacity ${fallDuration}s linear`
    container.appendChild(p)

    requestAnimationFrame(() => {
      p.style.transform = `translate(${endX - startX}vw, 105vh) rotate(${Math.random() * 360}deg)`
      p.style.opacity = '0'
    })
  }

  setTimeout(() => {
    container.remove()
  }, 2800)
}

export function useSound() {
  const { state } = useGameStore()

  function guarded(fn) {
    if (!state.soundEnabled) return
    try {
      fn()
    } catch {
      // Audio fallback
    }
  }

  return {
    playReveal() {
      guarded(() => {
        // 8-bit retro chime
        tone(523.25, 0.08, 0, 'square', 0.15)
        tone(659.25, 0.08, 0.06, 'square', 0.15)
        tone(783.99, 0.12, 0.12, 'square', 0.15)
      })
      vibrate(25)
    },
    playMystery() {
      guarded(() => {
        // 8-bit coin insert sound
        tone(987.77, 0.08, 0, 'square', 0.15)
        tone(1318.51, 0.25, 0.08, 'square', 0.15)
      })
      triggerPixelConfetti()
      vibrate(35)
    },
    playTick() {
      guarded(() => tone(900, 0.04, 0, 'square', 0.1))
    },
    playExplosion() {
      guarded(() => {
        // 8-bit retro noise explosion
        tone(120, 0.35, 0, 'sawtooth', 0.3)
        tone(60, 0.45, 0.05, 'sawtooth', 0.25)
      })
      vibrate([200, 100, 200])
    },
    playLanding() {
      guarded(() => {
        // 8-bit victory fanfare
        tone(523.25, 0.1, 0, 'square', 0.15)
        tone(659.25, 0.1, 0.08, 'square', 0.15)
        tone(783.99, 0.1, 0.16, 'square', 0.15)
        tone(1046.5, 0.25, 0.24, 'square', 0.18)
      })
      triggerPixelConfetti()
      vibrate(50)
    },
    playSuccess() {
      guarded(() => {
        // 8-bit power-up sound
        tone(440, 0.06, 0, 'square', 0.12)
        tone(554.37, 0.06, 0.05, 'square', 0.12)
        tone(659.25, 0.06, 0.1, 'square', 0.12)
        tone(880, 0.15, 0.15, 'square', 0.15)
      })
      triggerPixelConfetti()
      vibrate(30)
    },
    playForfeit() {
      guarded(() => {
        // 8-bit game over / penalty buzz
        tone(300, 0.1, 0, 'sawtooth', 0.15)
        tone(200, 0.2, 0.08, 'sawtooth', 0.15)
      })
      vibrate(60)
    }
  }
}