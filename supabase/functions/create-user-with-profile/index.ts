import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const { email, password, fullName, role, linkedStudentIds } = await req.json()

    if (!email || !password || !fullName || !role) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
    }

    // 1️⃣ Create auth user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (userError || !userData.user) throw new Error(userError?.message || 'Auth creation failed')

    const userId = userData.user.id

    // 2️⃣ Insert into user_profiles
    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: userId,
      full_name: fullName,
      role_name: role
    })
    if (profileError) throw new Error(profileError.message)

    // 3️⃣ Insert into users table
    const { error: userTableError } = await supabaseAdmin.from('users').insert({
      id: userId,
      full_name: fullName,
      role_id: null  // optional: lookup role.id from roles table
    })
    if (userTableError) throw new Error(userTableError.message)

    // 4️⃣ Role-specific
    let parentId = null
    if (role === 'parent') {
      const { data: parentData, error: parentError } = await supabaseAdmin.from('parents').insert({ user_id: userId }).select('id')
      if (parentError) throw new Error(parentError.message)
      parentId = parentData[0].id

      if (linkedStudentIds?.length > 0) {
        const parentLinks = linkedStudentIds.map(sid => ({ parent_id: parentId, student_id: sid }))
        const { error: linkError } = await supabaseAdmin.from('student_parent_link').insert(parentLinks)
        if (linkError) throw new Error(linkError.message)
      }
    } else if (role === 'instructor') {
      const { error: instructorError } = await supabaseAdmin.from('instructors').insert({ user_id: userId })
      if (instructorError) throw new Error(instructorError.message)
    }

    return new Response(JSON.stringify({ success: true, userId, email, role }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { headers: { 'Content-Type': 'application/json' }, status: 400 })
  }
})
