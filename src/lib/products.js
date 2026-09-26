import { supabase } from "../supabase.js";

export async function getProducts({ search = "", category = "", status = "" } = {}) {
  const { data, error } = await supabase.rpc("get_products", {
    p_search: search,
    p_category: category,
    p_status: status,
  });
  if (error) throw error;
  return data;
}

export async function getProductStats() {
  const { count: total } = await supabase.from("products").select("*", { count: "exact", head: true });
  const { count: active } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active");
  const { count: inactive } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "inactive");
  const { count: categories } = await supabase.from("categories").select("*", { count: "exact", head: true });
  return { total, active, inactive, categories };
}

export async function createProduct(payload) {
  const { data, error } = await supabase.from("products").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase.from("products").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
