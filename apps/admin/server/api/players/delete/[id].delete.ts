import { serverSupabaseClient } from "#supabase/server"
import type { Database } from "~/types/database.types"

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing player id",
    })
  }

  const { error } = await supabase.from("player").delete().eq("id", id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  setResponseStatus(event, 200, "Player deleted successfully")
})
