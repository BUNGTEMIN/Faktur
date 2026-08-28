import React, { useState } from 'react';
import { ProductItem } from '../types';
import { formatCurrency } from '../utils/numberToWords';
import { Package, Plus, Trash2, Edit2, Search, X, Check } from 'lucide-react';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onAddProduct: (product: Omit<ProductItem, 'id'>) => void;
  onUpdateProduct: (product: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Jasa & Layanan');
  const [formUnit, setFormUnit] = useState('Paket');
  const [formPrice, setFormPrice] = useState(100000);
  const [formDescription, setFormDescription] = useState('');

  if (!isOpen) return null;

  const startCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Jasa & Layanan');
    setFormUnit('Paket');
    setFormPrice(100000);
    setFormDescription('');
    setIsCreating(true);
  };

  const startEdit = (p: ProductItem) => {
    setIsCreating(false);
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormUnit(p.unit);
    setFormPrice(p.price);
    setFormDescription(p.description || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: formName,
        category: formCategory,
        unit: formUnit,
        price: Number(formPrice),
        description: formDescription,
      });
      setEditingProduct(null);
    } else {
      onAddProduct({
        name: formName,
        category: formCategory,
        unit: formUnit,
        price: Number(formPrice),
        description: formDescription,
      });
      setIsCreating(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-extrabold text-base">Master Katalog Produk & Jasa</h3>
              <p className="text-xs text-slate-300">Kelola daftar item siap pakai untuk mempermudah pembuatan faktur penjualan.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Top Actions: Search & Add Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama produk, kategori, atau deskripsi..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-sky-500 focus:outline-none"
              />
            </div>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          </div>

          {/* Form when creating/editing */}
          {(isCreating || editingProduct) && (
            <form onSubmit={handleSave} className="bg-slate-50 border border-sky-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-extrabold text-sky-900 uppercase">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru ke Katalog'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Produk / Layanan</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="cth. Pengembangan Web Portal / Lisensi Software"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Kategori</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="Jasa IT / Hardware / Desain"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Satuan (Unit)</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="Paket / Bulan / Pcs / Jam"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Harga Default (Rupiah)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full font-mono font-bold border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Deskripsi / Spesifikasi</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded p-2 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="Keterangan singkat produk..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProduct(null);
                  }}
                  className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan Produk
                </button>
              </div>
            </form>
          )}

          {/* Products List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Nama Produk / Layanan</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.description && <div className="text-[11px] text-slate-500">{p.description}</div>}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">{p.category}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 font-medium">{p.unit}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.price, 'IDR')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Total {products.length} produk tersimpan</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
