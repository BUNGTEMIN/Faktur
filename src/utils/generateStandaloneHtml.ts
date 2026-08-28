import { InvoiceData } from '../types';
import { formatCurrency, formatNumber, terbilang, calculateInvoiceTotals } from './numberToWords';

export function generateStandaloneHtml(data: InvoiceData): string {
  const { subtotal, discountAmount, taxableAmount, taxAmount, shipping, stamp, grandTotal } = calculateInvoiceTotals({
    items: data.items,
    discountPercent: data.discountPercent,
    taxPercent: data.taxPercent,
    stampDuty: data.stampDuty,
    shippingFee: data.shippingFee,
  });

  const terbilangText = terbilang(grandTotal, data.currency || 'IDR');

  const statusColors = {
    PAID: {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      text: '#065f46',
      label: 'LUNAS / PAID',
    },
    UNPAID: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      label: 'BELUM LUNAS / UNPAID',
    },
    PARTIAL: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      label: 'DIBAYAR SEBAGIAN',
    },
    OVERDUE: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      label: 'JATUH TEMPO / OVERDUE',
    },
    DRAFT: {
      bg: '#f8fafc',
      border: '#cbd5e1',
      text: '#475569',
      label: 'DRAF / DRAFT',
    },
  };

  const status = statusColors[data.paymentStatus] || statusColors.UNPAID;

  const itemRows = data.items
    .map(
      (item, idx) => {
        const itemDiscount = item.discountPercent ? (item.quantity * item.unitPrice * item.discountPercent) / 100 : 0;
        const itemTotal = item.quantity * item.unitPrice - itemDiscount;
        return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; text-align: center; color: #64748b; font-size: 13px;">${idx + 1}</td>
          <td style="padding: 10px 12px; font-weight: 500; color: #1e293b; font-size: 13px;">
            <div>${item.description}</div>
            ${item.discountPercent ? `<div style="font-size: 11px; color: #059669;">Diskon item: ${item.discountPercent}%</div>` : ''}
          </td>
          <td style="padding: 10px 12px; text-align: center; color: #334155; font-size: 13px; font-family: monospace;">${item.quantity} ${item.unit}</td>
          <td style="padding: 10px 12px; text-align: right; color: #334155; font-size: 13px; font-family: monospace;">${formatCurrency(item.unitPrice, data.currency)}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #0f172a; font-size: 13px; font-family: monospace;">${formatCurrency(itemTotal, data.currency)}</td>
        </tr>`;
      }
    )
    .join('');

  const bankList = data.bankAccounts
    .map(
      (bank) => `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${bank.bankName} ${bank.branch ? `<span style="font-weight: 400; color: #64748b; text-transform: none;">(${bank.branch})</span>` : ''}</div>
          <div style="font-size: 14px; font-weight: 700; color: #0284c7; font-family: monospace; letter-spacing: 0.5px; margin: 2px 0;">${bank.accountNumber}</div>
          <div style="font-size: 11px; color: #475569;">a/n ${bank.accountHolder}</div>
        </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faktur - ${data.invoiceNumber} - ${data.biller.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" crossorigin="anonymous">
  <style>
    /* Reset & Base Setup */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding: 24px 12px;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }

    /* Print & Paper Dimensions */
    .invoice-wrapper {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 36px 42px;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
      box-sizing: border-box;
      position: relative;
    }

    /* Top Action Bar (Non-Printable) */
    .no-print-bar {
      max-width: 210mm;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
    }

    .btn-print {
      background-color: #0284c7;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background-color 0.2s;
    }

    .btn-print:hover {
      background-color: #0369a1;
    }

    /* Standard Print Media Queries */
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }

    @media print {
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
      }
      .no-print-bar {
        display: none !important;
      }
      .invoice-wrapper {
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        min-height: auto !important;
      }
      tr, td, th {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>

  <!-- Non-Printable Header Utility Bar -->
  <div class="no-print-bar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: 700; font-size: 15px; letter-spacing: -0.2px;">Dokumen Faktur Penjualan</span>
      <span style="font-size: 12px; background: #334155; padding: 2px 8px; border-radius: 4px; color: #94a3b8;">Format Standar A4</span>
    </div>
    <button class="btn-print" onclick="window.print()">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
      </svg>
      Cetak / Simpan PDF
    </button>
  </div>

  <!-- Main Invoice Document -->
  <div class="invoice-wrapper" id="invoice">
    
    <!-- Header: Company Info & Invoice Badge -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px;">
      <div style="max-width: 60%;">
        ${data.biller.logoUrl ? `<img src="${data.biller.logoUrl}" alt="Logo" style="max-height: 50px; margin-bottom: 8px; object-fit: contain;" />` : ''}
        <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">${data.biller.name}</h1>
        <p style="font-size: 12px; color: #0284c7; font-weight: 600; margin-top: 2px;">${data.biller.tagline}</p>
        <p style="font-size: 11px; color: #475569; margin-top: 6px; line-height: 1.4;">${data.biller.address}, ${data.biller.city} ${data.biller.postalCode}</p>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; color: #475569; margin-top: 4px;">
          <span><strong>Telp:</strong> ${data.biller.phone}</span>
          <span><strong>Email:</strong> ${data.biller.email}</span>
          <span><strong>Web:</strong> ${data.biller.website}</span>
        </div>
        <div style="font-size: 11px; color: #0f172a; margin-top: 4px; font-weight: 600;">
          <strong>NPWP Perusahaan:</strong> <span class="font-mono">${data.biller.npwp}</span>
        </div>
      </div>

      <div style="text-align: right;">
        <div style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">FAKTUR</div>
        <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-top: -4px; letter-spacing: 1px;">COMMERCIAL INVOICE</div>
        
        <div style="margin-top: 12px; display: inline-block; padding: 4px 12px; border-radius: 6px; background-color: ${status.bg}; border: 1px solid ${status.border}; color: ${status.text}; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">
          ${status.label}
        </div>
      </div>
    </div>

    <!-- Metadata Strip: Nomor Faktur, Tanggal, PO, Jatuh Tempo -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 20px; gap: 12px;">
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Nomor Faktur</div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;" class="font-mono">${data.invoiceNumber}</div>
      </div>
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Tanggal Penerbitan</div>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px;">${data.issueDate}</div>
      </div>
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Jatuh Tempo</div>
        <div style="font-size: 12px; font-weight: 700; color: #dc2626; margin-top: 2px;">${data.dueDate}</div>
      </div>
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">No. PO / Ref Klien</div>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px;" class="font-mono">${data.poNumber || '-'}</div>
      </div>
    </div>

    <!-- Billed To Section -->
    <div style="margin-bottom: 20px; padding: 14px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
      <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">DITAGIHKAN KEPADA (BILL TO):</div>
      <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${data.client.companyName}</div>
      <div style="font-size: 12px; color: #334155; margin-top: 2px;">
        <strong>u.p.</strong> ${data.client.attentionName} <span style="color: #64748b;">(${data.client.role})</span>
      </div>
      <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">${data.client.address}, ${data.client.city} ${data.client.postalCode}</div>
      <div style="display: flex; gap: 16px; font-size: 11px; color: #475569; margin-top: 4px;">
        <span><strong>Kontak:</strong> ${data.client.phone}</span>
        <span><strong>Email:</strong> ${data.client.email}</span>
        ${data.client.npwp ? `<span><strong>NPWP:</strong> <span class="font-mono">${data.client.npwp}</span></span>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="background-color: #0f172a; color: #ffffff;">
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: center; width: 5%;">No</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: left; width: 45%;">Deskripsi Pekerjaan / Layanan</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: center; width: 15%;">Kuantitas</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: right; width: 17%;">Harga Satuan</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: right; width: 18%;">Jumlah Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Calculation & Summary Section -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
      <div style="width: 320px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 6px;">
          <span>Subtotal:</span>
          <span class="font-mono" style="font-weight: 600; color: #0f172a;">${formatCurrency(subtotal, data.currency)}</span>
        </div>
        
        ${data.discountPercent > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #059669; margin-bottom: 6px;">
          <span>Diskon (${data.discountPercent}%):</span>
          <span class="font-mono" style="font-weight: 600;">-${formatCurrency(discountAmount, data.currency)}</span>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 6px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
          <span>Dasar Pengenaan Pajak (DPP):</span>
          <span class="font-mono" style="font-weight: 600; color: #0f172a;">${formatCurrency(taxableAmount, data.currency)}</span>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 6px;">
          <span>PPN (${data.taxPercent}%):</span>
          <span class="font-mono" style="font-weight: 600; color: #0f172a;">${formatCurrency(taxAmount, data.currency)}</span>
        </div>

        ${shipping > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 6px;">
          <span>Biaya Pengiriman:</span>
          <span class="font-mono" style="font-weight: 600; color: #0f172a;">${formatCurrency(shipping, data.currency)}</span>
        </div>
        ` : ''}

        ${stamp > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #475569; margin-bottom: 8px;">
          <span>Bea Meterai:</span>
          <span class="font-mono" style="font-weight: 600; color: #0f172a;">${formatCurrency(stamp, data.currency)}</span>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; padding-top: 8px; border-top: 2px solid #0f172a;">
          <span>TOTAL AKHIR:</span>
          <span class="font-mono" style="color: #0284c7;">${formatCurrency(grandTotal, data.currency)}</span>
        </div>
      </div>
    </div>

    <!-- Terbilang Box -->
    <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 10px 14px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
      <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase;">TERBILANG :</div>
      <div style="font-size: 12px; font-style: italic; font-weight: 600; color: #1e293b; margin-top: 2px;"># ${terbilangText} #</div>
    </div>

    <!-- Payment, Notes & Signature Grid -->
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
      
      <!-- Left Column: Bank Accounts & Terms -->
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px;">Instruksi Pembayaran & Rekening Resmi:</div>
        ${bankList}
        <div style="font-size: 10px; color: #64748b; line-height: 1.4; margin-top: 8px;">${data.paymentInstructions}</div>

        <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-top: 14px; margin-bottom: 4px;">Syarat & Ketentuan:</div>
        <div style="font-size: 10px; color: #475569; line-height: 1.4; white-space: pre-line;">${data.terms}</div>
      </div>

      <!-- Right Column: Notes & Signatures -->
      <div style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">Catatan Tambahan:</div>
          <div style="font-size: 10px; color: #475569; line-height: 1.4; background-color: #fafafa; border: 1px solid #f1f5f9; padding: 8px; border-radius: 4px;">
            ${data.notes}
          </div>
        </div>

        <!-- Authorized Signature -->
        <div style="text-align: center; margin-top: 20px;">
          <div style="font-size: 11px; color: #475569;">${data.signeeCity}, ${data.signDate}</div>
          <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px;">${data.biller.name}</div>

          <!-- Stamp / Meterai Placeholder -->
          <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin: 6px 0;">
            ${data.hasStamp ? `
            <div style="border: 1px dashed #94a3b8; border-radius: 4px; padding: 4px 8px; font-size: 9px; color: #64748b; background-color: #f8fafc;">
              METERAI ELEKTRONIK<br><strong>Rp 10.000</strong>
            </div>
            ` : ''}
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #0f172a; text-decoration: underline;">${data.signeeName}</div>
          <div style="font-size: 11px; color: #64748b;">${data.signeeTitle}</div>
        </div>

      </div>

    </div>

  </div>

</body>
</html>`;
}
