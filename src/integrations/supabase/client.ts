// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://jlhnhhlhjsrdxagwxlde.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsaG5oaGxoanNyZHhhZ3d4bGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NzAxMzQsImV4cCI6MjA1NjQ0NjEzNH0.JVg4rwNAYXN0if58rBxs3aV9iXdFGIUy6ZTCXALpsPU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);