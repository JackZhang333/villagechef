import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth-app/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Link href="/admin-app/dashboard">
          <Button variant="ghost" size="sm">
            返回
          </Button>
        </Link>
        <h1 className="text-xl font-bold">用户管理</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {users?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              暂无用户
            </CardContent>
          </Card>
        ) : (
          users?.map(u => (
            <Card key={u.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{u.phone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{u.role}</Badge>
                      <Badge variant={u.is_active ? 'default' : 'destructive'}>
                        {u.is_active ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                  </div>
                  <form action={async () => {
                    'use server'
                    await supabase
                      .from('users')
                      .update({ is_active: !u.is_active })
                      .eq('id', u.id)
                  }}>
                    <Button variant="outline" size="sm">
                      {u.is_active ? '禁用' : '启用'}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  )
}
