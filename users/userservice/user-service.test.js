const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./user-model');


let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  app = require('./user-service'); 
});

afterAll(async () => {
    app.close();
    await mongoServer.stop();
});

describe('User Service', () => {
  it('should add a new user on POST /adduser', async () => {
    const newUser = {
      username: 'testuser', // NOSONAR
      password: 'testpassword', // NOSONAR
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser'); // NOSONAR

    // Check if the user is inserted into the database
    const userInDb = await User.findOne({ username: 'testuser' }); // NOSONAR

    // Assert that the user exists in the database
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser'); // NOSONAR

    // Assert that the password is encrypted
    const isPasswordValid = await bcrypt.compare('testpassword', userInDb.password); // NOSONAR
    expect(isPasswordValid).toBe(true);
  });
});
