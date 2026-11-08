import type { Database } from "@tourney/types"

export const useDatabaseClient = () => {
  return useSupabaseClient<Database>()
}
