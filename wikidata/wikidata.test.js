const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');
const express = require('express');
const cors = require('cors');

jest.mock('axios');

const { Question, Answer } = require('./wikidata-model');

let mongoServer;
let app;

let cachedQuestions = null;
let lastCacheTime = null;
const CACHE_DURATION = 1000 * 60 * 60;

const query = `
    SELECT ?countryLabel ?capitalLabel (SAMPLE(?flagURL) as ?flag)
    WHERE {
        ?country wdt:P31 wd:Q6256;  # Countries
                 wdt:P36 ?capital;   # Capitals
                 wdt:P41 ?flagURL.   # Flags
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    GROUP BY ?countryLabel ?capitalLabel
    LIMIT 50
`;

const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

async function addQuestions() {
    if (cachedQuestions && (Date.now() - lastCacheTime <= CACHE_DURATION)) {
        return cachedQuestions;
    }

    try {
        const response = await axios.get(url);
        const countries = response.data.results.bindings;

        const questions = countries.map(country => {
            const incorrectCountries = countries
                .filter(c => c.countryLabel.value !== country.countryLabel.value)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);

            const answers = [
                new Answer({
                    text: country.capitalLabel.value,
                    correct: true,
                    selected: false
                }),
                ...incorrectCountries.map(incorrectCountry =>
                    new Answer({
                        text: incorrectCountry.capitalLabel.value,
                        correct: false,
                        selected: false
                    })
                )
            ];

            const shuffledAnswers = answers.sort(() => 0.5 - Math.random());
            const flagUrl = country.flag ? country.flag.value : null;

            return new Question({
                text: `Whats the capital city of ${country.countryLabel.value}?`,
                answers: shuffledAnswers,
                image: flagUrl,
            });
        });


        cachedQuestions = questions;
        lastCacheTime = Date.now();

        await Question.deleteMany({});
        await Question.insertMany(cachedQuestions);

        return questions;
    } catch (error) {
        console.error("Error fetching or saving capital questions:", error);
        throw error;
    }
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/getQuestion', async (req, res) => {
        try {
            await addQuestions();

            const question = await Question.aggregate([
                { $sample: { size: 1 } }
            ]);

            if (!question || question.length === 0) {
                return res.status(404).json({ error: 'No questions found in the database' });
            }

            const selectedQuestion = question[0];

            const choices = selectedQuestion.answers
                .map(answer => answer.text)
                .sort(() => 0.5 - Math.random());

            const correctAnswer = selectedQuestion.answers
                .find(answer => answer.correct)?.text;

            const flagUrl = selectedQuestion.image || null;

            res.json({
                question: selectedQuestion.text,
                choices: choices,
                answer: correctAnswer,
                image: flagUrl
            });
        } catch (error) {
            console.error("Error generating question:", error);
            res.status(500).json({ error: 'Failed to generate question', details: error.message });
        }
    });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Question.deleteMany({});
    cachedQuestions = null;
    lastCacheTime = null;
    jest.clearAllMocks();
});

const mockWikidataResponse = {
    data: {
        results: {
            bindings: [
                {
                    countryLabel: { value: 'France' },
                    capitalLabel: { value: 'Paris' },
                    flag: { value: 'https://commons.wikimedia.org/wiki/File:Flag_of_France.svg' }
                },
                {
                    countryLabel: { value: 'Spain' },
                    capitalLabel: { value: 'Madrid' },
                    flag: { value: 'https://commons.wikimedia.org/wiki/File:Flag_of_Spain.svg' }
                },
                {
                    countryLabel: { value: 'Germany' },
                    capitalLabel: { value: 'Berlin' },
                    flag: { value: 'https://commons.wikimedia.org/wiki/File:Flag_of_Germany.svg' }
                },
                {
                    countryLabel: { value: 'United Kingdom' },
                    capitalLabel: { value: 'London' },
                    flag: { value: 'https://commons.wikimedia.org/wiki/File:Flag_of_the_United_Kingdom.svg' }
                }
            ]
        }
    }
};

describe('Wikidata Service', () => {
    describe('GET /getQuestion', () => {
        it('should return a random question with choices and answer', async () => {
            axios.get.mockResolvedValueOnce(mockWikidataResponse);

            const response = await request(app).get('/getQuestion');

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('question');
            expect(response.body).toHaveProperty('choices');
            expect(response.body).toHaveProperty('answer');
            expect(response.body).toHaveProperty('image');


            expect(response.body.question).toMatch(/Whats the capital city of [A-Za-z ]+\?/);
            expect(response.body.choices.length).toBe(4);
            expect(response.body.choices).toContain(response.body.answer);
        });

        it('should fetch from Wikidata API when cache is empty', async () => {
            axios.get.mockResolvedValueOnce(mockWikidataResponse);

            await request(app).get('/getQuestion');

            expect(axios.get).toHaveBeenCalledTimes(1);
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('https://query.wikidata.org/sparql'));
        });

        it('should use cached data when available within cache duration', async () => {
            axios.get.mockResolvedValueOnce(mockWikidataResponse);
            await request(app).get('/getQuestion');

            jest.clearAllMocks();

            await request(app).get('/getQuestion');

            expect(axios.get).toHaveBeenCalledTimes(0);
        });

        it('should save questions to the database', async () => {
            axios.get.mockResolvedValueOnce(mockWikidataResponse);


            await request(app).get('/getQuestion');


            const questions = await Question.find({});
            expect(questions.length).toBe(4);

            const question = questions[0];
            expect(question).toHaveProperty('text');
            expect(question).toHaveProperty('answers');
            expect(question).toHaveProperty('image');
            expect(question.answers.length).toBe(4); // 1 correct + 3 incorrect

            const correctAnswers = question.answers.filter(a => a.correct);
            expect(correctAnswers.length).toBe(1);
        });

        it('should handle errors from Wikidata API', async () => {
            axios.get.mockRejectedValueOnce(new Error('API Error'));

            const response = await request(app).get('/getQuestion');

            expect(response.statusCode).toBe(500);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Failed to generate question');
        });

        it('should return 404 when no questions are found', async () => {
            jest.spyOn(Question, 'aggregate').mockResolvedValueOnce([]);

            axios.get.mockResolvedValueOnce({
                data: { results: { bindings: [] } }
            });
            const response = await request(app).get('/getQuestion');
            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('No questions found in the database');
        });
    });
});