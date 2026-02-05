'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChefHat, Loader2, User, Phone } from 'lucide-react'
import { toast } from 'sonner'

const registerSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  address: z.string().min(5, '请输入详细地址'),
  bio: z.string().optional(),
  password: z.string().min(6, '密码至少6位'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.phone,
          password: data.password,
          name: data.name,
          address: data.address,
          bio: data.bio,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || `注册失败 (${res.status})`)
        toast.error(result.error || '注册失败，请检查输入')
        setIsLoading(false)
        return
      }

      toast.success('注册成功！正在进入登录页...')
      router.push('/auth-app/login?registered=true')
    } catch {
      setError('注册失败，请稍后重试')
      toast.error('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col py-12 px-6 animate-in fade-in duration-700">
      <div className="max-w-[480px] w-full mx-auto space-y-8">
        <div className="text-center space-y-4">
          <Link href="/auth-app/login" className="inline-block">
            <div className="w-16 h-16 bg-black rounded-[20px] flex items-center justify-center mx-auto shadow-xl shadow-black/10 rotate-[2deg] hover:rotate-0 transition-transform duration-500">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">加入 村厨</h1>
            <p className="text-zinc-500 font-bold mt-2 text-balance">开启您的私房名厨入驻之旅</p>
          </div>
        </div>

        <Card className="rounded-[40px] border-none shadow-2xl shadow-zinc-200 overflow-hidden bg-white">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black">创建厨师账号</CardTitle>
            <CardDescription className="font-medium text-zinc-400">请如实填写您的入驻信息</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Group: Essential Info */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-0.5 bg-black rounded-full" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">身份信息</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">真实姓名</Label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                    <Input
                      id="name"
                      className="h-14 pl-12 pr-6 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black text-lg font-bold placeholder:text-zinc-300"
                      placeholder="如何称呼您？"
                      {...register('name')}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs font-bold text-rose-500 pl-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">联系电话</Label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                    <Input
                      id="phone"
                      type="tel"
                      className="h-14 pl-12 pr-6 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black text-lg font-bold placeholder:text-zinc-300"
                      placeholder="您的手机号码"
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs font-bold text-rose-500 pl-1">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">常驻地址</Label>
                  <Input
                    id="address"
                    className="h-14 px-6 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black text-lg font-bold placeholder:text-zinc-300"
                    placeholder="省份、城市、街道"
                    {...register('address')}
                  />
                  {errors.address && (
                    <p className="text-xs font-bold text-rose-500 pl-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">厨师简介</Label>
                  <textarea
                    id="bio"
                    className="flex min-h-[100px] w-full rounded-2xl border-none bg-zinc-50 px-6 py-4 text-base font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-black transition-all resize-none"
                    placeholder="简单介绍一下您的擅长领域或从厨经验..."
                    {...register('bio')}
                  />
                </div>
              </div>

              {/* Group: Security */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-0.5 bg-black rounded-full" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">安全设置</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">设置密码</Label>
                    <Input
                      id="password"
                      type="password"
                      className="h-14 px-6 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black text-base font-bold placeholder:text-zinc-300"
                      placeholder="至少6位"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-xs font-bold text-rose-500 pl-1">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-zinc-400 pl-1">重复密码</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="h-14 px-6 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black text-base font-bold placeholder:text-zinc-300"
                      placeholder="确认输入"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs font-bold text-rose-500 pl-1">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 p-5 rounded-[24px] border border-rose-100 animate-in shake duration-500">
                  <p className="text-sm font-bold text-rose-600 text-center">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-16 rounded-[24px] bg-black hover:bg-black/90 text-white font-black text-lg shadow-xl shadow-black/10 transition-all active:scale-95" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    正提交资料...
                  </>
                ) : (
                  '立即开启厨师生涯'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center pb-12">
          <p className="text-zinc-400 font-bold">
            已有账号？{' '}
            <Link href="/auth-app/login" className="text-black underline underline-offset-4 decoration-2 hover:text-zinc-600 transition-colors">
              直接登录工作台
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
