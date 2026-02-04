'use client'

import { formatLunar } from '@/lib/lunar-helper'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ArrowLeft, Calendar, Copy, Check, Share2, Sun, Moon, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Info, AlertTriangle, ExternalLink
} from 'lucide-react'
import { format, addDays, addMonths, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns'
import { Solar } from 'lunar-javascript'
import { zhCN } from 'date-fns/locale'
import { MAX_BOOKING_MONTHS } from '@/lib/constants'

// 预约时段类型
type TimeSlot = 'lunch' | 'dinner'

// 预约状态
type SlotStatus = 'available' | 'booked' | 'closed'

interface Availability {
  id: string
  date: string
  time_slot: TimeSlot
  is_booked: boolean
  is_active: boolean
  orders?: any[]
}

export default function ChefSchedulePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, isLoading: authLoading } = useAuth()

  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [selectedDate, setSelectedDate] = useState<{ date: Date; slot: TimeSlot } | null>(null)
  const [showOpenDialog, setShowOpenDialog] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth-app/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchAvailabilities()
    }
  }, [user, currentWeekStart])

  const fetchAvailabilities = async () => {
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('availability')
        .select(`*, orders (*)`)
        .eq('chef_id', user?.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error
      setAvailabilities(data || [])
    } catch (error) {
      console.error('Error fetching availabilities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSlotStatus = (date: Date, slot: TimeSlot): { status: SlotStatus; availability?: Availability } => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const availability = availabilities.find(a => a.date === dateStr && a.time_slot === slot)
    const today = startOfDay(new Date())
    const dateObj = startOfDay(date)
    const isPast = isBefore(dateObj, today)

    if (!availability) {
      return { status: isPast ? 'closed' : 'available' }
    }

    if (availability.is_booked) {
      return { status: 'booked', availability }
    }

    return { status: availability.is_active ? 'available' : 'closed', availability }
  }

  const setAvailable = async (date: Date, slot: TimeSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const current = getSlotStatus(date, slot)

    try {
      if (current.availability) {
        await supabase
          .from('availability')
          .update({ is_active: true })
          .eq('id', current.availability.id)
      } else {
        const shareToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
        const { data, error } = await supabase
          .from('availability')
          .insert({
            chef_id: user?.id,
            date: dateStr,
            time_slot: slot,
            is_active: true,
            is_booked: false,
            share_token: shareToken,
          })
          .select()
          .single()

        if (error) throw error
        setAvailabilities(prev => [...prev, data])
        return
      }

      setAvailabilities(prev => prev.map(a => {
        if (a.date === dateStr && a.time_slot === slot) {
          return { ...a, is_active: true }
        }
        return a
      }))
    } catch (error) {
      console.error('Error setting available:', error)
    }
  }

  const setClosed = async (date: Date, slot: TimeSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const current = getSlotStatus(date, slot)

    try {
      if (current.availability) {
        await supabase
          .from('availability')
          .update({ is_active: false })
          .eq('id', current.availability.id)

        setAvailabilities(prev => prev.map(a => {
          if (a.date === dateStr && a.time_slot === slot) {
            return { ...a, is_active: false }
          }
          return a
        }))
      } else {
        const shareToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
        const { data, error } = await supabase
          .from('availability')
          .insert({
            chef_id: user?.id,
            date: dateStr,
            time_slot: slot,
            is_active: false,
            is_booked: false,
            share_token: shareToken,
          })
          .select()
          .single()

        if (error) throw error
        setAvailabilities(prev => [...prev, data])
      }
    } catch (error) {
      console.error('Error setting closed:', error)
    }
  }

  const handleSlotClick = (date: Date, slot: TimeSlot) => {
    const current = getSlotStatus(date, slot)
    if (current.status === 'booked') return
    setSelectedDate({ date, slot })
    setShowOpenDialog(true)
  }

  const confirmAction = async () => {
    if (!selectedDate) return
    const current = getSlotStatus(selectedDate.date, selectedDate.slot)

    if (current.status === 'closed') {
      await setAvailable(selectedDate.date, selectedDate.slot)
    } else if (current.status === 'available') {
      await setClosed(selectedDate.date, selectedDate.slot)
    }

    setShowOpenDialog(false)
    setSelectedDate(null)
  }


  const getWeekday = (date: Date): string => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const handleShare = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${baseUrl}/share/${user?.id}`
    setShareUrl(url)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return null

  const dialogStatus = selectedDate ? getSlotStatus(selectedDate.date, selectedDate.slot) : null

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/chef-app/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg tracking-tight">日程管理</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full font-bold text-zinc-500 hover:text-black"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            分享
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight">时间排期</h2>
            <p className="text-muted-foreground font-medium">设置您的可用时段，让客户轻松预订</p>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center bg-white rounded-full p-1 border border-zinc-100 shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-zinc-50"
              onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
              disabled={isBefore(currentWeekStart, addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="px-4 text-sm font-black min-w-[140px] text-center">
              {format(currentWeekStart, 'yyyy年M月', { locale: zhCN })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-zinc-50"
              onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
              disabled={!isBefore(currentWeekStart, addMonths(new Date(), MAX_BOOKING_MONTHS))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-zinc-100 shadow-sm shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
            <span className="text-xs font-bold text-zinc-600">已开启</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-zinc-100 shadow-sm shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-zinc-600">已预约</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-zinc-100 shadow-sm shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
            <span className="text-xs font-bold text-zinc-600">不可约</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weekDays.map(date => {
            const lunch = getSlotStatus(date, 'lunch')
            const dinner = getSlotStatus(date, 'dinner')
            const isToday = isSameDay(date, new Date())
            const past = isBefore(startOfDay(date), startOfDay(new Date()))

            return (
              <div
                key={date.toISOString()}
                className={`bg-white rounded-[32px] overflow-hidden border transition-all ${isToday ? 'border-zinc-900 shadow-lg' : 'border-zinc-100 shadow-sm'}`}
              >
                <div className={`p-5 pb-3 ${isToday ? 'bg-zinc-900 text-white' : 'bg-zinc-50/50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        {getWeekday(date)}
                      </p>
                      <h3 className="text-2xl font-black mt-0.5">{format(date, 'd')}</h3>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-bold ${isToday ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        {formatLunar(date)}
                      </p>
                      {isToday && <Badge className="mt-1.5 bg-white text-black font-black uppercase tracking-tighter text-[9px] hover:bg-white">TODAY</Badge>}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <SlotButton
                    label="午餐"
                    icon={Sun}
                    status={lunch.status}
                    past={past}
                    onClick={() => {
                      if (lunch.status === 'booked' && lunch.availability?.orders?.[0]?.id) {
                        router.push(`/chef-app/orders/${lunch.availability.orders[0].id}`)
                      } else {
                        handleSlotClick(date, 'lunch')
                      }
                    }}
                  />
                  <SlotButton
                    label="晚餐"
                    icon={Moon}
                    status={dinner.status}
                    past={past}
                    onClick={() => {
                      if (dinner.status === 'booked' && dinner.availability?.orders?.[0]?.id) {
                        router.push(`/chef-app/orders/${dinner.availability.orders[0].id}`)
                      } else {
                        handleSlotClick(date, 'dinner')
                      }
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </main>



      {/* Action Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl max-w-sm">
          <div className={`p-10 text-center ${dialogStatus?.status === 'closed' ? 'bg-zinc-900 text-white' : 'bg-zinc-50'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${dialogStatus?.status === 'closed' ? 'bg-zinc-800' : 'bg-white shadow-xl shadow-zinc-200'}`}>
              {selectedDate?.slot === 'lunch' ? <Sun className="w-10 h-10" /> : <Moon className="w-10 h-10" />}
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {dialogStatus?.status === 'closed' ? '开启预约' : '暂时关闭'}
            </DialogTitle>
            <DialogDescription className={`mt-2 font-medium ${dialogStatus?.status === 'closed' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {selectedDate && format(selectedDate.date, 'M月d日', { locale: zhCN })} · {selectedDate?.slot === 'lunch' ? '午餐' : '晚餐'}
            </DialogDescription>
          </div>

          <div className="p-10 pt-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                {dialogStatus?.status === 'closed'
                  ? '开启后，该时段将显示在您的分享页中，客户可以直接进行自助预约。'
                  : '关闭后，客户在主页将无法看到此时段。已有预约的订单不受影响。'
                }
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className={`h-16 rounded-2xl font-black text-lg shadow-xl ${dialogStatus?.status === 'closed' ? 'bg-black text-white hover:bg-zinc-800 shadow-black/10' : 'bg-zinc-900 text-white shadow-zinc-900/10'}`}
                onClick={confirmAction}
              >
                {dialogStatus?.status === 'closed' ? '确认开启' : '确认关闭'}
              </Button>
              <Button
                variant="ghost"
                className="h-14 rounded-2xl font-bold text-zinc-400"
                onClick={() => setShowOpenDialog(false)}
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SlotButton({ label, icon: Icon, status, past, onClick }: any) {
  const configs = {
    available: {
      box: 'bg-zinc-900 text-white border-zinc-900 shadow-md active:scale-[0.98]',
      badge: 'bg-white/20 text-white',
      desc: '可预约'
    },
    booked: {
      box: 'bg-emerald-50 text-emerald-900 border-emerald-100 active:scale-[0.98]',
      badge: 'bg-emerald-500 text-white',
      desc: '已预约'
    },
    closed: {
      box: 'bg-zinc-100 text-zinc-400 border-transparent opacity-60 hover:opacity-100 active:scale-[0.98]',
      badge: 'bg-zinc-200 text-zinc-500',
      desc: '不可约'
    },
    past: {
      box: 'bg-zinc-50 text-zinc-300 border-transparent opacity-40 grayscale pointer-events-none',
      badge: 'bg-zinc-100 text-zinc-300',
      desc: '已结束'
    }
  }

  const currentStatus = past ? 'past' : status as SlotStatus
  const config = configs[currentStatus]

  return (
    <button
      className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${config.box}`}
      onClick={onClick}
      disabled={past}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 opacity-80" />
        <span className="font-black tracking-tight">{label}</span>
      </div>
      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${config.badge}`}>
        {config.desc}
      </div>
    </button>
  )
}
