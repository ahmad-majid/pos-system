import { useEffect, useState } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { getCategoriesWithCounts, createCategory, deleteCategory } from "../lib/categories.js";

export default function CategoryModal({ onClose, onChanged }) {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName]       = useState("");

  const load = () => getCategoriesWithCounts().then(setCategories).catch(console.error);

  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createCategory(newName.trim());
    setNewName("");
    load();
    onChanged?.();
  };

  const remove = async (id, product_count) => {
    const msg = product_count > 0
      ? `${product_count} product(s) use this category — they'll become "Uncategorized". Delete anyway?`
      : "Delete this category?";
    if (!confirm(msg)) return;
    await deleteCategory(id);
    load();
    onChanged?.();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Manage Categories</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={add} className="flex gap-2 mb-4">
          <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="New category name"
            value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="bg-ink text-white rounded-lg px-3 flex items-center gap-1 text-sm">
            <Plus size={14} /> Add
          </button>
        </form>

        <div className="max-h-72 overflow-y-auto space-y-1">
          {categories.map((c) => (
            <div key={c.id} className="flex justify-between items-center border rounded-lg px-3 py-2 text-sm">
              <span>{c.name} <span className="text-neutral-400">({c.product_count})</span></span>
              <button onClick={() => remove(c.id, c.product_count)} className="text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
          {!categories.length && <p className="text-sm text-neutral-400">No categories yet.</p>}
        </div>
      </div>
    </div>
  );
}
