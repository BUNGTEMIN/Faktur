export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE' | 'DRAFT';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent?: number;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  npwp: string;
  logoUrl?: string;
}

export interface ClientProfile {
  id?: string;
  companyName: string;
  attentionName: string;
  role: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  npwp?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  swiftCode?: string;
}

export interface InvoiceData {
  id: string; // Unique ID for storage
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD or formatted
  dueDate: string;
  poNumber?: string;
  paymentStatus: PaymentStatus;
  currency: string; // IDR, USD, SGD, EUR
  biller: CompanyProfile;
  client: ClientProfile;
  items: InvoiceItem[];
  discountPercent: number;
  taxPercent: number; // e.g. 11 for PPN 11%
  shippingFee?: number; // Biaya Pengiriman / Jasa Tambahan
  stampDuty: number; // e.g. 10000 or 0
  bankAccounts: BankAccount[];
  paymentInstructions: string;
  notes: string;
  terms: string;
  signeeName: string;
  signeeTitle: string;
  signeeCity: string;
  signDate: string;
  hasStamp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  description?: string;
}

export interface InvoiceNumberingConfig {
  prefix: string; // e.g. "INV", "FP", "INV/NKT"
  suffix?: string; // e.g. "/JKT", "-ID"
  nextNumber: number; // e.g. 1
  paddingDigits: number; // e.g. 3 for "001", 4 for "0001"
  includeYear: boolean;
  yearFormat: 'YYYY' | 'YY'; // e.g. 2026 or 26
  includeMonth: boolean;
  monthFormat: 'MM' | 'ROMAN'; // e.g. "08" or "VIII"
  includeDay: boolean;
  separator: string; // e.g. "-", "/", "."
  customPattern?: string; // e.g. "{PREFIX}-{NNN}" or "{PREFIX}/{YYYY}/{MM}/{NNNN}"
  useCustomPattern: boolean;
}
