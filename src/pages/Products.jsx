import { useEffect, useState } from "react";
import { Pencil, Trash2, Search, Tag } from "lucide-react";
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

  const load          = () => getProducts({ search }).then(setProducts).catch(console.error);
  const loadCats      = () => getCategories().then(setCategories).catch(console.error);

  useEffect(() => { loadCats(); }, []);
  useEffect(() => { load(); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = async (value) => {
    if (value !== NEW_CATEGORY) { setForm((f) => ({ ...f, category_id: value })); return; }
    const name = prompt("New category name:");
    if (!name?.trim()) return;
    const data = await createCategory(name.trim());
    await loadCats();
    setForm((f) => ({ ...f, category_id: data.id }));
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      name:        form.name,
      category_id: form.category_id || null,
      price:       Number(form.price),
      description: form.description || null,
      status:      form.status,
    };
    if (form.id) {
      await updateProduct(form.id, payload);
    } else {
      await createProduct(payload);
    }
    setForm(empty);
    load();
  };

  const edit = (p) => setForm({
    id: p.id, name: p.name, category_id: p.category_id || "",
    price: p.price, description: p.description || "", status: p.status,
  });

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="font-serif text-3xl mb-1">Products</h1>
          <p className="text-neutral-500">Manage your menu items and prices</p>
        </div>
        <button onClick={() => setShowModal(true)} className="border rounded-lg px-4 py-2 text-sm flex items-center gap-2">
          <Tag size={14} /> Manage Categories
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Product list */}
        <div className="col-span-2 bg-white rounded-xl p-5">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
            <input className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm" placeholder="Search products..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-neutral-400 border-b">
              <tr><th className="py-2">Product</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-neutral-400">{p.category_name}</div>
                  </td>
                  <td>Rs. {Number(p.price).toLocaleString()}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="flex gap-2 py-3">
                    <button onClick={() => edit(p)} className="p-1.5 border rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 border rounded-lg text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {!products.length && (
                <tr><td colSpan={4} className="text-center text-neutral-400 py-6">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add / Edit form */}
        <form onSubmit={save} className="bg-white rounded-xl p-5 h-fit">
          <h2 className="font-semibold mb-4">{form.id ? "Edit Product" : "Add New Product"}</h2>

          <label className="text-xs text-neutral-500">Product Name *</label>
          <input required className="w-full border rounded-lg px-3 py-2 text-sm mb-3" placeholder="e.g. Chicken Biryani"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label className="text-xs text-neutral-500">Category</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
            value={form.category_id} onChange={(e) => handleCategoryChange(e.target.value)}>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value={NEW_CATEGORY}>+ Add new category…</option>
          </select>

          <label className="text-xs text-neutral-500">Price (Rs.) *</label>
          <input required type="number" className="w-full border rounded-lg px-3 py-2 text-sm mb-3" placeholder="e.g. 450"
            value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

          <label className="text-xs text-neutral-500">Description (Optional)</label>
          <textarea className="w-full border rounded-lg px-3 py-2 text-sm mb-3" rows={3} maxLength={200}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label className="text-xs text-neutral-500 block mb-1">Status</label>
          <div className="flex gap-2 mb-4">
            {["active", "inactive"].map((s) => (
              <button type="button" key={s} onClick={() => setForm({ ...form, status: s })}
                className={`flex-1 py-2 rounded-lg text-sm capitalize ${form.status === s ? "bg-ink text-white" : "border"}`}>
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setForm(empty)} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
            <button type="submit" className="flex-1 bg-ink text-white rounded-lg py-2 text-sm">Save Product</button>
          </div>
        </form>
      </div>

      {showCategoryModal && (
        <CategoryModal onClose={() => setShowModal(false)} onChanged={() => { loadCats(); load(); }} />
      )}
    </div>
  );
}
