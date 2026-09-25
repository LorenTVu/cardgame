<script setup>
import { useGameStore } from './composables/useGameStore'
import SetupScreen from './components/SetupScreen.vue'
import GameScreen from './components/GameScreen.vue'

const { state } = useGameStore()
</script>

<template>
  <div class="sky-bg min-h-screen text-slate-100 antialiased selection:bg-pink-500 selection:text-white">
    <SetupScreen v-if="state.screen === 'setup'" />
    <GameScreen v-else />
  </div>
</template>