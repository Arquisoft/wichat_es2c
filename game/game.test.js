const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;
const { User, Match, Statistics } = require('./game-model');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    app = require('./game-service');
});

afterAll(async () => {
    await new Promise(resolve => app.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    await Match.deleteMany({});
});

async function createTestUser() {
    const user = new User({
        username: 'testuser',
        password: 'password123',
        statistics: {
            gamesPlayed: 0,
            averageScore: 0,
            bestScore: 0,
            averageTime: 0,
            bestTime: 0,
            rightAnswers: 0,
            wrongAnswers: 0
        }
    });
    await user.save();
    return user;
}

describe('Game Service', () => {
    describe('POST /addMatch', () => {
        it('should add a new match with a question for a user', async () => {
            const user = await createTestUser();
            const endTime = new Date();

            const response = await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 1,
                    question: '¿Cuál es la capital de Francia?',
                    correctAnswer: 2,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'París',
                    time: 60,
                    endTime: endTime,
                    isLastQuestion: false
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Question added to match');

            const matches = await Match.find({ username: 'testuser' });
            expect(matches.length).toBe(1);
            expect(matches[0].difficulty).toBe(1);
            expect(matches[0].questions.length).toBe(1);
            expect(matches[0].questions[0].text).toBe('¿Cuál es la capital de Francia?');
        });

        it('should mark a match as complete and update statistics when isLastQuestion is true', async () => {
            const user = await createTestUser();
            const endTime = new Date();

            await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 1,
                    question: '¿Cuál es la capital de Francia?',
                    correctAnswer: 2,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'París',
                    time: 30,
                    endTime: endTime,
                    isLastQuestion: false
                });

            const response = await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 1,
                    question: '¿Cuál es la capital de España?',
                    correctAnswer: 0,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'Madrid',
                    time: 60,
                    endTime: endTime,
                    isLastQuestion: true
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Game completed and statistics updated');
            expect(response.body.statistics).toBeDefined();
            expect(response.body.match).toBeDefined();
            expect(response.body.match.score).toBeDefined();

            const updatedUser = await User.findOne({ username: 'testuser' });
            expect(updatedUser.statistics.gamesPlayed).toBe(1);
            expect(updatedUser.statistics.rightAnswers).toBe(2);
            expect(updatedUser.statistics.wrongAnswers).toBe(0);
        });

        it('should handle incorrect answers when calculating score', async () => {
            const user = await createTestUser();
            const endTime = new Date();

            await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 1,
                    question: '¿Cuál es la capital de Francia?',
                    correctAnswer: 2,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'París',
                    time: 30,
                    endTime: endTime,
                    isLastQuestion: false
                });

            const response = await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 1,
                    question: '¿Cuál es la capital de España?',
                    correctAnswer: 0,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'Londres',
                    time: 60,
                    endTime: endTime,
                    isLastQuestion: true
                });

            expect(response.statusCode).toBe(201);

            const updatedUser = await User.findOne({ username: 'testuser' });
            expect(updatedUser.statistics.rightAnswers).toBe(1);
            expect(updatedUser.statistics.wrongAnswers).toBe(1);

            const match = await Match.findOne({ username: 'testuser' });
            expect(match.score).toBe(1 * (1 * 25) - (1 * 5));
        });

        it('should create a new match if endTime is different', async () => {
            const user = await createTestUser();
            const firstEndTime = new Date('2023-01-01T12:00:00Z');
            const secondEndTime = new Date('2023-01-02T12:00:00Z');

            await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 1,
                    question: '¿Cuál es la capital de Francia?',
                    correctAnswer: 2,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'París',
                    time: 30,
                    endTime: firstEndTime,
                    isLastQuestion: true
                });

            await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 2,
                    question: '¿Cuál es la capital de España?',
                    correctAnswer: 0,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'Madrid',
                    time: 45,
                    endTime: secondEndTime,
                    isLastQuestion: false
                });

            const matches = await Match.find({ username: 'testuser' }).sort({ date: 1 });
            expect(matches.length).toBe(2);
            expect(matches[0].date.toISOString()).toBe(firstEndTime.toISOString());
            expect(matches[1].date.toISOString()).toBe(secondEndTime.toISOString());
        });

        it('should return 400 if required fields are missing', async () => {
            await createTestUser();

            const response = await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 1
                    // Missing required fields
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
        });

        it('should return 404 if user not found', async () => {
            const endTime = new Date();

            const response = await request(app)
                .post('/addMatch')
                .send({
                    username: 'nonexistentuser',
                    difficulty: 1,
                    question: '¿Cuál es la capital de Francia?',
                    correctAnswer: 2,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'París',
                    time: 60,
                    endTime: endTime,
                    isLastQuestion: false
                });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('User not found');
        });


        describe('Input Validation', () => {
            beforeEach(async () => {
            await createTestUser();
            });
            
            it('should validate difficulty field', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 'testuser',
                difficulty: 3, // Valor inválido, debe ser 1 o 2
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 2,
                answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                selectedAnswer: 'París',
                time: 60,
                endTime: new Date(),
                isLastQuestion: false
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
            expect(response.body.details).toContain('Difficulty must be either 1 (normal) or 2 (hard)');
            });
            
            it('should validate correctAnswer is within bounds', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 'testuser',
                difficulty: 1,
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 5, // Fuera del rango válido
                answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                selectedAnswer: 'París',
                time: 60,
                endTime: new Date(),
                isLastQuestion: false
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
            expect(response.body.details).toContain('Correct answer must be a non-negative integer and less than 4');
            });
            
            it('should validate selectedAnswer matches an answer in the answers array', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 'testuser',
                difficulty: 1,
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 2,
                answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                selectedAnswer: 'Roma', // No está en el array de respuestas
                time: 60,
                endTime: new Date(),
                isLastQuestion: false
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
            expect(response.body.details).toContain('Selected answer must be one of the provided answers');
            });
            
            it('should validate time is a positive number', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 'testuser',
                difficulty: 1,
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 2,
                answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                selectedAnswer: 'París',
                time: -10,
                endTime: new Date(),
                isLastQuestion: false
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
            expect(response.body.details).toContain('Time must be a positive number');
            });
            
            it('should validate answers array has valid content', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 'testuser',
                difficulty: 1,
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 2,
                answers: ['Madrid', '', 'París', 'Berlín'],
                selectedAnswer: 'París',
                time: 60,
                endTime: new Date(),
                isLastQuestion: false
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
            expect(response.body.details).toContain('Each answer must be a non-empty string');
            });
            
            it('should validate isLastQuestion is a boolean', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 'testuser',
                difficulty: 1,
                question: '¿Cuál es la capital de Francia?',
                correctAnswer: 2,
                answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                selectedAnswer: 'París',
                time: 60,
                endTime: new Date(),
                isLastQuestion: 'yes' // String en lugar de boolean
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
            expect(response.body.details).toContain('isLastQuestion must be a boolean value');
            });
            
            it('should validate all required fields are present', async () => {
            
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 'testuser',
                difficulty: 1,
                // Faltan question, correctAnswer, answers, selectedAnswer, time, endTime
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
            expect(response.body.details).toContain('Missing required field: question');
            });
            
            it('should validate data types of all fields', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 123,
                difficulty: '1',
                question: true,
                correctAnswer: '2',
                answers: 'Madrid, Londres, París, Berlín',
                selectedAnswer: true,
                time: '60',
                endTime: 123456789,
                isLastQuestion: 1 
                });
            
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Invalid match data');
            });
            
            it('should work with valid data at boundary conditions', async () => {
            // Test con valores límite pero válidos
            const response = await request(app)
                .post('/addMatch')
                .send({
                username: 'testuser',
                difficulty: 1,
                question: 'A', // Cadena muy corta pero no vacía
                correctAnswer: 0, // Valor mínimo válido
                answers: ['A', 'B', 'C', 'D'],
                selectedAnswer: 'A',
                time: 0.1, // Valor positivo mínimo
                endTime: new Date(0), // Fecha mínima válida
                isLastQuestion: false
                });
            
            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Question added to match');
            });
        });

    });

    describe('GET /userStatistics', () => {
        it('should return user statistics', async () => {
            const user = await createTestUser();
            user.statistics = {
                gamesPlayed: 5,
                averageScore: 100.5,
                bestScore: 150,
                averageTime: 90.3,
                bestTime: 60,
                rightAnswers: 20,
                wrongAnswers: 10
            };
            await user.save();

            const response = await request(app)
                .get('/userStatistics')
                .query({ username: 'testuser' });

            expect(response.statusCode).toBe(200);
            expect(response.body.statistics).toBeDefined();
            expect(response.body.statistics.gamesPlayed).toBe(5);
            expect(response.body.statistics.averageScore).toBe(100.5);
            expect(response.body.statistics.bestScore).toBe(150);
        });

        it('should return 404 if user not found', async () => {
            const response = await request(app)
                .get('/userStatistics')
                .query({ username: 'nonexistentuser' });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Usuario no encontrado');
        });
    });

    describe('GET /userMatches', () => {
        it('should return paginated user matches', async () => {
            await createTestUser();

            for (let i = 0; i < 5; i++) {
                const match = new Match({
                    username: 'testuser',
                    difficulty: 1,
                    date: new Date(),
                    time: 100 + i,
                    score: 200 + i,
                    questions: [{
                        text: `Question ${i}`,
                        answers: [
                            { text: 'A', selected: true, correct: true },
                            { text: 'B', selected: false, correct: false }
                        ]
                    }]
                });
                await match.save();
            }

            const response = await request(app)
                .get('/userMatches')
                .query({
                    username: 'testuser',
                    page: 1,
                    limit: 3
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.matches).toBeDefined();
            expect(response.body.matches.length).toBe(3);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.totalMatches).toBe(5);
            expect(response.body.pagination.totalPages).toBe(2);
            expect(response.body.pagination.currentPage).toBe(1);

            const page2Response = await request(app)
                .get('/userMatches')
                .query({
                    username: 'testuser',
                    page: 2,
                    limit: 3
                });

            expect(page2Response.statusCode).toBe(200);
            expect(page2Response.body.matches.length).toBe(2);
        });

        it('should return 404 if user not found', async () => {
            const response = await request(app)
                .get('/userMatches')
                .query({
                    username: 'nonexistentuser',
                    page: 1,
                    limit: 10
                });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Usuario no encontrado');
        });
    });
});