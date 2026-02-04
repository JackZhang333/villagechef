// 客户可预约的最大月数
export const MAX_BOOKING_MONTHS = 3

export const TIME_SLOTS = {
  lunch: '午餐',
  dinner: '晚餐',
} as const

export const ORDER_STATUS = {
  pending: '待接单',
  accepted: '已接单',
  rejected: '已拒单',
  completed: '已完成',
  cancelled: '已取消',
} as const

export const DISH_CATEGORY = {
  cold: '冷菜',
  hot: '热菜',
} as const

export const USER_ROLES = {
  chef: 'chef',
  customer: 'customer',
  admin: 'admin',
} as const

export const MENU_CATEGORIES = [
  { value: 'cold', label: '冷菜' },
  { value: 'hot', label: '热菜' },
]

export const TIME_SLOT_OPTIONS = [
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
]

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, label]) => ({
  value,
  label,
}))
