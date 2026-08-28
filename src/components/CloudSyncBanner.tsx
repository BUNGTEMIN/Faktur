import React, { useState } from 'react';
import { ShieldCheck, Cloud, LogIn, X, CheckCircle, Sparkles, Database } from 'lucide-react';
import { User } from '../lib/firebase';

interface CloudSyncBannerProps {
  currentUser: User | null;
  authLoading: boolean;
  onSignInWithGoogle: () => void;
  invoicesCount: number;
}

export const CloudSyncBanner: React.FC<CloudSyncBannerProps> = ({
  currentUser,
  authLoading,
  onSignInWithGoogle,
  invoicesCount,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (authLoading || isDismissed) return null;

  if (currentUser) {
    return null; // When logged in, header bar shows status cleanly
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-sky-800/40 text-white px-4 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 text-xs text-slate-200 text-center sm:text-left">
          <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
            <Cloud className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-white">Mode Tamu Publik:</span>{' '}
            <span className="text-slate-300">
              Masuk dengan akun Google agar setiap faktur, produk, dan kontak otomatis tersimpan di database privat akun Anda.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSignInWithGoogle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
            <span>Masuk dengan Google</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
            title="Tutup pemberitahuan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
