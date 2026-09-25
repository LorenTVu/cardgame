<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  players: { type: Array, required: true }, // [{ name, index }]
})

defineEmits(['pick'])
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <Transition name="pop" appear>
      <div
        class="pixel-card-yellow w-full max-w-sm p-6 text-center shadow-[8px_8px_0px_#000]"
      >
        <p class="font-['Press_Start_2P'] text-[10px] uppercase text-black font-bold">{{ title }}</p>
        <h2 v-if="subtitle" class="font-['Pixelify_Sans'] mt-2 text-2xl font-bold text-black">{{ subtitle }}</h2>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <button
            v-for="player in players"
            :key="player.index"
            type="button"
            class="pixel-btn pixel-btn-yellow px-4 py-2 text-xs font-bold"
            @click="$emit('pick', player.index)"
          >
            {{ player.name }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>