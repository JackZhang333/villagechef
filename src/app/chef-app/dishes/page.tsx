'use client'

import { useEffect, useState } from 'react'
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus, Trash2, Edit, ArrowLeft, Utensils, Search, ChefHat
} from 'lucide-react'
import { DISH_CATEGORY } from '@/lib/constants'

interface Dish {
  id: string
  name: string
  image_url: string | null
  category: 'cold' | 'hot'
  description: string | null
  created_at: string
}

export default function ChefDishesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, isLoading: authLoading } = useAuth()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newDish, setNewDish] = useState({
    name: '',
    category: 'hot' as 'cold' | 'hot',
    description: '',
  })
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'hot' as 'cold' | 'hot',
    description: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth-app/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchDishes()
    }
  }, [user])

  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('chef_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDishes(data || [])
    } catch (error) {
      console.error('Error fetching dishes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDish = async () => {
    if (!newDish.name.trim()) return

    try {
      const { data, error } = await supabase
        .from('dishes')
        .insert({
          chef_id: user?.id,
          name: newDish.name.trim(),
          category: newDish.category,
          description: newDish.description.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      setDishes([data, ...dishes])
      setShowAddDialog(false)
      setNewDish({ name: '', category: 'hot', description: '' })
    } catch (error) {
      console.error('Error creating dish:', error)
    }
  }

  const handleEditDish = async () => {
    if (!editingDish || !editForm.name.trim()) return

    try {
      // Verify ownership
      const { data: dishCheck } = await supabase
        .from('dishes')
        .select('id')
        .eq('id', editingDish.id)
        .eq('chef_id', user?.id)
        .single()

      if (!dishCheck) {
        alert('无权编辑此菜品')
        return
      }

      const { data, error } = await supabase
        .from('dishes')
        .update({
          name: editForm.name.trim(),
          category: editForm.category,
          description: editForm.description.trim() || null,
        })
        .eq('id', editingDish.id)
        .eq('chef_id', user?.id)
        .select()
        .single()

      if (error) throw error

      setDishes(dishes.map((d: Dish) => d.id === editingDish.id ? data : d))
      setShowEditDialog(false)
      setEditingDish(null)
    } catch (error) {
      console.error('Error updating dish:', error)
    }
  }

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm('确定要删除这个菜品吗？删除后无法在菜单中使用。')) return

    try {
      // Verify ownership
      const { data: dishCheck } = await supabase
        .from('dishes')
        .select('id')
        .eq('id', dishId)
        .eq('chef_id', user?.id)
        .single()

      if (!dishCheck) {
        alert('无权删除此菜品')
        return
      }

      await supabase.from('dishes').delete().eq('id', dishId).eq('chef_id', user?.id)
      setDishes(dishes.filter((d: Dish) => d.id !== dishId))
    } catch (error) {
      console.error('Error deleting dish:', error)
    }
  }

  const openEditDialog = (dish: Dish) => {
    setEditingDish(dish)
    setEditForm({
      name: dish.name,
      category: dish.category,
      description: dish.description || '',
    })
    setShowEditDialog(true)
  }

  const filteredDishes = dishes.filter((dish: Dish) =>
    dish.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const coldCount = dishes.filter((d: Dish) => d.category === 'cold').length
  const hotCount = dishes.filter((d: Dish) => d.category === 'hot').length

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
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
            <h1 className="font-bold text-lg tracking-tight">菜品库</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Intro & Stats Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight">菜品管理</h2>
            <p className="text-muted-foreground font-medium">共收录 {dishes.length} 道精选佳肴</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-zinc-100 text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-0.5">温热</p>
              <p className="text-xl font-black text-rose-600">{hotCount}</p>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-zinc-100 text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-0.5">清爽</p>
              <p className="text-xl font-black text-blue-600">{coldCount}</p>
            </div>
          </div>
        </div>

        {/* Search Bar - Pill Style */}
        <section className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-black transition-colors" />
          <Input
            placeholder="在菜品库中搜索..."
            className="h-16 pl-14 pr-6 rounded-full border-zinc-200 bg-white shadow-sm focus:shadow-md focus:border-black transition-all text-lg placeholder:text-zinc-400"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </section>

        {/* Dish List */}
        <section className="space-y-4">
          {filteredDishes.length === 0 ? (
            <div className="bg-white rounded-[32px] p-16 text-center border-2 border-dashed border-zinc-200 space-y-4">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                <Utensils className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold">还没有创建菜品</p>
                <p className="text-muted-foreground">先创建菜品库，菜单中可直接选用</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDishes.map((dish: Dish) => (
                <div key={dish.id} className="bg-white p-5 rounded-[32px] border border-zinc-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-[24px] bg-zinc-50 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform duration-500 border border-zinc-50">
                      {dish.image_url ? (
                        <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                      ) : (
                        <ChefHat className="w-10 h-10 text-zinc-200" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>

                    <div className="flex-1 min-w-0 py-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-black text-xl truncate pr-2">{dish.name}</h4>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 p-0 rounded-full hover:bg-zinc-100"
                            onClick={() => openEditDialog(dish)}
                          >
                            <Edit className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 p-0 rounded-full hover:bg-rose-50"
                            onClick={() => handleDeleteDish(dish.id)}
                          >
                            <Trash2 className="w-4 h-4 text-zinc-300 group-hover:text-rose-600 transition-colors" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`px-2 py-0 rounded-full font-bold text-[10px] uppercase tracking-wider ${dish.category === 'hot' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                          {DISH_CATEGORY[dish.category as keyof typeof DISH_CATEGORY]}
                        </Badge>
                        {dish.description && (
                          <p className="text-xs text-muted-foreground truncate">{dish.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Add Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6 z-40 pointer-events-none">
        <div className="max-w-4xl mx-auto flex justify-center pointer-events-auto">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="h-16 px-10 rounded-full bg-black hover:bg-black/90 text-white font-black text-lg shadow-2xl shadow-black/20 animate-in slide-in-from-bottom-12 duration-1000 group">
                <Plus className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                新增菜品
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-0 overflow-hidden border-none shadow-2xl max-w-md">
              <div className="bg-zinc-50 p-8 border-b border-zinc-100">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">新增菜品</DialogTitle>
                  <DialogDescription className="text-base">上传并完善您的拿手好菜</DialogDescription>
                </DialogHeader>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-400">菜品名称</Label>
                    <Input
                      placeholder="如：外婆红烧肉"
                      className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black"
                      value={newDish.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDish({ ...newDish, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-400">所属种类</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setNewDish({ ...newDish, category: 'hot' })}
                        className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${newDish.category === 'hot' ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400 bg-white hover:border-zinc-200'}`}
                      >
                        <Utensils className="w-4 h-4" /> 热菜
                      </button>
                      <button
                        onClick={() => setNewDish({ ...newDish, category: 'cold' })}
                        className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${newDish.category === 'cold' ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400 bg-white hover:border-zinc-200'}`}
                      >
                        <Utensils className="w-4 h-4 ml-[-5px]" /> 冷菜
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-400">特色介绍</Label>
                    <Input
                      placeholder="简要介绍口味、食材特点..."
                      className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black"
                      value={newDish.description}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDish({ ...newDish, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-bold" onClick={() => setShowAddDialog(false)}>
                    取消
                  </Button>
                  <Button
                    className="h-14 flex-1 rounded-2xl bg-black text-white font-bold"
                    onClick={handleCreateDish}
                    disabled={!newDish.name.trim()}
                  >
                    创建菜品
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog - Mirroring Add Style */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="rounded-[32px] p-0 overflow-hidden border-none shadow-2xl max-w-md">
          <div className="bg-zinc-50 p-8 border-b border-zinc-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">编辑菜品</DialogTitle>
              <DialogDescription className="text-base">更新您的菜品信息</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-widest text-zinc-400">菜品名称</Label>
                <Input
                  className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black"
                  value={editForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-widest text-zinc-400">所属种类</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditForm({ ...editForm, category: 'hot' })}
                    className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${editForm.category === 'hot' ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400 bg-white hover:border-zinc-200'}`}
                  >
                    <Utensils className="w-4 h-4" /> 热菜
                  </button>
                  <button
                    onClick={() => setEditForm({ ...editForm, category: 'cold' })}
                    className={`h-14 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${editForm.category === 'cold' ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400 bg-white hover:border-zinc-200'}`}
                  >
                    <Utensils className="w-4 h-4" /> 冷菜
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-widest text-zinc-400">特色介绍</Label>
                <Input
                  className="h-14 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-black"
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="h-14 flex-1 rounded-2xl font-bold" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button
                className="h-14 flex-1 rounded-2xl bg-black text-white font-bold"
                onClick={handleEditDish}
                disabled={!editForm.name.trim()}
              >
                保存修改
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
