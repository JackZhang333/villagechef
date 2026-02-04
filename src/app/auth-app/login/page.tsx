'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChefHat, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  password: z.string().min(6, '密码至少6位'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('注册成功，请登录')
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${data.phone}@villagechef.com`,
        password: data.password,
      })

      if (authError) {
        setError('手机号或密码错误')
        setIsLoading(false)
        return
      }

      router.push('/chef-app/dashboard')
      router.refresh()
    } catch {
      setError('登录失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="rounded-[40px] border-none shadow-2xl shadow-zinc-200 overflow-hidden bg-white">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl font-black">厨师登录</CardTitle>
        <CardDescription className="font-medium text-zinc-400">请输入您的手机号和密码</CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">手机号</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="请输入手机号"
              className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black px-6 text-lg font-bold placeholder:text-zinc-300"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs font-bold text-rose-500 pl-1">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black px-6 text-lg font-bold placeholder:text-zinc-300"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs font-bold text-rose-500 pl-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center justify-center">
              <p className="text-sm font-bold text-rose-600 italic text-center text-balance">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-center">
              <p className="text-sm font-bold text-emerald-600 italic text-center text-balance">{success}</p>
            </div>
          )}

          <Button type="submit" className="w-full h-16 rounded-2xl bg-black hover:bg-black/90 text-white font-black text-lg shadow-xl shadow-black/10 transition-all active:scale-95" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                验证中...
              </>
            ) : (
              '立即登录'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col justify-center p-6 animate-in fade-in duration-700">
      <div className="max-w-[400px] w-full mx-auto space-y-8 mt-[-10vh]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-black rounded-[24px] flex items-center justify-center mx-auto shadow-2xl shadow-black/20 rotate-[-4deg] hover:rotate-0 transition-transform duration-500">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight italic">VillageChef</h1>
            <p className="text-zinc-500 font-bold mt-2">欢迎回来，开启今日美味之旅</p>
          </div>
        </div>

        <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
          <LoginForm />
        </Suspense>

        <div className="text-center pt-4">
          <p className="text-zinc-400 font-bold">
            还没有账号？{' '}
            <Link href="/auth-app/register" className="text-black underline underline-offset-4 decoration-2 hover:text-zinc-600 transition-colors">
              立即致富入驻
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
