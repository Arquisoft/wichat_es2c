const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    correct: Boolean,
    text: String,
    selected: Boolean,
});

const questionSchema = new mongoose.Schema({
    text: String,
    answers: [answerSchema],
})

const matchSchema = new mongoose.Schema({
    username : String,
    date: Date,
    difficulty: Number, //1 normal 2 dificil
    score : Number,
    time: Number ,
    questions: [questionSchema]
}, { versionKey: false });

const statisticsSchema = new mongoose.Schema({
    gamesPlayed: { type: Number},
    averageScore: { type: Number},
    bestScore: { type: Number},
    averageTime: { type: Number},
    bestTime: { type: Number },
    rightAnswers: { type: Number },
    wrongAnswers: { type: Number},
});


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    statistics: {
        type: statisticsSchema
    }
}, { versionKey: false });

const User = mongoose.model('User', userSchema, 'users');
const Match = mongoose.model('Match', matchSchema, 'matches');

module.exports = { Match, User };

