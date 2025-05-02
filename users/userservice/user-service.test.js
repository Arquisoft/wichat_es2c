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
  
  //Funcion auxiliar para evitar repeticion
  async function testUserValidation(userData, expectedError) {
    const response = await request(app).post('/adduser').send(userData);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain(expectedError);
    return response;
  }
  function createTestUser(overrides = {}) {
    return {
      username: 'validuser',
      password: 'ValidPassword1!',
      ...overrides
    };
  }

  it('should add a new user on POST /adduser', async () => {
    const newUser = createTestUser({
      username: 'testuser', // NOSONAR
      password: 'testpassworD1?' // NOSONAR
    });

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser'); // NOSONAR

    const userInDb = await User.findOne({ username: 'testuser' }); // NOSONAR

    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser'); // NOSONAR

    const isPasswordValid = await bcrypt.compare('testpassworD1?', userInDb.password); // NOSONAR
    expect(isPasswordValid).toBe(true);
  });

  describe('Input Validation', () => {
    describe('Length Validation', () => {
      const lengthTestCases = [
        { 
          name: 'username too short', 
          data: { username: 'ab' }, 
          error: 'Username length must be at least 3' 
        },
        { 
          name: 'password too short', 
          data: { password: 'Abc' }, 
          error: 'Password length must be at least 4' 
        },
        { 
          name: 'username too long', 
          data: { username: 'a'.repeat(21) }, 
          error: 'must be at most 20' 
        },
        { 
          name: 'password too long', 
          data: { password: 'A1!'.repeat(7) }, 
          error: 'must be at most 20' 
        }
      ];

      //Generar tests automáticamente para cada caso
      lengthTestCases.forEach(testCase => {
        it(`should reject ${testCase.name}`, async () => {
          await testUserValidation(
            createTestUser(testCase.data),
            testCase.error
          );
        });
      });
    });

    describe('Password Complexity Validation', () => {
      const complexityTestCases = [
        { 
          name: 'without numbers', 
          password: 'NoNumbersHere!' 
        },
        { 
          name: 'without lowercase letters', 
          password: 'ALLUPPERCASE123!' 
        },
        { 
          name: 'without uppercase letters', 
          password: 'alllowercase123!' 
        },
        { 
          name: 'without special characters', 
          password: 'NoSpecialChars123' 
        },
        { 
          name: 'with spaces', 
          password: 'Has Spaces 123!' 
        }
      ];

      complexityTestCases.forEach(testCase => {
        it(`should reject password ${testCase.name}`, async () => {
          await testUserValidation(
            createTestUser({ password: testCase.password }),
            'Password requirements'
          );
        });
      });
    });

    it('should reject when username already exists', async () => {
      const duplicateUser = createTestUser({ username: 'duplicateuser' });
      //Crea el user
      await request(app).post('/adduser').send(duplicateUser);
      
      //Luego intentar crear uno con el mismo username
      await testUserValidation(duplicateUser, 'Username already exists');
    });

    describe('Required Fields Validation', () => {
      it('should reject when username is missing', async () => {
        const { password } = createTestUser();
        await testUserValidation({ password }, 'Missing required field');
      });

      it('should reject when password is missing', async () => {
        const { username } = createTestUser();
        await testUserValidation({ username }, 'Missing required field');
      });
    });
  });
});




