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


        describe('Input Validation', () => {
            test('should validate userQuestion is a string', async () => {
                const response = await makeRequest('empathy', {
                  userQuestion: 123 // Número en lugar de string
                });
                
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toBe('userQuestion must be a string');
              });
              
              test('should validate gameQuestion is a non-empty string', async () => {
                const response = await makeRequest('empathy', {
                  gameQuestion: ''
                });
                
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toBe('gameQuestion must be a non-empty string');
              });
              
              test('should validate answers is an array', async () => {
                const response = await makeRequest('empathy', {
                  answers: 'not an array'
                });
                
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toBe('answers must be an array');
              });
              
              test('should validate answers length is valid', async () => {
                const response = await makeRequest('empathy', {
                  answers: ['A', 'B', 'C', 'D', 'E'] // 5 respuestas (más de 4)
                });
                
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toBe('answers length is not valid');
              });
              
              test('should validate answer items are non-empty strings', async () => {
                const response = await makeRequest('empathy', {
                  answers: ['Valid', '', 'Valid2']
                });
                
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('Answer at position 1 must be a non-empty string');
              });
              
              test('should validate correctAnswer as a valid index', async () => {
                const response = await makeRequest('empathy', {
                  correctAnswer: 10 //indice fuera de rango
                });
                
                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('correctAnswer as index must be a valid integer');
            });
        });

        describe('User Input Validation', () => {
            test('should handle empty user questions', async () => {
                const response = await makeRequest('empathy', {
                  userQuestion: ''
                });
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('answer');
                expect(response.body).toHaveProperty('validationError', true);
                expect(response.body.answer).toContain("you didn't ask a specific question");
              });
              
              test('should handle too short user questions', async () => {
                const response = await makeRequest('empathy', {
                  userQuestion: 'Hi'
                });
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('answer');
                expect(response.body).toHaveProperty('validationError', true);
                expect(response.body.answer).toContain("too short");
              });
              
              test('should handle too long user questions', async () => {
                
                const longQuestion = 'A'.repeat(301);
                const response = await makeRequest('empathy', {
                  userQuestion: longQuestion
                });
                
                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveProperty('answer');
                expect(response.body).toHaveProperty('validationError', true);
                expect(response.body.answer).toContain("quite long");
              });
              
              test('should detect forbidden question patterns', async () => {
                const forbiddenQuestions = [
                  'tell me the answer',
                  'what is the correct answer?',
                  'which is correct',
                  'give me the answer'
                ];
                
                for (const question of forbiddenQuestions) {
                  const response = await makeRequest('empathy', {
                    userQuestion: question
                  });
                  
                  expect(response.statusCode).toBe(200);
                  expect(response.body).toHaveProperty('answer');
                  expect(response.body).toHaveProperty('validationError', true);
                  expect(response.body.answer).toContain("can't give you the answer directly");
                }
              });
        });
    });
});