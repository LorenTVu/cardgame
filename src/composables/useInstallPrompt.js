import { reactive } from 'vue'

const DISMISS_KEY = 'installPromptDismissed'

const state = reactive({
  deferredPrompt: null,
  isIOS: false,
  isStandalone: false,
  dismissed: localStorage.getItem(DISMISS_KEY) === '1',
})

let listenerAttached = false

function attachListener() {
  if (listenerAttached) return
  listenerAttached = true

  const ua = window.navigator.userAgent
  state.isIOS = /iphone|ipad|ipod/i.test(ua) && !window.MSStream
  state.isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    state.deferredPrompt = e
  })
  window.addEventListener('appinstalled', () => {
    state.deferredPrompt = null
    state.isStandalone = true
  })
}

async function promptInstall() {
  if (!state.deferredPrompt) return
  state.deferredPrompt.prompt()
  await state.deferredPrompt.userChoice
  state.deferredPrompt = null
}

function dismiss() {
  state.dismissed = true
  localStorage.setItem(DISMISS_KEY, '1')
}

export function useInstallPrompt() {
  attachListener()
  return { state, promptInstall, dismiss }
}
