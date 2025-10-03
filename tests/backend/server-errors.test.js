const request = require('supertest');
const { app } = require('../../server.js');

// Wait for database to initialize
beforeAll((done) => {
  setTimeout(done, 100);
});

describe('Server Error Handling', () => {
  describe('Users API - Error Cases', () => {
    test('should handle GET user by non-existent ID', async () => {
      const response = await request(app).get('/users/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    test('should handle UPDATE non-existent user', async () => {
      const response = await request(app)
        .put('/users/99999')
        .send({ name: 'Updated Name', email: 'updated@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    test('should handle DELETE non-existent user', async () => {
      const response = await request(app).delete('/users/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    test('should reject POST user with duplicate email', async () => {
      const uniqueEmail = `duplicate${Date.now()}@example.com`;

      await request(app)
        .post('/users')
        .send({ name: 'First User', email: uniqueEmail });

      const response = await request(app)
        .post('/users')
        .send({ name: 'Second User', email: uniqueEmail });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    test('should handle UPDATE with existing email', async () => {
      const email1 = `user1${Date.now()}@example.com`;
      const email2 = `user2${Date.now()}@example.com`;

      const user1 = await request(app)
        .post('/users')
        .send({ name: 'User 1', email: email1 });

      await request(app)
        .post('/users')
        .send({ name: 'User 2', email: email2 });

      const response = await request(app)
        .put(`/users/${user1.body.id}`)
        .send({ name: 'User 1 Updated', email: email2 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Ratings API - Error Cases', () => {
    test('should reject rating without songKey', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({ userId: 'test_user', rating: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rating data');
    });

    test('should reject rating without userId', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({ songKey: 'test_song', rating: 1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rating data');
    });

    test('should reject rating with invalid value', async () => {
      const response = await request(app)
        .post('/ratings')
        .send({ songKey: 'test_song', userId: 'test_user', rating: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid rating data');
    });
  });
});
