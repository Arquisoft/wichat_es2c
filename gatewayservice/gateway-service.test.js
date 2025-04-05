const request = require('supertest');
const axios = require('axios');
const app = require('./gateway-service'); 

afterAll(async () => {
    app.close();
  });

jest.mock('axios');

describe('Gateway Service', () => {
  // Mock responses from external services
  axios.post.mockImplementation((url, data) => {
    if (url.endsWith('/login')) {
      return Promise.resolve({ data: { token: 'mockedToken' } });
    } else if (url.endsWith('/adduser')) {
      return Promise.resolve({ data: { userId: 'mockedUserId' } });
    } else if (url.endsWith('/ask')) {
      return Promise.resolve({ data: { answer: 'llmanswer' } });
    }
  });

  // Test /login endpoint
  it('should forward login request to auth service', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: process.env.TEST_USER, password: process.env.TEST_PASSWORD });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBe('mockedToken');
  });

  // Test /adduser endpoint
  it('should forward add user request to user service', async () => {
    const response = await request(app)
      .post('/adduser')
      .send({ username: 'newuser', password: 'newpassword' }); // NOSONAR

    expect(response.statusCode).toBe(200);
    expect(response.body.userId).toBe('mockedUserId');
  });

  // Test /askllm endpoint
  process.env.LLM_API_KEY = 'fake-api-key';
  it('should forward askllm request to the llm service', async () => {
    const response = await request(app)
        .post('/askllm')
        .send({
          userQuestion: 'Can you give me a hint?',
          gameQuestion: 'What is the capital of France?',
          answers: ['Madrid', 'London', 'Paris', 'Berlin'],
          correctAnswer: 'Paris',
          model: 'empathy'
        });

    expect(response.statusCode).toBe(200);
    expect(response.body.answer).toBe('llmanswer');
  });
});