'use client'

// import { formatLunar } from '@/lib/lunar-helper'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, addMonths, startOfMonth, endOfMonth, isSameMonth, isSameDay, isBefore, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar as CalendarIcon, Sun, Moon, Check, Phone, User, MapPin, Users, Utensils, ChevronLeft, ChevronRight, Star, Minus, Plus, ArrowRight } from 'lucide-react'
import { MAX_BOOKING_MONTHS } from '@/lib/constants'
import { toast } from 'sonner'

interface Chef {
  id: string
  name: string
  bio: string
  phone: string
  address: string
}

interface Menu {
  id: string
  name: string
  dish_count: number
  price: number
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu_items?: any[]
}

interface Availability {
  id?: string
  date: string
  time_slot: 'lunch' | 'dinner'
  is_booked: boolean
  is_active: boolean
}

interface BookingForm {
  customer_name: string
  customer_phone: string
  service_address: string
  notes: string
  menu_id: string
  menu_name: string
  guest_count: number
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const chefId = params.chefId as string

  const [chef, setChef] = useState<Chef | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentStep, setCurrentStep] = useState(1)
  const [isBookingStarted, setIsBookingStarted] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null)
  const [booking, setBooking] = useState<BookingForm>({
    customer_name: '',
    customer_phone: '',
    service_address: '',
    notes: '',
    menu_id: '',
    menu_name: '',
    guest_count: 5,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedCode, setSubmittedCode] = useState('')
  const [showMenuDetail, setShowMenuDetail] = useState<Menu | null>(null)

  useEffect(() => {
    if (chefId) {
      fetchChefData()
    }
  }, [chefId])

  const fetchChefData = async () => {
    try {
      // Fetch chef info
      const { data: chefData, error: chefError } = await supabase
        .from('chefs')
        .select('id, name, bio, phone, address')
        .eq('id', chefId)
        .single()

      if (chefError) throw chefError
      setChef(chefData)

      // Fetch menus
      const { data: menusData, error: menusError } = await supabase
        .from('menus')
        .select('id, name, dish_count, price, description, menu_items(dishes(id, name, category))')
        .eq('chef_id', chefId)
        .order('created_at', { ascending: false })

      if (menusError) throw menusError
      setMenus(menusData || [])

      // Fetch all availabilities including booked (next 90 days)
      const startDate = format(new Date(), 'yyyy-MM-dd')
      const endDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd')
      const { data: availData, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('chef_id', chefId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (availError) throw availError
      setAvailabilities(availData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailability = (date: Date, slot: 'lunch' | 'dinner'): Availability | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return availabilities.find(a => a.date === dateStr && a.time_slot === slot)
  }

  const isPastDate = (date: Date): boolean => {
    const today = startOfDay(new Date())
    const dateObj = startOfDay(date)
    return isBefore(dateObj, today)
  }

  const getMonthDates = (month: Date): Date[] => {
    const dates: Date[] = []
    const start = startOfMonth(month)
    const end = endOfMonth(month)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }
    return dates
  }

  // Get availability status for display (matches chef's logic)
  const getDayAvailability = (date: Date): { lunch?: Availability; dinner?: Availability; hasAny: boolean; lunchStatus: string; dinnerStatus: string } => {
    const lunch = getAvailability(date, 'lunch')
    const dinner = getAvailability(date, 'dinner')
    const today = startOfDay(new Date())
    const dateObj = startOfDay(date)
    const isPast = isBefore(dateObj, today)

    // Status: only 'available' when is_active=true AND is_booked=false
    // Future dates without records default to open (available)
    let lunchStatus = 'none' // none | available | booked
    let dinnerStatus = 'none'

    if (lunch) {
      if (lunch.is_booked) lunchStatus = 'booked'
      else if (lunch.is_active) lunchStatus = 'available'
    } else if (!isPast) {
      // No record, future date = available (default open)
      lunchStatus = 'available'
    }

    if (dinner) {
      if (dinner.is_booked) dinnerStatus = 'booked'
      else if (dinner.is_active) dinnerStatus = 'available'
    } else if (!isPast) {
      // No record, future date = available (default open)
      dinnerStatus = 'available'
    }

    return {
      lunch,
      dinner,
      hasAny: lunchStatus === 'available' || dinnerStatus === 'available',
      lunchStatus,
      dinnerStatus,
    }
  }

  const handleBook = (slot: Availability) => {
    setSelectedSlot(slot)
  }

  useEffect(() => {
    // Auto scroll to top when step changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  const handleSubmitBooking = async () => {
    if (!chef || !selectedSlot || !booking.customer_name || !booking.customer_phone || !booking.menu_id) return

    setSubmitting(true)
    try {
      const bookingCode = 'BK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()

      // Check if we need to create availability first
      let availabilityId = selectedSlot.id

      if (!selectedSlot.id) {
        // Create new availability record
        const { data: newAvail, error: createError } = await supabase
          .from('availability')
          .insert({
            chef_id: chef.id,
            date: selectedSlot.date,
            time_slot: selectedSlot.time_slot,
            is_active: true,
            is_booked: false,
          })
          .select()
          .single()

        if (createError) throw createError
        availabilityId = newAvail.id
      }

      const { error } = await supabase
        .from('orders')
        .insert({
          booking_code: bookingCode,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          chef_id: chef.id,
          availability_id: availabilityId,
          menu_id: booking.menu_id,
          menu_name: booking.menu_name,
          guest_count: booking.guest_count,
          status: 'pending',
          service_address: booking.service_address,
          notes: booking.notes,
        })

      if (error) throw error

      // Note: We no longer update availability to is_booked: true here.
      // It will be updated when the chef accepts the order.

      // Refresh data
      await fetchChefData()

      setSubmittedCode(bookingCode)
      setSubmitted(true)
      toast.success('预约提交成功')
    } catch (error) {
      console.error('Error booking:', error)
      toast.error('预约失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const months = Array.from({ length: MAX_BOOKING_MONTHS }, (_, i) => addMonths(new Date(), i))
  const minMonth = startOfMonth(new Date())
  const maxMonth = startOfMonth(addMonths(new Date(), MAX_BOOKING_MONTHS - 1))

  if (loading) {
    return (
      <div className="h5-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!chef) {
    return (
      <div className="h5-container flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">厨师不存在</p>
            <p className="text-sm text-muted-foreground">该预约链接可能已失效</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
              <Check className="w-12 h-12 text-green-500" strokeWidth={3} />
            </div>
            {/* Decorative circles */}
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-orange-400 animate-pulse" />
            <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-blue-400 animate-pulse delay-75" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">预约已提交！</h1>
            <p className="text-muted-foreground">您的预约正在由厨师处理中</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border border-muted/20 space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">您的唯一预约码</div>
              <div className="text-4xl font-black font-mono tracking-tighter text-primary">{submittedCode}</div>
              <p className="text-[10px] text-muted-foreground pt-1 italic">请保存此号码以便查询</p>
            </div>

            <div className="pt-6 border-t grid grid-cols-2 gap-4 text-left text-sm">
              <div>
                <div className="text-muted-foreground text-xs">用餐日期</div>
                <div className="font-semibold">{selectedSlot && format(new Date(selectedSlot.date), 'M月d日')} {selectedSlot?.time_slot === 'lunch' ? '午餐' : '晚餐'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">预订桌数</div>
                <div className="font-semibold">{booking.guest_count} 桌精华宴</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button className="w-full h-12 rounded-xl bg-black text-white font-bold" onClick={() => setSubmitted(false)}>
              返回浏览其他套餐
            </Button>
            <p className="text-xs text-muted-foreground">
              后续厨师将通过电话 <span className="font-bold underline">{chef.phone}</span> 与您确认
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {!isBookingStarted && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Info, Menus, Calendar */}
            <div className="lg:col-span-2 space-y-12">
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white border-2 rounded-[40px] p-8 sm:p-12 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0" />

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                          <h2 className="text-3xl sm:text-4xl font-black">{chef.name}</h2>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-none px-3 py-1 flex items-center gap-1">
                            <Check className="w-3 h-3" /> 已实名认证
                          </Badge>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-4 text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                            <span className="text-foreground">4.9评分</span>
                          </div>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Utensils className="w-4 h-4" />
                            <span className="text-foreground">服务 100+ 次</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-muted-foreground leading-relaxed text-lg italic">
                        "{chef.bio || '主攻地道家乡味，传承百年烹饪心。希望能通过我的手艺，让您的每一顿家宴都充满温度。'}"
                      </p>

                      <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <Button
                          size="lg"
                          className="h-16 px-12 rounded-2xl bg-black text-white hover:bg-black/90 font-bold text-xl shadow-2xl shadow-black/20 group/btn active:scale-95 transition-all"
                          onClick={() => {
                            setIsBookingStarted(true);
                            setTimeout(() => {
                              document.getElementById('wizard-top')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                        >
                          立即预约家宴
                          <ArrowRight className="ml-2 w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                        <Button variant="outline" size="lg" className="h-16 px-8 rounded-2xl border-2 font-bold text-lg">
                          查看更多评价
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {isBookingStarted && (
        <div id="wizard-top" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Step Indicator - Sticky */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-8 sm:mb-12 border-b sm:border-none">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1 flex flex-col items-center relative gap-2 group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 ${currentStep >= step ? 'bg-black text-white' : 'bg-muted text-muted-foreground'}`}>
                    {step < currentStep ? <Check className="w-5 h-5" /> : step}
                  </div>
                  <span className={`text-xs font-bold tracking-wider uppercase transition-colors ${currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step === 1 ? '选择套餐' : step === 2 ? '预约时间' : '填写资料'}
                  </span>
                  {step < 3 && (
                    <div className={`absolute left-[50%] top-5 w-full h-[2px] -z-0 transition-colors duration-500 ${currentStep > step ? 'bg-black' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="min-h-[60vh]">
            {currentStep === 1 && (
              <section id="packages-section" className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">精选家宴套餐</h2>
                  <p className="text-muted-foreground">请先选择您心仪的套餐与预订桌数</p>
                </div>

                {/* Guest Count Selection Integrated here */}
                <div className="bg-white border-2 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm max-w-lg mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">预订规模</h4>
                        <p className="text-xs text-muted-foreground">请确认需要的总桌数</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-2"
                        onClick={() => setBooking(prev => ({ ...prev, guest_count: Math.max(1, prev.guest_count - 1) }))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-xl font-bold w-12 text-center">{booking.guest_count}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-2"
                        onClick={() => setBooking(prev => ({ ...prev, guest_count: Math.min(30, prev.guest_count + 1) }))}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {menus.map(menu => (
                    <Card
                      key={menu.id}
                      className={`cursor-pointer transition-all hover:shadow-xl border-2 overflow-hidden rounded-3xl ${booking.menu_id === menu.id ? 'border-black bg-black/[0.02]' : 'border-muted/30 hover:border-muted-foreground/30'
                        }`}
                      onClick={() => {
                        setBooking({ ...booking, menu_id: menu.id, menu_name: menu.name })
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="relative h-48 bg-muted">
                          <img
                            src="/images/chef-hero.png"
                            className={`w-full h-full object-cover transition-all duration-700 ${booking.menu_id === menu.id ? 'opacity-100 scale-105' : 'opacity-80 grayscale hover:grayscale-0'}`}
                            alt={menu.name}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-4 left-4 text-white">
                            <h3 className="text-xl font-bold">{menu.name}</h3>
                            <div className="flex items-center gap-2 text-xs opacity-90 font-medium">
                              <Utensils className="w-3 h-3" />
                              <span>{menu.dish_count} 道精品菜</span>
                            </div>
                          </div>
                          {booking.menu_id === menu.id && (
                            <div className="absolute top-4 right-4 bg-white text-black p-1.5 rounded-full shadow-lg">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="p-6 space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] italic">"{menu.description}"</p>
                          <div className="flex justify-between items-center pt-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black">¥{menu.price}</span>
                              <span className="text-xs text-muted-foreground font-bold">/ 桌</span>
                            </div>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-bold text-black"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMenuDetail(menu);
                              }}
                            >
                              查看详情 <ChevronRight className="w-3 h-3 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section id="calendar-section" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">预约家宴上门时间</h2>
                  <p className="text-muted-foreground">所选套餐：{booking.menu_name}</p>
                </div>

                <div className="bg-white border-2 rounded-[32px] p-6 sm:p-10 shadow-sm max-w-2xl mx-auto">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-8 pb-8 border-b">
                    <h3 className="font-bold text-2xl">
                      {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
                    </h3>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                        disabled={isBefore(startOfMonth(currentMonth), addMonths(minMonth, 1))}
                        className="rounded-2xl w-12 h-12 border-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        disabled={!isBefore(startOfMonth(currentMonth), maxMonth)}
                        className="rounded-2xl w-12 h-12 border-2"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                    {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                      <div key={day} className="py-2">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {getMonthDates(currentMonth).map((date, idx) => {
                      const { lunch, dinner, lunchStatus, dinnerStatus, hasAny } = getDayAvailability(date)
                      const today = isSameDay(date, new Date())
                      const isPast = isPastDate(date)
                      const isCurrentMonth = isSameMonth(date, currentMonth)
                      const isSelected = selectedSlot && isSameDay(date, new Date(selectedSlot.date))

                      const lunchAvailable = lunchStatus === 'available'
                      const dinnerAvailable = dinnerStatus === 'available'

                      return (
                        <button
                          key={date.toISOString()}
                          className={`
                          aspect-square flex flex-col items-center justify-center rounded-[20px] transition-all relative group
                          ${isPast ? 'opacity-10 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}
                          ${isSelected ? 'bg-black text-white scale-105 shadow-lg z-10' : ''}
                          ${!hasAny && !isPast ? 'opacity-30' : ''}
                          ${today && !isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                        `}
                          onClick={() => {
                            if (!isPast && hasAny) {
                              const dateStr = format(date, 'yyyy-MM-dd')
                              if (lunchAvailable) handleBook(lunch || { date: dateStr, time_slot: 'lunch', is_booked: false, is_active: true })
                              else if (dinnerAvailable) handleBook(dinner || { date: dateStr, time_slot: 'dinner', is_booked: false, is_active: true })
                            }
                          }}
                          disabled={isPast || !hasAny}
                        >
                          <span className="text-base font-bold">{format(date, 'd')}</span>
                          <span className={`text-[9px] font-medium leading-none -mt-0.5 mb-1 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {/*                            {(() => {
                              try {
                                return formatLunar(date)
                              } catch (e) {
                                console.error('Lunar Error:', e)
                                return ''
                              }
                            })()} */}
                          </span>
                          {hasAny && !isPast && (
                            <div className="flex gap-1">
                              {lunchAvailable && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-400'}`} />}
                              {dinnerAvailable && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-blue-400'}`} />}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {selectedSlot && (
                    <div className="mt-12 pt-10 border-t">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center sm:text-left">
                          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">已选择日期</p>
                          <p className="text-xl font-bold">
                            {format(new Date(selectedSlot.date), 'M月d日', { locale: zhCN })} ·
                            {selectedSlot.time_slot === 'lunch' ? ' 午餐' : ' 晚餐'}
                          </p>
                        </div>
                        <div className="flex gap-3 bg-muted p-1.5 rounded-[20px]">
                          <Button
                            variant={selectedSlot.time_slot === 'lunch' ? 'default' : 'ghost'}
                            className={`rounded-2xl px-6 h-11 font-bold ${selectedSlot.time_slot === 'lunch' ? 'bg-black text-white' : 'text-muted-foreground'}`}
                            onClick={() => {
                              const { lunchStatus } = getDayAvailability(new Date(selectedSlot.date))
                              if (lunchStatus === 'available') handleBook({ ...selectedSlot, time_slot: 'lunch' })
                            }}
                          >午餐</Button>
                          <Button
                            variant={selectedSlot.time_slot === 'dinner' ? 'default' : 'ghost'}
                            className={`rounded-2xl px-6 h-11 font-bold ${selectedSlot.time_slot === 'dinner' ? 'bg-black text-white' : 'text-muted-foreground'}`}
                            onClick={() => {
                              const { dinnerStatus } = getDayAvailability(new Date(selectedSlot.date))
                              if (dinnerStatus === 'available') handleBook({ ...selectedSlot, time_slot: 'dinner' })
                            }}
                          >晚餐</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section id="details-section" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">填写服务地址与联系人</h2>
                  <p className="text-muted-foreground">厨师将根据您填写的地址按时上门提供服务</p>
                </div>

                <div className="bg-white border-2 rounded-[40px] p-8 sm:p-12 space-y-10 shadow-sm max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">您的姓名</Label>
                      <div className="relative group">
                        <Input
                          className="h-16 px-6 rounded-2xl border-2 focus-visible:ring-0 focus-visible:border-black transition-all bg-muted/30 group-hover:bg-white"
                          id="name"
                          placeholder="例如：张先生"
                          value={booking.customer_name}
                          onChange={e => setBooking({ ...booking, customer_name: e.target.value })}
                        />
                        <User className="absolute right-4 top-5 w-5 h-5 text-muted-foreground/50" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">联系电话</Label>
                      <div className="relative group">
                        <Input
                          className="h-16 px-6 rounded-2xl border-2 focus-visible:ring-0 focus-visible:border-black transition-all bg-muted/30 group-hover:bg-white"
                          id="phone"
                          type="tel"
                          placeholder="用于厨师与您联系"
                          value={booking.customer_phone}
                          onChange={e => setBooking({ ...booking, customer_phone: e.target.value })}
                        />
                        <Phone className="absolute right-4 top-5 w-5 h-5 text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">厨师上门详细地址</Label>
                    <div className="relative group">
                      <Textarea
                        className="px-6 py-5 rounded-[24px] border-2 focus-visible:ring-0 focus-visible:border-black transition-all bg-muted/30 group-hover:bg-white resize-none min-h-[140px]"
                        id="address"
                        placeholder="请填写详细的街道、小区、楼栋及门牌号"
                        value={booking.service_address}
                        onChange={e => setBooking({ ...booking, service_address: e.target.value })}
                      />
                      <MapPin className="absolute right-5 top-5 w-5 h-5 text-muted-foreground/50" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">备注说明 (选填)</Label>
                    <div className="relative group">
                      <Input
                        className="h-16 px-6 rounded-2xl border-2 focus-visible:ring-0 focus-visible:border-black transition-all bg-muted/30 group-hover:bg-white"
                        id="notes"
                        placeholder="口味偏好、忌口或其他特殊要求"
                        value={booking.notes}
                        onChange={e => setBooking({ ...booking, notes: e.target.value })}
                      />
                      <Star className="absolute right-4 top-5 w-5 h-5 text-muted-foreground/50" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {['不要辣', '少油少盐', '忌口花生', '有小朋友', '忌口香菜'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const currentNotes = booking.notes ? booking.notes.split(' ') : []
                            if (currentNotes.includes(tag)) {
                              setBooking({ ...booking, notes: currentNotes.filter(n => n !== tag).join(' ') })
                            } else {
                              setBooking({ ...booking, notes: [...currentNotes, tag].join(' ') })
                            }
                          }}
                          className={`text-xs px-4 py-2 rounded-full border-2 transition-all font-bold ${booking.notes?.includes(tag) ? 'bg-black border-black text-white' : 'bg-transparent border-muted hover:border-muted-foreground text-muted-foreground'
                            }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* Menu Detail Dialog */}
      <Dialog open={!!showMenuDetail} onOpenChange={() => setShowMenuDetail(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-0 overflow-hidden outline-none">
          <div className="relative h-48 bg-muted">
            <img
              src="/images/chef-hero.png"
              className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
              alt="Menu header"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 bg-white/80 rounded-full hover:bg-white"
              onClick={() => setShowMenuDetail(null)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-8 -mt-12 relative bg-background rounded-t-3xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold">{showMenuDetail?.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Utensils className="w-4 h-4" /> {showMenuDetail?.dish_count} 道精品菜肴</span>
                  <span>·</span>
                  <span className="font-semibold text-foreground text-base">¥{showMenuDetail?.price} / 桌</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 py-1">推荐套餐</Badge>
            </div>

            <div className="space-y-8">
              {/* Description */}
              <div className="text-muted-foreground leading-relaxed">
                {showMenuDetail?.description}
              </div>

              {/* Dish Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {showMenuDetail?.menu_items && showMenuDetail.menu_items.length > 0 ? (
                  <>
                    {/* Cold Dishes */}
                    {showMenuDetail.menu_items.some((item: any) => item.dishes?.category === 'cold') && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">冷菜精选</h4>
                        <ul className="space-y-3">
                          {showMenuDetail.menu_items
                            .filter((item: any) => item.dishes?.category === 'cold')
                            .map((item: any, idx: number) => (
                              <li key={idx} className="flex items-center gap-3">
                                <span className="w-1 h-1 bg-orange-400 rounded-full" />
                                <span className="text-base">{item.dishes?.name}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Hot Dishes */}
                    {showMenuDetail.menu_items.some((item: any) => item.dishes?.category === 'hot') && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">热菜推荐</h4>
                        <ul className="space-y-3">
                          {showMenuDetail.menu_items
                            .filter((item: any) => item.dishes?.category === 'hot')
                            .map((item: any, idx: number) => (
                              <li key={idx} className="flex items-center gap-3">
                                <span className="w-1 h-1 bg-blue-400 rounded-full" />
                                <span className="text-base">{item.dishes?.name}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="col-span-2 py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border-dashed border-2">
                    <p>厨师正在精心准备菜单详情...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 flex gap-3">
              <Button
                className="flex-1 h-12 bg-black hover:bg-black/80 text-white rounded-xl font-bold"
                onClick={() => {
                  setBooking({ ...booking, menu_id: showMenuDetail!.id, menu_name: showMenuDetail!.name })
                  setShowMenuDetail(null)
                  document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                选择此套餐
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Bottom Navigation Bar */}
      {isBookingStarted && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] pb-safe animate-in fade-in slide-in-from-bottom-full duration-500">
          <div className="max-w-4xl mx-auto px-4 h-24 flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              {currentStep > 1 && (
                <Button
                  variant="ghost"
                  className="h-14 px-8 rounded-2xl font-bold flex items-center gap-2 hover:bg-muted"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  <ChevronLeft className="w-5 h-5" /> 返回
                </Button>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">
                  {booking.menu_id ? `¥${menus.find(m => m.id === booking.menu_id)?.price}` : '-'}
                </span>
                <span className="text-xs text-muted-foreground font-bold">/ 桌</span>
              </div>
              <div className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                {currentStep === 1 ? '请选择一套精选家宴' :
                  currentStep === 2 ? (selectedSlot ? `${format(new Date(selectedSlot.date), 'M月d日')} ${selectedSlot.time_slot === 'lunch' ? '午餐' : '晚餐'}` : '请选择上门时间') :
                    '核对信息并完成预订'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="sm:hidden h-14 w-14 rounded-2xl border-2"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}

              <Button
                className="h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-black/10 transition-all active:scale-95 bg-black hover:bg-black/90 text-white flex items-center gap-2 min-w-[160px]"
                disabled={
                  submitting ||
                  (currentStep === 1 && !booking.menu_id) ||
                  (currentStep === 2 && !selectedSlot) ||
                  (currentStep === 3 && (!booking.customer_name || !booking.customer_phone || !booking.service_address))
                }
                onClick={() => {
                  if (currentStep < 3) {
                    setCurrentStep(prev => prev + 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    handleSubmitBooking()
                  }
                }}
              >
                {submitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {currentStep === 3 ? '完成预订' : '下一步'}
                    {currentStep < 3 && <ChevronRight className="w-5 h-5" />}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
