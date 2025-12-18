require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const cron = require('node-cron');
const { generateSummary, generateVibeImage } = require('./aiService');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*", // Set to frontend URL in production
    methods: ["GET", "POST"]
  }
});

// In-memory storage for AI-generated content
let aiData = {
  summary: null,
  sentiment: null,
  vibeImage: null,
  lastUpdated: null
};

// Database Setup
const db = new sqlite3.Database('./retro.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS retro_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      content TEXT,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (!err) {
        // Add likes column if it doesn't exist (for existing databases)
        db.run(`ALTER TABLE retro_items ADD COLUMN likes INTEGER DEFAULT 0`, () => { });
      }
      if (err) {
        console.error("Error creating table", err);
      }
    });

    // Create table to track who liked what (prevents spam)
    db.run(`CREATE TABLE IF NOT EXISTS item_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(item_id, user_id)
    )`);
  }
});

// Helper function to get all items from DB
function getAllItems() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM retro_items ORDER BY likes DESC, created_at DESC", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// AI Generation Task
async function runAIGeneration() {
  console.log('[AI Cron] Starting AI generation...');
  try {
    const items = await getAllItems();

    // Generate summary and sentiment
    const { summary, sentiment } = await generateSummary(items);
    console.log('[AI Cron] Summary generated.');

    // Generate vibe image
    const vibeImage = await generateVibeImage(items);
    console.log('[AI Cron] Vibe image generated:', vibeImage ? 'success' : 'skipped/failed');

    // Update in-memory store
    aiData = {
      summary,
      sentiment,
      vibeImage,
      lastUpdated: new Date().toISOString()
    };

    // Broadcast to all connected clients
    io.emit('ai-update', aiData);
    console.log('[AI Cron] Broadcasted AI update to clients.');
  } catch (error) {
    console.error('[AI Cron] Error during AI generation:', error);
  }
}

// Schedule cron job: configurable via AI_CRON_INTERVAL env var (default: every 30 minutes)
const cronInterval = process.env.AI_CRON_INTERVAL || '*/30 * * * *';
console.log(`AI generation scheduled with interval: ${cronInterval}`);
cron.schedule(cronInterval, () => {
  runAIGeneration();
});

// Run once on startup after a short delay
setTimeout(() => {
  runAIGeneration();
}, 5000);

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send existing items to the connected client
  db.all("SELECT * FROM retro_items ORDER BY likes DESC, created_at DESC", [], (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    socket.emit('initial-items', rows);
  });

  // Send current AI data to newly connected client
  if (aiData.summary || aiData.vibeImage) {
    socket.emit('ai-update', aiData);
  }

  // Handle new item
  socket.on('new-item', (item) => {
    const { type, content } = item;
    db.run(`INSERT INTO retro_items (type, content) VALUES (?, ?)`, [type, content], function (err) {
      if (err) {
        return console.error(err.message);
      }
      const newItem = { id: this.lastID, type, content, likes: 0, created_at: new Date().toISOString() };
      // Broadcast to all clients including sender
      io.emit('item-added', newItem);
    });
  });

  // Handle like item (with unique user tracking)
  socket.on('like-item', ({ itemId, userId }) => {
    if (!itemId || !userId) return;

    // Check if user already liked this item
    db.get(`SELECT * FROM item_likes WHERE item_id = ? AND user_id = ?`, [itemId, userId], (err, existingLike) => {
      if (err) return console.error(err.message);

      if (existingLike) {
        // User already liked - remove the like (unlike)
        db.run(`DELETE FROM item_likes WHERE item_id = ? AND user_id = ?`, [itemId, userId], function (err) {
          if (err) return console.error(err.message);

          // Decrease like count
          db.run(`UPDATE retro_items SET likes = likes - 1 WHERE id = ?`, itemId, function (err) {
            if (err) return console.error(err.message);

            db.get(`SELECT * FROM retro_items WHERE id = ?`, itemId, (err, row) => {
              if (row) {
                io.emit('item-liked', { item: row, likedBy: null, unlikedBy: userId });
              }
            });
          });
        });
      } else {
        // New like - add it
        db.run(`INSERT INTO item_likes (item_id, user_id) VALUES (?, ?)`, [itemId, userId], function (err) {
          if (err) return console.error(err.message);

          // Increase like count
          db.run(`UPDATE retro_items SET likes = likes + 1 WHERE id = ?`, itemId, function (err) {
            if (err) return console.error(err.message);

            db.get(`SELECT * FROM retro_items WHERE id = ?`, itemId, (err, row) => {
              if (row) {
                io.emit('item-liked', { item: row, likedBy: userId, unlikedBy: null });
              }
            });
          });
        });
      }
    });
  });

  // Get user's likes for initial load
  socket.on('get-user-likes', (userId) => {
    db.all(`SELECT item_id FROM item_likes WHERE user_id = ?`, [userId], (err, rows) => {
      if (!err && rows) {
        socket.emit('user-likes', rows.map(r => r.item_id));
      }
    });
  });

  // Allow manual trigger of AI generation (optional)
  socket.on('trigger-ai', async () => {
    await runAIGeneration();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 8057;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI generation scheduled with interval: ${cronInterval}`);
});
