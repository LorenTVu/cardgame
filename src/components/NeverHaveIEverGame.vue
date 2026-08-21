<script setup>
import { useGameStore } from '../composables/useGameStore'
import { useSound } from '../composables/useSound'

const { state, remainingNever, drawNeverHaveIEver } = useGameStore()
const { playReveal } = useSound()

function handleNext() {
  drawNeverHaveIEver()
  playReveal()
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-6 py-4">
    <h1 class="font-display title-outline text-center text-2xl text-white">🤐 Never Have I Ever</h1>
    <p class="font-display text-xs text-base-content/60">{{ remainingNever }} left in the deck</p>

    <div
      class="rounded-box min-h-40 w-full max-w-sm border-4 border-neutral/40 bg-base-200 p-6 text-center shadow-[0_8px_0_0_rgba(43,42,85,0.15)]"
    >
      <div class="flex h-full items-center justify-center">
        <Transition name="pop" mode="out-in">
          <p v-if="state.currentNeverStatement" :key="state.currentNeverStatement.id" class="text-xl font-medium leading-snug">
            {{ state.currentNeverStatement.text }}
          </p>
          <p v-else key="empty" class="font-display text-base leading-relaxed text-base-content/60">
            Tap below to reveal<br />the first one!
          </p>
        </Transition>
      </div>
    </div>

    <button type="button" class="btn btn-lg btn-warning font-display" @click="handleNext">
      Next Statement →
    </button>
  </div>
</template>