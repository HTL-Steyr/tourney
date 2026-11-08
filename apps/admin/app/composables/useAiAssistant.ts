export const useAiAssistant = () => {
  const storedPreference = useCookie<boolean>("admin-ai-assistant-enabled", {
    default: () => false,
  })
  const storedSidebarState = useCookie<{
    collapsed: boolean
    size: number
  }>("admin-dashboard-sidebar-assistant", {
    default: () => ({
      collapsed: false,
      size: 25,
    }),
  })
  const enabled = useState<boolean>(
    "admin-ai-assistant-enabled",
    () => storedPreference.value ?? false,
  )
  const collapsed = computed<boolean>({
    get: () => storedSidebarState.value?.collapsed ?? false,
    set: (value) => {
      storedSidebarState.value = {
        collapsed: value,
        size: storedSidebarState.value?.size ?? 25,
      }
    },
  })

  if (import.meta.server) {
    enabled.value = storedPreference.value ?? false
    return {
      collapsed,
      enabled,
    }
  }

  const isInitialized = useState<boolean>(
    "admin-ai-assistant-enabled-initialized",
    () => false,
  )

  if (!isInitialized.value) {
    enabled.value = storedPreference.value ?? false

    watch(
      enabled,
      (value) => {
        storedPreference.value = value
      },
      { immediate: true },
    )

    watch(enabled, (value, oldValue) => {
      if (value && oldValue === false) {
        collapsed.value = false
      }
    })

    isInitialized.value = true
  }

  return {
    collapsed,
    enabled,
  }
}
