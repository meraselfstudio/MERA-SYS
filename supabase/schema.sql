-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, service_role;

-- 1. PROFILES (Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  full_name text,
  role text check (role in ('admin', 'manager', 'crew')) default 'crew',
  avatar_url text,
  pin_hash text, -- Encrypted PIN for POS/Finance access
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 2. PRODUCTS (POS)
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  sku text unique,
  category text,
  price numeric not null,
  stock integer default 0,
  is_active boolean default true,
  image_url text,
  tier_1_price numeric,
  tier_2_price numeric,
  tier_3_price numeric,
  created_at timestamptz default now()
);

alter table public.products enable row level security;
create policy "Products are viewable by everyone." on public.products for select using (true);
create policy "Only admins/managers can update products." on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- 3. TRANSACTIONS (POS)
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  customer_name text,
  customer_contact text,
  total_amount numeric not null,
  payment_method text check (payment_method in ('cash', 'qris', 'debit', 'transfer')),
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  items jsonb, -- Snapshot of items: [{id, name, qty, price}, ...]
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;
create policy "Authenticated users can create transactions." on public.transactions for insert with check (auth.role() = 'authenticated');
create policy "Users can view all transactions." on public.transactions for select using (true);

-- 4. ATTENDANCE (Absensi)
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  shift_id text, -- e.g., 'morning_shift', 'weekend_full'
  check_in timestamptz default now(),
  check_out timestamptz,
  photo_url text, -- Check-in photo
  salary_snapshot jsonb, -- {base: 75000, penalty: 0, bonus: 5000}
  status text check (status in ('active', 'completed')) default 'active'
);

alter table public.attendance enable row level security;
create policy "Users can log their own attendance." on public.attendance for all using (auth.uid() = user_id);
create policy "Admins can view all attendance." on public.attendance for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- 5. EXPENSES (Finance)
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  description text not null,
  amount numeric not null,
  category text check (category in ('supplies', 'maintenance', 'payroll', 'other')),
  user_id uuid references public.profiles(id),
  receipt_url text,
  date timestamptz default now()
);

alter table public.expenses enable row level security;
create policy "Admins/Managers can manage expenses." on public.expenses for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'manager'))
);

-- 6. BOOKINGS (Studio)
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  customer_contact text,
  booking_date date not null,
  time_slot text not null, -- e.g. "14:00-15:00"
  package_type text, -- "Self Photo", "Professional"
  status text check (status in ('pending', 'confirmed', 'completed', 'cancelled')) default 'pending',
  notes text,
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;
create policy "Bookings viewable by staff." on public.bookings for select using (auth.role() = 'authenticated');
create policy "Staff can manage bookings." on public.bookings for all using (auth.role() = 'authenticated');

-- REALTIME SUBSCRIPTIONS
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.bookings;
