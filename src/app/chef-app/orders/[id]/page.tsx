'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export default function OrderDetailPage() {
    const router = useRouter()
    const { id } = useParams()
    const supabase = createClient()
    const { user, isLoading: authLoading } = useAuth()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth-app/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (user && id) {
            fetchOrder()
        }
    }, [user, id])

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          availability (date, time_slot),
          menu: menus (price)
        `)
                .eq('id', id)
                .single()

            if (error) throw error
            setOrder(data)
        } catch (error) {
            console.error('Error fetching order:', error)
            // Redirect back if order not found
            // router.push('/chef-app/orders')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (newStatus: string) => {
        if (!order) return
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id)

            if (error) throw error
            setOrder({ ...order, status: newStatus as any })
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || !order) return null

    const status = STATUS_MAP[order.status]

    return (
        <div className="min-h-screen bg-[#F7F7F7] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="font-bold text-lg tracking-tight">订单详情</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-zinc-100 flex flex-col">
                    {/* Top Banner */}
                    <div className="bg-zinc-900 text-white p-8">
                        <div className="flex justify-between items-start mb-6">
                            <Badge className={`${status.color} px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] border-none`}>
                                {status.label}
                            </Badge>
                            <div className="text-right">
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">预计总额</p>
                                <p className="text-3xl font-black text-white">¥{(order.menu?.price || 0) * (order.guest_count || 1)}</p>
                            </div>
                        </div>
                        <h3 className="text-3xl font-black">服务确认</h3>
                        <p className="text-sm font-medium text-zinc-400 mt-1 opacity-60 font-mono">订单编号: {order.booking_code}</p>
                    </div>

                    <div className="p-10 space-y-10">
                        {/* Customer Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-1 bg-black rounded-full" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400">客户资料</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 p-5 bg-zinc-50 rounded-[24px]">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <User className="w-6 h-6 text-zinc-900" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">客户姓名</p>
                                        <p className="font-black text-lg">{order.customer_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-5 bg-zinc-50 rounded-[24px]">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <Phone className="w-6 h-6 text-zinc-900" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">联系电话</p>
                                        <p className="font-black text-lg">{order.customer_phone}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-6 bg-zinc-50 rounded-[24px]">
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                    <MapPin className="w-6 h-6 text-zinc-900" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">服务地址</p>
                                    <p className="font-bold text-zinc-900 leading-relaxed mt-1">{order.service_address}</p>
                                </div>
                            </div>
                        </section>

                        {/* Time Info */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-1 bg-black rounded-full" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400">时间与方案</h4>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 flex items-center gap-4 p-6 bg-black text-white rounded-[32px] shadow-xl shadow-black/10">
                                    <Calendar className="w-8 h-8 text-white/40" />
                                    <div>
                                        <p className="text-xl font-black">
                                            {order.availability?.date && format(new Date(order.availability.date), 'yyyy年MM月dd日', { locale: zhCN })}
                                        </p>
                                        <p className="text-white/60 font-bold">
                                            {order.availability?.time_slot === 'lunch' ? '午餐时段' : '晚餐时段'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 rounded-[32px] border-2 border-zinc-100 bg-white shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center">
                                        <Utensils className="w-6 h-6 text-zinc-900" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">预定方案</p>
                                        <p className="font-black text-base">{order.menu_name}</p>
                                        <p className="text-xs font-bold text-zinc-400">{order.guest_count} 席份量</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Notes */}
                        {order.notes && (
                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-1 bg-black rounded-full" />
                                    <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400">特殊要求</h4>
                                </div>
                                <div className="p-6 rounded-[24px] bg-zinc-50 text-base font-medium border border-transparent leading-relaxed text-zinc-700 italic">
                                    “{order.notes}”
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-10 border-t border-zinc-100 bg-white flex flex-col gap-4">
                        {order.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-16 rounded-2xl border-zinc-200 font-bold hover:bg-zinc-50 text-zinc-500"
                                    onClick={() => handleUpdateStatus('rejected')}
                                >
                                    暂不接单
                                </Button>
                                <Button
                                    className="flex-1 h-16 rounded-2xl bg-black text-white font-black shadow-2xl shadow-black/20"
                                    onClick={() => handleUpdateStatus('accepted')}
                                >
                                    立即接单
                                </Button>
                            </div>
                        )}
                        {order.status === 'accepted' && (
                            <Button
                                className="w-full h-16 rounded-2xl bg-green-600 text-white font-black shadow-2xl shadow-green-600/20"
                                onClick={() => handleUpdateStatus('completed')}
                            >
                                确认服务已通过
                            </Button>
                        )}
                        {['completed', 'rejected', 'cancelled'].includes(order.status) && (
                            <Button
                                variant="outline"
                                className="w-full h-16 rounded-2xl border-zinc-200 font-bold text-zinc-400"
                                onClick={() => router.back()}
                            >
                                返回列表
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
