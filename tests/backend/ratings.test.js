const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a test app
let app;
let db;
let server;

beforeAll((done) => {
  app = express();
  app.use(express.json());

  // Use in-memory database for tests
  db = new sqlite3.Database(':memory:', (err) => {
    if (err) done(err);

    // Initialize tables
    db.run(`
      CREATE TABLE IF NOT EXISTS song_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_key TEXT NOT NULL,
        user_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(song_key, user_id)
      )
    `, (err) => {
      if (err) done(err);

      // Set up routes
      app.get('/ratings/:songKey', (req, res) => {
        db.all(`SELECT rating, COUNT(*) as count FROM song_ratings
          WHERE song_key = ? GROUP BY rating`, [req.params.songKey], (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          const result = { thumbsUp: 0, thumbsDown: 0 };
          rows.forEach(row => {
            if (row.rating === 1) result.thumbsUp = row.count;
            if (row.rating === -1) result.thumbsDown = row.count;
          });
          res.json(result);
        });
      });

      app.post('/ratings', (req, res) => {
        const { songKey, userId, rating } = req.body;
        if (!songKey || !userId || (rating !== 1 && rating !== -1)) {
          res.status(400).json({ error: 'Invalid rating data' });
          return;
        }

        db.run(`INSERT INTO song_ratings (song_key, user_id, rating)
          VALUES (?, ?, ?) ON CONFLICT(song_key, user_id)
          DO UPDATE SET rating = excluded.rating, created_at = CURRENT_TIMESTAMP`,
          [songKey, userId, rating], function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ success: true });
          });
      });

      done();
    });
  });
});

afterAll((done) => {
  db.close(done);
});

describe('Ratings API', () => {
  beforeEach((done) => {
    db.run('DELETE FROM song_ratings', done);
  });

  describe('POST /ratings', () => {
    test('should accept a thumbs up rating', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({ songKey: 'test_song', userId: 'user1', rating: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should accept a thumbs down rating', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({ songKey: 'test_song', userId: 'user1', rating: -1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject invalid rating values', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({ songKey: 'test_song', userId: 'user1', rating: 5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rating data');
    });
  });
});
