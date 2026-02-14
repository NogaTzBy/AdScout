import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side client with service role (for admin operations)
// Cast to any to bypass strict typing issues with code-generated Database types
export const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
) as any;
