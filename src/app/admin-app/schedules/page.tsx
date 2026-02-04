import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default async function AdminSchedulesPage() {
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

  const { data: schedules } = await supabase
    .from('availability')
    .select(`
      *,
      chef:chefs (name, phone)
    `)
    .order('date', { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Link href="/admin-app/dashboard">
          <Button variant="ghost" size="sm">
            返回
          </Button>
        </Link>
        <h1 className="text-xl font-bold">日程统计</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {schedules?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              暂无日程记录
            </CardContent>
          </Card>
        ) : (
          schedules?.map(schedule => (
            <Card key={schedule.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{schedule.chef?.name}</p>
                    <p className="text-sm text-muted-foreground">{schedule.chef?.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                      {schedule.is_active ? '启用' : '关闭'}
                    </Badge>
                    <Badge variant={schedule.is_booked ? 'success' : 'outline'}>
                      {schedule.is_booked ? '已预约' : '可预约'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm">
                  {format(new Date(schedule.date), 'yyyy年M月d日', { locale: zhCN })} {
                    schedule.time_slot === 'lunch' ? '午餐' : '晚餐'
                  }
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  )
}
