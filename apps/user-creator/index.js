import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment")
}

const supabase = createClient(supabaseUrl, supabaseSecretKey)

async function createUser(email, password, role) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: role },
  })

  if (error) {
    console.error("Error creating user:", error)
    return
  }

  console.log("User created successfully:", data)
}

const usersToCreate = JSON.parse(process.env.USERS_TO_CREATE)

async function createAllUsers() {
  for (const user of usersToCreate) {
    await createUser(user.email, user.password, user.role)
  }
}

createAllUsers().then(() => console.log("User creation process complete."))
