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
      username: process.env.TEST_USER,
      password: process.env.TEST_PASSWORD
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', process.env.TEST_USER);

    // Check if the user is inserted into the database
    const userInDb = await User.findOne({ username: process.env.TEST_USER});

    // Assert that the user exists in the database
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe(process.env.TEST_USER);

    // Assert that the password is encrypted
    const isPasswordValid = await bcrypt.compare(process.env.TEST_PASSWORD, userInDb.password);
    expect(isPasswordValid).toBe(true);
  });
});
