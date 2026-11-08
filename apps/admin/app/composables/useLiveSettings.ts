const usePersistedLiveSetting = <T>(key: string, defaultValue: T) => {
  const storedValue = useCookie<T>(key, {
    default: () => defaultValue,
  })
  const state = useState<T>(key, () => storedValue.value ?? defaultValue)

  if (import.meta.server) {
    state.value = storedValue.value ?? defaultValue

    return state
  }

  const isInitialized = useState<boolean>(`${key}-initialized`, () => false)

  if (!isInitialized.value) {
    state.value = storedValue.value ?? defaultValue

    watch(
      state,
      (value) => {
        storedValue.value = value
      },
      { immediate: true },
    )

    isInitialized.value = true
  }

  return state
}

export const useLiveSettings = () => {
  const showGroupedStandings = usePersistedLiveSetting<boolean>(
    "admin-live-grouped-standings",
    true,
  )
  const flowPanelRatio = usePersistedLiveSetting<number>(
    "admin-live-flow-panel-ratio",
    0.34,
  )

  return {
    showGroupedStandings,
    flowPanelRatio,
  }
}
