<script setup>
defineProps({
  categories: {
    type: Array,
    default: () => [],
  },
  difficulty: {
    type: String,
    default: '',
  },
})

const CATEGORY_STYLES = {
  Dickinson: 'bg-[#ffe600] text-black',
  Icebreakers: 'bg-[#00e5ff] text-black',
  Friendship: 'bg-[#39ff14] text-black',
  Romance: 'bg-[#ff70a6] text-black',
  Spicy: 'bg-[#ff3b70] text-white',
  Custom: 'bg-[#b03bff] text-white',
}

const DIFFICULTY_STYLES = {
  easy: 'bg-[#39ff14] text-black',
  medium: 'bg-[#ffe600] text-black',
  hard: 'bg-[#ff3b70] text-white',
}
</script>

<template>
  <div v-if="categories.length || difficulty" class="absolute left-3 top-3 z-10 flex max-w-[85%] flex-wrap gap-1.5">
    <span
      v-for="cat in categories"
      :key="cat"
      class="pixel-badge font-bold uppercase tracking-wider"
      :class="CATEGORY_STYLES[cat] || CATEGORY_STYLES.Custom"
    >
      {{ cat }}
    </span>
    <span
      v-if="difficulty"
      class="pixel-badge font-bold uppercase tracking-wider"
      :class="DIFFICULTY_STYLES[difficulty]"
    >
      ⚡ {{ difficulty }}
    </span>
  </div>
</template>
