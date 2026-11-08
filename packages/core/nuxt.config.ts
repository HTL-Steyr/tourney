import { readFileSync } from "node:fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

// needed for layer relative import (https://nuxt.com/docs/guide/going-further/layers#relative-paths-and-aliases)
const currentDir = dirname(fileURLToPath(import.meta.url))
const rootPackage = JSON.parse(
  readFileSync(join(currentDir, "../../package.json"), "utf8"),
) as { version?: string }

export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2025-07-28",
  modules: [
    "@nuxt/ui",
    "@nuxt/fonts",
    "@nuxt/image",
    "@nuxtjs/mdc",
    "@nuxtjs/supabase",
  ],
  devServer: {
    port: 3003,
  },
  css: [join(currentDir, "./assets/base.css")],
  runtimeConfig: {
    public: {
      clientVersion: rootPackage.version || "dev",
    },
  },
  mdc: {
    components: {
      prose: false,
    },
  },
  ui: {
    theme: {
      colors: [
        "primary",
        "secondary",
        "tertiary",
        "info",
        "success",
        "warning",
        "error",
      ],
    },
  },
  fonts: {
    defaults: {
      weights: [400, 500, 600],
      styles: ["normal", "italic"],
    },
    families: [
      { name: "Inter", provider: "google" },
      { name: "JetBrains Mono", provider: "google" },
    ],
  },
  // typescript: {
  //   typeCheck: true,
  // },
})
