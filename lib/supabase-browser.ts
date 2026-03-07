import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
}

// Storage basato su cookie (compatibile con il server client in supabase-server.ts).
// Usa la stessa chiave 'sb-auth-token' così il server può leggere la sessione
// dai cookie HTTP e chiamare supabase.auth.getUser() correttamente.
const cookieStorage = {
  getItem(key: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(key + "="));
    return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
  },
  setItem(key: string, value: string): void {
    if (typeof document === "undefined") return;
    const maxAge = 60 * 60 * 24 * 30; // 30 giorni
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  },
  removeItem(key: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
  },
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "sb-auth-token",
        storage: cookieStorage,
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : ({
      from() {
        throw new Error("Supabase client not configured");
      },
    } as any);
