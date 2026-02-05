import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChefHat,
  Calendar,
  Layers,
  Share2,
  Copy,
  LayoutGrid,
  Clock,
  ArrowRight,
  CheckCircle2,
  Utensils,
  Plus,
  Search,
  BookOpen,
  MousePointer2,
  Bell
} from 'lucide-react'

const toolset = [
  {
    icon: Utensils,
    title: '数字化菜品库',
    description: '摆脱纸笔，为您的拿手菜建立精美数字档案，沉淀每一份匠心手艺。',
    tag: '基础管理'
  },
  {
    icon: LayoutGrid,
    title: '多档次菜单设计',
    description: '针对不同预算与桌数，灵活组合套餐方案，实现标准化的服务定价。',
    tag: '业务转化'
  },
  {
    icon: Calendar,
    title: '智能档期管家',
    description: '轻松控制可预约状态，实时更新排期，告别重复确认的繁琐沟通。',
    tag: '效率核心'
  },
  {
    icon: Share2,
    title: '一键名片分享',
    description: '生成您的专属在线主页，微信点击即看，让老主顾的转推荐更高效。',
    tag: '品牌宣推'
  }
]

const chefWorkflow = [
  {
    step: '录库',
    title: '上传菜品资产',
    description: '上传精美的菜品照片与描述，这是您职业门面的第一步。',
    icon: Plus
  },
  {
    step: '组包',
    title: '配置宴席方案',
    description: '将菜品有机组合为不同餐标的菜单，方便客户快速下单选择。',
    icon: BookOpen
  },
  {
    step: '分享',
    title: '分发排期链接',
    description: '将您的预约页分享至社交圈，客户可自助查看档期并提交预订。',
    icon: MousePointer2
  },
  {
    step: '执行',
    title: '管理订单状态',
    description: '实时接收预订提醒，手机一键接单或取消，掌控业务全流程。',
    icon: Bell
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] selection:bg-black selection:text-white">
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-[14px] bg-black flex items-center justify-center shadow-lg group-hover:-rotate-3 transition-transform duration-300">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tight italic">村厨</span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#workbench" className="text-sm font-bold text-zinc-500 hover:text-black transition-colors">核心工具</Link>
              <Link href="#guide" className="text-sm font-bold text-zinc-500 hover:text-black transition-colors">入驻指南</Link>
            </nav>
            <div className="h-6 w-px bg-zinc-100 hidden md:block" />
            <div className="flex items-center gap-3">
              <Link href="/auth-app/login">
                <Button variant="ghost" className="font-bold rounded-2xl px-6 h-12 text-zinc-600 hover:text-black">登录</Button>
              </Link>
              <Link href="/auth-app/register">
                <Button className="bg-black hover:bg-zinc-800 text-white font-black rounded-2xl px-8 h-12 shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  立即入驻
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero: The Workbench Vision */}
      <section className="pt-44 pb-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <Badge className="bg-orange-50 text-orange-600 border-none px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                专业厨师事业工作台
              </Badge>
              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-zinc-900">
                管理您的每一个 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-500">金牌家宴</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-lg leading-relaxed">
                村厨 是专为私房大厨打造的业务数字化工具。从菜品收录到档期分享，助您以最专业的形象，迎接每一份订单。
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/auth-app/register">
                <Button size="lg" className="h-16 px-10 rounded-[20px] bg-black text-white font-black text-lg shadow-2xl shadow-black/20 group">
                  申请入驻
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#workbench">
                <Button variant="outline" size="lg" className="h-16 px-10 rounded-[20px] font-bold border-zinc-200 hover:bg-zinc-50">
                  了解核心功能
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold">数字化档案</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold">微信一键分享</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold">全流程接单</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative h-[560px] w-full bg-white rounded-[48px] border border-zinc-100 shadow-2xl p-8 overflow-hidden">
              {/* Mock UI Element: Dashboard Snippets */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-32 h-6 bg-zinc-100 rounded-full animate-pulse" />
                  <div className="w-10 h-10 rounded-full bg-zinc-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-40 rounded-[32px] bg-zinc-900 shadow-xl p-6 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-white/20" />
                    <div>
                      <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase">总收入</p>
                      <p className="text-white text-2xl font-black">¥12,850</p>
                    </div>
                  </div>
                  <div className="h-40 rounded-[32px] bg-orange-500 p-6 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-black/10" />
                    <div>
                      <p className="text-black/50 text-[10px] font-bold tracking-widest uppercase">待接单</p>
                      <p className="text-black text-2xl font-black">3 NEW</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-20 rounded-[24px] bg-zinc-50 border border-zinc-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-200" />
                      <div className="space-y-1">
                        <div className="w-24 h-4 bg-zinc-200 rounded-full" />
                        <div className="w-16 h-3 bg-zinc-100 rounded-full" />
                      </div>
                    </div>
                    <div className="w-14 h-8 bg-black rounded-lg" />
                  </div>
                  <div className="h-20 rounded-[24px] bg-white border border-zinc-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100" />
                      <div className="space-y-1">
                        <div className="w-20 h-4 bg-zinc-200 rounded-full" />
                        <div className="w-12 h-3 bg-zinc-100 rounded-full" />
                      </div>
                    </div>
                    <div className="w-14 h-8 bg-zinc-100 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toolkit Features */}
      <section id="workbench" className="py-32 bg-zinc-900 text-white rounded-[60px] mx-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl space-y-4 mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">为您准备的工具箱</h2>
            <p className="text-zinc-400 text-lg font-medium">不止是预约，更是一套完整的家宴服务数字套件。</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {toolset.map((item, i) => (
              <div key={i} className="group p-8 rounded-[40px] bg-zinc-800 border-zinc-700/50 hover:bg-zinc-800/50 border hover:border-zinc-600 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-orange-500" />
                </div>
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-zinc-700 text-zinc-500 mb-4 px-3 py-1 scale-90 -ml-1">
                  {item.tag}
                </Badge>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section id="guide" className="py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20 text-balance">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900">从入驻到接单，只需四步</h2>
            <p className="text-zinc-500 text-lg font-medium">清晰、专业的引导，助您快速开启数字化生意。</p>
          </div>

          <div className="grid md:grid-cols-4 gap-12">
            {chefWorkflow.map((item, i) => (
              <div key={i} className="relative group text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-[32px] bg-zinc-50 flex items-center justify-center shadow-lg shadow-zinc-200 group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-black italic">
                    {i + 1}
                  </div>
                  <item.icon className="w-10 h-10 text-zinc-900" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-tight text-zinc-900">{item.title}</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">{item.description}</p>
                </div>
                {i < chefWorkflow.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-2/3 w-1/3 border-t-2 border-dashed border-zinc-100 -z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA: Final Conversion */}
      <section className="pb-32 px-6">
        <div className="max-w-6xl mx-auto rounded-[48px] bg-orange-500 p-12 md:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl shadow-orange-500/20">
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/20 rounded-full blur-[60px]" />
          <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-black/10 rounded-full blur-[80px]" />

          <div className="space-y-4 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-black leading-tight tracking-tight">
              准备好升级您的 <br />
              私厨事业了吗？
            </h2>
            <p className="text-lg md:text-xl text-black/60 font-bold max-w-xl mx-auto">
              立即注册，在 10 分钟内完成您的数字化名片配置，开启更高品质的预约管理。
            </p>
          </div>

          <div className="relative z-10">
            <Link href="/auth-app/register">
              <Button size="lg" className="h-16 px-12 rounded-[20px] bg-black text-white font-black text-xl shadow-2xl hover:bg-zinc-800">
                立即免费入驻
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 border-t border-zinc-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight italic">村厨</span>
          </div>

          <div className="flex gap-8 text-sm font-bold text-zinc-400">
            <Link href="#" className="hover:text-black">服务条款</Link>
            <Link href="#" className="hover:text-black">隐私政策</Link>
            <Link href="#" className="hover:text-black">联络我们</Link>
          </div>

          <p className="text-sm font-bold text-zinc-300">© 2026 村厨 - 让每一份匠心更出众</p>
        </div>
      </footer>
    </div>
  )
}
