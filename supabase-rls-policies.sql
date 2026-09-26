-- ============================================================
-- RLS Policies for ghar-jaisa
-- This is an internal POS app — no user auth, so we grant
-- full access to the anon role for all tables.
--
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── categories ───────────────────────────────────────────────
alter table categories enable row level security;

drop policy if exists "anon_select_categories" on categories;
drop policy if exists "anon_insert_categories" on categories;
drop policy if exists "anon_update_categories" on categories;
drop policy if exists "anon_delete_categories" on categories;

create policy "anon_select_categories" on categories for select using (true);
create policy "anon_insert_categories" on categories for insert with check (true);
create policy "anon_update_categories" on categories for update using (true);
create policy "anon_delete_categories" on categories for delete using (true);

-- ── products ─────────────────────────────────────────────────
alter table products enable row level security;

drop policy if exists "anon_select_products" on products;
drop policy if exists "anon_insert_products" on products;
drop policy if exists "anon_update_products" on products;
drop policy if exists "anon_delete_products" on products;

create policy "anon_select_products" on products for select using (true);
create policy "anon_insert_products" on products for insert with check (true);
create policy "anon_update_products" on products for update using (true);
create policy "anon_delete_products" on products for delete using (true);

-- ── customers ────────────────────────────────────────────────
alter table customers enable row level security;

drop policy if exists "anon_select_customers" on customers;
drop policy if exists "anon_insert_customers" on customers;
drop policy if exists "anon_update_customers" on customers;
drop policy if exists "anon_delete_customers" on customers;

create policy "anon_select_customers" on customers for select using (true);
create policy "anon_insert_customers" on customers for insert with check (true);
create policy "anon_update_customers" on customers for update using (true);
create policy "anon_delete_customers" on customers for delete using (true);

-- ── orders ───────────────────────────────────────────────────
alter table orders enable row level security;

drop policy if exists "anon_select_orders" on orders;
drop policy if exists "anon_insert_orders" on orders;
drop policy if exists "anon_update_orders" on orders;
drop policy if exists "anon_delete_orders" on orders;

create policy "anon_select_orders" on orders for select using (true);
create policy "anon_insert_orders" on orders for insert with check (true);
create policy "anon_update_orders" on orders for update using (true);
create policy "anon_delete_orders" on orders for delete using (true);

-- ── order_items ──────────────────────────────────────────────
alter table order_items enable row level security;

drop policy if exists "anon_select_order_items" on order_items;
drop policy if exists "anon_insert_order_items" on order_items;
drop policy if exists "anon_update_order_items" on order_items;
drop policy if exists "anon_delete_order_items" on order_items;

create policy "anon_select_order_items" on order_items for select using (true);
create policy "anon_insert_order_items" on order_items for insert with check (true);
create policy "anon_update_order_items" on order_items for update using (true);
create policy "anon_delete_order_items" on order_items for delete using (true);

-- ── settings ─────────────────────────────────────────────────
alter table settings enable row level security;

drop policy if exists "anon_select_settings" on settings;
drop policy if exists "anon_insert_settings" on settings;
drop policy if exists "anon_update_settings" on settings;
drop policy if exists "anon_delete_settings" on settings;

create policy "anon_select_settings" on settings for select using (true);
create policy "anon_insert_settings" on settings for insert with check (true);
create policy "anon_update_settings" on settings for update using (true);
create policy "anon_delete_settings" on settings for delete using (true);
