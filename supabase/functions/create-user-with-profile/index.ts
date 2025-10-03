import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, password, fullName, role, linkedStudentIds } = await req.json();

    if (!email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: email, password, fullName, and role are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // 1. Look up role_id from roles table
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('role_name', role)
      .maybeSingle();

    if (roleError) {
      throw new Error(`Failed to lookup role: ${roleError.message}`);
    }

    if (!roleData) {
      throw new Error(`Role '${role}' not found in database`);
    }

    const roleId = roleData.id;

    // 2. Create auth user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (userError || !userData.user) {
      throw new Error(userError?.message || 'Auth user creation failed');
    }

    const userId = userData.user.id;

    // 3. Insert into user_profiles with role_id
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role_id: roleId,
        role_name: role,
        role: role
      });

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    // 4. Role-specific tables
    let parentId = null;
    let parentData = null;

    if (role === 'parent') {
      const { data: newParent, error: parentError } = await supabaseAdmin
        .from('parents')
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (parentError) {
        throw new Error(`Failed to create parent record: ${parentError.message}`);
      }

      parentId = newParent.id;
      parentData = newParent;

      if (linkedStudentIds && linkedStudentIds.length > 0) {
        const parentLinks = linkedStudentIds.map((sid: string) => ({
          parent_id: parentId,
          student_id: sid
        }));

        const { error: linkError } = await supabaseAdmin
          .from('student_parent_link')
          .insert(parentLinks);

        if (linkError) {
          throw new Error(`Failed to link students to parent: ${linkError.message}`);
        }
      }
    } else if (role === 'instructor') {
      const { error: instructorError } = await supabaseAdmin
        .from('instructors')
        .insert({ user_id: userId });

      if (instructorError) {
        console.warn('Failed to create instructor record (table may not exist):', instructorError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: email,
          role: role
        },
        parent: parentData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (err: any) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'An unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});