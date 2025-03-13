const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    isCorrect: Boolean,
    text: String,
    selected: Boolean,
});

const questionSchema = new mongoose.Schema({
    text: String ,
    answers: {
        type: [answerSchema],
    } })


const matchSchema = new mongoose.Schema({
    date: { type: Date },
    questions: { type: [questionSchema] },
    time: { type: Number },
    score : { type: Number },
});


const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    matches: [matchSchema],
});

const User = mongoose.model('User', userSchema);
const Answer = mongoose.model('Answer', answerSchema);
const Match = mongoose.model('Match', matchSchema);
const Question = mongoose.model('Question',questionSchema);


module.exports = { Match, Answer, User,Question };

