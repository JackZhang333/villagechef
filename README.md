# VillageChef - 乡村厨师预约服务

## 项目概述

基于 H5 的响应式移动端应用，以日程为核心，方便厨师在微信上分享可预约时段，引导客户在线预约。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **组件库**: shadcn/ui + Radix UI
- **后端/数据库**: Supabase (PostgreSQL + Auth + Realtime)
- **状态管理**: Zustand
- **表单处理**: React Hook Form + Zod

## 快速开始

### 1. 环境准备

确保已安装 Node.js 18+ 和 npm

```bash
node -v  # 应显示 v18+
npm -v
```

### 2. 安装依赖

```bash
cd village-chef
npm install
```

### 3. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 复制 `.env.local.example` 为 `.env.local`
3. 填写环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. 设置数据库

1. 打开 Supabase SQL Editor
2. 运行 `supabase/schema.sql` 中的 SQL 脚本

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
village-chef/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (auth)/            # 认证页面（登录/注册）
│   │   ├── (chef)/            # 厨师端页面
│   │   │   ├── dashboard/     # 工作台
│   │   │   ├── menu/          # 菜单管理
│   │   │   ├── schedule/      # 日程管理
│   │   │   └── orders/        # 订单管理
│   │   ├── (customer)/        # 用户端页面
│   │   │   └── share/[token]/ # 分享预约页面
│   │   └── (admin)/           # 管理后台
│   ├── components/            # React 组件
│   │   └── ui/               # shadcn/ui 组件
│   ├── lib/                  # 工具函数和配置
│   │   └── supabase/         # Supabase 客户端
│   ├── hooks/                # 自定义 Hooks
│   └── types/               # TypeScript 类型定义
├── public/                   # 静态资源
└── supabase/
    └── schema.sql           # 数据库 Schema
```

## 功能说明

### 厨师端

1. **注册登录** - 手机号注册（需格式正确，无需短信验证）
2. **个人信息** - 姓名、手机号、地址、个人简介
3. **菜单管理** - 创建菜单、添加冷菜/热菜
4. **日程管理** - 设置可预约日期和时段、分享链接
5. **订单管理** - 接单/拒单、完成订单

### 用户端

1. **预约流程** - 点击分享链接 → 选择日期/时段 → 选择菜单 → 填写信息 → 确认预约
2. **预约码** - 预约成功后生成 6 位预约码

### 管理后台

1. **厨师管理** - 查看、启用/禁用厨师
2. **用户管理** - 查看、启用/禁用用户
3. **订单管理** - 查看所有订单
4. **日程统计** - 查看日程安排
5. **菜单统计** - 查看菜单列表

## 部署

### Vercel 部署

```bash
npm run build
vercel deploy
```

## 注意事项

1. **认证方式**: 简化认证，手机号格式正确即可注册，无需短信验证
2. **支付功能**: 初期暂不实现在线支付
3. **通知功能**: 初期暂不发送通知
4. **分享链接**: 使用 `localhost:3000` 测试，部署后替换为实际域名
5. **管理员**: 需手动在数据库中设置管理员权限
