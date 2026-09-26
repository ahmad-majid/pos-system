import { supabase } from "../supabase.js";

export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function getCategoriesWithCounts() {
  const { data, error } = await supabase.rpc("get_categories_with_counts");
  if (error) throw error;
  return data;
}

export async function createCategory(name) {
  // upsert — same behaviour as the old backend ON CONFLICT DO UPDATE
  const { data, error } = await supabase
    .from("categories")
    .upsert({ name: name.trim() }, { onConflict: "name" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, name) {
  const { data, error } = await supabase.from("categories").update({ name }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
