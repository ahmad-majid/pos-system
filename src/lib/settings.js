import { supabase } from "../supabase.js";

export async function getSettings() {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[settings] getSettings error:", error.message, error);
    throw error;
  }

  if (!data) {
    console.warn("[settings] No settings row found — inserting defaults");
    const { data: created, error: insertError } = await supabase
      .from("settings")
      .insert({ id: 1 })
      .select()
      .single();
    if (insertError) {
      console.error("[settings] insert error:", insertError.message, insertError);
      throw insertError;
    }
    return created;
  }

  return data;
}

// logoFile is a File object (from <input type="file">), or null if unchanged
export async function updateSettings(payload, logoFile = null) {
  let logo_url = payload.logo_url ?? null;

  // Upload new logo if one was selected
  if (logoFile) {
    const ext      = logoFile.name.split(".").pop();
    const path     = `shop-logo.${ext}`;                  // always overwrite same path

    // Remove old file first so the new one isn't blocked by a name clash
    await supabase.storage.from("logos").remove([path]);

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });

    if (uploadError) {
      console.error("[settings] logo upload error:", uploadError.message, uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    // Add a cache-buster so the browser always loads the fresh image
    logo_url = urlData.publicUrl + "?t=" + Date.now();
  }

  const clean = Object.fromEntries(
    Object.entries({ ...payload, logo_url, updated_at: new Date().toISOString() })
      .filter(([, v]) => v !== undefined)
  );

  const { data, error } = await supabase
    .from("settings")
    .update(clean)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    console.error("[settings] updateSettings error:", error.message, error);
    throw error;
  }
  return data;
}
