import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminMenusPage() {
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

  const { data: menus } = await supabase
    .from('menus')
    .select(`
      *,
      chef:chefs (name),
      menu_items (count)
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
        <h1 className="text-xl font-bold">菜单统计</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {menus?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              暂无菜单
            </CardContent>
          </Card>
        ) : (
          menus?.map(menu => (
            <Card key={menu.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{menu.name}</h3>
                    <p className="text-sm text-muted-foreground">厨师: {menu.chef?.name}</p>
                  </div>
                  <Badge variant="outline">¥{menu.price}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{menu.dish_count}道菜</span>
                  <span>已添加: {menu.menu_items?.[0]?.count || 0}道</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  )
}
