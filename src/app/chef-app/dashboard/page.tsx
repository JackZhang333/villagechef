'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChefHat, Calendar, List, DollarSign, Utensils,
  Plus, Share2, LogOut, ChevronRight, Bell,
  Settings, Clock, CheckCircle2, Package, XCircle,
  Copy, ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'

interface ChefStats {
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalRevenue: number
}

interface RecentOrder {
  id: string
  booking_code: string
  customer_name: string
  status: string
  created_at: string
}

export default function ChefDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<ChefStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth-app/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchChefData()
    }
  }, [user])

  const fetchChefData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        setLoading(false)
        return
      }

      const { data: chef, error: chefError } = await supabase
        .from('chefs')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (chefError) {
        console.error('Chef profile error:', chefError)
        setLoading(false)
        return
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          status,
          guest_count,
          menu: menus (price)
        `)
        .eq('chef_id', chef.id)

      if (ordersError) {
        console.error('Orders error:', ordersError)
      } else {
        const totalOrders = ordersData?.length || 0
        const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0
        const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0

        // Calculate real revenue from completed orders
        const totalRevenue = ordersData
          ?.filter(o => o.status === 'completed')
          .reduce((sum, o: any) => sum + ((o.menu?.price || 0) * (o.guest_count || 1)), 0) || 0

        setStats({ totalOrders, pendingOrders, completedOrders, totalRevenue })
      }

      const { data: recentData, error: recentError } = await supabase
        .from('orders')
        .select('id, booking_code, customer_name, status, created_at')
        .eq('chef_id', chef.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentError) {
        console.error('Recent orders error:', recentError)
      } else {
        setRecentOrders(recentData || [])
      }
    } catch (error) {
      console.error('Error fetching chef data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/share/${user?.id}`
    navigator.clipboard.writeText(link)
    setCopying(true)
    toast.success('预约链接已复制')
    setTimeout(() => setCopying(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-muted-foreground">正在为您配置工作台...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string, className: string, icon: any }> = {
      pending: { label: '待处理', className: 'bg-zinc-100 text-zinc-600 border-zinc-200', icon: Clock },
      accepted: { label: '进行中', className: 'bg-blue-50 text-blue-700 border-blue-100', icon: Package },
      completed: { label: '已完成', className: 'bg-green-50 text-green-700 border-green-100', icon: CheckCircle2 },
      rejected: { label: '已拒单', className: 'bg-rose-50 text-rose-700 border-rose-100', icon: XCircle },
      cancelled: { label: '已取消', className: 'bg-zinc-50 text-zinc-400 border-zinc-100', icon: XCircle },
    }
    const config = configs[status] || configs.pending
    return (
      <Badge variant="outline" className={`px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border-none ${config.className}`}>
        <config.icon className="w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight italic">村厨</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Welcome Header */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight">下午好，{user.phone}</h1>
          <p className="text-muted-foreground mt-1 text-lg">今天准备为客人们带来什么美味？</p>
        </section>

        {/* Priority Actions */}
        {stats.pendingOrders > 0 && (
          <section>
            <Card className="rounded-[32px] border-none shadow-xl shadow-orange-900/5 bg-gradient-to-br from-orange-50 to-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-24 h-24 text-orange-600" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <Badge className="bg-orange-600 text-white border-none px-3 py-1 font-bold">待办事项</Badge>
                    <h2 className="text-2xl font-bold">您有 {stats.pendingOrders} 个待处理订单</h2>
                    <p className="text-orange-900/60 max-w-sm">
                      新的味蕾挑战正在等待确认，请及时查看并处理这些预订。
                    </p>
                  </div>
                  <Link href="/chef-app/orders?tab=pending">
                    <Button size="lg" className="rounded-2xl h-14 px-8 bg-black hover:bg-black/90 text-white font-bold group/btn shadow-lg shadow-black/10">
                      立即处理
                      <ChevronRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Dynamic Stats Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/chef-app/orders" className="col-span-1">
            <div className="bg-white p-6 rounded-[28px] shadow-sm hover:shadow-md transition-shadow border border-zinc-100 group">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-black transition-colors">总订单</p>
              <p className="text-3xl font-black">{stats.totalOrders}</p>
            </div>
          </Link>
          <Link href="/chef-app/orders?tab=completed" className="col-span-1">
            <div className="bg-white p-6 rounded-[28px] shadow-sm hover:shadow-md transition-shadow border border-zinc-100 group">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-green-600 transition-colors">已完成</p>
              <p className="text-3xl font-black">{stats.completedOrders}</p>
            </div>
          </Link>
          <div className="col-span-2 bg-black p-6 rounded-[28px] shadow-2xl shadow-black/10 text-white flex justify-between items-center group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">预计总收入</p>
              <p className="text-3xl font-black">¥{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Interactive Link Card */}
        <section>
          <div className="bg-white rounded-[32px] p-8 border border-zinc-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="w-20 h-20 rounded-[24px] bg-primary/5 flex items-center justify-center shrink-0">
              <Share2 className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
              <h3 className="text-xl font-bold">分享您的线上名片</h3>
              <p className="text-muted-foreground">将您的个人主页链接分享给潜在客户，开始接收直接预订。</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                size="lg"
                className={`flex-1 md:flex-none h-14 rounded-2xl font-bold transition-all ${copying ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                onClick={handleCopyLink}
              >
                {copying ? <CheckCircle2 className="mr-2 w-5 h-5 capitalize" /> : <Copy className="mr-2 w-5 h-5" />}
                {copying ? '已复制' : '复制链接'}
              </Button>
              <Link href={`/share/${user.id}`} target="_blank">
                <Button size="lg" variant="ghost" className="h-14 w-14 rounded-2xl p-0">
                  <ExternalLink className="w-6 h-6" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Main Tools (Left) */}
          <div className="md:col-span-3 space-y-6">
            <h2 className="text-xl font-bold px-2">常用管理工具</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { title: '菜品管理', desc: '上传您的拿手名菜，编辑配料与照片', icon: Utensils, href: '/chef-app/dishes', color: 'bg-rose-50 text-rose-600' },
                { title: '菜单配置', desc: '根据餐标组合不同价位的家宴套餐', icon: List, href: '/chef-app/menu', color: 'bg-blue-50 text-blue-600' },
                { title: '日程档期', desc: '设置您的可预约日期，锁定个人休息时间', icon: Calendar, href: '/chef-app/schedule', color: 'bg-amber-50 text-amber-600' }
              ].map((tool, i) => (
                <Link key={i} href={tool.href}>
                  <div className="bg-white p-6 rounded-[28px] border border-zinc-100 flex items-center gap-5 hover:border-black transition-all group">
                    <div className={`w-14 h-14 rounded-2xl ${tool.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                      <tool.icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{tool.title}</h4>
                      <p className="text-sm text-muted-foreground leading-snug">{tool.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity (Right) */}
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold px-2">最近动态</h2>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="bg-zinc-50 rounded-[28px] p-12 text-center border-2 border-dashed border-zinc-200">
                  <p className="text-muted-foreground font-medium">暂无最新动态</p>
                </div>
              ) : (
                recentOrders.map(order => (
                  <Link key={order.id} href={`/chef-app/orders/${order.id}`}>
                    <div className="bg-white p-5 rounded-[28px] border border-zinc-100 hover:shadow-md transition-all space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <p className="font-bold text-lg">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">#{order.booking_code}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {order.created_at ? format(new Date(order.created_at), 'M月d日 HH:mm', { locale: zhCN }) : '-'}
                        </span>
                        <span className="text-xs font-bold text-black border-b border-black">查看详情</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
              {recentOrders.length > 0 && (
                <Link href="/chef-app/orders">
                  <Button variant="ghost" className="w-full h-12 rounded-2xl font-bold bg-zinc-100 hover:bg-zinc-200">
                    查看所有订单
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-black text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-12 duration-1000">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-bold tracking-tight">工作台已准备就绪</span>
      </div>
    </div>
  )
}
