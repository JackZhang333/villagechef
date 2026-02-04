'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus, Trash2, Edit, ArrowLeft, Utensils, Copy, Search, Check,
  ChevronRight, MoreHorizontal, LayoutGrid, List
} from 'lucide-react'
import { DISH_CATEGORY } from '@/lib/constants'

interface Dish {
  id: string
  name: string
  image_url: string | null
  category: 'cold' | 'hot'
  description: string | null
}

interface MenuItem {
  id: string
  sort_order: number
  dish: Dish
}

interface Menu {
  id: string
  name: string
  dish_count: number
  price: number
  description: string
  menu_items: MenuItem[]
}

export default function ChefMenuPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, isLoading: authLoading } = useAuth()
  const [menus, setMenus] = useState<Menu[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showItemsDialog, setShowItemsDialog] = useState(false)
  const [showSelectDishDialog, setShowSelectDishDialog] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importMenuId, setImportMenuId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [newMenu, setNewMenu] = useState({
    name: '',
    dish_count: 10,
    price: 0,
    description: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth-app/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [menusResult, dishesResult] = await Promise.all([
        supabase
          .from('menus')
          .select(`
            *,
            menu_items (
              *,
              dish: dishes (*)
            )
          `)
          .eq('chef_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('dishes')
          .select('*')
          .order('name')
      ])

      if (menusResult.error) throw menusResult.error
      if (dishesResult.error) throw dishesResult.error

      setMenus(menusResult.data || [])
      setDishes(dishesResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .insert({
          chef_id: user?.id,
          name: newMenu.name,
          dish_count: newMenu.dish_count,
          price: newMenu.price,
          description: newMenu.description,
        })
        .select()
        .single()

      if (error) throw error

      setMenus([data, ...menus])
      setShowAddDialog(false)
      setNewMenu({ name: '', dish_count: 10, price: 0, description: '' })
    } catch (error) {
      console.error('Error creating menu:', error)
    }
  }

  const handleAddDishToMenu = async (dishId: string) => {
    if (!selectedMenu) return

    const exists = selectedMenu.menu_items?.some(
      item => item.dish.id === dishId
    )
    if (exists) {
      alert('该菜品已添加')
      return
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          menu_id: selectedMenu.id,
          dish_id: dishId,
          sort_order: (selectedMenu.menu_items?.length || 0) + 1,
        })
        .select()
        .single()

      if (error) throw error

      const { data: dishData } = await supabase
        .from('dishes')
        .select('*')
        .eq('id', dishId)
        .single()

      const updatedMenu = {
        ...selectedMenu,
        menu_items: [
          ...(selectedMenu.menu_items || []),
          { ...data, dish: dishData },
        ],
      }
      setMenus(menus.map(m => m.id === updatedMenu.id ? updatedMenu : m))
      setSelectedMenu(updatedMenu)
      setShowSelectDishDialog(false)
    } catch (error) {
      console.error('Error adding dish:', error)
    }
  }

  const handleRemoveDish = async (itemId: string) => {
    if (!selectedMenu) return
    try {
      await supabase.from('menu_items').delete().eq('id', itemId)
      const updatedMenu = {
        ...selectedMenu,
        menu_items: selectedMenu.menu_items.filter(i => i.id !== itemId),
      }
      setMenus(menus.map(m => m.id === updatedMenu.id ? updatedMenu : m))
      setSelectedMenu(updatedMenu)
    } catch (error) {
      console.error('Error removing dish:', error)
    }
  }

  const handleImportItems = async () => {
    if (!selectedMenu || !importMenuId) return
    if (importMenuId === selectedMenu.id) {
      alert('不能从当前菜单导入')
      return
    }

    const sourceMenu = menus.find(m => m.id === importMenuId)
    if (!sourceMenu?.menu_items?.length) {
      alert('源菜单没有菜品')
      return
    }

    try {
      const existingDishIds = new Set(
        selectedMenu.menu_items?.map(i => i.dish.id) || []
      )

      const newItems = sourceMenu.menu_items.filter(
        item => !existingDishIds.has(item.dish.id)
      )

      if (newItems.length === 0) {
        alert('所有菜品都已存在')
        return
      }

      const itemsToInsert = newItems.map((item, index) => ({
        menu_id: selectedMenu.id,
        dish_id: item.dish.id,
        sort_order: (selectedMenu.menu_items?.length || 0) + index + 1,
      }))

      const { error } = await supabase.from('menu_items').insert(itemsToInsert)

      if (error) throw error

      fetchData()
      setShowImportDialog(false)
      setImportMenuId('')
    } catch (error) {
      console.error('Error importing items:', error)
    }
  }

  const handleDuplicateMenu = async (menu: Menu) => {
    try {
      const { data: newMenuData, error: menuError } = await supabase
        .from('menus')
        .insert({
          chef_id: user?.id,
          name: `${menu.name}（副本）`,
          dish_count: menu.dish_count,
          price: menu.price,
          description: menu.description,
        })
        .select()
        .single()

      if (menuError) throw menuError

      if (menu.menu_items?.length) {
        const itemsToInsert = menu.menu_items.map((item, index) => ({
          menu_id: newMenuData.id,
          dish_id: item.dish.id,
          sort_order: index + 1,
        }))

        const { error: itemsError } = await supabase.from('menu_items').insert(itemsToInsert)
        if (itemsError) throw itemsError
      }

      fetchData()
    } catch (error) {
      console.error('Error duplicating menu:', error)
    }
  }

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('确定要删除这个菜单吗？')) return

    try {
      await supabase.from('menus').delete().eq('id', menuId)
      setMenus(menus.filter(m => m.id !== menuId))
    } catch (error) {
      console.error('Error deleting menu:', error)
    }
  }

  const otherMenus = useMemo(() => {
    if (!selectedMenu) return []
    return menus.filter(m => m.id !== selectedMenu.id)
  }, [menus, selectedMenu])

  const availableDishes = useMemo(() => {
    if (!selectedMenu?.menu_items) return dishes
    const addedIds = new Set(selectedMenu.menu_items.map(i => i.dish.id))
    return dishes.filter(dish =>
      !addedIds.has(dish.id) &&
      dish.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [dishes, selectedMenu, searchQuery])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/chef-app/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg tracking-tight">菜单配置</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">方案管理</h2>
          <p className="text-muted-foreground font-medium">配置针对不同桌数与预算的宴席方案</p>
        </div>

        {/* Menu List */}
        <section className="grid grid-cols-1 gap-6">
          {menus.length === 0 ? (
            <div className="bg-white rounded-[32px] p-16 text-center border-2 border-dashed border-zinc-200">
              <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-zinc-200" />
              <p className="text-xl font-bold">还没有创建方案</p>
              <p className="text-muted-foreground mt-1">点击下方按钮开始您的第一个菜单配置</p>
            </div>
          ) : (
            menus.map(menu => (
              <div key={menu.id} className="bg-white rounded-[32px] border border-zinc-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col sm:flex-row">
                <div className="flex-1 p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black">{menu.name}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-rose-600 font-black text-lg">¥{menu.price}</span>
                        <span className="text-zinc-300">/ 席</span>
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-none font-bold">
                          {menu.dish_count} 道佳肴
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100" onClick={() => handleDuplicateMenu(menu)}>
                        <Copy className="w-4 h-4 text-zinc-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-rose-50" onClick={() => handleDeleteMenu(menu.id)}>
                        <Trash2 className="w-4 h-4 text-zinc-300 hover:text-rose-600" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-muted-foreground line-clamp-2">{menu.description}</p>

                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center">
                          <Utensils className="w-3 h-3 text-zinc-300" />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-zinc-400">
                      已配 {menu.menu_items?.length || 0} 道菜
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-50 p-6 flex items-center justify-center sm:w-48 sm:border-l border-zinc-100">
                  <Button
                    className="w-full h-14 rounded-2xl bg-black text-white font-bold text-base shadow-lg shadow-black/5"
                    onClick={() => {
                      setSelectedMenu(menu)
                      setShowItemsDialog(true)
                    }}
                  >
                    配置菜谱
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6 z-40 pointer-events-none">
        <div className="max-w-4xl mx-auto flex justify-center pointer-events-auto">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="h-16 px-10 rounded-full bg-black hover:bg-black/90 text-white font-black text-lg shadow-2xl shadow-black/20 group">
                <Plus className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                新增方案
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl max-w-md">
              <div className="bg-zinc-50 p-8 border-b border-zinc-100">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black">创建方案</DialogTitle>
                  <DialogDescription className="text-base">设定您的宴席套餐基础信息</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-400 pl-1">方案名称</Label>
                    <Input
                      placeholder="如：鸿运当头 · 18道"
                      className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black text-lg px-6"
                      value={newMenu.name}
                      onChange={e => setNewMenu({ ...newMenu, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-black uppercase tracking-widest text-zinc-400 pl-1">推荐道数</Label>
                      <Input
                        type="number"
                        className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black text-lg px-6"
                        value={newMenu.dish_count}
                        onChange={e => setNewMenu({ ...newMenu, dish_count: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-black uppercase tracking-widest text-zinc-400 pl-1">参考售价</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">¥</span>
                        <Input
                          type="number"
                          className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black text-lg pl-10 pr-6"
                          value={newMenu.price}
                          onChange={e => setNewMenu({ ...newMenu, price: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-400 pl-1">特色描述</Label>
                    <Input
                      placeholder="介绍这套方案的亮点与定位..."
                      className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black px-6"
                      value={newMenu.description}
                      onChange={e => setNewMenu({ ...newMenu, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-bold" onClick={() => setShowAddDialog(false)}>
                    取消
                  </Button>
                  <Button
                    className="h-14 flex-1 rounded-2xl bg-black text-white font-bold shadow-lg"
                    onClick={handleCreateMenu}
                    disabled={!newMenu.name}
                  >
                    立即创建
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Item Management Dialog */}
      <Dialog open={showItemsDialog} onOpenChange={setShowItemsDialog}>
        <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl max-w-lg max-h-[85vh] flex flex-col">
          <div className="bg-zinc-900 text-white p-8">
            <DialogTitle className="text-2xl font-black mb-1">{selectedMenu?.name}</DialogTitle>
            <DialogDescription className="hidden">配置菜单菜品</DialogDescription>
            <div className="flex items-center gap-3 opacity-60">
              <span className="text-sm font-medium">配置进度</span>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${Math.min(100, ((selectedMenu?.menu_items?.length || 0) / (selectedMenu?.dish_count || 1)) * 100)}%` }}
                />
              </div>
              <span className="text-sm font-bold">{selectedMenu?.menu_items?.length || 0} / {selectedMenu?.dish_count || 0}</span>
            </div>
          </div>

          <div className="p-8 flex-1 overflow-y-auto space-y-6">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl border-zinc-100 font-bold hover:bg-zinc-50"
                onClick={() => setShowSelectDishDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                挑选菜品
              </Button>
              {otherMenus.length > 0 && (
                <Button
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-blue-50 text-blue-600 bg-blue-50/30 font-bold hover:bg-blue-50"
                  onClick={() => setShowImportDialog(true)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  智能导入
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {!selectedMenu?.menu_items?.length ? (
                <div className="py-12 text-center text-zinc-300 font-medium">
                  还没有菜品，点击上方按钮开始配置
                </div>
              ) : (
                selectedMenu.menu_items.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl group border border-transparent hover:border-zinc-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-zinc-300 w-4">{String(index + 1).padStart(2, '0')}</span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-lg">{item.dish.name}</p>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider py-0 border-zinc-200">
                          {DISH_CATEGORY[item.dish.category as keyof typeof DISH_CATEGORY]}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-zinc-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => handleRemoveDish(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
            <Button className="w-full h-14 rounded-2xl bg-black text-white font-black" onClick={() => setShowItemsDialog(false)}>
              保存并完成配置
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Select Dish Dialog */}
      <Dialog open={showSelectDishDialog} onOpenChange={setShowSelectDishDialog}>
        <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl max-w-md max-h-[80vh] flex flex-col">
          <div className="p-8 border-b border-zinc-100 bg-zinc-50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">挑选菜品</DialogTitle>
              <DialogDescription className="text-base">从您的菜品库中选择进入此方案</DialogDescription>
            </DialogHeader>
            <div className="relative mt-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="搜索菜品名称..."
                className="h-12 pl-12 pr-6 rounded-2xl bg-white border-none focus:ring-2 focus:ring-black"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {availableDishes.length === 0 ? (
              <div className="py-20 text-center text-zinc-300 font-medium">
                {searchQuery ? '未找到相关菜品' : '菜品库暂时为空'}
              </div>
            ) : (
              availableDishes.map((dish: Dish) => (
                <div
                  key={dish.id}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 cursor-pointer transition-colors border border-transparent hover:border-zinc-100"
                  onClick={() => handleAddDishToMenu(dish.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center overflow-hidden">
                      {dish.image_url ? (
                        <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                      ) : (
                        <Utensils className="w-5 h-5 text-zinc-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{dish.name}</p>
                      <span className="text-xs text-zinc-400">{DISH_CATEGORY[dish.category as keyof typeof DISH_CATEGORY]}</span>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-zinc-50 border-t border-zinc-100">
            <Button variant="ghost" className="w-full h-12 rounded-xl font-bold" onClick={() => setShowSelectDishDialog(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl max-w-sm">
          <div className="p-8 bg-blue-600 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white">智能导入</DialogTitle>
              <DialogDescription className="text-white/70 text-base">从其他方案快速复制菜品配置</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-black uppercase tracking-widest text-zinc-400 pl-1">选择源方案</Label>
              <Select value={importMenuId} onValueChange={setImportMenuId}>
                <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 border-none px-6 focus:ring-2 focus:ring-blue-600">
                  <SelectValue placeholder="选择一个现有方案" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  {otherMenus.map(menu => (
                    <SelectItem key={menu.id} value={menu.id} className="py-3 rounded-xl">
                      {menu.name} ({menu.menu_items?.length || 0} 道)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {importMenuId && (
              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm font-bold text-blue-700">
                  发现 {menus.find(m => m.id === importMenuId)?.menu_items?.length || 0} 道可复用菜品
                </p>
                <p className="text-xs text-blue-600/70 font-medium">
                  系统将自动跳过已存在于当前方案的菜品
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-bold" onClick={() => setShowImportDialog(false)}>
                返回
              </Button>
              <Button
                className="h-14 flex-1 rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-600/20"
                onClick={handleImportItems}
                disabled={!importMenuId}
              >
                确认导入
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
