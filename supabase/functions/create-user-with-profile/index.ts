import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // must be service role key
)

Deno.serve(async (req) => {
  try {
    const { email, password, fullName, role, linkedStudentIds } = await req.json()

    // 1. Create user in Supabase Auth
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError) throw createError

    const userId = user.user.id

    // 2. Call SQL function to insert profile & role info
    const { data, error } = await supabase.rpc('create_user_with_profile', {
      p_id: userId,
      p_full_name: fullName,
      p_role_name: role,
      p_linked_students: linkedStudentIds || []
    })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400 })
  }
})
