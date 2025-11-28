import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase environment variables not configured")
    return null as any
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}
