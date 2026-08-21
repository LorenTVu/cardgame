<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../composables/useGameStore'

const { addCustomQuestion } = useGameStore()
const emit = defineEmits(['added'])

const text = ref('')
const type = ref('truth')

const placeholder = computed(() =>
  type.value === 'never' ? 'e.g. gone skydiving' : 'Type your own Truth or Dare...',
)

function submit() {
  if (!text.value.trim()) return
  addCustomQuestion(type.value, text.value)
  text.value = ''
  emit('added')
}
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="submit">
    <p v-if="type === 'never'" class="text-xs text-base-content/60">
      Just type the action — "Never have I ever" gets added automatically.
    </p>
    <textarea
      v-model="text"
      rows="2"
      :placeholder="placeholder"
      class="textarea w-full"
      style="--input-color: var(--color-base-300)"
      maxlength="200"
    />
    <div class="join">
      <button
        type="button"
        class="btn join-item font-display flex-1"
        :class="type === 'truth' ? 'btn-secondary' : 'btn-ghost'"
        @click="type = 'truth'"
      >
        📜 Truth
      </button>
      <button
        type="button"
        class="btn join-item font-display flex-1"
        :class="type === 'dare' ? 'btn-primary' : 'btn-ghost'"
        @click="type = 'dare'"
      >
        🔥 Dare
      </button>
      <button
        type="button"
        class="btn join-item font-display flex-1"
        :class="type === 'never' ? 'btn-neutral' : 'btn-ghost'"
        @click="type = 'never'"
      >
        🤐 Never
      </button>
    </div>
    <button type="submit" class="btn btn-warning font-display">➕ Add to the Deck</button>
  </form>
</template>