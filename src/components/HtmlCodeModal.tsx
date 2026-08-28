import React, { useState } from 'react';
import { X, Copy, Check, Download, Code2, FileCode, FileDown, Loader2 } from 'lucide-react';
import { InvoiceData } from '../types';
import { generateStandaloneHtml } from '../utils/generateStandaloneHtml';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

interface HtmlCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData;
}

export const HtmlCodeModal: React.FC<HtmlCodeModalProps> = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  if (!isOpen) return null;

  const htmlCode = generateStandaloneHtml(data);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${data.invoiceNumber.replace(/[\/\\]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      await downloadInvoicePDF(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between bg-slate-950/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Kode HTML Standalone (1 File Lengkap Siap Cetak A4)
              </h2>
              <p className="text-xs text-slate-400">
                100% mandiri dengan CSS terintegrasi, responsif cetak, dan tanpa ketergantungan library eksternal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-75 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isPdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>{isPdfLoading ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Salin HTML</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh .html</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Code Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 select-all leading-relaxed">
          <pre className="whitespace-pre">
            <code>{htmlCode}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            💡 <span className="text-slate-300 font-medium">Tips:</span> Anda dapat langsung menyimpan file ini sebagai <code className="text-sky-400">faktur.html</code> dan membukanya di browser manapun, atau mengonversinya menjadi PDF via print browser.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
