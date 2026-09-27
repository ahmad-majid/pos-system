import { useEffect, useState } from "react";
import { X, Trash2, Plus, Tag } from "lucide-react";
import { getCategoriesWithCounts, createCategory, deleteCategory } from "../lib/categories.js";

export default function CategoryModal({ onClose, onChanged }) {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName]       = useState("");
  const [saving, setSaving]         = useState(false);

  const load = () => getCategoriesWithCounts().then(setCategories).catch(console.error);

  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createCategory(newName.trim());
      setNewName("");
      load();
      onChanged?.();
    } catch (err) {
      alert("Failed to add category: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, product_count) => {
    const msg = product_count > 0
      ? `${product_count} product(s) use this category — they will become Uncategorized. Delete anyway?`
      : "Delete this category?";
    if (!confirm(msg)) return;
    try {
      await deleteCategory(id);
      load();
      onChanged?.();
    } catch (err) {
      alert("Failed to delete category: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Tag size={16} />
            </div>
            <h2 className="font-serif font-bold text-lg text-neutral-900">Manage Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={add} className="flex gap-2">
          <input
            className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            placeholder="e.g. Rice, BBQ, Desserts..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="bg-ink text-gold hover:bg-neutral-900 font-semibold rounded-xl px-4 py-2 flex items-center gap-1 text-xs sm:text-sm shadow-sm transition disabled:opacity-50"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </form>

        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-xs sm:text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-800">{c.name}</span>
                <span className="text-[11px] bg-neutral-200 text-neutral-600 px-2 py-0.2 rounded-full">
                  {c.product_count} {c.product_count === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                onClick={() => remove(c.id, c.product_count)}
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                title="Delete category"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {!categories.length && (
            <p className="text-xs sm:text-sm text-neutral-400 py-6 text-center">
              No categories created yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
