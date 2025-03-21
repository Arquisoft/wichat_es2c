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

const statisticsSchema = new mongoose.Schema({
    gamesPlayed: { type: Number},
    averageScore: { type: Number},
    bestScore: { type: Number},
    averageTime: { type: String},
    bestTime: { type: String },
    rightAnswers: { type: Number },
    wrongAnswers: { type: Number},
});


const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    matches: [matchSchema],

    //poner aqui los records y que se actualice al guardar juegos
    statistics: {
        type: statisticsSchema
    }
});

const User = mongoose.model('User', userSchema);
const Statistics = mongoose.model('Statistics', statisticsSchema);
const Answer = mongoose.model('Answer', answerSchema);
const Match = mongoose.model('Match', matchSchema);
const Question = mongoose.model('Question',questionSchema);


module.exports = { Match, Answer, Statistics, User, Question };

