// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ["../../packages/core"],
  devtools: {
    enabled: true,
  },
  colorMode: {
    preference: "light",
    fallback: "light",
  },
  runtimeConfig: {
    public: {
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL ?? "https://tourney.dino-kupinic.dev",
      adminAppUrl:
        process.env.NUXT_PUBLIC_ADMIN_APP_URL ??
        "https://tourney-admin.dino-kupinic.dev",
      viewerAppUrl:
        process.env.NUXT_PUBLIC_VIEWER_APP_URL ??
        "https://tourney-viewer.dino-kupinic.dev",
      muxDemoPlaybackId: process.env.NUXT_PUBLIC_MUX_DEMO_PLAYBACK_ID ?? "",
    },
  },
  supabase: {
    redirect: false,
  },
  devServer: {
    port: 3002,
  },
  routeRules: {
    "/": { prerender: true },
  },
  compatibilityDate: "2025-07-28",
})
