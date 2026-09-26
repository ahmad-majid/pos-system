-- ============================================================
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query
-- These functions are called via supabase.rpc() from the frontend
-- ============================================================

-- ── 1. Create order (transactional) ─────────────────────────────────────────
-- Handles: customer upsert, order_no generation, order + items insert
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

  -- 2. Generate order_no (GJ-YYYYMMDD-NNN)
  v_ymd := to_char(current_date, 'YYYYMMDD');
  select count(*)::int + 1 into v_seq
    from orders where order_no like 'GJ-' || v_ymd || '-%';
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

-- ── 2. Order stats (dashboard cards) ────────────────────────────────────────
create or replace function get_order_stats()
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'today_sales',    coalesce(sum(grand_total) filter (where created_at::date = current_date), 0),
    'today_orders',   count(*) filter (where created_at::date = current_date),
    'total_orders',   count(*),
    'pending_orders', count(*) filter (where status in ('pending','preparing')),
    'total_customers',(select count(*) from customers)
  )
  from orders;
$$;

-- ── 3. Reports summary ───────────────────────────────────────────────────────
create or replace function get_reports_summary()
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'total_revenue',   coalesce(sum(grand_total), 0),
    'total_orders',    count(*)::int,
    'avg_order_value', coalesce(avg(grand_total), 0),
    'today_revenue',   coalesce(sum(grand_total) filter (where created_at::date = current_date), 0),
    'week_revenue',    coalesce(sum(grand_total) filter (where created_at >= date_trunc('week', now())), 0),
    'month_revenue',   coalesce(sum(grand_total) filter (where created_at >= date_trunc('month', now())), 0)
  )
  from orders where status != 'cancelled';
$$;

-- ── 4. Daily sales for chart ─────────────────────────────────────────────────
create or replace function get_daily_sales(p_days int default 14)
returns table(date date, revenue numeric, orders int)
language sql
security definer
as $$
  select
    d::date,
    coalesce(sum(o.grand_total), 0),
    count(o.id)::int
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
  left join orders o on o.created_at::date = d and o.status != 'cancelled'
  group by d
  order by d;
$$;

-- ── 5. Top products ──────────────────────────────────────────────────────────
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
  where o.created_at >= current_date - p_days and o.status != 'cancelled'
  group by oi.product_name
  order by sum(oi.total) desc
  limit p_limit;
$$;

-- ── 6. Customer list with aggregates ─────────────────────────────────────────
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

-- ── 7. Categories with product counts ────────────────────────────────────────
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

-- ── 8. Products with category name ───────────────────────────────────────────
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

-- ── 9. Delete customer (nullify orders first) ────────────────────────────────
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
