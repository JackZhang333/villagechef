'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ArrowLeft, Clock, MapPin, Phone, User, CheckCircle2,
  XCircle, ChevronRight, Package, Utensils, Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Order {
  id: string
  created_at: string
  booking_code: string
  customer_name: string
  customer_phone: string
  service_address: string
  guest_count: number
  status: 'pending' | 'accepted' | 'completed' | 'rejected' | 'cancelled'
  notes: string | null
  menu_name: string
  availability: {
    date: string
    time_slot: string
  }
  menu: {
    price: number
  } | null
}

const STATUS_MAP = {
  pending: { label: '待处理', color: 'bg-zinc-100 text-zinc-600', icon: Clock },
  accepted: { label: '进行中', color: 'bg-blue-50 text-blue-600', icon: Package },
  completed: { label: '已完成', color: 'bg-green-50 text-green-600', icon: CheckCircle2 },
  rejected: { label: '已拒单', color: 'bg-rose-50 text-rose-600', icon: XCircle },
  cancelled: { label: '已取消', color: 'bg-zinc-100 text-zinc-400', icon: XCircle },
}

export default function ChefOrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth-app/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          availability (date, time_slot),
          menu: menus (price)
        `)
        .eq('chef_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return null

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const activeOrders = orders.filter(o => o.status === 'accepted')
  const historyOrders = orders.filter(o => ['completed', 'rejected', 'cancelled'].includes(o.status))

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/chef-app/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg tracking-tight">订单管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">我的预约</h2>
          <p className="text-muted-foreground font-medium">高效处理每一个精心准备的订单</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-white p-1.5 rounded-full border border-zinc-100 shadow-sm w-full h-[60px]">
            <TabsTrigger
              value="pending"
              className="flex-1 rounded-full h-full data-[state=active]:bg-black data-[state=active]:text-white transition-all font-bold text-sm"
            >
              待处理
              {pendingOrders.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {pendingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex-1 rounded-full h-full data-[state=active]:bg-black data-[state=active]:text-white transition-all font-bold text-sm"
            >
              进行中
              {activeOrders.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black">
                  {activeOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 rounded-full h-full data-[state=active]:bg-black data-[state=active]:text-white transition-all font-bold text-sm"
            >
              历史订单
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 outline-none">
            {pendingOrders.length === 0 ? (
              <EmptyState icon={Clock} title="暂无待处理订单" description="当客户下单后，您会在这里看到新的预约" />
            ) : (
              pendingOrders.map(order => (
                <Link key={order.id} href={`/chef-app/orders/${order.id}`}>
                  <OrderCard order={order} />
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4 outline-none">
            {activeOrders.length === 0 ? (
              <EmptyState icon={Package} title="暂无进行中的订单" description="已确认的订单将显示在这里" />
            ) : (
              activeOrders.map(order => (
                <Link key={order.id} href={`/chef-app/orders/${order.id}`}>
                  <OrderCard order={order} />
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 outline-none">
            {historyOrders.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="暂无历史订单" description="完成、拒单或取消的订单将统一存档在此" />
            ) : (
              historyOrders.map(order => (
                <Link key={order.id} href={`/chef-app/orders/${order.id}`}>
                  <OrderCard order={order} />
                </Link>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const status = STATUS_MAP[order.status]
  const StatusIcon = status.icon

  return (
    <div
      className="bg-white rounded-[32px] p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge className={`${status.color} px-3 py-1 rounded-full font-black uppercase tracking-widest text-[9px] border-none`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
            <span className="text-xs font-bold text-zinc-300">ID: {order.id.slice(0, 8)}</span>
          </div>

          <div>
            <h4 className="text-xl font-black mb-1 truncate">{order.customer_name} 的预约</h4>
            <div className="flex items-center gap-4 font-medium text-sm text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{order.availability?.date && format(new Date(order.availability.date), 'MM月dd日')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{order.availability?.time_slot === 'lunch' ? '午餐' : '晚餐'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-zinc-900 font-black">
              <span className="text-sm">¥</span>
              <span className="text-xl">{(order.menu?.price || 0) * (order.guest_count || 1)}</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400 group-hover:text-black transition-colors">
              <span className="text-xs font-bold uppercase tracking-widest">查看详情</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Visual Decoration for status */}
        <div className="absolute top-[-20px] right-[-20px] w-24 h-24 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <StatusIcon className="w-full h-full" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-white rounded-[32px] p-20 text-center border border-zinc-100 shadow-sm space-y-4">
      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
        <Icon className="w-10 h-10" />
      </div>
      <div className="space-y-1">
        <p className="text-xl font-bold">{title}</p>
        <p className="text-muted-foreground max-w-[240px] mx-auto text-sm">{description}</p>
      </div>
    </div>
  )
}
