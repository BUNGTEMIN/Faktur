/**
 * Mengubah angka menjadi kalimat terbilang Bahasa Indonesia.
 * Contoh: 41125500 -> "Empat Puluh Satu Juta Seratus Dua Puluh Lima Ribu Lima Ratus Rupiah"
 */
export function terbilang(nilai: number, currency: string = 'IDR'): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function hitung(n: number): string {
    const angka = Math.floor(Math.abs(n));
    if (angka < 12) {
      return bilangan[angka];
    } else if (angka < 20) {
      return hitung(angka - 10) + ' Belas';
    } else if (angka < 100) {
      return hitung(Math.floor(angka / 10)) + ' Puluh ' + hitung(angka % 10);
    } else if (angka < 200) {
      return 'Seratus ' + hitung(angka - 100);
    } else if (angka < 1000) {
      return hitung(Math.floor(angka / 100)) + ' Ratus ' + hitung(angka % 100);
    } else if (angka < 2000) {
      return 'Seribu ' + hitung(angka - 1000);
    } else if (angka < 1000000) {
      return hitung(Math.floor(angka / 1000)) + ' Ribu ' + hitung(angka % 1000);
    } else if (angka < 1000000000) {
      return hitung(Math.floor(angka / 1000000)) + ' Juta ' + hitung(angka % 1000000);
    } else if (angka < 1000000000000) {
      return hitung(Math.floor(angka / 1000000000)) + ' Miliar ' + hitung(angka % 1000000000);
    } else if (angka < 1000000000000000) {
      return hitung(Math.floor(angka / 1000000000000)) + ' Triliun ' + hitung(angka % 1000000000000);
    }
    return '';
  }

  const currencyNames: Record<string, string> = {
    IDR: 'Rupiah',
    USD: 'US Dollar',
    SGD: 'Singapore Dollar',
    EUR: 'Euro',
    GBP: 'Poundsterling',
    MYR: 'Ringgit Malaysia',
    JPY: 'Yen Jepang',
  };

  const currSuffix = currencyNames[currency] || currency;

  if (nilai === 0) return `Nol ${currSuffix}`;
  const hasil = hitung(nilai).replace(/\s+/g, ' ').trim();
  return `${hasil} ${currSuffix}`;
}

/**
 * Format angka ke format mata uang berdasarkan kode mata uang
 */
export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  try {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString('id-ID')}`;
  }
}

/**
 * Backward compatibility formatRupiah
 */
export function formatRupiah(amount: number): string {
  return formatCurrency(amount, 'IDR');
}

/**
 * Format angka ribuan biasa
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Kalkulasi total faktur
 */
export function calculateInvoiceTotals(invoice: {
  items: Array<{ quantity: number; unitPrice: number; discountPercent?: number }>;
  discountPercent: number;
  taxPercent: number;
  stampDuty: number;
  shippingFee?: number;
}) {
  const subtotal = invoice.items.reduce((sum, item) => {
    const itemDiscount = item.discountPercent ? (item.quantity * item.unitPrice * item.discountPercent) / 100 : 0;
    return sum + (item.quantity * item.unitPrice - itemDiscount);
  }, 0);

  const discountAmount = (subtotal * (invoice.discountPercent || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * (invoice.taxPercent || 0)) / 100;
  const shipping = invoice.shippingFee || 0;
  const stamp = invoice.stampDuty || 0;
  const grandTotal = taxableAmount + taxAmount + shipping + stamp;

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    shipping,
    stamp,
    grandTotal,
  };
}
