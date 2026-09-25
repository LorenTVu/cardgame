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
    class="pixel-card flex items-center justify-between gap-3 p-3 text-black shadow-[4px_4px_0px_#000]"
  >
    <div class="flex items-center gap-2">
      <span class="text-xl">📲</span>
      <p v-if="state.isIOS" class="font-['Pixelify_Sans'] text-sm font-bold leading-tight text-slate-900">
        Install app: tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.
      </p>
      <p v-else class="font-['Pixelify_Sans'] text-sm font-bold leading-tight text-slate-900">
        INSTALL APP FOR FULL ARCADE EXPERIENCE!
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <button
        v-if="!state.isIOS"
        type="button"
        class="pixel-btn pixel-btn-yellow px-3 py-1 text-[10px] font-bold"
        @click="promptInstall"
      >
        INSTALL
      </button>
      <button
        type="button"
        class="font-bold text-red-600 hover:text-red-800 px-1 text-sm"
        aria-label="Dismiss install prompt"
        @click="dismiss"
      >
        ✕
      </button>
    </div>
  </div>
</template>
