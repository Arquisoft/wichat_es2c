// question-Generator.js
const { Question, Answer } = require('./wikidata-model');
const cors = require('cors');
const express = require("express");
const app = express();
app.use(cors());
const mongoose = require('mongoose');
const {fetchCapitalQuestion} = require("./wikidata-Client");
app.use(express.json());

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/userdb';
mongoose.connect(mongoUri);
async function generateQuestion() {

    try {
        await fetchCapitalQuestion();
        const question = await Question.aggregate([
            { $sample: { size: 1 } } //pregunta aleatoria
        ]);

        if (!question || question.length === 0) {
            throw new Error('No questions found in the database');
        }

        const selectedQuestion = question[0];

        const choices = selectedQuestion.answers
            .map(answer => answer.text)
            .sort(() => 0.5 - Math.random());

        const correctAnswer = selectedQuestion.answers
            .find(answer => answer.correct)?.text;

        const flagUrl = selectedQuestion.image || null;

        return {
            question: selectedQuestion.text,
            choices: choices,
            answer: correctAnswer,
            image: flagUrl
        };
    } catch (error) {
        console.error("Error generating question:", error);
        throw new Error('Failed to generate question: ' + error.message);
    }
}

module.exports = {
    generateQuestion
};