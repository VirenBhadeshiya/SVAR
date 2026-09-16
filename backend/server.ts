import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import multer from "multer";
import mysql from "mysql2/promise";
import fs from "fs";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend directory or project root
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

// Root public directory relative to backend folder
const PUBLIC_DIR = path.resolve(__dirname, "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const DATA_DIR = path.join(PUBLIC_DIR, "data");

// Global process error handlers to prevent process deaths
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Email Transporter Setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Database Connection
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'svar_db'
  };

  let pool: mysql.Pool | null = null;
  const JSON_DB_PATH = path.join(DATA_DIR, 'verifications.json');
  const TASKS_DB_PATH = path.join(DATA_DIR, 'tasks.json');

  // Ensure directories exist
  [
    DATA_DIR,
    UPLOADS_DIR,
    path.join(PUBLIC_DIR, 'images'),
    path.join(PUBLIC_DIR, 'models')
  ].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Helper for JSON DB
  const getJsonData = (filePath: string) => {
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      return [];
    }
  };

  const saveJsonData = (filePath: string, data: any[]) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  };

  try {
    pool = mysql.createPool(dbConfig);
    console.log("Database pool created");

    // Test connection
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        aadhaar_number VARCHAR(20) NOT NULL,
        aadhaar_image_path TEXT NOT NULL,
        selfie_image_path TEXT NOT NULL,
        face_match_score DECIMAL(5,2) NOT NULL,
        verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_tasks (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to VARCHAR(255),
        status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
        priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
        due_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY,
        pass_download_enabled TINYINT(1) DEFAULT 0,
        data TEXT
      )
    `);

    // Insert default settings if not exists
    await connection.query('INSERT IGNORE INTO settings (id, pass_download_enabled) VALUES (1, 0)');

    connection.release();
    console.log("MySQL Database initialized successfully");
  } catch (err) {
    console.warn("MySQL connection failed. Falling back to JSON storage. This is expected if MySQL is not running.");
    pool = null;
  }

  // File Upload Setup
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });

  const upload = multer({ storage });

  // API Routes

  // IP Endpoint for Watermark
  app.get("/api/ip", (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    res.json({ ip });
  });

  // Settings Endpoints
  const SETTINGS_DB_PATH = path.join(DATA_DIR, 'settings.json');

  const DEFAULT_SETTINGS = {
    registrationOpen: true,
    passDownloadEnabled: false,
    parkingFull: false,
    eventStartDate: '2026-10-15T18:00',
    eventEndDate: '2026-10-24T23:59',
    prices: {
      MALE_PASS: 1500,
      FEMALE_PASS: 500,
      TWO_WHEELER: 50,
      FOUR_WHEELER: 200
    }
  };

  app.get("/api/admin/settings", async (req, res) => {
    try {
      if (pool) {
        const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
        const dbRow = (rows as any)[0];
        if (dbRow && dbRow.data) {
          return res.json(JSON.parse(dbRow.data));
        }
      }
      
      if (fs.existsSync(SETTINGS_DB_PATH)) {
        const fileData = fs.readFileSync(SETTINGS_DB_PATH, 'utf-8');
        return res.json(JSON.parse(fileData));
      }

      res.json(DEFAULT_SETTINGS);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      res.json(DEFAULT_SETTINGS);
    }
  });

  app.post("/api/admin/settings/update", async (req, res) => {
    try {
      const incomingSettings = req.body;
      const current = fs.existsSync(SETTINGS_DB_PATH) 
        ? JSON.parse(fs.readFileSync(SETTINGS_DB_PATH, 'utf-8'))
        : DEFAULT_SETTINGS;

      const mergedSettings = {
        ...current,
        ...incomingSettings,
        prices: {
          ...current.prices,
          ...(incomingSettings.prices || {})
        }
      };

      // Save to JSON file
      saveJsonData(SETTINGS_DB_PATH, mergedSettings as any);

      // Save to MySQL if connected
      if (pool) {
        await pool.execute(
          'INSERT INTO settings (id, pass_download_enabled, data) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE pass_download_enabled = VALUES(pass_download_enabled), data = VALUES(data)',
          [mergedSettings.passDownloadEnabled ? 1 : 0, JSON.stringify(mergedSettings)]
        );
      }

      res.json({ success: true, settings: mergedSettings });
    } catch (err) {
      console.error("Failed to update settings", err);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/admin/tasks", async (req, res) => {
    try {
      let rawTasks: any[] = [];
      if (pool) {
        const [rows] = await pool.query('SELECT * FROM admin_tasks ORDER BY created_at DESC');
        rawTasks = rows as any[];
      } else {
        const data = getJsonData(TASKS_DB_PATH);
        rawTasks = data.sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
      }
      
      const normalizedTasks = rawTasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        assignedTo: t.assignedTo || t.assigned_to || '',
        assigned_to: t.assignedTo || t.assigned_to || '',
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate || t.due_date || '',
        due_date: t.dueDate || t.due_date || '',
        createdAt: t.createdAt || t.created_at || new Date().toISOString(),
        created_at: t.createdAt || t.created_at || new Date().toISOString(),
        updatedAt: t.updatedAt || t.updated_at || new Date().toISOString(),
        updated_at: t.updatedAt || t.updated_at || new Date().toISOString()
      }));

      res.json(normalizedTasks);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/admin/tasks", async (req, res) => {
    try {
      const { id, title, description, assignedTo, status, priority, dueDate } = req.body;
      const formattedDueDate = dueDate && String(dueDate).trim() !== '' ? dueDate : null;
      if (pool) {
        await pool.execute(
          'INSERT INTO admin_tasks (id, title, description, assigned_to, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, title, description, assignedTo, status, priority, formattedDueDate]
        );
      } else {
        const data = getJsonData(TASKS_DB_PATH);
        const newTask = {
          id,
          title,
          description,
          assigned_to: assignedTo,
          assignedTo: assignedTo,
          status,
          priority,
          due_date: formattedDueDate,
          dueDate: formattedDueDate,
          created_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        data.push(newTask);
        saveJsonData(TASKS_DB_PATH, data);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Task creation failed", err);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.post("/api/admin/tasks/update", async (req, res) => {
    try {
      const { id, status } = req.body;
      if (pool) {
        await pool.execute('UPDATE admin_tasks SET status = ? WHERE id = ?', [status, id]);
      } else {
        const data = getJsonData(TASKS_DB_PATH);
        const index = data.findIndex((t: any) => t.id === id);
        if (index !== -1) {
          data[index].status = status;
          data[index].updated_at = new Date().toISOString();
          saveJsonData(TASKS_DB_PATH, data);
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.post("/api/admin/tasks/delete", async (req, res) => {
    try {
      const { id } = req.body;
      if (pool) {
        await pool.execute('DELETE FROM admin_tasks WHERE id = ?', [id]);
      } else {
        let data = getJsonData(TASKS_DB_PATH);
        data = data.filter((t: any) => t.id !== id);
        saveJsonData(TASKS_DB_PATH, data);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Dedicated Single Image Upload
  app.post("/api/upload-single", upload.single('image'), (req, res) => {
    try {
      let fileName = '';
      let filePath = '';

      if (req.file) {
        fileName = req.file.filename;
      } else if (req.body.image && req.body.image.startsWith('data:')) {
        const base64Data = req.body.image.split(',')[1];
        const extension = req.body.image.split(';')[0].split('/')[1] || 'jpg';
        const prefix = req.body.prefix || 'upload';
        fileName = `${prefix}-${Date.now()}.${extension}`;
        filePath = path.join(UPLOADS_DIR, fileName);
        fs.writeFileSync(filePath, base64Data, 'base64');
      } else {
        return res.status(400).json({ error: "No file or image data provided" });
      }

      res.json({ 
        success: true, 
        url: `/uploads/${fileName}`
      });
    } catch (err) {
      console.error("Single upload failed", err);
      res.status(500).json({ error: "Internal server error during upload" });
    }
  });

  app.post("/api/verify-identity", upload.fields([
    { name: 'aadhaarImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { name, aadhaarNumber, faceMatchScore, userId, selfie, aadhaarCard, selfieImage, aadhaarImage } = req.body;
      const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};

      let aadhaarPath = files['aadhaarImage']?.[0]?.path || '';
      let selfiePath = files['selfieImage']?.[0]?.path || '';

      const finalAadhaarData = aadhaarImage || aadhaarCard;
      const finalSelfieData = selfieImage || selfie;

      if (!aadhaarPath && finalAadhaarData && finalAadhaarData.startsWith('data:')) {
        const base64Data = finalAadhaarData.split(',')[1];
        const fileName = `aadhaar-${Date.now()}.jpg`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        fs.writeFileSync(filePath, base64Data, 'base64');
        aadhaarPath = filePath;
      }

      if (!selfiePath && finalSelfieData && finalSelfieData.startsWith('data:')) {
        const base64Data = finalSelfieData.split(',')[1];
        const fileName = `selfie-${Date.now()}.jpg`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        fs.writeFileSync(filePath, base64Data, 'base64');
        selfiePath = filePath;
      }

      if (!aadhaarPath || !selfiePath) {
        console.warn("Verification data received but images are missing paths", { aadhaarPath, selfiePath });
      }

      const cleanSelfieUrl = selfiePath ? `/uploads/${path.basename(selfiePath)}` : '';
      const cleanAadhaarUrl = aadhaarPath ? `/uploads/${path.basename(aadhaarPath)}` : '';

      if (pool) {
        const [result] = await pool.execute(
          'INSERT INTO user_verifications (user_id, name, aadhaar_number, aadhaar_image_path, selfie_image_path, face_match_score) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, name, aadhaarNumber, cleanAadhaarUrl, cleanSelfieUrl, faceMatchScore]
        );
        res.json({ 
          success: true, 
          id: (result as any).insertId, 
          selfiePath: cleanSelfieUrl,
          aadhaarPath: cleanAadhaarUrl
        });
      } else {
        const data = getJsonData(JSON_DB_PATH);
        const newItem = {
          id: Date.now(),
          user_id: userId,
          name,
          aadhaar_number: aadhaarNumber,
          aadhaar_image_path: cleanAadhaarUrl,
          selfie_image_path: cleanSelfieUrl,
          face_match_score: faceMatchScore,
          verification_status: 'pending',
          created_at: new Date().toISOString()
        };
        data.push(newItem);
        saveJsonData(JSON_DB_PATH, data);
        res.json({ 
          success: true, 
          id: newItem.id,
          selfiePath: cleanSelfieUrl,
          aadhaarPath: cleanAadhaarUrl
        });
      }
    } catch (err) {
      console.error("Verification save failed", err);
      res.status(500).json({ error: "Failed to save verification data" });
    }
  });

  app.get("/api/admin/verifications", async (req, res) => {
    try {
      if (pool) {
        const [rows] = await pool.query('SELECT * FROM user_verifications ORDER BY created_at DESC');
        res.json(rows);
      } else {
        const data = getJsonData(JSON_DB_PATH);
        res.json(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch verifications" });
    }
  });

  app.post("/api/admin/verify-action", async (req, res) => {
    try {
      const { id, status } = req.body;
      if (pool) {
        await pool.execute('UPDATE user_verifications SET verification_status = ? WHERE id = ?', [status, id]);
      } else {
        const data = getJsonData(JSON_DB_PATH);
        const index = data.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          data[index].verification_status = status;
          saveJsonData(JSON_DB_PATH, data);
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.post("/api/admin/delete-verification", async (req, res) => {
    try {
      const { userId } = req.body;
      if (pool) {
        await pool.execute('DELETE FROM user_verifications WHERE user_id = ?', [userId]);
      } else {
        let data = getJsonData(JSON_DB_PATH);
        data = data.filter((item: any) => item.user_id !== userId);
        saveJsonData(JSON_DB_PATH, data);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete verification" });
    }
  });

  app.post("/api/admin/reset-db", async (req, res) => {
    try {
      if (pool) {
        await pool.execute('DELETE FROM user_verifications');
        await pool.execute('DELETE FROM admin_tasks');
      } else {
        saveJsonData(JSON_DB_PATH, []);
        saveJsonData(TASKS_DB_PATH, []);
      }

      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        for (const file of files) {
          if (file !== '.gitkeep') {
            try {
              fs.unlinkSync(path.join(UPLOADS_DIR, file));
            } catch (e) {
              console.warn(`Could not delete file ${file}:`, e);
            }
          }
        }
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to reset server database" });
    }
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, text, html } = req.body;

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("Email credentials not configured. Skipping email send.");
        return res.json({ success: true, message: "Email skipped (not configured)" });
      }

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
      });

      console.log("Email sent: %s", info.messageId);
      res.json({ success: true, messageId: info.messageId });
    } catch (err) {
      console.error("Failed to send email", err);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Global Express Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express Error Handler Caught:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', details: err?.message || 'Unknown error' });
    }
  });

  // Serve Frontend Production Build (if built)
  const FRONTEND_DIST = path.resolve(__dirname, '../frontend/dist');
  if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
    console.log(`Frontend static build enabled from ${FRONTEND_DIST}`);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please stop any process using port ${PORT}.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

