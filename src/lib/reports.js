import { supabase } from "../supabase.js";

export async function getReportsSummary() {
  const { data, error } = await supabase.rpc("get_reports_summary");
  if (error) throw error;
  return data;
}

export async function getDailySales(days = 14) {
  const { data, error } = await supabase.rpc("get_daily_sales", { p_days: days });
  if (error) throw error;
  return data;
}

export async function getTopProducts(days = 30, limit = 5) {
  const { data, error } = await supabase.rpc("get_top_products", { p_days: days, p_limit: limit });
  if (error) throw error;
  return data;
}
