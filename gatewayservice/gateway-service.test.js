const request = require('supertest');
const axios = require('axios');
const app = require('./gateway-service');

afterAll(async () => {
    app.close();
});

jest.mock('axios');

const mockAxiosError = (method, urlFragment, status, errorMessage) => {
    axios[method].mockImplementationOnce((url) => {
        if (url.includes(urlFragment)) {
            return Promise.reject({
                response: {
                    status: status,
                    data: { error: errorMessage }
                }
            });
        }
    });
};

describe('Gateway Service', () => {
    it('should return OK for health check', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('OK');
    });

    describe('Authentication and User Management', () => {
        beforeEach(() => {
            axios.post.mockImplementation((url) => {
                if (url.includes('/login')) {
                    return Promise.resolve({ data: { token: 'mockedToken' } });
                } else if (url.includes('/adduser')) {
                    return Promise.resolve({ data: { userId: 'mockedUserId' } });
                }
                return Promise.reject(new Error('Not implemented'));
            });
        });

        it('should forward login request to auth service', async () => {
            const response = await request(app)
                .post('/login')
                .send({ username: process.env.TEST_USER, password: process.env.TEST_PASSWORD });

            expect(response.statusCode).toBe(200);
            expect(response.body.token).toBe('mockedToken');
        });

        it('should handle login error from auth service', async () => {
            axios.post.mockImplementationOnce((url) => {
                if (url.includes('/login')) {
                    return Promise.reject({
                        response: {
                            status: 401,
                            data: { error: 'Invalid credentials' }
                        }
                    });
                }
            });

            const response = await request(app)
                .post('/login')
                .send({ username: 'wronguser', password: 'wrongpass' });

            expect(response.statusCode).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should forward add user request to user service', async () => {
            const response = await request(app)
                .post('/adduser')
                .send({ username: 'newuser', password: 'newpassword' });

            expect(response.statusCode).toBe(200);
            expect(response.body.userId).toBe('mockedUserId');
        });

        it('should handle error when adding user', async () => {
            axios.post.mockImplementationOnce((url) => {
                if (url.includes('/adduser')) {
                    return Promise.reject({
                        response: {
                            status: 409,
                            data: { error: 'Username already exists' }
                        }
                    });
                }
            });

            const response = await request(app)
                .post('/adduser')
                .send({ username: 'existinguser', password: 'somepassword' });

            expect(response.statusCode).toBe(409);
            expect(response.body.error).toBe('Username already exists');
        });
    });

    describe('Game Service Endpoints', () => {
        beforeEach(() => {
            axios.post.mockImplementation((url) => {
                if (url.includes('/addQuestion')) {
                    return Promise.resolve({ data: { questionId: 'mockedQuestionId' } });
                } else if (url.includes('/addMatch')) {
                    return Promise.resolve({ data: { matchId: 'mockedMatchId' } });
                } else if (url.includes('/endMatch')) {
                    return Promise.resolve({ data: { matchId: 'mockedMatchId', status: 'completed' } });
                }
                return Promise.reject(new Error('Not implemented'));
            });

            axios.get.mockImplementation((url) => {
                if (url.includes('/userMatches')) {
                    return Promise.resolve({ data: [{ id: 'match1' }, { id: 'match2' }] });
                } else if (url.includes('/userStatistics')) {
                    return Promise.resolve({ data: { totalGames: 10, wonGames: 7 } });
                }
                return Promise.reject(new Error('Not implemented'));
            });
        });

        it('should forward addQuestion request to game service', async () => {
            const response = await request(app)
                .post('/addQuestion')
                .send({ question: 'Test question', answers: ['A', 'B', 'C'], correctAnswer: 'A' });

            expect(response.statusCode).toBe(200);
            expect(response.body.questionId).toBe('mockedQuestionId');
        });

        it('should forward addMatch request to game service', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({ userId: 'user123', category: 'history' });

            expect(response.statusCode).toBe(200);
            expect(response.body.matchId).toBe('mockedMatchId');
        });

        it('should forward endMatch request to game service', async () => {
            const response = await request(app)
                .post('/endMatch')
                .send({ matchId: 'match123', score: 800 });

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe('completed');
        });

        it('should get user matches from game service', async () => {
            const response = await request(app)
                .get('/userMatches')
                .query({ userId: 'user123' });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].id).toBe('match1');
        });

        it('should get user statistics from game service', async () => {
            const response = await request(app)
                .get('/userStatistics')
                .query({ userId: 'user123' });

            expect(response.statusCode).toBe(200);
            expect(response.body.totalGames).toBe(10);
            expect(response.body.wonGames).toBe(7);
        });

        it('should handle errors from game service', async () => {
            mockAxiosError('get', '/userStatistics', 404, 'User not found');

            const response = await request(app)
                .get('/userStatistics')
                .query({ userId: 'nonexistent' });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

    describe('LLM Service Endpoints', () => {
        beforeEach(() => {
            process.env.LLM_API_KEY = 'fake-api-key';
            axios.post.mockImplementation((url) => {
                if (url.includes('/ask')) {
                    return Promise.resolve({ data: { answer: 'llmanswer' } });
                }
                return Promise.reject(new Error('Not implemented'));
            });
        });

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

        it('should validate required fields for askllm request', async () => {
            const response = await request(app)
                .post('/askllm')
                .send({
                    userQuestion: 'Can you give me a hint?',
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toContain('Missing required field');
        });

        it('should handle errors from llm service', async () => {
            mockAxiosError('post', '/ask', 500, 'LLM service error');

            const response = await request(app)
                .post('/askllm')
                .send({
                    userQuestion: 'Can you give me a hint?',
                    gameQuestion: 'What is the capital of France?',
                    answers: ['Madrid', 'London', 'Paris', 'Berlin'],
                    correctAnswer: 'Paris',
                    model: 'empathy'
                });

            expect(response.statusCode).toBe(500);
            expect(response.body.error).toBe('LLM service error');
        });
    });

    describe('Wikidata Service Endpoints', () => {
        beforeEach(() => {
            axios.post.mockImplementation((url) => {
                if (url.includes('/addQuestions')) {
                    return Promise.resolve({ data: { added: 5 } });
                }
                return Promise.reject(new Error('Not implemented'));
            });

            axios.get.mockImplementation((url) => {
                if (url.includes('/getQuestion')) {
                    return Promise.resolve({
                        data: {
                            question: 'What is the highest mountain?',
                            answers: ['Everest', 'K2', 'Kilimanjaro']
                        }
                    });
                }
                return Promise.reject(new Error('Not implemented'));
            });
        });

        it('should forward addQuestions request to wikidata service', async () => {
            const response = await request(app)
                .post('/addQuestions')
                .send({ category: 'geography', count: 5 });

            expect(response.statusCode).toBe(200);
            expect(response.body.added).toBe(5);
        });

        it('should get question from wikidata service', async () => {
            const response = await request(app)
                .get('/getQuestion');

            expect(response.statusCode).toBe(200);
            expect(response.body.question).toBe('What is the highest mountain?');
        });
    });

    // User Info Service Endpoints
    describe('User Info Service Endpoints', () => {
        beforeEach(() => {
            axios.get.mockImplementation((url) => {
                if (url.includes('/userinfo') && !url.includes('/matches') && !url.includes('/ranking')) {
                    return Promise.resolve({
                        data: [
                            { _id: 'userid1', username: 'user1' },
                            { _id: 'userid2', username: 'user2' }
                        ]
                    });
                } else if (url.includes('/userinfo/matches')) {
                    return Promise.resolve({
                        data: [
                            {
                                id: '6123456789abcdef12345678',
                                username: 'user1',
                                date: '2025-04-05T15:30:00Z',
                                time: 300,
                                score: 800,
                                difficulty: 'medium',
                                correctAnswers: 8,
                                wrongAnswers: 2,
                                questions: []
                            },
                            {
                                id: '6123456789abcdef12345679',
                                username: 'user1',
                                date: '2025-04-04T12:15:00Z',
                                time: 250,
                                score: 650,
                                difficulty: 'easy',
                                correctAnswers: 6,
                                wrongAnswers: 4,
                                questions: []
                            }
                        ]
                    });
                } else if (url.includes('/userinfo/ranking/bestScore')) {
                    return Promise.resolve({
                        data: [
                            {
                                rank: 1,
                                _id: 'userid1',
                                username: 'user1',
                                statistics: {
                                    bestScore: 1200,
                                    gamesPlayed: 10
                                }
                            },
                            {
                                rank: 2,
                                _id: 'userid2',
                                username: 'user2',
                                statistics: {
                                    bestScore: 950,
                                    gamesPlayed: 8
                                }
                            }
                        ]
                    });
                } else if (url.includes('/userinfo/ranking/morePlayed')) {
                    return Promise.resolve({
                        data: [
                            {
                                rank: 1,
                                _id: 'userid1',
                                username: 'user1',
                                statistics: {
                                    bestScore: 1000,
                                    gamesPlayed: 25
                                }
                            },
                            {
                                rank: 2,
                                _id: 'userid2',
                                username: 'user2',
                                statistics: {
                                    bestScore: 850,
                                    gamesPlayed: 18
                                }
                            }
                        ]
                    });
                }
                return Promise.reject(new Error('Not implemented'));
            });
        });

        it('should get users list from userinfo service', async () => {
            const response = await request(app).get('/users');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].username).toBe('user1');
        });

        it('should get user matches from userinfo service', async () => {
            const response = await request(app).get('/userinfo/matches/user1');
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveLength(2);
            // Using the actual structure from the userinfo-service
            expect(response.body[0].id).toBe('6123456789abcdef12345678');
            expect(response.body[0].score).toBe(800);
            expect(response.body[0].correctAnswers).toBe(8);
        });

        it('should get score ranking from userinfo service', async () => {
            const response = await request(app).get('/scoreRanking');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].username).toBe('user1');
            expect(response.body[0].statistics.bestScore).toBe(1200);
            expect(response.body[0].rank).toBe(1);
        });

        it('should get matches count ranking from userinfo service', async () => {
            const response = await request(app).get('/nMatchesRanking');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].username).toBe('user1');
            expect(response.body[0].statistics.gamesPlayed).toBe(25);
            expect(response.body[0].rank).toBe(1);
        });

        it('should handle errors from userinfo service', async () => {
            axios.get.mockImplementationOnce((url) => {
                if (url.includes('/userinfo/matches')) {
                    return Promise.reject({
                        response: {
                            status: 404,
                            data: { error: 'User not found' }
                        }
                    });
                }
            });

            const response = await request(app).get('/userinfo/matches/nonexistent');

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

    describe('General Error Handling', () => {
        it('should handle connection errors gracefully', async () => {
            axios.get.mockImplementationOnce((url) => {
                if (url.includes('/userStatistics')) {
                    return Promise.reject(new Error('Network error'));
                }
            });

            const response = await request(app)
                .get('/userStatistics')
                .query({ userId: 'user123' });
            expect(response.statusCode).toBe(500);
            expect(response.body.error).toBe('Internal error trying to obtain the user list');
        });
    });


        });

        describe('User Service Endpoints', () => {
            it('should handle detailed user list response', async () => {
                axios.get.mockImplementationOnce((url) => {
                    if (url.includes('/userinfo')) {
                        return Promise.resolve({
                            data: [
                                { _id: 'user1', username: 'user1', email: 'user1@example.com' },
                                { _id: 'user2', username: 'user2', email: 'user2@example.com' }
                            ]
                        });
                    }
                });

                const response = await request(app).get('/users');

                expect(response.statusCode).toBe(200);
                expect(response.body).toHaveLength(2);
                expect(response.body[0]).toHaveProperty('username');
                expect(response.body[0]).not.toHaveProperty('email'); // Should only return username
            });

            it('should handle network errors when fetching users', async () => {
                axios.get.mockImplementationOnce((url) => {
                    if (url.includes('/userinfo')) {
                        return Promise.reject(new Error('Network error'));
                    }
                });

                const response = await request(app).get('/users');

                expect(response.statusCode).toBe(500);
                expect(response.body.error).toBe('Error when trying to access the user list');
            });
        });





            it('should handle network errors for userMatches', async () => {
                axios.get.mockImplementationOnce(() => {
                    return Promise.reject(new Error('Network error'));
                });

                const response = await request(app)
                    .get('/userMatches')
                    .query({ userId: 'user123' });

                expect(response.statusCode).toBe(500);
                expect(response.body.error).toBeDefined();
            });






                it('should validate all required fields for askllm endpoint', async () => {
                    // Test missing gameQuestion
                    let response = await request(app)
                        .post('/askllm')
                        .send({
                            userQuestion: 'Can you give me a hint?',
                            // gameQuestion is missing
                            answers: ['A', 'B', 'C'],
                            correctAnswer: 'B',
                            model: 'empathy'
                        });

                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toContain('Missing required field: gameQuestion');

                    // Test missing answers
                    response = await request(app)
                        .post('/askllm')
                        .send({
                            userQuestion: 'Can you give me a hint?',
                            gameQuestion: 'What is 2+2?',
                            // answers is missing
                            correctAnswer: '4',
                            model: 'empathy'
                        });

                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toContain('Missing required field: answers');

                    // Test missing model
                    response = await request(app)
                        .post('/askllm')
                        .send({
                            userQuestion: 'Can you give me a hint?',
                            gameQuestion: 'What is 2+2?',
                            answers: ['3', '4', '5'],
                            correctAnswer: '4',
                            // model is missing
                        });

                    expect(response.statusCode).toBe(400);
                    expect(response.body.error).toContain('Missing required field: model');
            });


                it('should handle network errors for score ranking', async () => {
                    axios.get.mockImplementationOnce(() => {
                        return Promise.reject(new Error('Network error'));
                    });

                    const response = await request(app).get('/scoreRanking');

                    expect(response.statusCode).toBe(500);
                    expect(response.body.error).toBe('Error fetching score ranking');
                });

                it('should handle network errors for matches ranking', async () => {
                    axios.get.mockImplementationOnce(() => {
                        return Promise.reject(new Error('Network error'));
                    });

                    const response = await request(app).get('/nMatchesRanking');

                    expect(response.statusCode).toBe(500);
                    expect(response.body.error).toBe('Error fetching number of matches ranking');
                });

                it('should handle network errors for user matches', async () => {
                    axios.get.mockImplementationOnce(() => {
                        return Promise.reject(new Error('Network error'));
                    });

                    const response = await request(app).get('/userinfo/matches/testuser');

                    expect(response.statusCode).toBe(500);
                    expect(response.body.error).toBe('Error when trying to access users matches');

            });




