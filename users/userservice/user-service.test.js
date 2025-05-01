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
      password: 'testpassworD1?', // NOSONAR
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
    const isPasswordValid = await bcrypt.compare('testpassworD1?', userInDb.password); // NOSONAR
    expect(isPasswordValid).toBe(true);
  });


  describe('Input Validation', () => {
    
    it('should reject username that is too short', async () => {
      const newUser = {
        username: 'ab',
        password: 'ValidPassword1!'
      };

      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Username length must be at least 3');
    });

    it('should reject password that is too short', async () => {
      const newUser = {
        username: 'validuser',
        password: 'Abc'
      };

      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Password length must be at least 4');
    });

    it('should reject username that is too long', async () => {
      const newUser = {
        username: 'a'.repeat(21),
        password: 'ValidPassword1!'
      };

      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('must be at most 20');
    });

    it('should reject password that is too long', async () => {
      const newUser = {
        username: 'validuser',
        password: 'A1!'.repeat(7)
      };

      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('must be at most 20');
    });

    describe('Password Complexity Validation', () => {
      it('should reject password without numbers', async () => {
        const newUser = {
          username: 'validuser',
          password: 'NoNumbersHere!'
        };

        const response = await request(app).post('/adduser').send(newUser);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password requirements');
      });

      it('should reject password without lowercase letters', async () => {
        const newUser = {
          username: 'validuser',
          password: 'ALLUPPERCASE123!'
        };

        const response = await request(app).post('/adduser').send(newUser);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password requirements');
      });

      it('should reject password without uppercase letters', async () => {
        const newUser = {
          username: 'validuser',
          password: 'alllowercase123!'
        };

        const response = await request(app).post('/adduser').send(newUser);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password requirements');
      });

      it('should reject password without special characters', async () => {
        const newUser = {
          username: 'validuser',
          password: 'NoSpecialChars123'
        };

        const response = await request(app).post('/adduser').send(newUser);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password requirements');
      });

      it('should reject password with spaces', async () => {
        const newUser = {
          username: 'validuser',
          password: 'Has Spaces 123!'
        };

        const response = await request(app).post('/adduser').send(newUser);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('Password requirements');
      });
    });

    it('should reject when username already exists', async () => {
      const newUser = {
        username: 'duplicateuser',
        password: 'ValidPassword1!'
      };

      await request(app).post('/adduser').send(newUser);

      // Intentar crear otro usuario con el mismo username
      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Username already exists');
    });

    it('should reject when required fields are missing', async () => {
      // Falta password
      const missingPassword = {
        username: 'testuser123'
      };

      const response1 = await request(app).post('/adduser').send(missingPassword);
      expect(response1.status).toBe(400);
      expect(response1.body).toHaveProperty('error');
      expect(response1.body.error).toContain('Missing required field');

      // Falta username
      const missingUsername = {
        password: 'ValidPassword1!'
      };

      const response2 = await request(app).post('/adduser').send(missingUsername);
      expect(response2.status).toBe(400);
      expect(response2.body).toHaveProperty('error');
      expect(response2.body.error).toContain('Missing required field');
    });
  });

});
