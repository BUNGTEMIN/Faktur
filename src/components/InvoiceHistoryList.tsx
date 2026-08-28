import React, { useState, useMemo } from 'react';
import { InvoiceData, PaymentStatus } from '../types';
import { calculateInvoiceTotals, formatCurrency } from '../utils/numberToWords';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileEdit, 
  Printer, 
  Edit3, 
  Copy, 
  Trash2, 
  Download, 
  Plus, 
  ArrowUpDown,
  ChevronRight,
  ExternalLink,
  Code,
  FileDown,
  Loader2,
  ShieldCheck,
  Cloud
} from 'lucide-react';
import { User } from '../lib/firebase';

interface InvoiceHistoryListProps {
  invoices: InvoiceData[];
  currentInvoiceId: string;
  onSelectInvoice: (id: string) => void;
  onNewInvoice: () => void;
  onDuplicateInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus: (id: string, status: PaymentStatus) => void;
  onExportSalesCSV: () => void;
  onExportHtml: (invoice: InvoiceData) => void;
  onPrintInvoice: (invoice: InvoiceData) => void;
  onDownloadPdf?: (invoice: InvoiceData) => void;
  currentUser?: User | null;
  onSignInWithGoogle?: () => void;
}

export const InvoiceHistoryList: React.FC<InvoiceHistoryListProps> = ({
  invoices,
  currentInvoiceId,
  onSelectInvoice,
  onNewInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  onUpdateStatus,
  onExportSalesCSV,
  onExportHtml,
  onPrintInvoice,
  onDownloadPdf,
  currentUser,
  onSignInWithGoogle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const handleDownloadPdfSingle = async (inv: InvoiceData) => {
    setDownloadingPdfId(inv.id);
    try {
      if (onDownloadPdf) {
        await onDownloadPdf(inv);
      } else {
        await downloadInvoicePDF(inv);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Filter & Search
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Status filter
        if (statusFilter !== 'ALL' && inv.paymentStatus !== statusFilter) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
          const matchClient = inv.client.companyName.toLowerCase().includes(q) || inv.client.attentionName.toLowerCase().includes(q);
          const matchItem = inv.items.some((item) => item.description.toLowerCase().includes(q));
          const matchPo = (inv.poNumber || '').toLowerCase().includes(q);
          if (!matchNumber && !matchClient && !matchItem && !matchPo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const totalA = calculateInvoiceTotals({
          items: a.items,
          discountPercent: a.discountPercent,
          taxPercent: a.taxPercent,
          stampDuty: a.stampDuty,
          shippingFee: a.shippingFee,
        }).grandTotal;

        const totalB = calculateInvoiceTotals({
          items: b.items,
          discountPercent: b.discountPercent,
          taxPercent: b.taxPercent,
          stampDuty: b.stampDuty,
          shippingFee: b.shippingFee,
        }).grandTotal;

        if (sortBy === 'date-desc') {
          return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        }
        if (sortBy === 'amount-desc') {
          return totalB - totalA;
        }
        if (sortBy === 'amount-asc') {
          return totalA - totalB;
        }
        return 0;
      });
  }, [invoices, statusFilter, searchQuery, sortBy]);

  // Totals for header summary
  const summary = useMemo(() => {
    let totalAll = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;

    invoices.forEach((inv) => {
      const val = calculateInvoiceTotals({
        items: inv.items,
        discountPercent: inv.discountPercent,
        taxPercent: inv.taxPercent,
        stampDuty: inv.stampDuty,
        shippingFee: inv.shippingFee,
      }).grandTotal;

      totalAll += val;
      if (inv.paymentStatus === 'PAID') totalPaid += val;
      if (inv.paymentStatus === 'UNPAID') totalUnpaid += val;
      if (inv.paymentStatus === 'OVERDUE') totalOverdue += val;
    });

    return { totalAll, totalPaid, totalUnpaid, totalOverdue, count: invoices.length };
  }, [invoices]);

  const getStatusBadge = (status: PaymentStatus, invId: string) => {
    const configs: Record<PaymentStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
      PAID: {
        label: 'Lunas',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
      },
      UNPAID: {
        label: 'Belum Lunas',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        icon: <Clock className="w-3 h-3 text-amber-600" />,
      },
      OVERDUE: {
        label: 'Jatuh Tempo',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        icon: <AlertCircle className="w-3 h-3 text-rose-600" />,
      },
      DRAFT: {
        label: 'Draf',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        icon: <FileEdit className="w-3 h-3 text-slate-500" />,
      },
      PARTIAL: {
        label: 'Sebagian',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: <Clock className="w-3 h-3 text-blue-600" />,
      },
    };

    const cfg = configs[status] || configs.UNPAID;

    return (
      <div className="relative group inline-block">
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} shadow-2xs`}>
          {cfg.icon}
          <span>{cfg.label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" />
              Riwayat & Database Faktur
            </h2>
            {currentUser ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Database Privat: {currentUser.email}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <Cloud className="w-3 h-3 text-slate-400" />
                Mode Tamu (Lokal)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola, cari, dan pantau status seluruh faktur dan transaksi penjualan yang telah diterbitkan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onExportSalesCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-300 cursor-pointer"
            title="Download Laporan Penjualan (Excel/CSV)"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Ekspor CSV Penjualan
          </button>

          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Buat Faktur Baru
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Faktur</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{summary.count}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-medium">{formatCurrency(summary.totalAll, 'IDR')}</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Terbayar (Lunas)
          </div>
          <div className="text-lg font-black text-emerald-900 mt-1 font-mono">{formatCurrency(summary.totalPaid, 'IDR')}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Kas Masuk Berhasil</div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Piutang Menunggu
          </div>
          <div className="text-lg font-black text-amber-900 mt-1 font-mono">{formatCurrency(summary.totalUnpaid, 'IDR')}</div>
          <div className="text-[11px] text-amber-800 mt-0.5">Menunggu Transfer</div>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Jatuh Tempo
          </div>
          <div className="text-lg font-black text-rose-900 mt-1 font-mono">{formatCurrency(summary.totalOverdue, 'IDR')}</div>
          <div className="text-[11px] text-rose-700 mt-0.5">Perlu Tindak Lanjut</div>
        </div>
      </div>

      {/* Filters, Search & Sort Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. faktur, nama klien, item produk, atau nomor PO..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:border-sky-500 focus:outline-none bg-slate-50 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
            >
              <option value="date-desc">Tanggal Terbit (Terbaru)</option>
              <option value="date-asc">Tanggal Terbit (Terlama)</option>
              <option value="amount-desc">Nilai Faktur Tertinggi</option>
              <option value="amount-asc">Nilai Faktur Terendah</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Status:</span>
          {(['ALL', 'PAID', 'UNPAID', 'OVERDUE', 'DRAFT'] as const).map((st) => {
            const count = st === 'ALL' ? invoices.length : invoices.filter((i) => i.paymentStatus === st).length;
            const labels: Record<string, string> = {
              ALL: 'Semua',
              PAID: 'Lunas',
              UNPAID: 'Belum Lunas',
              OVERDUE: 'Jatuh Tempo',
              DRAFT: 'Draf',
            };
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[st]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                <th className="py-3 px-4">No. Faktur & Tanggal</th>
                <th className="py-3 px-4">Klien / Pembeli</th>
                <th className="py-3 px-3 text-center">Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Nilai Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center w-44">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">Tidak ada faktur yang sesuai filter.</p>
                    <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau buat faktur baru.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const { grandTotal } = calculateInvoiceTotals({
                    items: inv.items,
                    discountPercent: inv.discountPercent,
                    taxPercent: inv.taxPercent,
                    stampDuty: inv.stampDuty,
                    shippingFee: inv.shippingFee,
                  });

                  const isCurrent = inv.id === currentInvoiceId;

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50 transition ${isCurrent ? 'bg-sky-50/40' : ''}`}
                    >
                      {/* Invoice Number & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          {inv.invoiceNumber}
                          {isCurrent && (
                            <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-sans font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Terbit: {inv.issueDate} {inv.poNumber ? `• PO: ${inv.poNumber}` : ''}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {inv.client.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          u.p. {inv.client.attentionName} ({inv.client.phone})
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-3 text-center">
                        <div className={`font-semibold ${inv.paymentStatus === 'OVERDUE' ? 'text-rose-700 font-bold' : 'text-slate-700'}`}>
                          {inv.dueDate}
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {formatCurrency(grandTotal, inv.currency)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {inv.items.length} item barang/jasa
                        </div>
                      </td>

                      {/* Status Dropdown/Selector */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={inv.paymentStatus}
                          onChange={(e) => onUpdateStatus(inv.id, e.target.value as PaymentStatus)}
                          className={`text-xs font-bold rounded-full px-2.5 py-1 border transition cursor-pointer ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : inv.paymentStatus === 'UNPAID'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : inv.paymentStatus === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="PAID">LUNAS</option>
                          <option value="UNPAID">BELUM LUNAS</option>
                          <option value="OVERDUE">JATUH TEMPO</option>
                          <option value="DRAFT">DRAF</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Select & Edit */}
                          <button
                            onClick={() => onSelectInvoice(inv.id)}
                            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded transition cursor-pointer"
                            title="Buka di Editor Faktur"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF Direct */}
                          <button
                            onClick={() => handleDownloadPdfSingle(inv)}
                            disabled={downloadingPdfId === inv.id}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 rounded transition cursor-pointer"
                            title="Unduh File PDF (A4)"
                          >
                            {downloadingPdfId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Print */}
                          <button
                            onClick={() => onPrintInvoice(inv)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                            title="Cetak via Printer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Export Standalone HTML */}
                          <button
                            onClick={() => onExportHtml(inv)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                            title="Unduh File HTML Mandiri"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => onDuplicateInvoice(inv.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                            title="Duplikat Faktur"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {deleteConfirmId === inv.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 p-1 rounded border border-rose-200">
                              <button
                                onClick={() => {
                                  onDeleteInvoice(inv.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="text-[10px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded hover:bg-rose-700"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[10px] text-slate-500 hover:text-slate-700 px-1"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Hapus Faktur"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
