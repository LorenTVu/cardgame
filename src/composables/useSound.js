import { useGameStore } from './useGameStore'

let audioCtx = null

function getCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(freq, duration, delay = 0, type = 'sine', peakVolume = 0.2) {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)
  const start = ctx.currentTime + delay
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peakVolume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

export function useSound() {
  const { state } = useGameStore()

  function guarded(fn) {
    if (!state.soundEnabled) return
    try {
      fn()
    } catch {
      // Web Audio unavailable — fail silently, sound is a nice-to-have.
    }
  }

  return {
    playReveal() {
      guarded(() => {
        tone(523.25, 0.12, 0, 'triangle', 0.15)
        tone(783.99, 0.15, 0.08, 'triangle', 0.15)
      })
      vibrate(25)
    },
    playMystery() {
      guarded(() => {
        tone(523.25, 0.1, 0, 'sine', 0.12)
        tone(659.25, 0.1, 0.07, 'sine', 0.12)
        tone(783.99, 0.1, 0.14, 'sine', 0.12)
        tone(1046.5, 0.18, 0.21, 'sine', 0.14)
      })
      vibrate(25)
    },
    playTick() {
      guarded(() => tone(880, 0.05, 0, 'square', 0.08))
    },
    playExplosion() {
      guarded(() => {
        tone(90, 0.4, 0, 'sawtooth', 0.25)
        tone(60, 0.5, 0.05, 'sawtooth', 0.2)
      })
      vibrate([250, 100, 250])
    },
    playLanding() {
      guarded(() => {
        tone(392, 0.1, 0, 'triangle', 0.15)
        tone(659.25, 0.2, 0.1, 'triangle', 0.15)
      })
      vibrate(40)
    },
  }
}