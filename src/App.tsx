/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useInvoiceStore } from './utils/useInvoiceStore';
import { HeaderBar, AppTab } from './components/HeaderBar';
import { CloudSyncBanner } from './components/CloudSyncBanner';
import { InteractiveInvoiceEditor } from './components/InteractiveInvoiceEditor';
import { InvoiceHistoryList } from './components/InvoiceHistoryList';
import { SalesDashboard } from './components/SalesDashboard';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { ClientContactsModal } from './components/ClientContactsModal';
import { QuickPosModal } from './components/QuickPosModal';
import { SettingsModal } from './components/SettingsModal';
import { HtmlCodeModal } from './components/HtmlCodeModal';
import { InvoiceData } from './types';
import { generateStandaloneHtml } from './utils/generateStandaloneHtml';
import { downloadInvoicePDF } from './utils/pdfGenerator';

export default function App() {
  const store = useInvoiceStore();
  const [activeTab, setActiveTab] = useState<AppTab>('editor');

  // Modals visibility
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isClientsOpen, setIsClientsOpen] = useState(false);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeModalInvoice, setCodeModalInvoice] = useState<InvoiceData | null>(null);

  // Quick Print
  const handlePrint = (invoice?: InvoiceData) => {
    if (invoice && invoice.id !== store.currentInvoice.id) {
      store.setCurrentInvoiceId(invoice.id);
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Direct PDF Download
  const handleDownloadPdf = async (invoice?: InvoiceData) => {
    const targetInvoice = invoice || store.currentInvoice;
    await downloadInvoicePDF(targetInvoice);
  };

  // Standalone HTML Download
  const handleDownloadHtml = (invoice: InvoiceData) => {
    const html = generateStandaloneHtml(invoice);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoice.invoiceNumber.replace(/[\/\\]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Open HTML viewer modal for specific invoice
  const handleViewHtml = (invoice: InvoiceData) => {
    setCodeModalInvoice(invoice);
    setIsCodeModalOpen(true);
  };

  // Quick POS Sales checkout
  const handleCreateSaleInvoice = (data: Partial<InvoiceData>) => {
    const newInv = store.createNewInvoice(data);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col antialiased text-slate-900 font-sans">
      {/* Sticky Header Bar with Navigation Tabs, User Auth & Fast Actions */}
      <HeaderBar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'catalog') {
            setIsCatalogOpen(true);
          } else if (tab === 'clients') {
            setIsClientsOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        invoicesCount={store.invoices.length}
        onNewInvoice={() => {
          store.createNewInvoice();
          setActiveTab('editor');
        }}
        onOpenPos={() => setIsPosOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={store.currentUser}
        authLoading={store.authLoading}
        onSignInWithGoogle={store.signInWithGoogle}
        onLogout={store.logout}
        cloudSyncStatus={store.cloudSyncStatus}
        lastCloudSyncTime={store.lastCloudSyncTime}
        mysqlStatus={store.mysqlStatus}
      />

      {/* Cloud Sync Announcement & Guest Banner */}
      <CloudSyncBanner
        currentUser={store.currentUser}
        authLoading={store.authLoading}
        onSignInWithGoogle={store.signInWithGoogle}
        invoicesCount={store.invoices.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: Interactive Invoice Generator & Editor */}
        {activeTab === 'editor' && (
          <InteractiveInvoiceEditor
            invoice={store.currentInvoice}
            products={store.products}
            clients={store.clients}
            onUpdateInvoice={store.updateInvoice}
            onNewInvoice={() => store.createNewInvoice()}
            onSaveInvoice={store.updateInvoice}
            onPrint={() => handlePrint(store.currentInvoice)}
            onDownloadPdf={() => handleDownloadPdf(store.currentInvoice)}
            onExportHtml={() => handleDownloadHtml(store.currentInvoice)}
            onOpenCodeModal={() => handleViewHtml(store.currentInvoice)}
            onOpenCatalog={() => setIsCatalogOpen(true)}
            onOpenClients={() => setIsClientsOpen(true)}
          />
        )}

        {/* TAB 2: Invoices History & Management Database */}
        {activeTab === 'invoices' && (
          <InvoiceHistoryList
            invoices={store.invoices}
            currentInvoiceId={store.currentInvoiceId}
            onSelectInvoice={(id) => {
              store.setCurrentInvoiceId(id);
              setActiveTab('editor');
            }}
            onNewInvoice={() => {
              store.createNewInvoice();
              setActiveTab('editor');
            }}
            onDuplicateInvoice={(id) => {
              store.duplicateInvoice(id);
              setActiveTab('editor');
            }}
            onDeleteInvoice={store.deleteInvoice}
            onUpdateStatus={store.updateInvoiceStatus}
            onExportSalesCSV={store.exportSalesCSV}
            onExportHtml={handleDownloadHtml}
            onDownloadPdf={(inv) => handleDownloadPdf(inv)}
            onPrintInvoice={(inv) => handlePrint(inv)}
            currentUser={store.currentUser}
            onSignInWithGoogle={store.signInWithGoogle}
          />
        )}

        {/* TAB 3: Sales Dashboard & Reporting */}
        {activeTab === 'sales' && (
          <SalesDashboard
            invoices={store.invoices}
            products={store.products}
            onOpenNewInvoice={() => {
              store.createNewInvoice();
              setActiveTab('editor');
            }}
            onOpenPos={() => setIsPosOpen(true)}
            onExportSalesCSV={store.exportSalesCSV}
            onSelectInvoice={(id) => {
              store.setCurrentInvoiceId(id);
              setActiveTab('editor');
            }}
          />
        )}
      </main>

      {/* Modal 1: Master Product Catalog */}
      <ProductCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        products={store.products}
        onAddProduct={store.addProduct}
        onUpdateProduct={store.updateProduct}
        onDeleteProduct={store.deleteProduct}
      />

      {/* Modal 2: Master Clients & Contacts */}
      <ClientContactsModal
        isOpen={isClientsOpen}
        onClose={() => setIsClientsOpen(false)}
        clients={store.clients}
        onAddClient={store.addClient}
        onUpdateClient={store.updateClient}
        onDeleteClient={store.deleteClient}
      />

      {/* Modal 3: Quick POS Cashier */}
      <QuickPosModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        products={store.products}
        clients={store.clients}
        onCreateSaleInvoice={handleCreateSaleInvoice}
      />

      {/* Modal 4: Settings & Data Backup / Restore & Global Numbering */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={store.currentUser}
        authLoading={store.authLoading}
        onSignInWithGoogle={store.signInWithGoogle}
        onLogout={store.logout}
        cloudSyncStatus={store.cloudSyncStatus}
        lastCloudSyncTime={store.lastCloudSyncTime}
        billerProfile={store.billerProfile}
        onSaveBillerProfile={store.setBillerProfile}
        numberingConfig={store.numberingConfig}
        onUpdateNumberingConfig={store.updateNumberingConfig}
        onSyncCounterWithHighestInvoice={store.syncCounterWithHighestInvoice}
        onExportAllData={store.exportAllDataJSON}
        onImportAllData={store.importAllDataJSON}
        onResetToDefaults={store.resetToDefaults}
        mysqlStatus={store.mysqlStatus}
        onTestMySQL={store.checkMySQLStatus}
        onUpdateMySQLConfig={store.updateMySQLConfig}
        onSyncAllToMySQL={store.syncAllToMySQL}
        onFetchFromMySQL={store.fetchFromMySQL}
      />

      {/* Modal 5: HTML Code Inspector */}
      {isCodeModalOpen && (
        <HtmlCodeModal
          isOpen={isCodeModalOpen}
          onClose={() => setIsCodeModalOpen(false)}
          data={codeModalInvoice || store.currentInvoice}
        />
      )}
    </div>
  );
}
