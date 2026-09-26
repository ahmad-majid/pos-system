import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // No proxy needed — all data goes directly to Supabase via @supabase/supabase-js
});
