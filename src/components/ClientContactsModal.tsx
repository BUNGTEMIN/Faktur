import React, { useState } from 'react';
import { ClientProfile } from '../types';
import { Users, Plus, Trash2, Edit2, Search, X, Check, Building2, Phone, Mail, MapPin } from 'lucide-react';

interface ClientContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientProfile[];
  onAddClient: (client: Omit<ClientProfile, 'id'>) => void;
  onUpdateClient: (client: ClientProfile) => void;
  onDeleteClient: (id: string) => void;
}

export const ClientContactsModal: React.FC<ClientContactsModalProps> = ({
  isOpen,
  onClose,
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [search, setSearch] = useState('');
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formCompany, setFormCompany] = useState('');
  const [formAttention, setFormAttention] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPostal, setFormPostal] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNpwp, setFormNpwp] = useState('');

  if (!isOpen) return null;

  const startCreate = () => {
    setEditingClient(null);
    setFormCompany('');
    setFormAttention('');
    setFormRole('');
    setFormAddress('');
    setFormCity('');
    setFormPostal('');
    setFormPhone('');
    setFormEmail('');
    setFormNpwp('');
    setIsCreating(true);
  };

  const startEdit = (c: ClientProfile) => {
    setIsCreating(false);
    setEditingClient(c);
    setFormCompany(c.companyName);
    setFormAttention(c.attentionName);
    setFormRole(c.role);
    setFormAddress(c.address);
    setFormCity(c.city);
    setFormPostal(c.postalCode);
    setFormPhone(c.phone);
    setFormEmail(c.email);
    setFormNpwp(c.npwp || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim()) return;

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        companyName: formCompany,
        attentionName: formAttention,
        role: formRole,
        address: formAddress,
        city: formCity,
        postalCode: formPostal,
        phone: formPhone,
        email: formEmail,
        npwp: formNpwp,
      });
      setEditingClient(null);
    } else {
      onAddClient({
        companyName: formCompany,
        attentionName: formAttention,
        role: formRole,
        address: formAddress,
        city: formCity,
        postalCode: formPostal,
        phone: formPhone,
        email: formEmail,
        npwp: formNpwp,
      });
      setIsCreating(false);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.attentionName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-extrabold text-base">Buku Kontak & Master Pelanggan</h3>
              <p className="text-xs text-slate-300">Simpan profil dan kontak klien untuk pengisian faktur cepat.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama perusahaan klien, PIC, nomor telp, email..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-sky-500 focus:outline-none"
              />
            </div>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Pelanggan
            </button>
          </div>

          {/* Form when creating/editing */}
          {(isCreating || editingClient) && (
            <form onSubmit={handleSave} className="bg-slate-50 border border-sky-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-extrabold text-sky-900 uppercase">
                {editingClient ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Perusahaan / Organisasi</label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full font-bold border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="PT / CV / Instansi / Nama Klien"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama PIC (u.p.)</label>
                  <input
                    type="text"
                    required
                    value={formAttention}
                    onChange={(e) => setFormAttention(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="Bpk / Ibu / Nama Penanggung Jawab"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Jabatan PIC</label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="Procurement Manager / Direktur"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Alamat Kantor</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="Gedung, Jalan, No."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Kota & Kodepos</label>
                  <div className="flex gap-2 mt-0.5">
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-2/3 border border-slate-200 bg-white rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                      placeholder="Kota"
                    />
                    <input
                      type="text"
                      value={formPostal}
                      onChange={(e) => setFormPostal(e.target.value)}
                      className="w-1/3 border border-slate-200 bg-white rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                      placeholder="Kodepos"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">NPWP Klien</label>
                  <input
                    type="text"
                    value={formNpwp}
                    onChange={(e) => setFormNpwp(e.target.value)}
                    className="w-full font-mono border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="00.000.000.0-000.000"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="+62 8..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="finance@klien.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingClient(null);
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
                  Simpan Kontak
                </button>
              </div>
            </form>
          )}

          {/* Clients List Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.length === 0 ? (
              <div className="sm:col-span-2 py-8 text-center text-slate-400 text-xs">
                Tidak ada data pelanggan ditemukan.
              </div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 space-y-2 shadow-2xs transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="font-extrabold text-slate-900 text-sm">
                      {c.companyName}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => c.id && onDeleteClient(c.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 font-medium">
                    u.p. {c.attentionName} <span className="text-slate-500 font-normal">({c.role})</span>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{c.address}, {c.city}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {c.phone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {c.email}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Total {clients.length} pelanggan tersimpan</span>
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
