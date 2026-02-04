export type UserRole = 'chef' | 'customer' | 'admin'
export type TimeSlot = 'lunch' | 'dinner'
export type DishCategory = 'cold' | 'hot'
export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'

export interface User {
  id: string
  phone: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Chef {
  id: string
  user_id: string
  name: string
  bio: string
  phone: string
  address: string
  is_active: boolean
  created_at: string
  user?: User
}

export interface Menu {
  id: string
  chef_id: string
  name: string
  dish_count: number
  price: number
  description: string
  created_at: string
  chef?: Chef
  menu_items?: MenuItem[]
}

export interface MenuItem {
  id: string
  menu_id: string
  dish_name: string
  dish_image_url: string | null
  category: DishCategory
  sort_order: number
}

export interface Availability {
  id: string
  chef_id: string
  date: string
  time_slot: TimeSlot
  is_booked: boolean
  share_token: string
  is_active: boolean
  created_at: string
  chef?: Chef
}

export interface Order {
  id: string
  booking_code: string
  customer_name: string
  customer_phone: string
  chef_id: string
  availability_id: string
  menu_id: string
  status: OrderStatus
  service_address: string
  notes: string | null
  created_at: string
  chef?: Chef
  availability?: Availability
  menu?: Menu
}

// Form types
export interface RegisterForm {
  phone: string
  role: UserRole
  name?: string
}

export interface ChefProfileForm {
  name: string
  bio: string
  phone: string
  address: string
}

export interface MenuForm {
  name: string
  dish_count: number
  price: number
  description: string
}

export interface MenuItemForm {
  dish_name: string
  dish_image_url?: string
  category: DishCategory
  sort_order?: number
}

export interface BookingForm {
  customer_name: string
  customer_phone: string
  service_address: string
  notes?: string
  date: string
  time_slot: TimeSlot
  menu_id: string
  tables: number
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Schedule item for calendar view
export interface ScheduleItem {
  date: string
  lunch: Availability | null
  dinner: Availability | null
  orders: Order[]
}

// Dashboard stats
export interface DashboardStats {
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_revenue: number
}
