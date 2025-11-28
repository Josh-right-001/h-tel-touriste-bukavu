import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (typeof window === "undefined") {
    // Return a dummy client for SSR that won't be used
    return null as any
  }

  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Supabase environment variables not configured")
    return null as any
  }

  client = createSupabaseClient(supabaseUrl, supabaseKey)
  return client
}
