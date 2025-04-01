const request = require('supertest');
const axios = require('axios');
const app = require('./llm-service');


jest.mock('axios');


process.env.LLM_API_KEY = 'test-api-key';

afterAll(() => {
    app.close();
});

describe('LLM Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /ask', () => {
        test('should return a response from Gemini model', async () => {
            axios.post.mockResolvedValue({
                data: {
                    candidates: [
                        {
                            content: {
                                parts: [
                                    { text: 'This is a capital city in Western Europe.' }
                                ]
                            }
                        }
                    ]
                }
            });

            const response = await request(app)
                .post('/ask')
                .send({
                    model: 'gemini',
                    userQuestion: 'Can you give me a hint?',
                    gameQuestion: 'What is the capital of France?',
                    answers: ['Madrid', 'London', 'Paris', 'Berlin'],
                    correctAnswer: 'Paris'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('answer');
            expect(response.body.answer).toBe('This is a capital city in Western Europe.');


            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('https://generativelanguage.googleapis.com'),
                expect.objectContaining({
                    contents: expect.arrayContaining([
                        expect.objectContaining({
                            parts: expect.arrayContaining([
                                expect.objectContaining({
                                    text: expect.stringContaining('What is the capital of France?')
                                })
                            ])
                        })
                    ])
                }),
                expect.any(Object)
            );
        });

        test('should return a response from Empathy model', async () => {

            axios.post.mockResolvedValue({
                data: {
                    choices: [
                        {
                            message: {
                                content: 'This city is famous for the Eiffel Tower.'
                            }
                        }
                    ]
                }
            });

            const response = await request(app)
                .post('/ask')
                .send({
                    model: 'empathy',
                    userQuestion: 'Can you give me a hint?',
                    gameQuestion: 'What is the capital of France?',
                    answers: ['Madrid', 'London', 'Paris', 'Berlin'],
                    correctAnswer: 'Paris'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('answer');
            expect(response.body.answer).toBe('This city is famous for the Eiffel Tower.');


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
                            content: "Can you give me a hint?"
                        })
                    ])
                }),
                expect.any(Object)
            );
        });

        test('should handle error when required fields are missing', async () => {
            const response = await request(app)
                .post('/ask')
                .send({
                    model: 'empathy',

                });

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Missing required field');
        });


        test('should handle LLM API error', async () => {
            axios.post.mockRejectedValue(new Error('API error'));

            const response = await request(app)
                .post('/ask')
                .send({
                    model: 'empathy',
                    userQuestion: 'Can you give me a hint?',
                    gameQuestion: 'What is the capital of France?',
                    answers: ['Madrid', 'London', 'Paris', 'Berlin'],
                    correctAnswer: 'Paris'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('answer');
            expect(response.body.answer).toBeNull();
        });

        test('should handle detailed LLM API error with response data', async () => {
            const errorResponse = {
                response: {
                    data: { error: 'Invalid request' },
                    status: 400
                }
            };
            axios.post.mockRejectedValue(errorResponse);

            const response = await request(app)
                .post('/ask')
                .send({
                    model: 'empathy',
                    userQuestion: 'Can you give me a hint?',
                    gameQuestion: 'What is the capital of France?',
                    answers: ['Madrid', 'London', 'Paris', 'Berlin'],
                    correctAnswer: 'Paris'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('answer');
            expect(response.body.answer).toBeNull();
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

            await request(app)
                .post('/ask')
                .send({
                    model: 'empathy',
                    userQuestion: 'Can you give me a hint?',
                    gameQuestion: 'What is the capital of France?',
                    answers: ['Madrid', 'London', 'Paris', 'Berlin'],
                    correctAnswer: 'Paris'
                });


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