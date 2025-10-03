const request = require('supertest');
const { app } = require('../../server.js');

// Wait for database to initialize
beforeAll((done) => {
  setTimeout(done, 100);
});

describe('Server Routes - Complete Coverage', () => {
  describe('Static File Routes', () => {
    test('should serve static files', async () => {
      const files = ['/', '/css/styles.css', '/javascript/player.js'];
      for (const file of files) {
        const response = await request(app).get(file);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('All User Routes Coverage', () => {
    let createdUserId;
    const testEmail = `complete${Date.now()}@example.com`;

    test('GET /users should list all users', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    test('POST /users should create new user', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'Complete Test User', email: testEmail });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      createdUserId = response.body.id;
    });

    test('GET /users/:id should get specific user', async () => {
      const response = await request(app).get(`/users/${createdUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(testEmail);
    });

    test('PUT /users/:id should update user', async () => {
      const newEmail = `updated${Date.now()}@example.com`;
      const response = await request(app)
        .put(`/users/${createdUserId}`)
        .send({ name: 'Updated Name', email: newEmail });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User updated successfully');
    });

    test('DELETE /users/:id should delete user', async () => {
      const response = await request(app).delete(`/users/${createdUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deleted successfully');
    });
  });

  describe('All Rating Routes Coverage', () => {
    test('should handle complete rating flow', async () => {
      const songKey = `song_${Date.now()}`;
      const userId = `user_${Date.now()}`;

      // Get with no ratings
      let response = await request(app).get(`/ratings/${songKey}`);
      expect(response.body.thumbsUp).toBe(0);

      // Submit rating
      await request(app).post('/ratings').send({ songKey, userId, rating: 1 });

      // Get with ratings
      response = await request(app).get(`/ratings/${songKey}`);
      expect(response.body.thumbsUp).toBe(1);

      // Update rating
      await request(app).post('/ratings').send({ songKey, userId, rating: -1 });
      response = await request(app).get(`/ratings/${songKey}`);
      expect(response.body.thumbsDown).toBe(1);
    });
  });
});
