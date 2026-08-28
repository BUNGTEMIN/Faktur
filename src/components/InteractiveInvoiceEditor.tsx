import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InvoiceData, InvoiceItem, ProductItem, ClientProfile, PaymentStatus } from '../types';
import { calculateInvoiceTotals, formatCurrency, terbilang } from '../utils/numberToWords';
import { InvoiceDocument } from './InvoiceDocument';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  Code, 
  Share2, 
  Copy, 
  FilePlus, 
  Package, 
  Users, 
  Upload, 
  Eye, 
  Edit3, 
  Check,
  Building2,
  Sparkles,
  DollarSign,
  FileDown,
  Loader2,
  Cloud,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface InteractiveInvoiceEditorProps {
  invoice: InvoiceData;
  onChange?: (updated: InvoiceData) => void;
  onUpdateInvoice?: (updated: InvoiceData) => void;
  onSave?: () => void;
  onSaveInvoice?: (updated: InvoiceData) => void;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  onExportHtml?: () => void;
  onOpenCodeModal?: () => void;
  onDuplicate?: () => void;
  onNew?: () => void;
  onNewInvoice?: () => void;
  products: ProductItem[];
  clients: ClientProfile[];
  onOpenProductCatalog?: () => void;
  onOpenClientList?: () => void;
  onOpenCatalog?: () => void;
  onOpenClients?: () => void;
}

const CURRENCIES = [
  { code: 'IDR', label: 'IDR (Rp) - Rupiah Indonesia' },
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'SGD', label: 'SGD (S$) - Singapore Dollar' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'MYR', label: 'MYR (RM) - Malaysian Ringgit' },
  { code: 'JPY', label: 'JPY (¥) - Japanese Yen' },
];

