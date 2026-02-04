import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, ChefHat, Calendar, DollarSign, Clock, Check, X
} from 'lucide-react'

export default async function AdminDashboardPage() {
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

  // Fetch stats
  const [usersCount, chefsCount, ordersCount, pendingOrders] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'chef'),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = {
    totalUsers: usersCount.count || 0,
    totalChefs: chefsCount.count || 0,
    totalOrders: ordersCount.count || 0,
    pendingOrders: pendingOrders.count || 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">管理后台</h1>
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">用户总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ChefHat className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.totalChefs}</p>
              <p className="text-sm text-muted-foreground">厨师总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
              <p className="text-sm text-muted-foreground">订单总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              <p className="text-sm text-muted-foreground">待处理</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold mb-4">管理菜单</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin-app/chefs">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <ChefHat className="w-8 h-8 text-primary" />
                <span className="font-medium">厨师管理</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin-app/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                <span className="font-medium">用户管理</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin-app/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <Calendar className="w-8 h-8 text-primary" />
                <span className="font-medium">订单管理</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin-app/schedules">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <Clock className="w-8 h-8 text-primary" />
                <span className="font-medium">日程统计</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin-app/menus">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <DollarSign className="w-8 h-8 text-primary" />
                <span className="font-medium">菜单统计</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
