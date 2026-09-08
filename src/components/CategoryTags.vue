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

const CATEGORY_COLORS = {
  Dickinson: '#ffd7ad',
  Icebreakers: '#aee2f7',
  Friendship: '#fff2a8',
  Romance: '#ffc4d6',
  Spicy: '#ffb0ac',
  Custom: '#d9d0f5',
}

const DIFFICULTY_COLORS = {
  easy: '#bdf0c9',
  medium: '#ffe08a',
  hard: '#ff9d97',
}
</script>

<template>
  <div v-if="categories.length || difficulty" class="absolute left-3 top-3 z-10 flex max-w-[75%] flex-wrap gap-1">
    <span
      v-for="cat in categories"
      :key="cat"
      class="rounded-full px-2 py-0.5 font-display text-[10px] font-semibold"
      :style="{ backgroundColor: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Custom, color: '#2b2a55' }"
    >
      {{ cat }}
    </span>
    <span
      v-if="difficulty"
      class="rounded-full px-2 py-0.5 font-display text-[10px] font-semibold capitalize"
      :style="{ backgroundColor: DIFFICULTY_COLORS[difficulty], color: '#2b2a55' }"
    >
      {{ difficulty }}
    </span>
  </div>
</template>
