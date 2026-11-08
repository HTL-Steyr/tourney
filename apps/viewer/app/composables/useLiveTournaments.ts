import type { Tables } from "@tourney/types"

export const useLiveTournaments = () => {
  const tournaments = useState<Tables<"tournament">[]>(
    "liveTournaments",
    () => [],
  )

  const fetchTournaments = async () => {
    const { data } = await useFetch("/api/tournaments/live")
    tournaments.value = data.value ?? []
  }

  return {
    tournaments,
    fetchTournaments,
  }
}
