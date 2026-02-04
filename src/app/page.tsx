import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChefHat,
  Calendar,
  Users,
  Star,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: '便捷预约',
    description: '在线选择厨师档期，快速完成预约'
  },
  {
    icon: Users,
    title: '专业厨师',
    description: '资深乡村厨师团队，传承地道风味'
  },
  {
    icon: Clock,
    title: '准时送达',
    description: '准时上门服务，让宴会如期举行'
  },
  {
    icon: Award,
    title: '品质保障',
    description: '不满意全额退款，服务有保障'
  }
]

const steps = [
  {
    step: '01',
    title: '选择厨师',
    description: '浏览厨师作品和擅长菜系'
  },
  {
    step: '02',
    title: '预约档期',
    description: '选择宴席日期和用餐人数'
  },
  {
    step: '03',
    title: '沟通菜单',
    description: '与厨师确认菜品和口味偏好'
  },
  {
    step: '04',
    title: '享受美食',
    description: '厨师上门烹饪，品味乡村美味'
  }
]

const testimonials = [
  {
    name: '张先生',
    role: '婚宴主人',
    content: '厨师做得菜特别地道，宾客们都赞不绝口！服务也很周到。',
    rating: 5
  },
  {
    name: '李女士',
    role: '寿宴主人',
    content: '从预约到结束都很顺利，厨师准时到达，菜品丰富美味。',
    rating: 5
  }
]

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">乡村厨师</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth-app/login">
              <Button variant="ghost" size="sm">登录</Button>
            </Link>
            <Link href="/auth-app/register">
              <Button size="sm">入驻</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-14">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-primary/10">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6 animate-fade-in">
                <Badge variant="secondary" className="w-fit">
                  🏆 专业乡村厨师服务平台
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  预约地道农家宴席
                  <br />
                  <span className="text-primary">享受美味乡村菜</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-md">
                  资深乡村厨师团队，传承地道风味，让您的宴席宾客尽欢。
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link href="/auth-app/register">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      我是厨师，立即入驻
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      了解更多
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>1000+ 活跃厨师</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>5000+ 成功案例</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>98% 好评率</span>
                  </div>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="relative z-10">
                  <div className="w-80 h-80 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <ChefHat className="w-32 h-32 text-primary/80" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">为什么选择我们</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              专业团队用心服务，让每一次宴席都圆满成功
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-5 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">简单四步，预约成功</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              轻松几步，即可预约心仪的乡村厨师
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <div key={index} className="relative group">
                <div className="text-center space-y-4">
                  <div className="relative inline-flex">
                    <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                      {item.step}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-border hidden lg:block" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">用户好评</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              听听用户对我们的真实评价
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {testimonials.map((item, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">&quot;{item.content}&quot;</p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            准备好开启您的乡村美食之旅了吗？
          </h2>
          <p className="opacity-90 mb-8 max-w-md mx-auto">
            立即注册成为乡村厨师，让更多人品尝到您的精湛厨艺
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth-app/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
                立即入驻
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              <span className="font-medium">乡村厨师</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 VillageChef. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">
                隐私政策
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                服务条款
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
