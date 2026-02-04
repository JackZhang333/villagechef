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
  Heart,
  Search,
  ChevronRight,
  Check,
  MapPin,
  Phone,
  Mail
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
    description: '浏览厨师作品和擅长菜系',
    icon: Search
  },
  {
    step: '02',
    title: '预约档期',
    description: '选择宴席日期和用餐人数',
    icon: Calendar
  },
  {
    step: '03',
    title: '沟通菜单',
    description: '与厨师确认菜品和口味偏好',
    icon: ChefHat
  },
  {
    step: '04',
    title: '享受美食',
    description: '厨师上门烹饪，品味乡村美味',
    icon: Heart
  }
]

const testimonials = [
  {
    name: '张先生',
    role: '婚宴主人',
    content: '厨师做得菜特别地道，宾客们都赞不绝口！服务也很周到。',
    rating: 5,
    avatar: '张'
  },
  {
    name: '李女士',
    role: '寿宴主人',
    content: '从预约到结束都很顺利，厨师准时到达，菜品丰富美味。',
    rating: 5,
    avatar: '李'
  }
]

const stats = [
  { value: '1000+', label: '活跃厨师' },
  { value: '5000+', label: '成功案例' },
  { value: '98%', label: '好评率' },
  { value: '50+', label: '城市覆盖' }
]

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-xl text-gray-900">乡村厨师</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                服务特色
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                使用流程
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                用户评价
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/auth-app/login">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full px-4">
                  登录
                </Button>
              </Link>
              <Link href="/auth-app/register">
                <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-5 shadow-md hover:shadow-lg transition-all">
                  入驻
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16">
        <div className="relative bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-200 px-4 py-1.5 rounded-full text-sm font-medium">
                  🏆 专业乡村厨师服务平台
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  预约地道农家宴席
                  <br />
                  <span className="text-rose-500">享受乡村美味</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                  资深乡村厨师团队，传承地道风味，让您的宴席宾客尽欢。
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/auth-app/register">
                    <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-8 h-12 shadow-lg hover:shadow-xl transition-all">
                      立即入驻
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-8 h-12">
                      了解更多
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-8 pt-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-rose-500" />
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{stat.value}</span> {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative z-10">
                  <div className="w-[420px] h-[420px] mx-auto rounded-[2.5rem] bg-gradient-to-br from-rose-100 via-white to-rose-50 shadow-2xl flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-200/30 to-transparent rounded-[2.5rem]" />
                    <div className="relative z-10 w-48 h-48 rounded-full bg-rose-100 flex items-center justify-center">
                      <ChefHat className="w-24 h-24 text-rose-400" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-rose-100/50 to-transparent rounded-full blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">为什么选择我们</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              专业团队用心服务，让每一次宴席都圆满成功
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl bg-gray-50/50 hover:bg-white">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center">
                    <feature.icon className="w-7 h-7 text-rose-500" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">简单四步，预约成功</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              轻松几步，即可预约心仪的乡村厨师
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <div key={index} className="relative">
                <div className="text-center space-y-4">
                  <div className="relative inline-flex">
                    <div className="w-18 h-18 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                      {item.step}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-rose-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-9 left-[60%] w-[80%] h-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">用户好评</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              听听用户对我们的真实评价
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((item, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed">&ldquo;{item.content}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-medium text-sm">
                      {item.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-rose-450 to-rose-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            准备好开启您的乡村美食之旅了吗？
          </h2>
          <p className="text-rose-100 mb-8 max-w-xl mx-auto">
            立即注册成为乡村厨师，让更多人品尝到您的精湛厨艺
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth-app/register">
              <Button size="lg" className="bg-white text-rose-500 hover:bg-rose-50 rounded-full px-8 h-12 shadow-lg">
                立即入驻
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-xl text-white">乡村厨师</span>
              </Link>
              <p className="text-sm text-gray-500">
                专业乡村厨师服务平台，让美味走进千家万户。
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">快速链接</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth-app/register" className="hover:text-white transition-colors">入驻平台</Link></li>
                <li><Link href="/auth-app/login" className="hover:text-white transition-colors">厨师登录</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">服务特色</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">使用流程</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">联系我们</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>400-123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>contact@villagechef.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>北京市朝阳区</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-4">服务条款</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">隐私政策</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">服务条款</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">退款政策</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2024 VillageChef. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
