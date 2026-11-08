<script setup lang="ts"></script>

<template>
  <div>
    <!-- @vue-ignore -->
    <TheMobileNavigation v-if="$device.isMobileOrTablet" />
    <TheDesktopNavigation v-else />
  </div>
</template>
