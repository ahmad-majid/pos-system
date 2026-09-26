import { supabase } from "../supabase.js";

export async function getOrders({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getOrder(id) {
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).single();
  if (error) throw error;
  const { data: items, error: itemsError } = await supabase.from("order_items").select("*").eq("order_id", id);
  if (itemsError) throw itemsError;
  return { ...order, items };
}

export async function getOrderStats() {
  const { data, error } = await supabase.rpc("get_order_stats");
  if (error) throw error;
  return data;
}

export async function createOrder({ customer = {}, order_type, payment_method, items, delivery_charges, status }) {
  const { data, error } = await supabase.rpc("create_order", {
    p_customer_name:    customer.name    || null,
    p_customer_phone:   customer.phone   || null,
    p_customer_address: customer.address || null,
    p_order_type:       order_type       || "stall",
    p_payment_method:   payment_method   || "cash",
    p_delivery_charges: delivery_charges || 0,
    p_status:           status           || "pending",
    p_items:            items,
  });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
