import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminChefsPage() {
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

  const { data: chefs } = await supabase
    .from('chefs')
    .select(`
      *,
      user:users (*)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Link href="/admin-app/dashboard">
          <Button variant="ghost" size="sm">
            返回
          </Button>
        </Link>
        <h1 className="text-xl font-bold">厨师管理</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {chefs?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              暂无厨师
            </CardContent>
          </Card>
        ) : (
          chefs?.map(chef => (
            <Card key={chef.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{chef.name}</h3>
                    <p className="text-sm text-muted-foreground">{chef.phone}</p>
                    <p className="text-sm text-muted-foreground">{chef.address}</p>
                  </div>
                  <Badge variant={chef.is_active ? 'default' : 'destructive'}>
                    {chef.is_active ? '已启用' : '已禁用'}
                  </Badge>
                </div>
                {chef.bio && (
                  <p className="text-sm text-muted-foreground mb-3">{chef.bio}</p>
                )}
                <div className="flex gap-2">
                  <form action={async () => {
                    'use server'
                    await supabase
                      .from('chefs')
                      .update({ is_active: !chef.is_active })
                      .eq('id', chef.id)
                    await supabase
                      .from('users')
                      .update({ is_active: !chef.is_active })
                      .eq('id', chef.user_id)
                  }}>
                    <Button variant="outline" size="sm">
                      {chef.is_active ? '禁用' : '启用'}
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
