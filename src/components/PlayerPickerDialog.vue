<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  players: { type: Array, required: true }, // [{ name, index }]
})

defineEmits(['pick'])
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-neutral/40 p-4">
    <Transition name="pop" appear>
      <div
        class="rounded-box border-4 border-neutral/40 bg-base-200 p-6 text-center shadow-[0_8px_0_0_rgba(43,42,85,0.2)]"
      >
        <p class="font-display text-sm uppercase tracking-widest text-secondary">{{ title }}</p>
        <h2 v-if="subtitle" class="font-display title-outline mt-2 text-2xl text-white">{{ subtitle }}</h2>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <button
            v-for="player in players"
            :key="player.index"
            type="button"
            class="btn btn-secondary font-display"
            @click="$emit('pick', player.index)"
          >
            {{ player.name }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>