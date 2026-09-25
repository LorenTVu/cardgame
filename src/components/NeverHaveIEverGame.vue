<script setup>
import { ref } from 'vue'
import { useGameStore } from '../composables/useGameStore'
import { useSound } from '../composables/useSound'
import CategoryTags from './CategoryTags.vue'

const { state, remainingNever, drawNeverHaveIEver } = useGameStore()
const { playReveal } = useSound()

const iHaveCount = ref(0)
const iHavntCount = ref(0)

function handleNext() {
  iHaveCount.value = 0
  iHavntCount.value = 0
  drawNeverHaveIEver()
  playReveal()
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center justify-center gap-6 py-4">
    <div class="text-center">
      <span class="pixel-badge bg-[#ffe600] text-black">ROUND ROBIN</span>
      <h1 class="pixel-title mt-2 text-2xl font-extrabold sm:text-3xl">🤐 NEVER HAVE I EVER</h1>
      <p class="font-['Pixelify_Sans'] text-sm font-bold text-slate-800 mt-1">{{ remainingNever }} STATEMENTS LEFT IN DECK</p>
    </div>

    <!-- Statement Card -->
    <div
      class="pixel-card-mystery relative flex min-h-[200px] w-full max-w-md flex-col items-center justify-center p-6 text-center"
    >
      <CategoryTags
        v-if="state.currentNeverStatement"
        :categories="state.currentNeverStatement.categories"
        :difficulty="state.currentNeverStatement.difficulty"
      />

      <div class="flex h-full items-center justify-center p-2">
        <Transition name="pop" mode="out-in">
          <p
            v-if="state.currentNeverStatement"
            :key="state.currentNeverStatement.id"
            class="font-['Pixelify_Sans'] text-xl sm:text-2xl font-bold leading-relaxed text-black"
          >
            {{ state.currentNeverStatement.text }}
          </p>

          <p v-else key="empty" class="font-['Pixelify_Sans'] text-base font-bold leading-relaxed text-slate-700">
            TAP BELOW TO REVEAL<br />THE FIRST STATEMENT!
          </p>
        </Transition>
      </div>
    </div>

    <!-- Tally Counter buttons for room fun -->
    <div v-if="state.currentNeverStatement" class="grid grid-cols-2 gap-3 w-full max-w-md">
      <button
        type="button"
        class="pixel-btn pixel-btn-pink flex items-center justify-between p-3 text-xs font-bold"
        @click="iHaveCount++"
      >
        <span>🙋‍♂️ I HAVE</span>
        <span class="border border-white bg-black/20 px-2 py-0.5 text-xs text-white">{{ iHaveCount }}</span>
      </button>

      <button
        type="button"
        class="pixel-btn pixel-btn-green flex items-center justify-between p-3 text-xs font-bold"
        @click="iHavntCount++"
      >
        <span>🙅 I HAVEN'T</span>
        <span class="border border-black bg-black/20 px-2 py-0.5 text-xs text-black">{{ iHavntCount }}</span>
      </button>
    </div>

    <button
      type="button"
      class="pixel-btn pixel-btn-yellow w-full max-w-md py-4 text-xs font-bold uppercase"
      @click="handleNext"
    >
      NEXT STATEMENT →
    </button>
  </div>
</template>