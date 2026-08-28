import React, { useMemo } from 'react';
import { InvoiceData, ProductItem } from '../types';
import { calculateInvoiceTotals, formatCurrency } from '../utils/numberToWords';
import { 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  Package, 
  Download, 
  ShoppingCart, 
  FileText,
  ArrowUpRight,
  PieChart,
  BarChart3
} from 'lucide-react';

interface SalesDashboardProps {
  invoices: InvoiceData[];
  products: ProductItem[];
  onOpenNewInvoice: () => void;
  onOpenPos: () => void;
  onExportSalesCSV: () => void;
  onSelectInvoice: (id: string) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  invoices,
  products,
  onOpenNewInvoice,
  onOpenPos,
  onExportSalesCSV,
  onSelectInvoice,
}) => {
  // Comprehensive Sales Calculations
  const metrics = useMemo(() => {
    let totalGrossSales = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;
    let totalTaxCollected = 0;
    let totalDiscountGiven = 0;

    const clientSalesMap: Record<string, { companyName: string; total: number; count: number; paid: number }> = {};
    const productSalesMap: Record<string, { name: string; totalAmount: number; quantity: number }> = {};

    invoices.forEach((inv) => {
      const { grandTotal, taxAmount, discountAmount } = calculateInvoiceTotals({
        items: inv.items,
        discountPercent: inv.discountPercent,
        taxPercent: inv.taxPercent,
        stampDuty: inv.stampDuty,
        shippingFee: inv.shippingFee,
      });

      totalGrossSales += grandTotal;
      totalTaxCollected += taxAmount;
      totalDiscountGiven += discountAmount;

      if (inv.paymentStatus === 'PAID') {
        totalPaid += grandTotal;
      } else if (inv.paymentStatus === 'UNPAID') {
        totalUnpaid += grandTotal;
      } else if (inv.paymentStatus === 'OVERDUE') {
        totalOverdue += grandTotal;
      }

      // Group by client
      const cName = inv.client.companyName || 'Klien Umum';
      if (!clientSalesMap[cName]) {
        clientSalesMap[cName] = { companyName: cName, total: 0, count: 0, paid: 0 };
      }
      clientSalesMap[cName].total += grandTotal;
      clientSalesMap[cName].count += 1;
      if (inv.paymentStatus === 'PAID') {
        clientSalesMap[cName].paid += grandTotal;
      }

      // Group by product line items
      inv.items.forEach((item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const pDesc = item.description.split('(')[0].trim() || 'Item Lainnya';
        if (!productSalesMap[pDesc]) {
          productSalesMap[pDesc] = { name: pDesc, totalAmount: 0, quantity: 0 };
        }
        productSalesMap[pDesc].totalAmount += itemTotal;
        productSalesMap[pDesc].quantity += item.quantity;
      });
    });

    const topClients = Object.values(clientSalesMap).sort((a, b) => b.total - a.total).slice(0, 5);
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);
    const avgOrderValue = invoices.length > 0 ? totalGrossSales / invoices.length : 0;
    const paidRatio = totalGrossSales > 0 ? (totalPaid / totalGrossSales) * 100 : 0;

    return {
      totalGrossSales,
      totalPaid,
      totalUnpaid,
      totalOverdue,
      totalTaxCollected,
      totalDiscountGiven,
      avgOrderValue,
      paidRatio,
      topClients,
      topProducts,
      totalInvoicesCount: invoices.length,
    };
  }, [invoices]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Banner & Quick POS Launch */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold mb-3 border border-sky-400/30">
            <TrendingUp className="w-3.5 h-3.5" />
            Dashboard Penjualan & Keuangan
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ringkasan & Analitik Penjualan
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Pantau arus kas, realisasi pembayaran, tagihan piutang pelanggan, serta performa produk dan klien terlaris.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <button
            onClick={onOpenPos}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-extrabold transition shadow-lg cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            Kasir Penjualan Cepat (POS)
          </button>

          <button
            onClick={onExportSalesCSV}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh Laporan Penjualan (CSV)
          </button>
        </div>
      </div>

      {/* Main KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Penjualan Kotor</span>
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(metrics.totalGrossSales, 'IDR')}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>{metrics.totalInvoicesCount} Total Faktur</span>
            <span>Rata-rata: {formatCurrency(metrics.avgOrderValue, 'IDR')}</span>
          </div>
        </div>

        {/* Realized Revenue (Paid) */}
        <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Kas Masuk (Lunas)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {formatCurrency(metrics.totalPaid, 'IDR')}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center justify-between pt-1 border-t border-emerald-100">
            <span>Realisasi Kas:</span>
            <span className="font-bold font-mono">{metrics.paidRatio.toFixed(1)}% dari Omset</span>
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-amber-50/60 p-5 rounded-xl border border-amber-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Piutang Berjalan</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">
            {formatCurrency(metrics.totalUnpaid, 'IDR')}
          </div>
          <div className="text-[11px] text-amber-800 pt-1 border-t border-amber-100">
            Menunggu pelunasan dari klien
          </div>
        </div>

        {/* Overdue Alerts */}
        <div className="bg-rose-50/60 p-5 rounded-xl border border-rose-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-900">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Piutang Jatuh Tempo</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-950 font-mono">
            {formatCurrency(metrics.totalOverdue, 'IDR')}
          </div>
          <div className="text-[11px] text-rose-700 pt-1 border-t border-rose-100">
            Perlu pengiriman surat tagihan (SP)
          </div>
        </div>
      </div>

      {/* Breakdown Grid: Top Clients & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients by Revenue */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              Klien & Pelanggan Terbaik
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Berdasarkan Total Transaksi</span>
          </div>

          <div className="space-y-3">
            {metrics.topClients.map((client, idx) => {
              const share = metrics.totalGrossSales > 0 ? (client.total / metrics.totalGrossSales) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      {idx + 1}. {client.companyName}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(client.total, 'IDR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{client.count} Transaksi Faktur</span>
                    <span>{share.toFixed(1)}% Pangsa Penjualan</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, share))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products / Services Sold */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Produk & Layanan Terlaris
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Berdasarkan Volume Penjualan</span>
          </div>

          <div className="space-y-3">
            {metrics.topProducts.map((prod, idx) => {
              const share = metrics.totalGrossSales > 0 ? (prod.totalAmount / metrics.totalGrossSales) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 truncate max-w-[260px]">
                      {idx + 1}. {prod.name}
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(prod.totalAmount, 'IDR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Terjual: {prod.quantity} unit/paket</span>
                    <span>{share.toFixed(1)}% Kontribusi</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, share))}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Invoices Mini Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            Riwayat Transaksi Penjualan Terbaru
          </h3>
          <button
            onClick={onOpenNewInvoice}
            className="text-xs font-bold text-sky-600 hover:text-sky-800"
          >
            + Buat Faktur
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">
                <th className="pb-2">Faktur</th>
                <th className="pb-2">Pelanggan</th>
                <th className="pb-2">Tanggal</th>
                <th className="pb-2 text-right">Nilai Transaksi</th>
                <th className="pb-2 text-center">Status</th>
                <th className="pb-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.slice(0, 5).map((inv) => {
                const { grandTotal } = calculateInvoiceTotals({
                  items: inv.items,
                  discountPercent: inv.discountPercent,
                  taxPercent: inv.taxPercent,
                  stampDuty: inv.stampDuty,
                  shippingFee: inv.shippingFee,
                });
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-800">
                      {inv.client.companyName}
                    </td>
                    <td className="py-2.5 text-slate-500">{inv.issueDate}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(grandTotal, inv.currency)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'UNPAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <button
                        onClick={() => onSelectInvoice(inv.id)}
                        className="text-sky-600 hover:text-sky-800 font-bold text-xs"
                      >
                        Buka
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
