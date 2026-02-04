'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Calendar, Clock, MapPin, Phone, ChefHat, Check,
  Utensils, ArrowLeft, ArrowRight
} from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { formatLunar } from '@/lib/lunar-helper'
import { TIME_SLOTS, DISH_CATEGORY } from '@/lib/constants'
import { generateBookingCode } from '@/lib/utils'
import { MAX_BOOKING_MONTHS } from '@/lib/constants'
import { TimeSlot } from '@/types'

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
  menu_items: MenuItem[]
}

interface MenuItem {
  id: string
  dish_name: string
  category: 'cold' | 'hot'
  dish_image_url: string | null
}

interface Availability {
  id: string
  date: string
  time_slot: TimeSlot
  is_active: boolean
  is_booked: boolean
}

interface BookingForm {
  customer_name: string
  customer_phone: string
  service_address: string
  notes: string
}

export default function ShareBookingPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const token = params.token as string

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bookingCode, setBookingCode] = useState('')

  const [chef, setChef] = useState<Chef | null>(null)
  const [menus, setMenus] = useState<Menu[]>([])
  const [availabilities, setAvailabilities] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null)
  const [form, setForm] = useState<BookingForm>({
    customer_name: '',
    customer_phone: '',
    service_address: '',
    notes: '',
  })

  useEffect(() => {
    fetchChefData()
  }, [token])

  const fetchChefData = async () => {
    try {
      // Fetch chef by token (using user id as token for simplicity)
      const { data: chefData, error: chefError } = await supabase
        .from('chefs')
        .select('*')
        .eq('id', token)
        .single()

      if (chefError || !chefData) {
        // Try to find by share token
        const { data: availabilityData } = await supabase
          .from('availability')
          .select('chef_id')
          .eq('share_token', token)
          .limit(1)
          .single()

        if (availabilityData) {
          const { data: chef } = await supabase
            .from('chefs')
            .select('*')
            .eq('id', availabilityData.chef_id)
            .single()
          if (chef) setChef(chef)
        }
      } else {
        setChef(chefData)
      }

      if (!chefData) return

      // Fetch menus
      const { data: menusData } = await supabase
        .from('menus')
        .select('*, menu_items(*)')
        .eq('chef_id', chefData.id)
        .order('created_at', { ascending: false })

      if (menusData) setMenus(menusData)

      // Fetch available dates (next 3 months)
      const today = new Date()
      const dates: any[] = []
      const daysInRange = MAX_BOOKING_MONTHS * 30 // 约3个月

      for (let i = 0; i < daysInRange; i++) {
        const date = addDays(today, i)
        const dateStr = format(date, 'yyyy-MM-dd')

        const { data: availData } = await supabase
          .from('availability')
          .select('*')
          .eq('chef_id', chefData.id)
          .eq('date', dateStr)

        // Add lunch and dinner slots
        const lunchAvail = availData?.find(a => a.time_slot === 'lunch')
        const dinnerAvail = availData?.find(a => a.time_slot === 'dinner')

        if (!lunchAvail) {
          dates.push({ id: '', chef_id: chefData.id, date: dateStr, time_slot: 'lunch', is_active: true, is_booked: false })
        } else if (!lunchAvail.is_booked) {
          dates.push(lunchAvail)
        }

        if (!dinnerAvail) {
          dates.push({ id: '', chef_id: chefData.id, date: dateStr, time_slot: 'dinner', is_active: true, is_booked: false })
        } else if (!dinnerAvail.is_booked) {
          dates.push(dinnerAvail)
        }
      }

      setAvailabilities(dates)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const availableDates = availabilities.filter(a => a.is_active && !a.is_booked)

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot || !selectedMenu || !chef) return

    setSubmitting(true)

    try {
      // Find the availability
      const { data: availability } = await supabase
        .from('availability')
        .select('*')
        .eq('chef_id', chef.id)
        .eq('date', selectedDate)
        .eq('time_slot', selectedSlot)
        .single()

      if (!availability) {
        // Create new availability
        const { data: newAvailability } = await supabase
          .from('availability')
          .insert({
            chef_id: chef.id,
            date: selectedDate,
            time_slot: selectedSlot,
            is_active: true,
            is_booked: true,
            share_token: token,
          })
          .select()
          .single()

        if (!newAvailability) throw new Error('Failed to create availability')

        // Create order
        const code = generateBookingCode()
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            booking_code: code,
            customer_name: form.customer_name,
            customer_phone: form.customer_phone,
            chef_id: chef.id,
            availability_id: newAvailability.id,
            menu_id: selectedMenu,
            status: 'pending',
            service_address: form.service_address,
            notes: form.notes || null,
          })

        if (orderError) throw orderError
        setBookingCode(code)
      } else {
        // Update availability
        await supabase
          .from('availability')
          .update({ is_booked: true })
          .eq('id', availability.id)

        // Create order
        const code = generateBookingCode()
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            booking_code: code,
            customer_name: form.customer_name,
            customer_phone: form.customer_phone,
            chef_id: chef.id,
            availability_id: availability.id,
            menu_id: selectedMenu,
            status: 'pending',
            service_address: form.service_address,
            notes: form.notes || null,
          })

        if (orderError) throw orderError
        setBookingCode(code)
      }

      setSuccess(true)
    } catch (error) {
      console.error('Error submitting booking:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h5-container flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!chef) {
    return (
      <div className="h5-container flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">链接无效或厨师不存在</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="h5-container">
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">预约成功！</h1>
          <p className="text-muted-foreground mb-4">请保留您的预约码</p>
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">预约码</p>
              <p className="text-4xl font-bold text-primary tracking-widest">{bookingCode}</p>
            </CardContent>
          </Card>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>厨师: {chef.name}</p>
            <p>手机: {chef.phone}</p>
          </div>
        </div>
      </div>
    )
  }

  const selectedMenuData = menus.find(m => m.id === selectedMenu)
  const coldDishes = selectedMenuData?.menu_items?.filter(i => i.category === 'cold') || []
  const hotDishes = selectedMenuData?.menu_items?.filter(i => i.category === 'hot') || []

  return (
    <div className="h5-container">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-3 mb-3">
          <ChefHat className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-bold">{chef.name}</h1>
            <p className="text-sm opacity-90">{chef.bio || '乡村厨师'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            {chef.phone}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {['选择时间', '选择菜单', '填写信息'].map((label, index) => (
            <div key={label} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step > index + 1 ? 'bg-primary text-primary-foreground' :
                step === index + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-sm ${step === index + 1 ? 'font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {index < 2 && <div className="w-8 h-0.5 bg-muted mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Date & Time */}
      {step === 1 && (
        <div className="p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            选择预约日期
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {availableDates.slice(0, 12).map((avail) => (
              <button
                key={`${avail.date}-${avail.time_slot}`}
                className={`p-3 rounded-lg border-2 text-center transition-colors ${selectedDate === avail.date && selectedSlot === avail.time_slot
                  ? 'border-primary bg-primary/5'
                  : 'border-dashed border-muted-foreground/30'
                  }`}
                onClick={() => {
                  setSelectedDate(avail.date)
                  setSelectedSlot(avail.time_slot)
                }}
              >
                <p className="text-sm font-medium">
                  {format(new Date(avail.date), 'M月d日')}
                </p>
                <p className="text-[10px] text-muted-foreground/80 mb-1">
                  {formatLunar(new Date(avail.date))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {TIME_SLOTS[avail.time_slot as keyof typeof TIME_SLOTS]}
                </p>
              </button>
            ))}
          </div>

          {selectedDate && selectedSlot && (
            <Button className="w-full h5-btn" onClick={() => setStep(2)}>
              下一步
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}

      {/* Step 2: Select Menu */}
      {step === 2 && (
        <div className="p-4 space-y-4">
          <Button variant="ghost" className="mb-2" onClick={() => setStep(1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>

          <h2 className="font-semibold flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            选择菜单
          </h2>

          {menus.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                暂无菜单可预约
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {menus.map(menu => (
                <Card
                  key={menu.id}
                  className={`cursor-pointer transition-all ${selectedMenu === menu.id ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                  onClick={() => setSelectedMenu(menu.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{menu.name}</h3>
                        <p className="text-sm text-muted-foreground">{menu.dish_count}道菜</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">¥{menu.price}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {menu.description}
                    </p>
                    {menu.menu_items && menu.menu_items.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          冷菜: {coldDishes.length}道
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          热菜: {hotDishes.length}道
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedMenu && (
            <Button className="w-full h5-btn" onClick={() => setStep(3)}>
              下一步
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}

      {/* Step 3: Fill Info */}
      {step === 3 && (
        <div className="p-4 space-y-4">
          <Button variant="ghost" className="mb-2" onClick={() => setStep(2)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>

          <h2 className="font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            填写预约信息
          </h2>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">您的姓名</Label>
                <Input
                  id="customer_name"
                  placeholder="请输入您的姓名"
                  value={form.customer_name}
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_phone">手机号</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={form.customer_phone}
                  onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_address">上门地址</Label>
                <Input
                  id="service_address"
                  placeholder="请输入详细地址"
                  value={form.service_address}
                  onChange={e => setForm({ ...form, service_address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">特殊需求（选填）</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="有什么特殊需求？"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">预约信息</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>日期: {selectedDate && format(new Date(selectedDate), 'yyyy年M月d日')}</p>
                <p>时段: {selectedSlot === 'lunch' ? '午餐' : '晚餐'}</p>
                <p>菜单: {selectedMenuData?.name}</p>
                <p>价格: ¥{selectedMenuData?.price}</p>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h5-btn"
            disabled={!form.customer_name || !form.customer_phone || !form.service_address || submitting}
            onClick={handleSubmit}
          >
            {submitting ? '提交中...' : '确认预约'}
          </Button>
        </div>
      )}

      <div className="h-6"></div>
    </div>
  )
}
