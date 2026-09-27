import { useEffect, useState } from "react";
import { Pencil, Trash2, Search, Tag, Plus, X } from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../lib/products.js";
import { getCategories, createCategory } from "../lib/categories.js";
import CategoryModal from "../components/CategoryModal.jsx";

const empty = { id: null, name: "", category_id: "", price: "", description: "", status: "active" };
const NEW_CATEGORY = "__new__";

export default function Products() {
  const [products, setProducts]             = useState([]);
  const [categories, setCategories]         = useState([]);
  const [search, setSearch]                 = useState("");
  const [form, setForm]                     = useState(empty);
  const [showCategoryModal, setShowModal]   = useState(false);
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [saving, setSaving]                 = useState(false);

  const load     = () => getProducts({ search }).then(setProducts).catch(console.error);
  const loadCats = () => getCategories().then(setCategories).catch(console.error);

  useEffect(() => { loadCats(); }, []);
  useEffect(() => { load(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = async (value) => {
    if (value !== NEW_CATEGORY) {
      setForm((f) => ({ ...f, category_id: value }));
      return;
    }
    const name = prompt("Enter new category name:");
    if (!name?.trim()) return;
    const data = await createCategory(name.trim());
    await loadCats();
    setForm((f) => ({ ...f, category_id: data.id }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name:        form.name.trim(),
      category_id: form.category_id || null,
      price:       Number(form.price),
      description: form.description?.trim() || null,
      status:      form.status,
    };

    try {
      if (form.id) {
        await updateProduct(form.id, payload);
      } else {
        await createProduct(payload);
      }
      setForm(empty);
      setMobileFormOpen(false);
      load();
    } catch (err) {
      alert("Failed to save product: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (p) => {
    setForm({
      id: p.id,
      name: p.name,
      category_id: p.category_id || "",
      price: p.price,
      description: p.description || "",
      status: p.status,
    });
    setMobileFormOpen(true);
  };

  const remove = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900">Products & Menu</h1>
          <p className="text-neutral-500 text-xs sm:text-sm">Manage menu items, prices and dish categories</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none border border-neutral-200 bg-white hover:bg-neutral-50 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition shadow-xs text-neutral-700"
          >
            <Tag size={15} />
            <span>Categories</span>
          </button>
          <button
            onClick={() => {
              setForm(empty);
              setMobileFormOpen(true);
            }}
            className="lg:hidden flex-1 sm:flex-none bg-ink text-gold rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <Plus size={15} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Product Table Column */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-200/70 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search products by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-neutral-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-neutral-900">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-neutral-400 line-clamp-1">{p.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-600">
                      {p.category_name ? (
                        <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs">
                          {p.category_name}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic text-xs">General</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-neutral-900">
                      Rs. {Number(p.price).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        p.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-500"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => edit(p)}
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 transition"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-red-50 text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!products.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-neutral-400 py-10">
                      No products recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Add / Edit Form (Persistent on Desktop, Drawer/Sheet on Mobile) */}
        <div
          className={`lg:col-span-5 xl:col-span-4 ${
            mobileFormOpen
              ? "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0"
              : "hidden lg:block"
          }`}
        >
          <form
            onSubmit={save}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl lg:shadow-sm border border-neutral-200/70 w-full max-w-lg lg:max-w-none max-h-[90vh] lg:max-h-none overflow-y-auto space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h2 className="font-serif font-bold text-lg text-neutral-900">
                {form.id ? "Edit Menu Item" : "Add New Menu Item"}
              </h2>
              {mobileFormOpen && (
                <button
                  type="button"
                  onClick={() => setMobileFormOpen(false)}
                  className="lg:hidden p-1 text-neutral-400 hover:text-neutral-700"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Item Title *
              </label>
              <input
                required
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="e.g. Special Chicken Biryani"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={form.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value={NEW_CATEGORY}>+ Add new category…</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Price (Rs.) *
              </label>
              <input
                required
                type="number"
                min="0"
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="e.g. 450"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Description (Optional)
              </label>
              <textarea
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                rows={2}
                maxLength={200}
                placeholder="Portion size, ingredients, spice level..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Availability Status
              </label>
              <div className="flex gap-2">
                {["active", "inactive"].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm({ ...form, status: s })}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize border transition ${
                      form.status === s
                        ? "bg-ink text-white border-ink shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setForm(empty);
                  setMobileFormOpen(false);
                }}
                className="flex-1 border border-neutral-200 hover:bg-neutral-50 rounded-xl py-2 text-xs sm:text-sm font-medium text-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-ink text-gold hover:bg-black font-semibold rounded-xl py-2 text-xs sm:text-sm shadow-sm transition disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Management Modal */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowModal(false)}
          onChanged={() => {
            loadCats();
            load();
          }}
        />
      )}
    </div>
  );
}
