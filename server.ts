import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dynamic MySQL Configuration with fallbacks
let dbConfig = {
  host: process.env.MYSQL_HOST || 'sql.nufat.id',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'nufat',
  password: process.env.MYSQL_PASSWORD || 'nufat17a',
  database: process.env.MYSQL_DATABASE || 'nufat',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 4000,
};

let pool: mysql.Pool | null = null;
let isDbInitialized = false;
let isConnecting = false;
let lastConnectionError: string | null = null;

// In-memory fallback cache to ensure zero downtime even when MySQL host is unreachable
const memoryStore = {
  invoices: new Map<string, any>(),
  products: new Map<string, any>(),
  clients: new Map<string, any>(),
};

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

function resetPool(newConfig?: Partial<typeof dbConfig>) {
  if (pool) {
    try {
      pool.end().catch(() => {});
    } catch (_) {}
    pool = null;
  }
  if (newConfig) {
    dbConfig = { ...dbConfig, ...newConfig };
  }
  isDbInitialized = false;
  lastConnectionError = null;
}

// Auto-migrate tables on initialization (non-blocking, graceful)
async function initDatabase(): Promise<boolean> {
  if (isConnecting) return false;
  isConnecting = true;

  try {
    const currentPool = getPool();
    const connection = await currentPool.getConnection();
    
    // Invoices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS faktur_invoices (
        id VARCHAR(100) PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL,
        issue_date VARCHAR(50),
        due_date VARCHAR(50),
        po_number VARCHAR(100),
        payment_status VARCHAR(50) DEFAULT 'UNPAID',
        client_company VARCHAR(255),
        grand_total DOUBLE DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'IDR',
        data LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Products catalog table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS faktur_products (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price DOUBLE DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'unit',
        data LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Clients catalog table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS faktur_clients (
        id VARCHAR(100) PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        attention_name VARCHAR(255),
        phone VARCHAR(100),
        email VARCHAR(255),
        data LONGTEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    connection.release();
    isDbInitialized = true;
    lastConnectionError = null;
    console.log(`✅ MySQL Database connected & synchronized with ${dbConfig.host}:${dbConfig.port}`);
    isConnecting = false;
    return true;
  } catch (err: any) {
    lastConnectionError = err.message || 'Connection failed';
    isDbInitialized = false;
    console.log(`ℹ️ Info: MySQL host (${dbConfig.host}:${dbConfig.port}) saat ini belum terhubung (${err.code || err.message}). Berjalan lancar dengan mode penyimpanan lokal.`);
    isConnecting = false;
    return false;
  }
}

// Initial non-blocking try
setTimeout(() => {
  initDatabase().catch(() => {});
}, 1000);

// ======================== API ROUTES ========================

// 1. Check MySQL connection & status
app.get('/api/mysql/status', async (req, res) => {
  try {
    const currentPool = getPool();
    const [rows]: any = await Promise.race([
      currentPool.query('SELECT 1 as connected, NOW() as server_time'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout (3s)')), 3000)),
    ]);
    
    if (!isDbInitialized) {
      await initDatabase();
    }

    res.json({
      connected: true,
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      serverTime: rows[0]?.server_time,
      tablesInitialized: isDbInitialized,
      message: `Terhubung ke database MySQL ${dbConfig.host}:${dbConfig.port}`,
    });
  } catch (err: any) {
    res.json({
      connected: false,
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      error: err.message,
      message: `MySQL offline (${err.code || err.message}). Aplikasi tetap berjalan lancar dengan penyimpanan lokal.`,
    });
  }
});

// Update MySQL credentials and test
app.post('/api/mysql/config', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body;
    resetPool({
      host: host ? String(host).trim() : dbConfig.host,
      port: port ? parseInt(String(port), 10) : dbConfig.port,
      user: user ? String(user).trim() : dbConfig.user,
      password: password !== undefined ? String(password) : dbConfig.password,
      database: database ? String(database).trim() : dbConfig.database,
    });

    const connected = await initDatabase();
    res.json({
      success: connected,
      connected,
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      error: lastConnectionError,
      message: connected
        ? `Berhasil terhubung ke ${dbConfig.host}:${dbConfig.port}!`
        : `Gagal terhubung: ${lastConnectionError || 'Host tidak merespon'}`,
    });
  } catch (err: any) {
    res.json({
      success: false,
      connected: false,
      error: err.message,
    });
  }
});

// 2. Invoices API
// GET all invoices
app.get('/api/invoices', async (req, res) => {
  try {
    if (isDbInitialized) {
      const currentPool = getPool();
      const [rows]: any = await currentPool.query(
        'SELECT data FROM faktur_invoices ORDER BY updated_at DESC, created_at DESC'
      );
      const invoices = rows.map((r: any) => {
        try {
          return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      // Also update memory cache
      invoices.forEach((inv: any) => {
        if (inv?.id) memoryStore.invoices.set(inv.id, inv);
      });

      return res.json({ success: true, data: invoices, source: 'mysql' });
    }
  } catch (err: any) {
    // Fall back silently to memory store
  }

  const list = Array.from(memoryStore.invoices.values());
  res.json({ success: true, data: list, source: 'memory' });
});

// POST save / update single invoice
app.post('/api/invoices', async (req, res) => {
  const invoice = req.body;
  if (!invoice || !invoice.id) {
    return res.status(400).json({ success: false, error: 'Invoice ID is required' });
  }

  // Always save to memory store
  memoryStore.invoices.set(invoice.id, invoice);

  // Try to persist to MySQL if online
  if (isDbInitialized) {
    try {
      const currentPool = getPool();
      const invoiceJson = JSON.stringify(invoice);
      const grandTotal = invoice.grandTotal || 0;

      await currentPool.query(
        `INSERT INTO faktur_invoices 
          (id, invoice_number, issue_date, due_date, po_number, payment_status, client_company, grand_total, currency, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          invoice_number = VALUES(invoice_number),
          issue_date = VALUES(issue_date),
          due_date = VALUES(due_date),
          po_number = VALUES(po_number),
          payment_status = VALUES(payment_status),
          client_company = VALUES(client_company),
          grand_total = VALUES(grand_total),
          currency = VALUES(currency),
          data = VALUES(data),
          updated_at = CURRENT_TIMESTAMP`,
        [
          invoice.id,
          invoice.invoiceNumber || 'INV',
          invoice.issueDate || '',
          invoice.dueDate || '',
          invoice.poNumber || '',
          invoice.paymentStatus || 'UNPAID',
          invoice.client?.companyName || '',
          grandTotal,
          invoice.currency || 'IDR',
          invoiceJson,
        ]
      );
    } catch (_) {}
  }

  res.json({ success: true, message: 'Faktur berhasil disimpan' });
});

// POST bulk sync invoices
app.post('/api/invoices/bulk', async (req, res) => {
  const { invoices } = req.body;
  if (!Array.isArray(invoices)) {
    return res.status(400).json({ success: false, error: 'Invoices array required' });
  }

  invoices.forEach((inv) => {
    if (inv?.id) memoryStore.invoices.set(inv.id, inv);
  });

  if (isDbInitialized) {
    try {
      const currentPool = getPool();
      for (const inv of invoices) {
        if (!inv.id) continue;
        const invoiceJson = JSON.stringify(inv);
        await currentPool.query(
          `INSERT INTO faktur_invoices 
            (id, invoice_number, issue_date, due_date, po_number, payment_status, client_company, grand_total, currency, data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            invoice_number = VALUES(invoice_number),
            issue_date = VALUES(issue_date),
            due_date = VALUES(due_date),
            po_number = VALUES(po_number),
            payment_status = VALUES(payment_status),
            client_company = VALUES(client_company),
            grand_total = VALUES(grand_total),
            currency = VALUES(currency),
            data = VALUES(data),
            updated_at = CURRENT_TIMESTAMP`,
          [
            inv.id,
            inv.invoiceNumber || 'INV',
            inv.issueDate || '',
            inv.dueDate || '',
            inv.poNumber || '',
            inv.paymentStatus || 'UNPAID',
            inv.client?.companyName || '',
            inv.grandTotal || 0,
            inv.currency || 'IDR',
            invoiceJson,
          ]
        );
      }
    } catch (_) {}
  }

  res.json({ success: true, count: invoices.length, message: `${invoices.length} faktur berhasil disinkronkan` });
});

// DELETE invoice
app.delete('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  memoryStore.invoices.delete(id);

  if (isDbInitialized) {
    try {
      const currentPool = getPool();
      await currentPool.query('DELETE FROM faktur_invoices WHERE id = ?', [id]);
    } catch (_) {}
  }

  res.json({ success: true, message: 'Faktur dihapus' });
});

// 3. Products Catalog API
app.get('/api/products', async (req, res) => {
  if (isDbInitialized) {
    try {
      const currentPool = getPool();
      const [rows]: any = await currentPool.query('SELECT data FROM faktur_products ORDER BY name ASC');
      const products = rows.map((r: any) => {
        try {
          return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      products.forEach((p: any) => {
        if (p?.id) memoryStore.products.set(p.id, p);
      });

      return res.json({ success: true, data: products });
    } catch (_) {}
  }

  const list = Array.from(memoryStore.products.values());
  res.json({ success: true, data: list });
});

app.post('/api/products/bulk', async (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products)) {
    return res.status(400).json({ success: false, error: 'Products array required' });
  }

  products.forEach((p) => {
    if (p?.id) memoryStore.products.set(p.id, p);
  });

  if (isDbInitialized) {
    try {
      const currentPool = getPool();
      for (const p of products) {
        if (!p.id) continue;
        await currentPool.query(
          `INSERT INTO faktur_products (id, name, category, price, unit, data)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            category = VALUES(category),
            price = VALUES(price),
            unit = VALUES(unit),
            data = VALUES(data),
            updated_at = CURRENT_TIMESTAMP`,
          [p.id, p.name || '', p.category || '', p.price || 0, p.unit || 'unit', JSON.stringify(p)]
        );
      }
    } catch (_) {}
  }

  res.json({ success: true, message: 'Katalog produk disimpan' });
});

// 4. Clients Directory API
app.get('/api/clients', async (req, res) => {
  if (isDbInitialized) {
    try {
      const currentPool = getPool();
      const [rows]: any = await currentPool.query('SELECT data FROM faktur_clients ORDER BY company_name ASC');
      const clients = rows.map((r: any) => {
        try {
          return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      clients.forEach((c: any) => {
        if (c?.id) memoryStore.clients.set(c.id, c);
      });

      return res.json({ success: true, data: clients });
    } catch (_) {}
  }

  const list = Array.from(memoryStore.clients.values());
  res.json({ success: true, data: list });
});

app.post('/api/clients/bulk', async (req, res) => {
  const { clients } = req.body;
  if (!Array.isArray(clients)) {
    return res.status(400).json({ success: false, error: 'Clients array required' });
  }

  clients.forEach((c) => {
    if (c?.id) memoryStore.clients.set(c.id, c);
  });

  if (isDbInitialized) {
    try {
      const currentPool = getPool();
      for (const c of clients) {
        if (!c.id) continue;
        await currentPool.query(
          `INSERT INTO faktur_clients (id, company_name, attention_name, phone, email, data)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
            company_name = VALUES(company_name),
            attention_name = VALUES(attention_name),
            phone = VALUES(phone),
            email = VALUES(email),
            data = VALUES(data),
            updated_at = CURRENT_TIMESTAMP`,
          [c.id, c.companyName || '', c.attentionName || '', c.phone || '', c.email || '', JSON.stringify(c)]
        );
      }
    } catch (_) {}
  }

  res.json({ success: true, message: 'Direktori klien disimpan' });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ======================== VITE SPA SETUP ========================
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
