import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // Must use service role
)

Deno.serve(async (req) => {
  try {
    // Parse JSON body
    const { email, password, fullName, role, linkedStudentIds } = await req.json()

    if (!email || !password || !fullName || !role) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
    }

    // 1️⃣ Create the user in Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (userError || !userData.user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Auth user creation failed',
        detail: userError?.message || 'Unknown error'
      }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
    }

    const userId = userData.user.id

    // 2️⃣ Insert profile into user_profiles
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      full_name: fullName,
      role_name: role
    })

    if (profileError) {
      // Rollback auth user if profile insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({
        success: false,
        error: 'Profile creation failed',
        detail: profileError.message
      }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
    }

    // 3️⃣ Role-specific inserts
    if (role === 'parent') {
      // Insert into parents
      const { error: parentError } = await supabaseAdmin.from('parents').insert({ user_id: userId })
      if (parentError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Parent creation failed',
          detail: parentError.message
        }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
      }

      // Insert parent-student links if any
      if (linkedStudentIds && linkedStudentIds.length > 0) {
        const parentLinks = linkedStudentIds.map((sid: string) => ({
          parent_id: userId,
          student_id: sid
        }))
        const { error: linkError } = await supabaseAdmin.from('student_parent_link').insert(parentLinks)
        if (linkError) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Parent-student link creation failed',
            detail: linkError.message
          }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
        }
      }

    } else if (role === 'instructor') {
      const { error: instructorError } = await supabaseAdmin.from('instructors').insert({ user_id: userId })
      if (instructorError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Instructor creation failed',
          detail: instructorError.message
        }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
      }
    }

    // 4️⃣ Success response
    return new Response(JSON.stringify({
      success: true,
      userId,
      email,
      role
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    // Catch unexpected errors
    return new Response(JSON.stringify({
      success: false,
      error: 'Unexpected server error',
      detail: err.message
    }), { headers: { 'Content-Type': 'application/json' }, status: 500 })
  }
})
