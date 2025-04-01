const request = require('supertest');
const axios = require('axios');
const app = require('./llm-service');

afterAll(async () => {
    app.close();
});

jest.mock('axios');

describe('LLM Service', () => {
    // Mock responses from external services
    axios.post.mockImplementation((url, data) => {
        if (url.startsWith('https://generativelanguage')) {
            return Promise.resolve({ data: { candidates: [{ content: { parts: [{ text: 'llmanswer' }] } }] } });
        } else if (url.startsWith('https://empathyai')) {
            //return Promise.resolve({ data: { answer: 'llmanswer' } });
            return Promise.resolve({
                status: 200,
                data: {
                    choices: [{ message: { content: 'llmanswer' } }]
                }
            });
        }
    });


    process.env.LLM_API_KEY = 'fake-api-key';
    test('should reply with a hint', async () => {

        axios.post.mockResolvedValue({
            data: { choices: [{ message: { content: 'This city is known as the City of Light.' } }] }
        });

        const response = await request(app)
            .post('/ask')
            .send({
                model: 'empathy',
                userQuestion: '¿Me puedes dar una pista?',
                gameQuestion: '¿Cuál es la capital de Francia?',
                answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                correctAnswer: 'París'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.answer).toBe('This city is known as the City of Light.');
    });

});