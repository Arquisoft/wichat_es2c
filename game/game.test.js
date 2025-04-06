const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./game-service');
const { User, Match } = require('./game-model');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
});


beforeEach(async () => {

    await User.deleteMany({});
});


async function createTestUser() {
    const user = new User({
        username: 'testuser',
        password: 'password123',
        matches: [],
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
        it('should add a new match to a user', async () => {
            const user = await createTestUser();

            const response = await request(app)
                .post('/addMatch')
                .send({
                    username: 'testuser',
                    difficulty: 1
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Match agregado correctamente');
            expect(response.body.match).toBeDefined();
            expect(response.body.match.difficulty).toBe(1);


            const updatedUser = await User.findOne({ username: 'testuser' });
            expect(updatedUser.matches.length).toBe(1);
            expect(updatedUser.matches[0].difficulty).toBe(1);
        });

        it('should return 404 if user not found', async () => {
            const response = await request(app)
                .post('/addMatch')
                .send({
                    username: 'nonexistentuser',
                    difficulty: 1
                });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Usuario no encontrado');
        });
    });

    describe('POST /addQuestion', () => {
        it('should add a question to the last match', async () => {

            const user = await createTestUser();
            user.matches.push(new Match({ difficulty: 1 }));
            await user.save();

            const response = await request(app)
                .post('/addQuestion')
                .send({
                    username: 'testuser',
                    question: '¿Cuál es la capital de Francia?',
                    correctAnswer: 2,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'París'
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Pregunta añadida al último match');

            const updatedUser = await User.findOne({ username: 'testuser' });
            expect(updatedUser.matches[0].questions.length).toBe(1);
            expect(updatedUser.matches[0].questions[0].text).toBe('¿Cuál es la capital de Francia?');

            const question = updatedUser.matches[0].questions[0];
            const correctAnswerObj = question.answers.find(a => a.correct);
            expect(correctAnswerObj.text).toBe('París');

            const selectedAnswerObj = question.answers.find(a => a.selected);
            expect(selectedAnswerObj.text).toBe('París');
        });

        it('should return 400 if required fields are missing', async () => {
            await createTestUser();

            const response = await request(app)
                .post('/addQuestion')
                .send({
                    username: 'testuser',

                });

            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Error when processing the request');
        });

        it('should return 404 if user or match not found', async () => {
            const response = await request(app)
                .post('/addQuestion')
                .send({
                    username: 'nonexistentuser',
                    question: '¿Cuál es la capital de Francia?',
                    correctAnswer: 2,
                    answers: ['Madrid', 'Londres', 'París', 'Berlín'],
                    selectedAnswer: 'París'
                });

            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('User or match not found');
        });
    });

    describe('POST /endMatch', () => {
        it('should end a match and update user statistics', async () => {
            const user = await createTestUser();
            const match = new Match({ difficulty: 1 });

            match.questions.push({
                text: 'Question 1',
                answers: [
                    { text: 'A', selected: true, correct: true },
                    { text: 'B', selected: false, correct: false }
                ]
            });
            match.questions.push({
                text: 'Question 2',
                answers: [
                    { text: 'A', selected: false, correct: false },
                    { text: 'B', selected: true, correct: true }
                ]
            });
            match.questions.push({
                text: 'Question 3',
                answers: [
                    { text: 'A', selected: true, correct: false },
                    { text: 'B', selected: false, correct: true }
                ]
            });

            user.matches.push(match);
            await user.save();

            const response = await request(app)
                .post('/endMatch')
                .send({
                    username: 'testuser',
                    time: 120
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.message).toBe('Match actualizado');
            expect(response.body.score).toBeDefined();


            const updatedUser = await User.findOne({ username: 'testuser' });
            const updatedMatch = updatedUser.matches[0];
            expect(updatedMatch.time).toBe(120);
            expect(updatedMatch.score).toBeDefined();
            expect(updatedMatch.date).toBeDefined();


            expect(updatedUser.statistics.gamesPlayed).toBe(1);
            expect(updatedUser.statistics.rightAnswers).toBe(2);
            expect(updatedUser.statistics.wrongAnswers).toBe(1);
            expect(updatedUser.statistics.averageTime).toBe(120);
            expect(updatedUser.statistics.bestTime).toBe(120);
        });

        it('should return 404 if user not found', async () => {
            const response = await request(app)
                .post('/endMatch')
                .send({
                    username: 'nonexistentuser',
                    time: 120
                });
            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Usuario no encontrado');
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
            const user = await createTestUser();

            for (let i = 0; i < 5; i++) {
                const match = new Match({
                    difficulty: 1,
                    date: new Date(),
                    time: 100 + i,
                    score: 200 + i
                });

                match.questions.push({
                    text: `Question ${i}`,
                    answers: [
                        { text: 'A', selected: true, correct: true },
                        { text: 'B', selected: false, correct: false }
                    ]
                });

                user.matches.push(match);
            }

            await user.save();

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