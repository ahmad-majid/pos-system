import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "[ghar-jaisa] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing in frontend/.env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
