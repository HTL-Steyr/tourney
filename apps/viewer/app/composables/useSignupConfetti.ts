interface Confetti {
  addConfetti: (options: { confettiNumber: number }) => Promise<void>
  clearCanvas: () => void
  destroyCanvas: () => void
}

interface ConfettiApi {
  JSConfetti: new () => Confetti
}

declare global {
  interface Window {
    JSConfetti: ConfettiApi["JSConfetti"]
  }
}

export function useSignupConfetti() {
  const reducedMotion = usePreferredReducedMotion()
  let confetti: Confetti | undefined
  let disposed = false
  let celebrated = false
  const canCelebrate = () => !disposed && reducedMotion.value !== "reduce"

  const { load } = useScriptNpm<ConfettiApi>({
    packageName: "js-confetti",
    version: "0.12.0",
    file: "dist/js-confetti.browser.js",
    scriptOptions: {
      trigger: "manual",
      use: () => ({
        JSConfetti: window.JSConfetti,
      }),
    },
  })

  watch(reducedMotion, (preference) => {
    if (preference === "reduce") {
      confetti?.clearCanvas()
    }
  })

  onScopeDispose(() => {
    disposed = true
    confetti?.clearCanvas()
    confetti?.destroyCanvas()
  })

  return async () => {
    if (import.meta.server || celebrated || !canCelebrate()) {
      return
    }

    celebrated = true
    try {
      const { JSConfetti } = await load()
      if (!canCelebrate()) {
        return
      }

      confetti = new JSConfetti()
      await confetti.addConfetti({ confettiNumber: 80 })
    } catch {
      // A decorative effect must never turn a successful signup into an error.
    }
  }
}
