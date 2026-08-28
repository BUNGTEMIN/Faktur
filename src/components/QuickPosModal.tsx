import React, { useState } from 'react';
import { ProductItem, ClientProfile, InvoiceData, PaymentStatus } from '../types';
import { formatCurrency, calculateInvoiceTotals } from '../utils/numberToWords';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  X, 
  Check, 
  Printer, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Calendar,
  Users,
  PackageCheck
} from 'lucide-react';

interface QuickPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  clients: ClientProfile[];
  onCreateSaleInvoice: (invoiceData: Partial<InvoiceData>) => void;
}

interface CartItem {
  product: ProductItem;
  quantity: number;
  discountPercent: number;
}

export const QuickPosModal: React.FC<QuickPosModalProps> = ({
  isOpen,
  onClose,
  products,
  clients,
  onCreateSaleInvoice,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(clients[0] || null);
  const [customClientName, setCustomClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'CASH' | 'QRIS' | 'TEMPO'>('TRANSFER');
  const [includeTax, setIncludeTax] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, discountPercent: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
  const taxAmount = includeTax ? (subtotal * 11) / 100 : 0;
  const grandTotal = subtotal + taxAmount;

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleCheckout = (andPrint: boolean = false) => {
    if (cart.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + (paymentMethod === 'TEMPO' ? 14 : 0));

    const finalClient: ClientProfile = selectedClient || {
      companyName: customClientName || 'Pelanggan Umum (Walk-in)',
      attentionName: 'Pembeli',
      role: 'Customer',
      address: 'Transaksi Langsung / Kasir',
      city: 'Jakarta',
      postalCode: '10000',
      phone: '+62 800 0000 0000',
      email: 'sales@tokomaju.com',
    };

    const status: PaymentStatus = paymentMethod === 'TEMPO' ? 'UNPAID' : 'PAID';

    const invoiceItems = cart.map((c) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: c.product.name + (c.product.description ? ` (${c.product.description})` : ''),
      quantity: c.quantity,
      unit: c.product.unit || 'Pcs',
      unitPrice: c.product.price,
      discountPercent: c.discountPercent || 0,
    }));

    onCreateSaleInvoice({
      issueDate: today,
      dueDate: due.toISOString().split('T')[0],
      client: finalClient,
      items: invoiceItems,
      discountPercent: 0,
      taxPercent: includeTax ? 11 : 0,
      paymentStatus: status,
      notes: `Transaksi Penjualan via Kasir POS (${paymentMethod}). Terima kasih atas pembelian Anda!`,
      terms: paymentMethod === 'TEMPO' ? 'Pembayaran tempo maksimal 14 hari kalender.' : 'Barang yang sudah dibeli telah diperiksa dengan baik.',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Kasir Penjualan Cepat (Quick POS)</h3>
              <p className="text-[11px] text-slate-300">Pilih item produk, tentukan pelanggan, dan terbitkan faktur penjualan instan.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* POS 2-Column Split: Left Catalog / Right Cart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left: Product Catalog Grid (7 cols) */}
          <div className="lg:col-span-7 border-r border-slate-200 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto bg-slate-50/50">
            
            {/* Search & Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari item barang atau jasa..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] font-semibold transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Produk' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto">
              {filteredProducts.map((prod) => {
                const inCart = cart.find((c) => c.product.id === prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="bg-white border border-slate-200 hover:border-sky-400 p-3.5 rounded-xl transition cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 leading-snug group-hover:text-sky-700">
                          {prod.name}
                        </span>
                        {inCart && (
                          <span className="bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {inCart.quantity}x
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {prod.description || prod.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {formatCurrency(prod.price, 'IDR')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">/{prod.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Cart & Checkout Summary (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between bg-white overflow-y-auto space-y-4">
            
            {/* Customer Picker */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-500">
                Pilih Pelanggan / Klien:
              </label>
              <select
                value={selectedClient?.id || 'CUSTOM'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'CUSTOM') {
                    setSelectedClient(null);
                  } else {
                    const c = clients.find((item) => item.id === val);
                    setSelectedClient(c || null);
                  }
                }}
                className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.attentionName})
                  </option>
                ))}
                <option value="CUSTOM">+ Pelanggan Umum / Manual</option>
              </select>

              {!selectedClient && (
                <input
                  type="text"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  placeholder="Ketik Nama Pelanggan Umum..."
                  className="w-full border border-slate-200 bg-white rounded px-2.5 py-1 text-xs focus:outline-none mt-1"
                />
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-[160px] max-h-[260px] border border-slate-100 rounded-xl p-2 bg-slate-50/40">
              <div className="text-[10px] font-bold uppercase text-slate-400 px-1">
                Keranjang Transaksi ({cart.length} Item):
              </div>
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-6 h-6 mx-auto mb-1 opacity-30" />
                  Belum ada item dipilih. Klik produk di sebelah kiri untuk menambahkan.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.product.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {formatCurrency(item.product.price, 'IDR')} / {item.product.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-mono font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right font-mono font-bold text-slate-900 w-24">
                      {formatCurrency(item.quantity * item.product.price, 'IDR')}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-300 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method & Tax */}
            <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'TRANSFER', label: 'Transfer', icon: <CreditCard className="w-3.5 h-3.5" /> },
                    { id: 'CASH', label: 'Tunai', icon: <Banknote className="w-3.5 h-3.5" /> },
                    { id: 'QRIS', label: 'QRIS', icon: <QrCode className="w-3.5 h-3.5" /> },
                    { id: 'TEMPO', label: 'Tempo 14H', icon: <Calendar className="w-3.5 h-3.5" /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-lg text-center font-bold flex flex-col items-center gap-1 border transition cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m.icon}
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tax PPN 11% Toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTax}
                    onChange={(e) => setIncludeTax(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                  Sertakan PPN 11%
                </label>
                <span className="font-mono text-slate-700 font-medium">
                  {formatCurrency(taxAmount, 'IDR')}
                </span>
              </div>

              {/* Calculations Box */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(subtotal, 'IDR')}</span>
                </div>
                <div className="flex justify-between text-base font-black pt-1 border-t border-slate-800 text-emerald-400">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="font-mono">{formatCurrency(grandTotal, 'IDR')}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => handleCheckout(false)}
                className={`w-full py-3 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
                  cart.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                Terbitkan Faktur Penjualan
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
