import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
}

// Uses @supabase/ssr: writes session to both cookies and localStorage so Server
// Components and middleware can read it via cookie — no more localStorage-only lock-in.
export const supabase = createBrowserClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? ""
);