export const InteractiveInvoiceEditor: React.FC<InteractiveInvoiceEditorProps> = ({
  invoice,
  onChange,
  onUpdateInvoice,
  onSave,
  onSaveInvoice,
  onPrint,
  onDownloadPdf,
  onExportHtml,
  onOpenCodeModal,
  onDuplicate,
  onNew,
  onNewInvoice,
  products,
  clients,
  onOpenProductCatalog,
  onOpenClientList,
  onOpenCatalog,
  onOpenClients,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [savedNotification, setSavedNotification] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState<number | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);

  // Local draft state for responsive immediate typing + debounced persistence
  const [draft, setDraft] = useState<InvoiceData>(() => {
    // Check if there is an existing draft in localStorage for this invoice id
    try {
      const rawDraft = localStorage.getItem('faktur_pro_current_draft_v2');
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && parsed.id === invoice.id) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading draft', e);
    }
    return invoice;
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'synced'>('synced');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  const draftRef = useRef<InvoiceData>(draft);
  const isDirtyRef = useRef<boolean>(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize draft if external invoice ID changes
  useEffect(() => {
    if (invoice.id !== draft.id) {
      setDraft(invoice);
      draftRef.current = invoice;
      isDirtyRef.current = false;
      setAutoSaveStatus('synced');
    }
  }, [invoice.id]);

  // Keep draftRef up to date
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const notifyStore = useCallback((updated: InvoiceData) => {
    if (onChange) onChange(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  }, [onChange, onUpdateInvoice]);

  // Debounced auto-save function (600ms debounce)
  const scheduleDebouncedSave = useCallback((updated: InvoiceData) => {
    draftRef.current = updated;
    isDirtyRef.current = true;
    setAutoSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      // 1. Update store
      notifyStore(updated);

      // 2. Persist draft and update localStorage invoices array directly for instant durability
      try {
        localStorage.setItem('faktur_pro_current_draft_v2', JSON.stringify(updated));
        
        const rawInvoices = localStorage.getItem('faktur_pro_invoices_v2');
        if (rawInvoices) {
          const parsed = JSON.parse(rawInvoices);
          if (Array.isArray(parsed)) {
            const index = parsed.findIndex((inv: InvoiceData) => inv.id === updated.id);
            if (index !== -1) {
              parsed[index] = updated;
            } else {
              parsed.unshift(updated);
            }
            localStorage.setItem('faktur_pro_invoices_v2', JSON.stringify(parsed));
          }
        }
      } catch (err) {
        console.error('Failed to save to localStorage during debounced auto-save:', err);
      }

      isDirtyRef.current = false;
      setAutoSaveStatus('saved');
      const now = new Date();
      setLastSavedTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 600);
  }, [notifyStore]);

  // Handle immediate user modifications in draft
  const handleUpdate = (updated: InvoiceData) => {
    setDraft(updated);
    scheduleDebouncedSave(updated);
  };

  // Emergency synchronous save on beforeunload / pagehide (F5, reload, close tab)
  useEffect(() => {
    const emergencyFlush = () => {
      if (draftRef.current && isDirtyRef.current) {
        try {
          localStorage.setItem('faktur_pro_current_draft_v2', JSON.stringify(draftRef.current));
          const rawInvoices = localStorage.getItem('faktur_pro_invoices_v2');
          if (rawInvoices) {
            const parsed = JSON.parse(rawInvoices);
            if (Array.isArray(parsed)) {
              const index = parsed.findIndex((inv: InvoiceData) => inv.id === draftRef.current.id);
              if (index !== -1) {
                parsed[index] = draftRef.current;
              } else {
                parsed.unshift(draftRef.current);
              }
              localStorage.setItem('faktur_pro_invoices_v2', JSON.stringify(parsed));
            }
          }
        } catch (e) {
          console.error('Emergency save on unload failed:', e);
        }
      }
    };

    window.addEventListener('beforeunload', emergencyFlush);
    window.addEventListener('pagehide', emergencyFlush);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      emergencyFlush();
      window.removeEventListener('beforeunload', emergencyFlush);
      window.removeEventListener('pagehide', emergencyFlush);
    };
  }, []);

  const handleSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    const toSave = draftRef.current || draft;
    if (onSave) onSave();
    if (onSaveInvoice) onSaveInvoice(toSave);

    try {
      localStorage.setItem('faktur_pro_current_draft_v2', JSON.stringify(toSave));
    } catch (e) {
      console.error(e);
    }

    isDirtyRef.current = false;
    setAutoSaveStatus('saved');
    const now = new Date();
    setLastSavedTime(
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );

    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleDownloadPdfAction = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      if (onDownloadPdf) {
        await onDownloadPdf();
      } else {
        await downloadInvoicePDF(draft, 'printable-invoice');
      }
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCreateNew = () => {
    if (onNew) onNew();
    if (onNewInvoice) onNewInvoice();
  };

  const handleOpenCatalogAction = () => {
    if (onOpenProductCatalog) onOpenProductCatalog();
    if (onOpenCatalog) onOpenCatalog();
  };

  const handleOpenClientsAction = () => {
    if (onOpenClientList) onOpenClientList();
    if (onOpenClients) onOpenClients();
  };

  const { subtotal, discountAmount, taxableAmount, taxAmount, shipping, stamp, grandTotal } = calculateInvoiceTotals({
    items: draft.items,
    discountPercent: draft.discountPercent,
    taxPercent: draft.taxPercent,
    stampDuty: draft.stampDuty,
    shippingFee: draft.shippingFee,
  });

  const handleFieldChange = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    handleUpdate({ ...draft, [field]: value });
  };

  const handleBillerChange = (field: keyof InvoiceData['biller'], value: string) => {
    handleUpdate({
      ...draft,
      biller: {
        ...draft.biller,
        [field]: value,
      },
    });
  };

  const handleClientChange = (field: keyof InvoiceData['client'], value: string) => {
    handleUpdate({
      ...draft,
      client: {
        ...draft.client,
        [field]: value,
      },
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...draft.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    handleUpdate({ ...draft, items: newItems });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit: 'Pcs',
      unitPrice: 0,
      discountPercent: 0,
    };
    handleUpdate({ ...draft, items: [...draft.items, newItem] });
  };

  const removeItem = (index: number) => {
    if (draft.items.length <= 1) return;
    const newItems = draft.items.filter((_, idx) => idx !== index);
    handleUpdate({ ...draft, items: newItems });
  };

  const insertProductToItem = (itemIndex: number, product: ProductItem) => {
    const newItems = [...draft.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      description: product.name + (product.description ? ` (${product.description})` : ''),
      unit: product.unit || 'Pcs',
      unitPrice: product.price || 0,
    };
    handleUpdate({ ...draft, items: newItems });
    setShowProductPicker(null);
  };

  const selectClient = (client: ClientProfile) => {
    handleUpdate({
      ...draft,
      client: {
        companyName: client.companyName,
        attentionName: client.attentionName,
        role: client.role,
        address: client.address,
        city: client.city,
        postalCode: client.postalCode,
        phone: client.phone,
        email: client.email,
        npwp: client.npwp,
      },
    });
    setShowClientPicker(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        handleBillerChange('logoUrl', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerSave = () => {
    handleSave();
  };

  const shareViaWhatsApp = () => {
    const text = `*FAKTUR PENJUALAN - ${draft.biller.name}*\n` +
      `No. Faktur: *${draft.invoiceNumber}*\n` +
      `Kepada: ${draft.client.companyName} (${draft.client.attentionName})\n` +
      `Jatuh Tempo: ${draft.dueDate}\n` +
      `Total Tagihan: *${formatCurrency(grandTotal, draft.currency)}*\n` +
      `Status: ${draft.paymentStatus}\n\n` +
      `Rekening Pembayaran:\n` +
      draft.bankAccounts.map(b => `• ${b.bankName}: ${b.accountNumber} (a/n ${b.accountHolder})`).join('\n') +
      `\n\nTerima kasih atas kerja sama dan transaksinya.`;
    
    const phone = draft.client.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Top Action Ribbon */}
      <div className="sticky top-16 z-20 bg-slate-900/95 backdrop-blur text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'editor' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor Faktur
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                viewMode === 'preview' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Pratinjau Cetak
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-2 border-l border-slate-700">
            <span>Faktur:</span>
            <span className="font-mono font-bold text-sky-400">{draft.invoiceNumber}</span>
          </div>

          {/* Realtime Debounced Auto-save Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-[11px]">
            {autoSaveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-amber-300 font-medium">Menyimpan...</span>
              </>
            ) : autoSaveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300 font-medium">
                  Tersimpan otomatis {lastSavedTime ? `(${lastSavedTime})` : ''}
                </span>
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3 text-sky-400" />
                <span className="text-slate-300">Auto-save aktif</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save Button */}
          <button
            onClick={triggerSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            {savedNotification ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {savedNotification ? 'Tersimpan!' : 'Simpan'}
          </button>

          {/* Download PDF Button (PRIMARY) */}
          <button
            onClick={handleDownloadPdfAction}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-75 text-white text-xs font-bold transition shadow-xs cursor-pointer shadow-rose-900/30"
            title="Unduh Faktur Format Dokumen PDF (A4)"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </>
            )}
          </button>

          {/* Print Button */}
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              title="Cetak via Printer / Dialog Browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          )}

          {/* HTML Download */}
          {onExportHtml && (
            <button
              onClick={onExportHtml}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer"
              title="Unduh File HTML Mandiri"
            >
              <Code className="w-3.5 h-3.5 text-sky-400" />
              <span>HTML</span>
            </button>
          )}

          {/* WhatsApp Share */}
          <button
            onClick={shareViaWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer"
            title="Kirim Ringkasan Faktur via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Duplicate */}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 cursor-pointer"
              title="Duplikat Faktur"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplikat</span>
            </button>
          )}

          {/* New Invoice */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Baru</span>
          </button>
        </div>
      </div>

      {/* Hidden container to ensure #printable-invoice is always ready in DOM for PDF generation */}
      {viewMode === 'editor' && (
        <div 
          style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -100, width: '210mm', opacity: 0, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <InvoiceDocument data={draft} scale={1} />
        </div>
      )}

      {viewMode === 'preview' ? (
        /* Preview Paper Mode */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/90 text-white px-5 py-3 rounded-xl border border-slate-700 shadow-md">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>Pratinjau Lembar A4 (Standar Resmi Cetak & PDF)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdfAction}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-75 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh Dokumen PDF'}</span>
              </button>
              {onPrint && (
                <button
                  onClick={onPrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-300/70 p-4 sm:p-8 rounded-2xl border border-slate-300 shadow-inner">
            <InvoiceDocument data={draft} scale={1} />
          </div>
        </div>
      ) : (
        /* Interactive WYSIWYG Form Mode (Invoice-Generator.com style) */
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-10 space-y-8">
          
          {/* Top Row: Logo & Company (Left) + Invoice Title, Status, Currency (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-6 border-b-2 border-slate-900">
            {/* Left: Company Details & Logo */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-start gap-4">
                {/* Logo Upload Box */}
                <div className="relative group flex-shrink-0">
                  {draft.biller.logoUrl ? (
                    <div className="relative w-24 h-24 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-1">
                      <img src={draft.biller.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      <button
                        onClick={() => handleBillerChange('logoUrl', '')}
                        className="absolute inset-0 bg-slate-900/60 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                      >
                        Hapus Logo
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/50 flex flex-col items-center justify-center cursor-pointer transition text-slate-400 hover:text-sky-600 text-center p-2">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-semibold">+ Logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {/* Company Name & Tagline */}
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Nama Perusahaan / Bisnis Anda
                    </label>
                    <input
                      type="text"
                      value={draft.biller.name}
                      onChange={(e) => handleBillerChange('name', e.target.value)}
                      className="w-full text-lg font-extrabold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none px-1 py-0.5 transition"
                      placeholder="Nama PT / CV / Toko Anda"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={draft.biller.tagline}
                      onChange={(e) => handleBillerChange('tagline', e.target.value)}
                      className="w-full text-xs font-semibold text-sky-700 border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none px-1 py-0.5 transition uppercase"
                      placeholder="Slogan atau Bidang Usaha"
                    />
                  </div>
                </div>
              </div>

              {/* Company Address, Contact, NPWP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Alamat Lengkap Perusahaan</label>
                  <input
                    type="text"
                    value={draft.biller.address}
                    onChange={(e) => handleBillerChange('address', e.target.value)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="Gedung / Jalan / Nomor"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Kota & Kode Pos</label>
                  <div className="flex gap-2 mt-0.5">
                    <input
                      type="text"
                      value={draft.biller.city}
                      onChange={(e) => handleBillerChange('city', e.target.value)}
                      className="w-2/3 border border-slate-200 rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                      placeholder="Kota"
                    />
                    <input
                      type="text"
                      value={draft.biller.postalCode}
                      onChange={(e) => handleBillerChange('postalCode', e.target.value)}
                      className="w-1/3 border border-slate-200 rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                      placeholder="Kodepos"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">NPWP Perusahaan</label>
                  <input
                    type="text"
                    value={draft.biller.npwp}
                    onChange={(e) => handleBillerChange('npwp', e.target.value)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 font-mono focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="00.000.000.0-000.000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Telepon & Email</label>
                  <div className="flex gap-2 mt-0.5">
                    <input
                      type="text"
                      value={draft.biller.phone}
                      onChange={(e) => handleBillerChange('phone', e.target.value)}
                      className="w-1/2 border border-slate-200 rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                      placeholder="No. Telp"
                    />
                    <input
                      type="email"
                      value={draft.biller.email}
                      onChange={(e) => handleBillerChange('email', e.target.value)}
                      className="w-1/2 border border-slate-200 rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                      placeholder="Email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Website</label>
                  <input
                    type="text"
                    value={draft.biller.website}
                    onChange={(e) => handleBillerChange('website', e.target.value)}
                    className="w-full border border-slate-200 rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                    placeholder="www.perusahaan.com"
                  />
                </div>
              </div>
            </div>

            {/* Right: Invoice Title, Payment Status, Currency */}
            <div className="lg:col-span-5 flex flex-col justify-between items-start lg:items-end space-y-4">
              <div className="w-full flex flex-col lg:items-end">
                <span className="text-3xl font-black tracking-tight text-slate-900">FAKTUR</span>
                <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">COMMERCIAL INVOICE</span>
              </div>

              {/* Status & Currency Selectors */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Status Pembayaran:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['PAID', 'UNPAID', 'OVERDUE', 'DRAFT'] as PaymentStatus[]).map((st) => {
                      const labels: Record<string, { name: string; activeClass: string }> = {
                        PAID: { name: 'LUNAS', activeClass: 'bg-emerald-600 text-white' },
                        UNPAID: { name: 'BELUM LUNAS', activeClass: 'bg-amber-600 text-white' },
                        OVERDUE: { name: 'JATUH TEMPO', activeClass: 'bg-rose-600 text-white' },
                        DRAFT: { name: 'DRAF', activeClass: 'bg-slate-700 text-white' },
                      };
                      const isActive = draft.paymentStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleFieldChange('paymentStatus', st)}
                          className={`py-1.5 px-2 text-xs font-bold rounded border transition text-center cursor-pointer ${
                            isActive
                              ? `${labels[st].activeClass} border-transparent shadow-xs`
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {labels[st].name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Mata Uang (Currency):
                  </label>
                  <select
                    value={draft.currency || 'IDR'}
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Grid: Invoice Number, Dates, PO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Nomor Faktur</label>
              <input
                type="text"
                value={draft.invoiceNumber}
                onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                className="w-full font-mono font-bold text-slate-900 border border-slate-200 bg-white rounded px-2.5 py-1.5 text-xs focus:border-sky-500 focus:outline-none mt-1"
                placeholder="INV/2026/08/0430"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">Tanggal Terbit</label>
              <input
                type="date"
                value={draft.issueDate}
                onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                className="w-full text-slate-900 border border-slate-200 bg-white rounded px-2.5 py-1.5 text-xs focus:border-sky-500 focus:outline-none mt-1"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-rose-700">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                className="w-full font-bold text-rose-700 border border-slate-200 bg-white rounded px-2.5 py-1.5 text-xs focus:border-sky-500 focus:outline-none mt-1"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500">No. PO / Ref Klien</label>
              <input
                type="text"
                value={draft.poNumber || ''}
                onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                className="w-full font-mono text-slate-900 border border-slate-200 bg-white rounded px-2.5 py-1.5 text-xs focus:border-sky-500 focus:outline-none mt-1"
                placeholder="PO-XXX/2026/..."
              />
            </div>
          </div>

          {/* Billed To / Client Section with Quick Picker */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-sky-800 tracking-wider">
                Ditagihkan Kepada (Bill To):
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClientPicker(!showClientPicker)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  Pilih dari Kontak Pelanggan ({clients.length})
                </button>

                {/* Dropdown Client Picker */}
                {showClientPicker && (
                  <div className="absolute right-0 top-8 z-30 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-2 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Pilih Kontak Tersimpan:</div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {clients.map((c, i) => (
                        <button
                          key={c.id || i}
                          type="button"
                          onClick={() => selectClient(c)}
                          className="w-full text-left px-2 py-1.5 hover:bg-sky-50 rounded text-xs transition block"
                        >
                          <div className="font-bold text-slate-900">{c.companyName}</div>
                          <div className="text-[11px] text-slate-500">{c.attentionName} • {c.phone}</div>
                        </button>
                      ))}
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={onOpenClientList}
                        className="w-full text-center text-xs font-bold text-sky-600 hover:text-sky-800 py-1"
                      >
                        + Kelola Master Kontak
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400">Nama Perusahaan / Klien</label>
                <input
                  type="text"
                  value={draft.client.companyName}
                  onChange={(e) => handleClientChange('companyName', e.target.value)}
                  className="w-full font-bold text-slate-900 border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                  placeholder="PT / Nama Klien"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400">Nama PIC (u.p.) & Jabatan</label>
                <div className="flex gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={draft.client.attentionName}
                    onChange={(e) => handleClientChange('attentionName', e.target.value)}
                    className="w-2/3 border border-slate-200 bg-white rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                    placeholder="Nama PIC"
                  />
                  <input
                    type="text"
                    value={draft.client.role}
                    onChange={(e) => handleClientChange('role', e.target.value)}
                    className="w-1/3 border border-slate-200 bg-white rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                    placeholder="Jabatan"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400">NPWP Klien</label>
                <input
                  type="text"
                  value={draft.client.npwp || ''}
                  onChange={(e) => handleClientChange('npwp', e.target.value)}
                  className="w-full font-mono border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                  placeholder="00.000.000.0-000.000 (Opsional)"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400">Alamat Klien</label>
                <input
                  type="text"
                  value={draft.client.address}
                  onChange={(e) => handleClientChange('address', e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded px-2.5 py-1.5 focus:border-sky-500 focus:outline-none mt-0.5"
                  placeholder="Alamat Kantor / Pengiriman"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400">Kota & Telepon</label>
                <div className="flex gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={draft.client.city}
                    onChange={(e) => handleClientChange('city', e.target.value)}
                    className="w-1/2 border border-slate-200 bg-white rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                    placeholder="Kota"
                  />
                  <input
                    type="text"
                    value={draft.client.phone}
                    onChange={(e) => handleClientChange('phone', e.target.value)}
                    className="w-1/2 border border-slate-200 bg-white rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                    placeholder="No. HP / WA"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase text-slate-900 tracking-wider">
                Daftar Barang / Jasa Penjualan:
              </span>
              <button
                type="button"
                onClick={onOpenProductCatalog}
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded transition"
              >
                <Package className="w-3.5 h-3.5" />
                Buka Master Katalog Produk ({products.length})
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3 min-w-[280px]">Deskripsi Barang / Layanan</th>
                    <th className="py-2.5 px-3 text-center w-24">Kuantitas</th>
                    <th className="py-2.5 px-3 text-center w-20">Satuan</th>
                    <th className="py-2.5 px-3 text-right w-36">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-center w-20">Diskon %</th>
                    <th className="py-2.5 px-3 text-right w-36">Total</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {draft.items.map((item, idx) => {
                    const itemDiscount = item.discountPercent ? (item.quantity * item.unitPrice * item.discountPercent) / 100 : 0;
                    const itemTotal = item.quantity * item.unitPrice - itemDiscount;

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2 relative">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              className="w-full font-medium border border-slate-200 rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                              placeholder="Ketik nama item atau pilih produk..."
                            />
                            {/* Fast catalog insert popover */}
                            <button
                              type="button"
                              onClick={() => setShowProductPicker(showProductPicker === idx ? null : idx)}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Pilih dari katalog"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {showProductPicker === idx && (
                            <div className="absolute left-2 top-11 z-30 w-80 bg-white border border-slate-200 rounded-lg shadow-xl p-2 space-y-1">
                              <div className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">Pilih Item dari Katalog:</div>
                              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {products.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => insertProductToItem(idx, p)}
                                    className="w-full text-left px-2 py-1.5 hover:bg-sky-50 rounded text-xs transition block"
                                  >
                                    <div className="font-bold text-slate-900">{p.name}</div>
                                    <div className="text-[11px] text-slate-500 flex justify-between">
                                      <span>{p.category}</span>
                                      <span className="font-mono font-semibold text-sky-700">{formatCurrency(p.price, draft.currency)} / {p.unit}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full text-center font-mono font-semibold border border-slate-200 rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full text-center border border-slate-200 rounded px-1.5 py-1.5 focus:border-sky-500 focus:outline-none"
                            placeholder="Pcs/Bln"
                          />
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full text-right font-mono font-semibold border border-slate-200 rounded px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent || 0}
                            onChange={(e) => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                            className="w-full text-center font-mono border border-slate-200 rounded px-1 py-1.5 focus:border-sky-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(itemTotal, draft.currency)}
                        </td>

                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={draft.items.length <= 1}
                            className={`p-1.5 rounded transition ${
                              draft.items.length <= 1
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition cursor-pointer border border-sky-200"
              >
                <Plus className="w-3.5 h-3.5" />
                + Tambah Baris Item
              </button>
            </div>
          </div>

          {/* Calculations Summary & Terbilang */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
            {/* Left: Terbilang Banner & Payment Instructions */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-100/80 border-l-4 border-sky-600 p-3.5 rounded-r-lg">
                <div className="text-[10px] font-extrabold uppercase text-sky-800">
                  TERBILANG :
                </div>
                <div className="text-xs font-bold italic text-slate-800 mt-1">
                  # {terbilang(grandTotal, draft.currency)} #
                </div>
              </div>

              {/* Bank Accounts Setting */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-800">
                    Rekening Bank Pembayaran:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newBank = {
                        bankName: 'Bank Mandiri',
                        accountNumber: '',
                        accountHolder: draft.biller.name,
                      };
                      handleUpdate({ ...draft, bankAccounts: [...draft.bankAccounts, newBank] });
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-800"
                  >
                    + Tambah Rekening
                  </button>
                </div>

                {draft.bankAccounts.map((bank, bIdx) => (
                  <div key={bIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white border border-slate-200 p-2 rounded text-xs relative">
                    <input
                      type="text"
                      value={bank.bankName}
                      onChange={(e) => {
                        const newBanks = [...draft.bankAccounts];
                        newBanks[bIdx].bankName = e.target.value;
                        handleUpdate({ ...draft, bankAccounts: newBanks });
                      }}
                      placeholder="Nama Bank (cth. BCA)"
                      className="border border-slate-200 rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={bank.accountNumber}
                      onChange={(e) => {
                        const newBanks = [...draft.bankAccounts];
                        newBanks[bIdx].accountNumber = e.target.value;
                        handleUpdate({ ...draft, bankAccounts: newBanks });
                      }}
                      placeholder="No. Rekening"
                      className="border border-slate-200 rounded px-2 py-1 font-mono"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={bank.accountHolder}
                        onChange={(e) => {
                          const newBanks = [...draft.bankAccounts];
                          newBanks[bIdx].accountHolder = e.target.value;
                          handleUpdate({ ...draft, bankAccounts: newBanks });
                        }}
                        placeholder="a/n Pemilik"
                        className="w-full border border-slate-200 rounded px-2 py-1"
                      />
                      {draft.bankAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newBanks = draft.bankAccounts.filter((_, i) => i !== bIdx);
                            handleUpdate({ ...draft, bankAccounts: newBanks });
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Instruksi Pembayaran:
                  </label>
                  <textarea
                    rows={2}
                    value={draft.paymentInstructions}
                    onChange={(e) => handleFieldChange('paymentInstructions', e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded p-2 focus:border-sky-500 focus:outline-none"
                    placeholder="Petunjuk transfer, batas konfirmasi..."
                  />
                </div>
              </div>
            </div>

            {/* Right: Calculations (Discounts, Tax, Shipping, Stamp) */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-700">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono font-bold">{formatCurrency(subtotal, draft.currency)}</span>
              </div>

              {/* Overall Discount Input */}
              <div className="flex justify-between items-center text-xs gap-3">
                <span className="font-medium text-emerald-700">Diskon Keseluruhan (%):</span>
                <div className="flex items-center gap-1 w-24">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.discountPercent}
                    onChange={(e) => handleFieldChange('discountPercent', parseFloat(e.target.value) || 0)}
                    className="w-full text-right font-mono font-semibold border border-slate-200 bg-white rounded px-2 py-1"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              </div>

              {draft.discountPercent > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-medium">
                  <span>Potongan Diskon:</span>
                  <span className="font-mono">-{formatCurrency(discountAmount, draft.currency)}</span>
                </div>
              )}

              {/* Tax / PPN Input */}
              <div className="flex justify-between items-center text-xs gap-3 pt-2 border-t border-slate-200 border-dashed">
                <span className="font-medium text-slate-700">PPN / Pajak (%):</span>
                <div className="flex items-center gap-1 w-24">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={draft.taxPercent}
                    onChange={(e) => handleFieldChange('taxPercent', parseFloat(e.target.value) || 0)}
                    className="w-full text-right font-mono font-semibold border border-slate-200 bg-white rounded px-2 py-1"
                  />
                  <span className="text-slate-500">%</span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Nilai PPN:</span>
                <span className="font-mono">{formatCurrency(taxAmount, draft.currency)}</span>
              </div>

              {/* Shipping / Additional Fee */}
              <div className="flex justify-between items-center text-xs gap-3">
                <span className="font-medium text-slate-700">Ongkir / Biaya Layanan:</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={draft.shippingFee || 0}
                  onChange={(e) => handleFieldChange('shippingFee', parseFloat(e.target.value) || 0)}
                  className="w-32 text-right font-mono font-semibold border border-slate-200 bg-white rounded px-2 py-1"
                />
              </div>

              {/* Stamp Duty / Materai */}
              <div className="flex justify-between items-center text-xs gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.hasStamp}
                    onChange={(e) => {
                      handleFieldChange('hasStamp', e.target.checked);
                      handleFieldChange('stampDuty', e.target.checked ? 10000 : 0);
                    }}
                    className="rounded text-sky-600"
                  />
                  <span className="font-medium text-slate-700">Bea Meterai (Rp 10.000)</span>
                </label>
                <span className="font-mono">{formatCurrency(draft.stampDuty || 0, draft.currency)}</span>
              </div>

              {/* Grand Total Highlight */}
              <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900 uppercase">TOTAL AKHIR:</span>
                <span className="text-xl font-black text-sky-700 font-mono">
                  {formatCurrency(grandTotal, draft.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes, Terms & Signee Bottom Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Catatan Tambahan (Notes):</label>
                <textarea
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded p-2 focus:border-sky-500 focus:outline-none"
                  placeholder="Catatan pengerjaan, BAST, terima kasih..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Syarat & Ketentuan (Terms):</label>
                <textarea
                  rows={3}
                  value={draft.terms}
                  onChange={(e) => handleFieldChange('terms', e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded p-2 focus:border-sky-500 focus:outline-none"
                  placeholder="Ketentuan jatuh tempo, denda, garansi..."
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <span className="text-[11px] font-bold uppercase text-slate-800 block">
                Penandatangan & Lokasi:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Kota</label>
                  <input
                    type="text"
                    value={draft.signeeCity}
                    onChange={(e) => handleFieldChange('signeeCity', e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1.5 mt-0.5"
                    placeholder="Jakarta Selatan"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Tanggal Tanda Tangan</label>
                  <input
                    type="date"
                    value={draft.signDate}
                    onChange={(e) => handleFieldChange('signDate', e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1.5 mt-0.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Nama Pejabat Penandatangan</label>
                  <input
                    type="text"
                    value={draft.signeeName}
                    onChange={(e) => handleFieldChange('signeeName', e.target.value)}
                    className="w-full font-bold border border-slate-200 bg-white rounded px-2 py-1.5 mt-0.5"
                    placeholder="Nama Lengkap & Gelar"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Jabatan</label>
                  <input
                    type="text"
                    value={draft.signeeTitle}
                    onChange={(e) => handleFieldChange('signeeTitle', e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded px-2 py-1.5 mt-0.5"
                    placeholder="Direktur / Finance Head"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
