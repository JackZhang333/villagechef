import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default async function AdminOrdersPage() {
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

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      chef:chefs (name),
      menu:menus (name, price)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'destructive' | 'warning'> = {
    pending: 'warning',
    accepted: 'default',
    completed: 'success',
    rejected: 'destructive',
    cancelled: 'secondary',
  }

  const statusLabels: Record<string, string> = {
    pending: '待接单',
    accepted: '已接单',
    completed: '已完成',
    rejected: '已拒单',
    cancelled: '已取消',
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Link href="/admin-app/dashboard">
          <Button variant="ghost" size="sm">
            返回
          </Button>
        </Link>
        <h1 className="text-xl font-bold">订单管理</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {orders?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              暂无订单
            </CardContent>
          </Card>
        ) : (
          orders?.map(order => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  </div>
                  <Badge variant={statusColors[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                </div>

                <div className="text-sm space-y-1 mb-3">
                  <p>预约码: <span className="font-mono">{order.booking_code}</span></p>
                  <p>日期: {order.date} {order.time_slot === 'lunch' ? '午餐' : '晚餐'}</p>
                  <p>地址: {order.service_address}</p>
                  <p>厨师: {order.chef?.name}</p>
                  <p>菜单: {order.menu?.name} (¥{order.menu?.price})</p>
                </div>

                <p className="text-xs text-muted-foreground">
                  下单时间: {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  )
}
