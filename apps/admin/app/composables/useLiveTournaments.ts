import type { Tables } from "@tourney/types"

export const useLiveTournaments = () => {
  const liveTournaments = useState<number>("liveTournamentsCount", () => 0)
  const tournaments = useState<Tables<"tournament">[]>(
    "liveTournaments",
    () => [],
  )

  const fetchLiveTournaments = async () => {
    liveTournaments.value = await $fetch<number>("/api/tournaments/live/count")
  }

  const fetchTournaments = async () => {
    tournaments.value = await $fetch<Tables<"tournament">[]>(
      "/api/tournaments/live",
    )
  }

  return {
    tournaments,
    liveTournaments,
    fetchLiveTournaments,
    fetchTournaments,
  }
}
