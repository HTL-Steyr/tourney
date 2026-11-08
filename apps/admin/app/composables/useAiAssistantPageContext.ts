import type { AiAssistantPageDynamicContext } from "#shared/aiAssistant"

export const useAiAssistantPageContext = () => {
  const pageContext = useState<AiAssistantPageDynamicContext | null>(
    "admin-ai-assistant-page-context",
    () => null,
  )

  const setPageContext = (value: AiAssistantPageDynamicContext | null) => {
    pageContext.value = value
  }

  const clearPageContext = () => {
    pageContext.value = null
  }

  return {
    clearPageContext,
    pageContext,
    setPageContext,
  }
}
