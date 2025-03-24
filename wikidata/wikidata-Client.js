const axios = require('axios');
const { Question, Answer } = require('./wikidata-model');
let added = false;
const cors = require('cors');
const express = require("express");
const app = express();
app.use(cors());
const mongoose = require('mongoose');
app.use(express.json());

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);


async function fetchCapitalQuestion() {
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
    if (!added) {
        try {
            added = true;
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
            console.log('Generated and saved questions:', savedQuestions.length);
            return savedQuestions;
        } catch (error) {
            console.error("Error fetching or saving capital questions:", error);
            throw new Error('Error in capital question generation: ' + error.message);
        }
    }
}
module.exports = {
    fetchCapitalQuestion
};