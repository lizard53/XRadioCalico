const request = require('supertest');
const { app } = require('../../server.js');

// Wait for database to initialize
beforeAll((done) => {
  setTimeout(done, 100);
});

describe('Server Input Validation', () => {
  describe('Users API Validation', () => {
    test('should reject POST with missing name field', async () => {
      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should reject POST with missing email field', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test User' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should reject POST with both fields missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should handle UPDATE with valid data', async () => {
      const uniqueEmail = `update${Date.now()}@example.com`;
      const createResponse = await request(app)
        .post('/users')
        .send({ name: 'Original', email: uniqueEmail });

      const userId = createResponse.body.id;
      const newEmail = `updated${Date.now()}@example.com`;

      const response = await request(app)
        .put(`/users/${userId}`)
        .send({ name: 'Updated', email: newEmail });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User updated successfully');
    });
  });

  describe('Ratings API Validation', () => {
    test('should accept valid thumbs up rating (1)', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({
          songKey: `song${Date.now()}`,
          userId: `user${Date.now()}`,
          rating: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should accept valid thumbs down rating (-1)', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({
          songKey: `song${Date.now()}`,
          userId: `user${Date.now()}`,
          rating: -1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject ratings with invalid values', async () => {
      const testCases = [2, -2, 'invalid'];
      for (const rating of testCases) {
        const response = await request(app)
          .post('/ratings')
          .send({ songKey: 'test_song', userId: 'test_user', rating });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid rating data');
      }
    });
  });
});
