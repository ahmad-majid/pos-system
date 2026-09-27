-- ============================================================
-- GHAR JAISA POS - COMPLETE SUPABASE SETUP SCRIPT
-- Paste and run this in: Supabase Dashboard → SQL Editor → New query
-- Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- ── 1. TABLES SETUP ──────────────────────────────────────────

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  price numeric not null default 0,
  description text,
  image_url text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  address text,
  created_at timestamptz default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_address text,
  order_type text default 'stall',
  payment_method text default 'cash',
  subtotal numeric not null default 0,
  delivery_charges numeric not null default 0,
  grand_total numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Order Items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric not null default 0,
  quantity int not null default 1,
  total numeric not null default 0,
  created_at timestamptz default now()
);

-- Store Settings
create table if not exists settings (
  id int primary key default 1,
  shop_name text default 'Ghar Jaisa',
  tagline text default 'Made with love, just like home',
  address text,
  phone text,
  default_delivery_charge numeric default 300,
  receipt_footer text default 'Thank you! Good Food, Happy People ♥',
  logo_url text,
  updated_at timestamptz default now()
);

-- Seed default settings row if missing
insert into settings (id, shop_name, tagline, default_delivery_charge, receipt_footer)
values (1, 'Ghar Jaisa', 'Made with love, just like home', 300, 'Thank you! Good Food, Happy People ♥')
on conflict (id) do nothing;

-- ── 2. STORAGE SETUP (FOR LOGOS) ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "anon_upload_logos" on storage.objects;
drop policy if exists "anon_read_logos" on storage.objects;
drop policy if exists "anon_delete_logos" on storage.objects;

create policy "anon_upload_logos" on storage.objects for insert with check (bucket_id = 'logos');
create policy "anon_read_logos" on storage.objects for select using (bucket_id = 'logos');
create policy "anon_delete_logos" on storage.objects for delete using (bucket_id = 'logos');

-- ── 3. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table settings enable row level security;

-- categories
drop policy if exists "anon_select_categories" on categories;
drop policy if exists "anon_insert_categories" on categories;
drop policy if exists "anon_update_categories" on categories;
drop policy if exists "anon_delete_categories" on categories;
create policy "anon_select_categories" on categories for select using (true);
create policy "anon_insert_categories" on categories for insert with check (true);
create policy "anon_update_categories" on categories for update using (true);
create policy "anon_delete_categories" on categories for delete using (true);

-- products
drop policy if exists "anon_select_products" on products;
drop policy if exists "anon_insert_products" on products;
drop policy if exists "anon_update_products" on products;
drop policy if exists "anon_delete_products" on products;
create policy "anon_select_products" on products for select using (true);
create policy "anon_insert_products" on products for insert with check (true);
create policy "anon_update_products" on products for update using (true);
create policy "anon_delete_products" on products for delete using (true);

-- customers
drop policy if exists "anon_select_customers" on customers;
drop policy if exists "anon_insert_customers" on customers;
drop policy if exists "anon_update_customers" on customers;
drop policy if exists "anon_delete_customers" on customers;
create policy "anon_select_customers" on customers for select using (true);
create policy "anon_insert_customers" on customers for insert with check (true);
create policy "anon_update_customers" on customers for update using (true);
create policy "anon_delete_customers" on customers for delete using (true);

-- orders
drop policy if exists "anon_select_orders" on orders;
drop policy if exists "anon_insert_orders" on orders;
drop policy if exists "anon_update_orders" on orders;
drop policy if exists "anon_delete_orders" on orders;
create policy "anon_select_orders" on orders for select using (true);
create policy "anon_insert_orders" on orders for insert with check (true);
create policy "anon_update_orders" on orders for update using (true);
create policy "anon_delete_orders" on orders for delete using (true);

-- order_items
drop policy if exists "anon_select_order_items" on order_items;
drop policy if exists "anon_insert_order_items" on order_items;
drop policy if exists "anon_update_order_items" on order_items;
drop policy if exists "anon_delete_order_items" on order_items;
create policy "anon_select_order_items" on order_items for select using (true);
create policy "anon_insert_order_items" on order_items for insert with check (true);
create policy "anon_update_order_items" on order_items for update using (true);
create policy "anon_delete_order_items" on order_items for delete using (true);

