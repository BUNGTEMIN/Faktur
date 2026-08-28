import { InvoiceNumberingConfig } from '../types';

export const defaultNumberingConfig: InvoiceNumberingConfig = {
  prefix: 'INV',
  suffix: '',
  nextNumber: 1,
  paddingDigits: 3,
  includeYear: false,
  yearFormat: 'YYYY',
  includeMonth: false,
  monthFormat: 'MM',
  includeDay: false,
  separator: '-',
  customPattern: '{PREFIX}-{NNN}',
  useCustomPattern: false,
};

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export interface NumberingPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<InvoiceNumberingConfig>;
}

export const NUMBERING_PRESETS: NumberingPreset[] = [
  {
    id: 'simple-dash',
    name: 'Sederhana (INV-001)',
    description: 'Format nomor berurutan simpel dengan prefix dan 3 digit angka',
    config: {
      prefix: 'INV',
      suffix: '',
      paddingDigits: 3,
      includeYear: false,
      includeMonth: false,
      includeDay: false,
      separator: '-',
      useCustomPattern: false,
    },
  },
  {
    id: 'corporate-slash',
    name: 'Bisnis Standar (INV/YYYY/MM/0001)',
    description: 'Format perusahaan lengkap dengan tahun, bulan, dan 4 digit urutan',
    config: {
      prefix: 'INV',
      suffix: '',
      paddingDigits: 4,
      includeYear: true,
      yearFormat: 'YYYY',
      includeMonth: true,
      monthFormat: 'MM',
      includeDay: false,
      separator: '/',
      useCustomPattern: false,
    },
  },
  {
    id: 'tax-format',
    name: 'Faktur Standar (FP-YYYY-001)',
    description: 'Format Faktur Penjualan resmi dengan kode FP dan tahun',
    config: {
      prefix: 'FP',
      suffix: '',
      paddingDigits: 3,
      includeYear: true,
      yearFormat: 'YYYY',
      includeMonth: false,
      includeDay: false,
      separator: '-',
      useCustomPattern: false,
    },
  },
  {
    id: 'roman-month',
    name: 'Format Romawi (INV/NKT/MM/YYYY/001)',
    description: 'Menggunakan angka Romawi untuk penomoran bulan resmi',
    config: {
      prefix: 'INV/NKT',
      suffix: '',
      paddingDigits: 3,
      includeYear: true,
      yearFormat: 'YYYY',
      includeMonth: true,
      monthFormat: 'ROMAN',
      includeDay: false,
      separator: '/',
      useCustomPattern: false,
    },
  },
  {
    id: 'compact-date',
    name: 'Kompak Harian (INV-YYMMDD-001)',
    description: 'Format tanggal padat dengan penomoran unik harian',
    config: {
      prefix: 'INV',
      useCustomPattern: true,
      customPattern: '{PREFIX}-{YY}{MM}{DD}-{NNN}',
    },
  },
];

/**
 * Generates an invoice number based on configuration, counter, and reference date
 */
export function formatInvoiceNumber(
  config: InvoiceNumberingConfig,
  counterOverride?: number,
  refDate: Date = new Date()
): string {
  const numberToUse = counterOverride !== undefined ? counterOverride : config.nextNumber;
  const digits = Math.max(1, config.paddingDigits || 3);
  const paddedNum = String(numberToUse).padStart(digits, '0');

  const yearFull = String(refDate.getFullYear());
  const yearShort = yearFull.slice(-2);
  const monthNum = refDate.getMonth();
  const monthTwoDigit = String(monthNum + 1).padStart(2, '0');
  const monthRoman = ROMAN_MONTHS[monthNum] || 'I';
  const dayTwoDigit = String(refDate.getDate()).padStart(2, '0');

  if (config.useCustomPattern && config.customPattern) {
    let result = config.customPattern;
    result = result.replace(/\{PREFIX\}/g, config.prefix || '');
    result = result.replace(/\{SUFFIX\}/g, config.suffix || '');
    result = result.replace(/\{YYYY\}/g, yearFull);
    result = result.replace(/\{YY\}/g, yearShort);
    result = result.replace(/\{MM\}/g, monthTwoDigit);
    result = result.replace(/\{ROMAN_MM\}/g, monthRoman);
    result = result.replace(/\{DD\}/g, dayTwoDigit);
    result = result.replace(/\{NNNNN\}/g, String(numberToUse).padStart(5, '0'));
    result = result.replace(/\{NNNN\}/g, String(numberToUse).padStart(4, '0'));
    result = result.replace(/\{NNN\}/g, String(numberToUse).padStart(3, '0'));
    result = result.replace(/\{NN\}/g, String(numberToUse).padStart(2, '0'));
    result = result.replace(/\{N\}/g, String(numberToUse));
    result = result.replace(/\{NUM\}/g, paddedNum);
    return result;
  }

  // Standard Builder
  const parts: string[] = [];

  if (config.prefix && config.prefix.trim()) {
    parts.push(config.prefix.trim());
  }

  if (config.includeYear) {
    parts.push(config.yearFormat === 'YY' ? yearShort : yearFull);
  }

  if (config.includeMonth) {
    parts.push(config.monthFormat === 'ROMAN' ? monthRoman : monthTwoDigit);
  }

  if (config.includeDay) {
    parts.push(dayTwoDigit);
  }

  parts.push(paddedNum);

  let formatted = parts.join(config.separator || '-');

  if (config.suffix && config.suffix.trim()) {
    formatted += config.suffix.trim();
  }

  return formatted;
}
