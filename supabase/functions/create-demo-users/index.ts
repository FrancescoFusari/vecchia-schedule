
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Try to create admin user
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'password',
      email_confirm: true,
      user_metadata: {
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      },
    });

    // Try to create employee user
    const { data: employeeData, error: employeeError } = await supabase.auth.admin.createUser({
      email: 'employee@example.com',
      password: 'password', 
      email_confirm: true,
      user_metadata: {
        firstName: 'Employee',
        lastName: 'User',
        role: 'employee',
      },
    });

    const adminStatus = adminError ? `Error: ${adminError.message}` : 'Created successfully';
    const employeeStatus = employeeError ? `Error: ${employeeError.message}` : 'Created successfully';

    // If both users already exist, that's not an error
    let status = 200;
    let message = 'Demo users created or already exist';
    
    if (adminError && !adminError.message.includes('already exists')) {
      console.error('Error creating admin:', adminError);
      status = 500;
      message = 'Error creating admin user';
    }
    
    if (employeeError && !employeeError.message.includes('already exists')) {
      console.error('Error creating employee:', employeeError);
      status = 500;
      message = 'Error creating employee user';
    }
    
    return new Response(
      JSON.stringify({
        message,
        admin: adminStatus,
        employee: employeeStatus,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status 
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      },
    );
  }
});