-- settings
drop policy if exists "anon_select_settings" on settings;
drop policy if exists "anon_insert_settings" on settings;
drop policy if exists "anon_update_settings" on settings;
drop policy if exists "anon_delete_settings" on settings;
create policy "anon_select_settings" on settings for select using (true);
create policy "anon_insert_settings" on settings for insert with check (true);
create policy "anon_update_settings" on settings for update using (true);
create policy "anon_delete_settings" on settings for delete using (true);

-- ── 4. RPC FUNCTIONS (WITH PAKISTAN TIMEZONE & SAFE SEQUENCE) ──

-- Create order (transactional, safe sequence)
create or replace function create_order(
  p_customer_name    text    default null,
  p_customer_phone   text    default null,
  p_customer_address text    default null,
  p_order_type       text    default 'stall',
  p_payment_method   text    default 'cash',
  p_delivery_charges numeric default 0,
  p_status           text    default 'pending',
  p_items            jsonb   default '[]'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_customer_id  uuid;
  v_order_no     text;
  v_ymd          text;
  v_seq          int;
  v_subtotal     numeric := 0;
  v_grand_total  numeric;
  v_order        jsonb;
  v_items_out    jsonb := '[]';
  v_item         jsonb;
  v_inserted_item jsonb;
begin
  -- 1. Upsert customer
  if p_customer_phone is not null and p_customer_phone != '' then
    select id into v_customer_id from customers where phone = p_customer_phone limit 1;
    if v_customer_id is not null then
      update customers
        set name    = coalesce(p_customer_name, name),
            address = coalesce(p_customer_address, address)
        where id = v_customer_id;
    else
      insert into customers (name, phone, address)
        values (p_customer_name, p_customer_phone, p_customer_address)
        returning id into v_customer_id;
    end if;
  elsif p_customer_name is not null and p_customer_name != '' then
    insert into customers (name, phone, address)
      values (p_customer_name, null, p_customer_address)
      returning id into v_customer_id;
  end if;

  -- 2. Generate order_no (GJ-YYYYMMDD-NNN) using PKT (UTC+5)
  v_ymd := to_char(timezone('Asia/Karachi', now()), 'YYYYMMDD');
  select coalesce(max(nullif(split_part(order_no, '-', 3), '')::int), 0) + 1
    into v_seq
    from orders
   where order_no like 'GJ-' || v_ymd || '-%';
  v_order_no := 'GJ-' || v_ymd || '-' || lpad(v_seq::text, 3, '0');

  -- 3. Calculate subtotal
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_subtotal := v_subtotal + (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int;
  end loop;
  v_grand_total := v_subtotal + p_delivery_charges;

  -- 4. Insert order
  insert into orders (
    order_no, customer_id, customer_name, customer_phone, customer_address,
    order_type, payment_method, subtotal, delivery_charges, grand_total, status
  )
  values (
    v_order_no, v_customer_id, p_customer_name, p_customer_phone, p_customer_address,
    p_order_type, p_payment_method, v_subtotal, p_delivery_charges, v_grand_total, p_status
  )
  returning to_jsonb(orders.*) into v_order;

  -- 5. Insert items
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into order_items (order_id, product_id, product_name, unit_price, quantity, total)
    values (
      (v_order->>'id')::uuid,
      case when (v_item->>'product_id') is not null and (v_item->>'product_id') != ''
           then (v_item->>'product_id')::uuid else null end,
      v_item->>'product_name',
      (v_item->>'unit_price')::numeric,
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int
    )
    returning to_jsonb(order_items.*) into v_inserted_item;
    v_items_out := v_items_out || jsonb_build_array(v_inserted_item);
  end loop;

  return v_order || jsonb_build_object('items', v_items_out);
end;
$$;

-- Order stats
create or replace function get_order_stats()
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'today_sales',    coalesce(sum(grand_total) filter (where (created_at at time zone 'Asia/Karachi')::date = (now() at time zone 'Asia/Karachi')::date and status != 'cancelled'), 0),
    'today_orders',   count(*) filter (where (created_at at time zone 'Asia/Karachi')::date = (now() at time zone 'Asia/Karachi')::date),
    'total_orders',   count(*),
    'pending_orders', count(*) filter (where status in ('pending','preparing')),
    'total_customers',(select count(*) from customers)
  )
  from orders;
$$;

-- Reports summary
create or replace function get_reports_summary()
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'total_revenue',   coalesce(sum(grand_total), 0),
    'total_orders',    count(*)::int,
    'avg_order_value', coalesce(avg(grand_total), 0),
    'today_revenue',   coalesce(sum(grand_total) filter (where (created_at at time zone 'Asia/Karachi')::date = (now() at time zone 'Asia/Karachi')::date), 0),
    'week_revenue',    coalesce(sum(grand_total) filter (where created_at >= date_trunc('week', now() at time zone 'Asia/Karachi')), 0),
    'month_revenue',   coalesce(sum(grand_total) filter (where created_at >= date_trunc('month', now() at time zone 'Asia/Karachi')), 0)
  )
  from orders where status != 'cancelled';
