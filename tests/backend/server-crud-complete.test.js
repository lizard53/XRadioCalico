const request = require('supertest');
const { app } = require('../../server.js');

// Wait for database to initialize
beforeAll((done) => {
  setTimeout(done, 100);
});

describe('Server Complete CRUD Operations', () => {
  describe('Users Full Lifecycle', () => {
    test('should create, read, update, and delete a user', async () => {
      const uniqueEmail = `lifecycle${Date.now()}@example.com`;

      // CREATE
      const createResponse = await request(app)
        .post('/users')
        .send({ name: 'John Doe', email: uniqueEmail });

      expect(createResponse.status).toBe(201);
      const userId = createResponse.body.id;
      expect(userId).toBeDefined();

      // READ by ID
      const getResponse = await request(app).get(`/users/${userId}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.user.name).toBe('John Doe');
      expect(getResponse.body.user.email).toBe(uniqueEmail);

      // UPDATE
      const updateResponse = await request(app)
        .put(`/users/${userId}`)
        .send({ name: 'Jane Doe', email: uniqueEmail });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.message).toBe('User updated successfully');

      // Verify update
      const verifyResponse = await request(app).get(`/users/${userId}`);
      expect(verifyResponse.body.user.name).toBe('Jane Doe');

      // DELETE
      const deleteResponse = await request(app).delete(`/users/${userId}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('User deleted successfully');

      // Verify deletion
      const finalResponse = await request(app).get(`/users/${userId}`);
      expect(finalResponse.status).toBe(404);
    });

    test('should list multiple users', async () => {
      const email1 = `list1${Date.now()}@example.com`;
      const email2 = `list2${Date.now()}@example.com`;

      await request(app).post('/users').send({ name: 'User 1', email: email1 });
      await request(app).post('/users').send({ name: 'User 2', email: email2 });

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Ratings Complete Flow', () => {
    test('should handle complete rating lifecycle', async () => {
      const songKey = `song${Date.now()}`;
      const user1 = `user1${Date.now()}`;
      const user2 = `user2${Date.now()}`;

      // Submit ratings
      await request(app).post('/ratings').send({ songKey, userId: user1, rating: 1 });
      await request(app).post('/ratings').send({ songKey, userId: user2, rating: -1 });

      // Get ratings
      const getRatings = await request(app).get(`/ratings/${songKey}`);
      expect(getRatings.body.thumbsUp).toBe(1);
      expect(getRatings.body.thumbsDown).toBe(1);

      // Change vote
      await request(app).post('/ratings').send({ songKey, userId: user1, rating: -1 });

      // Verify changed vote
      const final = await request(app).get(`/ratings/${songKey}`);
      expect(final.body.thumbsUp).toBe(0);
      expect(final.body.thumbsDown).toBe(2);
    });
  });
});
