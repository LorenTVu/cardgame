<script setup>
import { computed } from 'vue'
import { useInstallPrompt } from '../composables/useInstallPrompt'

const { state, promptInstall, dismiss } = useInstallPrompt()

const canShow = computed(
  () => !state.isStandalone && !state.dismissed && (state.deferredPrompt || state.isIOS),
)
</script>

<template>
  <div
    v-if="canShow"
    class="rounded-box flex items-center justify-between gap-3 border-4 border-neutral/40 bg-base-200 px-4 py-3 shadow-[0_6px_0_0_rgba(43,42,85,0.15)]"
  >
    <div class="flex items-center gap-2">
      <span class="text-2xl">📲</span>
      <p v-if="state.isIOS" class="font-display text-sm leading-snug">
        Install this app: tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.
      </p>
      <p v-else class="font-display text-sm leading-snug">Install this app for the full experience!</p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <button
        v-if="!state.isIOS"
        type="button"
        class="btn btn-warning btn-sm font-display"
        @click="promptInstall"
      >
        Install
      </button>
      <button type="button" class="btn btn-ghost btn-sm" aria-label="Dismiss install prompt" @click="dismiss">
        ✕
      </button>
    </div>
  </div>
</template>
