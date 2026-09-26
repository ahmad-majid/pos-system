import { supabase } from "../supabase.js";

export async function getCustomers(search = "") {
  const { data, error } = await supabase.rpc("get_customers", { p_search: search });
  if (error) throw error;
  return data;
}

export async function getCustomer(id) {
  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", id).single();
  if (error) throw error;
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });
  if (ordersError) throw ordersError;
  return { ...customer, orders };
}

export async function deleteCustomer(id) {
  const { error } = await supabase.rpc("delete_customer", { p_id: id });
  if (error) throw error;
}
