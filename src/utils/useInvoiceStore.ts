import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  InvoiceData, 
  ProductItem, 
  ClientProfile, 
  CompanyProfile, 
  PaymentStatus, 
  InvoiceNumberingConfig 
} from '../types';
import { initialInvoices, sampleProducts, sampleClients, defaultBillerProfile } from '../data/defaultInvoiceData';
import { defaultNumberingConfig, formatInvoiceNumber } from './numberingHelper';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  fbSignOut, 
  onAuthStateChanged, 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  User 
} from '../lib/firebase';

export interface MySQLStatus {
  connected: boolean;
  loading: boolean;
  host: string;
  port?: number;
  user: string;
  database: string;
  message?: string;
  error?: string;
  lastSynced?: string;
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'saved' | 'error';

const STORAGE_KEYS = {
  INVOICES: 'faktur_pro_invoices_v2',
  PRODUCTS: 'faktur_pro_products_v2',
  CLIENTS: 'faktur_pro_clients_v2',
  BILLER: 'faktur_pro_biller_v2',
  CURRENT_ID: 'faktur_pro_current_id_v2',
  NUMBERING: 'faktur_pro_numbering_v2',
};

// Helper to remove any undefined fields before sending to Firestore
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export function useInvoiceStore() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);

  // MySQL Status
  const [mysqlStatus, setMysqlStatus] = useState<MySQLStatus>({
    connected: false,
    loading: true,
    host: 'sql.nufat.id',
    user: 'nufat',
    database: 'nufat',
  });

  // Main entity states
  const [invoices, setInvoices] = useState<InvoiceData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading invoices from storage', e);
    }
    return initialInvoices;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading products from storage', e);
    }
    return sampleProducts;
  });

  const [clients, setClients] = useState<ClientProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading clients from storage', e);
    }
    return sampleClients;
  });

  const [billerProfile, setBillerProfileState] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
    } catch (e) {
      console.error('Error loading biller profile', e);
    }
    return defaultBillerProfile;
  });

  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ID);
      if (saved) return saved;
    } catch (e) {
      console.error('Error loading current id', e);
    }
    return initialInvoices[0]?.id || 'inv-0429';
  });

  const [numberingConfig, setNumberingConfigState] = useState<InvoiceNumberingConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NUMBERING);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.nextNumber === 'number') {
          return { ...defaultNumberingConfig, ...parsed };
        }
      }
    } catch (e) {
      console.error('Error loading numbering config', e);
    }
    return defaultNumberingConfig;
  });

  // Reference to current user to avoid stale closures
  const userRef = useRef<User | null>(null);
  userRef.current = currentUser;

  // Track if we are currently hydrating from Firestore to prevent echoing writes back
  const isHydratingFromFirestore = useRef(false);

  // --------------------------------------------------------------------------
  // FIREBASE AUTHENTICATION (Google Login & Sign Out)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        // Save user profile metadata to Firestore
        const userDocRef = doc(db, 'users', user.uid);
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Pengguna Faktur Pro',
          photoURL: user.photoURL || '',
          lastLoginAt: new Date().toISOString(),
        }, { merge: true }).catch((err) => {
          console.error('Error updating user profile in Firestore:', err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setCloudSyncStatus('syncing');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setCloudSyncStatus('saved');
      setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      return result.user;
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      let msg = error.message || 'Gagal masuk dengan Google';
      if (error.code === 'auth/popup-closed-by-user') {
        msg = 'Jendela login Google ditutup sebelum selesai.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        msg = 'Permintaan login dibatalkan.';
      }
      setAuthError(msg);
      setCloudSyncStatus('error');
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    setCloudSyncStatus('idle');
    try {
      await fbSignOut(auth);
      setCurrentUser(null);
      // Reset to default sample state when logging out
      setInvoices(initialInvoices);
      setProducts(sampleProducts);
      setClients(sampleClients);
      setBillerProfileState(defaultBillerProfile);
      setNumberingConfigState(defaultNumberingConfig);
      setCurrentInvoiceId(initialInvoices[0]?.id || 'inv-0429');
    } catch (error: any) {
      console.error('Sign Out Error:', error);
    }
  }, []);

  // --------------------------------------------------------------------------
  // PER-USER FIRESTORE REAL-TIME SYNCHRONIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) {
      // Guest mode - persistence handled by localStorage
      return;
    }

    const uid = currentUser.uid;
    isHydratingFromFirestore.current = true;
    setCloudSyncStatus('syncing');

    // 1. Listen to user's invoices
    const invoicesRef = collection(db, 'users', uid, 'invoices');
    const unsubInvoices = onSnapshot(invoicesRef, (snapshot) => {
      if (snapshot.empty) {
        // If the user's Firestore is empty (new account), seed with starter invoices or current local invoices
        const initialToSeed = invoices.length > 0 ? invoices : initialInvoices;
        const batch = writeBatch(db);
        initialToSeed.forEach((inv) => {
          const docRef = doc(db, 'users', uid, 'invoices', inv.id);
          batch.set(docRef, sanitizeForFirestore(inv));
        });
        batch.commit().then(() => {
          setCloudSyncStatus('saved');
          setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }).catch(() => {});
      } else {
        const loadedInvoices: InvoiceData[] = [];
        snapshot.forEach((d) => {
          loadedInvoices.push(d.data() as InvoiceData);
        });

        // Sort by issueDate or createdAt descending
        loadedInvoices.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.issueDate).getTime();
          const dateB = new Date(b.createdAt || b.issueDate).getTime();
          return dateB - dateA;
        });

        setInvoices(loadedInvoices);
        if (loadedInvoices.length > 0) {
          setCurrentInvoiceId((prev) => {
            const stillExists = loadedInvoices.some((inv) => inv.id === prev);
            return stillExists ? prev : loadedInvoices[0].id;
          });
        }
        setCloudSyncStatus('saved');
        setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }
      isHydratingFromFirestore.current = false;
    }, (err) => {
      console.error('Firestore invoices error:', err);
      setCloudSyncStatus('error');
      isHydratingFromFirestore.current = false;
    });

    // 2. Listen to user's products
    const productsRef = collection(db, 'users', uid, 'products');
    const unsubProducts = onSnapshot(productsRef, (snapshot) => {
      if (!snapshot.empty) {
        const loadedProds: ProductItem[] = [];
        snapshot.forEach((d) => loadedProds.push(d.data() as ProductItem));
        setProducts(loadedProds);
      } else {
        // Seed default products
        const batch = writeBatch(db);
        sampleProducts.forEach((p) => {
          const docRef = doc(db, 'users', uid, 'products', p.id);
          batch.set(docRef, sanitizeForFirestore(p));
        });
        batch.commit().catch(() => {});
      }
    });

    // 3. Listen to user's clients
    const clientsRef = collection(db, 'users', uid, 'clients');
    const unsubClients = onSnapshot(clientsRef, (snapshot) => {
      if (!snapshot.empty) {
        const loadedClients: ClientProfile[] = [];
        snapshot.forEach((d) => loadedClients.push(d.data() as ClientProfile));
        setClients(loadedClients);
      } else {
        // Seed default clients
        const batch = writeBatch(db);
        sampleClients.forEach((c) => {
          const docRef = doc(db, 'users', uid, 'clients', c.id);
          batch.set(docRef, sanitizeForFirestore(c));
        });
        batch.commit().catch(() => {});
      }
    });

    // 4. Listen to user settings (Biller profile & Numbering config)
    const settingsDocRef = doc(db, 'users', uid, 'settings', 'config');
    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.billerProfile) {
          setBillerProfileState(data.billerProfile);
        }
        if (data.numberingConfig) {
          setNumberingConfigState(data.numberingConfig);
        }
      } else {
        // Initialize settings in Firestore
        setDoc(settingsDocRef, sanitizeForFirestore({
          billerProfile: defaultBillerProfile,
          numberingConfig: defaultNumberingConfig,
          updatedAt: new Date().toISOString(),
        })).catch(() => {});
      }
    });

    return () => {
      unsubInvoices();
      unsubProducts();
      unsubClients();
      unsubSettings();
    };
  }, [currentUser]);

  // --------------------------------------------------------------------------
  // LOCAL STORAGE PERSISTENCE (Fallback & Guest Mode)
  // --------------------------------------------------------------------------
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoices', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error('Failed to save clients', e);
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BILLER, JSON.stringify(billerProfile));
    } catch (e) {
      console.error('Failed to save biller profile', e);
    }
  }, [billerProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ID, currentInvoiceId);
    } catch (e) {
      console.error('Failed to save current id', e);
    }
  }, [currentInvoiceId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NUMBERING, JSON.stringify(numberingConfig));
    } catch (e) {
      console.error('Failed to save numbering config', e);
    }
  }, [numberingConfig]);

  // Helper to save biller profile (Local + Firestore)
  const setBillerProfile = useCallback((profile: CompanyProfile) => {
    setBillerProfileState(profile);
    const user = userRef.current;
    if (user) {
      setCloudSyncStatus('syncing');
      const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'config');
      setDoc(settingsDocRef, sanitizeForFirestore({
        billerProfile: profile,
        updatedAt: new Date().toISOString(),
      }), { merge: true }).then(() => {
        setCloudSyncStatus('saved');
        setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }).catch((err) => {
        console.error('Failed to save biller profile to Firestore:', err);
        setCloudSyncStatus('error');
      });
    }
  }, []);

  // Helper to update numbering config (Local + Firestore)
  const updateNumberingConfig = useCallback((newConfig: Partial<InvoiceNumberingConfig>) => {
    setNumberingConfigState((prev) => {
      const updated = { ...prev, ...newConfig };
      const user = userRef.current;
      if (user) {
        setCloudSyncStatus('syncing');
        const settingsDocRef = doc(db, 'users', user.uid, 'settings', 'config');
        setDoc(settingsDocRef, sanitizeForFirestore({
          numberingConfig: updated,
          updatedAt: new Date().toISOString(),
        }), { merge: true }).then(() => {
          setCloudSyncStatus('saved');
          setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }).catch((err) => {
          console.error('Failed to save numbering config to Firestore:', err);
          setCloudSyncStatus('error');
        });
      }
      return updated;
    });
  }, []);

  // Generate next sequential invoice number based on Global Numbering Config
  const generateNextInvoiceNumber = useCallback((customCounter?: number) => {
    return formatInvoiceNumber(numberingConfig, customCounter !== undefined ? customCounter : numberingConfig.nextNumber, new Date());
  }, [numberingConfig]);

  // Sync Global Numbering Counter from highest existing invoice in store
  const syncCounterWithHighestInvoice = useCallback(() => {
    let highest = 0;
    invoices.forEach((inv) => {
      const matches = inv.invoiceNumber.match(/\d+/g);
      if (matches && matches.length > 0) {
        const lastNumStr = matches[matches.length - 1];
        const val = parseInt(lastNumStr, 10);
        if (!isNaN(val) && val > highest) {
          highest = val;
        }
      }
    });

    const nextVal = highest > 0 ? highest + 1 : 1;
    updateNumberingConfig({ nextNumber: nextVal });
    return nextVal;
  }, [invoices, updateNumberingConfig]);

  // Current active invoice
  const currentInvoice = invoices.find((inv) => inv.id === currentInvoiceId) || invoices[0] || initialInvoices[0];

  // --------------------------------------------------------------------------
  // INVOICE ACTIONS (Create, Update, Duplicate, Delete, Status)
  // --------------------------------------------------------------------------
  const createNewInvoice = useCallback((override?: Partial<InvoiceData>) => {
    const today = new Date();
    const issueDate = today.toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const dueDate = due.toISOString().split('T')[0];

    const generatedNumber = override?.invoiceNumber || formatInvoiceNumber(numberingConfig, numberingConfig.nextNumber, today);

    // Auto-increment the global counter when a new invoice is created
    if (!override?.invoiceNumber) {
      updateNumberingConfig({ nextNumber: numberingConfig.nextNumber + 1 });
    }

    const newId = `inv-${Date.now()}`;
    const newInvoice: InvoiceData = {
      id: newId,
      invoiceNumber: generatedNumber,
      issueDate,
      dueDate,
      poNumber: '',
      paymentStatus: 'UNPAID',
      currency: 'IDR',
      biller: { ...billerProfile },
      client: clients[0] || sampleClients[0],
      items: [
        {
          id: 'item-1',
          description: products[0]?.name || 'Item Penjualan / Layanan',
          quantity: 1,
          unit: products[0]?.unit || 'Pcs',
          unitPrice: products[0]?.price || 100000,
        },
      ],
      discountPercent: 0,
      taxPercent: 11,
      shippingFee: 0,
      stampDuty: 10000,
      bankAccounts: [
        {
          bankName: 'Bank Central Asia (BCA)',
          accountNumber: '8830-192-800',
          accountHolder: billerProfile.name || 'PT Nusantara Karya Teknologi',
          branch: 'KCP Menara Cyber',
        },
      ],
      paymentInstructions: 'Mohon sertakan Nomor Invoice pada berita transfer dan kirimkan bukti pembayaran.',
      notes: 'Terima kasih atas kepercayaan dan transaksi Anda.',
      terms: '1. Pembayaran jatuh tempo 14 hari kalender.\n2. Pembayaran sah hanya ke rekening resmi tertera.\n3. Faktur pajak diterbitkan setelah konfirmasi lunas.',
      signeeName: 'Dra. Maya Anggraini, Ak., CA',
      signeeTitle: 'Direktur Keuangan & Kepatuhan',
      signeeCity: 'Jakarta Selatan',
      signDate: issueDate,
      hasStamp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...override,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    setCurrentInvoiceId(newId);

    // Save to user's private Firestore if logged in
    const user = userRef.current;
    if (user) {
      setCloudSyncStatus('syncing');
      const invoiceDocRef = doc(db, 'users', user.uid, 'invoices', newId);
      setDoc(invoiceDocRef, sanitizeForFirestore(newInvoice)).then(() => {
        setCloudSyncStatus('saved');
        setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }).catch((err) => {
        console.error('Firestore save error:', err);
        setCloudSyncStatus('error');
      });
    }

    // Background sync to MySQL
    fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoice),
    }).catch(() => {});

    return newInvoice;
  }, [billerProfile, clients, products, numberingConfig, updateNumberingConfig]);

  const updateInvoice = useCallback((updatedInvoice: InvoiceData) => {
    const cleanInvoice = {
      ...updatedInvoice,
      updatedAt: new Date().toISOString(),
    };

    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === cleanInvoice.id);
      if (exists) {
        return prev.map((inv) => (inv.id === cleanInvoice.id ? cleanInvoice : inv));
      }
      return [cleanInvoice, ...prev];
    });

    // Save to Firestore
    const user = userRef.current;
    if (user) {
      setCloudSyncStatus('syncing');
      const invoiceDocRef = doc(db, 'users', user.uid, 'invoices', cleanInvoice.id);
      setDoc(invoiceDocRef, sanitizeForFirestore(cleanInvoice), { merge: true }).then(() => {
        setCloudSyncStatus('saved');
        setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }).catch((err) => {
        console.error('Firestore update error:', err);
        setCloudSyncStatus('error');
      });
    }

    // Background sync to MySQL
    fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanInvoice),
    }).catch(() => {});
  }, []);

  const duplicateInvoice = useCallback((id: string) => {
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return null;

    const today = new Date().toISOString().split('T')[0];
    const newId = `inv-${Date.now()}`;
    const generatedNumber = formatInvoiceNumber(numberingConfig, numberingConfig.nextNumber, new Date());
    updateNumberingConfig({ nextNumber: numberingConfig.nextNumber + 1 });

    const cloned: InvoiceData = {
      ...target,
      id: newId,
      invoiceNumber: generatedNumber,
      issueDate: today,
      signDate: today,
      paymentStatus: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInvoices((prev) => [cloned, ...prev]);
    setCurrentInvoiceId(newId);

    // Save to Firestore
    const user = userRef.current;
    if (user) {
      setCloudSyncStatus('syncing');
      const invoiceDocRef = doc(db, 'users', user.uid, 'invoices', newId);
      setDoc(invoiceDocRef, sanitizeForFirestore(cloned)).then(() => {
        setCloudSyncStatus('saved');
        setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }).catch((err) => {
        console.error('Firestore duplicate error:', err);
        setCloudSyncStatus('error');
      });
    }

    // Background sync to MySQL
    fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cloned),
    }).catch(() => {});

    return cloned;
  }, [invoices, numberingConfig, updateNumberingConfig]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => {
      const filtered = prev.filter((inv) => inv.id !== id);
      if (currentInvoiceId === id && filtered.length > 0) {
        setCurrentInvoiceId(filtered[0].id);
      }
      return filtered;
    });

    // Delete in Firestore
    const user = userRef.current;
    if (user) {
      setCloudSyncStatus('syncing');
      const invoiceDocRef = doc(db, 'users', user.uid, 'invoices', id);
      deleteDoc(invoiceDocRef).then(() => {
        setCloudSyncStatus('saved');
        setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      }).catch((err) => {
        console.error('Firestore delete error:', err);
        setCloudSyncStatus('error');
      });
    }

    // Background delete in MySQL
    fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
    }).catch(() => {});
  }, [currentInvoiceId]);

  const updateInvoiceStatus = useCallback((id: string, status: PaymentStatus) => {
    let updatedInv: InvoiceData | null = null;
    setInvoices((prev) => {
      const updatedList = prev.map((inv) => {
        if (inv.id === id) {
          const u = { ...inv, paymentStatus: status, updatedAt: new Date().toISOString() };
          updatedInv = u;
          return u;
        }
        return inv;
      });
      return updatedList;
    });

    if (updatedInv) {
      const user = userRef.current;
      if (user) {
        const invoiceDocRef = doc(db, 'users', user.uid, 'invoices', id);
        setDoc(invoiceDocRef, sanitizeForFirestore(updatedInv), { merge: true }).catch(() => {});
      }
      fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedInv),
      }).catch(() => {});
    }
  }, []);

  // --------------------------------------------------------------------------
  // PRODUCT MANAGEMENT (Per-User Firestore)
  // --------------------------------------------------------------------------
  const addProduct = useCallback((product: Omit<ProductItem, 'id'>) => {
    const newProd: ProductItem = {
      ...product,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);

    const user = userRef.current;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'products', newProd.id);
      setDoc(docRef, sanitizeForFirestore(newProd)).catch(() => {});
    }
    return newProd;
  }, []);

  const updateProduct = useCallback((product: ProductItem) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    const user = userRef.current;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'products', product.id);
      setDoc(docRef, sanitizeForFirestore(product), { merge: true }).catch(() => {});
    }
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    const user = userRef.current;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'products', id);
      deleteDoc(docRef).catch(() => {});
    }
  }, []);

  // --------------------------------------------------------------------------
  // CLIENT MANAGEMENT (Per-User Firestore)
  // --------------------------------------------------------------------------
  const addClient = useCallback((client: Omit<ClientProfile, 'id'>) => {
    const newClient: ClientProfile = {
      ...client,
      id: `cli-${Date.now()}`,
    };
    setClients((prev) => [newClient, ...prev]);

    const user = userRef.current;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'clients', newClient.id);
      setDoc(docRef, sanitizeForFirestore(newClient)).catch(() => {});
    }
    return newClient;
  }, []);

  const updateClient = useCallback((client: ClientProfile) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    const user = userRef.current;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'clients', client.id);
      setDoc(docRef, sanitizeForFirestore(client), { merge: true }).catch(() => {});
    }
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    const user = userRef.current;
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'clients', id);
      deleteDoc(docRef).catch(() => {});
    }
  }, []);

  // --------------------------------------------------------------------------
  // BACKUP & RESTORE / EXPORT
  // --------------------------------------------------------------------------
  const exportAllDataJSON = useCallback(() => {
    const fullBackup = {
      invoices,
      products,
      clients,
      billerProfile,
      numberingConfig,
      userEmail: currentUser?.email || 'guest',
      version: '3.0',
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Faktur_Backup_${currentUser?.email ? currentUser.email.split('@')[0] + '_' : ''}${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [invoices, products, clients, billerProfile, numberingConfig, currentUser]);

  const importAllDataJSON = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.invoices && Array.isArray(parsed.invoices)) {
        setInvoices(parsed.invoices);
        if (parsed.invoices.length > 0) {
          setCurrentInvoiceId(parsed.invoices[0].id);
        }
        // Save to Firestore if user logged in
        const user = userRef.current;
        if (user) {
          const batch = writeBatch(db);
          parsed.invoices.forEach((inv: InvoiceData) => {
            const docRef = doc(db, 'users', user.uid, 'invoices', inv.id);
            batch.set(docRef, sanitizeForFirestore(inv));
          });
          batch.commit().catch(() => {});
        }
      }
      if (parsed.products && Array.isArray(parsed.products)) {
        setProducts(parsed.products);
        const user = userRef.current;
        if (user) {
          const batch = writeBatch(db);
          parsed.products.forEach((p: ProductItem) => {
            const docRef = doc(db, 'users', user.uid, 'products', p.id);
            batch.set(docRef, sanitizeForFirestore(p));
          });
          batch.commit().catch(() => {});
        }
      }
      if (parsed.clients && Array.isArray(parsed.clients)) {
        setClients(parsed.clients);
        const user = userRef.current;
        if (user) {
          const batch = writeBatch(db);
          parsed.clients.forEach((c: ClientProfile) => {
            const docRef = doc(db, 'users', user.uid, 'clients', c.id);
            batch.set(docRef, sanitizeForFirestore(c));
          });
          batch.commit().catch(() => {});
        }
      }
      if (parsed.billerProfile && parsed.billerProfile.name) {
        setBillerProfile(parsed.billerProfile);
      }
      if (parsed.numberingConfig && typeof parsed.numberingConfig.nextNumber === 'number') {
        updateNumberingConfig(parsed.numberingConfig);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal membaca format JSON' };
    }
  }, [setBillerProfile, updateNumberingConfig]);

  const exportSalesCSV = useCallback(() => {
    const headers = [
      'No. Faktur',
      'Tanggal Terbit',
      'Jatuh Tempo',
      'Nama Klien / Perusahaan',
      'Kontak PIC',
      'Status Pembayaran',
      'Mata Uang',
      'Jumlah Item',
      'Subtotal',
      'Diskon %',
      'PPN %',
      'Ongkir/Lainnya',
      'Bea Meterai',
      'Total Akhir',
    ];

    const rows = invoices.map((inv) => {
      const subtotal = inv.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const discount = (subtotal * inv.discountPercent) / 100;
      const dpp = subtotal - discount;
      const tax = (dpp * inv.taxPercent) / 100;
      const shipping = inv.shippingFee || 0;
      const stamp = inv.stampDuty || 0;
      const grandTotal = dpp + tax + shipping + stamp;

      return [
        `"${inv.invoiceNumber}"`,
        `"${inv.issueDate}"`,
        `"${inv.dueDate}"`,
        `"${(inv.client?.companyName || '').replace(/"/g, '""')}"`,
        `"${(inv.client?.attentionName || '').replace(/"/g, '""')}"`,
        `"${inv.paymentStatus}"`,
        `"${inv.currency}"`,
        inv.items.length,
        subtotal,
        inv.discountPercent,
        inv.taxPercent,
        shipping,
        stamp,
        grandTotal,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `Laporan_Penjualan_Faktur_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [invoices]);

  const resetToDefaults = useCallback(() => {
    setInvoices(initialInvoices);
    setProducts(sampleProducts);
    setClients(sampleClients);
    setBillerProfile(defaultBillerProfile);
    updateNumberingConfig(defaultNumberingConfig);
    setCurrentInvoiceId(initialInvoices[0].id);
  }, [setBillerProfile, updateNumberingConfig]);

  // --------------------------------------------------------------------------
  // MYSQL SERVER MANAGEMENT (Legacy & Secondary Backup)
  // --------------------------------------------------------------------------
  const checkMySQLStatus = useCallback(async () => {
    setMysqlStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/mysql/status');
      const data = await res.json();
      if (data && data.connected) {
        setMysqlStatus({
          connected: true,
          loading: false,
          host: data.host || 'sql.nufat.id',
          port: data.port || 3306,
          user: data.user || 'nufat',
          database: data.database || 'nufat',
          message: data.message || 'Terhubung ke database MySQL',
          lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
        return true;
      } else {
        setMysqlStatus({
          connected: false,
          loading: false,
          host: data?.host || 'sql.nufat.id',
          port: data?.port || 3306,
          user: data?.user || 'nufat',
          database: data?.database || 'nufat',
          error: data?.error || 'Tidak dapat terhubung',
          message: data?.message || 'Gagal terhubung ke MySQL',
        });
        return false;
      }
    } catch (err: any) {
      setMysqlStatus({
        connected: false,
        loading: false,
        host: 'sql.nufat.id',
        port: 3306,
        user: 'nufat',
        database: 'nufat',
        error: err.message,
        message: 'Server backend offline atau belum siap.',
      });
      return false;
    }
  }, []);

  const updateMySQLConfig = useCallback(async (config: {
    host: string;
    port: number;
    user: string;
    password?: string;
    database: string;
  }) => {
    setMysqlStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/mysql/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setMysqlStatus({
        connected: !!data.connected,
        loading: false,
        host: data.host || config.host,
        port: data.port || config.port,
        user: data.user || config.user,
        database: data.database || config.database,
        error: data.error,
        message: data.message,
        lastSynced: data.connected ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : undefined,
      });
      return data;
    } catch (err: any) {
      setMysqlStatus((prev) => ({
        ...prev,
        connected: false,
        loading: false,
        error: err.message,
      }));
      return { success: false, connected: false, error: err.message };
    }
  }, []);

  const syncAllToMySQL = useCallback(async () => {
    try {
      setMysqlStatus((prev) => ({ ...prev, loading: true }));
      await fetch('/api/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices }),
      });
      await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      await fetch('/api/clients/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients }),
      });

      setMysqlStatus((prev) => ({
        ...prev,
        connected: true,
        loading: false,
        lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message: 'Semua data faktur & katalog berhasil disinkronkan ke MySQL',
      }));
      return { success: true };
    } catch (e: any) {
      setMysqlStatus((prev) => ({
        ...prev,
        loading: false,
        error: e.message,
      }));
      return { success: false, error: e.message };
    }
  }, [invoices, products, clients]);

  const fetchFromMySQL = useCallback(async () => {
    try {
      setMysqlStatus((prev) => ({ ...prev, loading: true }));
      const res = await fetch('/api/invoices');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setInvoices(json.data);
        if (json.data[0]?.id) {
          setCurrentInvoiceId(json.data[0].id);
        }
      }

      const pRes = await fetch('/api/products');
      const pJson = await pRes.json();
      if (pJson.success && Array.isArray(pJson.data) && pJson.data.length > 0) {
        setProducts(pJson.data);
      }

      const cRes = await fetch('/api/clients');
      const cJson = await cRes.json();
      if (cJson.success && Array.isArray(cJson.data) && cJson.data.length > 0) {
        setClients(cJson.data);
      }

      setMysqlStatus((prev) => ({
        ...prev,
        connected: true,
        loading: false,
        lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }));
    } catch (e: any) {
      setMysqlStatus((prev) => ({
        ...prev,
        loading: false,
        error: e.message,
      }));
    }
  }, []);

  return {
    // Auth & User Profile
    currentUser,
    authLoading,
    authError,
    signInWithGoogle,
    logout,
    cloudSyncStatus,
    lastCloudSyncTime,
    // Invoice Store Entities
    invoices,
    currentInvoice,
    currentInvoiceId,
    setCurrentInvoiceId,
    products,
    clients,
    billerProfile,
    setBillerProfile,
    numberingConfig,
    updateNumberingConfig,
    syncCounterWithHighestInvoice,
    generateNextInvoiceNumber,
    createNewInvoice,
    updateInvoice,
    duplicateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    addClient,
    updateClient,
    deleteClient,
    exportAllDataJSON,
    importAllDataJSON,
    exportSalesCSV,
    resetToDefaults,
    // MySQL
    mysqlStatus,
    checkMySQLStatus,
    updateMySQLConfig,
    syncAllToMySQL,
    fetchFromMySQL,
  };
}
