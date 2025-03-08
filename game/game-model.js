const mongoose = require('mongoose');
//const { Match, Answer, User } = require('./game-model'); para usarlo luego en otras partes se añade así el esquema
const answerSchema = new mongoose.Schema({
    isCorrect: Boolean,
    text: String,
});

const matchSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    question: { type: String, required: true },
    answers: { type: [answerSchema], required: true},
    dni: { type: String, required: true },
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


module.exports = { Match, Answer, User };

// async function createMatchForUser(dni) {
//     const user = await User.findOne({ dni });
//     if (!user) {
//         console.log('User not found');
//         return;
//     }
//
//     const match = new Match({
//         question: 'What is 2+2?',
//         answers: [
//             { text: '4', isCorrect: true },
//             { text: '5', isCorrect: false },
//         ],
//         dni: user.dni,
//     });
//
//     await match.save();
// }