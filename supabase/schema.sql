-- VillageChef Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (base user table)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('chef', 'customer', 'admin')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Chefs table (chef profile)
CREATE TABLE chefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Menus table
CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dish_count INTEGER NOT NULL DEFAULT 10,
    price INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Drop old tables if they exist (schema migration)
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS dishes;

-- Dishes table (菜品库)
CREATE TABLE dishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('cold', 'hot')),
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Menu items table (关联到菜品库)
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Availability table (schedules)
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot TEXT NOT NULL CHECK (time_slot IN ('lunch', 'dinner')),
    is_booked BOOLEAN DEFAULT false NOT NULL,
    share_token TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(chef_id, date, time_slot)
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
    availability_id UUID REFERENCES availability(id) ON DELETE SET NULL,
    menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    menu_name TEXT,
    guest_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    service_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_chefs_user_id ON chefs(user_id);
CREATE INDEX idx_menus_chef_id ON menus(chef_id);
CREATE INDEX idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX idx_availability_chef_date ON availability(chef_id, date);
CREATE INDEX idx_orders_chef_id ON orders(chef_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_booking_code ON orders(booking_code);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users table: Users can read all, update own profile, insert own profile
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Chefs table: Everyone can read active chefs, chefs can manage own
CREATE POLICY "Enable read access for all users" ON chefs FOR SELECT USING (true);
CREATE POLICY "Chefs can insert own profile" ON chefs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Chefs can manage own profile" ON chefs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all chefs" ON chefs FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Menus table: Everyone can read, chefs manage own
CREATE POLICY "Enable read access for all users" ON menus FOR SELECT USING (true);
CREATE POLICY "Chefs can insert menus" ON menus FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chefs WHERE id = menus.chef_id AND user_id = auth.uid())
);
CREATE POLICY "Chefs can manage own menus" ON menus FOR ALL USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = menus.chef_id AND user_id = auth.uid())
);

-- Menu items table: Same as menus
CREATE POLICY "Enable read access for all users" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Chefs can insert menu items" ON menu_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM menus
        INNER JOIN chefs ON chefs.id = menus.chef_id
        WHERE menus.id = menu_items.menu_id AND chefs.user_id = auth.uid()
    )
);
CREATE POLICY "Chefs can manage own menu items" ON menu_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM menus
        INNER JOIN chefs ON chefs.id = menus.chef_id
        WHERE menus.id = menu_items.menu_id AND chefs.user_id = auth.uid()
    )
);

-- Dishes table (菜品库): Chefs manage their own dishes
CREATE POLICY "Enable read access for all users" ON dishes FOR SELECT USING (true);
CREATE POLICY "Chefs can insert dishes" ON dishes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chefs WHERE id = dishes.chef_id AND user_id = auth.uid())
);
CREATE POLICY "Chefs can manage own dishes" ON dishes FOR ALL USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = dishes.chef_id AND user_id = auth.uid())
);

-- Availability table: Everyone can read, chefs manage own, admins manage all
CREATE POLICY "Enable read access for all users" ON availability FOR SELECT USING (true);
CREATE POLICY "Chefs can insert availability" ON availability FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chefs WHERE id = availability.chef_id AND user_id = auth.uid())
);
CREATE POLICY "Chefs can manage own availability" ON availability FOR ALL USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = availability.chef_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all availability" ON availability FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Orders table: Complex permissions
-- Simplified policies that handle missing profiles gracefully
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM chefs WHERE id = orders.chef_id AND user_id = auth.uid())
    OR customer_phone IN (SELECT phone FROM users WHERE id = auth.uid())
);

CREATE POLICY "Chefs can insert orders" ON orders FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chefs WHERE id = orders.chef_id AND user_id = auth.uid())
);

CREATE POLICY "Chefs can update own orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = orders.chef_id AND user_id = auth.uid())
);

CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default admin user (phone: 13800138000, password should be set via Supabase Auth)
-- Note: Admin user needs to be created via Supabase Auth first, then add to users table

-- Trigger to create chef profile when user with role 'chef' is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, phone, role, is_active)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'role', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger requires setting up Supabase Auth hooks
-- For simplicity, the app handles user creation through the registration flow

-- Insert initial admin user (after creating the user in Supabase Auth)
-- INSERT INTO users (id, phone, role, is_active)
-- VALUES ('your-admin-user-uuid', '13800138000', 'admin', true);

-- RPC function to create chef profile (bypasses RLS when called with service role)
CREATE OR REPLACE FUNCTION public.create_chef_profile(
  p_user_id UUID,
  p_phone TEXT,
  p_name TEXT,
  p_address TEXT,
  p_bio TEXT DEFAULT ''
)
RETURNS void AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, phone, role, is_active)
  VALUES (p_user_id, p_phone, 'chef', true)
  ON CONFLICT (id) DO NOTHING;

  -- Insert into chefs table
  INSERT INTO public.chefs (id, user_id, name, phone, address, bio, is_active)
  VALUES (p_user_id, p_user_id, p_name, p_phone, p_address, p_bio, true)
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
