// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ["../../packages/core"],
  srcDir: "app",
  compatibilityDate: "2025-07-28",
  modules: ["@vueuse/nuxt"],
  supabase: {
    types: "~~/types/database.types.ts",
  },
  devtools: { enabled: true },
  vite: {
    optimizeDeps: {
      include: [
        "@nuxt/ui > prosemirror-state",
        "@nuxt/ui > prosemirror-transform",
        "@nuxt/ui > prosemirror-model",
        "@nuxt/ui > prosemirror-view",
        "@nuxt/ui > prosemirror-gapcursor",
      ],
    },
  },
  devServer: {
    port: 3000,
  },
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  runtimeConfig: {
    public: {
      clientUrl: "",
      docsUrl: "https://htl-steyr.github.io/tourney/",
    },
  },
})
