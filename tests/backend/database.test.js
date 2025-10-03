const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

let app;
let db;

beforeAll((done) => {
  app = express();
  app.use(express.json());

  db = new sqlite3.Database(':memory:', (err) => {
    if (err) done(err);

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

describe('Database Operations', () => {
  beforeEach((done) => {
    db.run('DELETE FROM song_ratings', done);
  });

  test('should prevent duplicate votes from same user', async () => {
    // First vote
    await request(app)
      .post('/ratings')
      .send({ songKey: 'test_song', userId: 'user1', rating: 1 });

    // Second vote from same user
    await request(app)
      .post('/ratings')
      .send({ songKey: 'test_song', userId: 'user1', rating: 1 });

    // Check counts
    const response = await request(app).get('/ratings/test_song');
    expect(response.body.thumbsUp).toBe(1);
  });

  test('should allow user to change their vote', async () => {
    await request(app)
      .post('/ratings')
      .send({ songKey: 'test_song', userId: 'user1', rating: 1 });

    await request(app)
      .post('/ratings')
      .send({ songKey: 'test_song', userId: 'user1', rating: -1 });

    const response = await request(app).get('/ratings/test_song');
    expect(response.body.thumbsUp).toBe(0);
    expect(response.body.thumbsDown).toBe(1);
  });
});
