import express from "express";
import dotenv from "dotenv";

dotenv.config();

import path from "path";
import cors from "cors";
import multer from "multer";
import mysql from "mysql2/promise";
import fs from "fs";
import nodemailer from "nodemailer";

// Global process error handlers to prevent process deaths
process.on('uncaughtException', (err) => {

  console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Email Transporter Setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 5000, // Reduced from 60 seconds to 5 seconds to prevent freezing
    greetingTimeout: 5000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  // Database Connection
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'svar_db'
  };

  let pool: mysql.Pool | null = null;
  const JSON_DB_PATH = './public/data/verifications.json';
  const TASKS_DB_PATH = './public/data/tasks.json';

  // Ensure directories exist
  ['./public/data/', './public/uploads/', './public/images/', './public/models/'].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Helper for JSON DB
  const getJsonData = (path: string) => {
    if (!fs.existsSync(path)) return [];
    try {
      return JSON.parse(fs.readFileSync(path, 'utf-8'));
    } catch (e) {
      return [];
    }
  };

  const saveJsonData = (path: string, data: any[]) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
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
        pass_download_enabled TINYINT(1) DEFAULT 0
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
      const dir = './public/uploads/';
      cb(null, dir);
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
  app.get("/api/admin/settings", async (req, res) => {
    try {
      if (pool) {
        const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
        res.json((rows as any)[0] || { pass_download_enabled: 0 });
      } else {
        res.json({ pass_download_enabled: 0 });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings/update", async (req, res) => {
    try {
      const { pass_download_enabled } = req.body;
      if (pool) {
        await pool.execute('UPDATE settings SET pass_download_enabled = ? WHERE id = 1', [pass_download_enabled]);
        res.json({ success: true });
      } else {
        res.json({ success: true, message: "MySQL not connected, settings not saved persistently" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/admin/tasks", async (req, res) => {
    try {
      if (pool) {
        const [rows] = await pool.query('SELECT * FROM admin_tasks ORDER BY created_at DESC');
        res.json(rows);
      } else {
        const data = getJsonData(TASKS_DB_PATH);
        res.json(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/admin/tasks", async (req, res) => {
    try {
      const { id, title, description, assignedTo, status, priority, dueDate } = req.body;
      if (pool) {
        await pool.execute(
          'INSERT INTO admin_tasks (id, title, description, assigned_to, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, title, description, assignedTo, status, priority, dueDate]
        );
      } else {
        const data = getJsonData(TASKS_DB_PATH);
        const newTask = {
          id,
          title,
          description,
          assigned_to: assignedTo,
          status,
          priority,
          due_date: dueDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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

  // NEW: Dedicated Single Image Upload (for Profile Photos in Step 0)
  app.post("/api/upload-single", upload.single('image'), (req, res) => {
    try {
      let fileName = '';
      let filePath = '';

      if (req.file) {
        fileName = req.file.filename;
      } else if (req.body.image && req.body.image.startsWith('data:')) {
        // Handle base64 upload
        const base64Data = req.body.image.split(',')[1];
        const extension = req.body.image.split(';')[0].split('/')[1] || 'jpg';
        const prefix = req.body.prefix || 'upload';
        fileName = `${prefix}-${Date.now()}.${extension}`;
        filePath = path.join(process.cwd(), 'public/uploads/', fileName);
        fs.writeFileSync(filePath, base64Data, 'base64');
      } else {
        return res.status(400).json({ error: "No file or image data provided" });
      }

      // Return the public URL for the image
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

      // Fallback for base64 data in body (if sent as JSON)
      const finalAadhaarData = aadhaarImage || aadhaarCard || selfie; // Some legacy support
      const finalSelfieData = selfieImage || selfie;

      if (!aadhaarPath && finalAadhaarData && finalAadhaarData.startsWith('data:')) {
        const base64Data = finalAadhaarData.split(',')[1];
        const fileName = `aadhaar-${Date.now()}.jpg`;
        const filePath = `./public/uploads/${fileName}`;
        fs.writeFileSync(filePath, base64Data, 'base64');
        aadhaarPath = filePath;
      }

      if (!selfiePath && finalSelfieData && finalSelfieData.startsWith('data:')) {
        const base64Data = finalSelfieData.split(',')[1];
        const fileName = `selfie-${Date.now()}.jpg`;
        const filePath = `./public/uploads/${fileName}`;
        fs.writeFileSync(filePath, base64Data, 'base64');
        selfiePath = filePath;
      }

      if (!aadhaarPath || !selfiePath) {
        console.warn("Verification data received but images are missing paths", { aadhaarPath, selfiePath });
      }

      if (pool) {
        const [result] = await pool.execute(
          'INSERT INTO user_verifications (user_id, name, aadhaar_number, aadhaar_image_path, selfie_image_path, face_match_score) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, name, aadhaarNumber, aadhaarPath, selfiePath, faceMatchScore]
        );
        res.json({ 
          success: true, 
          id: (result as any).insertId, 
          selfiePath: selfiePath ? `/uploads/${path.basename(selfiePath)}` : '',
          aadhaarPath: aadhaarPath ? `/uploads/${path.basename(aadhaarPath)}` : ''
        });
      } else {
        // JSON Storage
        const data = getJsonData(JSON_DB_PATH);
        const newItem = {
          id: Date.now(),
          user_id: userId,
          name,
          aadhaar_number: aadhaarNumber,
          aadhaar_image_path: aadhaarPath,
          selfie_image_path: selfiePath,
          face_match_score: faceMatchScore,
          verification_status: 'pending',
          created_at: new Date().toISOString()
        };
        data.push(newItem);
        saveJsonData(JSON_DB_PATH, data);
        res.json({ 
          success: true, 
          id: newItem.id,
          selfiePath: selfiePath ? `/uploads/${path.basename(selfiePath)}` : '',
          aadhaarPath: aadhaarPath ? `/uploads/${path.basename(aadhaarPath)}` : ''
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

      // Optionally clear uploads directory (be careful)
      const uploadsDir = './public/uploads';
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          if (file !== '.gitkeep') {
            fs.unlinkSync(path.join(uploadsDir, file));
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


  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
