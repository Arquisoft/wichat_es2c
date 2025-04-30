const request = require('supertest');
const axios = require('axios');
const app = require('./llm-service');

jest.mock('axios');

process.env.LLM_API_KEY = 'test-api-key';

afterAll(() => {
    app.close();
});

describe('LLM Service', () => {
    const testData = {
        userQuestion: 'Can you give me a hint?',
        gameQuestion: 'What is the capital of France?',
        answers: ['Madrid', 'London', 'Paris', 'Berlin'],
        correctAnswer: 'Paris'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const makeRequest = async (model, customData = {}) => {
        const requestData = {
            model,
            ...testData,
            ...customData
        };
        return request(app).post('/ask').send(requestData);
    };

    describe('POST /ask', () => {
        test('should return a response from Gemini model', async () => {
            const mockResponse = 'This is a capital city in Western Europe.';
            axios.post.mockResolvedValue({
                data: {
                    candidates: [
                        {
                            content: {
                                parts: [{ text: mockResponse }]
                            }
                        }
                    ]
                }
            });

            const response = await makeRequest('gemini');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('answer');
            expect(response.body.answer).toBe(mockResponse);

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('https://generativelanguage.googleapis.com'),
                expect.objectContaining({
                    contents: expect.arrayContaining([
                        expect.objectContaining({
                            parts: expect.arrayContaining([
                                expect.objectContaining({
                                    text: expect.stringContaining(testData.gameQuestion)
                                })
                            ])
                        })
                    ])
                }),
                expect.any(Object)
            );
        });

        test('should return a response from Empathy model', async () => {
            const mockResponse = 'This city is famous for the Eiffel Tower.';
            axios.post.mockResolvedValue({
                data: {
                    choices: [
                        {
                            message: {
                                content: mockResponse
                            }
                        }
                    ]
                }
            });

            const response = await makeRequest('empathy');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('answer');
            expect(response.body.answer).toBe(mockResponse);

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('https://empathyai.prod.empathy.co'),
                expect.objectContaining({
                    model: "qwen/Qwen2.5-Coder-7B-Instruct",
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            role: "system"
                        }),
                        expect.objectContaining({
                            role: "user",
                            content: testData.userQuestion
                        })
                    ])
                }),
                expect.any(Object)
            );
        });

        test('should handle error when required fields are missing', async () => {
            const response = await makeRequest('empathy', {
                userQuestion: undefined,
                gameQuestion: undefined,
                answers: undefined,
                correctAnswer: undefined
            });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Missing required field');
        });

        test('should handle LLM API errors', async () => {
            axios.post.mockRejectedValue(new Error('API error'));
            let response = await makeRequest('empathy');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('answer');
            expect(response.body.answer).toBe("I'm currently having trouble processing questions. Try again later.");

            const errorResponse = {
                response: {
                    data: { error: 'Invalid request' },
                    status: 400
                }
            };
            axios.post.mockRejectedValue(errorResponse);

            response = await makeRequest('empathy');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('answer');
            expect(response.body.answer).toBe("I'm currently having trouble processing questions. Try again later.");
        });

        test('should correctly format context prompt', async () => {
            axios.post.mockResolvedValue({
                data: {
                    choices: [
                        {
                            message: {
                                content: 'This city has a famous tower.'
                            }
                        }
                    ]
                }
            });

            await makeRequest('empathy');

            expect(axios.post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    messages: [
                        {
                            role: 'system',
                            content: expect.stringContaining('capital of France')
                        },
                        expect.any(Object)
                    ]
                }),
                expect.any(Object)
            );

            const systemPrompt = axios.post.mock.calls[0][1].messages[0].content;
            expect(systemPrompt).toContain('Paris (This is the correct answer)');
        });
    });
});