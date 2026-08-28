import React from 'react';
import { InvoiceData } from '../types';
import { calculateInvoiceTotals, formatCurrency, terbilang } from '../utils/numberToWords';
import { Building2, Mail, Phone, Globe, CheckCircle2, Clock, AlertCircle, FileEdit, ShieldCheck } from 'lucide-react';

interface InvoiceDocumentProps {
  data: InvoiceData;
  scale?: number;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ data, scale = 1 }) => {
  const { subtotal, discountAmount, taxableAmount, taxAmount, shipping, stamp, grandTotal } = calculateInvoiceTotals({
    items: data.items,
    discountPercent: data.discountPercent,
    taxPercent: data.taxPercent,
    stampDuty: data.stampDuty,
    shippingFee: data.shippingFee,
  });

  const terbilangText = terbilang(grandTotal, data.currency || 'IDR');

  const getStatusBadge = () => {
    switch (data.paymentStatus) {
      case 'PAID':
        return (
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>LUNAS / PAID</span>
          </div>
        );
      case 'UNPAID':
        return (
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>BELUM LUNAS / UNPAID</span>
          </div>
        );
      case 'PARTIAL':
        return (
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>DIBAYAR SEBAGIAN</span>
          </div>
        );
      case 'OVERDUE':
        return (
          <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-900 border border-rose-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>JATUH TEMPO / OVERDUE</span>
          </div>
        );
      case 'DRAFT':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <FileEdit className="w-3.5 h-3.5 text-slate-500" />
            <span>DRAF / DRAFT</span>
          </div>
        );
    }
  };

  return (
    <div 
      className="print-container transition-transform duration-200 origin-top mx-auto"
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
      }}
    >
      <div 
        id="printable-invoice"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 mx-auto p-8 sm:p-10 md:p-12 shadow-xl rounded-sm sm:rounded-md border border-slate-200 relative flex flex-col justify-between"
        style={{ boxSizing: 'border-box' }}
      >
        {/* TOP SECTION */}
        <div>
          {/* 1. HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-5 border-b-2 border-slate-900 gap-4">
            {/* Company Info */}
            <div className="max-w-xl">
              <div className="flex items-center gap-3.5 mb-2">
                {data.biller.logoUrl ? (
                  <img
                    src={data.biller.logoUrl}
                    alt="Logo"
                    className="max-h-12 max-w-28 object-contain rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-sky-400 shadow-xs flex-shrink-0">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    {data.biller.name}
                  </h1>
                  {data.biller.tagline && (
                    <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
                      {data.biller.tagline}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-1">
                {data.biller.address}, {data.biller.city} {data.biller.postalCode}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {data.biller.phone}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {data.biller.email}
                </span>
                {data.biller.website && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      {data.biller.website}
                    </span>
                  </>
                )}
              </div>
              <div className="mt-1.5 text-xs font-semibold text-slate-800">
                NPWP Perusahaan: <span className="font-mono">{data.biller.npwp}</span>
              </div>
            </div>

            {/* Document Title & Badge */}
            <div className="text-left sm:text-right flex flex-col sm:items-end">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
                FAKTUR
              </h2>
              <span className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-1">
                COMMERCIAL INVOICE
              </span>
              <div className="mt-3">
                {getStatusBadge()}
              </div>
            </div>
          </div>

          {/* 2. METADATA STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-md p-3.5 my-5">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Nomor Faktur
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {data.invoiceNumber}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tanggal Terbit
              </div>
              <div className="text-xs font-semibold text-slate-900 mt-0.5">
                {data.issueDate}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Jatuh Tempo
              </div>
              <div className="text-xs font-bold text-rose-700 mt-0.5">
                {data.dueDate}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                No. PO / Ref Klien
              </div>
              <div className="text-xs font-semibold text-slate-900 font-mono mt-0.5">
                {data.poNumber || '-'}
              </div>
            </div>
          </div>

          {/* 3. BILLED TO (CLIENT DETAILS) */}
          <div className="bg-white border border-slate-200 rounded-md p-4 mb-5">
            <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1">
              DITAGIHKAN KEPADA (BILL TO):
            </div>
            <div className="text-base font-bold text-slate-900">
              {data.client.companyName}
            </div>
            <div className="text-xs text-slate-700 mt-0.5">
              <span className="font-semibold">u.p.</span> {data.client.attentionName}{' '}
              {data.client.role && <span className="text-slate-500">({data.client.role})</span>}
            </div>
            <div className="text-xs text-slate-600 mt-1 leading-relaxed">
              {data.client.address}, {data.client.city} {data.client.postalCode}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-slate-600 mt-1">
              <span><strong>Telp:</strong> {data.client.phone}</span>
              <span>•</span>
              <span><strong>Email:</strong> {data.client.email}</span>
              {data.client.npwp && (
                <>
                  <span>•</span>
                  <span><strong>NPWP:</strong> <span className="font-mono">{data.client.npwp}</span></span>
                </>
              )}
            </div>
          </div>

          {/* 4. ITEMS TABLE */}
          <div className="overflow-hidden border border-slate-200 rounded-md mb-5">
            <table className="w-full text-left border-collapse invoice-table">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-center w-12 !bg-slate-900 !text-white !border-slate-900">No</th>
                  <th className="py-2.5 px-3 !bg-slate-900 !text-white !border-slate-900">Deskripsi Barang / Layanan</th>
                  <th className="py-2.5 px-3 text-center w-24 !bg-slate-900 !text-white !border-slate-900">Kuantitas</th>
                  <th className="py-2.5 px-3 text-right w-36 !bg-slate-900 !text-white !border-slate-900">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right w-40 !bg-slate-900 !text-white !border-slate-900">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.items.map((item, index) => {
                  const itemDiscount = item.discountPercent ? (item.quantity * item.unitPrice * item.discountPercent) / 100 : 0;
                  const itemTotal = item.quantity * item.unitPrice - itemDiscount;

                  return (
                    <tr key={item.id || index} className={index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">
                          {item.description}
                        </div>
                        {item.discountPercent ? (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Diskon item: {item.discountPercent}%
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 font-mono">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-mono">
                        {formatCurrency(item.unitPrice, data.currency)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(itemTotal, data.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 5. TOTALS CALCULATION */}
          <div className="flex justify-end mb-5">
            <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(subtotal, data.currency)}
                </span>
              </div>

              {data.discountPercent > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-medium">
                  <span>Diskon Tambahan ({data.discountPercent}%):</span>
                  <span className="font-mono">
                    -{formatCurrency(discountAmount, data.currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-slate-200 border-dashed">
                <span>Dasar Pengenaan Pajak (DPP):</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(taxableAmount, data.currency)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>PPN ({data.taxPercent}%):</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(taxAmount, data.currency)}
                </span>
              </div>

              {shipping > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Biaya Pengiriman / Jasa:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatCurrency(shipping, data.currency)}
                  </span>
                </div>
              )}

              {stamp > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Bea Meterai:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatCurrency(stamp, data.currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>TOTAL AKHIR:</span>
                <span className="font-mono text-sky-700 text-base">
                  {formatCurrency(grandTotal, data.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. TERBILANG BOX */}
          <div className="bg-slate-100/80 border-l-4 border-sky-600 p-3 rounded-r-md mb-6">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
              TERBILANG :
            </div>
            <div className="text-xs font-semibold italic text-slate-800 mt-0.5">
              # {terbilangText} #
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: PAYMENT, TERMS, SIGNATURE */}
        <div className="border-t border-slate-200 pt-4 mt-auto">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            {/* Left: Bank Accounts & Terms (7 Cols) */}
            <div className="sm:col-span-7 space-y-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Instruksi Pembayaran & Rekening Resmi:
                </div>
                <div className="space-y-1.5">
                  {data.bankAccounts.map((bank, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 text-xs">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                        {bank.bankName} {bank.branch && <span className="font-normal text-slate-500 lowercase">({bank.branch})</span>}
                      </div>
                      <div className="font-mono font-bold text-sky-700 text-sm tracking-wider">
                        {bank.accountNumber}
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        a/n {bank.accountHolder}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  {data.paymentInstructions}
                </p>
              </div>

              {data.terms && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-1">
                    Syarat & Ketentuan:
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                    {data.terms}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Notes & Signature (5 Cols) */}
            <div className="sm:col-span-5 flex flex-col justify-between">
              {data.notes ? (
                <div className="mb-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-1">
                    Catatan:
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-600 leading-relaxed">
                    {data.notes}
                  </div>
                </div>
              ) : <div></div>}

              {/* Signature Box */}
              <div className="text-center pt-2">
                <div className="text-xs text-slate-600">
                  {data.signeeCity}, {data.signDate}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {data.biller.name}
                </div>

                {/* Meterai / Stamp space */}
                <div className="h-16 flex items-center justify-center my-1.5">
                  {data.hasStamp ? (
                    <div className="border border-dashed border-slate-300 rounded p-1.5 bg-slate-50/70 text-slate-500 text-[9px] leading-tight flex items-center gap-1 shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      <div className="text-left">
                        <span className="font-bold">METERAI ELEKTRONIK</span>
                        <div className="font-mono text-slate-700 font-semibold">Rp 10.000</div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="text-xs font-bold text-slate-900 underline underline-offset-2">
                  {data.signeeName}
                </div>
                <div className="text-[11px] text-slate-500">
                  {data.signeeTitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
