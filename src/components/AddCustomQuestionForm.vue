<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../composables/useGameStore'

const { addCustomQuestion } = useGameStore()
const emit = defineEmits(['added'])

const text = ref('')
const type = ref('truth')

const placeholder = computed(() =>
  type.value === 'never' ? 'e.g. gone skydiving' : 'TYPE CUSTOM QUESTION...',
)

function submit() {
  if (!text.value.trim()) return
  addCustomQuestion(type.value, text.value)
  text.value = ''
  emit('added')
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="submit">
    <div class="grid grid-cols-3 gap-1.5 border-2 border-black bg-slate-100 p-1">
      <button
        type="button"
        class="border-2 border-black py-1 font-['Press_Start_2P'] text-[9px] font-bold uppercase transition-all"
        :class="type === 'truth' ? 'bg-[#00e5ff] text-black shadow-[1px_1px_0px_#000]' : 'bg-white text-slate-500'"
        @click="type = 'truth'"
      >
        📜 TRUTH
      </button>
      <button
        type="button"
        class="border-2 border-black py-1 font-['Press_Start_2P'] text-[9px] font-bold uppercase transition-all"
        :class="type === 'dare' ? 'bg-[#ff3b70] text-white shadow-[1px_1px_0px_#000]' : 'bg-white text-slate-500'"
        @click="type = 'dare'"
      >
        🔥 DARE
      </button>
      <button
        type="button"
        class="border-2 border-black py-1 font-['Press_Start_2P'] text-[9px] font-bold uppercase transition-all"
        :class="type === 'never' ? 'bg-[#b03bff] text-white shadow-[1px_1px_0px_#000]' : 'bg-white text-slate-500'"
        @click="type = 'never'"
      >
        🤐 NEVER
      </button>
    </div>

    <p v-if="type === 'never'" class="font-['Pixelify_Sans'] text-xs font-bold text-slate-700 italic">
      "Never have I ever" is automatically prepended.
    </p>

    <textarea
      v-model="text"
      rows="2"
      :placeholder="placeholder"
      class="w-full border-4 border-black bg-white p-2.5 font-['Pixelify_Sans'] text-sm font-bold text-black uppercase placeholder-slate-400 outline-none"
      maxlength="200"
    />

    <button
      type="submit"
      class="pixel-btn pixel-btn-yellow w-full py-2.5 text-xs font-bold uppercase disabled:opacity-50"
      :disabled="!text.trim()"
    >
      ➕ ADD TO DECK
    </button>
  </form>
</template>