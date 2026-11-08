<script setup lang="ts">
const { enabled: aiAssistantEnabled } = useAiAssistant()
</script>

<template>
  <UDashboardGroup
    storage-key="admin-dashboard"
    class="gap-1 bg-neutral-100 p-2 dark:bg-neutral-950"
  >
    <TheSideNavigation />
    <BasePageWrapper>
      <slot />
    </BasePageWrapper>
    <AssistantSidebar v-if="aiAssistantEnabled" />
  </UDashboardGroup>
</template>
