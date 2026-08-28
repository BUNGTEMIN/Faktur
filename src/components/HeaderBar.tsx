import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  History, 
  TrendingUp, 
  Package, 
  Users, 
  Settings, 
  Plus, 
  ShoppingCart, 
  RefreshCw, 
  LogOut,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { MySQLStatus, CloudSyncStatus } from '../utils/useInvoiceStore';
import { User } from '../lib/firebase';

export type AppTab = 'editor' | 'invoices' | 'sales' | 'catalog' | 'clients';

interface HeaderBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  invoicesCount: number;
  onNewInvoice: () => void;
  onOpenPos: () => void;
  onOpenSettings: () => void;
  currentUser: User | null;
  authLoading: boolean;
  onSignInWithGoogle: () => void;
  onLogout: () => void;
  cloudSyncStatus: CloudSyncStatus;
  lastCloudSyncTime: string | null;
  mysqlStatus?: MySQLStatus;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  setActiveTab,
  invoicesCount,
  onNewInvoice,
  onOpenPos,
  onOpenSettings,
  currentUser,
  authLoading,
  onSignInWithGoogle,
  onLogout,
  cloudSyncStatus,
  lastCloudSyncTime,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const masterMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (masterMenuRef.current && !masterMenuRef.current.contains(event.target as Node)) {
        setIsMasterMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-15 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none group" 
            onClick={() => setActiveTab('editor')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-xs group-hover:scale-105 transition">
              FP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white leading-none">
                  Faktur Pro
                </span>
                <span className="text-[9px] bg-sky-500/15 text-sky-400 font-bold px-1.5 py-0.5 rounded border border-sky-500/30">
                  Cloud
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-1 hidden xl:block">
                Layanan Faktur Publik Multi-User
              </p>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Sleek Segmented Pill Control) */}
        <nav className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs shadow-inner">
          {/* Tab 1: Editor */}
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          {/* Tab 2: Riwayat Faktur */}
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'invoices' ? 'bg-sky-800 text-sky-100' : 'bg-slate-700 text-sky-300'
            }`}>
              {invoicesCount}
            </span>
          </button>

          {/* Tab 3: Penjualan Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Penjualan</span>
          </button>

          {/* Tab 4: Master Data Dropdown (Katalog & Pelanggan) */}
          <div className="relative" ref={masterMenuRef}>
            <button
              type="button"
              onClick={() => setIsMasterMenuOpen(!isMasterMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                isMasterMenuOpen 
                  ? 'bg-slate-700 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Master Data</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isMasterMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Master Data Dropdown Box */}
            {isMasterMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMasterMenuOpen(false);
                    setActiveTab('catalog');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Package className="w-4 h-4 text-sky-400" />
                  <div>
                    <span className="block font-bold">Katalog Produk</span>
                    <span className="text-[10px] text-slate-400 font-normal">Daftar harga & SKU barang</span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-700/60" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMasterMenuOpen(false);
                    setActiveTab('clients');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="block font-bold">Buku Pelanggan</span>
                    <span className="text-[10px] text-slate-400 font-normal">Kontak & data penagihan</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Actions, POS & Google Authentication */}
        <div className="flex items-center gap-2">
          
          {/* Quick POS Button (Desktop/Tablet) */}
          <button
            type="button"
            onClick={onOpenPos}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer border border-emerald-500/40"
            title="Buka Kasir Penjualan Cepat"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Kasir POS</span>
          </button>

          {/* New Invoice Button (Accent) */}
          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-extrabold transition shadow-xs cursor-pointer"
            title="Buat Faktur Baru"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Faktur Baru</span>
          </button>

          {/* Settings / Gear Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition cursor-pointer"
            title="Pengaturan Format Penomoran, Profil & Database"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Google Auth & User Profile Section */}
          <div className="relative" ref={userMenuRef}>
            {authLoading ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              </div>
            ) : currentUser ? (
              /* Logged In Google User Dropdown Button */
              <div>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700/90 border border-slate-700 transition cursor-pointer"
                  title="Menu Akun & Database Pribadi"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User Avatar'} 
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-sky-500"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left hidden lg:block max-w-[110px]">
                    <span className="text-[11px] font-bold text-slate-200 block truncate leading-tight">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 leading-none mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Tersinkron
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                      <div className="flex items-center gap-2.5">
                        {currentUser.photoURL ? (
                          <img 
                            src={currentUser.photoURL} 
                            alt="User" 
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-sky-500/30"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-black text-sm flex items-center justify-center">
                            {(currentUser.displayName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {currentUser.displayName || 'Pengguna Faktur Pro'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Database Privat:
                        </span>
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200/60">
                          Aktif (UID Terisolasi)
                        </span>
                      </div>
                    </div>

                    {/* Status Info */}
                    <div className="px-4 py-2 text-[11px] space-y-1.5 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status Sinkronisasi:</span>
                        <span className="font-bold flex items-center gap-1 text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Real-time Firestore
                        </span>
                      </div>
                      {lastCloudSyncTime && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Terakhir Sinkron:</span>
                          <span className="font-mono text-slate-600">{lastCloudSyncTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Menu Actions */}
                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenSettings();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pengaturan Penomoran & Usaha</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Keluar (Sign Out)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not Logged In -> Google Sign In Button */
              <button
                type="button"
                onClick={onSignInWithGoogle}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold transition shadow-xs cursor-pointer border border-slate-200"
                title="Masuk dengan Google untuk menyimpan faktur di database pribadi Anda"
              >
                {/* Official Google 'G' Icon */}
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                <span className="hidden sm:inline">Masuk Google</span>
                <span className="sm:hidden">Masuk</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 md:hidden bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition cursor-pointer"
            title="Menu Navigasi Mobile"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer Navigation (When open on mobile screens) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/98 px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150 shadow-xl">
          <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('editor');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'editor' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Editor Faktur</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('invoices');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'invoices' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <span>Riwayat</span>
              </div>
              <span className="bg-slate-700 text-sky-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {invoicesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('sales');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'sales' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Penjualan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenPos();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900 transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Kasir POS</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('catalog');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <Package className="w-4 h-4 text-sky-400" />
              <span>Katalog Produk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('clients');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Buku Pelanggan</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