$$;

-- Daily sales
create or replace function get_daily_sales(p_days int default 14)
returns table(date date, revenue numeric, orders int)
language sql
security definer
as $$
  select
    d::date,
    coalesce(sum(o.grand_total), 0),
    count(o.id)::int
  from generate_series((now() at time zone 'Asia/Karachi')::date - (p_days - 1), (now() at time zone 'Asia/Karachi')::date, interval '1 day') d
  left join orders o on (o.created_at at time zone 'Asia/Karachi')::date = d and o.status != 'cancelled'
  group by d
  order by d;
$$;

-- Top products
create or replace function get_top_products(p_days int default 30, p_limit int default 5)
returns table(product_name text, units_sold int, revenue numeric)
language sql
security definer
as $$
  select
    oi.product_name,
    sum(oi.quantity)::int        as units_sold,
    sum(oi.total)                as revenue
  from order_items oi
  join orders o on o.id = oi.order_id
  where (o.created_at at time zone 'Asia/Karachi') >= (now() at time zone 'Asia/Karachi') - (p_days || ' days')::interval 
    and o.status != 'cancelled'
  group by oi.product_name
  order by sum(oi.total) desc
  limit p_limit;
$$;

-- Customers with aggregates
create or replace function get_customers(p_search text default '')
returns table(
  id uuid, name text, phone text, address text, created_at timestamptz,
  order_count int, total_spent numeric, last_order_at timestamptz
)
language sql
security definer
as $$
  select
    c.id, c.name, c.phone, c.address, c.created_at,
    count(o.id)::int,
    coalesce(sum(o.grand_total), 0),
    max(o.created_at)
  from customers c
  left join orders o on o.customer_id = c.id
  where p_search = ''
     or c.name  ilike '%' || p_search || '%'
     or c.phone ilike '%' || p_search || '%'
  group by c.id
  order by max(o.created_at) desc nulls last;
$$;

-- Categories with counts
create or replace function get_categories_with_counts()
returns table(id uuid, name text, created_at timestamptz, product_count int)
language sql
security definer
as $$
  select c.id, c.name, c.created_at, count(p.id)::int
  from categories c
  left join products p on p.category_id = c.id
  group by c.id
  order by c.name;
$$;

-- Products with category name
create or replace function get_products(p_search text default '', p_category text default '', p_status text default '')
returns table(
  id uuid, name text, category_id uuid, category_name text,
  price numeric, description text, image_url text, status text, created_at timestamptz
)
language sql
security definer
as $$
  select p.id, p.name, p.category_id, c.name,
         p.price, p.description, p.image_url, p.status, p.created_at
  from products p
  left join categories c on c.id = p.category_id
  where (p_search  = '' or p.name ilike '%' || p_search || '%')
    and (p_category = '' or c.name = p_category)
    and (p_status   = '' or p.status = p_status)
  order by p.created_at desc;
$$;

-- Delete customer safely
create or replace function delete_customer(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update orders set customer_id = null where customer_id = p_id;
  delete from customers where id = p_id;
end;
$$;
