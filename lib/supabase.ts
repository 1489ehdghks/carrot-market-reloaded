import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient>;

export function getSupabaseClient() {
    if (!supabaseClient) {
        supabaseClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return supabaseClient;
}