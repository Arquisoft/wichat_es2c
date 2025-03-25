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
    SELECT ?countryLabel ?capitalLabel ?flag
    WHERE {
        ?country wdt:P31 wd:Q6256;  # Filter only countries
                 wdt:P36 ?capital.   # Get the capital
        OPTIONAL { ?country wdt:P41 ?flag }
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es".}
        }
        LIMIT 151
    `;

const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;


async function addQuestions() {
    app.post('/addQuestions', async (req, res) => {
        if (!added) {
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
                        text: `¿Cuál es la capital de ${country.countryLabel.value}?`,
                        answers: shuffledAnswers,
                        image: flagUrl,
                    });
                });

                await Question.deleteMany({});
                const savedQuestions = await Question.insertMany(questions);
                added = true;
                return savedQuestions;
            } catch (error) {
                console.error("Error fetching or saving capital questions:", error);
                throw new Error('Error in capital question generation: ' + error.message);
            }
        }
    });
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
