
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // Must use service role
)

Deno.serve(async (req) => {
  try {
    const { email, password, fullName, role, linkedStudentIds } = await req.json()

    // 1. Create the user in Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (userError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Auth user creation failed',
        detail: userError.message
      }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
    }

    const userId = userData.user.id

    // 2. Insert profile
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      full_name: fullName,
      role_name: role
    })

    if (profileError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Profile creation failed',
        detail: profileError.message
      }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
    }

    // 3. Role-specific inserts
    if (role === 'parent') {
      await supabaseAdmin.from('parents').insert({ user_id: userId })

      if (linkedStudentIds && linkedStudentIds.length > 0) {
        const parentLinks = linkedStudentIds.map((sid: string) => ({
          parent_id: userId,
          student_id: sid
        }))
        await supabaseAdmin.from('parent_student_links').insert(parentLinks)
      }
    } else if (role === 'instructor') {
      await supabaseAdmin.from('instructors').insert({ user_id: userId })
    }

    return new Response(JSON.stringify({
      success: true,
      userId,
      email
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unexpected server error',
      detail: err.message
    }), { headers: { 'Content-Type': 'application/json' }, status: 500 })
  }
})
