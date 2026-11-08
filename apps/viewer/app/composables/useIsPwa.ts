type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

export function useIsPwa() {
  const isPwa = useState<boolean>("viewer-is-pwa", () => false)

  if (!import.meta.client) {
    return isPwa
  }

  const detectPwa = () => {
    const navigatorWithStandalone = navigator as NavigatorWithStandalone
    const isStandaloneMode = window.matchMedia(
      "(display-mode: standalone)",
    ).matches
    const isFullscreenMode = window.matchMedia(
      "(display-mode: fullscreen)",
    ).matches
    const isIosStandalone = navigatorWithStandalone.standalone === true

    isPwa.value = isStandaloneMode || isFullscreenMode || isIosStandalone
  }

  onMounted(() => {
    detectPwa()

    const standaloneQuery = window.matchMedia("(display-mode: standalone)")
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)")
    const onChange = () => detectPwa()

    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener("change", onChange)
      fullscreenQuery.addEventListener("change", onChange)
    } else {
      // Safari fallback for older MediaQueryList API
      standaloneQuery.addListener(onChange)
      fullscreenQuery.addListener(onChange)
    }

    onUnmounted(() => {
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener("change", onChange)
        fullscreenQuery.removeEventListener("change", onChange)
      } else {
        standaloneQuery.removeListener(onChange)
        fullscreenQuery.removeListener(onChange)
      }
    })
  })

  return isPwa
}
