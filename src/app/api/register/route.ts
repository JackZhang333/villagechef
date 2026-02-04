import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { phone, password, name, address, bio } = await request.json()

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 })
    }

    const cookieStore = await cookies()

    // 使用 service role key - 这应该绕过所有 RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Cookie setting might fail
            }
          },
        },
      }
    )

    console.log('Creating auth user...')

    // 1. 创建 auth 用户
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${phone}@villagechef.com`,
      password: password,
      email_confirm: true,
      user_metadata: {
        phone,
        role: 'chef',
        name,
        address,
        bio: bio || '',
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: '创建用户失败' }, { status: 400 })
    }

    console.log('Auth user created:', authData.user.id)

    // 2. 使用 SQL 直接插入 users 表（绕过 RLS）
    console.log('Inserting into users...')
    const { error: usersError } = await supabase.from('users').insert({
      id: authData.user.id,
      phone,
      role: 'chef',
      is_active: true,
    })

    if (usersError) {
      console.error('Users insert error:', usersError)
      return NextResponse.json({ error: '创建用户资料失败: ' + usersError.message }, { status: 400 })
    }

    console.log('Users inserted')

    // 3. 插入 chefs 表
    console.log('Inserting into chefs...')
    const { error: chefsError } = await supabase
      .from('chefs')
      .insert({
        id: authData.user.id,
        user_id: authData.user.id,
        name,
        phone,
        address,
        bio: bio || '',
        is_active: true,
      })

    if (chefsError) {
      console.error('Chefs insert error:', chefsError)
      // 清理：删除已创建的 auth 用户
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase.from('users').delete().eq('id', authData.user.id)
      return NextResponse.json({ error: '创建厨师资料失败: ' + chefsError.message }, { status: 400 })
    }

    console.log('Registration complete!')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: '服务器错误: ' + String(error) }, { status: 500 })
  }
}
