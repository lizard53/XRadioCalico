const request = require('supertest');
const { app } = require('../../server.js');

// Wait for database to initialize
beforeAll((done) => {
  setTimeout(done, 100);
});

describe('Server Edge Cases and Boundary Conditions', () => {
  describe('Users Edge Cases', () => {
    test('should handle empty name field (falsy value)', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: '', email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should handle empty email field (falsy value)', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test', email: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should handle null name', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: null, email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should handle null email', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Test', email: null });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name and email are required');
    });

    test('should handle GET users with various IDs', async () => {
      // Test with string ID
      const response1 = await request(app).get('/users/abc');
      expect([200, 404]).toContain(response1.status);

      // Test with negative ID
      const response2 = await request(app).get('/users/-1');
      expect(response2.status).toBe(404);
    });
  });

  describe('Ratings Edge Cases', () => {
    test('should reject ratings with null or empty values', async () => {
      const testCases = [
        { songKey: null, userId: 'user', rating: 1 },
        { songKey: 'song', userId: null, rating: 1 },
        { songKey: '', userId: 'user', rating: 1 },
        { songKey: 'song', userId: '', rating: 1 },
        { songKey: 'song', userId: 'user', rating: null }
      ];
      for (const testCase of testCases) {
        const response = await request(app).post('/ratings').send(testCase);
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid rating data');
      }
    });

    test('should handle GET ratings for special characters in songKey', async () => {
      const response = await request(app).get('/ratings/song_with-special.chars');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('thumbsUp');
      expect(response.body).toHaveProperty('thumbsDown');
    });
  });
});
