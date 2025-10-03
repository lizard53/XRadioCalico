const request = require('supertest');
const { app } = require('../../server.js');

// Wait for database to initialize
beforeAll((done) => {
  setTimeout(done, 100);
});

describe('Server Integration Tests', () => {
  describe('Users API', () => {
    test('should get all users', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
    });

    test('should create a new user', async () => {
      const uniqueEmail = `test${Date.now()}@example.com`;
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User', email: uniqueEmail });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
    });

    test('should reject user without required fields', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });
  });

  describe('Ratings API', () => {
    test('should get ratings for a song', async () => {
      const response = await request(app).get('/ratings/test_song');

      expect(response.status).toBe(200);
      expect(response.body.thumbsUp).toBeDefined();
      expect(response.body.thumbsDown).toBeDefined();
    });

    test('should submit a rating', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({ songKey: 'test_song', userId: 'test_user', rating: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject invalid rating', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({ songKey: 'test_song', userId: 'test_user', rating: 5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rating data');
    });
  });

  describe('Root Route', () => {
    test('should serve index.html', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/html/);
    });
  });

  describe('Static Files', () => {
    test('should serve CSS files', async () => {
      const response = await request(app).get('/css/styles.css');

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/css/);
    });

    test('should serve JavaScript files', async () => {
      const response = await request(app).get('/javascript/player.js');

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/javascript/);
    });
  });
});
