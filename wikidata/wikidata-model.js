const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    correct: Boolean,
    text: String,
    selected: Boolean,
});

const questionSchema = new mongoose.Schema({
    text: String,
    answers: [answerSchema],
    image: String,
    category: String,
});

const Answer = mongoose.model('Answer', answerSchema);
const Question = mongoose.model('Question', questionSchema);

module.exports = { Answer, Question };
