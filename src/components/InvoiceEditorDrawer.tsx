import React from 'react';
import { InvoiceData, InvoiceItem, PaymentStatus } from '../types';
import { Plus, Trash2, X, RefreshCw } from 'lucide-react';
import { itServiceInvoice, creativeAgencyInvoice } from '../data/defaultInvoiceData';

interface InvoiceEditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData;
  onChange: (updated: InvoiceData) => void;
  onReset: (preset: InvoiceData) => void;
}

export const InvoiceEditorDrawer: React.FC<InvoiceEditorDrawerProps> = ({
  isOpen,
  onClose,
  data,
  onChange,
  onReset,
}) => {
  if (!isOpen) return null;

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...data.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    onChange({ ...data, items: updatedItems });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: 'Item / Jasa Baru',
      quantity: 1,
      unit: 'Unit',
      unitPrice: 1000000,
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    if (data.items.length <= 1) return;
    const updatedItems = data.items.filter((_, idx) => idx !== index);
    onChange({ ...data, items: updatedItems });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 no-print animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
        <div>
          <h2 className="text-sm font-bold tracking-tight">Kustomisasi & Edit Faktur</h2>
          <p className="text-xs text-slate-400">Edit data langsung untuk melihat pratinjau live</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Tutup Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-slate-700">
        {/* Preset Selector */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className="font-bold text-slate-800 block mb-2">Pilih Data Sampel Cepat (Preset):</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onReset(itServiceInvoice)}
              className="py-1.5 px-2.5 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-400 text-left transition-colors"
            >
              💻 IT & Cloud Solutions
            </button>
            <button
              onClick={() => onReset(creativeAgencyInvoice)}
              className="py-1.5 px-2.5 bg-white border border-slate-300 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-400 text-left transition-colors"
            >
              🎨 Creative & UI/UX Studio
            </button>
          </div>
        </div>

        {/* 1. Status & Metadata */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
            1. Metadata & Status
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Status Pembayaran</label>
              <select
                value={data.paymentStatus}
                onChange={(e) => onChange({ ...data, paymentStatus: e.target.value as PaymentStatus })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-semibold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="PAID">LUNAS / PAID</option>
                <option value="UNPAID">MENUNGGU PEMBAYARAN</option>
                <option value="PARTIAL">DIBAYAR SEBAGIAN</option>
                <option value="OVERDUE">JATUH TEMPO / OVERDUE</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Nomor Faktur</label>
              <input
                type="text"
                value={data.invoiceNumber}
                onChange={(e) => onChange({ ...data, invoiceNumber: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Tanggal Terbit</label>
              <input
                type="text"
                value={data.issueDate}
                onChange={(e) => onChange({ ...data, issueDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="text"
                value={data.dueDate}
                onChange={(e) => onChange({ ...data, dueDate: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div className="col-span-2">
              <label className="font-semibold block mb-1">No. Purchase Order (PO Ref)</label>
              <input
                type="text"
                value={data.poNumber || ''}
                onChange={(e) => onChange({ ...data, poNumber: e.target.value })}
                placeholder="Contoh: PO-GMP/2026/08/110"
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. Biller Info */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
            2. Penerbit Faktur (Biller)
          </h3>
          <div>
            <label className="font-semibold block mb-1">Nama Perusahaan</label>
            <input
              type="text"
              value={data.biller.name}
              onChange={(e) => onChange({ ...data, biller: { ...data.biller, name: e.target.value } })}
              className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Tagline / Bidang Usaha</label>
            <input
              type="text"
              value={data.biller.tagline}
              onChange={(e) => onChange({ ...data, biller: { ...data.biller, tagline: e.target.value } })}
              className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">Alamat Kantor</label>
            <textarea
              rows={2}
              value={data.biller.address}
              onChange={(e) => onChange({ ...data, biller: { ...data.biller, address: e.target.value } })}
              className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Kota & Kode Pos</label>
              <input
                type="text"
                value={`${data.biller.city} ${data.biller.postalCode}`}
                onChange={(e) => {
                  const parts = e.target.value.split(' ');
                  const postal = parts.pop() || '';
                  const city = parts.join(' ');
                  onChange({ ...data, biller: { ...data.biller, city, postalCode: postal } });
                }}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Nomor NPWP</label>
              <input
                type="text"
                value={data.biller.npwp}
                onChange={(e) => onChange({ ...data, biller: { ...data.biller, npwp: e.target.value } })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 3. Client Info */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
            3. Ditagihkan Kepada (Klien)
          </h3>
          <div>
            <label className="font-semibold block mb-1">Nama Perusahaan Klien</label>
            <input
              type="text"
              value={data.client.companyName}
              onChange={(e) => onChange({ ...data, client: { ...data.client, companyName: e.target.value } })}
              className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Up: Nama Kontak</label>
              <input
                type="text"
                value={data.client.attentionName}
                onChange={(e) => onChange({ ...data, client: { ...data.client, attentionName: e.target.value } })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Jabatan Kontak</label>
              <input
                type="text"
                value={data.client.role}
                onChange={(e) => onChange({ ...data, client: { ...data.client, role: e.target.value } })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>
          <div>
            <label className="font-semibold block mb-1">Alamat Klien</label>
            <input
              type="text"
              value={data.client.address}
              onChange={(e) => onChange({ ...data, client: { ...data.client, address: e.target.value } })}
              className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* 4. Rincian Barang / Jasa */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              4. Rincian Item / Jasa ({data.items.length})
            </h3>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 bg-sky-600 text-white px-2 py-1 rounded text-[11px] font-semibold hover:bg-sky-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris
            </button>
          </div>

          <div className="space-y-3">
            {data.items.map((item, idx) => (
              <div key={item.id || idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 text-[11px]">Item #{idx + 1}</span>
                  {data.items.length > 1 && (
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-600 hover:text-rose-800 p-1 transition-colors"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    placeholder="Deskripsi barang / jasa..."
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Kuantitas</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-center font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Satuan</label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      placeholder="Paket/Bln/Unit"
                      className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-center focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">Harga Satuan (Rp)</label>
                    <input
                      type="number"
                      step="100000"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-right font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Pajak, Diskon & Meterai */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
            5. Diskon, Pajak & Meterai
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold block mb-1">Diskon (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={data.discountPercent}
                onChange={(e) => onChange({ ...data, discountPercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs text-center font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">PPN (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={data.taxPercent}
                onChange={(e) => onChange({ ...data, taxPercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs text-center font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Bea Meterai (Rp)</label>
              <input
                type="number"
                step="10000"
                value={data.stampDuty}
                onChange={(e) => onChange({ ...data, stampDuty: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs text-right font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 6. Pengesahan & Stempel */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-1 border-b border-slate-200">
            6. Penandatangan & Stempel
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Nama Penandatangan</label>
              <input
                type="text"
                value={data.signeeName}
                onChange={(e) => onChange({ ...data, signeeName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs font-bold focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Jabatan</label>
              <input
                type="text"
                value={data.signeeTitle}
                onChange={(e) => onChange({ ...data, signeeTitle: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Kota Penandatanganan</label>
              <input
                type="text"
                value={data.signeeCity}
                onChange={(e) => onChange({ ...data, signeeCity: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.hasStamp}
                  onChange={(e) => onChange({ ...data, hasStamp: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span className="font-semibold text-slate-800">Tampilkan Stempel Digital</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-900 text-white rounded-md font-semibold text-xs hover:bg-slate-800 transition-colors"
        >
          Selesai Mengedit & Simpan Tampilan
        </button>
      </div>
    </div>
  );
};
