import React, { useState, useEffect } from 'react';
import { CompanyProfile, InvoiceNumberingConfig } from '../types';
import { 
  Settings, 
  Building2, 
  Download, 
  Upload, 
  RotateCcw, 
  X, 
  Check, 
  Database, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  Cloud, 
  Hash, 
  Sparkles, 
  Layers, 
  Calendar,
  ArrowRight,
  Info,
  Sliders,
  SlidersHorizontal,
  Code,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  LogIn
} from 'lucide-react';
import { MySQLStatus, CloudSyncStatus } from '../utils/useInvoiceStore';
import { NUMBERING_PRESETS, formatInvoiceNumber } from '../utils/numberingHelper';
import { User } from '../lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  authLoading?: boolean;
  onSignInWithGoogle?: () => void;
  onLogout?: () => void;
  cloudSyncStatus?: CloudSyncStatus;
  lastCloudSyncTime?: string | null;
  billerProfile: CompanyProfile;
  onSaveBillerProfile: (profile: CompanyProfile) => void;
  numberingConfig: InvoiceNumberingConfig;
  onUpdateNumberingConfig: (config: Partial<InvoiceNumberingConfig>) => void;
  onSyncCounterWithHighestInvoice: () => number;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => { success: boolean; error?: string };
  onResetToDefaults: () => void;
  mysqlStatus?: MySQLStatus;
  onTestMySQL?: () => Promise<boolean>;
  onUpdateMySQLConfig?: (config: { host: string; port: number; user: string; password?: string; database: string }) => Promise<any>;
  onSyncAllToMySQL?: () => Promise<{ success: boolean; error?: string }>;
  onFetchFromMySQL?: () => Promise<void>;
  initialTab?: 'account' | 'numbering' | 'profile' | 'mysql' | 'backup';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  authLoading,
  onSignInWithGoogle,
  onLogout,
  cloudSyncStatus,
  lastCloudSyncTime,
  billerProfile,
  onSaveBillerProfile,
  numberingConfig,
  onUpdateNumberingConfig,
  onSyncCounterWithHighestInvoice,
  onExportAllData,
  onImportAllData,
  onResetToDefaults,
  mysqlStatus,
  onTestMySQL,
  onUpdateMySQLConfig,
  onSyncAllToMySQL,
  onFetchFromMySQL,
  initialTab = 'numbering',
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'numbering' | 'profile' | 'mysql' | 'backup'>(initialTab);
  
  // Local form state for Biller Profile
  const [profile, setProfile] = useState<CompanyProfile>(billerProfile);
  
  // Local form state for Numbering Config
  const [numConfig, setNumConfig] = useState<InvoiceNumberingConfig>(numberingConfig);
  
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncingAction, setSyncingAction] = useState<string | null>(null);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);
  const [isEditingDbConfig, setIsEditingDbConfig] = useState(false);
  const [syncedCounterMsg, setSyncedCounterMsg] = useState<string | null>(null);

  const [dbForm, setDbForm] = useState({
    host: mysqlStatus?.host || 'sql.nufat.id',
    port: mysqlStatus?.port || 3306,
    user: mysqlStatus?.user || 'nufat',
    password: 'nufat17a',
    database: mysqlStatus?.database || 'nufat',
  });

  // Sync state when props update or modal opens
  useEffect(() => {
    setProfile(billerProfile);
  }, [billerProfile]);

  useEffect(() => {
    setNumConfig(numberingConfig);
  }, [numberingConfig]);

  if (!isOpen) return null;

  // Profile handlers
  const handleProfileChange = (field: keyof CompanyProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBillerProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Numbering Handlers
  const handleNumConfigChange = <K extends keyof InvoiceNumberingConfig>(field: K, value: InvoiceNumberingConfig[K]) => {
    const updated = { ...numConfig, [field]: value };
    setNumConfig(updated);
    onUpdateNumberingConfig({ [field]: value });
  };

  const handleApplyPreset = (presetConfig: Partial<InvoiceNumberingConfig>) => {
    const updated = { ...numConfig, ...presetConfig };
    setNumConfig(updated);
    onUpdateNumberingConfig(presetConfig);
  };

  const handleSyncCounter = () => {
    const nextVal = onSyncCounterWithHighestInvoice();
    setNumConfig((prev) => ({ ...prev, nextNumber: nextVal }));
    setSyncedCounterMsg(`Counter berhasil disinkronkan ke nomor urut: ${nextVal}`);
    setTimeout(() => setSyncedCounterMsg(null), 3500);
  };

  // Backup & Restore handlers
  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const res = onImportAllData(importJsonText);
    if (res.success) {
      setImportStatus('Data & konfigurasi berhasil dipulihkan!');
      setImportJsonText('');
      setTimeout(() => setImportStatus(null), 3000);
    } else {
      setImportStatus(`Error: ${res.error}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setImportJsonText(text);
      };
      reader.readAsText(file);
    }
  };

  // MySQL Handlers
  const handleTestMySQL = async () => {
    if (!onTestMySQL) return;
    setSyncingAction('test');
    setSyncResultMsg(null);
    const ok = await onTestMySQL();
    setSyncingAction(null);
    setSyncResultMsg(ok ? 'Koneksi ke MySQL database server berhasil!' : 'Koneksi ke MySQL gagal. Cek status server.');
    setTimeout(() => setSyncResultMsg(null), 4000);
  };

  const handlePushMySQL = async () => {
    if (!onSyncAllToMySQL) return;
    setSyncingAction('push');
    setSyncResultMsg(null);
    const res = await onSyncAllToMySQL();
    setSyncingAction(null);
    setSyncResultMsg(res.success ? 'Seluruh faktur dan katalog berhasil disinkronkan ke MySQL!' : `Gagal sinkron: ${res.error}`);
    setTimeout(() => setSyncResultMsg(null), 4000);
  };

  const handlePullMySQL = async () => {
    if (!onFetchFromMySQL) return;
    setSyncingAction('pull');
    setSyncResultMsg(null);
    await onFetchFromMySQL();
    setSyncingAction(null);
    setSyncResultMsg('Data terbaru dari database MySQL berhasil ditarik!');
    setTimeout(() => setSyncResultMsg(null), 4000);
  };

  const handleSaveDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateMySQLConfig) return;
    setSyncingAction('config');
    setSyncResultMsg(null);
    const res = await onUpdateMySQLConfig(dbForm);
    setSyncingAction(null);
    if (res.connected) {
      setSyncResultMsg('Koneksi MySQL berhasil dan parameter disimpan!');
      setIsEditingDbConfig(false);
    } else {
      setSyncResultMsg(`Gagal terhubung (${res.error || 'Connection refused'}). Periksa izin akses remote / firewall.`);
    }
    setTimeout(() => setSyncResultMsg(null), 5000);
  };

  // Previews for next 3 documents
  const previewNext1 = formatInvoiceNumber(numConfig, numConfig.nextNumber);
  const previewNext2 = formatInvoiceNumber(numConfig, numConfig.nextNumber + 1);
  const previewNext3 = formatInvoiceNumber(numConfig, numConfig.nextNumber + 2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Pengaturan Sistem Faktur</h3>
              <p className="text-xs text-slate-300">Format penomoran global, profil usaha, dan sinkronisasi.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'account'
                ? 'border-sky-600 text-sky-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <UserIcon className="w-4 h-4 text-sky-600" />
            <span>Akun & Cloud</span>
            {currentUser ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded-full">
                Tamu
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('numbering')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'numbering'
                ? 'border-sky-600 text-sky-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Hash className="w-4 h-4 text-sky-600" />
            <span>Format Penomoran Faktur</span>
            <span className="ml-1 px-1.5 py-0.2 bg-sky-100 text-sky-700 text-[10px] rounded-full font-mono font-bold">
              Auto-Inc
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-sky-600 text-sky-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Building2 className="w-4 h-4 text-slate-600" />
            <span>Profil Usaha</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mysql')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'mysql'
                ? 'border-sky-600 text-sky-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Database MySQL</span>
            {mysqlStatus?.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'border-sky-600 text-sky-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Backup & Reset</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">

          {/* ========================================================= */}
          {/* TAB 0: AKUN GOOGLE & CLOUD FIRESTORE MULTI-USER           */}
          {/* ========================================================= */}
          {activeTab === 'account' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-200 pb-3">
                <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Akun Pengguna & Database Multi-User Cloud
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Setiap pengguna publik memiliki database faktur, katalog produk, dan buku kontak yang terisolasi secara aman menggunakan akun Google.
                </p>
              </div>

              {currentUser ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {currentUser.photoURL ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-sky-500 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-sky-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                          {(currentUser.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {currentUser.displayName || 'Pengguna Faktur Pro'}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                            Akun Terverifikasi
                          </span>
                        </div>
                        <p className="text-slate-500 font-mono text-[11px] mt-0.5">{currentUser.email}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {currentUser.uid}</p>
                      </div>
                    </div>

                    {onLogout && (
                      <button
                        type="button"
                        onClick={onLogout}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun (Sign Out)</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Isolasi Database:</span>
                      <span className="font-bold text-sky-700 font-mono bg-sky-50 px-2 py-0.5 rounded">
                        /users/{currentUser.uid.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Sinkronisasi Cloud:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Aktif Real-time
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full mx-auto flex items-center justify-center">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">Anda sedang dalam Mode Tamu (Penyimpanan Lokal)</h5>
                    <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                      Masuk dengan akun Google Anda untuk mendapatkan database pribadi di Cloud Firestore. Semua faktur Anda akan tersinkron otomatis antar perangkat.
                    </p>
                  </div>

                  {onSignInWithGoogle && (
                    <button
                      type="button"
                      onClick={onSignInWithGoogle}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs transition shadow-md cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Masuk Sekarang dengan Google</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: GLOBAL INVOICE NUMBERING CONFIGURATION             */}
          {/* ========================================================= */}
          {activeTab === 'numbering' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Header Title & Description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                    Konfigurasi Penomoran Faktur Global (Global Invoice Numbering)
                  </h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Nomor faktur akan berinkremen secara otomatis (+1) setiap kali dokumen baru atau kasir POS diterbitkan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSyncCounter}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition cursor-pointer shrink-0"
                  title="Pindai faktur yang sudah ada dan setel nomor berikutnya ke nilai tertinggi + 1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Sinkronkan Counter dari Riwayat</span>
                </button>
              </div>

              {syncedCounterMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncedCounterMsg}</span>
                </div>
              )}

              {/* Interactive Live Preview Box */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">
                      Pratinjau Nomor Faktur Otomatis
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Live Auto-Increment
                  </span>
                </div>

                {/* Primary Spotlight Number */}
                <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Dokumen Faktur Berikutnya yang Akan Dibuat:
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-black text-sky-400 tracking-wider">
                      {previewNext1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
                    <span className="text-slate-500">Urutan:</span>
                    <span className="font-mono font-bold text-amber-300">#{numConfig.nextNumber}</span>
                  </div>
                </div>

                {/* Next In Line Simulation */}
                <div className="text-[11px] text-slate-400 pt-1 flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="text-slate-500 font-semibold">Simulasi Dokumen Lanjutan:</span>
                  <div className="flex items-center gap-1.5 font-mono text-slate-300">
                    <span className="text-slate-500">2.</span>
                    <span className="text-slate-200">{previewNext2}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <div className="flex items-center gap-1.5 font-mono text-slate-300">
                    <span className="text-slate-500">3.</span>
                    <span className="text-slate-200">{previewNext3}</span>
                  </div>
                </div>
              </div>

              {/* Presets Quick Selector */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                  Pilih Format Standar (Preset Siap Pakai)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {NUMBERING_PRESETS.map((preset) => {
                    const presetPreview = formatInvoiceNumber(
                      { ...numConfig, ...preset.config },
                      numConfig.nextNumber
                    );
                    const isSelected = 
                      !numConfig.useCustomPattern &&
                      preset.config.prefix === numConfig.prefix &&
                      preset.config.separator === numConfig.separator &&
                      Boolean(preset.config.includeYear) === Boolean(numConfig.includeYear) &&
                      Boolean(preset.config.includeMonth) === Boolean(numConfig.includeMonth) &&
                      (preset.config.monthFormat || 'MM') === numConfig.monthFormat;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset.config)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 text-sky-950'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{preset.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{preset.description}</p>
                        </div>
                        <div className="font-mono text-xs font-bold text-sky-700 mt-2 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60 inline-block w-fit">
                          {presetPreview}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Configuration Controls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-xs text-slate-800 uppercase flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-sky-600" />
                    Penyesuaian Komponen Format
                  </span>

                  {/* Toggle Custom Pattern Mode */}
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={numConfig.useCustomPattern}
                      onChange={(e) => handleNumConfigChange('useCustomPattern', e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Mode Pola Kustom (Advanced)</span>
                  </label>
                </div>

                {numConfig.useCustomPattern ? (
                  /* Custom Pattern Input */
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Pola Template Kustom
                      </label>
                      <input
                        type="text"
                        value={numConfig.customPattern || '{PREFIX}-{YYYY}-{MM}-{NNN}'}
                        onChange={(e) => handleNumConfigChange('customPattern', e.target.value)}
                        placeholder="{PREFIX}-{YYYY}-{MM}-{NNN}"
                        className="w-full font-mono text-xs font-bold border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] space-y-1.5">
                      <span className="font-bold text-slate-800 block text-xs">Variabel Token yang Didukung:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[10px]">
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{PREFIX}'}</code>: Awalan</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{SUFFIX}'}</code>: Akhiran</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{YYYY}'}</code>: 2026</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{YY}'}</code>: 26</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{MM}'}</code>: 08</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{ROMAN_MM}'}</code>: VIII</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{DD}'}</code>: 28</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{NNN}'}</code>: 001</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{NNNN}'}</code>: 0001</div>
                        <div><code className="bg-slate-100 px-1 py-0.5 rounded text-sky-700 font-bold">{'{N}'}</code>: 1</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard GUI Builder */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Prefix */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Awalan (Prefix)
                      </label>
                      <input
                        type="text"
                        value={numConfig.prefix}
                        onChange={(e) => handleNumConfigChange('prefix', e.target.value)}
                        placeholder="Contoh: INV atau FP"
                        className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:border-sky-500 font-mono"
                      />
                    </div>

                    {/* Suffix */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Akhiran (Suffix Opsional)
                      </label>
                      <input
                        type="text"
                        value={numConfig.suffix || ''}
                        onChange={(e) => handleNumConfigChange('suffix', e.target.value)}
                        placeholder="Contoh: /JKT atau -ID"
                        className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:border-sky-500 font-mono"
                      />
                    </div>

                    {/* Separator */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Karakter Pemisah (Separator)
                      </label>
                      <select
                        value={numConfig.separator}
                        onChange={(e) => handleNumConfigChange('separator', e.target.value)}
                        className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:border-sky-500"
                      >
                        <option value="-">Strip ( - ) Contoh: INV-001</option>
                        <option value="/">Garis Miring ( / ) Contoh: INV/001</option>
                        <option value=".">Titik ( . ) Contoh: INV.001</option>
                        <option value="_">Underscore ( _ ) Contoh: INV_001</option>
                        <option value="">Tanpa Pemisah Contoh: INV001</option>
                      </select>
                    </div>

                    {/* Padding Digits */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Panjang Digit Angka
                      </label>
                      <select
                        value={numConfig.paddingDigits}
                        onChange={(e) => handleNumConfigChange('paddingDigits', parseInt(e.target.value, 10) || 3)}
                        className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:border-sky-500 font-mono"
                      >
                        <option value={2}>2 Digit (Contoh: 01, 02, ...)</option>
                        <option value={3}>3 Digit (Contoh: 001, 002, ...)</option>
                        <option value={4}>4 Digit (Contoh: 0001, 0002, ...)</option>
                        <option value={5}>5 Digit (Contoh: 00001, 00002, ...)</option>
                        <option value={1}>1 Digit / Tanpa Nol (Contoh: 1, 2, ...)</option>
                      </select>
                    </div>

                    {/* Next Number Counter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nomor Urut Berikutnya (Counter)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={numConfig.nextNumber}
                        onChange={(e) => handleNumConfigChange('nextNumber', Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full font-mono font-black border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-hidden focus:border-sky-500 text-sky-700"
                      />
                    </div>

                    {/* Date Components */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Elemen Tanggal / Waktu
                      </label>
                      
                      <div className="space-y-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={numConfig.includeYear}
                            onChange={(e) => handleNumConfigChange('includeYear', e.target.checked)}
                            className="rounded text-sky-600"
                          />
                          <span>Sertakan Tahun</span>
                          {numConfig.includeYear && (
                            <select
                              value={numConfig.yearFormat}
                              onChange={(e) => handleNumConfigChange('yearFormat', e.target.value as 'YYYY' | 'YY')}
                              className="text-[10px] font-bold border border-slate-300 rounded px-1.5 py-0.5 ml-auto bg-white"
                            >
                              <option value="YYYY">YYYY (2026)</option>
                              <option value="YY">YY (26)</option>
                            </select>
                          )}
                        </label>

                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={numConfig.includeMonth}
                            onChange={(e) => handleNumConfigChange('includeMonth', e.target.checked)}
                            className="rounded text-sky-600"
                          />
                          <span>Sertakan Bulan</span>
                          {numConfig.includeMonth && (
                            <select
                              value={numConfig.monthFormat}
                              onChange={(e) => handleNumConfigChange('monthFormat', e.target.value as 'MM' | 'ROMAN')}
                              className="text-[10px] font-bold border border-slate-300 rounded px-1.5 py-0.5 ml-auto bg-white"
                            >
                              <option value="MM">Angka (08)</option>
                              <option value="ROMAN">Romawi (VIII)</option>
                            </select>
                          )}
                        </label>

                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={numConfig.includeDay}
                            onChange={(e) => handleNumConfigChange('includeDay', e.target.checked)}
                            className="rounded text-sky-600"
                          />
                          <span>Sertakan Tanggal (DD)</span>
                        </label>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Explanation Note */}
              <div className="bg-sky-50/60 p-3 rounded-xl border border-sky-200/60 flex items-start gap-2.5 text-[11px] text-sky-900">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Otomatisasi Penuh:</strong> Setiap kali Abang membuat faktur baru di Tab Editor atau melalui Kasir POS Cepat, nomor faktur otomatis bertambah 1 dari nomor counter <span className="font-mono font-bold text-sky-800">#{numConfig.nextNumber}</span> dan disimpan permanen.
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: COMPANY PROFILE                                    */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    Profil Usaha / Perusahaan Penerbit
                  </h4>
                  <p className="text-slate-500 text-[11px]">Identitas default ini otomatis muncul di bagian kop faktur baru.</p>
                </div>
                {savedSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Tersimpan
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Perusahaan / Bisnis</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Slogan / Tagline</label>
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) => handleProfileChange('tagline', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Alamat Kantor</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Kota & Kodepos</label>
                  <div className="flex gap-2 mt-0.5">
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => handleProfileChange('city', e.target.value)}
                      className="w-2/3 border border-slate-300 rounded-lg px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                      placeholder="Kota"
                    />
                    <input
                      type="text"
                      value={profile.postalCode}
                      onChange={(e) => handleProfileChange('postalCode', e.target.value)}
                      className="w-1/3 border border-slate-300 rounded-lg px-2 py-1.5 focus:border-sky-500 focus:outline-none"
                      placeholder="Kodepos"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">NPWP Perusahaan</label>
                  <input
                    type="text"
                    value={profile.npwp}
                    onChange={(e) => handleProfileChange('npwp', e.target.value)}
                    className="w-full font-mono border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">No. Telepon</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Email & Website</label>
                  <input
                    type="text"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 mt-0.5 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Profil Default</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 3: MYSQL DATABASE INTEGRATION                         */}
          {/* ========================================================= */}
          {activeTab === 'mysql' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4.5 border border-slate-800 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-sm text-white">Integrasi Database MySQL Server</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {mysqlStatus?.connected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Terhubung (Online)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Offline (Penyimpanan Lokal Aktif)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Host Server:</span>
                    <span className="text-sky-300 font-bold">{mysqlStatus?.host || dbForm.host}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Username / DB:</span>
                    <span className="text-slate-200 font-semibold">{mysqlStatus?.user || dbForm.user} / {mysqlStatus?.database || dbForm.database}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Port:</span>
                    <span className="text-slate-200 font-semibold">{mysqlStatus?.port || dbForm.port}</span>
                  </div>
                </div>

                {/* Edit Database Connection Parameters Form */}
                {isEditingDbConfig ? (
                  <form onSubmit={handleSaveDbConfig} className="p-3.5 bg-slate-950/90 rounded-lg border border-slate-700 space-y-3">
                    <span className="font-bold text-xs text-sky-400 block">Edit Parameter Koneksi MySQL</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Host Database</label>
                        <input
                          type="text"
                          value={dbForm.host}
                          onChange={(e) => setDbForm((f) => ({ ...f, host: e.target.value }))}
                          placeholder="sql.nufat.id"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Port</label>
                        <input
                          type="number"
                          value={dbForm.port}
                          onChange={(e) => setDbForm((f) => ({ ...f, port: parseInt(e.target.value, 10) || 3306 }))}
                          placeholder="3306"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Username</label>
                        <input
                          type="text"
                          value={dbForm.user}
                          onChange={(e) => setDbForm((f) => ({ ...f, user: e.target.value }))}
                          placeholder="nufat"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Password</label>
                        <input
                          type="password"
                          value={dbForm.password}
                          onChange={(e) => setDbForm((f) => ({ ...f, password: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Database Name</label>
                        <input
                          type="text"
                          value={dbForm.database}
                          onChange={(e) => setDbForm((f) => ({ ...f, database: e.target.value }))}
                          placeholder="nufat"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-sky-500 font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingDbConfig(false)}
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={syncingAction === 'config'}
                        className="px-3.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {syncingAction === 'config' && <RefreshCw className="w-3 h-3 animate-spin" />}
                        <span>Simpan & Tes Koneksi</span>
                      </button>
                    </div>
                  </form>
                ) : null}

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sistem telah terkonfigurasi dengan server MySQL <strong className="text-slate-200">{mysqlStatus?.host || 'sql.nufat.id'}</strong>. Ketika server database aktif, data faktur disinkronkan otomatis.
                </p>

                {syncResultMsg && (
                  <div className="p-2.5 rounded-lg bg-sky-950/80 border border-sky-700/60 text-sky-200 font-medium text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{syncResultMsg}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestMySQL}
                    disabled={syncingAction !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition border border-slate-700 text-xs cursor-pointer disabled:opacity-50"
                  >
                    {syncingAction === 'test' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    ) : (
                      <Server className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span>Uji Koneksi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingDbConfig(!isEditingDbConfig)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition border border-slate-700 text-xs cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isEditingDbConfig ? 'Tutup Konfigurasi' : 'Ubah Parameter Host/Port'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePushMySQL}
                    disabled={syncingAction !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-xs text-xs cursor-pointer disabled:opacity-50"
                  >
                    {syncingAction === 'push' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>Sinkronkan ke Cloud MySQL</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullMySQL}
                    disabled={syncingAction !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition border border-slate-700 text-xs cursor-pointer disabled:opacity-50"
                  >
                    {syncingAction === 'pull' ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Tarik Data Terbaru</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: BACKUP & RESTORE / RESET                           */}
          {/* ========================================================= */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Backup & Restore Section */}
              <div className="space-y-3">
                <span className="font-extrabold text-sm text-slate-900 block">
                  Cadangan & Pemulihan Berkas Lokal (Backup / Restore JSON)
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Unduh salinan cadangan lengkap mencakup semua faktur, katalog produk, data klien, profil usaha, dan konfigurasi penomoran faktur.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onExportAllData}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    Unduh Berkas Backup (JSON)
                  </button>

                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition border border-slate-300 cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-600" />
                    Pilih Berkas JSON untuk Restore
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {importJsonText && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 mt-3">
                    <div className="font-bold text-slate-800">Pratinjau JSON yang akan diimport:</div>
                    <textarea
                      rows={3}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      className="w-full font-mono text-[10px] border border-slate-200 bg-white p-2 rounded"
                    />
                    <button
                      type="button"
                      onClick={handleImport}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer"
                    >
                      Eksekusi Restore Data
                    </button>
                  </div>
                )}

                {importStatus && (
                  <div className="text-xs font-bold text-sky-700 bg-sky-50 p-2 rounded border border-sky-200">
                    {importStatus}
                  </div>
                )}
              </div>

              {/* Reset to Defaults */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Reset Data Sampel</div>
                  <div className="text-slate-400 text-[11px]">Kembalikan ke faktur dan katalog contoh bawaan sistem.</div>
                </div>

                {showResetConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onResetToDefaults();
                        setShowResetConfirm(false);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded cursor-pointer"
                    >
                      Ya, Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2 py-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Data
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            {activeTab === 'numbering' ? (
              <span>Nomor Berikutnya: <strong className="text-sky-700 font-bold">{previewNext1}</strong></span>
            ) : (
              <span>Faktur Pro v2.0</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-sm cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
