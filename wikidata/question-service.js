const express = require("express");
const cors = require("cors");
const {json} = require("express");
const { Question, Answer } = require('./wikidata-model');
const app = express();
app.use(cors());
const mongoose = require('mongoose');
const axios = require("axios");
app.use(express.json());
let added = false;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);
const PORT = 3005;
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
let cachedQuestions = null;
let lastCacheTime = null;

async function addQuestions() {
    const CACHE_DURATION = 1000 * 60 * 60;

    if (!cachedQuestions || (Date.now() - lastCacheTime > CACHE_DURATION)) {
        try {
            const response = await axios.get(url);
            const countries = response.data.results.bindings;

            cachedQuestions = countries.map(country => {
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

            lastCacheTime = Date.now();
            await Question.deleteMany({});
            await Question.insertMany(cachedQuestions);
        } catch (error) {
            console.error("Error fetching or saving capital questions:", error);
        }
    }

    return cachedQuestions;

}
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


const server = app.listen(PORT, () => {
    console.log(`Wikidata Service listening at http://localhost:${PORT}`);
});

server.on('close', () => {
    mongoose.connection.close();
});
